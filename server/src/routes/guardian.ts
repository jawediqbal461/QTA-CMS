import { Router } from "express";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { publishedTutorWhere } from "../lib/tutorProfile.js";
import { availableStarts } from "../lib/availableStarts.js";
import { canJoinLesson, lessonSummary, meetingWindowMessage } from "../lib/lessonAccess.js";
import { notifyBooking } from "../lib/notifications.js";
import { activeStatuses, availabilityMatcher, BOOKING_HORIZON, LESSON_MINUTES, MINUTE, SLOT_STEP } from "../lib/scheduling.js";

export const guardianRouter = Router();

guardianRouter.use(requireAuth, requireRole("GUARDIAN", "STUDENT"));

function linkedStudent(accountId: string, academyId: string, role: string): Prisma.AccountWhereInput {
  return {
    ...(role === "STUDENT" ? { id: accountId } : { studentLinks: { some: { guardianId: accountId } } }),
    memberships: { some: { academyId, role: "STUDENT", status: "ACTIVE" } },
  };
}

const studentSelect = { id: true, fullName: true } as const;

guardianRouter.get("/students", asyncHandler(async (req, res) => {
  const { accountId, academyId, role } = req.session!;
  res.json(await prisma.account.findMany({
    where: linkedStudent(accountId, academyId, role), select: studentSelect, orderBy: { fullName: "asc" },
  }));
}));

guardianRouter.post("/students", requireRole("GUARDIAN"), asyncHandler(async (req, res) => {
  const parsed = z.object({ fullName: z.string().trim().min(2).max(120) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter the learner's name." });
  const { accountId, academyId } = req.session!;
  // Guardian-managed accounts have no login credentials.
  const student = await prisma.account.create({
    data: {
      fullName: parsed.data.fullName,
      email: `${randomUUID()}@learner.invalid`, passwordHash: "!",
      memberships: { create: { academyId, role: "STUDENT" } },
      studentLinks: { create: { guardianId: accountId } },
    },
    select: studentSelect,
  });
  res.status(201).json(student);
}));

const bookingSelect = {
  id: true, tutorId: true, studentId: true, scheduledAtUtc: true, durationMinutes: true, status: true,
  student: { select: { id: true, fullName: true } },
  tutor: { select: { account: { select: { fullName: true } } } },
  ...lessonSummary,
} satisfies Prisma.BookingSelect;

guardianRouter.get("/bookings", asyncHandler(async (req, res) => {
  const { accountId, academyId, role } = req.session!;
  res.json(await prisma.booking.findMany({
    where: { academyId, student: linkedStudent(accountId, academyId, role) },
    select: bookingSelect, orderBy: { scheduledAtUtc: "asc" },
  }));
}));

guardianRouter.get("/bookings/:id/meeting", asyncHandler(async (req, res) => {
  const { accountId, academyId, role } = req.session!;
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, academyId, student: linkedStudent(accountId, academyId, role) },
    select: { status: true, scheduledAtUtc: true, durationMinutes: true, meetingUrl: true },
  });
  res.set("Cache-Control", "no-store");
  if (!booking) return res.status(404).json({ error: "Lesson not found." });
  if (!canJoinLesson(booking)) return res.status(409).json({ error: meetingWindowMessage });
  if (!booking.meetingUrl) return res.status(409).json({ error: "The tutor has not added a meeting link yet." });
  res.json({ url: booking.meetingUrl });
}));

guardianRouter.get("/bookings/:id/slots", asyncHandler(async (req, res) => {
  const { accountId, academyId, role } = req.session!;
  const booking = await prisma.booking.findFirst({
    where: {
      id: req.params.id, academyId, student: linkedStudent(accountId, academyId, role),
      status: { in: [...activeStatuses] }, scheduledAtUtc: { gt: new Date() },
    },
    select: { id: true, studentId: true, tutorId: true, durationMinutes: true, scheduledAtUtc: true },
  });
  if (!booking) return res.status(404).json({ error: "Changeable booking not found." });
  const slots = await availableStarts(academyId, booking.tutorId, booking.durationMinutes, booking);
  if (!slots) return res.status(409).json({ error: "Tutor is unavailable." });
  res.json(slots.filter((slot) => slot !== booking.scheduledAtUtc.toISOString()));
}));

class BookingError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

