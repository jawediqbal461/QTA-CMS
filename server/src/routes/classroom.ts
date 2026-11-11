import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { prisma } from "../lib/prisma.js";

export const classroomRouter = Router();

// GET /api/classroom/demo — public, returns the active demo room
classroomRouter.get("/demo", asyncHandler(async (_req, res) => {
  const room = await prisma.demoRoom.findFirst({ where: { isActive: true } });
  if (!room) return res.status(404).json({ error: "No active demo room." });
  res.json(room);
}));

// GET /api/classroom/:bookingId — authenticated, returns booking info for classroom
classroomRouter.get("/:bookingId", requireAuth, asyncHandler(async (req, res) => {
  const { accountId, role } = req.session!;
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      scheduledAtUtc: true,
      durationMinutes: true,
      status: true,
      tutor: { select: { accountId: true, account: { select: { fullName: true } } } },
      student: { select: { id: true, fullName: true } },
    },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found." });

  // Only tutor or student of this booking may access
  const isTutor = booking.tutor.accountId === accountId;
  const isStudent = booking.student.id === accountId;
  if (!isTutor && !isStudent && role !== "ACADEMY_ADMIN") {
    return res.status(403).json({ error: "Access denied." });
  }

  res.json({
    ...booking,
    myRole: isTutor ? "TUTOR" : "STUDENT",
    tutorName: booking.tutor.account.fullName,
    studentName: booking.student.fullName,
  });
}));

// Admin demo room management
const demoRoomBody = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  roomSlug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  isActive: z.boolean().optional(),
});

// GET /api/admin/demo-rooms
classroomRouter.get("/admin/list", requireAuth, requireRole("ACADEMY_ADMIN"), asyncHandler(async (_req, res) => {
  const rooms = await prisma.demoRoom.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rooms);
}));

// POST /api/admin/demo-rooms
classroomRouter.post("/admin", requireAuth, requireRole("ACADEMY_ADMIN"), asyncHandler(async (req, res) => {
  const parsed = demoRoomBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input.", details: parsed.error.flatten() });

  const { isActive, ...rest } = parsed.data;

  // If making active, deactivate all others
  if (isActive) await prisma.demoRoom.updateMany({ data: { isActive: false } });

  const room = await prisma.demoRoom.create({ data: { ...rest, isActive: isActive ?? false } });
  res.status(201).json(room);
}));

// PATCH /api/admin/demo-rooms/:id
classroomRouter.patch("/admin/:id", requireAuth, requireRole("ACADEMY_ADMIN"), asyncHandler(async (req, res) => {
  const parsed = demoRoomBody.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });

  const { isActive, ...rest } = parsed.data;

  if (isActive) await prisma.demoRoom.updateMany({ data: { isActive: false } });

  const room = await prisma.demoRoom.update({
    where: { id: req.params.id },
    data: { ...rest, ...(isActive !== undefined ? { isActive } : {}) },
  });
  res.json(room);
}));

// DELETE /api/admin/demo-rooms/:id
classroomRouter.delete("/admin/:id", requireAuth, requireRole("ACADEMY_ADMIN"), asyncHandler(async (req, res) => {
  await prisma.demoRoom.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));
