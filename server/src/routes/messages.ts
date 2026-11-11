import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { prisma } from "../lib/prisma.js";

export const messagesRouter = Router();
messagesRouter.use(requireAuth);

// GET /api/messages?with=<accountId> — conversation with a specific user
messagesRouter.get("/", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const otherId = z.string().uuid().safeParse(req.query.with);
  if (!otherId.success) return res.status(400).json({ error: "Missing ?with=<uuid>" });

  const messages = await prisma.message.findMany({
    where: {
      academyId,
      OR: [
        { fromId: accountId, toId: otherId.data },
        { fromId: otherId.data, toId: accountId },
      ],
    },
    orderBy: { createdAt: "asc" }, take: 100,
    select: { id: true, fromId: true, toId: true, body: true, readAt: true, createdAt: true },
  });

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: { academyId, fromId: otherId.data, toId: accountId, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({ messages, myId: accountId });
}));

// GET /api/messages/threads — list of conversations (most recent message per person)
messagesRouter.get("/threads", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;

  const sent = await prisma.message.groupBy({
    by: ["toId"], where: { academyId, fromId: accountId },
    _max: { createdAt: true },
  });
  const received = await prisma.message.groupBy({
    by: ["fromId"], where: { academyId, toId: accountId },
    _max: { createdAt: true },
  });

  const peerIds = [...new Set([
    ...sent.map(r => r.toId),
    ...received.map(r => r.fromId),
  ])];

  const peers = await prisma.account.findMany({
    where: { id: { in: peerIds } },
    select: { id: true, fullName: true },
  });

  const unreadCounts = await prisma.message.groupBy({
    by: ["fromId"], where: { academyId, toId: accountId, readAt: null },
    _count: { id: true },
  });
  const unreadMap = Object.fromEntries(unreadCounts.map(r => [r.fromId, r._count.id]));

  // Fetch the most recent message per peer for the lastMessage preview
  const lastMessages = await Promise.all(peerIds.map(peerId =>
    prisma.message.findFirst({
      where: { academyId, OR: [{ fromId: accountId, toId: peerId }, { fromId: peerId, toId: accountId }] },
      orderBy: { createdAt: "desc" },
      select: { body: true, createdAt: true },
    })
  ));

  res.json(peers.map((p, i) => ({
    with: { id: p.id, fullName: p.fullName },
    lastMessage: lastMessages[i]?.body ?? "",
    lastAt: lastMessages[i]?.createdAt ?? new Date(0),
    unread: unreadMap[p.id] ?? 0,
  })));
}));

const msgBody = z.object({
  toId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

// POST /api/messages — send a message
messagesRouter.post("/", asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const parsed = msgBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });

  const { toId, body } = parsed.data;
  const msg = await prisma.message.create({
    data: { academyId, fromId: accountId, toId, body },
    select: { id: true, fromId: true, toId: true, body: true, readAt: true, createdAt: true },
  });
  res.status(201).json(msg);
}));
