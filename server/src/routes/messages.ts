import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { rateLimit } from "../middleware/rateLimit.js";

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
messagesRouter.post("/", rateLimit({
  windowMs: 60_000, max: 30, message: "You are sending messages too quickly.",
  key: (req) => req.session?.accountId ?? req.ip ?? "unknown",
}), asyncHandler(async (req, res) => {
  const { accountId, academyId } = req.session!;
  const parsed = msgBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });

  const { toId, body } = parsed.data;
  if (toId === accountId) return res.status(400).json({ error: "You cannot message yourself." });
  const recipient = await prisma.academyMembership.findUnique({
    where: { academyId_accountId: { academyId, accountId: toId } },
    select: { status: true },
  });
  if (recipient?.status !== "ACTIVE") return res.status(404).json({ error: "Recipient not found." });
  const msg = await prisma.message.create({
    data: { academyId, fromId: accountId, toId, body },
    select: { id: true, fromId: true, toId: true, body: true, readAt: true, createdAt: true },
  });
  res.status(201).json(msg);
}));

// GET /api/messages/contacts — people this account can start a conversation with
messagesRouter.get("/contacts", asyncHandler(async (req, res) => {
  const { accountId, academyId, role } = req.session!;
  const ids = new Set<string>();
  const isStaff = role === "ACADEMY_ADMIN" || role === "PLATFORM_ADMIN";
  if (isStaff) {
    const members = await prisma.academyMembership.findMany({
      where: { academyId, status: "ACTIVE", role: { in: ["TUTOR", "GUARDIAN", "STUDENT"] } },
      select: { accountId: true }, take: 500,
    });
    for (const member of members) ids.add(member.accountId);
  } else {
    // Everyone can write to the academy team.
    const admins = await prisma.academyMembership.findMany({
      where: { academyId, status: "ACTIVE", role: "ACADEMY_ADMIN" }, select: { accountId: true },
    });
    for (const admin of admins) ids.add(admin.accountId);
  }
  if (role === "TUTOR") {
    const [bookings, requests] = await Promise.all([
      prisma.booking.findMany({
        where: { academyId, tutorId: accountId },
        select: { student: { select: { id: true, studentLinks: { select: { guardianId: true } } } } },
      }),
      prisma.learningRequest.findMany({
        where: { academyId, assignedTutorId: accountId, status: { in: ["MATCHED", "ACCEPTED"] } },
        select: { guardianId: true, studentId: true },
      }),
    ]);
    for (const { student } of bookings) {
      ids.add(student.id);
      for (const link of student.studentLinks) ids.add(link.guardianId);
    }
    for (const request of requests) { ids.add(request.guardianId); ids.add(request.studentId); }
  } else if (role === "GUARDIAN" || role === "STUDENT") {
    const learner = role === "STUDENT" ? { id: accountId } : { studentLinks: { some: { guardianId: accountId } } };
    const [bookings, requests] = await Promise.all([
      prisma.booking.findMany({ where: { academyId, student: learner }, select: { tutorId: true } }),
      role === "GUARDIAN"
        ? prisma.learningRequest.findMany({ where: { academyId, guardianId: accountId, assignedTutorId: { not: null } }, select: { assignedTutorId: true } })
        : Promise.resolve([] as { assignedTutorId: string | null }[]),
    ]);
    for (const { tutorId } of bookings) ids.add(tutorId);
    for (const { assignedTutorId } of requests) if (assignedTutorId) ids.add(assignedTutorId);
  }
  ids.delete(accountId);
  const people = await prisma.account.findMany({
    where: {
      id: { in: [...ids] }, email: { not: { endsWith: "@learner.invalid" } },
      memberships: { some: { academyId, status: "ACTIVE" } },
    },
    select: { id: true, fullName: true, memberships: { where: { academyId }, select: { role: true } } },
    orderBy: { fullName: "asc" },
  });
  res.json(people.map((person) => ({
    id: person.id, fullName: person.fullName,
    role: person.memberships[0]?.role ?? null,
  })));
}));
