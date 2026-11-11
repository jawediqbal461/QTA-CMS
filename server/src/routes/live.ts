import express, { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { recordAudit } from "../lib/audit.js";
import { issueWsTicket } from "../lib/liveSocket.js";
import {
  iceServers, parseRoomKey, resolveRoom, signedFileToken, verifySignedFile, windowOpen, type RoomKind,
} from "../lib/liveRooms.js";

export const liveRouter = Router();

const RECORDINGS_DIR = path.resolve(process.env.RECORDINGS_DIR || "./uploads/recordings");
const MAX_RECORDING_BYTES = 1_500_000_000;

function kindParam(value: string): RoomKind | null {
  return value === "booking" || value === "class" ? value : null;
}

// Playback links are signed, so a <video> element can stream without an Authorization header.
liveRouter.get("/recordings/:id/file", asyncHandler(async (req, res) => {
  const { exp, nonce, sig } = req.query as Record<string, string | undefined>;
  if (!verifySignedFile(req.params.id, Number(exp), String(nonce ?? ""), String(sig ?? ""))) {
    return res.status(403).json({ error: "This recording link has expired. Open the recording again." });
  }
  const recording = await prisma.liveRecording.findUnique({ where: { id: req.params.id } });
  if (!recording || !fs.existsSync(recording.filePath)) return res.status(404).json({ error: "Recording not found." });
  const size = fs.statSync(recording.filePath).size;
  const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  res.set({ "Content-Type": "video/webm", "Accept-Ranges": "bytes", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return res.status(416).set("Content-Range", `bytes */${size}`).end();
    res.status(206).set({ "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) });
    return fs.createReadStream(recording.filePath, { start, end }).pipe(res);
  }
  res.set("Content-Length", String(size));
  fs.createReadStream(recording.filePath).pipe(res);
}));

liveRouter.use(requireAuth);

liveRouter.post("/ws-ticket", (req, res) => {
  res.json({ ticket: issueWsTicket(req.session!) });
});

liveRouter.get("/ice", (req, res) => {
  res.json(iceServers(req.session!.accountId));
});

liveRouter.get("/rooms/:kind/:id", asyncHandler(async (req, res) => {
  const kind = kindParam(req.params.kind);
  if (!kind) return res.status(404).json({ error: "Classroom not found." });
  const room = await resolveRoom(req.session!, kind, req.params.id);
  if (!room) return res.status(404).json({ error: "Classroom not found." });
  const isTutor = room.myRole === "TUTOR";
  // Families see mistakes recorded for their own learners; tutors and admins see all.
  const mistakes = await prisma.mistakeLog.findMany({
    where: {
      roomKey: room.key,
      ...(room.myRole === "STUDENT" ? { studentId: req.session!.accountId } : {}),
      ...(room.myRole === "GUARDIAN" ? { studentId: { in: room.learners.map((learner) => learner.id) } } : {}),
    },
    orderBy: { createdAt: "asc" }, take: 200,
    select: { id: true, studentId: true, type: true, description: true, severity: true, createdAt: true },
  });
  res.json({
    key: room.key, kind: room.kind, id: room.id, title: room.title, startsAt: room.startsAt,
    durationMinutes: room.durationMinutes, active: room.active, opensNow: windowOpen(room),
    tutorName: room.tutorName, learners: room.learners, myRole: room.myRole, canRecord: isTutor, mistakes,
  });
}));

// ─── Recordings (browser-side capture, uploaded in small chunks) ─────────────

liveRouter.post("/rooms/:kind/:id/recordings", asyncHandler(async (req, res) => {
  const kind = kindParam(req.params.kind);
  const room = kind && await resolveRoom(req.session!, kind, req.params.id);
  if (!room || room.myRole !== "TUTOR") return res.status(403).json({ error: "Only the tutor can record this class." });
  if (!windowOpen(room)) return res.status(409).json({ error: "The class is not in session." });
  const { academyId, accountId } = req.session!;
  const id = randomUUID();
  const dir = path.join(RECORDINGS_DIR, academyId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${id}.webm`);
  fs.writeFileSync(filePath, Buffer.alloc(0));
  const recording = await prisma.liveRecording.create({
    data: { id, academyId, roomKey: room.key, tutorId: accountId, title: `${room.title} — ${new Date(room.startsAt).toISOString().slice(0, 10)}`, filePath },
  });
  await recordAudit({ actorId: accountId, academyId, action: "recording.started", targetType: "live_recording", targetId: recording.id });
  res.status(201).json({ id: recording.id });
}));

liveRouter.post("/recordings/:id/chunk", express.raw({ type: "application/octet-stream", limit: "6mb" }), asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const recording = await prisma.liveRecording.findFirst({ where: { id: req.params.id, academyId, tutorId: accountId, status: "RECORDING" } });
  if (!recording) return res.status(404).json({ error: "Recording not found." });
  const body = req.body as Buffer;
  if (!Buffer.isBuffer(body) || body.length === 0) return res.status(400).json({ error: "Empty chunk." });
  if (recording.sizeBytes + body.length > MAX_RECORDING_BYTES) return res.status(413).json({ error: "Recording size limit reached." });
  await fs.promises.appendFile(recording.filePath, body);
  await prisma.liveRecording.update({ where: { id: recording.id }, data: { sizeBytes: { increment: body.length } } });
  res.json({ ok: true });
}));

liveRouter.post("/recordings/:id/finish", asyncHandler(async (req, res) => {
  const parsed = z.object({ durationSec: z.number().int().min(0).max(8 * 3600) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid duration." });
  const { academyId, accountId } = req.session!;
  const updated = await prisma.liveRecording.updateMany({
    where: { id: req.params.id, academyId, tutorId: accountId },
    data: { status: "READY", durationSec: parsed.data.durationSec },
  });
  if (!updated.count) return res.status(404).json({ error: "Recording not found." });
  res.json({ status: "READY" });
}));

const recordingSelect = { id: true, roomKey: true, title: true, sizeBytes: true, durationSec: true, status: true, createdAt: true } as const;

liveRouter.get("/recordings", asyncHandler(async (req, res) => {
  const { academyId, accountId, role } = req.session!;
  if (role === "ACADEMY_ADMIN" || role === "PLATFORM_ADMIN") {
    return res.json(await prisma.liveRecording.findMany({ where: { academyId }, orderBy: { createdAt: "desc" }, take: 200, select: recordingSelect }));
  }
  if (role === "TUTOR") {
    return res.json(await prisma.liveRecording.findMany({ where: { academyId, tutorId: accountId }, orderBy: { createdAt: "desc" }, take: 200, select: recordingSelect }));
  }
  // Students and guardians see recordings of their own lessons and of classes their learners attend.
  const learner = role === "STUDENT" ? { id: accountId } : { studentLinks: { some: { guardianId: accountId } } };
  const [bookings, sessions] = await Promise.all([
    prisma.booking.findMany({ where: { academyId, student: learner }, select: { id: true } }),
    prisma.liveClassSession.findMany({
      where: { liveClass: { academyId, members: { some: { status: "ACTIVE", student: learner } } } },
      select: { id: true },
    }),
  ]);
  const keys = [...bookings.map((entry) => `booking:${entry.id}`), ...sessions.map((entry) => `class:${entry.id}`)];
  res.json(await prisma.liveRecording.findMany({
    where: { academyId, status: "READY", roomKey: { in: keys } }, orderBy: { createdAt: "desc" }, take: 200, select: recordingSelect,
  }));
}));

async function recordingAccess(session: NonNullable<express.Request["session"]>, id: string) {
  const recording = await prisma.liveRecording.findFirst({ where: { id, academyId: session.academyId } });
  if (!recording) return null;
  if (session.role === "ACADEMY_ADMIN" || session.role === "PLATFORM_ADMIN" || recording.tutorId === session.accountId) return recording;
  const parsed = parseRoomKey(recording.roomKey);
  if (!parsed || recording.status !== "READY") return null;
  return (await resolveRoom(session, parsed.kind, parsed.id)) ? recording : null;
}

liveRouter.get("/recordings/:id/url", asyncHandler(async (req, res) => {
  const recording = await recordingAccess(req.session!, req.params.id);
  if (!recording) return res.status(404).json({ error: "Recording not found." });
  const { expires, nonce, signature } = signedFileToken(recording.id);
  res.json({ url: `/api/live/recordings/${recording.id}/file?exp=${expires}&nonce=${nonce}&sig=${signature}` });
}));

liveRouter.delete("/recordings/:id", asyncHandler(async (req, res) => {
  const { academyId, accountId, role } = req.session!;
  const recording = await prisma.liveRecording.findFirst({ where: { id: req.params.id, academyId } });
  const isAdmin = role === "ACADEMY_ADMIN" || role === "PLATFORM_ADMIN";
  if (!recording || (!isAdmin && recording.tutorId !== accountId)) return res.status(404).json({ error: "Recording not found." });
  await prisma.liveRecording.delete({ where: { id: recording.id } });
  await fs.promises.rm(recording.filePath, { force: true });
  await recordAudit({ actorId: accountId, academyId, action: "recording.deleted", targetType: "live_recording", targetId: recording.id });
  res.json({ deleted: true });
}));

