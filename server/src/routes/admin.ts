import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { activeStatuses, MINUTE, timeZoneSchema } from "../lib/scheduling.js";
import { tutorFields } from "../lib/tutorProfile.js";
import { notifyBooking, notifyPayment } from "../lib/notifications.js";

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

// Learning Requests — M07

adminRouter.get("/requests", asyncHandler(async (req, res) => {
  const { academyId } = req.session!;
  res.json(await prisma.learningRequest.findMany({
    where: { academyId },
    include: {
      guardian: { select: { id: true, fullName: true, email: true } },
      student: { select: { id: true, fullName: true } },
      assignedTutor: { select: { accountId: true, account: { select: { fullName: true } } } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  }));
}));

const assignSchema = z.object({ tutorId: z.uuid().nullable() });

// Resources — M08

const resourceSchema = z.object({
  title:       z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).optional(),
  program:     z.string().trim().min(1).max(80),
  level:       z.string().trim().min(1).max(80),
  language:    z.string().trim().min(1).max(60),
  format:      z.string().trim().min(1).max(60),
  url:         z.url({ protocol: /^https?$/ }).max(2000),
  accessLevel: z.enum(["PUBLIC", "ENROLLED"]).default("PUBLIC"),
  published:   z.boolean().default(false),
  authorName:  z.string().trim().max(120).optional(),
});

adminRouter.get("/resources", asyncHandler(async (req, res) => {
  const { program, level, language, format } = req.query;
  res.json(await prisma.resource.findMany({
    where: {
      ...(program  ? { program:  String(program) }  : {}),
      ...(level    ? { level:    String(level) }    : {}),
      ...(language ? { language: String(language) } : {}),
      ...(format   ? { format:   String(format) }   : {}),
    },
    orderBy: [{ published: "desc" }, { program: "asc" }, { title: "asc" }],
    select: { id: true, title: true, description: true, program: true, level: true, language: true, format: true, url: true, accessLevel: true, published: true, authorName: true, createdAt: true, updatedAt: true },
  }));
}));

adminRouter.post("/resources", asyncHandler(async (req, res) => {
  const parsed = resourceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the resource fields." });
  const { accountId } = req.session!;
  const resource = await prisma.resource.create({ data: { ...parsed.data, createdById: accountId } });
  res.status(201).json(resource);
}));

adminRouter.patch("/resources/:id", asyncHandler(async (req, res) => {
  const parsed = resourceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the resource fields." });
  const resource = await prisma.resource.updateMany({ where: { id: req.params.id }, data: parsed.data });
  if (!resource.count) return res.status(404).json({ error: "Resource not found." });
  res.json({ saved: true });
}));

adminRouter.delete("/resources/:id", asyncHandler(async (req, res) => {
  const deleted = await prisma.resource.deleteMany({ where: { id: req.params.id } });
  if (!deleted.count) return res.status(404).json({ error: "Resource not found." });
  res.json({ deleted: true });
}));

adminRouter.patch("/requests/:id/assign", asyncHandler(async (req, res) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid tutor ID or null to unassign." });
  const { academyId, accountId } = req.session!;
  const { tutorId } = parsed.data;
  const outcome = await prisma.$transaction(async (tx) => {
    const lr = await tx.learningRequest.findFirst({
      where: { id: req.params.id, academyId, status: { in: ["PENDING", "MATCHED", "DECLINED"] } },
    });
    if (!lr) return "missing";
    if (tutorId) {
      const tutor = await tx.tutorProfile.findFirst({ where: { accountId: tutorId, academyId, approvalStatus: "APPROVED" } });
      if (!tutor) return "no_tutor";
    }
    await tx.learningRequest.update({
      where: { id: req.params.id },
      data: {
        assignedTutorId: tutorId,
        assignedAt: tutorId ? new Date() : null,
        assignedById: tutorId ? accountId : null,
        status: tutorId ? "MATCHED" : "PENDING",
        ...(tutorId ? { tutorResponse: null, respondedAt: null } : {}),
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId: accountId, academyId,
        action: tutorId ? "request.assigned" : "request.unassigned",
        targetType: "learning_request", targetId: req.params.id,
        metadata: tutorId ? { tutorId } : undefined,
      },
    });
    return "saved";
  });
  if (outcome === "missing") return res.status(404).json({ error: "Open request not found." });
  if (outcome === "no_tutor") return res.status(404).json({ error: "Approved tutor not found." });
  res.json({ saved: true });
}));

// Pilot Payments — M09
const paymentSchema = z.object({
  bookingId:  z.string().uuid().optional(),
  payerId:    z.string().uuid(),
  amount:     z.number().positive().multipleOf(0.01),
  currency:   z.string().trim().length(3).default("USD"),
  method:     z.string().trim().min(1).max(60),
  reference:  z.string().trim().max(120).optional(),
  notes:      z.string().trim().max(1000).optional(),
});

