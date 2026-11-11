import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { publicTutorSelect, publishedTutorWhere } from "../lib/tutorProfile.js";
import { LESSON_MINUTES } from "../lib/scheduling.js";
import { availableStarts } from "../lib/availableStarts.js";

export const directoryRouter = Router();

directoryRouter.get("/", asyncHandler(async (_req, res) => {
  const academy = await prisma.academy.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  res.json(academy ? await prisma.tutorProfile.findMany({
    where: publishedTutorWhere(academy.id),
    select: publicTutorSelect,
    orderBy: { account: { fullName: "asc" } },
  }) : []);
}));

directoryRouter.get("/:id", asyncHandler(async (req, res) => {
  const academy = await prisma.academy.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  if (!academy) return res.status(404).json({ error: "Not found." });
  const tutor = await prisma.tutorProfile.findFirst({
    where: { accountId: req.params.id, ...publishedTutorWhere(academy.id) },
    select: {
      accountId: true, specialties: true, experienceYears: true, bio: true,
      qualifications: true, hourlyRate: true, languages: true,
      account: { select: { fullName: true } },
      availabilitySlots: { select: { weekday: true, startTime: true, endTime: true, timeZone: true } },
      _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      reviews: {
        orderBy: { createdAt: "desc" }, take: 20,
        select: { id: true, rating: true, comment: true, createdAt: true,
          author: { select: { fullName: true } } },
      },
    },
  });
  if (!tutor) return res.status(404).json({ error: "Tutor not found." });
  const avg = tutor.reviews.length
    ? tutor.reviews.reduce((s, r) => s + r.rating, 0) / tutor.reviews.length : null;
  res.json({ ...tutor, avgRating: avg ? parseFloat(avg.toFixed(1)) : null });
}));

directoryRouter.get("/:id/slots", asyncHandler(async (req, res) => {
  const academy = await prisma.academy.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  const slots = academy && await availableStarts(academy.id, req.params.id, LESSON_MINUTES);
  if (!slots) return res.status(404).json({ error: "Tutor is unavailable." });
  res.json(slots);
}));
