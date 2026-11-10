import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { tutorFields } from "../lib/tutorProfile.js";
import { activeStatuses, availabilitySchema, MINUTE } from "../lib/scheduling.js";
import { canJoinLesson, lessonSummary, meetingWindowMessage } from "../lib/lessonAccess.js";

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
      ...lessonSummary,
    },
    orderBy: { scheduledAtUtc: "asc" },
  }));
}));

const meetingSchema = z.object({
  expectedStart: z.iso.datetime(),
  url: z.url({ protocol: /^https$/ }).max(2000).refine((value) => {
    const url = new URL(value);
    return !!url.hostname && !url.username && !url.password;
  }),
});

tutorRouter.put("/bookings/:id/meeting", asyncHandler(async (req, res) => {
  const parsed = meetingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid HTTPS meeting link." });
  const { accountId, academyId } = req.session!;
  const start = new Date(parsed.data.expectedStart);
  const where = { id: req.params.id, academyId, tutorId: accountId };
  const booking = await prisma.booking.findFirst({ where, select: { durationMinutes: true } });
  if (!booking) return res.status(404).json({ error: "Lesson not found." });
  const updated = await prisma.booking.updateMany({
    where: {
      ...where, status: { in: [...activeStatuses] },
      scheduledAtUtc: { equals: start, gt: new Date(Date.now() - (booking.durationMinutes + 15) * MINUTE) },
    },
    data: { meetingUrl: new URL(parsed.data.url).href },
  });
  if (!updated.count) return res.status(409).json({ error: "This lesson is unavailable or its time changed." });
  res.json({ saved: true });
}));

tutorRouter.get("/bookings/:id/meeting", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, academyId, tutorId: accountId },
    select: { status: true, scheduledAtUtc: true, durationMinutes: true, meetingUrl: true },
  });
  res.set("Cache-Control", "no-store");
  if (!booking) return res.status(404).json({ error: "Lesson not found." });
  if (!canJoinLesson(booking)) return res.status(409).json({ error: meetingWindowMessage });
  if (!booking.meetingUrl) return res.status(409).json({ error: "A meeting link has not been added yet." });
  res.json({ url: booking.meetingUrl });
}));

const outcomeSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("COMPLETED"),
    expectedStart: z.iso.datetime(),
    notes: z.string().trim().max(2000),
    progress: z.object({
      currentBook: z.string().trim().min(1).max(120),
      currentChapter: z.string().trim().min(1).max(120),
      currentVerse: z.number().int().min(1).max(286).optional(),
      tajweedScore: z.number().int().min(0).max(100).optional(),
      hifzPercent: z.number().min(0).max(100).multipleOf(0.01).optional(),
    }),
  }),
  z.object({ status: z.literal("NO_SHOW"), expectedStart: z.iso.datetime(), notes: z.string().trim().max(2000) }),
]);

tutorRouter.post("/bookings/:id/outcome", asyncHandler(async (req, res) => {
  const parsed = outcomeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the attendance, notes, and progress fields." });
  const { accountId, academyId } = req.session!;
  const outcome = parsed.data;
  const expectedStart = new Date(outcome.expectedStart);
  const where = { id: req.params.id, academyId, tutorId: accountId };
  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({ where, select: { studentId: true, durationMinutes: true } });
    if (!booking) return "missing";
    const now = new Date();
    const cutoff = outcome.status === "NO_SHOW" ? new Date(now.getTime() - booking.durationMinutes * MINUTE) : now;
    const updated = await tx.booking.updateMany({
      where: { ...where, status: { in: [...activeStatuses] }, scheduledAtUtc: { equals: expectedStart, lte: cutoff } },
      data: { status: outcome.status, meetingUrl: null },
    });
    if (!updated.count) {
      const saved = await tx.booking.findFirst({ where, select: { status: true, scheduledAtUtc: true, lessonSession: { select: { endedAt: true } } } });
      return saved?.status === outcome.status && saved.scheduledAtUtc.getTime() === expectedStart.getTime() &&
        saved.lessonSession?.endedAt ? "saved" : "conflict";
    }
    await tx.lessonSession.upsert({
      where: { bookingId: where.id },
      create: { bookingId: where.id, endedAt: now, tutorNotes: outcome.notes },
      update: { endedAt: now, tutorNotes: outcome.notes },
    });
    if (outcome.status === "COMPLETED") {
      await tx.progressEntry.create({
        data: { bookingId: where.id, studentId: booking.studentId, recordedById: accountId, ...outcome.progress },
      });
    }
    return "saved";
  });
  if (result === "missing") return res.status(404).json({ error: "Lesson not found." });
  if (result === "conflict") return res.status(409).json({ error: "The lesson changed, is already closed, or is too early to record this outcome." });
  res.json({ status: outcome.status });
}));
