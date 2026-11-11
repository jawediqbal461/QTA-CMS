import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { recordAudit } from "../lib/audit.js";
import { activeStatuses, MINUTE } from "../lib/scheduling.js";

export const liveClassesRouter = Router();

const DAY = 24 * 60 * MINUTE;

const sessionSelect = { id: true, startsAt: true, durationMinutes: true, status: true } as const;
const classSelect = {
  id: true, title: true, description: true, program: true, level: true, language: true, seats: true,
  durationMinutes: true, status: true, reviewNote: true, createdAt: true,
  tutor: { select: { accountId: true, account: { select: { fullName: true } } } },
  _count: { select: { members: { where: { status: "ACTIVE" } } } },
} as const;

function learnerWhere(accountId: string, role: string): Prisma.AccountWhereInput {
  return role === "STUDENT" ? { id: accountId } : { studentLinks: { some: { guardianId: accountId } } };
}

// ─── Public catalogue ────────────────────────────────────────────────────────

liveClassesRouter.get("/", asyncHandler(async (_req, res) => {
  const academy = await prisma.academy.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  if (!academy) return res.json([]);
  const classes = await prisma.liveClass.findMany({
    where: { academyId: academy.id, status: "PUBLISHED", sessions: { some: { status: "SCHEDULED", startsAt: { gt: new Date() } } } },
    orderBy: { createdAt: "desc" }, take: 60,
    select: {
      ...classSelect,
      sessions: { where: { status: "SCHEDULED", startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 6, select: sessionSelect },
    },
  });
  res.json(classes.map(({ _count, ...liveClass }) => ({ ...liveClass, seatsLeft: Math.max(0, liveClass.seats - _count.members) })));
}));

liveClassesRouter.use(requireAuth);

// ─── Schedule feed (calendar) ────────────────────────────────────────────────

liveClassesRouter.get("/schedule", asyncHandler(async (req, res) => {
  const { academyId, accountId, role } = req.session!;
  const from = new Date(Date.now() - 30 * MINUTE);
  const until = new Date(Date.now() + 60 * DAY);
  const where: Prisma.LiveClassSessionWhereInput = {
    status: "SCHEDULED", startsAt: { gte: from, lte: until },
    liveClass: {
      academyId, status: "PUBLISHED",
      ...(role === "TUTOR" ? { tutorId: accountId }
        : { members: { some: { status: "ACTIVE", student: learnerWhere(accountId, role) } } }),
    },
  };
  const sessions = await prisma.liveClassSession.findMany({
    where, orderBy: { startsAt: "asc" }, take: 200,
    select: { ...sessionSelect, liveClass: { select: { id: true, title: true, tutor: { select: { account: { select: { fullName: true } } } } } } },
  });
  res.json(sessions.map((session) => ({
    kind: "class", sessionId: session.id, classId: session.liveClass.id, title: session.liveClass.title,
    tutorName: session.liveClass.tutor.account.fullName, startsAt: session.startsAt,
    durationMinutes: session.durationMinutes, status: session.status,
  })));
}));

// ─── Tutor ───────────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  program: z.string().trim().min(1).max(80),
  level: z.string().trim().min(1).max(80),
  language: z.string().trim().min(1).max(60),
  seats: z.number().int().min(2).max(30),
  durationMinutes: z.number().int().min(20).max(120),
  startsAt: z.iso.datetime(),
  weeks: z.number().int().min(1).max(26),
});

async function tutorConflicts(tutorId: string, starts: Date[], durationMinutes: number, ignoreClassId?: string) {
  const first = Math.min(...starts.map((date) => date.getTime()));
  const last = Math.max(...starts.map((date) => date.getTime())) + durationMinutes * MINUTE;
  const [bookings, sessions] = await Promise.all([
    prisma.booking.findMany({
      where: { tutorId, status: { in: [...activeStatuses] }, scheduledAtUtc: { gte: new Date(first - 3 * 60 * MINUTE), lt: new Date(last) } },
      select: { scheduledAtUtc: true, durationMinutes: true },
    }),
    prisma.liveClassSession.findMany({
      where: {
        status: "SCHEDULED", startsAt: { gte: new Date(first - 3 * 60 * MINUTE), lt: new Date(last) },
        liveClass: { tutorId, status: { not: "CANCELLED" }, ...(ignoreClassId ? { id: { not: ignoreClassId } } : {}) },
      },
      select: { startsAt: true, durationMinutes: true },
    }),
  ]);
  const busy = [
    ...bookings.map((entry) => [entry.scheduledAtUtc.getTime(), entry.scheduledAtUtc.getTime() + entry.durationMinutes * MINUTE]),
    ...sessions.map((entry) => [entry.startsAt.getTime(), entry.startsAt.getTime() + entry.durationMinutes * MINUTE]),
  ];
  return starts.filter((start) => busy.some(([from, to]) => start.getTime() < to && start.getTime() + durationMinutes * MINUTE > from));
}

