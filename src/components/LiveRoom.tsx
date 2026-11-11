import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, BookOpen, Circle, Hand, Loader2, MessageSquare, Mic, MicOff, Maximize2, Minimize2,
  MonitorUp, PenTool, PhoneOff, Send, Users, Video, VideoOff,
} from "lucide-react";
import { accountRequest, ApiError, getStoredAdminToken, request } from "../lib/api";
import { getStoredSession } from "../lib/session";
import { useSEO } from "../hooks/useSEO";
import { useLiveRoom, type MistakeEntry, type RemotePeer } from "../lib/liveRtc";
import { startClassRecording, type ClassRecorder } from "../lib/liveRecorder";
import Whiteboard from "./live/Whiteboard";
import QuranPanel from "./live/QuranPanel";
import MistakeLogger from "./live/MistakeLogger";
import quranIndex from "../data/quran-legacy/index.json";

type RoomInfo = {
  key: string; kind: "booking" | "class"; id: string; title: string; startsAt: string; durationMinutes: number;
  active: boolean; opensNow: boolean; tutorName: string; learners: Array<{ id: string; fullName: string }>;
  myRole: "TUTOR" | "STUDENT" | "GUARDIAN" | "ADMIN"; canRecord: boolean; mistakes: MistakeEntry[];
};

type Panel = "chat" | "quran" | "board" | "mistakes" | "people";

const roleLabel: Record<string, string> = { TUTOR: "Teacher", STUDENT: "Student", GUARDIAN: "Guardian", ADMIN: "Academy", GUEST: "Guest" };

function VideoTile({ stream, name, role, muted, audio, video, hand, local }: {
  stream: MediaStream | null; name: string; role: string; muted: boolean; audio: boolean; video: boolean; hand: boolean; local?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (element && element.srcObject !== stream) element.srcObject = stream;
  }, [stream]);
  const showVideo = !!stream && video && stream.getVideoTracks().length > 0;
  return (
    <div className="relative min-h-[140px] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <video ref={ref} autoPlay playsInline muted={muted} data-tile="1" data-name={name}
        className={`h-full w-full object-cover ${local ? "-scale-x-100" : ""} ${showVideo ? "" : "invisible"}`} />
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950 text-2xl font-black text-emerald-400">{(name.trim().charAt(0) || "?").toUpperCase()}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-[11px] font-bold text-white">
        <span className="truncate">{name}{local ? " (you)" : ""} <span className="font-normal text-neutral-300">· {roleLabel[role] ?? role}</span></span>
        <span className="flex shrink-0 items-center gap-1.5">
          {hand && <Hand size={13} className="text-amber-400" />}
          {!audio && <MicOff size={13} className="text-rose-400" />}
        </span>
      </div>
    </div>
  );
}