async function bookingWrite<T>(res: import("express").Response, write: (tx: Prisma.TransactionClient) => Promise<T>) {
  try {
    const result = await prisma.$transaction(write, { isolationLevel: "Serializable" });
    res.json(result);
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
    if ((error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2004", "P2034"].includes(error.code)) ||
      (error instanceof Error && /23P01|bookings_(?:tutor|student)_no_overlap/.test(error.message))) {
      return res.status(409).json({ error: "Booking changed or the time is taken. Refresh and try again." });
    }
    throw error;
  }
}

async function validateTime(tx: Prisma.TransactionClient, academyId: string, tutorId: string,
  studentId: string, start: Date, duration: number, bookingId?: string) {
  const time = start.getTime();
  const now = Date.now();
  if (time <= now || time > now + BOOKING_HORIZON || time % SLOT_STEP !== 0) {
    throw new BookingError(400, "Choose a future 15-minute start within the next 14 days.");
  }
  const tutor = await tx.tutorProfile.findFirst({
    where: { accountId: tutorId, ...publishedTutorWhere(academyId) },
    select: { availabilitySlots: true },
  });
  if (!tutor || !availabilityMatcher(tutor.availabilitySlots)(time, duration)) {
    throw new BookingError(409, "Tutor is no longer available at that time.");
  }
  const nearby = await tx.booking.findMany({
    where: {
      id: bookingId ? { not: bookingId } : undefined, academyId,
      status: { in: [...activeStatuses] }, OR: [{ tutorId }, { studentId }],
      scheduledAtUtc: { lt: new Date(time + duration * MINUTE) },
    },
    select: { scheduledAtUtc: true, durationMinutes: true },
  });
  if (nearby.some((booking) => booking.scheduledAtUtc.getTime() + booking.durationMinutes * MINUTE > time)) {
    throw new BookingError(409, "The tutor or learner already has a lesson during that time.");
  }
}

const createSchema = z.object({
  id: z.uuid(), studentId: z.uuid(), tutorId: z.uuid(), scheduledAtUtc: z.iso.datetime(),
});

guardianRouter.post("/bookings", asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose a learner, tutor, and time." });
  const { accountId, academyId, role } = req.session!;
  const { id, studentId, tutorId, scheduledAtUtc } = parsed.data;
  const start = new Date(scheduledAtUtc);
  await bookingWrite(res, async (tx) => {
    if (!await tx.account.findFirst({ where: { AND: [{ id: studentId }, linkedStudent(accountId, academyId, role)] } })) {
      throw new BookingError(404, "Learner not found.");
    }
    const previous = await tx.booking.findUnique({ where: { id }, select: { ...bookingSelect, academyId: true } });
    if (previous) {
      if (previous.academyId !== academyId || previous.studentId !== studentId || previous.tutorId !== tutorId ||
        previous.scheduledAtUtc.getTime() !== start.getTime()) throw new BookingError(409, "Booking reference is already in use.");
      const { academyId: _academy, ...booking } = previous;
      return booking;
    }
    await validateTime(tx, academyId, tutorId, studentId, start, LESSON_MINUTES);
    const booking = await tx.booking.create({
      data: { id, academyId, tutorId, studentId, scheduledAtUtc: start, durationMinutes: LESSON_MINUTES },
      select: bookingSelect,
    });
    await notifyBooking(tx, { ...booking, academyId }, "booked");
    return booking;
  });
}));

const changeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel"), expectedStart: z.iso.datetime() }),
  z.object({ action: z.literal("reschedule"), expectedStart: z.iso.datetime(), scheduledAtUtc: z.iso.datetime() }),
]);

guardianRouter.patch("/bookings/:id", asyncHandler(async (req, res) => {
  const parsed = changeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid booking change." });
  const change = parsed.data;
  const { accountId, academyId, role } = req.session!;
  await bookingWrite(res, async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: req.params.id, academyId, student: linkedStudent(accountId, academyId, role) },
      select: bookingSelect,
    });
    if (!booking) throw new BookingError(404, "Booking not found.");
    const current = booking.scheduledAtUtc.getTime();
    if (change.action === "cancel" && booking.status === "CANCELLED") return booking;
    if (change.action === "reschedule" && booking.status === "RESCHEDULED" &&
      current === new Date(change.scheduledAtUtc).getTime()) return booking;
    if ((booking.status !== "BOOKED" && booking.status !== "RESCHEDULED") ||
      current !== new Date(change.expectedStart).getTime() || current <= Date.now()) {
      throw new BookingError(409, "This booking can no longer be changed. Refresh your bookings.");
    }
    if (change.action === "cancel") {
      const cancelled = await tx.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED", meetingUrl: null }, select: bookingSelect });
      await notifyBooking(tx, { ...cancelled, academyId }, "cancelled");
      return cancelled;
    }
    const start = new Date(change.scheduledAtUtc);
    if (current === start.getTime()) return booking;
    await validateTime(tx, academyId, booking.tutorId, booking.studentId, start, booking.durationMinutes, booking.id);
    const moved = await tx.booking.update({
      where: { id: booking.id }, data: { scheduledAtUtc: start, status: "RESCHEDULED", meetingUrl: null }, select: bookingSelect,
    });
    await notifyBooking(tx, { ...moved, academyId }, "rescheduled");
    return moved;
  });
}));

// Learning Requests — M07

const requestSchema = z.object({
  studentId: z.uuid(),
  program: z.string().trim().min(2).max(80),
  level: z.string().trim().min(2).max(80),
  preferredLang: z.string().trim().min(2).max(60),
  budgetMax: z.number().positive().max(9999).optional(),
  notes: z.string().trim().max(1000).optional(),
});