liveClassesRouter.get("/mine", requireRole("TUTOR"), asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const classes = await prisma.liveClass.findMany({
    where: { academyId, tutorId: accountId }, orderBy: { createdAt: "desc" }, take: 100,
    select: {
      ...classSelect,
      sessions: { orderBy: { startsAt: "asc" }, select: sessionSelect },
      members: { where: { status: "ACTIVE" }, select: { student: { select: { id: true, fullName: true } } } },
    },
  });
  res.json(classes.map(({ _count, ...liveClass }) => ({ ...liveClass, seatsLeft: Math.max(0, liveClass.seats - _count.members) })));
}));

liveClassesRouter.post("/", requireRole("TUTOR"), asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the title, seats (2–30), length, start time, and number of weeks." });
  const { academyId, accountId } = req.session!;
  const { startsAt, weeks, ...fields } = parsed.data;
  const first = new Date(startsAt);
  if (first.getTime() < Date.now() + 30 * MINUTE) return res.status(400).json({ error: "Choose a start time at least 30 minutes from now." });
  const approved = await prisma.tutorProfile.findFirst({ where: { accountId, academyId, approvalStatus: "APPROVED" }, select: { accountId: true } });
  if (!approved) return res.status(403).json({ error: "Only approved tutors can create group classes." });
  const starts = Array.from({ length: weeks }, (_, index) => new Date(first.getTime() + index * 7 * DAY));
  const clashes = await tutorConflicts(accountId, starts, fields.durationMinutes);
  if (clashes.length) {
    return res.status(409).json({ error: `You already have a lesson at ${clashes.length} of these times (first: ${clashes[0].toISOString()}). Pick another time.` });
  }
  const created = await prisma.liveClass.create({
    data: {
      academyId, tutorId: accountId, ...fields, description: fields.description || null,
      sessions: { create: starts.map((start) => ({ startsAt: start, durationMinutes: fields.durationMinutes })) },
    },
    select: { ...classSelect, sessions: { orderBy: { startsAt: "asc" }, select: sessionSelect } },
  });
  await recordAudit({ actorId: accountId, academyId, action: "live_class.created", targetType: "live_class", targetId: created.id });
  const { _count, ...liveClass } = created;
  res.status(201).json({ ...liveClass, seatsLeft: liveClass.seats - _count.members, members: [] });
}));

liveClassesRouter.patch("/:id/cancel", requireRole("TUTOR"), asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const existing = await prisma.liveClass.findFirst({ where: { id: req.params.id, academyId, tutorId: accountId, status: { not: "CANCELLED" } } });
  if (!existing) return res.status(404).json({ error: "Class not found." });
  await prisma.$transaction([
    prisma.liveClass.update({ where: { id: existing.id }, data: { status: "CANCELLED" } }),
    prisma.liveClassSession.updateMany({ where: { classId: existing.id, status: "SCHEDULED", startsAt: { gt: new Date() } }, data: { status: "CANCELLED" } }),
  ]);
  res.json({ status: "CANCELLED" });
}));

liveClassesRouter.patch("/:id/sessions/:sessionId/cancel", requireRole("TUTOR"), asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const updated = await prisma.liveClassSession.updateMany({
    where: { id: req.params.sessionId, classId: req.params.id, status: "SCHEDULED", startsAt: { gt: new Date() }, liveClass: { academyId, tutorId: accountId } },
    data: { status: "CANCELLED" },
  });
  if (!updated.count) return res.status(404).json({ error: "Upcoming session not found." });
  res.json({ status: "CANCELLED" });
}));

// ─── Students and guardians ──────────────────────────────────────────────────

liveClassesRouter.get("/my", requireRole("GUARDIAN", "STUDENT"), asyncHandler(async (req, res) => {
  const { academyId, accountId, role } = req.session!;
  const memberships = await prisma.liveClassMember.findMany({
    where: { status: "ACTIVE", student: learnerWhere(accountId, role), liveClass: { academyId } },
    orderBy: { createdAt: "desc" },
    select: {
      student: { select: { id: true, fullName: true } },
      liveClass: {
        select: {
          ...classSelect,
          sessions: { where: { status: "SCHEDULED", startsAt: { gt: new Date(Date.now() - 60 * MINUTE) } }, orderBy: { startsAt: "asc" }, take: 8, select: sessionSelect },
        },
      },
    },
  });
  res.json(memberships.map(({ student, liveClass: { _count, ...liveClass } }) => ({ ...liveClass, student, seatsLeft: Math.max(0, liveClass.seats - _count.members) })));
}));

