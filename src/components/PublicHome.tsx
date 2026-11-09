import React, { useState } from "react";
import { 
  BookOpen, Users, Calendar, Award, Star, CheckCircle, ArrowRight, Play, 
  BookOpenCheck, ChevronDown, ChevronRight, HelpCircle, AlertCircle, 
  GraduationCap, DollarSign, Clock, Sparkles, ShieldCheck, Check, 
  BookOpen as BookIcon, Sparkles as SparklesIcon, FileText
} from "lucide-react";
import { Tutor, Curriculum, BlogPost, TAJWEED_QUIZ, INITIAL_BLOGS } from "../data/mockData";
import { useSEO } from "../hooks/useSEO";

interface PublicHomeProps {
  tutors: Tutor[];
  curriculums: Curriculum[];
  onNavigateToPortal: (portal: "tutor" | "student" | "classroom" | "admin") => void;
  onBookTrial: (tutorId: string) => void;
  onViewProfile?: (tutorId: string) => void;
  onNavigateToAdmin?: (subTab?: "overview" | "architecture" | "sitemap" | "database" | "curriculum" | "profiles" | "quran_crud" | "blog_crud") => void;
}

export default function PublicHome({ tutors, curriculums, onNavigateToPortal, onBookTrial, onViewProfile, onNavigateToAdmin }: PublicHomeProps) {
  useSEO({
    title: "Learn Quran Online with Certified Tajweed Tutors",
    description: "Learn the Holy Quran online with certified Tajweed tutors — live interactive lessons, Hifz memorization tracking, and a free Quran reading & audio companion.",
    schema: { "@type": "EducationalOrganization", name: "Quran Tutors Academy" }
  });

  // States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  
  // Pricing Calculator State
  const [lessonsPerWeek, setLessonsPerWeek] = useState<number>(3);
  
  // Blog State (load from localStorage or INITIAL_BLOGS)
  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem("qta_blogs");
      return saved ? JSON.parse(saved) : INITIAL_BLOGS;
    } catch {
      return INITIAL_BLOGS;
    }
  });

  // Blog Modal State
  const [activeBlog, setActiveBlog] = useState<BlogPost | null>(null);
  
  // Collapsed curriculum modules state
  const [expandedCurriculum, setExpandedCurriculum] = useState<string | null>(null);

  // Constants
  const categories = ["All", "Qaida", "Tajweed", "Hifz", "Tafseer"];
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  // Handlers for interactive Quiz
  const handleOptionSelect = (optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedOption(optionIdx);
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null || quizSubmitted) return;
    const currentQ = TAJWEED_QUIZ[quizIndex];
    if (selectedOption === currentQ.answer) {
      setQuizScore(prev => prev + 1);
    }
    setShowExplanation(true);
    setQuizSubmitted(true);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setQuizSubmitted(false);
    
    if (quizIndex < TAJWEED_QUIZ.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setQuizSubmitted(false);
    setQuizFinished(false);
    setQuizScore(0);
  };

  // Filtered Curriculums
  const filteredCurriculums = curriculums.filter(c => {
    const matchesCat = selectedCategory === "All" || c.category === selectedCategory;
    const matchesDiff = selectedDifficulty === "All" || c.difficulty === selectedDifficulty;
    return matchesCat && matchesDiff;
  });

  return (
    <div className="space-y-20 px-4 md:px-6 max-w-7xl mx-auto py-10 text-neutral-200">
      
      {/* 1. HERO SECTION */}
      <section className="relative rounded-[36px] bg-neutral-900 border border-neutral-800 p-8 md:p-14 overflow-hidden shadow-2xl">
        {/* Abstract glowing backgrounds */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
              <Sparkles className="text-emerald-400 w-4 h-4 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-400">Certified Al-Azhar Academics</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Learn Holy Quran with <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">Authentic Tajweed</span> & Certified Tutors
            </h1>
            
            <p className="text-sm md:text-base text-neutral-400 max-w-xl leading-relaxed">
              Experience a premium virtual academy at <strong className="text-neutral-200 font-semibold">qurantutorsacademy.com</strong>. Complete with live interactive whiteboards, instant Tajweed mistake recording, personalized study plans, and certified scholars.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  const target = document.getElementById("certified-tutors");
                  target?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-6 py-3.5 rounded-xl text-sm transition duration-200 shadow-lg shadow-emerald-500/15 flex items-center space-x-2 cursor-pointer"
              >
                <span>Browse Tutors Directory</span>
                <ArrowRight size={16} />
              </button>
              
              <button
                onClick={() => {
                  const target = document.getElementById("tajweed-quiz");
                  target?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm border border-neutral-700 transition duration-200 flex items-center space-x-2"
              >
                <span>Take Tajweed Skill Quiz</span>
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-800/80 max-w-lg">
              <div>
                <p className="text-xl md:text-2xl font-black text-white font-mono">15,000+</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">Lessons Taught</p>
              </div>
              <div className="border-l border-neutral-800 pl-4">
                <p className="text-xl md:text-2xl font-black text-emerald-400 font-mono">4.95 / 5</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">Average Rating</p>
              </div>
              <div className="border-l border-neutral-800 pl-4">
                <p className="text-xl md:text-2xl font-black text-white font-mono">100%</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">Ijazah Certified</p>
              </div>
            </div>
          </div>

          {/* Quick Classroom Interactive Showcase */}
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
                    Preview of a real lesson session
                  </p>
                </div>
              </div>

              {/* Quranic page preview */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center space-y-3 relative">
                <span className="absolute top-2 left-2 text-[9px] bg-neutral-950 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                  Sura Al-Kahf: 1
                </span>
                <p className="text-lg md:text-xl font-bold font-serif text-white tracking-wide pt-2" dir="rtl">
                  الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ
                </p>
                <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-emerald-500 to-teal-400" />
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  "[All] praise is [due] to Allah, who has sent down upon His Servant the Book..."
                </p>
              </div>

              {/* Dynamic feature bullet tags */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-300">
                <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl flex items-center space-x-2">
                  <CheckCircle size={12} className="text-emerald-400" />
                  <span>Real-time Audio Sync</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl flex items-center space-x-2">
                  <CheckCircle size={12} className="text-emerald-400" />
                  <span>Interactive Whiteboard</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl flex items-center space-x-2">
                  <CheckCircle size={12} className="text-emerald-400" />
                  <span>Interactive Quran Audio</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl flex items-center space-x-2">
                  <CheckCircle size={12} className="text-emerald-400" />
                  <span>Automatic Mistake Logger</span>
                </div>
              </div>

              {/* Portal Jumpers */}
              <div className="pt-2 border-t border-neutral-900 space-y-2">
                <p className="text-[10px] text-neutral-500 text-center uppercase tracking-wider font-bold">Interactive Sandbox Quick Entrance</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onNavigateToPortal("tutor")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs font-bold py-2.5 px-3 rounded-lg shadow transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Tutor Dashboard</span>
                  </button>
                  <button
                    onClick={() => onNavigateToPortal("student")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Student Desk</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CERTIFIED TUTORS DIRECTORY */}
      <section id="certified-tutors" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Our Certified Quranic Scholars</h2>
          <p className="text-xs md:text-sm text-neutral-400 leading-normal">
            Every tutor possesses verified teaching credentials (Ijazah) and brings years of academic experience from leading institutions like Al-Azhar University.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map(t => (
            <div 
              key={t.id} 
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl hover:border-neutral-700 transition duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Tutor Profile Header */}
                <div className="flex items-center space-x-4">
                  <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/40 shadow-inner" />
                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">{t.name}</h3>
                    <p className="text-[11px] text-neutral-400 flex items-center mt-0.5">
                      <GraduationCap size={12} className="text-emerald-400 mr-1" />
                      Experience: {t.experience}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <div className="flex items-center text-amber-400">
                        <Star size={11} className="fill-amber-400" />
                        <span className="text-xs font-bold ml-1 font-mono">{t.rating}</span>
                      </div>
                      <span className="text-neutral-600">•</span>
                      <span className="text-[11px] text-neutral-400 font-mono">{t.lessonsCompleted} Completed classes</span>
                    </div>
                  </div>
                </div>

                {/* Specialties tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {t.specialties.map((spec, i) => (
                    <span 
                      key={i} 
                      className="bg-neutral-950 text-emerald-400 border border-emerald-500/10 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Profile bio */}
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                  {t.bio}
                </p>

                {/* Profile Details Grid */}
                <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-2xl grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Languages</span>
                    <span className="text-neutral-200 font-medium">{t.languages.join(", ")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Hourly Rate</span>
                    <span className="text-emerald-400 font-extrabold font-mono">${t.hourlyRate.toFixed(2)}/hr</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-5 mt-5 border-t border-neutral-850/60 flex items-center gap-2">
                <button
                  onClick={() => onBookTrial(t.id)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold py-3 px-4 rounded-xl shadow transition"
                >
                  Book Trial Session
                </button>
                <button
                  onClick={() => onViewProfile && onViewProfile(t.id)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold py-3 px-4 rounded-xl border border-neutral-700 transition cursor-pointer"
                  title="View full scholar profile & verified credentials"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE TAJWEED SKILL QUIZ SECTION */}
      <section id="tajweed-quiz" className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-[90px] -z-10" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Informational column */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="inline-flex items-center space-x-1.5 bg-amber-950/80 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400">
              <BookOpenCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tajweed Self-Assessment</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Assess Your Tajweed Recitation Skills</h2>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Rules of pronunciation dictate how letters should be elongated, echoed, or hidden. Try our interactive quiz and discover where you stand!
            </p>
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-neutral-300">Test knowledge of <strong>Qalqalah</strong>, <strong>Iqlab</strong>, and rules of Nun Sakinah</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-neutral-300">Instant answers with helpful scholars' tips and audio cues</span>
              </div>
            </div>
          </div>

          {/* Interactive Game card */}
          <div className="lg:col-span-7 bg-neutral-950 border border-neutral-850 rounded-2xl p-6 relative">
            {!quizFinished ? (
              <div className="space-y-5">
                {/* Header indicators */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-900 text-xs">
                  <span className="text-neutral-500 font-bold">QUESTION {quizIndex + 1} OF {TAJWEED_QUIZ.length}</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/10 font-mono">
                    Score: {quizScore} / {TAJWEED_QUIZ.length}
                  </span>
                </div>

                {/* Question */}
                <div className="space-y-2">
                  <h4 className="text-sm md:text-base font-bold text-white leading-relaxed">
                    {TAJWEED_QUIZ[quizIndex].question}
                  </h4>
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {TAJWEED_QUIZ[quizIndex].options.map((opt, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    const isCorrect = TAJWEED_QUIZ[quizIndex].answer === oIdx;
                    let optionStyle = "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700";
                    
                    if (quizSubmitted) {
                      if (isCorrect) {
                        optionStyle = "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-semibold";
                      } else if (isSelected) {
                        optionStyle = "border-rose-500/50 bg-rose-950/40 text-rose-300";
                      } else {
                        optionStyle = "border-neutral-900 bg-neutral-900/40 text-neutral-500 opacity-60";
                      }
                    } else if (isSelected) {
                      optionStyle = "border-amber-500 bg-amber-950/20 text-amber-300 font-semibold shadow-inner";
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleOptionSelect(oIdx)}
                        disabled={quizSubmitted}
                        className={`w-full text-left text-xs p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between ${optionStyle}`}
                      >
                        <span className="flex-1 pr-3">{opt}</span>
                        {quizSubmitted && isCorrect && <Check size={14} className="text-emerald-400 shrink-0" />}
                        {quizSubmitted && isSelected && !isCorrect && <AlertCircle size={14} className="text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation TIP box */}
                {showExplanation && (
                  <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-xl text-xs space-y-1 animate-fade-in">
                    <span className="text-[10px] font-bold text-amber-400 block uppercase tracking-wide">Scholar's Rule Tip:</span>
                    <p className="text-neutral-300 leading-normal">
                      {TAJWEED_QUIZ[quizIndex].tip}
                    </p>
                  </div>
                )}

                {/* Submission Action buttons */}
                <div className="pt-3 border-t border-neutral-900 flex justify-end">
                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={selectedOption === null}
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs px-5 py-2.5 rounded-xl transition shadow"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center space-x-1 shadow"
                    >
                      <span>{quizIndex < TAJWEED_QUIZ.length - 1 ? "Next Question" : "View Final Score"}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Quiz Finished screen
              <div className="text-center py-8 space-y-5 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  🎉
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Assessment Completed!</h3>
                  <p className="text-xs text-neutral-400">Here is your Tajweed recitation knowledge rank:</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-850 py-4 px-6 rounded-2xl max-w-xs mx-auto space-y-1">
                  <p className="text-3xl font-black text-emerald-400 font-mono">
                    {Math.round((quizScore / TAJWEED_QUIZ.length) * 100)}%
                  </p>
                  <p className="text-xs font-bold text-neutral-300">
                    {quizScore === TAJWEED_QUIZ.length ? "👑 Tajweed Master Qari" : quizScore >= 2 ? "⭐️ Recitor Apprentice" : "📚 Beginner Student"}
                  </p>
                  <p className="text-[10px] text-neutral-500">Correct answers: {quizScore} of {TAJWEED_QUIZ.length}</p>
                </div>

                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Excellent attempt! Real Tajweed is perfected through live scholar listening. Connect with Sheikh Ahmed to receive your live vocal assessment.
                </p>

                <div className="pt-2 flex items-center justify-center space-x-2">
                  <button
                    onClick={handleResetQuiz}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-neutral-700 transition"
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => {
                      const target = document.getElementById("certified-tutors");
                      target?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold px-4 py-2.5 rounded-lg shadow transition"
                  >
                    Book Consultation
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 4. SYLLABUS & CURRICULUM EXPLORER */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Structured Quranic Syllabi</h2>
            <p className="text-xs md:text-sm text-neutral-400 max-w-2xl leading-normal">
              Browse structured study plans containing lesson counts, specific modules, and verse bounds. Filter by category or difficulty level.
            </p>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2">
            {/* Category selection */}
            <div className="flex space-x-1 bg-neutral-950 p-1 rounded-xl border border-neutral-850">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCategory === cat 
                      ? "bg-emerald-600 text-neutral-950" 
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Curriculum list cards */}
        {filteredCurriculums.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCurriculums.map(c => {
              const isExpanded = expandedCurriculum === c.id;
              
              return (
                <div 
                  key={c.id} 
                  className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 hover:border-neutral-700 transition shadow-xl"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-neutral-950 text-emerald-400 border border-emerald-500/10 font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                          {c.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          c.difficulty === "Beginner" 
                            ? "bg-emerald-950/40 text-emerald-400" 
                            : c.difficulty === "Intermediate" 
                            ? "bg-indigo-950/40 text-indigo-400" 
                            : "bg-rose-950/40 text-rose-400"
                        }`}>
                          {c.difficulty}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white pt-1">{c.title}</h3>
                    </div>

                    <span className="bg-neutral-950 text-neutral-400 font-mono text-xs px-3 py-1.5 rounded-xl border border-neutral-850">
                      {c.lessonsCount} lessons
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Modules collapsible accordion */}
                  <div className="border-t border-neutral-850/60 pt-4 mt-2">
                    <button
                      onClick={() => setExpandedCurriculum(isExpanded ? null : c.id)}
                      className="w-full flex items-center justify-between text-xs text-neutral-300 font-bold hover:text-emerald-400 transition"
                    >
                      <span className="flex items-center">
                        <BookOpen size={13} className="mr-1.5" />
                        {isExpanded ? "Collapse Syllabus Modules" : "Browse Program Modules"}
                      </span>
                      {isExpanded ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronRight size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2.5 mt-3 animate-fade-in">
                        {c.modules.map(mod => (
                          <div key={mod.id} className="bg-neutral-950/50 border border-neutral-850 rounded-xl p-3 text-xs space-y-1">
                            <div className="flex justify-between items-center text-white">
                              <span className="font-semibold">{mod.title}</span>
                              {mod.versesRange && (
                                <span className="text-[10px] text-amber-400 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                                  {mod.versesRange}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-normal">{mod.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center text-xs">
            <AlertCircle size={24} className="mx-auto text-neutral-600 mb-2" />
            <p className="font-semibold text-neutral-300">No syllabus programs match selected filters</p>
            <p className="text-neutral-500 mt-1">Please pick another category or level.</p>
          </div>
        )}
      </section>

      {/* 5. INTERACTIVE PRICING CALCULATOR */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[90px] -z-10" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-6 space-y-5 text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Flexible, Honest Tuition</h2>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              No long commitments or lock-ins. Build your customized lesson load per week and calculate your monthly subscription rate based on standard tutor averages of $30/hr.
            </p>
            
            {/* Range Slider */}
            <div className="space-y-2.5 pt-2 max-w-md">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-300">Target Lessons per Week:</span>
                <span className="text-emerald-400 font-bold font-mono bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                  {lessonsPerWeek} Classes / Wk
                </span>
              </div>
              
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={lessonsPerWeek}
                onChange={(e) => setLessonsPerWeek(parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>1 class</span>
                <span>2 classes</span>
                <span>3 classes</span>
                <span>4 classes</span>
                <span>5 classes</span>
              </div>
            </div>

            {/* Inclusions checklist */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-850">
              <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">All Tuition Packages Include:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-neutral-300">Secure HD Video & Audio</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-neutral-300">Synced Whiteboard Tools</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-neutral-300">Persistent Mistake Ledger</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-neutral-300">Certified Azhar Scholars</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing readout card */}
          <div className="lg:col-span-6 bg-neutral-950 border border-neutral-850 rounded-3xl p-6 text-center space-y-4">
            <div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/10 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                ESTIMATED ACADEMY RATES
              </span>
              <p className="text-4xl md:text-5xl font-black text-white font-mono mt-3">
                ${(lessonsPerWeek * 30 * 4.33).toFixed(2)}
                <span className="text-xs text-neutral-400 font-sans font-medium">/month</span>
              </p>
              <p className="text-[11px] text-neutral-500 font-mono mt-1">
                Based on {lessonsPerWeek} class(es) per week at $30/hr average rate
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850/80 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between text-neutral-400">
                <span>Class Duration:</span>
                <span className="font-semibold text-neutral-200">45 Minutes</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Platform Fee:</span>
                <span className="font-semibold text-emerald-400">FREE ($0.00)</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Schedule Flexibility:</span>
                <span className="font-semibold text-neutral-200">Reschedule up to 2 hrs before</span>
              </div>
            </div>

            <button
              onClick={() => {
                const target = document.getElementById("certified-tutors");
                target?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3.5 px-4 rounded-xl shadow transition text-xs"
            >
              Pick a Tutor & Book Trial Lesson
            </button>
          </div>

        </div>
      </section>

      {/* 6. HOW IT WORKS & CLASSROOM TEASER */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">The Virtual Classroom Experience</h2>
          <p className="text-xs md:text-sm text-neutral-400 leading-normal">
            No external apps or software packages required. Simply join class from any web browser or mobile phone to connect instantly.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="text-sm md:text-base font-bold text-white">Select Academic Tutor</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Browse through dozens of certified male and female scholars. Book a direct appointment based on your timezone.
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="text-sm md:text-base font-bold text-white">Join Interactive Session</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Access audio, synchronized visual whiteboard Quranic scripts, and immediate verse drawing tools built inside our browser portal.
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="text-sm md:text-base font-bold text-white">Log Progress & Mistakes</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Review persistent lessons history, attendance records, active syllabi progression, and mistake tags logged by your tutor.
            </p>
          </div>
        </div>
      </section>

      {/* 7. INSIGHTS & BLOGS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center max-w-5xl mx-auto gap-4 border-b border-neutral-900 pb-4">
          <div className="text-left space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Quranic Academy Insights</h2>
            <p className="text-xs md:text-sm text-neutral-400 leading-normal">
              Read professional guides, research summaries, and cognitive tips published by our leading instructors.
            </p>
          </div>
          {onNavigateToAdmin && (
            <button
              onClick={() => onNavigateToAdmin("blog_crud")}
              className="px-4 py-2 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-neutral-950 text-xs font-bold rounded-xl transition-all duration-300 flex items-center space-x-2 shrink-0 cursor-pointer shadow-md hover:shadow-emerald-500/10 active:scale-95 animate-pulse"
            >
              <FileText size={14} />
              <span>Compose & Edit Blogs</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogs.filter(b => b.status === "Published").map(blog => (
            <div 
              key={blog.id}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 hover:border-neutral-700 transition duration-300 flex flex-col md:flex-row gap-5"
            >
              <img 
                src={blog.coverImage} 
                alt={blog.title} 
                className="w-full md:w-36 h-36 rounded-2xl object-cover shrink-0" 
              />
              <div className="flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                    <span className="font-bold text-emerald-400">{blog.author}</span>
                    <span>•</span>
                    <span>{blog.publishedAt}</span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white line-clamp-2 leading-snug">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {blog.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded text-[9px]">
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveBlog(blog)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                  >
                    <span>Read Article</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BLOG OVERLAY MODAL */}
      {activeBlog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 animate-fade-in relative">
            
            {/* Close button */}
            <button
              onClick={() => setActiveBlog(null)}
              className="absolute top-4 right-4 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white p-2 rounded-full border border-neutral-850 transition"
            >
              ✕
            </button>

            {/* Author info & publication */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-neutral-400">
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  {activeBlog.author}
                </span>
                <span>•</span>
                <span>Published on {activeBlog.publishedAt}</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-snug">{activeBlog.title}</h2>
            </div>

            {/* Cover image */}
            <img src={activeBlog.coverImage} alt={activeBlog.title} className="w-full h-64 object-cover rounded-2xl border border-neutral-850" />

            {/* Article Content */}
            <div className="text-xs md:text-sm text-neutral-300 space-y-4 leading-relaxed whitespace-pre-line prose prose-invert font-sans">
              {activeBlog.content}
            </div>

            {/* Quick Consultation footer */}
            <div className="bg-neutral-950 border border-neutral-850/80 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div>
                <p className="text-xs font-bold text-white">Ready to master correct vocal rules?</p>
                <p className="text-[11px] text-neutral-500">Book an assessment lesson with Sheikh Ahmed Al-Misri.</p>
              </div>
              <button
                onClick={() => {
                  setActiveBlog(null);
                  onBookTrial("tutor-1");
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-xl transition shrink-0"
              >
                Book with {activeBlog.author.split(" ")[1]}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
