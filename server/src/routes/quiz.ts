import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const quizRouter = Router();

const quizResultBody = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().email().max(200).optional(),
  score: z.number().int().min(0).max(100),
  maxScore: z.number().int().min(1).max(100),
  answers: z.record(z.string(), z.number()).optional(),
});

// POST /api/quiz — save a quiz result (public, no auth needed)
quizRouter.post("/", rateLimit({ windowMs: 60 * 60_000, max: 20, message: "Too many quiz submissions. Try again later." }), asyncHandler(async (req, res) => {
  const parsed = quizResultBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });

  const result = await prisma.tajweedQuizResult.create({
    data: {
      name: parsed.data.name ?? null,
      email: parsed.data.email ?? null,
      score: parsed.data.score,
      maxScore: parsed.data.maxScore,
      answers: parsed.data.answers ?? {},
    },
  });
  res.status(201).json(result);
}));

// GET /api/quiz/admin — admin view of all results
quizRouter.get("/admin", requireAuth, requireRole("ACADEMY_ADMIN"), asyncHandler(async (_req, res) => {
  const results = await prisma.tajweedQuizResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(results);
}));