liveClassesRouter.post("/:id/join", requireRole("GUARDIAN", "STUDENT"), asyncHandler(async (req, res) => {
  const parsed = z.object({ studentId: z.uuid() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose a learner." });
  const { academyId, accountId, role } = req.session!;
  const { studentId } = parsed.data;
  const student = await prisma.account.findFirst({
    where: { AND: [{ id: studentId }, learnerWhere(accountId, role)], memberships: { some: { academyId, role: "STUDENT", status: "ACTIVE" } } },
    select: { id: true },
  });
  if (!student) return res.status(404).json({ error: "Learner not found." });
  const liveClass = await prisma.liveClass.findFirst({
    where: { id: req.params.id, academyId, status: "PUBLISHED", sessions: { some: { status: "SCHEDULED", startsAt: { gt: new Date() } } } },
    select: { id: true, seats: true },
  });
  if (!liveClass) return res.status(404).json({ error: "This class is not open for enrollment." });
  const outcome = await prisma.$transaction(async (tx) => {
    const taken = await tx.liveClassMember.count({ where: { classId: liveClass.id, status: "ACTIVE" } });
    const existing = await tx.liveClassMember.findUnique({ where: { classId_studentId: { classId: liveClass.id, studentId } } });
    if (existing?.status === "ACTIVE") return "already";
    if (taken >= liveClass.seats) return "full";
    if (existing) await tx.liveClassMember.update({ where: { id: existing.id }, data: { status: "ACTIVE", enrolledById: accountId } });
    else await tx.liveClassMember.create({ data: { classId: liveClass.id, studentId, enrolledById: accountId } });
    return "joined";
  }, { isolationLevel: "Serializable" });
  if (outcome === "already") return res.status(409).json({ error: "This learner is already in the class." });
  if (outcome === "full") return res.status(409).json({ error: "This class is full." });
  res.status(201).json({ joined: true });
}));

liveClassesRouter.delete("/:id/members/:studentId", requireRole("GUARDIAN", "STUDENT"), asyncHandler(async (req, res) => {
  const { academyId, accountId, role } = req.session!;
  const updated = await prisma.liveClassMember.updateMany({
    where: {
      classId: req.params.id, studentId: req.params.studentId, status: "ACTIVE",
      liveClass: { academyId }, student: learnerWhere(accountId, role),
    },
    data: { status: "CANCELLED" },
  });
  if (!updated.count) return res.status(404).json({ error: "Enrollment not found." });
  res.json({ left: true });
}));

// ─── Admin ───────────────────────────────────────────────────────────────────

const adminOnly = requireRole("ACADEMY_ADMIN", "PLATFORM_ADMIN");

liveClassesRouter.get("/admin/all", adminOnly, asyncHandler(async (req, res) => {
  const classes = await prisma.liveClass.findMany({
    where: { academyId: req.session!.academyId }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200,
    select: {
      ...classSelect,
      sessions: { orderBy: { startsAt: "asc" }, select: sessionSelect },
      members: { where: { status: "ACTIVE" }, select: { student: { select: { id: true, fullName: true } } } },
    },
  });
  res.json(classes.map(({ _count, ...liveClass }) => ({ ...liveClass, seatsLeft: Math.max(0, liveClass.seats - _count.members) })));
}));

liveClassesRouter.patch("/admin/:id", adminOnly, asyncHandler(async (req, res) => {
  const parsed = z.object({
    status: z.enum(["PUBLISHED", "PENDING", "CANCELLED"]),
    reviewNote: z.string().trim().max(500).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose a valid status." });
  const { academyId, accountId } = req.session!;
  const existing = await prisma.liveClass.findFirst({ where: { id: req.params.id, academyId } });
  if (!existing) return res.status(404).json({ error: "Class not found." });
  await prisma.$transaction([
    prisma.liveClass.update({ where: { id: existing.id }, data: { status: parsed.data.status, reviewNote: parsed.data.reviewNote || null } }),
    ...(parsed.data.status === "CANCELLED"
      ? [prisma.liveClassSession.updateMany({ where: { classId: existing.id, status: "SCHEDULED", startsAt: { gt: new Date() } }, data: { status: "CANCELLED" } })]
      : []),
    prisma.portalNotification.create({
      data: {
        accountId: existing.tutorId, academyId, kind: "LIVE_CLASS",
        title: `Group class ${parsed.data.status === "PUBLISHED" ? "approved" : parsed.data.status === "CANCELLED" ? "cancelled" : "returned to review"}`,
        message: `"${existing.title}" was ${parsed.data.status === "PUBLISHED" ? "approved and is now open for enrollment" : parsed.data.status === "CANCELLED" ? "cancelled by the academy" : "returned to review"}.${parsed.data.reviewNote ? ` Note: ${parsed.data.reviewNote}` : ""}`,
      },
    }),
  ]);
  await recordAudit({ actorId: accountId, academyId, action: `live_class.${parsed.data.status.toLowerCase()}`, targetType: "live_class", targetId: existing.id });
  res.json({ status: parsed.data.status });
}));
