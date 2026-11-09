import React, { useState } from "react";
import { 
  BookOpen, Calendar, Clock, Award, Star, Compass, Play, CheckCircle,
  HelpCircle, ChevronRight, Zap, RefreshCw, BarChart2, BookOpenCheck, AlertTriangle
} from "lucide-react";
import { Student, Tutor, Lesson, TAJWEED_QUIZ } from "../data/mockData";
import Breadcrumbs from "./Breadcrumbs";
import { useSEO } from "../hooks/useSEO";

interface StudentPortalProps {
  student: Student;
  tutors: Tutor[];
  lessons: Lesson[];
  onJoinClass: (lesson: Lesson) => void;
  onBookLesson: (tutorId: string, dateTime: string, topic: string) => void;
  initialTutorId?: string;
  onNavigateHome?: () => void;
}

export default function StudentPortal({ 
  student, 
  tutors, 
  lessons, 
  onJoinClass, 
  onBookLesson, 
  initialTutorId,
  onNavigateHome
}: StudentPortalProps) {
  useSEO({ title: "Student Desk", noindex: true });

  const [activeTab, setActiveTab] = useState<"dashboard" | "booking" | "practice">("dashboard");
  const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id || "");
  const [bookingDay, setBookingDay] = useState("Monday");
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingTopic, setBookingTopic] = useState("Recitation practice and homework assessment");
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  // Focus on the pre-selected tutor and open booking tab when requested from landing page
  React.useEffect(() => {
    if (initialTutorId) {
      setSelectedTutorId(initialTutorId);
      setActiveTab("booking");
    }
  }, [initialTutorId]);

  // Practice Quiz states
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  // Timezone display options
  const [studentTimezone, setStudentTimezone] = useState(student.timeZone);

  // Convert tutor slot UTC time to student timezone
  // This simulates automatic timezone adjustment on the fly!
  const getConvertedTime = (utcHourStr: string) => {
    // Basic demonstration of timezone offset
    let offset = -4; // Default New York (UTC-4)
    if (studentTimezone.includes("London")) offset = 1; // London BST (UTC+1)
    if (studentTimezone.includes("Karachi")) offset = 5; // Karachi (UTC+5)
    if (studentTimezone.includes("Chicago")) offset = -5; // Chicago (UTC-5)

    const [hours, minutes] = utcHourStr.split(":").map(Number);
    let convertedHours = (hours + offset + 24) % 24;
    const ampm = convertedHours >= 12 ? "PM" : "AM";
    const displayHours = convertedHours % 12 === 0 ? 12 : convertedHours % 12;
    return `${displayHours}:${minutes === 0 ? "00" : minutes} ${ampm} (${studentTimezone.split("/")[1] || studentTimezone})`;
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutorId || !bookingSlot) return;

    // Simulate scheduling date next week
    const dateMap: { [key: string]: number } = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
    const today = new Date();
    const targetDayIndex = dateMap[bookingDay];
    const currentDayIndex = today.getDay();
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7; // Next week
    
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysToAdd);
    const dateString = targetDate.toISOString().split("T")[0];

    const targetIsoString = new Date(`${dateString}T${bookingSlot}:00Z`).toISOString();
    onBookLesson(selectedTutorId, targetIsoString, bookingTopic);

    setBookingStatus("Success! Your lesson is booked and synced.");
    setTimeout(() => {
      setBookingStatus(null);
      setBookingSlot("");
    }, 4000);
  };

  // Quiz submission
  const handleAnswerSelect = (optIdx: number) => {
    if (selectedAnswer !== null) return; // Answered already
    setSelectedAnswer(optIdx);
    if (optIdx === TAJWEED_QUIZ[currentQuizIdx].answer) {
      setQuizScore(quizScore + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuizIdx < TAJWEED_QUIZ.length - 1) {
      setCurrentQuizIdx(currentQuizIdx + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuizIdx(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizStarted(true);
  };

  // Find assigned tutor
  const assignedTutor = tutors.find(t => t.id === student.assignedTutorId) || tutors[0];

  const breadcrumbItems = [
    { 
      label: "Student Desk", 
      action: () => setActiveTab("dashboard"),
      icon: <BookOpen size={12} className="text-indigo-400" />
    },
    { 
      label: activeTab === "dashboard" 
        ? "Dashboard" 
        : activeTab === "booking" 
        ? "Book a Session" 
        : "Tajweed Practice Sandbox" 
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-neutral-200">
      
      <Breadcrumbs 
        items={breadcrumbItems}
        onHomeAction={onNavigateHome}
      />

      {/* STUDENT HEADER PROFILE CARD */}
      <div className="relative bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950 border border-neutral-800 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <img 
              src={student.avatar} 
              alt={student.name} 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-indigo-500/40 object-cover shadow-lg shadow-black/40" 
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">{student.name}</h1>
                <span className="bg-indigo-950 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  Grade Level: {student.level}
                </span>
              </div>
              <p className="text-neutral-400 text-sm mt-1">Enrolled in Quran Tutors Academy • Age {student.age}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-neutral-300 font-medium">
                <span className="flex items-center text-emerald-400">
                  <CheckCircle size={14} className="mr-1" /> {student.progress.attendanceRate}% Attendance
                </span>
                <span className="text-neutral-600">•</span>
                <span className="flex items-center text-indigo-400">
                  <Compass size={14} className="mr-1" /> Primary Tutor: {assignedTutor.name}
                </span>
                <span className="text-neutral-600">•</span>
                <span className="flex items-center text-neutral-400">
                  Timezone: {studentTimezone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 self-center md:self-auto">
            <select
              value={studentTimezone}
              onChange={(e) => setStudentTimezone(e.target.value)}
              className="bg-neutral-800 text-xs border border-neutral-700 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="America/New_York">US Eastern Time</option>
              <option value="Europe/London">London BST</option>
              <option value="Asia/Karachi">Pakistan Standard Time</option>
              <option value="America/Chicago">US Central Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* PORTAL NAVIGATION */}
      <div className="flex border-b border-neutral-800">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "dashboard" 
              ? "border-indigo-500 text-white" 
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <BarChart2 size={15} />
          <span>My Learning Desk</span>
        </button>
        <button
          onClick={() => setActiveTab("booking")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "booking" 
              ? "border-indigo-500 text-white" 
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Calendar size={15} />
          <span>Book Academy Tutor</span>
        </button>
        <button
          onClick={() => setActiveTab("practice")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "practice" 
              ? "border-indigo-500 text-white" 
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Zap size={15} />
          <span>Tajweed Practice Arena</span>
        </button>
      </div>

      {/* TAB BODY */}
      <div className="space-y-6">

        {/* TAB 1: DASHBOARD & ACTIVE LEARNING STATS */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* LEFT: UPCOMING LESSONS & PREV LOGS */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Calendar size={18} className="text-indigo-400 mr-2" /> My Scheduled Lessons
                </h3>

                {lessons.filter(l => l.studentId === student.id).length > 0 ? (
                  <div className="space-y-3">
                    {lessons.filter(l => l.studentId === student.id).map((lesson) => {
                      const lDate = new Date(lesson.dateTime);
                      const formattedDate = lDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                      const formattedTime = lDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div 
                          key={lesson.id} 
                          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-indigo-400">Interactive Class</span>
                            <h4 className="text-base font-bold text-white">{lesson.topic}</h4>
                            <p className="text-xs text-neutral-400 flex items-center">
                              <Clock size={12} className="mr-1" /> {lesson.duration} Mins • With {lesson.tutorName}
                            </p>
                            <p className="text-xs text-amber-400 font-semibold mt-1">
                              {formattedDate} at {formattedTime} (Timezone: {studentTimezone.split("/")[1] || studentTimezone})
                            </p>
                          </div>

                          <button
                            onClick={() => onJoinClass(lesson)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
                          >
                            <Play size={12} />
                            <span>Join Classroom</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400 text-xs">
                    No scheduled lessons. Click the "Book Academy Tutor" tab above to book your next lesson instantly!
                  </div>
                )}
              </div>

              {/* STUDY PROGRESS GRAPHICS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Academic Breakdown</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/60 text-center">
                    <p className="text-xs text-neutral-400 mb-1">Tajweed Accuracy</p>
                    <p className="text-2xl font-bold text-white">{student.progress.tajweedScore}%</p>
                    <p className="text-[10px] text-emerald-400 mt-2 font-semibold">↑ Excellent Pronunciation</p>
                  </div>

                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/60 text-center">
                    <p className="text-xs text-neutral-400 mb-1">Hifz (Memorization)</p>
                    <p className="text-2xl font-bold text-white">{student.progress.hifzProgress}%</p>
                    <p className="text-[10px] text-indigo-400 mt-2">Juz Completed: {student.progress.juzMemorized.join(", ")}</p>
                  </div>

                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/60 text-center">
                    <p className="text-xs text-neutral-400 mb-1">Syllabus Stage</p>
                    <p className="text-base font-bold text-amber-400 truncate mt-1">{student.progress.currentBook}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">{student.progress.currentChapter}</p>
                  </div>

                </div>

                {/* VISUAL COMPLETED SURAHS CHART */}
                <div className="pt-2">
                  <p className="text-xs font-bold text-neutral-300 mb-2">Completed Surahs Checklist</p>
                  <div className="flex flex-wrap gap-1.5">
                    {student.progress.surahsCompleted.map((surah) => (
                      <span key={surah} className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/15 px-2.5 py-1 rounded-full font-semibold flex items-center">
                        <CheckCircle size={10} className="mr-1" /> {surah}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* RIGHT PANEL: TUTOR ADVICE & COMPREHENSIVE MISTAKES */}
            <div className="space-y-6">
              
              {/* PRIMARY SCHOLAR PROFILE CARD */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center space-x-3">
                  <img src={assignedTutor.avatar} alt={assignedTutor.name} className="w-12 h-12 rounded-full object-cover border border-neutral-800" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{assignedTutor.name}</h4>
                    <p className="text-[10px] text-neutral-400">My Primary Scholar</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed italic bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800/40">
                  "Dear {student.name}, focus on controlling your breathing rules (Makharij) when stopping on long verses. Remember, consistency is the key to memorization."
                </p>
              </div>

              {/* MISTAKE ANALYSIS LOGS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center">
                    <AlertTriangle size={15} className="text-rose-500 mr-2" /> Recent Mistake Logs
                  </h3>
                  <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-semibold">
                    {student.progress.recentMistakes.length} Flagged
                  </span>
                </div>

                {student.progress.recentMistakes.length > 0 ? (
                  <div className="space-y-3">
                    {student.progress.recentMistakes.map((m) => (
                      <div key={m.id} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                            m.severity === "major" ? "bg-red-950 text-red-400" : "bg-amber-950 text-amber-400"
                          }`}>
                            {m.type} • {m.severity}
                          </span>
                          <span className="text-[9px] text-neutral-600">{m.date}</span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">{m.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 text-center py-4">No mistakes flagged! Splendid recitation accuracy.</p>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: AUTOSCHEDULER BOOKING HUB */}
        {activeTab === "booking" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6 max-w-3xl mx-auto animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Calendar size={20} className="text-indigo-400 mr-2" /> Automated Scholar Scheduling
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Choose an expert tutor. Our calendar automatically syncs their availability template in real time and handles complex timezone translations for your parent portal seamlessly.
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-5 text-xs">
              
              {/* SELECT TUTOR */}
              <div className="space-y-2">
                <label className="font-bold text-neutral-300">Choose Academic Scholar</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tutors.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setSelectedTutorId(t.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        selectedTutorId === t.id 
                          ? "bg-indigo-950/40 border-indigo-500 shadow-md" 
                          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-white">{t.name}</p>
                          <p className="text-[10px] text-neutral-400">{t.experience} exp • {t.timeZone.split("/")[1]}</p>
                        </div>
                      </div>
                      <span className="text-amber-400 font-bold flex items-center text-[11px]">
                        ★ {t.rating}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SELECT DATE DAY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Select Day of Lesson</label>
                  <select 
                    value={bookingDay}
                    onChange={(e) => setBookingDay(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                {/* SELECT SLOT (AUTO-TRANSLATED) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Available Slots (Translated to your local time)</label>
                  <select 
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose a local slot --</option>
                    {/* Render matching slots from tutor template */}
                    {(tutors.find(t => t.id === selectedTutorId)?.availability[bookingDay] || []).map((utcTime) => (
                      <option key={utcTime} value={utcTime}>
                        {getConvertedTime(utcTime)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TOPIC INPUT */}
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-300">Lesson Material Topic Target</label>
                <input 
                  type="text"
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                  placeholder="E.g., Memorizing Surah Al-Kahf verses 15-25 with Tajweed assessment"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 placeholder-neutral-500"
                />
              </div>

              {/* ACTION */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!bookingSlot}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg disabled:opacity-45 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center space-x-2"
                >
                  <Calendar size={14} />
                  <span>Confirm Automated Lesson Booking</span>
                </button>
              </div>

              {bookingStatus && (
                <div className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-center font-semibold animate-pulse">
                  {bookingStatus}
                </div>
              )}

            </form>
          </div>
        )}

        {/* TAB 3: TAJWEED PRACTICE ARENA */}
        {activeTab === "practice" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Zap size={20} className="text-amber-400 mr-2" /> Tajweed Practice Quiz
                </h3>
                <p className="text-xs text-neutral-400">Perfect your academic understanding of vowel rules, echoing, and letter exit points.</p>
              </div>
              <span className="text-xs bg-indigo-950 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/10 font-bold">
                Level: General
              </span>
            </div>

            {!quizStarted ? (
              <div className="p-8 text-center space-y-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Award size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Unlock Tajweed Competency Badges</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">Take this dynamic 3-question evaluation prepared by Quran Tutors Academy scholars to boost your score.</p>
                </div>
                <button
                  onClick={() => restartQuiz()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/15"
                >
                  Start Practice Quiz Now
                </button>
              </div>
            ) : quizFinished ? (
              <div className="p-8 text-center space-y-4 bg-neutral-950 rounded-2xl border border-neutral-800 animate-scale-up">
                <div className="text-5xl font-bold text-emerald-400">
                  {quizScore} / {TAJWEED_QUIZ.length}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Assessment Complete!</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    {quizScore === TAJWEED_QUIZ.length 
                      ? "Masha Allah! You got a perfect score. Your understanding of rules is flawless." 
                      : "Good effort! Review the rules on Makharij and Qalqalah to achieve perfection."}
                  </p>
                </div>
                <div className="flex justify-center space-x-2 pt-2">
                  <button
                    onClick={() => restartQuiz()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => setQuizStarted(false)}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs px-5 py-2.5 rounded-xl transition border border-neutral-700"
                  >
                    Back to Arena
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300" 
                    style={{ width: `${((currentQuizIdx) / TAJWEED_QUIZ.length) * 100}%` }} 
                  />
                </div>

                <div className="space-y-2 bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
                  <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wide">
                    Question {currentQuizIdx + 1} of {TAJWEED_QUIZ.length}
                  </span>
                  <h4 className="text-base font-bold text-white leading-relaxed">
                    {TAJWEED_QUIZ[currentQuizIdx].question}
                  </h4>
                </div>

                {/* Option buttons */}
                <div className="grid grid-cols-1 gap-2.5">
                  {TAJWEED_QUIZ[currentQuizIdx].options.map((option, idx) => {
                    const isAnswered = selectedAnswer !== null;
                    const isCorrect = idx === TAJWEED_QUIZ[currentQuizIdx].answer;
                    const isChosen = idx === selectedAnswer;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-xl text-left text-xs font-semibold transition flex items-center justify-between border ${
                          !isAnswered 
                            ? "bg-neutral-950 border-neutral-800 hover:bg-neutral-800/50 hover:border-indigo-500/40 text-neutral-300" 
                            : isCorrect 
                              ? "bg-emerald-950/40 border-emerald-500 text-emerald-400" 
                              : isChosen 
                                ? "bg-rose-950/40 border-rose-500 text-rose-400" 
                                : "bg-neutral-950/20 border-neutral-900 text-neutral-500"
                        }`}
                      >
                        <span>{option}</span>
                        {isAnswered && isCorrect && <span className="text-xs text-emerald-400 font-bold">Correct ✓</span>}
                        {isAnswered && isChosen && !isCorrect && <span className="text-xs text-rose-400 font-bold">Incorrect ✗</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Scholarly tip explanation */}
                {selectedAnswer !== null && (
                  <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed animate-fade-in">
                    <strong>Scholar Tip:</strong> {TAJWEED_QUIZ[currentQuizIdx].tip}
                  </div>
                )}

                {/* Next button */}
                {selectedAnswer !== null && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={nextQuestion}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center space-x-1"
                    >
                      <span>{currentQuizIdx === TAJWEED_QUIZ.length - 1 ? "Finish Assessment" : "Next Question"}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
