import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { prisma } from "../lib/prisma.js";

export const reviewsRouter = Router({ mergeParams: true });

const reviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

// POST /api/tutors/:tutorId/reviews — student or guardian submits a review
reviewsRouter.post("/", requireAuth, asyncHandler(async (req, res) => {
  const { accountId, role } = req.session!;
  if (role !== "STUDENT" && role !== "GUARDIAN") {
    return res.status(403).json({ error: "Only students or guardians may leave reviews." });
  }
  const parsed = reviewBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });

  const { academyId } = req.session!;
  const tutorId = req.params.tutorId;
  const completed = await prisma.booking.findFirst({
    where: {
      academyId, tutorId, status: "COMPLETED",
      student: role === "STUDENT" ? { id: accountId } : { studentLinks: { some: { guardianId: accountId } } },
    },
    select: { id: true },
  });
  if (!completed) {
    return res.status(403).json({ error: "You can review a tutor after completing a lesson with them." });
  }
  const review = await prisma.tutorReview.upsert({
    where: { tutorId_authorId: { tutorId, authorId: accountId } },
    create: { tutorId, authorId: accountId, rating: parsed.data.rating, comment: parsed.data.comment },
    update: { rating: parsed.data.rating, comment: parsed.data.comment },
    select: { id: true, rating: true, comment: true, createdAt: true,
      author: { select: { fullName: true } } },
  });
  res.json(review);
}));
