import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";
import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "./prisma.js";
import type { SessionPayload } from "./jwt.js";
import { parseRoomKey, resolveRoom, roomKey, windowOpen, type RoomRole } from "./liveRooms.js";

type PeerRole = RoomRole | "GUEST";

type Peer = {
  id: string;
  accountId: string | null;
  name: string;
  role: PeerRole;
  ws: WebSocket;
  audio: boolean;
  video: boolean;
  hand: boolean;
  alive: boolean;
  budget: number;
  budgetAt: number;
};

type Stroke = { id: string; peer: string; color: string; w: number; pts: Array<[number, number]> };
type ChatLine = { id: string; peerId: string; name: string; text: string; at: number };

type Room = {
  key: string;
  academyId: string | null;
  peers: Map<string, Peer>;
  learnerIds: string[];
  studentId: string | null;
  maxPeers: number;
  state: {
    quran: { surah: number; ayah: number } | null;
    strokes: Stroke[];
    boardAllow: boolean;
    recording: boolean;
    chat: ChatLine[];
  };
  cleanup?: NodeJS.Timeout;
};

const rooms = new Map<string, Room>();

// A short-lived one-time ticket replaces the login token in the WebSocket URL, so tokens never end up in proxy access logs.
const tickets = new Map<string, { session: SessionPayload; expires: number }>();
export function issueWsTicket(session: SessionPayload) {
  const ticket = randomUUID() + randomUUID().replace(/-/g, "");
  tickets.set(ticket, { session, expires: Date.now() + 30_000 });
  return ticket;
}
function redeemTicket(ticket: string | null) {
  if (!ticket) return null;
  const entry = tickets.get(ticket);
  tickets.delete(ticket);
  return entry && entry.expires > Date.now() ? entry.session : null;
}
const MAX_STROKES = 4000;
const MAX_POINTS = 1500;
const MAX_CHAT = 100;

function getRoom(key: string, init: Omit<Room, "key" | "peers" | "state" | "cleanup">): Room {
  let room = rooms.get(key);
  if (!room) {
    room = { key, peers: new Map(), state: { quran: null, strokes: [], boardAllow: false, recording: false, chat: [] }, ...init };
    rooms.set(key, room);
  }
  if (room.cleanup) { clearTimeout(room.cleanup); room.cleanup = undefined; }
  return room;
}

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function broadcast(room: Room, payload: unknown, exceptId?: string) {
  const text = JSON.stringify(payload);
  for (const peer of room.peers.values()) {
    if (peer.id !== exceptId && peer.ws.readyState === WebSocket.OPEN) peer.ws.send(text);
  }
}

const publicPeer = (peer: Peer) => ({ id: peer.id, name: peer.name, role: peer.role, audio: peer.audio, video: peer.video, hand: peer.hand });
const clean = (value: unknown, max: number) => String(value ?? "").replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, max);

function leave(room: Room, peer: Peer) {
  if (room.peers.get(peer.id) !== peer) return;
  room.peers.delete(peer.id);
  broadcast(room, { t: "peer-left", id: peer.id });
  if (room.peers.size === 0) {
    // Keep the board and Quran position for a few minutes so a dropped tutor can rejoin the same class.
    room.cleanup = setTimeout(() => rooms.delete(room.key), 10 * 60_000);
  } else if (room.state.recording && peer.role === "TUTOR") {
    room.state.recording = false;
    broadcast(room, { t: "rec", on: false });
  }
}

async function handleMistake(room: Room, peer: Peer, message: Record<string, unknown>) {
  if (peer.role !== "TUTOR" || !room.academyId || !peer.accountId) return;
  const studentId = clean(message.studentId, 40) || room.studentId;
  if (studentId && !room.learnerIds.includes(studentId)) return;
  const severity = message.severity === "major" ? "major" : "minor";
  const type = clean(message.type, 40) || "Other";
  const description = clean(message.description, 500);
  if (!description) return;
  const saved = await prisma.mistakeLog.create({
    data: { academyId: room.academyId, roomKey: room.key, studentId: studentId || null, recordedById: peer.accountId, type, description, severity },
  });
  broadcast(room, { t: "mistake", mistake: { id: saved.id, studentId: saved.studentId, type, description, severity, createdAt: saved.createdAt } });
}

