import { useCallback, useEffect, useRef, useState } from "react";
import { accountRequest } from "./api";

export type PeerRole = "TUTOR" | "STUDENT" | "GUARDIAN" | "ADMIN" | "GUEST";
export type PeerInfo = { id: string; name: string; role: PeerRole; audio: boolean; video: boolean; hand: boolean };
export type RemotePeer = PeerInfo & { stream: MediaStream | null };
export type ChatLine = { id: string; peerId: string; name: string; text: string; at: number };
export type Stroke = { id: string; peer: string; color: string; w: number; pts: Array<[number, number]> };
export type MistakeEntry = { id: string; studentId: string | null; type: string; description: string; severity: "minor" | "major"; createdAt: string };
export type LiveStatus = "connecting" | "live" | "ended" | "error";

type ServerMessage = Record<string, unknown> & { t: string };

// The whiteboard keeps its strokes outside React state so drawing stays smooth.
export type Board = { strokes: Stroke[]; allow: boolean; listeners: Set<() => void> };

export type LiveRoomOptions = { roomKey: string; token?: string; guestName?: string };

const FALLBACK_ICE: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302"] }];

export function useLiveRoom({ roomKey, token, guestName }: LiveRoomOptions) {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [error, setError] = useState("");
  const [me, setMe] = useState<PeerInfo | null>(null);
  const [peers, setPeers] = useState<RemotePeer[]>([]);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [quran, setQuran] = useState<{ surah: number; ayah: number } | null>(null);
  const [recording, setRecording] = useState(false);
  const [boardAllow, setBoardAllow] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handUp, setHandUp] = useState(false);
  const [mediaNote, setMediaNote] = useState("");
  const [muteRequested, setMuteRequested] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pcs = useRef(new Map<string, RTCPeerConnection>());
  const pendingIce = useRef(new Map<string, RTCIceCandidateInit[]>());
  const iceServers = useRef<RTCIceServer[]>(FALLBACK_ICE);
  const camStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const meRef = useRef<PeerInfo | null>(null);
  const closing = useRef(false);
  const board = useRef<Board>({ strokes: [], allow: false, listeners: new Set() });
  const remoteStreams = useRef(new Map<string, MediaStream>());
  const streamListeners = useRef(new Set<(stream: MediaStream) => void>());

  const notifyBoard = () => board.current.listeners.forEach((listener) => listener());
  const sendWs = useCallback((payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }, []);

  const updatePeer = useCallback((id: string, patch: Partial<RemotePeer>) => {
    setPeers((current) => current.map((peer) => (peer.id === id ? { ...peer, ...patch } : peer)));
  }, []);

  const closePeer = useCallback((id: string) => {
    pcs.current.get(id)?.close();
    pcs.current.delete(id);
    pendingIce.current.delete(id);
    remoteStreams.current.delete(id);
  }, []);

  const createPc = useCallback((peerId: string, initiator: boolean) => {
    const pc = new RTCPeerConnection({ iceServers: iceServers.current });
    pcs.current.set(peerId, pc);
    const cam = camStream.current;
    const audioTrack = cam?.getAudioTracks()[0];
    const videoTrack = (screenStream.current ?? cam)?.getVideoTracks()[0];
    if (audioTrack && cam) pc.addTrack(audioTrack, cam); else pc.addTransceiver("audio", { direction: "recvonly" });
    if (videoTrack && cam) pc.addTrack(videoTrack, cam); else pc.addTransceiver("video", { direction: "recvonly" });

    pc.onicecandidate = (event) => {
      if (event.candidate) sendWs({ t: "signal", to: peerId, data: { candidate: event.candidate.toJSON() } });
    };
    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      remoteStreams.current.set(peerId, stream);
      updatePeer(peerId, { stream });
      streamListeners.current.forEach((listener) => listener(stream));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" && initiator) {
        void pc.createOffer({ iceRestart: true }).then(async (offer) => {
          await pc.setLocalDescription(offer);
          sendWs({ t: "signal", to: peerId, data: { sdp: pc.localDescription } });
        }).catch(() => undefined);
      }
    };
    return pc;
  }, [sendWs, updatePeer]);

  const offerTo = useCallback(async (peerId: string) => {
    const pc = createPc(peerId, true);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendWs({ t: "signal", to: peerId, data: { sdp: pc.localDescription } });
  }, [createPc, sendWs]);

  const onSignal = useCallback(async (from: string, data: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) => {
    let pc = pcs.current.get(from);
    if (data.sdp) {
      if (!pc) pc = createPc(from, false);
      await pc.setRemoteDescription(data.sdp);
      for (const candidate of pendingIce.current.get(from) ?? []) await pc.addIceCandidate(candidate).catch(() => undefined);
      pendingIce.current.delete(from);
      if (data.sdp.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWs({ t: "signal", to: from, data: { sdp: pc.localDescription } });
      }
    } else if (data.candidate) {
      if (pc && pc.remoteDescription) await pc.addIceCandidate(data.candidate).catch(() => undefined);
      else pendingIce.current.set(from, [...(pendingIce.current.get(from) ?? []), data.candidate]);
    }
  }, [createPc, sendWs]);

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.t) {
      case "welcome": {
        const self = message.you as PeerInfo;
        meRef.current = self;
        setMe(self);
        setPeers((message.peers as PeerInfo[]).map((peer) => ({ ...peer, stream: null })));
        const state = message.state as { quran: { surah: number; ayah: number } | null; strokes: Stroke[]; boardAllow: boolean; recording: boolean; chat: ChatLine[] };
        setQuran(state.quran); setChat(state.chat); setRecording(state.recording); setBoardAllow(state.boardAllow);
        board.current.strokes = state.strokes; board.current.allow = state.boardAllow; notifyBoard();
        setStatus("live");
        for (const peer of message.peers as PeerInfo[]) void offerTo(peer.id).catch(() => undefined);
        break;
      }
      case "peer-joined": {
        const peer = message.peer as PeerInfo;
        setPeers((current) => current.some((entry) => entry.id === peer.id) ? current : [...current, { ...peer, stream: null }]);
        break;
      }
      case "peer-left": {
        const id = String(message.id);
        closePeer(id);
        setPeers((current) => current.filter((peer) => peer.id !== id));
        break;
      }
      case "signal":
        void onSignal(String(message.from), message.data as { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }).catch(() => undefined);
        break;
      case "chat": setChat((current) => [...current.slice(-99), message.line as ChatLine]); break;
      case "hand": {
        const id = String(message.id);
        if (id === meRef.current?.id) setHandUp(message.up === true);
        updatePeer(id, { hand: message.up === true });
        break;
      }
      case "media": updatePeer(String(message.id), { audio: message.audio !== false, video: message.video !== false }); break;
      case "quran": setQuran({ surah: Number(message.surah), ayah: Number(message.ayah) }); break;
      case "rec": setRecording(message.on === true); break;
      case "mute-request": setMuteRequested(true); break;
      case "mistake": setMistakes((current) => [...current, message.mistake as MistakeEntry]); break;
      case "board": {
        const strokes = board.current.strokes;
        if (message.op === "allow") { board.current.allow = message.value === true; setBoardAllow(board.current.allow); }
        else if (message.op === "clear") board.current.strokes = [];
        else if (message.op === "remove") board.current.strokes = strokes.filter((stroke) => stroke.id !== message.id);
        else if (message.op === "seg") {
          const id = String(message.id);
          const pts = message.pts as Array<[number, number]>;
          const existing = strokes.find((stroke) => stroke.id === id);
          if (existing) existing.pts.push(...pts);
          else strokes.push({ id, peer: String(message.peer), color: String(message.color), w: Number(message.w), pts: [...pts] });
        }
        notifyBoard();
        break;
      }
      case "error": setError(String(message.error)); setStatus("error"); closing.current = true; break;
      default: break;
    }
  }, [closePeer, offerTo, onSignal, updatePeer]);

  useEffect(() => {
    closing.current = false;
    let cancelled = false;
    let retries = 0;

    async function start() {
      try {
        if (token) {
          const ice = await accountRequest<{ servers: RTCIceServer[] }>("/live/ice", token).catch(() => null);
          if (ice?.servers?.length) iceServers.current = ice.servers;
        }
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24, max: 30 } },
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaNote("Camera is unavailable — you joined with audio only.");
            setCamOn(false);
          } catch {
            setMediaNote("Microphone and camera are blocked. You can watch and listen, but others cannot hear you. Allow access in the browser address bar and rejoin.");
            setMicOn(false); setCamOn(false);
          }
        }
        if (cancelled) { stream?.getTracks().forEach((track) => track.stop()); return; }
        camStream.current = stream;
        setLocalStream(stream);
        connect();
      } catch (failure) {
        if (!cancelled) { setError(failure instanceof Error ? failure.message : "Could not start the classroom."); setStatus("error"); }
      }
    }

    async function connect() {
      const scheme = window.location.protocol === "https:" ? "wss" : "ws";
      const params = new URLSearchParams({ room: roomKey });
      if (token) {
        try {
          const { ticket } = await accountRequest<{ ticket: string }>("/live/ws-ticket", token, "POST");
          params.set("ticket", ticket);
        } catch (failure) {
          if (cancelled) return;
          setError(failure instanceof Error ? failure.message : "Could not start the classroom session.");
          setStatus("error");
          return;
        }
      } else {
        params.set("name", guestName || "Guest");
      }
      if (cancelled) return;
      const ws = new WebSocket(`${scheme}://${window.location.host}/api/live/ws?${params}`);
      wsRef.current = ws;
      ws.onmessage = (event) => { try { handleMessage(JSON.parse(event.data)); } catch { /* ignore malformed frames */ } };
      ws.onclose = () => {
        if (cancelled || closing.current) { if (!closing.current) setStatus("ended"); return; }
        pcs.current.forEach((_pc, id) => closePeer(id));
        setPeers([]);
        if (retries < 5) {
          retries += 1;
          setStatus("connecting");
          window.setTimeout(() => { if (!cancelled && !closing.current) connect(); }, 1000 * retries);
        } else {
          setError("The connection was lost. Reload the page to rejoin.");
          setStatus("error");
        }
      };
      ws.onopen = () => { retries = 0; };
    }

    void start();
    return () => {
      cancelled = true;
      closing.current = true;
      wsRef.current?.close();
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
      camStream.current?.getTracks().forEach((track) => track.stop());
      screenStream.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomKey, token]);

  const broadcastMedia = useCallback((audio: boolean, video: boolean) => sendWs({ t: "media", audio, video }), [sendWs]);

  const toggleMic = useCallback(() => {
    const track = camStream.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    broadcastMedia(track.enabled, camStream.current?.getVideoTracks()[0]?.enabled ?? false);
    setMuteRequested(false);
  }, [broadcastMedia]);

  const toggleCam = useCallback(() => {
    const track = camStream.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
    broadcastMedia(camStream.current?.getAudioTracks()[0]?.enabled ?? false, track.enabled);
  }, [broadcastMedia]);

  const replaceVideo = useCallback((track: MediaStreamTrack | null) => {
    pcs.current.forEach((pc) => {
      const sender = pc.getSenders().find((entry) => entry.track?.kind === "video") ?? pc.getTransceivers().find((entry) => entry.receiver.track.kind === "video")?.sender;
      if (sender) void sender.replaceTrack(track).catch(() => undefined);
    });
  }, []);

  const stopScreenShare = useCallback(() => {
    screenStream.current?.getTracks().forEach((track) => track.stop());
    screenStream.current = null;
    setScreenSharing(false);
    replaceVideo(camStream.current?.getVideoTracks()[0] ?? null);
  }, [replaceVideo]);

  const startScreenShare = useCallback(async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { max: 15 } }, audio: false });
      screenStream.current = display;
      setScreenSharing(true);
      const track = display.getVideoTracks()[0];
      track.onended = () => stopScreenShare();
      replaceVideo(track);
    } catch { /* the user dismissed the picker */ }
  }, [replaceVideo, stopScreenShare]);

  const raiseHand = useCallback((up: boolean) => sendWs({ t: "hand", up }), [sendWs]);
  const sendChat = useCallback((text: string) => sendWs({ t: "chat", text }), [sendWs]);
  const syncQuran = useCallback((surah: number, ayah: number) => { setQuran({ surah, ayah }); sendWs({ t: "quran", surah, ayah }); }, [sendWs]);
  const setRecordingFlag = useCallback((on: boolean) => { setRecording(on); sendWs({ t: "rec", on }); }, [sendWs]);
  const requestMute = useCallback((peerId: string) => sendWs({ t: "mute-request", peerId }), [sendWs]);
  const logMistake = useCallback((entry: { studentId?: string; type: string; description: string; severity: "minor" | "major" }) => sendWs({ t: "mistake", ...entry }), [sendWs]);
  const boardAction = useCallback((payload: Record<string, unknown>) => sendWs({ t: "board", ...payload }), [sendWs]);
  const seedMistakes = useCallback((entries: MistakeEntry[]) => setMistakes(entries), []);
  const onRemoteStream = useCallback((listener: (stream: MediaStream) => void) => {
    streamListeners.current.add(listener);
    return () => { streamListeners.current.delete(listener); };
  }, []);

  return {
    status, error, me, peers, chat, quran, recording, boardAllow, mistakes, localStream, screenSharing, micOn, camOn, handUp,
    mediaNote, muteRequested, board: board.current, remoteStreams: remoteStreams.current,
    toggleMic, toggleCam, startScreenShare, stopScreenShare, raiseHand, sendChat, syncQuran, setRecordingFlag, requestMute,
    logMistake, boardAction, seedMistakes, onRemoteStream, dismissMuteRequest: () => setMuteRequested(false),
  };
}
