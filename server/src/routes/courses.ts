import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const coursesRouter = Router();

// ─── Public catalog ──────────────────────────────────────────────────────────

const publicSelect = {
  id: true, title: true, description: true, program: true, level: true,
  language: true, format: true, durationWeeks: true, outcomes: true,
  priceAmount: true, priceCurrency: true, publishedAt: true,
  tutor: { select: { account: { select: { fullName: true } } } },
  modules: {
    where: {},
    orderBy: { position: "asc" as const },
    select: { id: true, position: true, title: true, description: true },
  },
} as const;

coursesRouter.get("/", asyncHandler(async (req, res) => {
  const { program, level, language, format } = req.query as Record<string, string | undefined>;
  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(program  ? { program }  : {}),
      ...(level    ? { level }    : {}),
      ...(language ? { language } : {}),
      ...(format   ? { format }   : {}),
    },
    orderBy: [{ program: "asc" }, { level: "asc" }, { title: "asc" }],
    select: publicSelect,
  });
  res.json(courses);
}));

coursesRouter.get("/:id", asyncHandler(async (req, res) => {
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, status: "PUBLISHED" },
    select: publicSelect,
  });
  if (!course) return res.status(404).json({ error: "Course not found." });
  res.json(course);
}));

// ─── Tutor portal (authenticated tutor only) ─────────────────────────────────

coursesRouter.use(requireAuth, requireRole("TUTOR"));

const tutorCourseSelect = {
  id: true, title: true, description: true, program: true, level: true,
  language: true, format: true, durationWeeks: true, prerequisites: true,
  outcomes: true, priceAmount: true, priceCurrency: true, status: true,
  reviewNote: true, createdAt: true, updatedAt: true,
  modules: {
    orderBy: { position: "asc" as const },
    select: { id: true, position: true, title: true, description: true },
  },
} as const;

const courseSchema = z.object({
  title:         z.string().trim().min(2).max(200),
  description:   z.string().trim().max(2000).optional(),
  program:       z.string().trim().min(1).max(80),
  level:         z.string().trim().min(1).max(80),
  language:      z.string().trim().min(1).max(60),
  format:        z.string().trim().min(1).max(60),
  durationWeeks: z.number().int().positive().optional(),
  prerequisites: z.string().trim().max(1000).optional(),
  outcomes:      z.string().trim().max(1000).optional(),
  priceAmount:   z.number().positive().multipleOf(0.01).optional(),
  priceCurrency: z.string().trim().length(3).default("USD"),
  modules: z.array(z.object({
    title:       z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).optional(),
  })).max(50).optional(),
});

coursesRouter.get("/tutor/my", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const courses = await prisma.course.findMany({
    where: { tutorId: accountId, academyId },
    orderBy: { updatedAt: "desc" },
    select: tutorCourseSelect,
  });
  res.json(courses);
}));

coursesRouter.post("/tutor/my", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { modules, ...fields } = parsed.data;

  const course = await prisma.course.create({
    data: {
      ...fields,
      academyId,
      tutorId: accountId,
      modules: modules?.length
        ? { create: modules.map((m, i) => ({ ...m, position: i + 1 })) }
        : undefined,
    },
    select: tutorCourseSelect,
  });
  res.status(201).json(course);
}));

coursesRouter.patch("/tutor/my/:id", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, tutorId: accountId, academyId },
  });
  if (!course) return res.status(404).json({ error: "Course not found." });
  if (!["DRAFT", "CHANGES_REQUESTED"].includes(course.status)) {
    return res.status(409).json({ error: "Only DRAFT or CHANGES_REQUESTED courses can be edited." });
  }

  const parsed = courseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { modules, ...fields } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (modules !== undefined) {
      await tx.courseModule.deleteMany({ where: { courseId: course.id } });
      if (modules.length) {
        await tx.courseModule.createMany({
          data: modules.map((m, i) => ({ ...m, courseId: course.id, position: i + 1 })),
        });
      }
    }
    return tx.course.update({
      where: { id: course.id },
      data: fields,
      select: tutorCourseSelect,
    });
  });
  res.json(updated);
}));

coursesRouter.post("/tutor/my/:id/submit", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, tutorId: accountId, academyId },
  });
  if (!course) return res.status(404).json({ error: "Course not found." });
  if (!["DRAFT", "CHANGES_REQUESTED"].includes(course.status)) {
    return res.status(409).json({ error: "Course is not in a submittable state." });
  }
  const updated = await prisma.course.update({
    where: { id: course.id },
    data: { status: "PENDING_REVIEW", reviewNote: null },
    select: tutorCourseSelect,
  });
  res.json(updated);
}));

coursesRouter.delete("/tutor/my/:id", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, tutorId: accountId, academyId },
  });
  if (!course) return res.status(404).json({ error: "Course not found." });
  if (course.status === "PUBLISHED") {
    return res.status(409).json({ error: "Published courses cannot be deleted — unpublish first." });
  }
  await prisma.course.delete({ where: { id: course.id } });
  res.json({ deleted: true });
}));