const paymentSelect = {
  id: true, bookingId: true, payerId: true, amount: true, currency: true,
  method: true, reference: true, notes: true, status: true,
  confirmedAt: true, confirmedById: true, createdAt: true, updatedAt: true,
  payer: { select: { fullName: true, email: true } },
  confirmedBy: { select: { fullName: true } },
  booking: { select: { scheduledAtUtc: true, student: { select: { fullName: true } } } },
} as const;

adminRouter.get("/payments", asyncHandler(async (req, res) => {
  const { academyId } = req.session!;
  const payments = await prisma.pilotPayment.findMany({
    where: { academyId },
    orderBy: { createdAt: "desc" },
    select: paymentSelect,
  });
  res.json(payments);
}));

adminRouter.post("/payments", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { bookingId, payerId, amount, currency, method, reference, notes } = parsed.data;

  if (bookingId) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, academyId } });
    if (!booking) return res.status(404).json({ error: "Booking not found in this academy." });
  }
  const payer = await prisma.account.findUnique({ where: { id: payerId } });
  if (!payer) return res.status(404).json({ error: "Payer account not found." });

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.pilotPayment.create({
      data: { academyId, bookingId, payerId, amount, currency, method, reference, notes },
      select: paymentSelect,
    });
    await tx.auditEvent.create({
      data: {
        actorId: accountId, academyId,
        action: "payment.created",
        targetType: "pilot_payment", targetId: p.id,
        metadata: { amount: amount.toString(), method },
      },
    });
    return p;
  });
  res.status(201).json(payment);
}));

adminRouter.patch("/payments/:id/confirm", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const payment = await prisma.pilotPayment.findFirst({
    where: { id: req.params.id, academyId },
  });
  if (!payment) return res.status(404).json({ error: "Payment not found." });
  if (payment.status !== "PENDING") return res.status(409).json({ error: "Only PENDING payments can be confirmed." });

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.pilotPayment.update({
      where: { id: req.params.id },
      data: { status: "CONFIRMED", confirmedAt: new Date(), confirmedById: accountId },
      select: paymentSelect,
    });
    await tx.auditEvent.create({
      data: {
        actorId: accountId, academyId,
        action: "payment.confirmed",
        targetType: "pilot_payment", targetId: p.id,
      },
    });
    await notifyPayment(tx, academyId, p.payerId, p.amount.toString(), p.currency, "confirmed");
    return p;
  });
  res.json(updated);
}));

adminRouter.patch("/payments/:id/refund", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const payment = await prisma.pilotPayment.findFirst({
    where: { id: req.params.id, academyId },
  });
  if (!payment) return res.status(404).json({ error: "Payment not found." });
  if (payment.status === "REFUNDED") return res.status(409).json({ error: "Payment is already refunded." });

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.pilotPayment.update({
      where: { id: req.params.id },
      data: { status: "REFUNDED" },
      select: paymentSelect,
    });
    await tx.auditEvent.create({
      data: {
        actorId: accountId, academyId,
        action: "payment.refunded",
        targetType: "pilot_payment", targetId: p.id,
      },
    });
    await notifyPayment(tx, academyId, p.payerId, p.amount.toString(), p.currency, "refunded");
    return p;
  });
  res.json(updated);
}));

// Course Approval Queue — M10
const adminCourseSelect = {
  id: true, tutorId: true, title: true, description: true, program: true, level: true,
  language: true, format: true, durationWeeks: true, prerequisites: true, outcomes: true,
  priceAmount: true, priceCurrency: true, status: true, reviewNote: true,
  publishedAt: true, createdAt: true, updatedAt: true,
  tutor: { select: { account: { select: { fullName: true, email: true } } } },
  reviewedBy: { select: { fullName: true } },
  modules: {
    orderBy: { position: "asc" as const },
    select: { id: true, position: true, title: true, description: true },
  },
} as const;

adminRouter.get("/courses", asyncHandler(async (req, res) => {
  const { academyId } = req.session!;
  const { status } = req.query as { status?: string };
  const courses = await prisma.course.findMany({
    where: {
      academyId,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: adminCourseSelect,
  });
  res.json(courses);
}));

adminRouter.patch("/courses/:id/approve", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const course = await prisma.course.findFirst({ where: { id: req.params.id, academyId } });
  if (!course) return res.status(404).json({ error: "Course not found." });
  if (course.status !== "PENDING_REVIEW") {
    return res.status(409).json({ error: "Only PENDING_REVIEW courses can be approved." });
  }
  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.course.update({
      where: { id: req.params.id },
      data: { status: "PUBLISHED", reviewNote: null, reviewedById: accountId, publishedAt: new Date() },
      select: adminCourseSelect,
    });
    await tx.auditEvent.create({
      data: {
        actorId: accountId, academyId,
        action: "course.approved",
        targetType: "course", targetId: c.id,
      },
    });
    return c;
  });
  res.json(updated);
}));