guardianRouter.get("/requests", requireRole("GUARDIAN"), asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  res.json(await prisma.learningRequest.findMany({
    where: { guardianId: accountId, academyId },
    include: {
      student: { select: { id: true, fullName: true } },
      assignedTutor: { select: { accountId: true, account: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  }));
}));

guardianRouter.post("/requests", requireRole("GUARDIAN"), asyncHandler(async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Fill in program, level, and preferred language." });
  const { accountId, academyId } = req.session!;
  const { studentId, ...data } = parsed.data;
  const student = await prisma.account.findFirst({
    where: { id: studentId, studentLinks: { some: { guardianId: accountId } }, memberships: { some: { academyId, role: "STUDENT", status: "ACTIVE" } } },
  });
  if (!student) return res.status(404).json({ error: "Student not found." });
  const lr = await prisma.learningRequest.create({
    data: { academyId, guardianId: accountId, studentId, ...data },
    include: {
      student: { select: { id: true, fullName: true } },
      assignedTutor: { select: { accountId: true, account: { select: { fullName: true } } } },
    },
  });
  res.status(201).json(lr);
}));

guardianRouter.patch("/requests/:id/cancel", requireRole("GUARDIAN"), asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const updated = await prisma.learningRequest.updateMany({
    where: { id: req.params.id, guardianId: accountId, academyId, status: { in: ["PENDING", "MATCHED"] } },
    data: { status: "CANCELLED" },
  });
  if (!updated.count) return res.status(404).json({ error: "Active request not found." });
  res.json({ status: "CANCELLED" });
}));

// Payment history — M11
guardianRouter.get("/payments", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const payments = await prisma.pilotPayment.findMany({
    where: { payerId: accountId, academyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, amount: true, currency: true, method: true, reference: true,
      notes: true, status: true, confirmedAt: true, createdAt: true,
      booking: { select: { scheduledAtUtc: true, student: { select: { fullName: true } } } },
    },
  });
  res.json(payments);
}));

// Student progress history — M11
guardianRouter.get("/students/:studentId/progress", asyncHandler(async (req, res) => {
  const { accountId, academyId, role } = req.session!;
  // A student reads their own progress; a guardian must be linked to the student.
  const allowed = role === "STUDENT"
    ? req.params.studentId === accountId
    : !!(await prisma.guardianStudentLink.findFirst({ where: { guardianId: accountId, studentId: req.params.studentId } }));
  if (!allowed) return res.status(403).json({ error: "Not linked to this student." });
  const entries = await prisma.progressEntry.findMany({
    where: { studentId: req.params.studentId, booking: { academyId } },
    orderBy: { recordedAt: "desc" },
    take: 50,
    select: {
      id: true, recordedAt: true, currentBook: true, currentChapter: true,
      currentVerse: true, tajweedScore: true, hifzPercent: true, notes: true,
      recordedBy: { select: { fullName: true } },
      booking: { select: { scheduledAtUtc: true } },
    },
  });
  res.json(entries);
}));

// Course enrollments
const enrollmentSelect = {
  id: true, status: true, notes: true, createdAt: true,
  course: { select: { id: true, title: true, program: true, level: true, priceAmount: true, priceCurrency: true, tutor: { select: { account: { select: { fullName: true } } } } } },
  student: { select: { id: true, fullName: true } },
} as const;

guardianRouter.get("/enrollments", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  res.json(await prisma.courseEnrollment.findMany({
    where: { academyId, enrolledById: accountId },
    orderBy: { createdAt: "desc" },
    select: enrollmentSelect,
  }));
}));

const enrollSchema = z.object({ courseId: z.uuid(), studentId: z.uuid() });

guardianRouter.post("/enrollments", asyncHandler(async (req, res) => {
  const parsed = enrollSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose a course and a learner." });
  const { accountId, academyId, role } = req.session!;
  const { courseId, studentId } = parsed.data;
  const student = await prisma.account.findFirst({ where: { AND: [{ id: studentId }, linkedStudent(accountId, academyId, role)] }, select: { id: true } });
  if (!student) return res.status(404).json({ error: "Learner not found." });
  const course = await prisma.course.findFirst({ where: { id: courseId, academyId, status: "PUBLISHED" }, select: { id: true } });
  if (!course) return res.status(404).json({ error: "This course is not open for enrollment." });
  const existing = await prisma.courseEnrollment.findUnique({ where: { courseId_studentId: { courseId, studentId } } });
  if (existing && existing.status !== "CANCELLED") {
    return res.status(409).json({ error: "This learner is already enrolled in the course." });
  }
  const enrollment = existing
    ? await prisma.courseEnrollment.update({ where: { id: existing.id }, data: { status: "PENDING", enrolledById: accountId }, select: enrollmentSelect })
    : await prisma.courseEnrollment.create({ data: { academyId, courseId, studentId, enrolledById: accountId }, select: enrollmentSelect });
  res.status(201).json(enrollment);
}));

guardianRouter.patch("/enrollments/:id/cancel", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const updated = await prisma.courseEnrollment.updateMany({
    where: { id: req.params.id, academyId, enrolledById: accountId, status: { in: ["PENDING", "CONFIRMED"] } },
    data: { status: "CANCELLED" },
  });
  if (!updated.count) return res.status(404).json({ error: "Active enrollment not found." });
  res.json({ status: "CANCELLED" });
}));
