import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { activeStatuses, MINUTE, timeZoneSchema } from "../lib/scheduling.js";
import { tutorFields } from "../lib/tutorProfile.js";
import { notifyBooking } from "../lib/notifications.js";

export const adminRouter = Router();

// Every route below requires an authenticated Academy (or Platform) Admin,
// and every query/update below is scoped to req.session.academyId — never
// trust an id from the request alone (tenant isolation).
adminRouter.use(requireAuth, requireRole("ACADEMY_ADMIN", "PLATFORM_ADMIN"));

adminRouter.get("/operations", asyncHandler(async (req, res) => {
  const { academyId } = req.session!;
  const [missed, audit] = await Promise.all([
    prisma.booking.findMany({
      where: { academyId, status: { in: [...activeStatuses] }, scheduledAtUtc: { lt: new Date() } },
      orderBy: { scheduledAtUtc: "asc" },
      select: {
        id: true, status: true, durationMinutes: true, scheduledAtUtc: true,
        student: { select: { fullName: true } },
        tutor: { select: { account: { select: { fullName: true } } } },
      },
    }),
    prisma.auditEvent.findMany({
      where: { academyId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50,
      select: { id: true, action: true, targetType: true, targetId: true, createdAt: true,
        metadata: true, actor: { select: { fullName: true } } },
    }),
  ]);
  const now = Date.now();
  res.json({
    missed: missed.filter((booking) => booking.scheduledAtUtc.getTime() + booking.durationMinutes * MINUTE <= now).slice(0, 50),
    audit: audit.map(({ metadata, ...event }) => ({
      ...event,
      resolution: event.action === "booking.recovered" && metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? { status: metadata.to, reason: metadata.reason }
        : null,
    })),
  });
}));

const recoverySchema = z.object({
  status: z.enum(["NO_SHOW", "CANCELLED"]),
  expectedStart: z.iso.datetime(),
  reason: z.string().trim().min(5).max(500),
});

adminRouter.patch("/operations/bookings/:id", asyncHandler(async (req, res) => {
  const parsed = recoverySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose a resolution and enter a reason of 5 to 500 characters." });
  const { academyId, accountId } = req.session!;
  const { status, reason, expectedStart } = parsed.data;
  const where = { id: req.params.id, academyId };
  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where, select: { id: true, academyId: true, tutorId: true, studentId: true, status: true, scheduledAtUtc: true, durationMinutes: true },
    });
    if (!booking) return "missing";
    const start = new Date(expectedStart);
    const cutoff = new Date(Date.now() - booking.durationMinutes * MINUTE);
    const updated = await tx.booking.updateMany({
      where: { ...where, status: { in: [...activeStatuses] }, scheduledAtUtc: { equals: start, lte: cutoff } },
      data: { status, meetingUrl: null },
    });
    if (!updated.count) return "conflict";
    await notifyBooking(tx, booking, status === "NO_SHOW" ? "no-show" : "cancelled");
    await tx.auditEvent.create({
      data: {
        academyId, actorId: accountId, action: "booking.recovered", targetType: "booking",
        targetId: where.id, metadata: { from: booking.status, to: status, reason },
      },
    });
    return "saved";
  });
  if (result === "missing") return res.status(404).json({ error: "Booking not found." });
  if (result === "conflict") return res.status(409).json({ error: "The lesson changed or has not ended. Refresh the queue." });
  res.json({ status });
}));

adminRouter.get("/tutors", asyncHandler(async (req, res) => {
  res.json(await prisma.tutorProfile.findMany({
    where: { academyId: req.session!.academyId },
    include: { account: { select: { fullName: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  }));
}));

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  updatedAt: z.iso.datetime(),
});

adminRouter.patch("/tutors/:id", asyncHandler(async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid tutor review." });
  const { academyId, accountId } = req.session!;
  const { status, updatedAt } = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.tutorProfile.updateMany({
      where: { accountId: req.params.id, academyId, updatedAt: new Date(updatedAt) },
      data: { approvalStatus: status },
    });
    if (!result.count) return false;
    await tx.auditEvent.create({
      data: {
        actorId: accountId, academyId, action: "tutor.reviewed", targetType: "tutor_profile",
        targetId: req.params.id, metadata: { status },
      },
    });
    return true;
  });
  if (!updated) return res.status(409).json({ error: "Profile changed or is unavailable. Reload before reviewing." });
  res.json({ approvalStatus: status });
}));