adminRouter.patch("/courses/:id/request-changes", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const { note } = req.body as { note?: string };
  if (!note?.trim()) return res.status(400).json({ error: "A reviewer note is required." });
  const course = await prisma.course.findFirst({ where: { id: req.params.id, academyId } });
  if (!course) return res.status(404).json({ error: "Course not found." });
  if (course.status !== "PENDING_REVIEW") {
    return res.status(409).json({ error: "Only PENDING_REVIEW courses can have changes requested." });
  }
  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.course.update({
      where: { id: req.params.id },
      data: { status: "CHANGES_REQUESTED", reviewNote: note.trim(), reviewedById: accountId },
      select: adminCourseSelect,
    });
    await tx.auditEvent.create({
      data: {
        actorId: accountId, academyId,
        action: "course.changes_requested",
        targetType: "course", targetId: c.id,
        metadata: { note: note.trim() },
      },
    });
    return c;
  });
  res.json(updated);
}));

adminRouter.patch("/courses/:id/unpublish", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const course = await prisma.course.findFirst({ where: { id: req.params.id, academyId } });
  if (!course) return res.status(404).json({ error: "Course not found." });
  if (course.status !== "PUBLISHED") {
    return res.status(409).json({ error: "Only PUBLISHED courses can be unpublished." });
  }
  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.course.update({
      where: { id: req.params.id },
      data: { status: "UNPUBLISHED" },
      select: adminCourseSelect,
    });
    await tx.auditEvent.create({
      data: {
        actorId: accountId, academyId,
        action: "course.unpublished",
        targetType: "course", targetId: c.id,
      },
    });
    return c;
  });
  res.json(updated);
}));

