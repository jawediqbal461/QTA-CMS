import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { recordAudit } from "../lib/audit.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminRouter = Router();

// Every route below requires an authenticated Academy (or Platform) Admin,
// and every query/update below is scoped to req.session.academyId — never
// trust an id from the request alone (tenant isolation).
adminRouter.use(requireAuth, requireRole("ACADEMY_ADMIN", "PLATFORM_ADMIN"));

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