adminRouter.get("/accounts", asyncHandler(async (req, res) => {
  const memberships = await prisma.academyMembership.findMany({
    where: { academyId: req.session!.academyId },
    include: {
      account: { select: {
        id: true, email: true, fullName: true, createdAt: true, timeZone: true,
        tutorProfile: { select: { academyId: true, approvalStatus: true, bio: true, qualifications: true, experienceYears: true, hourlyRate: true, specialties: true, languages: true } },
        studentLinks: { where: { guardian: { memberships: { some: { academyId: req.session!.academyId, role: "GUARDIAN" } } } },
          select: { guardian: { select: { id: true, fullName: true } } } },
      } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      status: m.status,
      account: {
        ...m.account,
        managedLearner: m.role === "STUDENT" && m.account.email.endsWith("@learner.invalid"),
        tutorProfile: m.account.tutorProfile?.academyId === m.academyId ? m.account.tutorProfile : null,
      },
    })),
  );
}));

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  timeZone: timeZoneSchema,
  tutorProfile: tutorFields.optional(),
});

adminRouter.patch("/accounts/:id/profile", asyncHandler(async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the name, timezone, and tutor profile fields." });
  const { academyId, accountId } = req.session!;
  const targetId = req.params.id;
  const { tutorProfile, ...details } = parsed.data;
  const outcome = await prisma.$transaction(async (tx) => {
    const membership = await tx.academyMembership.findUnique({
      where: { academyId_accountId: { academyId, accountId: targetId } },
      select: { role: true },
    });
    if (!membership || !["TUTOR", "STUDENT", "GUARDIAN"].includes(membership.role)) return "missing";
    if (tutorProfile && membership.role !== "TUTOR") return "invalid";
    const account = await tx.account.updateMany({
      where: { id: targetId, memberships: { every: { academyId } } },
      data: membership.role === "TUTOR" ? { fullName: details.fullName } : details,
    });
    if (!account.count) return "shared";
    if (tutorProfile) {
      const profile = await tx.tutorProfile.updateMany({ where: { accountId: targetId, academyId }, data: tutorProfile });
      if (!profile.count) throw new Error("Tutor account is missing its profile.");
    }
    await tx.auditEvent.create({
      data: { actorId: accountId, academyId, action: "account.profile_updated", targetType: "account", targetId },
    });
    return "saved";
  });
  if (outcome === "missing") return res.status(404).json({ error: "Manageable account not found." });
  if (outcome === "invalid") return res.status(400).json({ error: "Only tutors have teaching profiles." });
  if (outcome === "shared") return res.status(409).json({ error: "This account is shared across academies." });
  res.json({ saved: true });
}));

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
});

// This is the enforcement point for "revoked access takes effect":
// requireAuth re-checks membership status on every request, so flipping
// it here blocks that account's very next API call, not just future logins.
adminRouter.patch("/memberships/:membershipId", asyncHandler(async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { academyId, accountId, role } = req.session!;
  const where = { id: req.params.membershipId, academyId };
  const status = parsed.data.status;
  const result = await prisma.$transaction(async (tx) => {
    const membership = await tx.academyMembership.findFirst({ where });
    if (!membership) return "missing";
    if ((membership.accountId === accountId && status !== "ACTIVE") ||
        membership.role === "PLATFORM_ADMIN" ||
        (membership.role === "ACADEMY_ADMIN" && role !== "PLATFORM_ADMIN")) return "protected";
    if (membership.status === status) return "saved";
    const updated = await tx.academyMembership.updateMany({ where: { ...where, status: membership.status }, data: { status } });
    if (!updated.count) return "conflict";
    await tx.auditEvent.create({
      data: { actorId: accountId, academyId, action: "membership.status_changed",
        targetType: "academy_membership", targetId: membership.id, metadata: { from: membership.status, to: status } },
    });
    return "saved";
  });
  if (result === "missing") return res.status(404).json({ error: "Membership not found" });
  if (result === "protected") return res.status(403).json({ error: "This administrator membership is protected." });
  if (result === "conflict") return res.status(409).json({ error: "Membership changed. Refresh before trying again." });
  res.json({ membershipId: where.id, status });
}));