// Analytics dashboard — M12
adminRouter.get("/analytics", asyncHandler(async (req, res) => {
  const { academyId } = req.session!;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    bookingCounts,
    memberCounts,
    paymentGroups,
    upcomingCount,
    recentBookings,
    pendingCourses,
    publishedCourses,
    pendingRequests,
    dailyBookings,
  ] = await Promise.all([
    prisma.booking.groupBy({
      by: ["status"],
      where: { academyId },
      _count: { _all: true },
    }),
    prisma.academyMembership.groupBy({
      by: ["role"],
      where: { academyId, status: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.pilotPayment.groupBy({
      by: ["status"],
      where: { academyId },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: { academyId, status: { in: ["BOOKED", "RESCHEDULED"] }, scheduledAtUtc: { gt: now } },
    }),
    prisma.booking.findMany({
      where: { academyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, status: true, scheduledAtUtc: true, createdAt: true,
        student: { select: { fullName: true } },
        tutor: { select: { account: { select: { fullName: true } } } },
      },
    }),
    prisma.course.count({ where: { academyId, status: "PENDING_REVIEW" } }),
    prisma.course.count({ where: { academyId, status: "PUBLISHED" } }),
    prisma.learningRequest.count({ where: { academyId, status: "PENDING" } }),
    prisma.booking.findMany({
      where: { academyId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Aggregate bookings per day for the sparkline
  const bookingsByDay: Record<string, number> = {};
  for (const b of dailyBookings) {
    const day = b.createdAt.toISOString().slice(0, 10);
    bookingsByDay[day] = (bookingsByDay[day] ?? 0) + 1;
  }
  const sparkline = Object.entries(bookingsByDay).map(([date, count]) => ({ date, count }));

  res.json({
    bookings: Object.fromEntries(bookingCounts.map((g) => [g.status, g._count._all])),
    upcomingBookings: upcomingCount,
    members: Object.fromEntries(memberCounts.map((g) => [g.role, g._count._all])),
    payments: paymentGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
      total: g._sum.amount?.toString() ?? "0",
    })),
    pendingCourses,
    publishedCourses,
    pendingRequests,
    recentBookings,
    sparkline,
  });
}));

// Overview dashboard — M25
adminRouter.get("/overview", asyncHandler(async (req, res) => {
  const { academyId } = req.session!;
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [bookings, memberCounts, learningRequests, activeCurriculums] = await Promise.all([
    prisma.booking.findMany({
      where: { academyId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.academyMembership.groupBy({
      by: ["role"],
      where: { academyId, status: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.learningRequest.groupBy({
      by: ["program"],
      where: { academyId },
      _count: { _all: true },
    }),
    prisma.curriculum.count({ where: { academyId } }),
  ]);

  const monthlyMap: Record<string, number> = {};
  for (const b of bookings) {
    const key = b.createdAt.toISOString().slice(0, 7);
    monthlyMap[key] = (monthlyMap[key] ?? 0) + 1;
  }
  const monthlyBookings: { month: string; yearMonth: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const yearMonth = d.toISOString().slice(0, 7);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    monthlyBookings.push({ month, yearMonth, count: monthlyMap[yearMonth] ?? 0 });
  }

  const membersObj = Object.fromEntries(memberCounts.map((m) => [m.role, m._count._all]));
  res.json({
    monthlyBookings,
    programDistribution: learningRequests.map((lr) => ({ program: lr.program, count: lr._count._all })),
    counts: {
      tutors: membersObj["TUTOR"] ?? 0,
      students: membersObj["STUDENT"] ?? 0,
      guardians: membersObj["GUARDIAN"] ?? 0,
      totalMembers: memberCounts.reduce((s, m) => s + m._count._all, 0),
      activeCurriculums,
    },
  });
}));

// Curriculum CRUD — M25
adminRouter.get("/curriculum", asyncHandler(async (req, res) => {
  const { academyId } = req.session!;
  res.json(await prisma.curriculum.findMany({ where: { academyId }, orderBy: { createdAt: "desc" } }));
}));

const curriculumCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  program: z.string().trim().min(1).max(80),
  level: z.string().trim().min(1).max(80),
});

adminRouter.post("/curriculum", asyncHandler(async (req, res) => {
  const parsed = curriculumCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Title, program and level are required." });
  const { academyId, accountId } = req.session!;
  const curr = await prisma.curriculum.create({ data: { academyId, createdById: accountId, ...parsed.data } });
  res.status(201).json(curr);
}));

adminRouter.delete("/curriculum/:id", asyncHandler(async (req, res) => {
  const { academyId } = req.session!;
  const result = await prisma.curriculum.deleteMany({ where: { id: req.params.id, academyId } });
  if (!result.count) return res.status(404).json({ error: "Curriculum not found." });
  res.json({ deleted: true });
}));

// Tutor bio update — M25
const bioUpdateSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
});

adminRouter.patch("/tutors/:id/bio", asyncHandler(async (req, res) => {
  const parsed = bioUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid bio data." });
  const { academyId } = req.session!;
  const result = await prisma.tutorProfile.updateMany({ where: { accountId: req.params.id, academyId }, data: parsed.data });
  if (!result.count) return res.status(404).json({ error: "Tutor not found." });
  res.json({ saved: true });
}));

// Course enrollments
const adminEnrollmentSelect = {
  id: true, status: true, notes: true, createdAt: true, updatedAt: true,
  course: { select: { id: true, title: true, program: true, level: true, priceAmount: true, priceCurrency: true,
    tutor: { select: { account: { select: { fullName: true } } } } } },
  student: { select: { id: true, fullName: true } },
  enrolledBy: { select: { id: true, fullName: true, email: true } },
} as const;

adminRouter.get("/enrollments", asyncHandler(async (req, res) => {
  res.json(await prisma.courseEnrollment.findMany({
    where: { academyId: req.session!.academyId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 300,
    select: adminEnrollmentSelect,
  }));
}));

adminRouter.patch("/enrollments/:id", asyncHandler(async (req, res) => {
  const parsed = z.object({ status: z.enum(["CONFIRMED", "CANCELLED"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose confirm or cancel." });
  const { academyId, accountId } = req.session!;
  const outcome = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.courseEnrollment.findFirst({
      where: { id: req.params.id, academyId }, select: { id: true, enrolledById: true, course: { select: { title: true } } },
    });
    if (!enrollment) return null;
    const saved = await tx.courseEnrollment.update({ where: { id: enrollment.id }, data: { status: parsed.data.status }, select: adminEnrollmentSelect });
    await tx.portalNotification.create({
      data: {
        accountId: enrollment.enrolledById, academyId, kind: "ENROLLMENT",
        title: `Course enrollment ${parsed.data.status === "CONFIRMED" ? "confirmed" : "cancelled"}`,
        message: `Your enrollment in "${enrollment.course.title}" was ${parsed.data.status === "CONFIRMED" ? "confirmed" : "cancelled"} by the academy.`,
      },
    });
    await tx.auditEvent.create({
      data: { actorId: accountId, academyId, action: `enrollment.${parsed.data.status.toLowerCase()}`, targetType: "course_enrollment", targetId: enrollment.id },
    });
    return saved;
  });
  if (!outcome) return res.status(404).json({ error: "Enrollment not found." });
  res.json(outcome);
}));
