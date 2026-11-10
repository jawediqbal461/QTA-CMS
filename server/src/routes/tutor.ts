import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { tutorFields } from "../lib/tutorProfile.js";
import { availabilitySchema } from "../lib/scheduling.js";

export const tutorRouter = Router();

tutorRouter.use(requireAuth, requireRole("TUTOR"));

tutorRouter.get("/profile", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const profile = await prisma.tutorProfile.findFirst({
    where: { accountId, academyId },
    include: {
      account: { select: { fullName: true, timeZone: true } },
      availabilitySlots: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
    },
  });
  if (!profile) {
    return res.status(404).json({ error: "Tutor profile not found" });
  }
  res.json(profile);
}));

tutorRouter.put("/profile", asyncHandler(async (req, res) => {
  const parsed = tutorFields.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check your profile fields, languages, and hourly rate." });
  const { accountId, academyId } = req.session!;
  const updated = await prisma.tutorProfile.updateMany({
    where: { accountId, academyId, approvalStatus: { not: "SUSPENDED" } },
    data: { ...parsed.data, approvalStatus: "PENDING" },
  });
  if (!updated.count) return res.status(403).json({ error: "This profile cannot be submitted." });
  res.json({ approvalStatus: "PENDING" });
}));

tutorRouter.put("/availability", asyncHandler(async (req, res) => {
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid IANA timezone and weekly availability windows." });
  const { accountId, academyId } = req.session!;
  const { timeZone, slots } = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    // Lock the profile row to serialize concurrent replacements.
    const profile = await tx.tutorProfile.updateMany({
      where: { accountId, academyId, approvalStatus: { not: "SUSPENDED" } },
      data: { updatedAt: new Date() },
    });
    if (!profile.count) return false;
    await tx.account.update({ where: { id: accountId }, data: { timeZone } });
    await tx.availabilitySlot.deleteMany({ where: { tutorId: accountId } });
    await tx.availabilitySlot.createMany({
      data: slots.map((slot) => ({ ...slot, tutorId: accountId, timeZone })),
    });
    return true;
  });
  if (!updated) return res.status(403).json({ error: "Availability cannot be changed for this profile." });
  res.json({ saved: true });
}));

tutorRouter.get("/bookings", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  res.json(await prisma.booking.findMany({
    where: { tutorId: accountId, academyId },
    select: {
      id: true, scheduledAtUtc: true, status: true, durationMinutes: true,
      student: { select: { fullName: true } },
    },
    orderBy: { scheduledAtUtc: "asc" },
  }));
}));