function handleBoard(room: Room, peer: Peer, message: Record<string, unknown>) {
  const controller = peer.role === "TUTOR";
  const mayDraw = controller || (room.state.boardAllow && (peer.role === "STUDENT" || peer.role === "GUARDIAN"));
  const op = message.op;
  if (op === "allow" && controller) {
    room.state.boardAllow = message.value === true;
    broadcast(room, { t: "board", op: "allow", value: room.state.boardAllow });
  } else if (op === "clear" && controller) {
    room.state.strokes = [];
    broadcast(room, { t: "board", op: "clear" });
  } else if (op === "undo" && mayDraw) {
    for (let i = room.state.strokes.length - 1; i >= 0; i--) {
      if (room.state.strokes[i].peer === peer.id) {
        const [removed] = room.state.strokes.splice(i, 1);
        broadcast(room, { t: "board", op: "remove", id: removed.id });
        break;
      }
    }
  } else if (op === "seg" && mayDraw) {
    const id = clean(message.id, 40);
    const color = /^#[0-9a-fA-F]{6}$/.test(String(message.color)) ? String(message.color) : "#ffffff";
    const w = Math.min(24, Math.max(1, Number(message.w) || 3));
    const points = Array.isArray(message.pts) ? message.pts.slice(0, 200) : [];
    const pts = points
      .filter((p): p is [number, number] => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map(([x, y]) => [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))] as [number, number]);
    if (!id || pts.length === 0) return;
    let stroke = room.state.strokes.find((entry) => entry.id === id && entry.peer === peer.id);
    if (!stroke) {
      if (room.state.strokes.length >= MAX_STROKES) room.state.strokes.shift();
      stroke = { id, peer: peer.id, color, w, pts: [] };
      room.state.strokes.push(stroke);
    }
    if (stroke.pts.length + pts.length <= MAX_POINTS) stroke.pts.push(...pts);
    broadcast(room, { t: "board", op: "seg", id, peer: peer.id, color: stroke.color, w: stroke.w, pts }, peer.id);
  }
}

async function onMessage(room: Room, peer: Peer, raw: string) {
  // Token bucket: about 30 messages a second sustained (drawing sends ~11/s), with a burst allowance.
  const now = Date.now();
  peer.budget = Math.min(300, peer.budget + ((now - peer.budgetAt) / 1000) * 30);
  peer.budgetAt = now;
  if (peer.budget < 1) return;
  peer.budget -= 1;
  let message: Record<string, unknown>;
  try { message = JSON.parse(raw); } catch { return; }
  switch (message.t) {
    case "signal": {
      const target = room.peers.get(clean(message.to, 40));
      if (target && message.data && typeof message.data === "object") send(target.ws, { t: "signal", from: peer.id, data: message.data });
      break;
    }
    case "chat": {
      const text = clean(message.text, 500);
      if (!text) break;
      const line: ChatLine = { id: randomUUID(), peerId: peer.id, name: peer.name, text, at: Date.now() };
      room.state.chat.push(line);
      if (room.state.chat.length > MAX_CHAT) room.state.chat.shift();
      broadcast(room, { t: "chat", line });
      break;
    }
    case "hand":
      peer.hand = message.up === true;
      broadcast(room, { t: "hand", id: peer.id, up: peer.hand });
      break;
    case "media":
      peer.audio = message.audio !== false;
      peer.video = message.video !== false;
      broadcast(room, { t: "media", id: peer.id, audio: peer.audio, video: peer.video }, peer.id);
      break;
    case "quran": {
      if (peer.role !== "TUTOR") break;
      const surah = Number(message.surah);
      const ayah = Number(message.ayah);
      if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > 300) break;
      room.state.quran = { surah, ayah };
      broadcast(room, { t: "quran", surah, ayah }, peer.id);
      break;
    }
    case "board":
      handleBoard(room, peer, message);
      break;
    case "rec":
      if (peer.role !== "TUTOR") break;
      room.state.recording = message.on === true;
      broadcast(room, { t: "rec", on: room.state.recording });
      break;
    case "mute-request": {
      if (peer.role !== "TUTOR") break;
      const target = room.peers.get(clean(message.peerId, 40));
      if (target) send(target.ws, { t: "mute-request" });
      break;
    }
    case "mistake":
      await handleMistake(room, peer, message);
      break;
    default:
      break;
  }
}

