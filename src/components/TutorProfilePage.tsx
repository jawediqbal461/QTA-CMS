import React, { useState } from "react";
import { 
  CheckCircle, Star, Calendar as CalendarIcon, DollarSign, Clock, Users, Award, 
  ChevronLeft, Play, Pause, Bookmark, ShieldCheck, Database, FileCode, Server,
  Sparkles, MessageSquare, AlertCircle, Heart, Share2, HelpCircle, UserCheck
} from "lucide-react";
import { Tutor } from "../data/mockData";
import Breadcrumbs from "./Breadcrumbs";
import { useSEO } from "../hooks/useSEO";

export interface Review {
  id: string;
  tutor_id: string;
  student_name: string;
  student_avatar: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  verified: boolean;
}

interface TutorProfilePageProps {
  tutor: Tutor;
  onBookLesson: (tutorId: string, dateTime: string, topic: string) => void;
  onBack: () => void;
  onNavigateHome?: () => void;
  onNavigateTutors?: () => void;
}

// Seed review data for verified trust signals mapped to reviews table
const SEED_REVIEWS: Record<string, Review[]> = {
  "tutor-1": [
    {
      id: "rev-1",
      tutor_id: "tutor-1",
      student_name: "Zayd Bilal",
      student_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
      rating: 5,
      comment: "Sheikh Ahmed's teaching style is incredibly thorough. He caught minor Ghunnah errors I had been making for years. His feedback is very constructive, and the live classroom sandbox with synced whiteboard made all the rules so clear to see.",
      date: "2026-05-14",
      verified: true
    },
    {
      id: "rev-2",
      tutor_id: "tutor-1",
      student_name: "Mariam Yusuf",
      student_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
      rating: 5,
      comment: "My children are studying Hifz under Sheikh Ahmed. He is very patient and keeps them motivated with his smart tracking and warm nature. Recommended for anyone wanting authentic Al-Azhar methodology.",
      date: "2026-06-02",
      verified: true
    },
    {
      id: "rev-3",
      tutor_id: "tutor-1",
      student_name: "Yaseen Ahmed",
      student_avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100",
      rating: 4.8,
      comment: "Great experience learning Makharij correction. Highly structured lessons, and the interactive mistake logger provides very helpful offline review material. Instant bookings work seamlessly.",
      date: "2026-06-20",
      verified: true
    }
  ],
  "tutor-2": [
    {
      id: "rev-4",
      tutor_id: "tutor-2",
      student_name: "Sara Khan",
      student_avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
      rating: 5,
      comment: "Ustadha Fatima is wonderful with kids. My 6 year old daughter completed her Noorani Qaida with correct pronunciation in just 3 months. She looks forward to her classes every single week!",
      date: "2026-04-21",
      verified: true
    },
    {
      id: "rev-5",
      tutor_id: "tutor-2",
      student_name: "Amina Rashid",
      student_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
      rating: 4.8,
      comment: "Excellent teacher for sisters who want to polish their Tajweed. She has an deep grasp of Hafs and Warsh rules, explaining technicalities with great ease. The sticky instant calendar is so easy to use.",
      date: "2026-05-30",
      verified: true
    }
  ],
  "tutor-3": [
    {
      id: "rev-6",
      tutor_id: "tutor-3",
      student_name: "Omar Farooq",
      student_avatar: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=100",
      rating: 5,
      comment: "Sheikh Tariq's intensive Hifz syllabus is exactly what I was searching for. He is incredibly strict about proper rules but very supportive at the same time. His experience shows in how he structures the reviews.",
      date: "2026-06-11",
      verified: true
    }
  ]
};

