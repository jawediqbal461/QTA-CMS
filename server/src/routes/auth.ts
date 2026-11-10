import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signSession } from "../lib/jwt.js";
import { recordAudit } from "../lib/audit.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;

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

authRouter.post("/bootstrap-academy", async (req, res) => {
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
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
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
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.session!.accountId } });
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  res.json({
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: req.session!.role,
    academyId: req.session!.academyId,
  });
});