async function setupConnection(ws: WebSocket, url: URL) {
  const key = url.searchParams.get("room") ?? "";
  const ticket = url.searchParams.get("ticket");
  const fail = (error: string, code = 4403) => { send(ws, { t: "error", error }); ws.close(code, error.slice(0, 100)); };

  let room: Room;
  let peer: Peer;
  if (key.startsWith("demo:")) {
    const slug = key.slice(5);
    const demo = await prisma.demoRoom.findFirst({ where: { roomSlug: slug, isActive: true }, select: { id: true } });
    if (!demo) return fail("The demo classroom is not open right now.");
    room = getRoom(key, { academyId: null, learnerIds: [], studentId: null, maxPeers: 8 });
    const name = clean(url.searchParams.get("name"), 40) || "Guest";
    peer = { id: randomUUID(), accountId: null, name, role: "GUEST", ws, audio: true, video: true, hand: false, alive: true, budget: 300, budgetAt: Date.now() };
  } else {
    const parsed = parseRoomKey(key);
    const session = redeemTicket(ticket);
    if (!parsed || !session) return fail("Your session expired. Reload the page and join again.", 4401);
    const info = await resolveRoom(session, parsed.kind, parsed.id);
    if (!info) return fail("You do not have access to this classroom.");
    if (!info.active) return fail("This session is cancelled or not available.");
    if (info.myRole !== "ADMIN" && !windowOpen(info)) return fail("The classroom opens 15 minutes before the start time.");
    const account = await prisma.account.findUnique({ where: { id: session.accountId }, select: { fullName: true } });
    room = getRoom(roomKey(parsed.kind, parsed.id), {
      academyId: info.academyId, learnerIds: info.learners.map((learner) => learner.id),
      studentId: info.kind === "booking" ? info.learners[0]?.id ?? null : null, maxPeers: 12,
    });
    peer = {
      id: randomUUID(), accountId: session.accountId, name: account?.fullName ?? "Participant",
      role: info.myRole, ws, audio: true, video: true, hand: false, alive: true, budget: 300, budgetAt: Date.now(),
    };
    for (const existing of room.peers.values()) {
      if (existing.accountId === peer.accountId) { send(existing.ws, { t: "error", error: "You joined from another tab or device." }); existing.ws.close(4001, "replaced"); leave(room, existing); }
    }
  }

  if (room.peers.size >= room.maxPeers) return fail("This classroom is full.");
  const existingPeers = [...room.peers.values()].map(publicPeer);
  room.peers.set(peer.id, peer);
  send(ws, {
    t: "welcome", you: publicPeer(peer), peers: existingPeers,
    state: { quran: room.state.quran, strokes: room.state.strokes, boardAllow: room.state.boardAllow, recording: room.state.recording, chat: room.state.chat },
  });
  broadcast(room, { t: "peer-joined", peer: publicPeer(peer) }, peer.id);

  ws.on("pong", () => { peer.alive = true; });
  ws.on("message", (data) => { void onMessage(room, peer, data.toString()).catch((error) => console.error("live message failed", error)); });
  ws.on("close", () => leave(room, peer));
  ws.on("error", () => leave(room, peer));
}

export function attachLiveSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 128 * 1024 });

  server.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/api/live/ws") { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, (ws) => {
      setupConnection(ws, url).catch((error) => {
        console.error("live socket setup failed", error);
        try { ws.close(1011, "server error"); } catch { /* already closed */ }
      });
    });
  });

  setInterval(() => {
    const now = Date.now();
    for (const [ticket, entry] of tickets) if (entry.expires <= now) tickets.delete(ticket);
    for (const room of rooms.values()) {
      for (const peer of room.peers.values()) {
        if (!peer.alive) { peer.ws.terminate(); continue; }
        peer.alive = false;
        peer.ws.ping();
      }
    }
  }, 25_000).unref();
}
