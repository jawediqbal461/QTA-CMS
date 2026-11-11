import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signSession } from "../lib/jwt.js";
import { recordAudit } from "../lib/audit.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { tutorFields } from "../lib/tutorProfile.js";
import { queueVerification, validVerification } from "../lib/verification.js";
import { mailConfig } from "../lib/notifications.js";
import { timeZoneSchema } from "../lib/scheduling.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;
const loginLimit = rateLimit({
  windowMs: 15 * 60_000, max: 10, message: "Too many sign-in attempts. Try again in a few minutes.",
  key: (req) => `${req.ip}:${String(req.body?.email ?? "").toLowerCase()}`,
});
const registerLimit = rateLimit({ windowMs: 60 * 60_000, max: 10, message: "Too many registrations from this address. Try again later." });
const verifyLimit = rateLimit({ windowMs: 60 * 60_000, max: 30 });
const emailUnavailable = "Email verification is temporarily unavailable. Please try again later or contact the academy.";
const registrationPassword = z.string().min(10).refine((value) => Buffer.byteLength(value, "utf8") <= 72);

// One-time setup: creates the first academy and its admin account.
// Protected by SETUP_TOKEN (set in .env, rotate/remove after first use)
// rather than by auth, since no account exists yet at this point.
const bootstrapSchema = z.object({
  setupToken: z.string(),
  academyName: z.string().min(2),
  academySlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(10),
  adminFullName: z.string().min(2),
});

authRouter.post("/bootstrap-academy", asyncHandler(async (req, res) => {
  const setupToken = process.env.SETUP_TOKEN;
  if (!setupToken) {
    return res.status(503).json({ error: "Bootstrap is disabled (SETUP_TOKEN not set)" });
  }

  const parsed = bootstrapSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  if (data.setupToken !== setupToken) {
    return res.status(401).json({ error: "Invalid setup token" });
  }

  const existingAcademy = await prisma.academy.findUnique({ where: { slug: data.academySlug } });
  if (existingAcademy) {
    return res.status(409).json({ error: "Academy slug already exists" });
  }
  const existingAccount = await prisma.account.findUnique({ where: { email: data.adminEmail } });
  if (existingAccount) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(data.adminPassword, BCRYPT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const academy = await tx.academy.create({
      data: { name: data.academyName, slug: data.academySlug },
    });
    const account = await tx.account.create({
      data: {
        email: data.adminEmail,
        passwordHash,
        fullName: data.adminFullName,
      },
    });
    await tx.academyMembership.create({
      data: {
        academyId: academy.id,
        accountId: account.id,
        role: "ACADEMY_ADMIN",
      },
    });
    return { academy, account };
  });

  await recordAudit({
    actorId: result.account.id,
    academyId: result.academy.id,
    action: "academy.bootstrap",
    targetType: "academy",
    targetId: result.academy.id,
  });

  const token = signSession({
    accountId: result.account.id,
    academyId: result.academy.id,
    role: "ACADEMY_ADMIN",
  });

  res.status(201).json({ token, academy: result.academy });
}));

// Single-academy MVP: every self-registration joins the one seeded
// academy. Revisit once Phase 3 (multi-academy SaaS) needs a real
// academy-selection step.
async function getDefaultAcademy() {
  return prisma.academy.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
}

const registerGuardianSchema = z.object({
  email: z.string().trim().email().max(254),
  password: registrationPassword,
  fullName: z.string().trim().min(2).max(120),
  adult: z.boolean().optional(),
  timeZone: timeZoneSchema.optional(),
});

authRouter.post("/register/:role(guardian|student)", registerLimit, asyncHandler(async (req, res) => {
  if (!mailConfig()) return res.status(503).json({ error: emailUnavailable });
  const role = req.params.role === "student" ? "STUDENT" : "GUARDIAN";
  const parsed = registerGuardianSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid name, email, and password of at least 10 characters and at most 72 bytes." });
  }
  if (role === "STUDENT" && parsed.data.adult !== true) {
    return res.status(400).json({ error: "Adult learners can register directly. For a minor, create a guardian account." });
  }
  const { email, password, fullName, timeZone } = parsed.data;

  const academy = await getDefaultAcademy();
  if (!academy) {
    return res.status(503).json({ error: "No academy is configured yet" });
  }
  const existing = await prisma.account.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const account = await prisma.$transaction(async (tx) => {
    const acc = await tx.account.create({
      data: { email: email.toLowerCase(), passwordHash, fullName, ...(timeZone ? { timeZone } : {}) },
    });
    await tx.academyMembership.create({
      data: { academyId: academy.id, accountId: acc.id, role },
    });
    await queueVerification(tx, acc.id, academy.id);
    return acc;
  });

  await recordAudit({
    actorId: account.id,
    academyId: academy.id,
    action: `auth.register.${role.toLowerCase()}`,
    targetType: "account",
    targetId: account.id,
  });

  res.status(201).json({ verificationRequired: true });
}));

