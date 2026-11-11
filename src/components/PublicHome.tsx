import { FeaturedTutors } from "./Marketplace";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, BookOpen, BookOpenCheck, CheckCircle, Clock, Globe, Play, ShieldCheck, Sparkles,
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { request } from "../lib/api";
import { fetchPosts, formatDate, type PostSummary } from "../lib/content";

type CourseCard = {
  id: string; title: string; description: string | null; program: string; level: string;
  language: string; durationWeeks: number | null; priceAmount: string | null; priceCurrency: string;
  tutor: { account: { fullName: string } };
};
type TutorRate = { hourlyRate: string };

export default function PublicHome() {
  useSEO({
    title: "Learn Quran Online with Approved Tajweed Tutors",
    description: "Learn the Holy Quran online with approved tutors — live video lessons, Hifz and Tajweed progress tracking, and a free Quran reading and audio companion.",
    schema: { "@type": "EducationalOrganization", name: "Quran Tutors Academy" }
  });

  const navigate = useNavigate();
  const [lessonsPerWeek, setLessonsPerWeek] = useState<number>(3);
  const [tutors, setTutors] = useState<TutorRate[] | null>(null);
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [posts, setPosts] = useState<PostSummary[]>([]);

  useEffect(() => {
    request<TutorRate[]>("/tutors").then(setTutors, () => setTutors([]));
    request<CourseCard[]>("/courses").then((rows) => setCourses(rows.slice(0, 4)), () => {});
    fetchPosts().then((rows) => setPosts(rows.slice(0, 4)), () => {});
  }, []);

  const rates = (tutors ?? []).map((tutor) => Number(tutor.hourlyRate)).filter((rate) => Number.isFinite(rate) && rate > 0);
  const averageRate = rates.length ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : null;

  return (
    <div className="space-y-20 px-4 md:px-6 max-w-7xl mx-auto py-10 text-neutral-200">

      {/* 1. HERO SECTION */}
      <section className="relative rounded-[36px] bg-neutral-900 border border-neutral-800 p-8 md:p-14 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
              <Sparkles className="text-emerald-400 w-4 h-4 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-400">Academy-approved Quran tutors</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Learn Holy Quran with <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">Authentic Tajweed</span> & Dedicated Tutors
            </h1>

            <p className="text-sm md:text-base text-neutral-400 max-w-xl leading-relaxed">
              Book live one-to-one lessons at <strong className="text-neutral-200 font-semibold">qurantutorsacademy.com</strong>. Every tutor is reviewed by the academy, and each lesson ends with notes and progress your family can read.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => document.getElementById("certified-tutors")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-6 py-3.5 rounded-xl text-sm transition duration-200 shadow-lg shadow-emerald-500/15 flex items-center space-x-2 cursor-pointer"
              >
                <span>Browse Tutors Directory</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate("/quiz/tajweed")}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm border border-neutral-700 transition duration-200 flex items-center space-x-2"
              >
                <span>Take Tajweed Skill Quiz</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-800/80 max-w-lg">
              <div>
                <p className="text-xl md:text-2xl font-black text-white font-mono">{tutors && tutors.length ? tutors.length : "—"}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">Approved Tutors</p>
              </div>
              <div className="border-l border-neutral-800 pl-4">
                <p className="text-xl md:text-2xl font-black text-emerald-400 font-mono">{averageRate ? `$${averageRate.toFixed(0)}` : "—"}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">Average Rate / Hour</p>
              </div>
              <div className="border-l border-neutral-800 pl-4">
                <p className="text-xl md:text-2xl font-black text-white font-mono">45 min</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">Lesson Length</p>
              </div>
            </div>
          </div>

          {/* Classroom showcase */}
          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="absolute top-3 right-3 flex space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-neutral-900">
                <div className="w-9 h-9 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-500/25">
                  <Play size={14} className="text-emerald-400 fill-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Live Virtual Classroom</p>
                  <p className="text-[10px] text-emerald-400 font-semibold font-mono flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                    Try the open demo room
                  </p>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center space-y-3 relative">
                <span className="absolute top-2 left-2 text-[9px] bg-neutral-950 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                  Surah Al-Kahf: 1
                </span>
                <p className="text-lg md:text-xl font-bold font-serif text-white tracking-wide pt-2" dir="rtl">
                  الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ
                </p>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  "[All] praise is [due] to Allah, who has sent down upon His Servant the Book..."
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-300">
                {["Live video lessons", "Quran viewer in class", "In-class chat", "Lesson notes & progress"].map((label) => (
                  <div key={label} className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl flex items-center space-x-2">
                    <CheckCircle size={12} className="text-emerald-400" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-900 space-y-2">
                <p className="text-[10px] text-neutral-500 text-center uppercase tracking-wider font-bold">Access Your Desk</p>
                <div className="grid grid-cols-3 gap-2">
                  <Link to="/login/tutor" className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs font-bold py-2.5 px-2 rounded-lg shadow transition text-center">Tutor</Link>
                  <Link to="/login/student" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-2 rounded-lg shadow transition text-center">Student</Link>
                  <Link to="/login/guardian" className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 px-2 rounded-lg shadow transition text-center">Guardian</Link>
                </div>
                <button
                  onClick={() => navigate("/classroom/demo")}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Try Demo Classroom
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="certified-tutors" className="space-y-6">
        <h2 className="text-center text-3xl font-extrabold text-white">Find a Quran tutor</h2>
        <FeaturedTutors />
      </section>

      {/* TAJWEED QUIZ CALL TO ACTION */}
      <section id="tajweed-quiz" className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-[90px] -z-10" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 bg-amber-950/80 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400">
              <BookOpenCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tajweed Self-Assessment</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Assess Your Tajweed Knowledge</h2>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Ten questions on Qalqalah, Madd, Idghaam, Ikhfa, Iqlab and more, with a short explanation after each answer.
            </p>
          </div>
          <button
            onClick={() => navigate("/quiz/tajweed")}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm px-6 py-3.5 rounded-xl transition shadow flex items-center space-x-2"
          >
            <span>Start the quiz</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* FEATURED COURSES (published, from the database) */}
      {courses.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 text-left">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Structured Courses</h2>
              <p className="text-xs md:text-sm text-neutral-400 max-w-2xl leading-normal">
                Tutor-designed syllabi, reviewed and published by the academy.
              </p>
            </div>
            <Link to="/courses" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
              <span>View all courses</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Link key={course.id} to="/courses" className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-3 hover:border-neutral-700 transition shadow-xl block">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-[10px] bg-neutral-950 text-emerald-400 border border-emerald-500/10 font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">{course.program}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950/40 text-indigo-400">{course.level}</span>
                </div>
                <h3 className="text-base font-bold text-white">{course.title}</h3>
                {course.description && <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{course.description}</p>}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
                  <span className="flex items-center space-x-1"><Globe size={11} /><span>{course.language}</span></span>
                  {course.durationWeeks && <span className="flex items-center space-x-1"><Clock size={11} /><span>{course.durationWeeks} weeks</span></span>}
                  <span>by {course.tutor.account.fullName}</span>
                  {course.priceAmount && <span className="font-bold text-emerald-400">{course.priceCurrency} {Number(course.priceAmount).toFixed(2)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PRICING ESTIMATE (from real tutor rates) */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[90px] -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5 text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Plan Your Tuition</h2>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Estimate a monthly cost from how many lessons you want each week. The estimate uses the average hourly rate of the tutors currently listed; each tutor sets their own rate.
            </p>

            <div className="space-y-2.5 pt-2 max-w-md">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-300">Target Lessons per Week:</span>
                <span className="text-emerald-400 font-bold font-mono bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                  {lessonsPerWeek} Classes / Wk
                </span>
              </div>
              <input
                type="range" min="1" max="5" value={lessonsPerWeek}
                onChange={(e) => setLessonsPerWeek(parseInt(e.target.value))}
                aria-label="Lessons per week"
                className="w-full h-1.5 bg-neutral-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-neutral-850">
              <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Every lesson includes:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {["Live video classroom", "Quran viewer and chat", "Tutor notes after class", "Progress reports for families"].map((label) => (
                  <div key={label} className="flex items-center space-x-2">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-neutral-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-neutral-950 border border-neutral-850 rounded-3xl p-6 text-center space-y-4">
            <div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/10 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Estimated monthly cost
              </span>
              <p className="text-4xl md:text-5xl font-black text-white font-mono mt-3">
                {averageRate ? `$${(lessonsPerWeek * averageRate * 0.75 * 4.33).toFixed(2)}` : "—"}
                <span className="text-xs text-neutral-400 font-sans font-medium">/month</span>
              </p>
              <p className="text-[11px] text-neutral-500 font-mono mt-1">
                {averageRate
                  ? `${lessonsPerWeek} lesson(s) a week · 45 minutes · average $${averageRate.toFixed(2)}/hr`
                  : "Rates appear once tutors are listed."}
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850/80 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between text-neutral-400">
                <span>Lesson length:</span>
                <span className="font-semibold text-neutral-200">45 minutes</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Rescheduling:</span>
                <span className="font-semibold text-neutral-200">Any time before the lesson starts</span>
              </div>
            </div>

            <button
              onClick={() => document.getElementById("certified-tutors")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3.5 px-4 rounded-xl shadow transition text-xs"
            >
              Pick a Tutor & Book a Lesson
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">How It Works</h2>
          <p className="text-xs md:text-sm text-neutral-400 leading-normal">
            No software to install. Join class from any web browser on a computer or phone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {[
            ["1", "Choose a tutor", "Browse approved tutors, compare rates and weekly availability, and book a time shown in your own time zone."],
            ["2", "Join the live lesson", "Open the classroom from your desk when the lesson window opens, with video, a Quran viewer, and chat."],
            ["3", "Follow the progress", "After each lesson the tutor records attendance, notes, and progress that guardians and students can review."],
          ].map(([step, title, body]) => (
            <div key={step} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center font-black text-sm">{step}</div>
              <h3 className="text-sm md:text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INSIGHTS & BLOGS (published, from the database) */}
      {posts.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center max-w-5xl mx-auto gap-4 border-b border-neutral-900 pb-4">
            <div className="text-left space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Academy Insights</h2>
              <p className="text-xs md:text-sm text-neutral-400 leading-normal">Guides and articles from the academy.</p>
            </div>
            <Link to="/blogs" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
              <span>All articles</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blogs/${post.slug}`}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 hover:border-neutral-700 transition duration-300 flex flex-col md:flex-row gap-5"
              >
                <img src={post.coverImage} alt={post.title} className="w-full md:w-36 h-36 rounded-2xl object-cover shrink-0" />
                <div className="flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                      <span className="font-bold text-emerald-400">{post.author}</span>
                      <span>•</span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-white line-clamp-2 leading-snug">{post.title}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded text-[9px]">{tag}</span>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                      <span>Read Article</span>
                      <BookOpen size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
