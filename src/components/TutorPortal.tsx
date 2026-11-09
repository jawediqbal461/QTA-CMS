import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, Clock, BookOpen, Star, Award, TrendingUp, AlertCircle,
  TrendingDown, Sparkles, ArrowUpRight, ArrowDownRight,
  Video, Plus, CheckCircle, Clock3, MapPin, Check, Sliders, ListFilter,
  CheckSquare, BookOpenCheck, Edit, ShieldAlert, FileText, ChevronRight,
  Database, Code2, Terminal, Wifi, Copy, Activity, VideoOff, MicOff, RefreshCw, Layers,
  Mic, Volume2, DollarSign, Wallet, Coins
} from "lucide-react";
import { Tutor, Student, Lesson } from "../data/mockData";
import Breadcrumbs from "./Breadcrumbs";
import { useSEO } from "../hooks/useSEO";

interface TutorPortalProps {
  tutor: Tutor;
  students: Student[];
  lessons: Lesson[];
  onJoinClass: (lesson: Lesson) => void;
  onSaveAvailability: (newAvailability: { [key: string]: string[] }) => void;
  onAddLesson: (studentId: string, dateTime: string, topic: string) => void;
  onNavigateHome?: () => void;
}

export default function TutorPortal({ 
  tutor, 
  students, 
  lessons, 
  onJoinClass, 
  onSaveAvailability, 
  onAddLesson,
  onNavigateHome
}: TutorPortalProps) {
  useSEO({ title: "Teacher Portal", noindex: true });

  const [activeTab, setActiveTab] = useState<"overview" | "students" | "schedule" | "integration" | "payouts">("overview");
  
  // Integration States
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseLessons, setSupabaseLessons] = useState<Lesson[]>([]);
  const [showDailyCall, setShowDailyCall] = useState(false);
  const [dailyCallLesson, setDailyCallLesson] = useState<Lesson | null>(null);
  const [dailyMuteVideo, setDailyMuteVideo] = useState(false);
  const [dailyMuteAudio, setDailyMuteAudio] = useState(false);
  const [dailyConnectionSpeed, setDailyConnectionSpeed] = useState<"excellent" | "good" | "poor">("excellent");
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Payout projection calculator states
  const [projectedLessonsPerWeek, setProjectedLessonsPerWeek] = useState(12);
  const [projectedRate, setProjectedRate] = useState(tutor.hourlyRate || 30);

  // Simulate real database fetch from Supabase
  const fetchSupabaseLessons = async () => {
    setSupabaseLoading(true);
    // Simulate real database round-trip latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Filter live React context data state
    const tutorLessons = lessons.filter(l => l.tutorId === tutor.id);
    setSupabaseLessons(tutorLessons);
    setSupabaseLoading(false);
  };

  // Keep integrated data in sync when tabs or external lessons change
  useEffect(() => {
    if (activeTab === "integration") {
      fetchSupabaseLessons();
    }
  }, [activeTab, lessons]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const triggerDailyPlaceholderCall = (lesson: Lesson) => {
    setDailyCallLesson(lesson);
    setShowDailyCall(true);
  };
  
  // Schedule state management
  const [editingAvailability, setEditingAvailability] = useState<{ [key: string]: string[] }>({ ...tutor.availability });
  const [newSlotDay, setNewSlotDay] = useState("Monday");
  const [newSlotTime, setNewSlotTime] = useState("09:00");
  const [isSlotSaved, setIsSlotSaved] = useState(false);

  // Quick book lesson modal state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookStudentId, setBookStudentId] = useState(students[0]?.id || "");
  const [bookDate, setBookDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow so it's never a past date
    return d.toISOString().split("T")[0];
  });
  const [bookTime, setBookTime] = useState("14:00");
  const [bookTopic, setBookTopic] = useState("Tajweed Rule analysis and recitation of Juz Amma");

  // Filter students
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string | null>(null);

  // Handle add custom slot
  const handleAddSlot = () => {
    const daySlots = editingAvailability[newSlotDay] || [];
    if (daySlots.includes(newSlotTime)) return;
    
    const updated = {
      ...editingAvailability,
      [newSlotDay]: [...daySlots, newSlotTime].sort()
    };
    setEditingAvailability(updated);
    onSaveAvailability(updated);
    
    setIsSlotSaved(true);
    setTimeout(() => setIsSlotSaved(false), 2000);
  };

  // Remove slot helper
  const handleRemoveSlot = (day: string, time: string) => {
    const updated = {
      ...editingAvailability,
      [day]: editingAvailability[day].filter(t => t !== time)
    };
    setEditingAvailability(updated);
    onSaveAvailability(updated);
  };

  // Handle book lesson submit
  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookStudentId || !bookDate || !bookTime || !bookTopic) return;
    
    // Combine date and time to ISO
    const dateTimeIso = new Date(`${bookDate}T${bookTime}:00`).toISOString();
    onAddLesson(bookStudentId, dateTimeIso, bookTopic);
    setIsBookModalOpen(false);
  };

  // Stats calculation
  const totalStudents = students.length;
  const completedLessonsCount = tutor.lessonsCompleted;
  const averageTajweedScore = Math.round(
    students.reduce((acc, curr) => acc + curr.progress.tajweedScore, 0) / (students.length || 1)
  );

  // Payout and Earnings Calculations for current tutor
  const currentMonthCompletedLessons = lessons.filter(l => {
    if (l.tutorId !== tutor.id || l.status !== "completed") return false;
    const date = new Date(l.dateTime);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const currentMonthCompletedCount = currentMonthCompletedLessons.length;
  const estimatedEarningsThisMonth = currentMonthCompletedCount * tutor.hourlyRate;

  // Weekly Performance Statistics (Feedback system)
  const todayRef = new Date(); // Always compare against the real current date

  // Start of this week (Sunday)
  const startOfThisWeek = new Date(todayRef);
  startOfThisWeek.setDate(todayRef.getDate() - todayRef.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  // End of this week (Saturday)
  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
  endOfThisWeek.setHours(23, 59, 59, 999);

  // Start of last week (Sunday)
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  startOfLastWeek.setHours(0, 0, 0, 0);

  const endOfLastWeek = new Date(startOfLastWeek);
  endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
  endOfLastWeek.setHours(23, 59, 59, 999);

  // Start of two weeks ago (Sunday)
  const startOfTwoWeeksAgo = new Date(startOfLastWeek);
  startOfTwoWeeksAgo.setDate(startOfLastWeek.getDate() - 7);
  startOfTwoWeeksAgo.setHours(0, 0, 0, 0);

  const endOfTwoWeeksAgo = new Date(startOfTwoWeeksAgo);
  endOfTwoWeeksAgo.setDate(startOfTwoWeeksAgo.getDate() + 6);
  endOfTwoWeeksAgo.setHours(23, 59, 59, 999);

  // Start of three weeks ago (Sunday)
  const startOfThreeWeeksAgo = new Date(startOfTwoWeeksAgo);
  startOfThreeWeeksAgo.setDate(startOfTwoWeeksAgo.getDate() - 7);
  startOfThreeWeeksAgo.setHours(0, 0, 0, 0);

  const endOfThreeWeeksAgo = new Date(startOfThreeWeeksAgo);
  endOfThreeWeeksAgo.setDate(startOfThreeWeeksAgo.getDate() + 6);
  endOfThreeWeeksAgo.setHours(23, 59, 59, 999);

  // Filter lessons for current tutor
  const tutorLessonsList = lessons.filter(l => l.tutorId === tutor.id);
  const completedTutorLessons = tutorLessonsList.filter(l => l.status === "completed");

  const completedThisWeekCount = completedTutorLessons.filter(l => {
    const d = new Date(l.dateTime);
    return d >= startOfThisWeek && d <= endOfThisWeek;
  }).length;

  const completedLastWeekCount = completedTutorLessons.filter(l => {
    const d = new Date(l.dateTime);
    return d >= startOfLastWeek && d <= endOfLastWeek;
  }).length;

  const completedTwoWeeksAgoCount = completedTutorLessons.filter(l => {
    const d = new Date(l.dateTime);
    return d >= startOfTwoWeeksAgo && d <= endOfTwoWeeksAgo;
  }).length;

  const completedThreeWeeksAgoCount = completedTutorLessons.filter(l => {
    const d = new Date(l.dateTime);
    return d >= startOfThreeWeeksAgo && d <= endOfThreeWeeksAgo;
  }).length;

  const upcomingThisWeekCount = tutorLessonsList.filter(l => {
    const d = new Date(l.dateTime);
    return l.status === "scheduled" && d >= startOfThisWeek && d <= endOfThisWeek;
  }).length;

  // Percentage change calculation
  let weeklyPercentChange = 0;
  let weeklyTrend: "up" | "down" | "neutral" = "neutral";
  if (completedLastWeekCount > 0) {
    weeklyPercentChange = Math.round(((completedThisWeekCount - completedLastWeekCount) / completedLastWeekCount) * 100);
    weeklyTrend = weeklyPercentChange > 0 ? "up" : weeklyPercentChange < 0 ? "down" : "neutral";
  } else if (completedThisWeekCount > 0) {
    weeklyPercentChange = 100;
    weeklyTrend = "up";
  }

  const breadcrumbItems = [
    { 
      label: "Teacher Portal", 
      action: () => setActiveTab("overview"),
      icon: <Award size={12} className="text-emerald-400" />
    },
    { 
      label: activeTab === "overview" 
        ? "Overview & Stats" 
        : activeTab === "students" 
        ? "My Students" 
        : activeTab === "schedule" 
        ? "Class Schedule & Availability" 
        : activeTab === "integration" 
        ? "Database Integration Monitor" 
        : "Earnings & Payout Details" 
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-neutral-200">
      
      <Breadcrumbs 
        items={breadcrumbItems}
        onHomeAction={onNavigateHome}
      />

      {/* PROFILE INTRO CARD */}
      <div className="relative bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950 border border-neutral-800 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 right-20 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <img 
              src={tutor.avatar} 
              alt={tutor.name} 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-emerald-500/40 object-cover shadow-lg shadow-black/40" 
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">{tutor.name}</h1>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  Verified Scholar
                </span>
              </div>
              <p className="text-neutral-400 text-sm mt-1">Instructor of Tajweed, Hifz & Qira'at</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-neutral-300 font-medium">
                <span className="flex items-center text-amber-400">
                  <Star size={14} className="fill-amber-400 mr-1" /> {tutor.rating} (Review Score)
                </span>
                <span className="text-neutral-600">•</span>
                <span className="flex items-center">
                  <Clock size={14} className="mr-1 text-neutral-400" /> {tutor.experience} Experience
                </span>
                <span className="text-neutral-600">•</span>
                <span className="flex items-center text-emerald-400">
                  <MapPin size={14} className="mr-1" /> {tutor.timeZone}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsBookModalOpen(true)}
            className="self-center md:self-auto bg-emerald-600 hover:bg-emerald-500 text-neutral-950 hover:text-white font-bold text-sm px-6 py-3 rounded-2xl transition duration-300 shadow-lg shadow-emerald-600/10 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Schedule New Lesson</span>
          </button>
        </div>
      </div>

      {/* PORTAL MINI-STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
          <div className="p-3 bg-neutral-800 text-emerald-400 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Active Students</p>
            <p className="text-xl font-bold text-white">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
          <div className="p-3 bg-neutral-800 text-amber-400 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Total Lessons</p>
            <p className="text-xl font-bold text-white">{completedLessonsCount}</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
          <div className="p-3 bg-neutral-800 text-blue-400 rounded-xl">
            <Award size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Avg Student Score</p>
            <p className="text-xl font-bold text-white">{averageTajweedScore}%</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
          <div className="p-3 bg-neutral-800 text-rose-400 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase">Retention Rate</p>
            <p className="text-xl font-bold text-white">98.4%</p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-neutral-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "overview" 
              ? "border-emerald-500 text-white" 
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Clock3 size={15} />
          <span>My Class Queue</span>
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "students" 
              ? "border-emerald-500 text-white" 
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Users size={15} />
          <span>Student Roster ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "schedule" 
              ? "border-emerald-500 text-white" 
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Sliders size={15} />
          <span>Manage Availability</span>
        </button>
        {import.meta.env.DEV && (
        <button
          onClick={() => setActiveTab("integration")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "integration"
              ? "border-emerald-500 text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Database size={15} className="text-emerald-400 animate-pulse" />
          <span>Dev: API Workbench</span>
        </button>
        )}
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "payouts" 
              ? "border-emerald-500 text-white" 
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <DollarSign size={15} className="text-emerald-400" />
          <span>Payouts & Earnings</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="space-y-6">
        
        {/* TAB 1: OVERVIEW & LESSON QUEUE */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* WEEKLY PERFORMANCE METRICS CARD & CHART ROW */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
              
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch">
                {/* Text Description & Feedback */}
                <div className="flex-1 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-500/20">
                        <Activity size={16} />
                      </span>
                      <h3 className="text-base font-bold text-white">Weekly Performance Feedback</h3>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Track your teaching velocity. Here is how your lesson completed count compares between the current week and last week.
                    </p>
                  </div>

                  {/* Summary Comparison Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-neutral-950/60 border border-neutral-850 p-4 rounded-2xl">
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">This Week</p>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black text-white font-mono">{completedThisWeekCount}</span>
                        <span className="text-xs text-neutral-400">completed</span>
                      </div>
                      {upcomingThisWeekCount > 0 && (
                        <p className="text-[10px] text-amber-400 font-semibold flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />
                          +{upcomingThisWeekCount} scheduled
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 border-l border-neutral-800/80 pl-4">
                      <p className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">Last Week</p>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black text-neutral-300 font-mono">{completedLastWeekCount}</span>
                        <span className="text-xs text-neutral-400">completed</span>
                      </div>
                      <div className="mt-1">
                        {weeklyTrend === "up" ? (
                          <span className="inline-flex items-center text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-md font-bold">
                            <ArrowUpRight size={10} className="mr-0.5" /> +{weeklyPercentChange}%
                          </span>
                        ) : weeklyTrend === "down" ? (
                          <span className="inline-flex items-center text-[10px] bg-rose-950 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-md font-bold">
                            <ArrowDownRight size={10} className="mr-0.5" /> {weeklyPercentChange}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md font-bold">
                            No change
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Encouraging Insight Message */}
                  <div className="text-xs bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex items-start space-x-2.5">
                    <Sparkles size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-neutral-300 leading-normal">
                      {completedThisWeekCount > completedLastWeekCount ? (
                        <span>Excellent momentum! You have completed more lessons this week than last week. Your teaching is highly consistent.</span>
                      ) : completedThisWeekCount === completedLastWeekCount && completedThisWeekCount > 0 ? (
                        <span>Great consistency! You have perfectly matched last week's completed lessons count.</span>
                      ) : upcomingThisWeekCount > 0 ? (
                        <span>You have <strong>{upcomingThisWeekCount}</strong> lessons scheduled for the rest of this week. Teach them to reach or surpass last week's count!</span>
                      ) : (
                        <span>Keep the momentum going! Schedule more sessions or share your availability to increase lessons completed.</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Custom Vector Bar Chart */}
                <div className="w-full lg:w-[350px] bg-neutral-950/40 border border-neutral-850 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white">4-Week Completion Velocity</span>
                    <span className="text-[10px] text-neutral-400 font-mono">Lessons / Week</span>
                  </div>

                  {/* Render 4 columns */}
                  <div className="flex items-end justify-between h-36 px-2 pt-4 border-b border-neutral-800">
                    {[
                      { label: "Jun 7-13", completed: completedThreeWeeksAgoCount, upcoming: 0 },
                      { label: "Jun 14-20", completed: completedTwoWeeksAgoCount, upcoming: 0 },
                      { label: "Jun 21-27", completed: completedLastWeekCount, upcoming: 0 },
                      { label: "Jun 28-Jul 4", completed: completedThisWeekCount, upcoming: upcomingThisWeekCount, current: true }
                    ].map((w, idx) => {
                      const maxWeeklyCount = Math.max(
                        completedThreeWeeksAgoCount,
                        completedTwoWeeksAgoCount,
                        completedLastWeekCount,
                        completedThisWeekCount + upcomingThisWeekCount,
                        4
                      );
                      const completedHeightPercent = Math.min(100, Math.round((w.completed / maxWeeklyCount) * 100));
                      const upcomingHeightPercent = Math.min(100, Math.round((w.upcoming / maxWeeklyCount) * 100));

                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 group">
                          {/* Columns/Bars Stack */}
                          <div className="w-12 h-24 flex flex-col justify-end relative rounded-t-lg overflow-hidden pb-1">
                            {/* Hover info badge */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-[9px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                              {w.completed} completed {w.upcoming > 0 ? `+ ${w.upcoming} plan` : ""}
                            </div>

                            {/* Upcoming / Pending Lessons Segment (Hashed or semi-transparent) */}
                            {w.upcoming > 0 && (
                              <div 
                                style={{ height: `${upcomingHeightPercent}%` }}
                                className="w-full bg-gradient-to-t from-amber-500/20 to-amber-500/40 border-t border-dashed border-amber-400/50 flex items-center justify-center relative group-hover:from-amber-500/30 group-hover:to-amber-500/60 transition-all animate-pulse"
                                title={`${w.upcoming} scheduled lesson(s)`}
                              >
                                <span className="text-[8px] font-black text-amber-300 select-none">{w.upcoming}P</span>
                              </div>
                            )}

                            {/* Completed Lessons Segment */}
                            {w.completed > 0 ? (
                              <div 
                                style={{ height: `${completedHeightPercent}%` }}
                                className={`w-full bg-gradient-to-t ${
                                  w.current 
                                    ? "from-emerald-600 to-emerald-400" 
                                    : "from-neutral-700 to-neutral-500"
                                } rounded-t-sm flex items-center justify-center transition-all`}
                                title={`${w.completed} completed lesson(s)`}
                              >
                                <span className="text-[9px] font-black text-neutral-950 select-none">{w.completed}</span>
                              </div>
                            ) : (
                              w.upcoming === 0 && (
                                <div className="w-full h-1 bg-neutral-850 rounded-t-sm" />
                              )
                            )}
                          </div>

                          {/* Week Label */}
                          <span className={`text-[9px] mt-2 font-mono ${w.current ? "text-emerald-400 font-bold" : "text-neutral-500"}`}>
                            {w.label.split(" ")[1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart Legend */}
                  <div className="flex justify-center items-center space-x-3 mt-3 text-[10px]">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-sm" />
                      <span className="text-neutral-400">Completed (This Wk)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-neutral-500 rounded-sm" />
                      <span className="text-neutral-400">Completed (Prev)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-amber-500/40 border border-dashed border-amber-400/50 rounded-sm" />
                      <span className="text-neutral-400">Scheduled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN QUEUE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* CENTRAL QUEUE: SCHEDULED LESSONS */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Calendar size={18} className="text-emerald-500 mr-2" /> Upcoming Tutoring Sessions
                  </h3>
                  <span className="text-xs text-neutral-400">Times displayed in UTC ({tutor.timeZone})</span>
                </div>

                {lessons.filter(l => l.status === "scheduled" || l.status === "live").length > 0 ? (
                  <div className="space-y-4">
                    {lessons.filter(l => l.status === "scheduled" || l.status === "live").map((lesson) => {
                      const lDate = new Date(lesson.dateTime);
                      const formattedDate = lDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                      const formattedTime = lDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div 
                          key={lesson.id}
                          className={`group bg-neutral-900 border transition-all duration-300 rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            lesson.status === "live" 
                              ? "border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/5" 
                              : "border-neutral-800 hover:border-neutral-700"
                          }`}
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-emerald-400 font-semibold uppercase font-mono tracking-wide">
                                {lesson.status === "live" ? "🔴 CLASS LIVE NOW" : "Scheduled"}
                              </span>
                              <span className="text-neutral-600">•</span>
                              <span className="text-xs text-neutral-400">{lesson.duration} Minutes</span>
                            </div>

                            <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {lesson.topic}
                            </h4>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-300">
                              <span className="flex items-center">
                                <Users size={12} className="mr-1 text-neutral-400" /> 
                                Student: <strong className="ml-1 text-white">{lesson.studentName}</strong>
                              </span>
                              <span className="text-neutral-600">|</span>
                              <span className="flex items-center text-amber-400">
                                <Calendar size={12} className="mr-1" /> {formattedDate} at {formattedTime} UTC
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto">
                            <button
                              onClick={() => triggerDailyPlaceholderCall(lesson)}
                              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-md transition duration-200"
                              title="Join dynamic WebRTC call via Daily.co"
                            >
                              <Video size={13} className="animate-pulse" />
                              <span>Join Session (Daily.co)</span>
                            </button>
                            
                            <button
                              onClick={() => onJoinClass(lesson)}
                              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 hover:text-white font-bold text-xs px-4 py-3 rounded-xl shadow-md transition duration-200"
                            >
                              <Video size={13} />
                              <span>{lesson.status === "live" ? "Re-Join Classroom" : "Launch Classroom"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
                      <Calendar size={20} />
                    </div>
                    <p className="text-sm font-semibold text-neutral-300">No upcoming classes scheduled</p>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">Click the button in the profile header above to quickly book a student session.</p>
                  </div>
                )}
              </div>

              {/* SIDE PANEL: STUDENT QUICK FILE CARDS */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Users size={18} className="text-emerald-500 mr-2" /> Live Student Files
                </h3>

                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-bold text-white">{student.name}</p>
                            <p className="text-[10px] text-neutral-400">Level: {student.level} • {student.age} yrs</p>
                          </div>
                        </div>
                        <span className="text-xs bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/10 font-bold">
                          {student.progress.tajweedScore}% Tajweed
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 border-t border-neutral-800/80 pt-3">
                        <div className="flex justify-between text-neutral-400">
                          <span>Current Syllabus:</span>
                          <span className="font-semibold text-neutral-200">{student.progress.currentBook}</span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                          <span>Current Module:</span>
                          <span className="font-semibold text-neutral-200 truncate max-w-[150px]">{student.progress.currentChapter}</span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                          <span>Verse Checked:</span>
                          <span className="font-semibold text-amber-400">Verse {student.progress.currentVerse || "N/A"}</span>
                        </div>
                      </div>

                      {/* Progress log link */}
                      <div className="pt-2">
                        <div className="bg-neutral-950 rounded-lg p-2 flex items-center justify-between text-[10px]">
                          <span className="text-neutral-400">Recent: {student.progress.recentMistakes.length} recorded errors</span>
                          <span className="text-emerald-400 font-bold">Status: Active</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: DETAILED STUDENTS ROSTER */}
        {activeTab === "students" && (
          <div className="space-y-4">
            
            {/* Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl">
              <div className="flex flex-1 max-w-md items-center bg-neutral-950 rounded-xl px-3 py-2 border border-neutral-700">
                <ListFilter size={15} className="text-neutral-500 mr-2" />
                <input 
                  type="text" 
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student by name, level, or status..."
                  className="bg-transparent border-none text-xs text-white focus:outline-none w-full placeholder-neutral-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button 
                  onClick={() => setSelectedStudentFilter(null)}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    selectedStudentFilter === null 
                      ? "bg-emerald-600 border-emerald-500 text-neutral-950 font-bold" 
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  All Levels
                </button>
                <button 
                  onClick={() => setSelectedStudentFilter("Beginner")}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    selectedStudentFilter === "Beginner" 
                      ? "bg-emerald-600 border-emerald-500 text-neutral-950 font-bold" 
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  Beginners
                </button>
                <button 
                  onClick={() => setSelectedStudentFilter("Intermediate")}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    selectedStudentFilter === "Intermediate" 
                      ? "bg-emerald-600 border-emerald-500 text-neutral-950 font-bold" 
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  Intermediate
                </button>
                <button 
                  onClick={() => setSelectedStudentFilter("Advanced")}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    selectedStudentFilter === "Advanced" 
                      ? "bg-emerald-600 border-emerald-500 text-neutral-950 font-bold" 
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students
                .filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                                        s.progress.currentBook.toLowerCase().includes(studentSearch.toLowerCase());
                  const matchesFilter = selectedStudentFilter ? s.level === selectedStudentFilter : true;
                  return matchesSearch && matchesFilter;
                })
                .map((student) => (
                  <div 
                    key={student.id} 
                    className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col space-y-4 hover:border-emerald-500/40 transition duration-300 shadow-xl"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={student.avatar} 
                          alt={student.name} 
                          className="w-12 h-12 rounded-full object-cover border border-neutral-700 shadow" 
                        />
                        <div>
                          <h4 className="text-base font-bold text-white">{student.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            student.level === "Beginner" ? "bg-blue-950/80 text-blue-400 border border-blue-500/20" :
                            student.level === "Intermediate" ? "bg-amber-950/80 text-amber-400 border border-amber-500/20" :
                            "bg-purple-950/80 text-purple-400 border border-purple-500/20"
                          }`}>
                            {student.level} • {student.age} yrs
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-neutral-400 font-medium">Hifz Tracker</p>
                        <p className="text-xs font-bold text-emerald-400">{student.progress.hifzProgress}% Done</p>
                      </div>
                    </div>

                    {/* Progress indicators */}
                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                      <div>
                        <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                          <span>Tajweed Precision:</span>
                          <span className="font-bold text-white">{student.progress.tajweedScore}%</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all" 
                            style={{ width: `${student.progress.tajweedScore}%` }} 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                          <span>Attendance Rate:</span>
                          <span className="font-bold text-white">{student.progress.attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all" 
                            style={{ width: `${student.progress.attendanceRate}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mistakes Tracker Log Summary */}
                    <div className="bg-neutral-950 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-bold text-neutral-300 flex items-center">
                        <ShieldAlert size={12} className="text-rose-500 mr-1.5" /> Recent Observations
                      </p>
                      {student.progress.recentMistakes.length > 0 ? (
                        <div className="space-y-1.5">
                          {student.progress.recentMistakes.map((mistake) => (
                            <div key={mistake.id} className="text-[11px] text-neutral-400 flex items-start gap-1">
                              <span className="text-rose-500 mt-0.5">•</span>
                              <p>
                                <strong className="text-neutral-300">{mistake.type}:</strong> {mistake.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-neutral-500">No active mistakes logged for this student.</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 mt-auto">
                      <div className="flex items-center text-xs justify-between text-neutral-400 bg-neutral-800/30 p-2.5 rounded-xl border border-neutral-800">
                        <span className="flex items-center">
                          <BookOpenCheck size={12} className="mr-1 text-neutral-500" />
                          {student.progress.currentBook}
                        </span>
                        <span className="font-semibold text-neutral-200">{student.progress.currentChapter}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: SCHEDULE & RECURRING SLOTS */}
        {activeTab === "schedule" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* SLOT EDITOR */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Weekly Availability Slots</h3>
                <p className="text-xs text-neutral-400">Set slots during which students can automatically book sessions on QuranTutorsAcademy.com.</p>
              </div>

              {/* Add Slot Quick Form */}
              <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase">Select Weekday</label>
                  <select 
                    value={newSlotDay}
                    onChange={(e) => setNewSlotDay(e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase">Select Time Slot (UTC)</label>
                  <select 
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>

                <button
                  onClick={handleAddSlot}
                  className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center space-x-1.5"
                >
                  <Plus size={14} />
                  <span>Add Slot Template</span>
                </button>

                {isSlotSaved && (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center space-x-1 animate-pulse mb-2">
                    <Check size={14} />
                    <span>Slot Added Successfully!</span>
                  </span>
                )}
              </div>

              {/* Grid of Days and active slots */}
              <div className="space-y-4 pt-2">
                {Object.keys(editingAvailability).map((day) => (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-start gap-3 border-b border-neutral-800/60 pb-3 last:border-b-0">
                    <div className="sm:w-28 shrink-0">
                      <span className="text-sm font-bold text-white">{day}</span>
                      <p className="text-[10px] text-neutral-500">{editingAvailability[day]?.length || 0} active slots</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {editingAvailability[day]?.length > 0 ? (
                        editingAvailability[day].map((time) => (
                          <span 
                            key={time}
                            className="inline-flex items-center space-x-1.5 bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs px-3 py-1.5 rounded-lg group hover:border-rose-500/40 hover:text-rose-400 transition cursor-pointer"
                            onClick={() => handleRemoveSlot(day, time)}
                            title="Click to remove slot template"
                          >
                            <span>{time} UTC</span>
                            <span className="text-neutral-600 group-hover:text-rose-400">×</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-500 italic">No slots defined. Not bookable.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SYNC INFO GRAPHIC CARD */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center">
                <Clock size={16} className="text-emerald-500 mr-2" /> Failsafe Calendar Syncing
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Our custom backend automatically synchronizes these template times with Google Calendar & iCal. When a slot is booked, it disappears globally from QuranTutorsAcademy.com and adds a dynamic invitation to both parent & student email list boxes.
              </p>

              <div className="space-y-3.5 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle size={14} />
                  <span className="font-bold">Google Calendar: Connected</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle size={14} />
                  <span className="font-bold">WhatsApp Reminders: Active</span>
                </div>
                <div className="flex items-center space-x-2 text-neutral-500">
                  <Clock size={14} />
                  <span>Timezone Translation: Auto-Local</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: DATABASE & WEBRTC INTEGRATION (developer reference only, hidden in production) */}
        {activeTab === "integration" && import.meta.env.DEV && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in text-xs">
            {/* LEFT COLUMN: DATABASE INTELLIGENCE & SUPABASE WORKBENCH */}
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Database size={100} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="text-emerald-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Supabase Client Syntax Workbench</h3>
                  </div>
                  <span className="flex items-center text-[10px] font-bold bg-emerald-950/80 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/10 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                    Active Engine
                  </span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Below is the exact production-grade client-side query utilizing the official Supabase Javascript SDK. 
                  This fetches real-time scheduling data from your PostgreSQL database securely protected by Row-Level Security (RLS) rules.
                </p>

                {/* TS Definition & Supabase Snippet tab selector */}
                <div className="bg-neutral-950 rounded-2xl border border-neutral-800/80 overflow-hidden">
                  <div className="bg-neutral-900/60 px-4 py-2.5 border-b border-neutral-800 flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <Terminal size={14} className="text-emerald-500" />
                      <span className="text-[11px] font-bold text-neutral-300 font-mono">TutorLessonsFetch.ts</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(`export interface Lesson {
  id: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  dateTime: string; // ISO String in UTC
  duration: number; // in minutes
  topic: string;
  status: "scheduled" | "completed" | "cancelled" | "live";
  notes?: string;
}`, 'ts')}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center space-x-1 font-semibold"
                    >
                      <Copy size={12} />
                      <span>{copiedText === 'ts' ? "Copied!" : "Copy Interface"}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-emerald-400/90 overflow-x-auto leading-relaxed max-h-[180px] scrollbar-thin">
{`// 1. TypeScript Interface definition
export interface Lesson {
  id: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  dateTime: string; // ISO String in UTC
  duration: number; // in minutes
  topic: string;
  status: "scheduled" | "completed" | "cancelled" | "live";
  notes?: string;
}`}
                  </pre>
                </div>

                {/* Supabase Query code block */}
                <div className="bg-neutral-950 rounded-2xl border border-neutral-800/80 overflow-hidden">
                  <div className="bg-neutral-900/60 px-4 py-2.5 border-b border-neutral-800 flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <Code2 size={14} className="text-emerald-500" />
                      <span className="text-[11px] font-bold text-neutral-300 font-mono">supabaseClient.ts</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(`// Fetching lessons matching current tutor using Supabase client
const fetchUpcomingLessons = async (tutorId: string) => {
  const { data, error } = await supabase
    .from('booked_lessons')
    .select(\`
      id,
      tutor_id,
      student_id,
      scheduled_at,
      duration_minutes,
      topic,
      status,
      profiles:student_id ( full_name )
    \`)
    .eq('tutor_id', tutorId)
    .in('status', ['scheduled', 'live'])
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data;
};`, 'sb')}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center space-x-1 font-semibold"
                    >
                      <Copy size={12} />
                      <span>{copiedText === 'sb' ? "Copied!" : "Copy Code"}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-amber-300/90 overflow-x-auto leading-relaxed max-h-[220px] scrollbar-thin">
{`// 2. Supabase Query implementation
const fetchUpcomingLessons = async (tutorId: string) => {
  const { data, error } = await supabase
    .from('booked_lessons')
    .select(\`
      id,
      tutor_id,
      student_id,
      scheduled_at,
      duration_minutes,
      topic,
      status
    \`)
    .eq('tutor_id', tutorId)
    .in('status', ['scheduled', 'live'])
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data;
};`}
                  </pre>
                </div>

                {/* Console Action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2 text-xs text-neutral-400">
                    <Activity size={14} className="text-emerald-400 animate-pulse" />
                    <span>PostgreSQL connection pool: healthy</span>
                  </div>
                  
                  <button
                    onClick={fetchSupabaseLessons}
                    disabled={supabaseLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-neutral-950 font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:pointer-events-none"
                  >
                    <RefreshCw size={14} className={supabaseLoading ? "animate-spin text-neutral-900" : "text-neutral-900"} />
                    <span>{supabaseLoading ? "Executing Query..." : "Execute Live Query"}</span>
                  </button>
                </div>
              </div>

              {/* LIVE PLAYGROUND RESULTS CONTAINER */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Terminal size={14} className="text-emerald-500 mr-1.5" /> Output: JSON Response
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase font-bold">Status: 200 OK</span>
                </div>

                {supabaseLoading ? (
                  <div className="bg-neutral-950 rounded-2xl p-10 flex flex-col items-center justify-center space-y-3 border border-neutral-800">
                    <RefreshCw size={24} className="animate-spin text-emerald-500" />
                    <p className="text-xs text-neutral-400 font-mono">SELECT * FROM booked_lessons WHERE tutor_id = '{tutor.id}'...</p>
                  </div>
                ) : (
                  <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 overflow-hidden font-mono text-[11px] text-emerald-400/80 max-h-[250px] overflow-y-auto scrollbar-thin">
                    <pre>{JSON.stringify(supabaseLessons, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: WEB_RTC / DAILY.CO VIDEO CONNECTIONS */}
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Video size={100} />
                </div>

                <div className="flex items-center space-x-2">
                  <Layers className="text-blue-400" size={20} />
                  <h3 className="text-lg font-bold text-white">Daily.co WebRTC Frame Architecture</h3>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Daily.co provides a scalable WebRTC platform to build high-performance audio & video feeds inside custom elements. Below is the integration wrapper pattern for launching dynamic video container popups.
                </p>

                <div className="bg-neutral-950 rounded-2xl border border-neutral-800/80 overflow-hidden">
                  <div className="bg-neutral-900/60 px-4 py-2.5 border-b border-neutral-800 flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <Terminal size={14} className="text-blue-500" />
                      <span className="text-[11px] font-bold text-neutral-300 font-mono">DailyVideoCall.tsx</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(`import DailyIframe from '@daily-co/daily-js';

// Instantiate a secure video room iframe
const startVideoCall = async (roomUrl: string, containerRef: React.RefObject<HTMLDivElement>) => {
  const callFrame = DailyIframe.createFrame(containerRef.current, {
    iframeStyle: {
      width: '100%',
      height: '100%',
      border: '0',
      borderRadius: '16px'
    },
    showLeaveButton: true,
  });

  await callFrame.join({ url: roomUrl });
};`, 'dc')}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center space-x-1 font-semibold"
                    >
                      <Copy size={12} />
                      <span>{copiedText === 'dc' ? "Copied!" : "Copy Code"}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-blue-400/90 overflow-x-auto leading-relaxed max-h-[220px] scrollbar-thin">
{`import DailyIframe from '@daily-co/daily-js';

// Instantiate secure video room
const startVideoCall = async (roomUrl, containerRef) => {
  const callFrame = DailyIframe.createFrame(containerRef.current, {
    iframeStyle: {
      width: '100%',
      height: '100%',
      border: '0',
      borderRadius: '16px'
    },
    showLeaveButton: true,
  });

  await callFrame.join({ url: roomUrl });
};`}
                  </pre>
                </div>

                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3.5">
                  <h4 className="text-xs font-bold text-neutral-300 flex items-center">
                    <Wifi size={14} className="text-blue-400 mr-1.5" /> High-Performance Infrastructure
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Integrating Daily.co allows synchronized whiteboards, low-latency WebRTC streams, and automated transcription services. 
                    Test how the platform handles video states and media streams in real-time.
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerDailyPlaceholderCall(lessons[0])}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-blue-600/10 flex items-center justify-center space-x-2 transition active:scale-95"
                    >
                      <Video size={14} />
                      <span>Test WebRTC Overlay</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* COMPONENT CARDS PREVIEW */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Calendar size={14} className="text-emerald-500 mr-1.5" /> Rendered Dashboard Cards
                  </h4>
                  <span className="text-[10px] text-neutral-400">Mobile-Responsive Cards</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supabaseLessons.slice(0, 2).map((lesson) => {
                    const lDate = new Date(lesson.dateTime);
                    const formattedDate = lDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    const formattedTime = lDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div 
                        key={lesson.id} 
                        className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-between space-y-3 hover:border-emerald-500/20 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">{lesson.status}</span>
                            <span className="text-[10px] text-neutral-500">{lesson.duration}m</span>
                          </div>
                          <h5 className="text-xs font-bold text-white line-clamp-1">{lesson.topic}</h5>
                          <p className="text-[11px] text-neutral-400 mt-1">Student: <strong className="text-neutral-200">{lesson.studentName}</strong></p>
                          <p className="text-[10px] text-amber-400 mt-0.5">{formattedDate} • {formattedTime} UTC</p>
                        </div>

                        <button
                          onClick={() => triggerDailyPlaceholderCall(lesson)}
                          className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-[11px] py-2 rounded-lg transition"
                        >
                          Join Daily.co Session
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PAYOUTS & EARNINGS */}
        {activeTab === "payouts" && (
          <div className="space-y-6 animate-fade-in text-xs md:text-sm">
            {/* PAYOUT OVERVIEW CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
                <div className="flex items-center space-x-3.5 mb-2">
                  <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <CheckSquare size={18} />
                  </div>
                  <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Completed Lessons</span>
                </div>
                <p className="text-2xl font-bold text-white mt-1">{currentMonthCompletedCount}</p>
                <p className="text-xs text-neutral-400 mt-1">For June 2026 billing period</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                <div className="flex items-center space-x-3.5 mb-2">
                  <div className="p-2 bg-amber-950 text-amber-400 rounded-xl border border-amber-500/20">
                    <Coins size={18} />
                  </div>
                  <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Hourly Lesson Rate</span>
                </div>
                <p className="text-2xl font-bold text-white mt-1">${tutor.hourlyRate.toFixed(2)}</p>
                <p className="text-xs text-neutral-400 mt-1">Per hour lesson length</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
                <div className="flex items-center space-x-3.5 mb-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <DollarSign size={18} />
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Estimated Earnings</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400 mt-1">${estimatedEarningsThisMonth.toFixed(2)}</p>
                <p className="text-xs text-neutral-300 font-mono mt-1">
                  {currentMonthCompletedCount} x ${tutor.hourlyRate.toFixed(2)}
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl" />
                <div className="flex items-center space-x-3.5 mb-2">
                  <div className="p-2 bg-blue-950 text-blue-400 rounded-xl border border-blue-500/20">
                    <Wallet size={18} />
                  </div>
                  <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Next Payout</span>
                </div>
                <p className="text-2xl font-bold text-white mt-1">July 1, 2026</p>
                <p className="text-xs text-blue-400 font-semibold flex items-center mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-1.5" />
                  Processing Cycle
                </p>
              </div>
            </div>

            {/* MAIN TWO COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COMPLETED LESSONS LEDGER (LEFT COLUMN - Span 2) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">June 2026 Lesson History</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">Below are all tutoring classes marked as completed this month</p>
                    </div>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Verified Sessions
                    </span>
                  </div>

                  {currentMonthCompletedCount === 0 ? (
                    <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
                      <Clock3 size={40} className="mx-auto text-neutral-600 mb-3" />
                      <p className="text-sm font-medium text-neutral-400">No completed lessons found for this month yet.</p>
                      <p className="text-xs text-neutral-500 mt-1">Completed classes automatically calculate here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-400">
                            <th className="pb-3 font-semibold">Student</th>
                            <th className="pb-3 font-semibold">Date & Time</th>
                            <th className="pb-3 font-semibold">Topic</th>
                            <th className="pb-3 font-semibold">Duration</th>
                            <th className="pb-3 font-semibold text-right">Earnings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/40">
                          {currentMonthCompletedLessons.map((lesson) => {
                            const lDate = new Date(lesson.dateTime);
                            const formattedDate = lDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            const formattedTime = lDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            
                            return (
                              <tr key={lesson.id} className="text-xs text-neutral-300 hover:bg-neutral-850/30 transition-colors">
                                <td className="py-3.5 pr-2 font-medium text-white">{lesson.studentName}</td>
                                <td className="py-3.5 pr-2">
                                  <span className="block">{formattedDate}</span>
                                  <span className="text-[10px] text-neutral-500">{formattedTime} UTC</span>
                                </td>
                                <td className="py-3.5 pr-2 max-w-[200px] truncate" title={lesson.topic}>
                                  {lesson.topic}
                                </td>
                                <td className="py-3.5 pr-2 text-neutral-400">
                                  {lesson.duration} Mins
                                </td>
                                <td className="py-3.5 text-right font-semibold text-emerald-400 font-mono">
                                  ${tutor.hourlyRate.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* HISTORICAL LEDGER / TRANSFERRED PAYOUTS */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Previous Transfers</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Completed cycles processed to your bank account</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-850">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Check size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">May 2026 Billing Period</p>
                          <p className="text-[10px] text-neutral-500">Transferred via Direct Deposit on June 1, 2026</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">$1,350.00</p>
                        <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2.5 py-0.5 rounded-full font-semibold">
                          Paid
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-850">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Check size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">April 2026 Billing Period</p>
                          <p className="text-[10px] text-neutral-500">Transferred via Direct Deposit on May 1, 2026</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">$1,100.00</p>
                        <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2.5 py-0.5 rounded-full font-semibold">
                          Paid
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RATE & PROJECTIONS SIMULATOR (RIGHT COLUMN - Span 1) */}
              <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <TrendingUp size={100} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center">
                      <TrendingUp size={16} className="text-emerald-500 mr-2" /> Future Earnings Simulator
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      Project your revenue based on expected volume of classes and customizable lesson rates.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* SLIDER 1: LESSONS PER WEEK */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-300">Lessons per Week:</span>
                        <span className="text-emerald-400 font-bold font-mono bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                          {projectedLessonsPerWeek} Classes
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="40" 
                        value={projectedLessonsPerWeek}
                        onChange={(e) => setProjectedLessonsPerWeek(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span>1 class</span>
                        <span>40 classes/wk</span>
                      </div>
                    </div>

                    {/* SLIDER 2: RATE */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-300">Rate per Lesson ($):</span>
                        <span className="text-emerald-400 font-bold font-mono bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                          ${projectedRate} / Hr
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="15" 
                        max="100" 
                        value={projectedRate}
                        onChange={(e) => setProjectedRate(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span>$15</span>
                        <span>$100 / hr</span>
                      </div>
                    </div>
                  </div>

                  {/* PROJECTION RESULTS METERS */}
                  <div className="bg-neutral-950 rounded-2xl border border-neutral-850 p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-neutral-850 pb-2">
                      <span className="text-xs text-neutral-400 font-medium">Weekly Projection:</span>
                      <span className="text-base font-bold text-white font-mono">
                        ${(projectedLessonsPerWeek * projectedRate).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-neutral-850 pb-2">
                      <span className="text-xs text-neutral-400 font-medium">Monthly Projection:</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        ${(projectedLessonsPerWeek * projectedRate * 4.33).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-400 font-medium">Annualized Revenue:</span>
                      <span className="text-lg font-extrabold text-white font-mono">
                        ${(projectedLessonsPerWeek * projectedRate * 52).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TRANSFER SETTINGS INFO */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2.5">
                    <Wallet size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-bold text-white">Deposit Method</h3>
                  </div>

                  <div className="bg-neutral-950 rounded-2xl border border-neutral-850 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-medium">Stripe Connect Status:</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                        ACTIVE
                      </span>
                    </div>

                    <div className="text-xs text-neutral-300">
                      <p className="font-bold">Islamic International Bank</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Checking Account ending in •••• 4829</p>
                    </div>

                    <p className="text-[10px] text-neutral-400 leading-normal">
                      Earnings are calculated in real-time. Payouts are bundled and automatically initiated on the 1st of every month.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* QUICK SCHEDULING BOOKING MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl">
            
            <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Schedule Custom Lesson</h3>
              <button 
                onClick={() => setIsBookModalOpen(false)}
                className="text-neutral-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-300">Select Student</label>
                <select
                  value={bookStudentId}
                  onChange={(e) => setBookStudentId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Date</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Time (UTC)</label>
                  <input
                    type="time"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-neutral-300">Topic / Syllabus Module</label>
                <input
                  type="text"
                  value={bookTopic}
                  onChange={(e) => setBookTopic(e.target.value)}
                  placeholder="E.g., Recitation of Surah Al-Baqarah Verses 1-10"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-neutral-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 hover:text-white rounded-xl transition font-bold"
                >
                  Schedule Class
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DAILY.CO INTEGRATION WEBRTC ACTIVE CALL DIALOG */}
      {showDailyCall && dailyCallLesson && (
        <div className="fixed inset-0 bg-neutral-950/98 backdrop-blur-md z-50 flex flex-col justify-between p-4 md:p-6 animate-fade-in text-neutral-200 font-sans">
          
          {/* HEADER BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-neutral-900 border border-neutral-800 px-6 py-4 rounded-2xl gap-3 shadow-xl">
            <div className="flex items-center space-x-3.5 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white relative animate-pulse shadow-lg shadow-blue-500/20 shrink-0">
                <Video size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="text-base font-bold text-white">Daily.co Secure WebRTC Session</h3>
                  <span className="bg-blue-950 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                    ACTIVE CALL
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Topic: <strong className="text-neutral-200">{dailyCallLesson.topic}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-neutral-400 font-mono uppercase">Call Health</p>
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1 justify-end">
                  <Wifi size={12} className="mr-1 animate-pulse" /> {dailyConnectionSpeed === "excellent" ? "Excellent (24ms)" : dailyConnectionSpeed === "good" ? "Good (68ms)" : "Poor (240ms)"}
                </span>
              </div>
              <button 
                onClick={() => setShowDailyCall(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Minimize</span>
              </button>
            </div>
          </div>

          {/* MAIN WEBRTC VIDEO FRAMES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 flex-1 min-h-[300px] items-stretch">
            {/* LOCAL TUTOR FEED */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl relative overflow-hidden flex flex-col justify-center items-center p-6 shadow-2xl group border-emerald-500/10">
              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-neutral-800 z-10 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Local Feed (You)</span>
              </div>

              {dailyMuteVideo ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-neutral-850 flex items-center justify-center border-4 border-neutral-700 shadow-xl text-neutral-500">
                    <VideoOff size={32} />
                  </div>
                  <p className="text-sm font-bold text-neutral-400">Camera is muted</p>
                </div>
              ) : (
                <div className="w-full h-full relative rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                  <img src={tutor.avatar} alt={tutor.name} className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-sm" />
                  <img src={tutor.avatar} alt={tutor.name} className="w-28 h-28 rounded-full object-cover border-4 border-emerald-500 z-10 shadow-lg shadow-black/40" />
                  <div className="absolute bottom-4 right-4 bg-emerald-600 text-neutral-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase z-10 tracking-wider">
                    {dailyConnectionSpeed === "excellent" ? "VP8 • 1080p @ 30 FPS" : dailyConnectionSpeed === "good" ? "VP8 • 720p @ 30 FPS" : "VP8 • 480p @ 15 FPS"}
                  </div>
                </div>
              )}

              {/* Mic volume active indicator bar */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2 bg-black/40 backdrop-blur-sm p-2.5 rounded-xl border border-neutral-800 max-w-xs z-10">
                <Mic size={14} className={dailyMuteAudio ? "text-rose-500" : "text-emerald-400 animate-pulse"} />
                <div className="flex-1 bg-neutral-850 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${dailyMuteAudio ? "w-0" : "bg-emerald-500 w-2/3 animate-pulse"}`} 
                  />
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">{dailyMuteAudio ? "Muted" : "Active"}</span>
              </div>
            </div>

            {/* REMOTE STUDENT FEED */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl relative overflow-hidden flex flex-col justify-center items-center p-6 shadow-2xl group border-blue-500/10">
              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-neutral-800 z-10 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Remote Participant ({dailyCallLesson.studentName})</span>
              </div>

              <div className="w-full h-full relative rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 via-neutral-900 to-emerald-950/20 opacity-40 z-0" />
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <span className="w-72 h-72 bg-blue-500/5 rounded-full animate-ping duration-1000" />
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150" 
                  alt={dailyCallLesson.studentName} 
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 z-10 shadow-lg shadow-black/40" 
                />
                <div className="absolute bottom-4 right-4 bg-blue-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase z-10 tracking-wider">
                  {dailyConnectionSpeed === "excellent" ? "VP8 • 1080p @ 30 FPS" : dailyConnectionSpeed === "good" ? "VP8 • 720p @ 30 FPS" : "VP8 • 480p @ 15 FPS"}
                </div>
              </div>

              {/* Student volume waveform indicator bar */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2 bg-black/40 backdrop-blur-sm p-2.5 rounded-xl border border-neutral-800 max-w-xs z-10">
                <Volume2 size={14} className="text-blue-400 animate-bounce" />
                <div className="flex-1 bg-neutral-850 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-300 w-1/2 animate-pulse" />
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">Synced</span>
              </div>
            </div>
          </div>

          {/* LOWER WEBRTC CALL CONTROL BAR */}
          <div className="flex flex-col lg:flex-row justify-between items-center bg-neutral-900 border border-neutral-800 px-6 py-4 rounded-3xl gap-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setDailyMuteAudio(!dailyMuteAudio)}
                className={`p-3.5 rounded-2xl transition duration-200 border flex items-center space-x-2 text-xs font-bold cursor-pointer ${
                  dailyMuteAudio 
                    ? "bg-rose-950/60 border-rose-500/20 text-rose-400 hover:bg-rose-900" 
                    : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-200"
                }`}
              >
                {dailyMuteAudio ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{dailyMuteAudio ? "Unmute Mic" : "Mute Mic"}</span>
              </button>

              <button
                onClick={() => setDailyMuteVideo(!dailyMuteVideo)}
                className={`p-3.5 rounded-2xl transition duration-200 border flex items-center space-x-2 text-xs font-bold cursor-pointer ${
                  dailyMuteVideo 
                    ? "bg-rose-950/60 border-rose-500/20 text-rose-400 hover:bg-rose-900" 
                    : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-200"
                }`}
              >
                {dailyMuteVideo ? <VideoOff size={16} /> : <Video size={16} />}
                <span>{dailyMuteVideo ? "Start Camera" : "Stop Camera"}</span>
              </button>
              
              <div className="h-6 w-px bg-neutral-800 hidden sm:block" />

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-neutral-400 font-semibold">Simulate Quality:</span>
                <select
                  value={dailyConnectionSpeed}
                  onChange={(e) => setDailyConnectionSpeed(e.target.value as any)}
                  className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="excellent">Excellent (1080p HD)</option>
                  <option value="good">Good (720p)</option>
                  <option value="poor">Poor (480p Lofi)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowDailyCall(false)}
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-red-600/10 transition active:scale-95 cursor-pointer w-full lg:w-auto"
            >
              End WebRTC Session
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
