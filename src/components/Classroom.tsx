import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen, MessageSquare, Send, LogOut, AlertTriangle, Plus, ChevronLeft, ChevronRight, Loader2, Mic, MicOff, Video, VideoOff
} from "lucide-react";
import { accountRequest } from "../lib/api";

// --- Session helper ---
function getSession(): { token: string; name: string; role: string } | null {
  for (const r of ["tutor", "guardian", "student"]) {
    try {
      const raw = sessionStorage.getItem(`qta_session_${r}`);
      if (raw) { const s = JSON.parse(raw); if (s?.token) return s; }
    } catch { /* continue */ }
  }
  return null;
}

// --- Quran snippet data (inline — no mockData dependency) ---
const SURAH_PAGES = [
  {
    surah: "Al-Fatiha (1)", verses: [
      { n: 1, ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", en: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
      { n: 2, ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", en: "All praise is due to Allah, Lord of the worlds." },
      { n: 3, ar: "الرَّحْمَٰنِ الرَّحِيمِ", en: "The Entirely Merciful, the Especially Merciful." },
      { n: 4, ar: "مَالِكِ يَوْمِ الدِّينِ", en: "Sovereign of the Day of Recompense." },
      { n: 5, ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", en: "It is You we worship and You we ask for help." },
      { n: 6, ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", en: "Guide us to the straight path." },
      { n: 7, ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", en: "The path of those upon whom You have bestowed favor, not of those who have earned anger or of those who are astray." },
    ]
  },
  {
    surah: "Al-Ikhlas (112)", verses: [
      { n: 1, ar: "قُلْ هُوَ اللَّهُ أَحَدٌ", en: "Say, 'He is Allah, [who is] One.'" },
      { n: 2, ar: "اللَّهُ الصَّمَدُ", en: "Allah, the Eternal Refuge." },
      { n: 3, ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ", en: "He neither begets nor is born." },
      { n: 4, ar: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", en: "Nor is there to Him any equivalent." },
    ]
  },
  {
    surah: "Al-Falaq (113)", verses: [
      { n: 1, ar: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", en: "Say, 'I seek refuge in the Lord of daybreak'" },
      { n: 2, ar: "مِن شَرِّ مَا خَلَقَ", en: "From the evil of that which He created" },
      { n: 3, ar: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", en: "And from the evil of darkness when it settles" },
      { n: 4, ar: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", en: "And from the evil of the blowers in knots" },
      { n: 5, ar: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", en: "And from the evil of an envier when he envies." },
    ]
  },
];

type Mistake = { id: string; type: string; description: string; severity: "minor" | "major" };
type Msg = { id: string; fromId: string; body: string; createdAt: string };

type BookingInfo = {
  id: string;
  status: string;
  scheduledAtUtc: string;
  durationMinutes: number;
  myRole: "TUTOR" | "STUDENT";
  tutorName: string;
  studentName: string;
  tutor: { accountId: string };
  student: { id: string };
};

export default function Classroom() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const session = getSession();

  const isDemo = !bookingId || bookingId === "demo";
  const roomName = isDemo ? "qta-academy-open-demo" : `qta-classroom-${bookingId}`;

  // --- Jitsi state ---
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [jitsiReady, setJitsiReady] = useState(false);
  const [jitsiLoaded, setJitsiLoaded] = useState(!!(window as any).JitsiMeetExternalAPI);

  // --- Booking info ---
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [bookingLoading, setBookingLoading] = useState(!isDemo);

  // --- Chat ---
  const [messages, setMessages] = useState<Msg[]>([]);
  const [myId, setMyId] = useState<string>("");
  const [otherId, setOtherId] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Mistake logger (tutor only) ---
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [newMistakeType, setNewMistakeType] = useState("Makhraj");
  const [newMistakeDesc, setNewMistakeDesc] = useState("");
  const [newMistakeSeverity, setNewMistakeSeverity] = useState<"minor" | "major">("minor");

  // --- Quran viewer ---
  const [surahIdx, setSurahIdx] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);

  // --- Side panel ---
  const [panel, setPanel] = useState<"chat" | "quran" | "mistakes">("chat");

  // Load Jitsi script
  useEffect(() => {
    if ((window as any).JitsiMeetExternalAPI) { setJitsiLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => setJitsiLoaded(true);
    script.onerror = () => console.error("Failed to load Jitsi external API");
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch { /* already removed */ } };
  }, []);

  // Fetch booking info
  useEffect(() => {
    if (isDemo || !session || !bookingId) { setBookingLoading(false); return; }
    accountRequest(`/classroom/${bookingId}`, session.token)
      .then((data: BookingInfo) => { setBooking(data); setBookingLoading(false); })
      .catch(() => setBookingLoading(false));
  }, [bookingId, isDemo]);

  // Determine otherId for chat once booking loaded
  useEffect(() => {
    if (!booking || !session) return;
    if (booking.myRole === "TUTOR") setOtherId(booking.student.id);
    else setOtherId(booking.tutor.accountId);
  }, [booking]);

  // Initialize Jitsi once script loaded + container ready
  useEffect(() => {
    if (!jitsiLoaded || !jitsiContainerRef.current || jitsiApiRef.current) return;
    const displayName = session?.name ?? "Guest";
    try {
      const api = new (window as any).JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ["microphone", "camera", "desktop", "chat", "raisehand", "fullscreen", "tileview", "hangup"],
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          MOBILE_APP_PROMO: false,
        },
      });
      jitsiApiRef.current = api;
      api.addEventListener("videoConferenceJoined", () => setJitsiReady(true));
    } catch (err) {
      console.error("Jitsi init error:", err);
    }
    return () => { if (jitsiApiRef.current) { try { jitsiApiRef.current.dispose(); } catch { /* ignore */ } jitsiApiRef.current = null; } };
  }, [jitsiLoaded, roomName]);

  // Poll chat messages
  const fetchMessages = useCallback(async () => {
    if (!session || !otherId) return;
    try {
      const data = await accountRequest(`/messages?with=${otherId}`, session.token) as { messages: Msg[]; myId: string };
      setMessages(data.messages ?? []);
      setMyId(data.myId ?? "");
    } catch { /* ignore */ }
  }, [session, otherId]);

  useEffect(() => {
    if (!otherId) return;
    fetchMessages();
    const id = setInterval(fetchMessages, 5000);
    return () => clearInterval(id);
  }, [otherId, fetchMessages]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !session || !otherId) return;
    const body = chatInput.trim();
    setChatInput("");
    try { await accountRequest("/messages", session.token, "POST", { toId: otherId, body }); fetchMessages(); }
    catch { /* ignore */ }
  };

  const addMistake = () => {
    if (!newMistakeDesc.trim()) return;
    setMistakes(prev => [...prev, {
      id: Date.now().toString(),
      type: newMistakeType,
      description: newMistakeDesc.trim(),
      severity: newMistakeSeverity,
    }]);
    setNewMistakeDesc("");
  };

  const removeMistake = (id: string) => setMistakes(prev => prev.filter(m => m.id !== id));

  const handleLeave = () => {
    if (jitsiApiRef.current) { try { jitsiApiRef.current.executeCommand("hangup"); } catch { /* ignore */ } }
    navigate(-1);
  };

  const curSurah = SURAH_PAGES[surahIdx];
  const curVerse = curSurah.verses[verseIdx];

  if (bookingLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <Loader2 size={32} className="text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="text-neutral-400 hover:text-white transition">
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-bold text-white">
              {isDemo ? "Demo Classroom — Quran Tutors Academy" : booking ? `${booking.tutorName} & ${booking.studentName}` : "Live Classroom"}
            </p>
            {!isDemo && booking && (
              <p className="text-[10px] text-neutral-400 font-mono">
                {new Date(booking.scheduledAtUtc).toLocaleString()} · {booking.durationMinutes} min
              </p>
            )}
            {isDemo && (
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Open demo room — anyone can join
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
        >
          <LogOut size={13} /> Leave
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Jitsi video — left / main */}
        <div className="flex-1 relative bg-neutral-950 min-w-0">
          {!jitsiLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="text-emerald-400 animate-spin" />
              <p className="text-xs text-neutral-400">Loading video conference...</p>
            </div>
          )}
          <div ref={jitsiContainerRef} className="w-full h-full" />
        </div>

        {/* Right panel */}
        <div className="w-80 flex flex-col bg-neutral-900 border-l border-neutral-800 shrink-0">
          {/* Panel tabs */}
          <div className="flex border-b border-neutral-800 shrink-0">
            {[
              { id: "chat" as const, label: "Chat", icon: MessageSquare },
              { id: "quran" as const, label: "Quran", icon: BookOpen },
              ...((booking?.myRole === "TUTOR" || isDemo) ? [{ id: "mistakes" as const, label: "Mistakes", icon: AlertTriangle }] : []),
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPanel(id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-bold transition border-b-2 ${
                  panel === id ? "border-emerald-400 text-emerald-400" : "border-transparent text-neutral-500 hover:text-white"
                }`}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Chat panel */}
          {panel === "chat" && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {!session && (
                  <p className="text-[11px] text-neutral-500 text-center py-4">Sign in to use chat.</p>
                )}
                {session && !otherId && (
                  <p className="text-[11px] text-neutral-500 text-center py-4">
                    {isDemo ? "Chat available in booked sessions." : "Loading chat..."}
                  </p>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.fromId === myId ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                      m.fromId === myId ? "bg-emerald-700 text-white" : "bg-neutral-800 text-neutral-200"
                    }`}>
                      {m.body}
                    </div>
                    <span className="text-[9px] text-neutral-600 mt-0.5 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {session && otherId && (
                <form onSubmit={sendMessage} className="flex gap-2 p-2 border-t border-neutral-800 shrink-0">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-500"
                  />
                  <button type="submit" disabled={!chatInput.trim()} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-2.5 rounded-lg transition">
                    <Send size={13} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quran viewer */}
          {panel === "quran" && (
            <div className="flex flex-col flex-1 min-h-0 p-3 space-y-3">
              {/* Surah selector */}
              <div className="flex items-center justify-between">
                <button onClick={() => { setSurahIdx(i => Math.max(0, i - 1)); setVerseIdx(0); }} disabled={surahIdx === 0} className="text-neutral-400 hover:text-white disabled:opacity-30 transition">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-white">{curSurah.surah}</span>
                <button onClick={() => { setSurahIdx(i => Math.min(SURAH_PAGES.length - 1, i + 1)); setVerseIdx(0); }} disabled={surahIdx === SURAH_PAGES.length - 1} className="text-neutral-400 hover:text-white disabled:opacity-30 transition">
                  <ChevronRight size={16} />
                </button>
              </div>
              {/* Verse */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3 flex-1">
                <p className="text-xl font-bold text-white text-right leading-loose font-serif" dir="rtl">{curVerse.ar}</p>
                <div className="h-px bg-neutral-800" />
                <p className="text-[11px] text-neutral-400 leading-relaxed">{curVerse.en}</p>
                <p className="text-[9px] text-neutral-600 font-mono">Verse {curVerse.n} of {curSurah.verses.length}</p>
              </div>
              {/* Verse navigation */}
              <div className="flex items-center justify-between">
                <button onClick={() => setVerseIdx(i => Math.max(0, i - 1))} disabled={verseIdx === 0} className="text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition flex items-center gap-1">
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="text-[10px] text-neutral-500">{verseIdx + 1} / {curSurah.verses.length}</span>
                <button onClick={() => setVerseIdx(i => Math.min(curSurah.verses.length - 1, i + 1))} disabled={verseIdx === curSurah.verses.length - 1} className="text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition flex items-center gap-1">
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Mistake logger (tutor only) */}
          {panel === "mistakes" && (
            <div className="flex flex-col flex-1 min-h-0 p-3 space-y-3">
              <div className="space-y-2">
                <select value={newMistakeType} onChange={e => setNewMistakeType(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-xs text-white rounded-lg px-2 py-1.5 outline-none">
                  {["Makhraj", "Sifaat", "Qalqalah", "Ghunna", "Madd", "Idghaam", "Ikhfa", "Other"].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input value={newMistakeDesc} onChange={e => setNewMistakeDesc(e.target.value)}
                  placeholder="Description..."
                  className="w-full bg-neutral-800 border border-neutral-700 text-xs text-white rounded-lg px-2 py-1.5 outline-none placeholder-neutral-500 focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <button onClick={() => setNewMistakeSeverity("minor")}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition ${newMistakeSeverity === "minor" ? "bg-amber-950 border-amber-500 text-amber-300" : "border-neutral-700 text-neutral-500"}`}>
                    Minor
                  </button>
                  <button onClick={() => setNewMistakeSeverity("major")}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition ${newMistakeSeverity === "major" ? "bg-rose-950 border-rose-500 text-rose-300" : "border-neutral-700 text-neutral-500"}`}>
                    Major
                  </button>
                </div>
                <button onClick={addMistake} disabled={!newMistakeDesc.trim()}
                  className="w-full flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold py-1.5 rounded-lg transition">
                  <Plus size={12} /> Log Mistake
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {mistakes.length === 0 && <p className="text-[11px] text-neutral-500 text-center py-4">No mistakes logged yet.</p>}
                {mistakes.map(m => (
                  <div key={m.id} className={`rounded-lg border p-2.5 text-[10px] flex items-start justify-between gap-2 ${m.severity === "major" ? "bg-rose-950/40 border-rose-800" : "bg-amber-950/30 border-amber-800"}`}>
                    <div>
                      <span className="font-bold text-white">{m.type}</span>
                      <span className={`ml-1.5 text-[8px] uppercase font-bold px-1 py-0.5 rounded ${m.severity === "major" ? "bg-rose-800 text-rose-200" : "bg-amber-800 text-amber-200"}`}>{m.severity}</span>
                      <p className="text-neutral-300 mt-0.5">{m.description}</p>
                    </div>
                    <button onClick={() => removeMistake(m.id)} className="text-neutral-500 hover:text-rose-400 transition shrink-0">×</button>
                  </div>
                ))}
              </div>
              {mistakes.length > 0 && (
                <div className="text-center pt-1 border-t border-neutral-800">
                  <p className="text-[10px] text-neutral-500">{mistakes.length} mistake(s) — submitted when lesson ends</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
