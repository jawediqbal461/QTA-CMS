import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const tutorRouter = Router();

tutorRouter.use(requireAuth, requireRole("TUTOR"));

tutorRouter.get("/profile", asyncHandler(async (req, res) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { accountId: req.session!.accountId },
    include: { account: { select: { id: true, email: true, fullName: true } } },
  });
  if (!profile) {
    return res.status(404).json({ error: "Tutor profile not found" });
  }
  res.json(profile);
}));
