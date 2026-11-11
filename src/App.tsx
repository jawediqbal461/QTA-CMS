import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen, Users, Calendar, Shield, Play, RotateCcw, Sparkles,
  Layers, ExternalLink, HelpCircle, CheckCircle, Flame, Star,
  LogIn, ChevronDown, GraduationCap, Menu, X, Book, FileText, UserPlus, Library, DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import legacyBlogIndex from "./data/blog-legacy/index.json";
import { accountRequest, ApiError, clearStoredAdminToken, getStoredAdminToken } from "./lib/api";

// PublicHome is the landing view, so it's loaded eagerly.
// Everything else is only needed after explicit navigation, so it's
// code-split into its own chunk to keep the initial bundle smaller.
import PublicHome from "./components/PublicHome";
import { AccountPortal, PublicTutors, VerifyEmail } from "./components/Marketplace";
const LiveRoom = lazy(() => import("./components/LiveRoom"));
const TajweedQuiz = lazy(() => import("./components/TajweedQuiz"));
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [deskMenuOpen, setDeskMenuOpen] = useState(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => getStoredAdminToken() !== null);

  // A stored token can be expired, revoked, or belong to a non-admin account; drop it instead of showing an empty CMS.
  useEffect(() => {
    const token = getStoredAdminToken();
    if (!token) return;
    accountRequest<{ role: string }>("/auth/me", token).then(
      (me) => {
        if (me.role !== "ACADEMY_ADMIN" && me.role !== "PLATFORM_ADMIN") {
          clearStoredAdminToken();
          setIsAdminAuthenticated(false);
        }
      },
      (error) => {
        if (error instanceof ApiError && error.status === 401) {
          clearStoredAdminToken();
          setIsAdminAuthenticated(false);
        }
      },
    );
  }, [isAdminAuthenticated]);

  // Nav active-state helpers, driven by the real browser URL
  const isPath = (path: string) => location.pathname === path;
  const isPathPrefix = (prefix: string) => location.pathname === prefix || location.pathname.startsWith(prefix + "/");

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">

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
              onClick={() => navigate("/classroom/demo")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 relative cursor-pointer ${
                isPathPrefix("/classroom")
                  ? "bg-neutral-800 text-white border border-neutral-700/50"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Play size={13} className="text-emerald-400" />
              <span>Tutoring Class</span>
            </button>


          </nav>

          {/* MOBILE TOGGLE BUTTON */}
          <div className="flex lg:hidden items-center space-x-2">
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
                    navigate("/classroom/demo");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 border ${
                    isPathPrefix("/classroom")
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
              <PublicHome />
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
                initialSubTab="lesson_recovery"
                token={getStoredAdminToken() ?? ""}
                onLogout={() => { clearStoredAdminToken(); setIsAdminAuthenticated(false); }}
                onNavigateHome={() => navigate("/")}
              />
            ) : (
              <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} onBackToHome={() => navigate("/")} />
            )} />

            {/* Live Classroom — real Jitsi-based sessions */}
            <Route path="/classroom/demo" element={<LiveRoom />} />
            <Route path="/classroom/:kind/:id" element={<LiveRoom />} />
            <Route path="/classroom/:id" element={<LiveRoom />} />
            {/* Tajweed Quiz */}
            <Route path="/quiz/tajweed" element={<TajweedQuiz />} />

            {/* Admin CMS and database layout */}
            <Route path="/admin" element={isAdminAuthenticated ? (
              <AdminCMS
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
                  initialSubTab="overview"
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