const registerTutorSchema = tutorFields.extend({
  email: z.string().trim().email().max(254),
  password: registrationPassword,
  fullName: z.string().trim().min(2).max(120),
  timeZone: timeZoneSchema.optional(),
});

authRouter.post("/register/tutor", registerLimit, asyncHandler(async (req, res) => {
  if (!mailConfig()) return res.status(503).json({ error: emailUnavailable });
  const parsed = registerTutorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Check your email, name, profile fields, and password. Passwords must be at least 10 characters and at most 72 bytes." });
  }
  const data = parsed.data;

  const academy = await getDefaultAcademy();
  if (!academy) {
    return res.status(503).json({ error: "No academy is configured yet" });
  }
  const existing = await prisma.account.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const account = await prisma.$transaction(async (tx) => {
    const acc = await tx.account.create({
      data: { email: data.email.toLowerCase(), passwordHash, fullName: data.fullName, ...(data.timeZone ? { timeZone: data.timeZone } : {}) },
    });
    await tx.academyMembership.create({
      data: { academyId: academy.id, accountId: acc.id, role: "TUTOR" },
    });
    await tx.tutorProfile.create({
      data: {
        accountId: acc.id,
        academyId: academy.id,
        specialties: data.specialties,
        experienceYears: data.experienceYears,
        bio: data.bio,
        qualifications: data.qualifications,
        hourlyRate: data.hourlyRate,
        languages: data.languages,
        approvalStatus: "PENDING",
      },
    });
    await queueVerification(tx, acc.id, academy.id);
    return acc;
  });

  await recordAudit({
    actorId: account.id,
    academyId: academy.id,
    action: "auth.register.tutor",
    targetType: "account",
    targetId: account.id,
  });

  res.status(201).json({ verificationRequired: true });
}));

authRouter.post("/verify-email", verifyLimit, asyncHandler(async (req, res) => {
  const parsed = z.object({ token: z.string().max(150).regex(/^[a-f0-9-]+\.\d+\.[a-f0-9]{64}$/) }).safeParse(req.body);
  const invalid = () => res.status(400).json({ error: "This verification link is invalid or expired. Attempt to sign in to request a new one." });
  if (!parsed.success) return invalid();
  const account = await prisma.account.findUnique({
    where: { id: parsed.data.token.split(".")[0] },
    select: { id: true, email: true },
  });
  if (!account || !validVerification(parsed.data.token, account.id, account.email)) return invalid();
  await prisma.$transaction(async (tx) => {
    await tx.account.updateMany({ where: { id: account.id, email: account.email, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
    await tx.portalNotification.updateMany({
      where: { accountId: account.id, kind: "VERIFY_EMAIL", emailedAt: null },
      data: { cancelledAt: new Date() },
    });
  });
  res.json({ verified: true });
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", loginLimit, asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const account = await prisma.account.findUnique({
    where: { email: email.toLowerCase() },
    include: { memberships: { include: { academy: true } } },
  });

  // Constant-shape response whether the account exists or not, to avoid
  // leaking which emails are registered.
  const passwordHash = account?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const passwordOk = await bcrypt.compare(password, passwordHash);

  if (!account || !passwordOk) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const membership = account.memberships.find((m) => m.status === "ACTIVE");
  if (!membership) {
    return res.status(403).json({ error: "No active academy membership" });
  }
  if (!account.emailVerifiedAt && membership.role !== "PLATFORM_ADMIN" && membership.role !== "ACADEMY_ADMIN") {
    if (!mailConfig()) return res.status(503).json({ error: emailUnavailable });
    await queueVerification(prisma, account.id, membership.academyId);
    return res.status(403).json({ error: "Verify your email before signing in. A verification link has been queued if one was not requested recently." });
  }

  const token = signSession({
    accountId: account.id,
    academyId: membership.academyId,
    role: membership.role,
  });

  await recordAudit({
    actorId: account.id,
    academyId: membership.academyId,
    action: "auth.login",
    targetType: "account",
    targetId: account.id,
  });

  res.json({
    token,
    account: {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      role: membership.role,
      academy: { id: membership.academy.id, name: membership.academy.name, slug: membership.academy.slug },
    },
  });
}));

const MAX_AVATAR_CHARS = 200_000;

function profileResponse(account: {
  id: string; email: string; fullName: string; timeZone: string; phone: string | null; country: string | null;
  city: string | null; address: string | null; avatar: string | null;
}, session: { role: string; academyId: string }) {
  return {
    id: account.id, email: account.email, fullName: account.fullName, timeZone: account.timeZone,
    phone: account.phone, country: account.country, city: account.city, address: account.address,
    avatar: account.avatar, role: session.role, academyId: session.academyId,
  };
}

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.session!.accountId } });
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  res.json(profileResponse(account, req.session!));
}));

