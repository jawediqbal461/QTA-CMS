import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { recordAudit } from "../lib/audit.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { activeStatuses, MINUTE } from "../lib/scheduling.js";

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
      where, select: { status: true, scheduledAtUtc: true, durationMinutes: true },
    });
    if (!booking) return "missing";
    const start = new Date(expectedStart);
    const cutoff = new Date(Date.now() - booking.durationMinutes * MINUTE);
    const updated = await tx.booking.updateMany({
      where: { ...where, status: { in: [...activeStatuses] }, scheduledAtUtc: { equals: start, lte: cutoff } },
      data: { status, meetingUrl: null },
    });
    if (!updated.count) return "conflict";
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
      account: { select: { id: true, email: true, fullName: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      status: m.status,
      account: m.account,
    })),
  );
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

  const membership = await prisma.academyMembership.findUnique({
    where: { id: req.params.membershipId },
  });
  if (!membership || membership.academyId !== req.session!.academyId) {
    return res.status(404).json({ error: "Membership not found" });
  }
  if (membership.accountId === req.session!.accountId && parsed.data.status !== "ACTIVE") {
    return res.status(400).json({ error: "You cannot revoke your own access" });
  }

  const updated = await prisma.academyMembership.update({
    where: { id: membership.id },
    data: { status: parsed.data.status },
  });

  await recordAudit({
    actorId: req.session!.accountId,
    academyId: req.session!.academyId,
    action: "membership.status_changed",
    targetType: "academy_membership",
    targetId: membership.id,
    metadata: { from: membership.status, to: parsed.data.status },
  });

  res.json({ membershipId: updated.id, status: updated.status });
}));
