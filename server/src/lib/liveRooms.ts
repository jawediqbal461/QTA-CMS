import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma.js";
import { MINUTE } from "./scheduling.js";
import type { SessionPayload } from "./jwt.js";

export type RoomKind = "booking" | "class";
export type RoomRole = "TUTOR" | "STUDENT" | "GUARDIAN" | "ADMIN";

export type RoomInfo = {
  key: string;
  kind: RoomKind;
  id: string;
  academyId: string;
  title: string;
  startsAt: Date;
  durationMinutes: number;
  active: boolean;
  tutorId: string;
  tutorName: string;
  /** Learner accounts expected in the room (the student, or the class members). */
  learners: Array<{ id: string; fullName: string }>;
  myRole: RoomRole;
};

export const roomKey = (kind: RoomKind, id: string) => `${kind}:${id}`;

export function parseRoomKey(key: string): { kind: RoomKind; id: string } | null {
  const [kind, id] = key.split(":");
  if ((kind === "booking" || kind === "class") && id && /^[0-9a-f-]{36}$/i.test(id)) return { kind, id };
  return null;
}

const OPEN_BEFORE = 15 * MINUTE;
const OPEN_AFTER = 30 * MINUTE;

export function windowOpen(room: Pick<RoomInfo, "startsAt" | "durationMinutes">, now = Date.now()) {
  const start = room.startsAt.getTime();
  return now >= start - OPEN_BEFORE && now < start + room.durationMinutes * MINUTE + OPEN_AFTER;
}

function roleFor(session: SessionPayload, tutorId: string, learnerIds: string[], guardianOf: boolean): RoomRole | null {
  if (session.accountId === tutorId) return "TUTOR";
  if (learnerIds.includes(session.accountId)) return "STUDENT";
  if (guardianOf) return "GUARDIAN";
  if (session.role === "ACADEMY_ADMIN" || session.role === "PLATFORM_ADMIN") return "ADMIN";
  return null;
}

/** Looks up a room and the caller's role in it; returns null when the room does not exist or the caller has no access. */
export async function resolveRoom(session: SessionPayload, kind: RoomKind, id: string): Promise<RoomInfo | null> {
  const { academyId, accountId } = session;
  if (kind === "booking") {
    const booking = await prisma.booking.findFirst({
      where: { id, academyId },
      select: {
        id: true, tutorId: true, scheduledAtUtc: true, durationMinutes: true, status: true,
        tutor: { select: { account: { select: { fullName: true } } } },
        student: { select: { id: true, fullName: true } },
      },
    });
    if (!booking) return null;
    const guardianOf = session.role === "GUARDIAN" && !!(await prisma.guardianStudentLink.findFirst({
      where: { guardianId: accountId, studentId: booking.student.id }, select: { guardianId: true },
    }));
    const myRole = roleFor(session, booking.tutorId, [booking.student.id], guardianOf);
    if (!myRole) return null;
    return {
      key: roomKey("booking", id), kind, id, academyId, title: `${booking.tutor.account.fullName} & ${booking.student.fullName}`,
      startsAt: booking.scheduledAtUtc, durationMinutes: booking.durationMinutes,
      active: booking.status === "BOOKED" || booking.status === "RESCHEDULED",
      tutorId: booking.tutorId, tutorName: booking.tutor.account.fullName,
      learners: [booking.student], myRole,
    };
  }
  const sessionRow = await prisma.liveClassSession.findFirst({
    where: { id, liveClass: { academyId } },
    select: {
      id: true, startsAt: true, durationMinutes: true, status: true,
      liveClass: {
        select: {
          title: true, status: true, tutorId: true,
          tutor: { select: { account: { select: { fullName: true } } } },
          members: { where: { status: "ACTIVE" }, select: { student: { select: { id: true, fullName: true } } } },
        },
      },
    },
  });
  if (!sessionRow) return null;
  const learners = sessionRow.liveClass.members.map((member) => member.student);
  const guardianOf = session.role === "GUARDIAN" && !!(await prisma.guardianStudentLink.findFirst({
    where: { guardianId: accountId, studentId: { in: learners.map((learner) => learner.id) } }, select: { guardianId: true },
  }));
  const myRole = roleFor(session, sessionRow.liveClass.tutorId, learners.map((learner) => learner.id), guardianOf);
  if (!myRole) return null;
  return {
    key: roomKey("class", id), kind, id, academyId, title: sessionRow.liveClass.title,
    startsAt: sessionRow.startsAt, durationMinutes: sessionRow.durationMinutes,
    active: sessionRow.status === "SCHEDULED" && sessionRow.liveClass.status === "PUBLISHED",
    tutorId: sessionRow.liveClass.tutorId, tutorName: sessionRow.liveClass.tutor.account.fullName,
    learners, myRole,
  };
}

/** ICE servers for WebRTC. Uses coturn's time-limited REST credentials when TURN_URL and TURN_SECRET are set. */
export function iceServers(accountId: string) {
  const servers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: ["stun:stun.l.google.com:19302"] },
  ];
  const turnUrl = process.env.TURN_URL?.trim();
  const secret = process.env.TURN_SECRET;
  if (turnUrl && secret) {
    const username = `${Math.floor(Date.now() / 1000) + 6 * 3600}:${accountId}`;
    const credential = createHmac("sha1", secret).update(username).digest("base64");
    servers.push({ urls: turnUrl.split(",").map((url) => url.trim()).filter(Boolean), username, credential });
  }
  return { servers, turn: !!(turnUrl && secret) };
}

export function signedFileToken(recordingId: string, ttlMs = 10 * MINUTE) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const expires = Date.now() + ttlMs;
  const nonce = randomBytes(6).toString("hex");
  const signature = createHmac("sha256", secret).update(`rec:${recordingId}:${expires}:${nonce}`).digest("hex");
  return { expires, nonce, signature };
}

export function verifySignedFile(recordingId: string, expires: number, nonce: string, signature: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret || !Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = createHmac("sha256", secret).update(`rec:${recordingId}:${expires}:${nonce}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
