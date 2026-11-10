import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const guardianRouter = Router();

guardianRouter.use(requireAuth, requireRole("GUARDIAN"));

// Returns this guardian's linked students. Empty today — creating the
// links themselves is Phase 1 backlog item M03, not this one. This
// endpoint exists now purely to prove the GUARDIAN-only permission
// boundary works end to end.
guardianRouter.get("/students", asyncHandler(async (req, res) => {
  const links = await prisma.guardianStudentLink.findMany({
    where: { guardianId: req.session!.accountId },
    include: { student: { select: { id: true, email: true, fullName: true } } },
  });
  res.json(links.map((l) => l.student));
}));
