import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { prisma } from "../lib/prisma.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  res.json(await prisma.portalNotification.findMany({
    where: { academyId, accountId, kind: { not: "VERIFY_EMAIL" }, visibleAt: { lte: new Date() }, cancelledAt: null },
    select: { id: true, title: true, message: true, visibleAt: true, readAt: true },
    orderBy: [{ visibleAt: "desc" }, { id: "desc" }], take: 50,
  }));
}));

notificationsRouter.patch("/read", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const now = new Date();
  await prisma.portalNotification.updateMany({
    where: { academyId, accountId, kind: { not: "VERIFY_EMAIL" }, visibleAt: { lte: now }, cancelledAt: null, readAt: null },
    data: { readAt: now },
  });
  res.json({ saved: true });
}));
