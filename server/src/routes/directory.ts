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

directoryRouter.get("/:id/slots", asyncHandler(async (req, res) => {
  const academy = await prisma.academy.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  const slots = academy && await availableStarts(academy.id, req.params.id, LESSON_MINUTES);
  if (!slots) return res.status(404).json({ error: "Tutor is unavailable." });
  res.json(slots);
}));