export default function TutorProfilePage({ 
  tutor, 
  onBookLesson, 
  onBack, 
  onNavigateHome, 
  onNavigateTutors 
}: TutorProfilePageProps) {
  // State for Booking slot
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("Tajweed & Reading Practice");
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  
  // Tab for Methodology / Syllabus & Dev Specs
  const [activeTab, setActiveTab] = useState<"about" | "style" | "dev_spec">("about");

  const tutorReviews = SEED_REVIEWS[tutor.id] || [];

  useSEO({
    title: tutor.seoTitle || `${tutor.name} — ${tutor.specialties[0] || "Quran"} Tutor`,
    description: tutor.seoDescription || tutor.bio,
    image: tutor.avatar,
    schema: {
      "@type": "Person",
      name: tutor.name,
      image: tutor.avatar,
      description: tutor.seoDescription || tutor.bio,
      jobTitle: "Quran Tutor",
      knowsLanguage: tutor.languages,
      ...(tutorReviews.length > 0 ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: tutor.rating,
          reviewCount: tutorReviews.length
        }
      } : {})
    }
  });

  const handleSelectSlot = (day: string, time: string) => {
    setSelectedDay(day);
    setSelectedTime(time);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = () => {
    if (!selectedDay || !selectedTime) return;
    
    // Format a future simulated lesson date
    const dateStr = `Next ${selectedDay} at ${selectedTime}`;
    onBookLesson(tutor.id, dateStr, selectedTopic);
    setBookingSuccess(true);
  };

  const breadcrumbItems = [
    { 
      label: "Scholars Registry", 
      action: onNavigateTutors || onBack,
      icon: <Users size={12} className="text-emerald-400" />
    },
    { 
      label: tutor.name 
    }
  ];

  return (
    <div id="tutor-profile-root" className="max-w-7xl mx-auto p-4 md:p-6 text-neutral-200 space-y-6">
      
      {/* NAVIGATION HEADER WITH BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <Breadcrumbs 
            items={breadcrumbItems}
            onHomeAction={onNavigateHome || onBack}
            showBackButton={true}
            onBackAction={onBack}
          />
        </div>

        <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider font-mono shadow-sm self-start sm:self-center">
          qurantutorsacademy.com Verified Profile
        </span>
      </div>

      {/* SYSTEM ARCHITECT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: HERO, VIDEO, PROFILE DETAILS, REVIEWS (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PROFILE HERO COMPONENT */}
          <div id="tutor-hero-card" className="relative bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
              {/* Tutor Headshot */}
              <div className="relative shrink-0">
                <img 
                  src={tutor.avatar} 
                  alt={tutor.name} 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-emerald-500/30 shadow-2xl" 
                />
                <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-neutral-950 font-black px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider flex items-center shadow-lg">
                  <ShieldCheck size={11} className="mr-0.5" />
                  Verified
                </span>
              </div>

              {/* Tutor Core Meta */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
                    <Award size={10} className="mr-1 text-amber-400 animate-pulse" />
                    Verified Scholar
                  </span>
                  
                  <span className="inline-flex items-center bg-amber-500/15 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
                    Ijazah Certified
                  </span>
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {tutor.name}
                  </h1>
                  <p className="text-xs md:text-sm text-neutral-400 font-medium">
                    {tutor.id === "tutor-1" 
                      ? "Lead Instructor of Tajweed, Hifz & Ten Qira'at" 
                      : tutor.id === "tutor-2" 
                      ? "Specialist in Noorani Qaida, Children's Pedagogies & Ijazah" 
                      : "Senior Master of Hifz Recitations & Tafseer Foundations"}
                  </p>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tutor.specialties.map((spec, idx) => (
                    <span 
                      key={idx}
                      className="bg-neutral-950 text-neutral-400 border border-neutral-850 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Languages list */}
                <p className="text-xs text-neutral-500">
                  <strong className="text-neutral-300">Languages:</strong> {tutor.languages.join(", ")} | <strong className="text-neutral-300">Timezone:</strong> {tutor.timeZone}
                </p>
              </div>
            </div>
          </div>

          {/* STATS OVERVIEW ROW */}
          <div id="tutor-stats-row" className="grid grid-cols-3 gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center text-amber-400 space-x-1">
                <Star size={16} className="fill-amber-400 shrink-0" />
                <span className="text-lg md:text-xl font-black text-white font-mono">{tutor.rating}</span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Review Score</p>
              <p className="text-[9px] text-neutral-500 font-mono">({tutorReviews.length} verified reviews)</p>
            </div>

            <div className="text-center space-y-1 border-l border-neutral-800">
              <div className="flex items-center justify-center text-emerald-400 space-x-1">
                <Clock size={16} className="shrink-0" />
                <span className="text-lg md:text-xl font-black text-white font-mono">{tutor.experience}</span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Teaching Experience</p>
              <p className="text-[9px] text-neutral-500 font-mono">Expert Level</p>
            </div>

            <div className="text-center space-y-1 border-l border-neutral-800">
              <div className="flex items-center justify-center text-indigo-400 space-x-1">
                <Users size={16} className="shrink-0" />
                <span className="text-lg md:text-xl font-black text-white font-mono">{tutor.studentsCount}</span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Students Active</p>
              <p className="text-[9px] text-neutral-500 font-mono">{tutor.lessonsCompleted}+ Hours Taught</p>
            </div>
          </div>

          {/* INTRO VIDEO PORTLET (Competitive Advantage #3) */}
          <div id="video-intro-container" className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-850">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <Play size={14} className="text-emerald-400 fill-emerald-400" />
                  <span>60-Second Video Introduction</span>
                </h3>
                <p className="text-[10px] text-neutral-500">Listen to correct Makharij rules directly from {tutor.name.split(" ")[1]}</p>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                HD Audio Active
              </span>
            </div>

            <div className="relative bg-neutral-950 aspect-video rounded-2xl overflow-hidden border border-neutral-850 shadow-inner flex items-center justify-center">
              {!tutor.videoUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 p-6 text-center">
                  <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-[1px] -z-10" />
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-10 -z-20"
                  />
                  <div className="w-14 h-14 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500">
                    <Play size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Video introduction coming soon</p>
                    <p className="text-xs text-neutral-500">{tutor.name.split(" ")[1]} hasn't uploaded an introduction video yet.</p>
                  </div>
                </div>
              ) : isVideoPlaying ? (
                <iframe
                  src={`${tutor.videoUrl}?autoplay=1`}
                  title={`${tutor.name} Intro Video`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6 text-center">
                  {/* Backdrop Cover Image */}
                  <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-[1px] -z-10" />
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 -z-20"
                  />

                  <button
                    onClick={() => setIsVideoPlaying(true)}
                    aria-label="Play scholar recitation introduction video"
                    className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition text-neutral-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Play size={24} fill="currentColor" className="ml-1" />
                  </button>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Watch scholar recitation introduction video</p>
                    <p className="text-xs text-neutral-500">Hear the correct pronunciation of Arabic phonetics (60 seconds preview)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TAB SELECTION: ABOUT, TEACHING STYLE, DATABASE SPEC */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-5">
            
            {/* TABS */}
            <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-neutral-850">
              <button
                onClick={() => setActiveTab("about")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === "about" ? "bg-emerald-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                }`}
              >
                Bio & Credentials
              </button>
              <button
                onClick={() => setActiveTab("style")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === "style" ? "bg-emerald-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                }`}
              >
                Methodology & Curriculum
              </button>
              {import.meta.env.DEV && (
              <button
                onClick={() => setActiveTab("dev_spec")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === "dev_spec" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                }`}
              >
                🛠️ SQL Database Map
              </button>
              )}
            </div>

            {/* TAB CONTENT */}
            {activeTab === "about" && (
              <div className="space-y-4 animate-fadeIn text-xs md:text-sm leading-relaxed text-neutral-300">
                <div>
                  <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider text-emerald-400 font-mono">Professional Background</h4>
                  <p>{tutor.bio}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-850">
                  <div>
                    <h5 className="font-bold text-white mb-1.5 flex items-center">
                      <CheckCircle size={14} className="text-emerald-400 mr-1.5" /> Verified Qualifications
                    </h5>
                    <ul className="space-y-1 text-xs text-neutral-400 list-disc list-inside">
                      <li>B.A. in Islamic Studies (Al-Azhar University)</li>
                      <li>Double Ijazah in Tajweed & Recitation</li>
                      <li>Certified Member of International Quran Union</li>
                      <li>Criminal Record & Identity Background Cleaned</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-white mb-1.5 flex items-center">
                      <CheckCircle size={14} className="text-emerald-400 mr-1.5" /> Every Lesson Includes
                    </h5>
                    <ul className="space-y-1 text-xs text-neutral-400 list-disc list-inside">
                      <li>HD video & audio virtual classroom</li>
                      <li>Synced interactive Quran whiteboard</li>
                      <li>Instant Tajweed mistake logging</li>
                      <li>Free reschedule up to 2 hours before class</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "style" && (
              <div className="space-y-4 animate-fadeIn text-xs md:text-sm leading-relaxed text-neutral-300">
                <div>
                  <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider text-emerald-400 font-mono">Pedagogy & Teaching Methodology</h4>
                  <p>
                    {tutor.id === "tutor-1" 
                      ? "Employs classical Al-Azhar methodology combined with custom digital correction logs. Lessons start with 5-minute review of prior errors, followed by structured expansion of rules (Iqlab, Izhar), and end with student vocal homework tracking." 
                      : tutor.id === "tutor-2" 
                      ? "Specializes in interactive play-based learning for children, utilizing modern gamified boards, phonetic cartoon characters, and high-praise motivation loops. Parents receive a direct 3-point bullet progress summary after every single lesson." 
                      : "Focused on high-intensity memory retention (Hifz) utilizing the legendary Moroccan slate system, paired with deep Tafseer (explanation) sessions so the student truly reflects upon the beautiful message of the verses."}
                  </p>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-2">
                  <h5 className="font-bold text-white text-xs">Curriculum Focus</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-center">
                      <span className="text-emerald-400 font-black block text-[10px]">98%</span>
                      <span className="text-[8px] text-neutral-500 uppercase font-mono">Tajweed Accuracy</span>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-center">
                      <span className="text-emerald-400 font-black block text-[10px]">15-30 mins</span>
                      <span className="text-[8px] text-neutral-500 uppercase font-mono">Avg Lesson Pace</span>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-center">
                      <span className="text-emerald-400 font-black block text-[10px]">Yes</span>
                      <span className="text-[8px] text-neutral-500 uppercase font-mono">Kids Accommodated</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dev_spec" && import.meta.env.DEV && (
              <div className="space-y-4 animate-fadeIn text-xs">
                <div className="flex justify-between items-center bg-neutral-950 p-2 rounded-lg border border-neutral-850">
                  <span className="font-mono text-amber-400 font-bold flex items-center">
                    <Database size={13} className="mr-1.5 text-amber-500" />
                    <span>PostgreSQL Table Mapping Structures</span>
                  </span>
                  <span className="text-[9px] text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded font-mono">Active Model</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-bold text-white mb-1">1. Table: <code className="text-emerald-400 bg-neutral-950 px-1 py-0.5 rounded">tutor_profiles</code></h5>
                    <pre className="text-[10px] text-neutral-300 bg-neutral-950 p-2.5 rounded-xl font-mono overflow-x-auto">
{`CREATE TABLE tutor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id VARCHAR(50) UNIQUE NOT NULL, -- Links to app auth
  bio TEXT NOT NULL,
  years_of_experience INT NOT NULL DEFAULT 0,
  teaching_style TEXT NOT NULL,
  video_url TEXT,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                    </pre>
                  </div>

                  <div>
                    <h5 className="font-bold text-white mb-1">2. Table: <code className="text-emerald-400 bg-neutral-950 px-1 py-0.5 rounded">reviews</code></h5>
                    <pre className="text-[10px] text-neutral-300 bg-neutral-950 p-2.5 rounded-xl font-mono overflow-x-auto">
{`CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id VARCHAR(50) NOT NULL REFERENCES tutor_profiles(tutor_id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL,
  rating NUMERIC(2, 1) CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STUDENT REVIEWS SECTION */}
          <div id="verified-reviews-section" className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-850">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <MessageSquare size={14} className="text-emerald-400" />
                  <span>Verified Student Reviews ({tutorReviews.length})</span>
                </h3>
                <p className="text-[10px] text-neutral-500">Every comment is verified via student log sessions</p>
              </div>

              <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full font-mono">
                <Star size={11} className="fill-amber-400" />
                <span>{tutor.rating} Avg</span>
              </div>
            </div>

            {/* REVIEWS STREAM */}
            <div className="space-y-4">
              {tutorReviews.map((rev) => (
                <div key={rev.id} className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={rev.student_avatar} alt={rev.student_name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center">
                          {rev.student_name}
                          {rev.verified && (
                            <span className="ml-1.5 text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider flex items-center font-mono">
                              <UserCheck size={9} className="mr-0.5" />
                              Verified Lesson
                            </span>
                          )}
                        </h4>
                        <p className="text-[9px] text-neutral-500 font-mono">Session Date: {rev.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-amber-400 space-x-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={11} 
                          className={i < Math.floor(rev.rating) ? "fill-amber-400" : "text-neutral-700"} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed italic pl-1 border-l-2 border-emerald-500/30">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STICKY BOOKING SIDEBAR (4 COLS) */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          
          {/* PERSISTENT BOOKING CARD (Competitive Advantage #2) */}
          <div id="booking-sticky-sidebar" className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4 relative">
            <div className="absolute top-0 right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px] -z-10" />
            
            {/* Rates Header */}
            <div className="flex justify-between items-baseline pb-3 border-b border-neutral-850">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-bold">Standard Rate</span>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 font-mono">${tutor.hourlyRate}</span>
                <span className="text-xs text-neutral-500">/hr</span>
              </div>
            </div>

            {/* Trial Info */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-[11px] text-neutral-300 leading-normal flex items-start space-x-2">
              <Sparkles size={14} className="text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold text-white">45-Minute Trial Session Includes:</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">1-on-1 recitation review, formal rules diagnostic rating, and custom study syllabus creation.</p>
              </div>
            </div>

            {/* Dynamic Interactive Availability Calendar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white flex items-center">
                  <CalendarIcon size={12} className="text-emerald-400 mr-1.5" />
                  <span>Choose Interactive Slot</span>
                </span>
                <span className="text-[9px] text-emerald-400 font-mono animate-pulse">Click slot to book</span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {Object.entries(tutor.availability).map(([day, slots]) => (
                  <div key={day} className="space-y-1 bg-neutral-950/40 p-2 rounded-xl border border-neutral-850">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-500 font-mono">
                      {day}
                    </span>
                    
                    <div className="grid grid-cols-3 gap-1">
                      {slots.map((time) => {
                        const isSelected = selectedDay === day && selectedTime === time;
                        return (
                          <button
                            key={time}
                            onClick={() => handleSelectSlot(day, time)}
                            className={`py-1 rounded text-[10px] font-mono transition text-center border ${
                              isSelected 
                                ? "bg-emerald-500 text-neutral-950 font-black border-emerald-400 shadow shadow-emerald-500/20" 
                                : "bg-neutral-900 text-neutral-400 border-transparent hover:border-neutral-800 hover:text-white"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Syllabus Topic Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] uppercase font-bold text-neutral-500 font-mono block">Class Study Objective</label>
              <select 
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/40 transition"
              >
                <option value="Noorani Qaida Basics">Noorani Qaida Basics</option>
                <option value="Tajweed & Reading Practice">Tajweed & Reading Practice</option>
                <option value="Hifz (Quran Memorization) Match">Hifz (Quran Memorization)</option>
                <option value="Ten Qira'at Certification">Ten Qira'at Rules</option>
                <option value="Tafseer and Translation Reflection">Tafseer & Translation Reflection</option>
              </select>
            </div>

            {/* BOOKING ACTIONS */}
            <div className="space-y-2 pt-2 border-t border-neutral-850">
              
              {/* Highlight selection */}
              {selectedDay && selectedTime ? (
                <div className="p-2 text-center bg-neutral-950 border border-neutral-850 rounded-xl text-[11px]">
                  <span className="text-neutral-500">Selected Slot: </span>
                  <strong className="text-emerald-400 font-mono">{selectedDay}, {selectedTime}</strong>
                </div>
              ) : (
                <div className="p-2 text-center bg-neutral-950/20 border border-dashed border-neutral-850 rounded-xl text-[10px] text-neutral-500">
                  Please pick an available time slot above.
                </div>
              )}

              {bookingSuccess && (
                <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 rounded-xl text-[11px] text-center space-y-1 animate-fadeIn">
                  <span className="font-bold block">🎉 Booking Confirmed!</span>
                  <p className="text-[10px] text-neutral-400">Successfully linked to your Student desk calendar under "Zayd Bilal".</p>
                </div>
              )}

              <button
                onClick={handleConfirmBooking}
                disabled={!selectedDay || !selectedTime}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-950 font-black py-3 px-4 rounded-xl shadow-lg transition text-xs flex items-center justify-center space-x-1.5"
              >
                <CalendarIcon size={14} />
                <span>Book Trial Lesson Instantly</span>
              </button>

              <p className="text-[9px] text-center text-neutral-500 leading-normal">
                By clicking "Book", you will schedule a live virtual session. Zero obligation trial. Reschedule up to 2 hours before class.
              </p>
            </div>

          </div>

          {/* ACADEMIC ASSURANCE BANNER */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-xs space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>Academic Trust Signal Guarantee</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              If you aren't completely satisfied with your tutor's teaching methodology, we will issue a full refund and match you with another scholar completely free.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
