import React, { useState, useRef, useEffect } from "react";
import { 
  Video, VideoOff, Mic, MicOff, BookOpen, PenTool, Type, Trash2, 
  ChevronLeft, ChevronRight, HelpCircle, Volume2, Plus, LogOut, Check,
  Sparkles, MessageSquare, AlertTriangle, Play, Pause, Award
} from "lucide-react";
import { Lesson, Student, Tutor, MOCK_QURAN_PAGES } from "../data/mockData";
import { useSEO } from "../hooks/useSEO";

interface ClassroomProps {
  lesson: Lesson;
  student: Student;
  tutor: Tutor;
  onExit: () => void;
  onCompleteLesson: (notes: string, mistakes: { type: string; description: string; severity: "minor" | "major" }[]) => void;
}

export default function Classroom({ lesson, student, tutor, onExit, onCompleteLesson }: ClassroomProps) {
  useSEO({ title: "Live Classroom", noindex: true });

  // Video and Audio States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Quran Viewer States
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Default to Surah Al-Kahf
  const [selectedVerseId, setSelectedVerseId] = useState<string | null>("v4");
  const [isSyncActive, setIsSyncActive] = useState(true);

  // Whiteboard States
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [brushColor, setBrushColor] = useState("#ef4444"); // Default red pen
  const [brushWidth, setBrushWidth] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Live Chat States
  const [chatMessages, setChatMessages] = useState<{ sender: "tutor" | "student"; text: string; time: string }[]>([
    { sender: "tutor", text: "Assalamu Alaikum, Zayd! Let's start with Surah Al-Kahf today.", time: "10:02 AM" },
    { sender: "student", text: "Wa Alaikum Assalam, Sheikh Ahmed. Yes, I am ready.", time: "10:03 AM" }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Tutor Mistake Tracker (Logged during live session)
  const [sessionMistakes, setSessionMistakes] = useState<{ id: string; type: "Ghunnah" | "Madd" | "Makhraj" | "Qalqalah"; description: string; severity: "minor" | "major" }[]>([]);
  const [newMistakeType, setNewMistakeType] = useState<"Ghunnah" | "Madd" | "Makhraj" | "Qalqalah">("Ghunnah");
  const [newMistakeDesc, setNewMistakeDesc] = useState("");
  const [newMistakeSeverity, setNewMistakeSeverity] = useState<"minor" | "major">("minor");

  // Audio Pronunciation Simulator
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioNotes, setAudioNotes] = useState<string | null>(null);

  // Lesson Notes State
  const [sessionNotes, setSessionNotes] = useState("");

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle Camera Request via WebRTC
  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setCameraError(null);
        })
        .catch((err) => {
          console.warn("Camera access denied or unavailable", err);
          setCameraError("Camera permission denied. Rendering high-fidelity avatar placeholder.");
          setCameraActive(false);
        });
    } else {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  // Whiteboard drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    ctx.beginPath();
    
    // Get correct coordinates
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Resize canvas handler
  useEffect(() => {
    if (isWhiteboardActive && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 500;
    }
  }, [isWhiteboardActive]);

  // Simulated Tajweed Audio Helper
  const playVerseAudio = (verseId: string, text: string) => {
    setPlayingAudioId(verseId);
    setAudioNotes(`Reciting: "${text}" with expert Tajweed rules.`);
    setTimeout(() => {
      setPlayingAudioId(null);
    }, 3000);
  };

  // Add mistake helper
  const handleAddMistake = () => {
    if (!newMistakeDesc.trim()) return;
    const newMistake = {
      id: "mistake-" + Date.now(),
      type: newMistakeType,
      description: newMistakeDesc,
      severity: newMistakeSeverity
    };
    setSessionMistakes([...sessionMistakes, newMistake]);
    setNewMistakeDesc("");
    
    // Auto post message to classroom chat
    setChatMessages(prev => [
      ...prev,
      {
        sender: "tutor",
        text: `⚠️ [Observation Logged] - ${newMistakeType} (${newMistakeSeverity}): "${newMistake.description}"`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      {
        sender: "tutor", // Simulated as tutor workspace or student depending on preview focus
        text: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setNewMessage("");

    // Fast AI response mockup for demonstration high interactivity
    setTimeout(() => {
      if (newMessage.toLowerCase().includes("how") || newMessage.toLowerCase().includes("tajweed")) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: "student",
            text: "Got it, Sheikh. Could you please show me the correct throat exit point for this letter?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }, 1500);
  };

  const activePage = MOCK_QURAN_PAGES[currentPageIndex];

  return (
    <div id="classroom-window" className="fixed inset-0 bg-neutral-950 text-white z-50 flex flex-col overflow-hidden font-sans">
      
      {/* CLASSROOM TOP HEADBAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-emerald-950/80 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>LIVE SESSION</span>
          </div>
          <span className="text-neutral-500">|</span>
          <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase">
            {lesson.topic}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden md:block">
            <p className="text-xs text-neutral-400 font-medium">Student in Session</p>
            <p className="text-sm font-bold text-emerald-400">{student.name} ({student.level})</p>
          </div>
          <img 
            src={student.avatar} 
            alt={student.name} 
            className="w-10 h-10 rounded-full border border-neutral-700 object-cover" 
          />
          <button 
            onClick={onExit}
            className="flex items-center space-x-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs px-3.5 py-2 rounded-xl transition border border-neutral-700"
          >
            <LogOut size={14} />
            <span>Leave Class</span>
          </button>
        </div>
      </div>

      {/* CLASSROOM WORKSPACE CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT WORKSPACE: QURAN VIEWER & WHITEBOARD (Takes major grid) */}
        <div className="flex-1 flex flex-col bg-neutral-900 border-r border-neutral-800 relative overflow-hidden">
          
          {/* WHITEBOARD & VIEW CONTROLS */}
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-800 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-neutral-300 mr-2 flex items-center">
                <BookOpen size={14} className="mr-1 text-emerald-500" /> Quran Study Space
              </span>
              <button
                onClick={() => setIsSyncActive(!isSyncActive)}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                  isSyncActive 
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40" 
                    : "bg-neutral-800 text-neutral-400 border-neutral-700"
                }`}
              >
                {isSyncActive ? "✓ Screens Synchronized" : "✦ Solo Mode"}
              </button>
              
              <button
                onClick={() => setIsWhiteboardActive(!isWhiteboardActive)}
                className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1 transition ${
                  isWhiteboardActive 
                    ? "bg-red-950/80 text-red-400 border-red-500/40" 
                    : "bg-neutral-800 text-neutral-400 border-neutral-700"
                }`}
              >
                <PenTool size={12} />
                <span>{isWhiteboardActive ? "Whiteboard Open" : "Open Whiteboard"}</span>
              </button>
            </div>

            {/* WHITEBOARD PALETTE (Conditional) */}
            {isWhiteboardActive && (
              <div className="flex items-center space-x-3 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 animate-fade-in">
                <span className="text-neutral-500 text-[10px]">Brush:</span>
                <button 
                  onClick={() => setBrushColor("#ef4444")}
                  className={`w-4 h-4 rounded-full bg-red-500 border ${brushColor === "#ef4444" ? "ring-2 ring-white" : ""}`}
                />
                <button 
                  onClick={() => setBrushColor("#3b82f6")}
                  className={`w-4 h-4 rounded-full bg-blue-500 border ${brushColor === "#3b82f6" ? "ring-2 ring-white" : ""}`}
                />
                <button 
                  onClick={() => setBrushColor("#10b981")}
                  className={`w-4 h-4 rounded-full bg-emerald-500 border ${brushColor === "#10b981" ? "ring-2 ring-white" : ""}`}
                />
                <button 
                  onClick={() => setBrushColor("#f59e0b")}
                  className={`w-4 h-4 rounded-full bg-amber-500 border ${brushColor === "#f59e0b" ? "ring-2 ring-white" : ""}`}
                />
                <button
                  onClick={clearCanvas}
                  className="p-1 hover:text-red-400 text-neutral-400 transition"
                  title="Clear Whiteboard"
                  aria-label="Clear whiteboard"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}

            {/* PAGE CONTROL BUTTONS */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                className="p-1.5 bg-neutral-800 rounded-lg text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-700 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-neutral-300">Page {activePage.pageNumber}</span>
              <button 
                onClick={() => setCurrentPageIndex(Math.min(MOCK_QURAN_PAGES.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === MOCK_QURAN_PAGES.length - 1}
                className="p-1.5 bg-neutral-800 rounded-lg text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-700 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* MAIN QURAN AND CANVAS DISPLAY ZONE */}
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 relative overflow-y-auto">
            
            {/* Whiteboard Layer Overlay */}
            {isWhiteboardActive && (
              <canvas
                id="whiteboard-canvas"
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 z-20 cursor-crosshair touch-none"
              />
            )}

            {/* Quran Presentation Sheet */}
            <div id="quran-sheet" className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col select-none relative z-10 transition-transform duration-300">
              <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950/60 flex justify-between items-center text-xs">
                <span className="text-emerald-400 font-semibold tracking-wide uppercase font-mono">
                  {activePage.surahName}
                </span>
                <span className="text-neutral-500 font-semibold">
                  Juz {currentPageIndex === 0 ? "15" : "30"}
                </span>
              </div>

              {/* Quran Lines */}
              <div className="p-8 flex flex-col space-y-8 divide-y divide-neutral-800/60 text-right leading-loose">
                {activePage.verses.map((verse) => (
                  <div 
                    key={verse.id}
                    onClick={() => {
                      if (!isWhiteboardActive) {
                        setSelectedVerseId(verse.id);
                      }
                    }}
                    className={`pt-6 first:pt-0 group relative cursor-pointer rounded-xl p-3.5 transition duration-300 ${
                      selectedVerseId === verse.id 
                        ? "bg-amber-950/40 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.08)]" 
                        : "hover:bg-neutral-800/30 border border-transparent"
                    }`}
                  >
                    {/* Verse actions / hover icons */}
                    <div className="absolute left-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          playVerseAudio(verse.id, verse.arabic);
                        }}
                        className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                        title="Simulate Tajweed Audio"
                      >
                        <Volume2 size={13} className={playingAudioId === verse.id ? "text-emerald-400 animate-bounce" : ""} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVerseId(verse.id);
                        }}
                        className="p-1.5 rounded-md bg-neutral-800 hover:bg-amber-500 text-neutral-300 hover:text-white transition"
                        title="Highlight Verse"
                      >
                        <Sparkles size={13} />
                      </button>
                    </div>

                    {/* Verse Arabic Text */}
                    <p className="text-3xl font-normal text-amber-100 font-serif leading-[2.5] tracking-wide text-right selection:bg-amber-500/30 select-none">
                      {verse.arabic}
                      <span className="inline-flex justify-center items-center w-8 h-8 rounded-full border-2 border-amber-500/40 text-amber-500 text-xs font-serif font-bold mx-2 select-none">
                        {verse.id === "v1" ? "١" : verse.id === "v2" ? "٢" : verse.id === "v3" ? "٣" : verse.id === "v4" ? "١" : verse.id === "v5" ? "٢" : "٣"}
                      </span>
                    </p>

                    {/* English translation */}
                    <p className="text-xs text-neutral-400 text-left mt-3.5 leading-relaxed font-sans max-w-xl italic">
                      {verse.translation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Tip banner */}
            {audioNotes && (
              <div className="mt-4 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs flex items-center space-x-2 animate-bounce">
                <Volume2 size={14} className="animate-pulse" />
                <span>{audioNotes}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: WEBCAM STREAMS + TUTOR ASSISTANT & CHAT (Multi-tab) */}
        <div className="w-full lg:w-96 flex flex-col bg-neutral-950 overflow-y-auto">
          
          {/* WEBCAM GRID */}
          <div className="p-4 grid grid-cols-2 gap-3 bg-neutral-900 border-b border-neutral-800">
            
            {/* Student Stream (Live WebRTC or high-fidelity simulator) */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
              {cameraActive ? (
                <video 
                  id="local-camera-stream"
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-2 p-2">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-700">
                    <VideoOff size={18} />
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium text-center">Camera Inactive</span>
                </div>
              )}
              
              {/* Controls bar */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <span className="bg-neutral-900/80 backdrop-blur-sm text-[9px] px-2 py-0.5 rounded text-white font-medium">
                  {student.name} (Student)
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCameraActive(!cameraActive)}
                    className={`p-1.5 rounded-md backdrop-blur-sm transition ${
                      cameraActive ? "bg-emerald-600 hover:bg-emerald-500" : "bg-neutral-800 hover:bg-neutral-700"
                    }`}
                    title="Toggle WebRTC Video"
                    aria-label={cameraActive ? "Turn camera off" : "Turn camera on"}
                  >
                    {cameraActive ? <Video size={11} /> : <VideoOff size={11} />}
                  </button>
                  <button
                    onClick={() => setMicActive(!micActive)}
                    className={`p-1.5 rounded-md backdrop-blur-sm transition ${
                      micActive ? "bg-emerald-600 hover:bg-emerald-500" : "bg-neutral-800 hover:bg-neutral-700"
                    }`}
                    title="Toggle Mic"
                    aria-label={micActive ? "Mute microphone" : "Unmute microphone"}
                  >
                    {micActive ? <Mic size={11} /> : <MicOff size={11} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Tutor Stream (Simulated high-quality video feed with audio wave) */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
              <div className="w-full h-full relative">
                {/* Simulated webcam video using beautiful animated gradient waves or tutor image */}
                <img 
                  src={tutor.avatar} 
                  alt={tutor.name} 
                  className="w-full h-full object-cover opacity-60" 
                />
                
                {/* Dynamic voice activity indicator */}
                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-neutral-950 to-transparent flex items-end justify-center p-2 pb-6">
                  <div className="flex items-end justify-center space-x-0.5 h-6">
                    <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-4" />
                    <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-5" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-3" style={{ animationDelay: '0.4s' }} />
                    <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-6" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-4" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-2 left-2 right-2">
                <span className="bg-neutral-900/80 backdrop-blur-sm text-[9px] px-2 py-0.5 rounded text-white font-medium">
                  {tutor.name} (Tutor)
                </span>
              </div>
            </div>

          </div>

          {/* CHAT TAB / LIVE MISTAKE TRACKER */}
          <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
            
            {/* IN-SESSION MISTAKE LOGGING (Tutor Workspace Feature) */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center">
                  <AlertTriangle size={13} className="text-amber-500 mr-1.5" /> Live Mistake Logger
                </h3>
                <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Tutor Mode
                </span>
              </div>

              {/* Form to log dynamic mistake */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <select 
                    value={newMistakeType}
                    onChange={(e) => setNewMistakeType(e.target.value as any)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ghunnah">Ghunnah (Nasal)</option>
                    <option value="Madd">Madd (Stretch)</option>
                    <option value="Makhraj">Makhraj (Exit)</option>
                    <option value="Qalqalah">Qalqalah (Echo)</option>
                  </select>
                  <select 
                    value={newMistakeSeverity}
                    onChange={(e) => setNewMistakeSeverity(e.target.value as any)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="minor">Minor Mistake</option>
                    <option value="major">Major Mistake</option>
                  </select>
                </div>
                
                <div className="flex space-x-1.5">
                  <input 
                    type="text"
                    value={newMistakeDesc}
                    onChange={(e) => setNewMistakeDesc(e.target.value)}
                    placeholder="Describe mistake (e.g., Shortened Madd on Verse 4)"
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-500"
                  />
                  <button
                    onClick={handleAddMistake}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Active Session mistakes */}
              {sessionMistakes.length > 0 ? (
                <div className="mt-3.5 space-y-1.5 max-h-24 overflow-y-auto">
                  {sessionMistakes.map((mistake) => (
                    <div 
                      key={mistake.id}
                      className="flex items-center justify-between text-[11px] bg-neutral-900/80 border border-neutral-800 p-1.5 rounded-lg"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${mistake.severity === "major" ? "bg-red-500 animate-pulse" : "bg-amber-400"}`} />
                        <span className="font-bold text-neutral-300">{mistake.type}</span>
                        <span className="text-neutral-400 truncate max-w-[180px]">{mistake.description}</span>
                      </div>
                      <button 
                        onClick={() => setSessionMistakes(sessionMistakes.filter(m => m.id !== mistake.id))}
                        className="text-neutral-500 hover:text-red-400 p-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-neutral-500 text-center mt-3">No mistakes recorded in this session. Excellent work!</p>
              )}
            </div>

            {/* CLASSROOM MESSENGER */}
            <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
              <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-950 flex items-center">
                <MessageSquare size={13} className="text-neutral-400 mr-2" />
                <span className="text-xs font-bold text-neutral-400">Classroom Live Chat</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col ${msg.sender === "tutor" ? "items-end" : "items-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                      msg.sender === "tutor" 
                        ? "bg-emerald-600/90 text-white rounded-tr-none" 
                        : "bg-neutral-800 text-neutral-200 rounded-tl-none"
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-neutral-600 mt-0.5 px-1">{msg.time}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center space-x-2">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message or instruction..."
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-2 rounded-xl transition"
                >
                  Send
                </button>
              </div>
            </div>

            {/* COMPLETE CLASS PANEL */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex flex-col space-y-3">
              <div className="text-xs">
                <label className="block font-bold text-neutral-300 mb-1">Tutor End-of-Session Notes</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="E.g., Great reciting today. Focus on Madd rules in Verses 15-20 of Surah Al-Kahf for homework."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-500 resize-none"
                />
              </div>

              <button
                onClick={() => onCompleteLesson(sessionNotes, sessionMistakes)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-neutral-950 hover:text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-emerald-500/10 transition duration-300 flex items-center justify-center space-x-2"
              >
                <Award size={14} />
                <span>Submit Assessment & End Class</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
