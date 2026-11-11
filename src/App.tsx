import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen, Users, Calendar, Shield, Play, RotateCcw, Sparkles,
  Layers, ExternalLink, HelpCircle, CheckCircle, Flame, Star,
  LogIn, ChevronDown, GraduationCap, Menu, X, Book, FileText, UserPlus, Library, DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import {
  Tutor, Student, Lesson, Curriculum,
  INITIAL_TUTORS, INITIAL_STUDENTS, INITIAL_LESSONS, INITIAL_CURRICULUM,
} from "./data/mockData";
import legacyBlogIndex from "./data/blog-legacy/index.json";
import { clearStoredAdminToken, getStoredAdminToken } from "./lib/api";

// PublicHome is the landing view, so it's loaded eagerly.
// Everything else is only needed after explicit navigation, so it's
// code-split into its own chunk to keep the initial bundle smaller.
import PublicHome from "./components/PublicHome";
import { AccountPortal, PublicTutors, VerifyEmail } from "./components/Marketplace";
const Classroom = lazy(() => import("./components/Classroom"));
const AdminCMS = lazy(() => import("./components/AdminCMS"));
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const TutorPublicPage = lazy(() => import("./components/TutorPublicPage"));
const CertificatePage = lazy(() => import("./components/CertificatePage"));
const LegacyQuran = lazy(() => import("./components/LegacyQuran"));
const ResourcesPage = lazy(() => import("./components/ResourcesPage"));
const PricingPage = lazy(() => import("./components/PricingPage"));
const CoursesPage = lazy(() => import("./components/CoursesPage"));
const BlogsPage = lazy(() => import("./components/BlogsPage"));
const LegacyBlog = lazy(() => import("./components/LegacyBlog"));
const BlogPostPage = lazy(() => import("./components/BlogPostPage"));

// Minimal, theme-matched fallback shown while a lazy-loaded portal chunk downloads.
function PortalLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-neutral-800 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );
}