const optionalLine = (max: number) => z.string().trim().max(max).optional();

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  timeZone: z.string().trim().max(100).optional(),
  phone: optionalLine(40),
  country: optionalLine(80),
  city: optionalLine(80),
  address: optionalLine(300),
});

authRouter.patch("/me", requireAuth, asyncHandler(async (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Check the profile fields." });
  const { fullName, timeZone, phone, country, city, address } = parsed.data;
  if (timeZone !== undefined && !timeZoneSchema.safeParse(timeZone).success) {
    return res.status(400).json({ error: "Choose a time zone from the list, for example Asia/Karachi. Formats like UTC+05:00 are not accepted." });
  }
  const { accountId, role, academyId } = req.session!;
  const updated = await prisma.$transaction(async (tx) => {
    const previous = role === "TUTOR" ? await tx.account.findUnique({ where: { id: accountId }, select: { fullName: true } }) : null;
    const account = await tx.account.updateMany({
      where: { id: accountId, memberships: { every: { academyId } } },
      data: {
        fullName,
        ...(timeZone !== undefined ? { timeZone } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(country !== undefined ? { country: country || null } : {}),
        ...(city !== undefined ? { city: city || null } : {}),
        ...(address !== undefined ? { address: address || null } : {}),
      },
    });
    if (account.count && previous && previous.fullName !== fullName) {
      await tx.tutorProfile.updateMany({
        where: { accountId, academyId, approvalStatus: "APPROVED" },
        data: { approvalStatus: "PENDING" },
      });
    }
    return account.count;
  });
  if (!updated) return res.status(409).json({ error: "Contact the academy to update this shared account." });
  res.json({ saved: true });
}));

const avatarSchema = z.object({
  image: z.string().max(MAX_AVATAR_CHARS).regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
});

authRouter.put("/me/avatar", requireAuth, asyncHandler(async (req, res) => {
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose a PNG, JPEG or WebP image under 150 KB." });
  await prisma.account.update({ where: { id: req.session!.accountId }, data: { avatar: parsed.data.image } });
  res.json({ saved: true });
}));

authRouter.delete("/me/avatar", requireAuth, asyncHandler(async (req, res) => {
  await prisma.account.update({ where: { id: req.session!.accountId }, data: { avatar: null } });
  res.json({ removed: true });
}));

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: registrationPassword,
});

authRouter.patch("/password", requireAuth, loginLimit, asyncHandler(async (req, res) => {
  const parsed = passwordChangeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter your current password and a new one of at least 10 characters (at most 72 bytes)." });
  const { accountId, academyId } = req.session!;
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || !(await bcrypt.compare(parsed.data.currentPassword, account.passwordHash))) {
    return res.status(403).json({ error: "Your current password is not correct." });
  }
  await prisma.account.update({ where: { id: accountId }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS) } });
  await recordAudit({ actorId: accountId, academyId, action: "auth.password_changed", targetType: "account", targetId: accountId });
  res.json({ saved: true });
}));

const emailChangeSchema = z.object({
  newEmail: z.string().trim().email().max(254),
  password: z.string().min(1),
});

// The new address must be verified before the next sign-in, so a typo cannot silently lock in a wrong email.
authRouter.patch("/email", requireAuth, loginLimit, asyncHandler(async (req, res) => {
  if (!mailConfig()) return res.status(503).json({ error: emailUnavailable });
  const parsed = emailChangeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid new email address and your current password." });
  const { accountId, academyId, role } = req.session!;
  if (role === "ACADEMY_ADMIN" || role === "PLATFORM_ADMIN") {
    return res.status(403).json({ error: "Administrator emails are managed by the platform owner." });
  }
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || !(await bcrypt.compare(parsed.data.password, account.passwordHash))) {
    return res.status(403).json({ error: "Your current password is not correct." });
  }
  const newEmail = parsed.data.newEmail.toLowerCase();
  if (newEmail === account.email) return res.status(400).json({ error: "That is already your email address." });
  if (await prisma.account.findUnique({ where: { email: newEmail } })) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }
  await prisma.$transaction(async (tx) => {
    await tx.account.update({ where: { id: accountId }, data: { email: newEmail, emailVerifiedAt: null } });
    await queueVerification(tx, accountId, academyId);
  });
  await recordAudit({ actorId: accountId, academyId, action: "auth.email_changed", targetType: "account", targetId: accountId });
  res.json({ verificationRequired: true });
}));