function Room({ info, token, guestName, roomKey, onLeave }: { info: RoomInfo | null; token?: string; guestName?: string; roomKey: string; onLeave: () => void }) {
  const live = useLiveRoom({ roomKey, token, guestName });
  const [panel, setPanel] = useState<Panel>("chat");
  const [wide, setWide] = useState(false);
  const [chatText, setChatText] = useState("");
  const [recorderError, setRecorderError] = useState("");
  const [recorderBusy, setRecorderBusy] = useState(false);
  const recorder = useRef<ClassRecorder | null>(null);
  const boardCanvas = useRef<{ canvas: HTMLCanvasElement; hasContent: () => boolean } | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const remoteStreamsRef = useRef(live.remoteStreams);
  remoteStreamsRef.current = live.remoteStreams;

  const isTutor = live.me?.role === "TUTOR";
  const isDemo = roomKey.startsWith("demo:");
  const kind = info?.kind;

  useEffect(() => { live.seedMistakes(info?.mistakes ?? []); }, [info]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [live.chat.length, panel]);

  const registerCanvas = useCallback((entry: { canvas: HTMLCanvasElement; hasContent: () => boolean } | null) => { boardCanvas.current = entry; }, []);

  const stopRecording = useCallback(async () => {
    const active = recorder.current;
    if (!active) return;
    recorder.current = null;
    setRecorderBusy(true);
    try { await active.stop(); } catch (error) { setRecorderError(error instanceof Error ? error.message : "Could not finish the recording."); }
    finally { setRecorderBusy(false); live.setRecordingFlag(false); }
  }, [live]);

  const startRecording = useCallback(async () => {
    if (!token || !info || !kind) return;
    if (!window.confirm("Start recording this class? Everyone in the room is told it is being recorded. Only the academy, you, and the learners' families can watch it afterwards.")) return;
    setRecorderError(""); setRecorderBusy(true);
    try {
      recorder.current = await startClassRecording({
        token, kind, id: info.id, localStream: live.localStream, remoteStreams: remoteStreamsRef.current.values(),
        tiles: () => Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-tile]")),
        board: () => boardCanvas.current ? { canvas: boardCanvas.current.canvas, hasContent: boardCanvas.current.hasContent() } : null,
        onError: (message) => setRecorderError(message),
      });
      live.setRecordingFlag(true);
    } catch (error) {
      setRecorderError(error instanceof ApiError || error instanceof Error ? error.message : "Could not start recording.");
    } finally { setRecorderBusy(false); }
  }, [token, info, kind, live]);

  useEffect(() => {
    if (!live.recording || !isTutor) return;
    return live.onRemoteStream((stream) => recorder.current?.addAudioStream(stream));
  }, [live, isTutor, live.recording]);

  useEffect(() => () => { void recorder.current?.stop().catch(() => undefined); }, []);

  const tiles = useMemo(() => {
    const others: RemotePeer[] = [...live.peers].sort((a, b) => (a.role === "TUTOR" ? -1 : 0) - (b.role === "TUTOR" ? -1 : 0));
    return others;
  }, [live.peers]);

  const quranName = live.quran ? (quranIndex as Array<{ number: number; title: string }>).find((item) => item.number === live.quran?.surah)?.title.split(" - ")[0] : null;
  const ayahRef = live.quran ? `${quranName ?? `Surah ${live.quran.surah}`} ${live.quran.surah}:${live.quran.ayah}` : null;
  const canDrawBoard = isTutor || (live.boardAllow && (live.me?.role === "STUDENT" || live.me?.role === "GUARDIAN"));
  const total = tiles.length + 1;
  const columns = total <= 1 ? "grid-cols-1" : total <= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-3";

  if (live.status === "error" || live.status === "ended") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center text-white">
        <AlertTriangle size={28} className="text-amber-400" />
        <p className="max-w-md text-sm font-bold">{live.error || "The class connection ended."}</p>
        <button onClick={onLeave} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950">Back</button>
      </div>
    );
  }

  const tabs: Array<{ id: Panel; label: string; icon: typeof Users; hidden?: boolean }> = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "quran", label: "Quran", icon: BookOpen },
    { id: "board", label: "Board", icon: PenTool },
    { id: "mistakes", label: "Mistakes", icon: AlertTriangle, hidden: isDemo },
    { id: "people", label: `People (${total})`, icon: Users },
  ];

  const controlClass = (active: boolean, danger = false) =>
    `flex h-11 w-11 items-center justify-center rounded-full border transition ${danger ? "border-rose-500/40 bg-rose-600 text-white hover:bg-rose-500" : active ? "border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700" : "border-rose-500/40 bg-rose-950 text-rose-300"}`;

  return (
    <div className="flex h-[calc(100vh-4.5rem)] min-h-[560px] flex-col bg-neutral-950 text-white">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">{info?.title ?? "Demo Classroom — Quran Tutors Academy"}</p>
          <p className="text-[10px] text-neutral-400">
            {info ? `${new Date(info.startsAt).toLocaleString()} · ${info.durationMinutes} min` : "Open demo room — anyone can join"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {live.recording && <span className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950 px-2.5 py-1 text-[10px] font-bold text-rose-300"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> Recording</span>}
          {live.status === "connecting" && <span className="flex items-center gap-1.5 text-[11px] text-amber-300"><Loader2 size={12} className="animate-spin" /> Connecting…</span>}
        </div>
      </div>

      {(live.mediaNote || recorderError || live.muteRequested) && (
        <div className="space-y-1 border-b border-neutral-800 bg-amber-950/30 px-4 py-2 text-xs text-amber-200" role="status">
          {live.mediaNote && <p>{live.mediaNote}</p>}
          {recorderError && <p className="text-rose-300">Recording: {recorderError}</p>}
          {live.muteRequested && (
            <p>Your teacher asked you to mute. <button className="font-bold underline" onClick={() => { if (live.micOn) live.toggleMic(); else live.dismissMuteRequest(); }}>Mute now</button></p>
          )}
        </div>
      )}

      <div className={`grid min-h-0 flex-1 gap-3 p-3 ${wide ? "lg:grid-cols-2" : "lg:grid-cols-[1fr_420px]"}`}>
        <div className="flex min-h-0 flex-col gap-3">
          <div className={`grid min-h-0 flex-1 auto-rows-fr gap-3 overflow-y-auto ${columns}`}>
            <VideoTile stream={live.localStream} name={live.me?.name ?? "You"} role={live.me?.role ?? "GUEST"} muted audio={live.micOn} video={live.camOn} hand={live.handUp} local />
            {tiles.map((peer) => <Fragment key={peer.id}><VideoTile stream={peer.stream} name={peer.name} role={peer.role} muted={false} audio={peer.audio} video={peer.video} hand={peer.hand} /></Fragment>)}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2.5">
            <button onClick={live.toggleMic} className={controlClass(live.micOn)} aria-label={live.micOn ? "Mute microphone" : "Unmute microphone"}>{live.micOn ? <Mic size={18} /> : <MicOff size={18} />}</button>
            <button onClick={live.toggleCam} className={controlClass(live.camOn)} aria-label={live.camOn ? "Turn camera off" : "Turn camera on"}>{live.camOn ? <Video size={18} /> : <VideoOff size={18} />}</button>
            <button onClick={() => (live.screenSharing ? live.stopScreenShare() : void live.startScreenShare())} className={controlClass(!live.screenSharing)} aria-label="Share screen"><MonitorUp size={18} /></button>
            {!isTutor && <button onClick={() => live.raiseHand(!live.handUp)} className={controlClass(!live.handUp)} aria-label={live.handUp ? "Lower hand" : "Raise hand"}><Hand size={18} className={live.handUp ? "text-amber-400" : ""} /></button>}
            {info?.canRecord && (
              <button onClick={() => (live.recording ? void stopRecording() : void startRecording())} disabled={recorderBusy}
                className={`flex h-11 items-center gap-2 rounded-full border px-4 text-xs font-bold transition disabled:opacity-60 ${live.recording ? "border-rose-500/40 bg-rose-600 text-white" : "border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"}`}>
                <Circle size={12} className={live.recording ? "fill-white" : "fill-rose-500 text-rose-500"} />{recorderBusy ? "Please wait…" : live.recording ? "Stop recording" : "Record"}
              </button>
            )}
            <button onClick={() => { void stopRecording().finally(onLeave); }} className={controlClass(true, true)} aria-label="Leave classroom"><PhoneOff size={18} /></button>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="flex shrink-0 items-center gap-1 border-b border-neutral-800 p-1.5">
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              {tabs.filter((tab) => !tab.hidden).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setPanel(id)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${panel === id ? "bg-emerald-500/15 text-emerald-400" : "text-neutral-400 hover:text-white"}`}><Icon size={13} />{label}</button>
              ))}
            </div>
            <button onClick={() => setWide((value) => !value)} className="hidden rounded-lg p-1.5 text-neutral-400 hover:text-white lg:block" aria-label="Toggle wide panel">{wide ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {panel === "chat" && (
              <div className="flex h-full min-h-[240px] flex-col gap-2">
                <ul className="flex-1 space-y-2 overflow-y-auto">
                  {live.chat.length === 0 && <li className="py-6 text-center text-xs text-neutral-500">No messages yet.</li>}
                  {live.chat.map((line) => (
                    <li key={line.id} className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs ${line.peerId === live.me?.id ? "ml-auto bg-emerald-700 text-white" : "bg-neutral-800 text-neutral-100"}`}>
                      {line.peerId !== live.me?.id && <p className="mb-0.5 text-[10px] font-bold text-emerald-300">{line.name}</p>}
                      <p className="whitespace-pre-wrap break-words">{line.text}</p>
                    </li>
                  ))}
                  <div ref={chatEnd} />
                </ul>
                <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const text = chatText.trim(); if (text) { live.sendChat(text); setChatText(""); } }}>
                  <input value={chatText} onChange={(event) => setChatText(event.target.value)} maxLength={500} placeholder="Type a message…" className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none" />
                  <button className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-neutral-950 hover:bg-emerald-500"><Send size={12} /></button>
                </form>
              </div>
            )}
            {panel === "quran" && <QuranPanel isTutor={isTutor && !isDemo} shared={live.quran} onSync={live.syncQuran} />}
            {panel === "board" && live.me && (
              <Whiteboard board={live.board} canDraw={canDrawBoard} isTutor={isTutor} myPeerId={live.me.id} allow={live.boardAllow} send={live.boardAction} registerCanvas={registerCanvas} />
            )}
            {panel === "mistakes" && <MistakeLogger isTutor={isTutor} learners={info?.learners ?? []} mistakes={live.mistakes} ayahRef={ayahRef} onLog={live.logMistake} />}
            {panel === "people" && (
              <ul className="space-y-2">
                {[{ id: live.me?.id ?? "me", name: `${live.me?.name ?? "You"} (you)`, role: live.me?.role ?? "GUEST", audio: live.micOn, hand: live.handUp, self: true }, ...live.peers.map((peer) => ({ ...peer, self: false }))].map((person) => (
                  <li key={person.id} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs">
                    <span className="min-w-0 truncate"><span className="font-bold text-white">{person.name}</span> <span className="text-neutral-500">· {roleLabel[person.role] ?? person.role}</span></span>
                    <span className="flex shrink-0 items-center gap-2">
                      {person.hand && <Hand size={13} className="text-amber-400" />}
                      {!person.audio && <MicOff size={13} className="text-rose-400" />}
                      {isTutor && !person.self && person.audio && <button onClick={() => live.requestMute(person.id)} className="rounded-lg border border-neutral-700 px-2 py-0.5 text-[10px] font-bold text-neutral-300 hover:text-white">Ask to mute</button>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function LiveRoom() {
  const params = useParams<{ kind?: string; id?: string }>();
  const navigate = useNavigate();
  const kind = params.kind ?? (params.id ? "booking" : "demo");
  const id = params.id ?? "";
  const isDemo = kind === "demo";
  const session = useMemo(() => getStoredSession(["tutor", "guardian", "student"]), []);
  const token = session?.token ?? getStoredAdminToken() ?? undefined;
  const [info, setInfo] = useState<RoomInfo | null>(null);
  const [demoSlug, setDemoSlug] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [guestName, setGuestName] = useState("");

  useSEO({ title: "Live Classroom", noindex: true });

  useEffect(() => {
    if (isDemo) {
      request<{ roomSlug: string }>("/classroom/demo").then((room) => setDemoSlug(room.roomSlug), () => setLoadError("The demo classroom is not open right now.")).finally(() => setLoading(false));
      return;
    }
    if (!token || (kind !== "booking" && kind !== "class")) { setLoading(false); setLoadError(token ? "Classroom not found." : "Sign in to join this classroom."); return; }
    accountRequest<RoomInfo>(`/live/rooms/${kind}/${id}`, token)
      .then(setInfo, (error) => setLoadError(error instanceof Error ? error.message : "Classroom not found."))
      .finally(() => setLoading(false));
  }, [isDemo, kind, id, token]);

  const leave = () => navigate(-1);

  if (joined && (info || (isDemo && demoSlug))) {
    return <Room info={info} token={isDemo ? undefined : token} guestName={guestName} roomKey={isDemo ? `demo:${demoSlug}` : info!.key} onLeave={leave} />;
  }

  const opensAt = info ? new Date(new Date(info.startsAt).getTime() - 15 * 60_000) : null;
  const canJoin = isDemo ? !!demoSlug && guestName.trim().length >= 2 : !!info && info.active && (info.opensNow || info.myRole === "ADMIN");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10 text-white">
      <div className="w-full space-y-5 rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        {loading && <p role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-400"><Loader2 size={16} className="animate-spin" /> Loading classroom…</p>}
        {!loading && loadError && (
          <div className="space-y-3 py-4 text-center">
            <AlertTriangle size={26} className="mx-auto text-amber-400" />
            <p role="alert" className="text-sm font-bold">{loadError}</p>
            <button onClick={() => (isDemo ? navigate("/") : token ? navigate(-1) : navigate("/login/student"))} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950">{isDemo ? "Back to home" : token ? "Go back" : "Sign in"}</button>
          </div>
        )}
        {!loading && !loadError && (
          <>
            <div className="space-y-1 text-center">
              <h1 className="text-lg font-black">{isDemo ? "Demo Classroom" : info?.title}</h1>
              {info && <p className="text-xs text-neutral-400">{new Date(info.startsAt).toLocaleString()} · {info.durationMinutes} min · {roleLabel[info.myRole]}</p>}
              {isDemo && <p className="text-xs text-neutral-400">An open practice room — anyone with the link can join.</p>}
            </div>
            {isDemo && (
              <input value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength={40} placeholder="Your name" aria-label="Your name"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none" />
            )}
            <ul className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-[11px] text-neutral-400">
              <li>• Your browser will ask for camera and microphone access — please allow both.</li>
              <li>• Use headphones to avoid echo.</li>
              {info && info.kind === "class" && <li>• Group class: {info.learners.length} learner(s) enrolled.</li>}
            </ul>
            {info && !info.active && <p className="text-center text-xs text-rose-300">This session has been cancelled.</p>}
            {info && info.active && !info.opensNow && info.myRole !== "ADMIN" && (
              <p className="text-center text-xs text-amber-300">The classroom opens at {opensAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (15 minutes before the start). This page will not refresh by itself — reload when it is time.</p>
            )}
            <button disabled={!canJoin} onClick={() => setJoined(true)} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">Join classroom</button>
          </>
        )}
      </div>
    </div>
  );
}