// Renders a single tutor's profile at /tutors/:slug, resolved from the live tutors list.
// Keeping this as its own route (instead of nesting it inside the directory) is what gives
// every scholar profile a real, shareable, SEO-friendly URL.
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE ---
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);

  const [adminInitialSubTab, setAdminInitialSubTab] = useState<"overview" | "architecture" | "sitemap" | "database" | "curriculum" | "profiles" | "quran_crud" | "blog_crud" | undefined>(undefined);
  const [activeLessonInClassroom, setActiveLessonInClassroom] = useState<Lesson | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [deskMenuOpen, setDeskMenuOpen] = useState(false);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState<boolean>(true);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => getStoredAdminToken() !== null);

  // --- INITIALIZATION FROM LOCALSTORAGE ---
  useEffect(() => {
    try {
      const storedTutors = localStorage.getItem("qta_tutors");
      const storedStudents = localStorage.getItem("qta_students");
      const storedLessons = localStorage.getItem("qta_lessons");
      const storedCurriculums = localStorage.getItem("qta_curriculums");

      if (storedTutors) {
        const parsed: Tutor[] = JSON.parse(storedTutors);
        const updated = parsed.map(t => {
          if (t.hourlyRate === undefined) {
            const orig = INITIAL_TUTORS.find(o => o.id === t.id);
            return { ...t, hourlyRate: orig?.hourlyRate || 30 };
          }
          return t;
        });
        setTutors(updated);
      } else {
        setTutors(INITIAL_TUTORS);
        localStorage.setItem("qta_tutors", JSON.stringify(INITIAL_TUTORS));
      }

      if (storedStudents) setStudents(JSON.parse(storedStudents));
      else {
        setStudents(INITIAL_STUDENTS);
        localStorage.setItem("qta_students", JSON.stringify(INITIAL_STUDENTS));
      }

      if (storedLessons) setLessons(JSON.parse(storedLessons));
      else {
        setLessons(INITIAL_LESSONS);
        localStorage.setItem("qta_lessons", JSON.stringify(INITIAL_LESSONS));
      }

      if (storedCurriculums) setCurriculums(JSON.parse(storedCurriculums));
      else {
        setCurriculums(INITIAL_CURRICULUM);
        localStorage.setItem("qta_curriculums", JSON.stringify(INITIAL_CURRICULUM));
      }
    } catch (e) {
      console.error("Failed to load local storage state", e);
      // Fallbacks
      setTutors(INITIAL_TUTORS);
      setStudents(INITIAL_STUDENTS);
      setLessons(INITIAL_LESSONS);
      setCurriculums(INITIAL_CURRICULUM);
    }
  }, []);

  // --- SAVE STATE PERSISTENCE HELPERS ---
  const saveTutors = (updated: Tutor[]) => {
    setTutors(updated);
    localStorage.setItem("qta_tutors", JSON.stringify(updated));
  };

  const saveStudents = (updated: Student[]) => {
    setStudents(updated);
    localStorage.setItem("qta_students", JSON.stringify(updated));
  };

  const saveLessons = (updated: Lesson[]) => {
    setLessons(updated);
    localStorage.setItem("qta_lessons", JSON.stringify(updated));
  };

  const saveCurriculums = (updated: Curriculum[]) => {
    setCurriculums(updated);
    localStorage.setItem("qta_curriculums", JSON.stringify(updated));
  };

  // --- STATE MUTATORS ---

  // Triggered when student books a lesson
  // Triggered when tutor schedules a lesson
  // Save updated weekly slots
  // Launch live classroom
  const handleJoinClassroom = (lesson: Lesson) => {
    // Force status to "live" if it was scheduled
    const updatedLessons = lessons.map(l => {
      if (l.id === lesson.id) {
        return { ...l, status: "live" as const };
      }
      return l;
    });
    saveLessons(updatedLessons);

    const activeLess = updatedLessons.find(l => l.id === lesson.id) || lesson;
    setActiveLessonInClassroom(activeLess);
    navigate("/classroom");
  };

  // End live class & submit assessment results
  const handleCompleteLessonInClassroom = (
    notes: string,
    newMistakes: { type: string; description: string; severity: "minor" | "major" }[]
  ) => {
    if (!activeLessonInClassroom) return;

    const currentLessonId = activeLessonInClassroom.id;
    const currentStudentId = activeLessonInClassroom.studentId;

    // 1. Mark lesson as completed
    const updatedLessons = lessons.map(l => {
      if (l.id === currentLessonId) {
        return { ...l, status: "completed" as const, notes };
      }
      return l;
    });
    saveLessons(updatedLessons);

    // 2. Append mistakes to student and slightly tweak their Tajweed score based on mistakes count
    const studentObj = students.find(s => s.id === currentStudentId);
    if (studentObj) {
      const formattedMistakes = newMistakes.map(m => ({
        id: "mistake-" + Date.now() + "-" + Math.random(),
        date: new Date().toISOString().split("T")[0],
        type: m.type as any,
        description: m.description,
        severity: m.severity
      }));

      // Adjust score: penalize -2 for minor, -5 for major
      let scorePenalty = 0;
      newMistakes.forEach(m => {
        scorePenalty += m.severity === "major" ? 5 : 2;
      });
      const newScore = Math.max(60, Math.min(100, studentObj.progress.tajweedScore - scorePenalty + (newMistakes.length === 0 ? 3 : 0)));

      // Nudge memorization progress forward slightly on each completed lesson.
      const newHifzProgress = Math.min(100, studentObj.progress.hifzProgress + 1);

      const updatedStudent: Student = {
        ...studentObj,
        progress: {
          ...studentObj.progress,
          tajweedScore: newScore,
          hifzProgress: newHifzProgress,
          recentMistakes: [...formattedMistakes, ...studentObj.progress.recentMistakes].slice(0, 5) // Keep top 5
        }
      };

      const updatedStudents = students.map(s => {
        if (s.id === currentStudentId) return updatedStudent;
        return s;
      });
      saveStudents(updatedStudents);
    }

    // 3. Increment lessonsCompleted count on tutor profile
    const tutorId = activeLessonInClassroom.tutorId;
    const updatedTutors = tutors.map(t => {
      if (t.id === tutorId) {
        return { ...t, lessonsCompleted: t.lessonsCompleted + 1 };
      }
      return t;
    });
    saveTutors(updatedTutors);

    setActiveLessonInClassroom(null);
    navigate("/tutor"); // return to tutor portal default
  };

  // Admin CMS - Curriculum Actions
  const handleAddCurriculum = (newCurr: Curriculum) => {
    const updated = [newCurr, ...curriculums];
    saveCurriculums(updated);
  };

  const handleDeleteCurriculum = (id: string) => {
    const updated = curriculums.filter(c => c.id !== id);
    saveCurriculums(updated);
  };

  // Admin CMS - Public Profile Update
  const handleUpdateTutorProfile = (tutorId: string, updatedTutor: Partial<Tutor>) => {
    const updated = tutors.map(t => {
      if (t.id === tutorId) {
        return { ...t, ...updatedTutor };
      }
      return t;
    });
    saveTutors(updated);
  };

  // New student registration — creates a real Student record, saved to local storage
  // like every other piece of app data (this pilot has no backend to send it to).
  // New tutor application — creates a real Tutor record with a unique slug, so the
  // new profile shows up immediately in the Scholars Registry with a real, shareable URL.
  // Reset demo defaults helper
  const handleResetDemoData = () => {
    if (window.confirm("Do you want to restore the tutoring academy database to default seeds? All manual bookings, curriculum changes, and mistake logs will be reset.")) {
      localStorage.removeItem("qta_tutors");
      localStorage.removeItem("qta_students");
      localStorage.removeItem("qta_lessons");
      localStorage.removeItem("qta_curriculums");

      setTutors(INITIAL_TUTORS);
      setStudents(INITIAL_STUDENTS);
      setLessons(INITIAL_LESSONS);
      setCurriculums(INITIAL_CURRICULUM);
      setActiveLessonInClassroom(null);
      navigate("/tutor");
    }
  };

  // Get active student and tutor for active classroom stream
  const classroomStudent = students.find(s => s.id === activeLessonInClassroom?.studentId) || students[0];
  const classroomTutor = tutors.find(t => t.id === activeLessonInClassroom?.tutorId) || tutors[0];

  // Nav active-state helpers, driven by the real browser URL
  const isPath = (path: string) => location.pathname === path;
  const isPathPrefix = (prefix: string) => location.pathname === prefix || location.pathname.startsWith(prefix + "/");

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">

      {/* GLOBAL PERSISTENT ANNOUNCEMENT BAR */}
      <AnimatePresence>
        {isAnnouncementVisible && isAdminAuthenticated && isPathPrefix("/admin") && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-950 to-neutral-950 border-b border-emerald-500/15 text-neutral-200 px-4 py-2 text-xs font-medium flex flex-wrap items-center justify-between gap-2 shadow-lg relative z-50"
          >
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Sparkles size={13} className="text-amber-400 animate-pulse shrink-0" />
              <span>
                Prototype content tools use demo data stored in this browser.
              </span>
            </div>
            <div className="flex items-center space-x-3 ml-auto sm:ml-0">
              <button
                onClick={handleResetDemoData}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-all font-bold px-3 py-1 rounded-lg text-[10px] tracking-wider uppercase cursor-pointer shadow-md hover:shadow-emerald-500/10 active:scale-95"
              >
                Reset local demo data
              </button>
              <button
                onClick={() => setIsAnnouncementVisible(false)}
                className="text-neutral-400 hover:text-white transition p-1 rounded-full hover:bg-white/5 cursor-pointer"
                title="Dismiss Banner"
                aria-label="Dismiss announcement banner"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MASTER SYSTEM HEADER */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-900/65 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-18 flex items-center justify-between">

          {/* BRANDING */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              navigate("/");
              setIsMobileMenuOpen(false);
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <BookOpen size={18} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-black tracking-widest text-emerald-400 block font-mono">QTA SCHOLARS</span>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black px-1 rounded-md uppercase font-mono scale-90">PRO</span>
              </div>
              <span className="text-sm font-black text-white block -mt-1 group-hover:text-emerald-300 transition-colors">Academy CMS</span>
            </div>
          </div>

          {/* DESKTOP SWITCH BUTTONS */}
          <nav className="hidden lg:flex items-center gap-1 bg-neutral-900/40 p-1 rounded-2xl border border-neutral-800/80">

            <button
              onClick={() => {
                navigate("/");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                isPath("/")
                  ? "bg-neutral-800/85 text-white shadow-inner border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BookOpen size={14} className={isPath("/") ? "text-emerald-400" : "text-neutral-400"} />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                navigate("/tutors");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                isPathPrefix("/tutors")
                  ? "bg-neutral-800/85 text-white shadow-inner border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users size={14} className={isPathPrefix("/tutors") ? "text-emerald-400" : "text-neutral-400"} />
              <span>Find a Tutor</span>
            </button>

            <button
              onClick={() => {
                navigate("/quran");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                isPath("/quran")
                  ? "bg-neutral-800/85 text-white shadow-inner border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Book size={14} className={isPath("/quran") ? "text-emerald-400" : "text-neutral-400"} />
              <span>Quran</span>
            </button>

            <button
              onClick={() => navigate("/blog/")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                (isPathPrefix("/blog") || legacyBlogIndex.some((post) => isPathPrefix(post.path.slice(0, -1))))
                  ? "bg-neutral-800/85 text-white shadow-inner border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText size={14} className={isPathPrefix("/blog") ? "text-emerald-400" : "text-neutral-400"} />
              <span>Blogs</span>
            </button>

            <button
              onClick={() => navigate("/resources")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                isPathPrefix("/resources")
                  ? "bg-neutral-800/85 text-white shadow-inner border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Library size={14} className={isPathPrefix("/resources") ? "text-emerald-400" : "text-neutral-400"} />
              <span>Resources</span>
            </button>

            <button
              onClick={() => navigate("/pricing")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                isPathPrefix("/pricing")
                  ? "bg-neutral-800/85 text-white shadow-inner border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <DollarSign size={14} className={isPathPrefix("/pricing") ? "text-emerald-400" : "text-neutral-400"} />
              <span>Pricing</span>
            </button>

            <button
              onClick={() => navigate("/courses")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                isPathPrefix("/courses")
                  ? "bg-neutral-800/85 text-white shadow-inner border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <GraduationCap size={14} className={isPathPrefix("/courses") ? "text-emerald-400" : "text-neutral-400"} />
              <span>Courses</span>
            </button>

            <div className="relative py-1"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDeskMenuOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && deskMenuOpen) {
                  setDeskMenuOpen(false);
                  event.currentTarget.querySelector("button")?.focus();
                }
              }}
            >
              <button
                type="button"
                aria-expanded={deskMenuOpen}
                aria-controls="desktop-login-desks"
                onClick={() => setDeskMenuOpen((open) => !open)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isPath("/student") || isPath("/tutor") || isPath("/guardian") || isPathPrefix("/login")
                    ? "bg-emerald-600 text-neutral-950 shadow-md shadow-emerald-500/10"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <LogIn size={14} />
                <span>Login</span>
                <ChevronDown size={12} className={`opacity-60 transition-transform duration-200 ${deskMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <div id="desktop-login-desks" hidden={!deskMenuOpen} className="absolute right-0 top-full pt-1.5 min-w-[220px] z-50">
              <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-2 backdrop-blur-xl animate-fade-in-up">
                <div className="px-3 py-1.5 text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider font-mono border-b border-neutral-850 mb-1">
                  Access Portal Accounts
                </div>

                {/* Student Desk Option */}
                <button
                  onClick={() => {
                    setDeskMenuOpen(false);
                    navigate("/student");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-start space-x-2.5 cursor-pointer ${
                    isPath("/student")
                      ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <Users size={15} className="mt-0.5 text-indigo-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>Student Desk</span>
                    <span className="text-[9px] font-normal text-neutral-500 font-mono -mt-0.5">Learn & schedule trials</span>
                  </div>
                </button>

                {/* Teacher / Tutor Portal Option */}
                <button
                  onClick={() => {
                    setDeskMenuOpen(false);
                    navigate("/tutor");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-start space-x-2.5 mt-1 cursor-pointer ${
                    isPath("/tutor")
                      ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/25"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <GraduationCap size={15} className="mt-0.5 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>Teacher Desk</span>
                    <span className="text-[9px] font-normal text-neutral-500 font-mono -mt-0.5">Manage classes & reviews</span>
                  </div>
                </button>
                <button type="button"
                  onClick={() => { setDeskMenuOpen(false); navigate("/guardian"); }}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white"
                >
                  <Users size={15} className="text-amber-400" />
                  Guardian Desk
                </button>
              </div>
              </div>
            </div>

            {/* HOVER DROPDOWN: SIGN UP AS STUDENT OR TUTOR */}
            <div className="relative group py-1">
              <button
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isPathPrefix("/signup")
                    ? "bg-neutral-800/85 text-white shadow-inner border border-neutral-700/50"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <UserPlus size={14} className={isPathPrefix("/signup") ? "text-emerald-400" : "text-neutral-400"} />
                <span>Sign Up</span>
                <ChevronDown size={12} className="opacity-60 transition-transform duration-200 group-hover:rotate-180" />
              </button>

              <div className="absolute right-0 top-full hidden group-hover:block pt-1.5 min-w-[220px] z-50">
              <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-2 backdrop-blur-xl animate-fade-in-up">
                <div className="px-3 py-1.5 text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider font-mono border-b border-neutral-850 mb-1">
                  Join the Academy
                </div>

                <button
                  onClick={() => navigate("/signup/student")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-start space-x-2.5 cursor-pointer ${
                    isPath("/signup/student")
                      ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <Users size={15} className="mt-0.5 text-indigo-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>Student Sign-Up</span>
                    <span className="text-[9px] font-normal text-neutral-500 font-mono -mt-0.5">Create your student profile</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/signup/tutor")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-start space-x-2.5 mt-1 cursor-pointer ${
                    isPath("/signup/tutor")
                      ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/25"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <GraduationCap size={15} className="mt-0.5 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>Tutor Sign-Up</span>
                    <span className="text-[9px] font-normal text-neutral-500 font-mono -mt-0.5">Apply to teach with us</span>
                  </div>
                </button>
              </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (activeLessonInClassroom) {
                  navigate("/classroom");
                } else {
                  const scheduled = lessons.find(l => l.status === "scheduled" || l.status === "live");
                  if (scheduled) {
                    handleJoinClassroom(scheduled);
                  } else {
                    alert("Please schedule a lesson first or join from the Portal desks directly!");
                  }
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 relative cursor-pointer ${
                isPath("/classroom")
                  ? "bg-neutral-800 text-white border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Play size={13} className="text-emerald-400" />
              <span>Tutoring Class</span>
              {lessons.filter(l => l.status === "scheduled" || l.status === "live").length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>


          </nav>

          {/* MOBILE TOGGLE BUTTON */}
          <div className="flex lg:hidden items-center space-x-2">
            {lessons.filter(l => l.status === "scheduled" || l.status === "live").length > 0 && !isPath("/classroom") && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse block" />
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 transition rounded-xl text-neutral-300 hover:text-white cursor-pointer"
              title="Toggle Menu"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden absolute top-full left-0 w-full bg-neutral-950 border-b border-neutral-850 shadow-2xl z-40 p-4 space-y-3 backdrop-blur-xl overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2">

                <button
                  onClick={() => {
                    navigate("/");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPath("/")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-900 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-850"
                  }`}
                >
                  <BookOpen size={16} />
                  <span>Home</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/tutors");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPathPrefix("/tutors")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-900 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-850"
                  }`}
                >
                  <Users size={16} />
                  <span>Find a Tutor</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/quran");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPath("/quran")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-900 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-850"
                  }`}
                >
                  <Book size={16} />
                  <span>Quran Study</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/blog/");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPathPrefix("/blog")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-900 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-850"
                  }`}
                >
                  <FileText size={16} />
                  <span>Blogs</span>
                </button>

                <button
                  onClick={() => { navigate("/resources"); setIsMobileMenuOpen(false); }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPathPrefix("/resources")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-900 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-850"
                  }`}
                >
                  <Library size={16} />
                  <span>Resources</span>
                </button>

                <button
                  onClick={() => { navigate("/pricing"); setIsMobileMenuOpen(false); }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPathPrefix("/pricing")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-900 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-850"
                  }`}
                >
                  <DollarSign size={16} />
                  <span>Pricing</span>
                </button>

                <button
                  onClick={() => { navigate("/courses"); setIsMobileMenuOpen(false); }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPathPrefix("/courses")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-900 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-850"
                  }`}
                >
                  <GraduationCap size={16} />
                  <span>Courses</span>
                </button>

                <button
                  onClick={() => {
                    if (activeLessonInClassroom) {
                      navigate("/classroom");
                    } else {
                      const scheduled = lessons.find(l => l.status === "scheduled" || l.status === "live");
                      if (scheduled) {
                        handleJoinClassroom(scheduled);
                      } else {
                        alert("Please schedule a lesson first!");
                      }
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPath("/classroom")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-900 text-neutral-400 border-transparent hover:text-white hover:bg-neutral-850"
                  }`}
                >
                  <Play size={16} className="text-emerald-400" />
                  <span>Tutoring Class</span>
                </button>

              </div>

              {/* Account / Administration Sections */}
              <div className="border-t border-neutral-900 pt-3 space-y-2">
                <span className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-widest block px-1 font-mono">
                  Portal & CMS Access
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigate("/student");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                      isPath("/student")
                        ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/25"
                        : "bg-neutral-900 text-neutral-300 border-transparent hover:bg-neutral-850"
                    }`}
                  >
                    <Users size={14} className="text-indigo-400" />
                    <span>Student Desk</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/tutor");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                      isPath("/tutor")
                        ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/25"
                        : "bg-neutral-900 text-neutral-300 border-transparent hover:bg-neutral-850"
                    }`}
                  >
                    <GraduationCap size={14} className="text-emerald-400" />
                    <span>Teacher Desk</span>
                  </button>
                </div>

              </div>

              {/* Sign Up Section */}
              <div className="border-t border-neutral-900 pt-3 space-y-2">
                <span className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-widest block px-1 font-mono">
                  Join the Academy
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigate("/signup/student");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                      isPath("/signup/student")
                        ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/25"
                        : "bg-neutral-900 text-neutral-300 border-transparent hover:bg-neutral-850"
                    }`}
                  >
                    <Users size={14} className="text-indigo-400" />
                    <span>Student Sign-Up</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/signup/tutor");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                      isPath("/signup/tutor")
                        ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/25"
                        : "bg-neutral-900 text-neutral-300 border-transparent hover:bg-neutral-850"
                    }`}
                  >
                    <GraduationCap size={14} className="text-emerald-400" />
                    <span>Tutor Sign-Up</span>
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </header>

      {/* PORTAL MAIN CONTENT */}
      <main className="flex-1 pb-16">
        <Suspense fallback={<PortalLoadingFallback />}>
          <Routes>

            {/* Public Landing Page */}
            <Route path="/" element={
              <PublicHome
                curriculums={curriculums}
                onNavigateToPortal={(portal) => {
                  const path = portal === "tutor" ? "/tutor" : portal === "student" ? "/student" : portal === "classroom" ? "/classroom" : "/admin";
                  navigate(path);
                }}
                onNavigateToAdmin={(subTab) => {
                  setAdminInitialSubTab(subTab);
                  navigate("/admin/content");
                }}
              />
            } />

            <Route path="/tutors" element={<PublicTutors />} />
            <Route path="/tutors/:slug" element={<TutorPublicPage />} />

            {/* Academy Insights — blog listing and individual real, SEO-friendly article URLs */}
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blogs/:slug" element={<BlogPostPage />} />
            <Route path="/blog/" element={<LegacyBlog />} />
            {legacyBlogIndex.map(({ path }) =>
              React.createElement(Route, { key: path, path, element: <LegacyBlog /> })
            )}

            <Route path="/signup/student" element={React.createElement(AccountPortal, { key: "student-signup", role: "STUDENT", register: true })} />
            <Route path="/signup/guardian" element={React.createElement(AccountPortal, { key: "guardian-signup", role: "GUARDIAN", register: true })} />
            <Route path="/signup/tutor" element={React.createElement(AccountPortal, { key: "tutor-signup", role: "TUTOR", register: true })} />
            <Route path="/login/student" element={React.createElement(AccountPortal, { key: "student-login", role: "STUDENT", login: true })} />
            <Route path="/login/guardian" element={React.createElement(AccountPortal, { key: "guardian-login", role: "GUARDIAN", login: true })} />
            <Route path="/login/tutor" element={React.createElement(AccountPortal, { key: "tutor-login", role: "TUTOR", login: true })} />
            <Route path="/student" element={React.createElement(AccountPortal, { key: "student", role: "STUDENT" })} />
            <Route path="/guardian" element={React.createElement(AccountPortal, { key: "guardian", role: "GUARDIAN" })} />
            <Route path="/tutor" element={React.createElement(AccountPortal, { key: "tutor", role: "TUTOR" })} />
            <Route path="/admin/tutors" element={isAdminAuthenticated ? (
              <AdminCMS
                curriculums={curriculums}
                tutors={tutors}
                onAddCurriculum={handleAddCurriculum}
                onDeleteCurriculum={handleDeleteCurriculum}
                onUpdateTutorProfile={handleUpdateTutorProfile}
                initialSubTab="tutor_applications"
                token={getStoredAdminToken() ?? ""}
                onLogout={() => { clearStoredAdminToken(); setIsAdminAuthenticated(false); }}
                onNavigateHome={() => navigate("/")}
              />
            ) : (
              <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} onBackToHome={() => navigate("/")} />
            )} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/admin/operations" element={isAdminAuthenticated ? (
              <AdminCMS
                curriculums={curriculums}
                tutors={tutors}
                onAddCurriculum={handleAddCurriculum}
                onDeleteCurriculum={handleDeleteCurriculum}
                onUpdateTutorProfile={handleUpdateTutorProfile}
                initialSubTab="lesson_recovery"
                token={getStoredAdminToken() ?? ""}
                onLogout={() => { clearStoredAdminToken(); setIsAdminAuthenticated(false); }}
                onNavigateHome={() => navigate("/")}
              />
            ) : (
              <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} onBackToHome={() => navigate("/")} />
            )} />

            {/* Live Classroom Simulator */}
            <Route path="/classroom" element={
              activeLessonInClassroom ? (
                <Classroom
                  lesson={activeLessonInClassroom}
                  student={classroomStudent}
                  tutor={classroomTutor}
                  onExit={() => {
                    setActiveLessonInClassroom(null);
                    navigate("/tutor");
                  }}
                  onCompleteLesson={handleCompleteLessonInClassroom}
                />
              ) : (
                <div className="max-w-md mx-auto mt-24 bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center text-emerald-400 mx-auto">
                    <Play size={24} />
                  </div>
                  <h2 className="text-lg font-bold text-white">Classroom demo</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Explore the classroom controls with a sample lesson.
                  </p>
                  <button
                    onClick={() => {
                      const firstLess = lessons[0];
                      if (firstLess) handleJoinClassroom(firstLess);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    Quick Demo: Connect First Scheduled Session
                  </button>
                </div>
              )
            } />

            {/* Admin CMS and database layout */}
            <Route path="/admin" element={isAdminAuthenticated ? (
              <AdminCMS
                curriculums={curriculums}
                tutors={tutors}
                onAddCurriculum={handleAddCurriculum}
                onDeleteCurriculum={handleDeleteCurriculum}
                onUpdateTutorProfile={handleUpdateTutorProfile}
                initialSubTab="accounts"
                token={getStoredAdminToken() ?? ""}
                onLogout={() => { clearStoredAdminToken(); setIsAdminAuthenticated(false); }}
                onNavigateHome={() => navigate("/")}
              />
            ) : (
              <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} onBackToHome={() => navigate("/")} />
            )} />
            <Route path="/admin/content" element={
              isAdminAuthenticated ? (
                <AdminCMS
                  curriculums={curriculums}
                  tutors={tutors}
                  onAddCurriculum={handleAddCurriculum}
                  onDeleteCurriculum={handleDeleteCurriculum}
                  onUpdateTutorProfile={handleUpdateTutorProfile}
                  initialSubTab={adminInitialSubTab || "overview"}
                  token={getStoredAdminToken() ?? ""}
                  onLogout={() => {
                    clearStoredAdminToken();
                    setIsAdminAuthenticated(false);
                  }}
                  onNavigateHome={() => navigate("/")}
                />
              ) : (
                <AdminLogin
                  onLoginSuccess={() => setIsAdminAuthenticated(true)}
                  onBackToHome={() => navigate("/")}
                />
              )
            } />

            <Route path="/certificate" element={<CertificatePage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/courses" element={<CoursesPage />} />

            <Route path="/quran" element={<LegacyQuran />} />
            <Route path="/quran/:surahSlug" element={<LegacyQuran />} />

            {/* Unknown paths fall back to the homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </main>

      {/* FOOTER */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-6 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Quran Tutors Academy • Custom CMS Pilot Platform.</p>
          <div className="flex space-x-4">
            <span className="text-[10px] bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800 text-neutral-400 font-mono">
              Built with React, Vite & Tailwind
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
