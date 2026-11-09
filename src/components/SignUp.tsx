import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, Mail, Phone, GraduationCap, Sparkles,
  ArrowLeft, CheckCircle, Check as CheckIcon, AlertCircle, Users
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";

export interface StudentSignUpData {
  name: string;
  email: string;
  phone: string;
  age?: number;
  timeZone: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  currentBook: string;
}

export interface TutorSignUpData {
  name: string;
  email: string;
  phone: string;
  experience: string;
  specialties: string[];
  languages: string[];
  bio: string;
  hourlyRate: number;
  timeZone: string;
}

interface SignUpProps {
  role: "student" | "tutor";
  onSubmitStudent: (data: StudentSignUpData) => { id: string };
  onSubmitTutor: (data: TutorSignUpData) => { id: string; slug: string };
}

const SUBJECT_OPTIONS = [
  { value: "Noorani Qaida", label: "Noorani Qaida (Reading Basics)" },
  { value: "Tajweed Rules", label: "Tajweed (Correct Pronunciation)" },
  { value: "Hifz (Memorization)", label: "Hifz (Quran Memorization)" },
  { value: "Quran Recitation & Tafseer", label: "Recitation & Tafseer" }
];

const SPECIALTY_OPTIONS = ["Tajweed", "Hifz / Memorization", "Noorani Qaida", "Arabic", "Tafseer", "Qira'at"];
const LANGUAGE_OPTIONS = ["English", "Arabic", "Urdu", "French", "Turkish", "Malay"];

export default function SignUp({ role, onSubmitStudent, onSubmitTutor }: SignUpProps) {
  const navigate = useNavigate();

  useSEO(
    role === "tutor"
      ? {
          title: "Apply to Teach Quran Online",
          description: "Apply to become a certified Quran tutor with Quran Tutors Academy. Share your specialties, languages, and experience to join our Scholars Registry."
        }
      : {
          title: "Student Sign-Up",
          description: "Create your student profile and get matched with a certified Quran tutor for Tajweed, Hifz, or Qaida lessons."
        }
  );

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timeZone, setTimeZone] = useState("UTC");

  // Student-only fields
  const [age, setAge] = useState("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [currentBook, setCurrentBook] = useState(SUBJECT_OPTIONS[0].value);

  // Tutor-only fields
  const [experience, setExperience] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState(25);

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; slug?: string } | null>(null);

  const toggleSpecialty = (s: string) => {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleLanguage = (l: string) => {
    setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email address.");
      return;
    }

    if (role === "tutor") {
      if (!experience.trim() || specialties.length === 0 || languages.length === 0 || !bio.trim()) {
        setError("Please fill in your experience, at least one specialty, one language, and a short bio.");
        return;
      }
      const created = onSubmitTutor({
        name, email, phone, experience, specialties, languages, bio, hourlyRate, timeZone
      });
      setResult(created);
    } else {
      const created = onSubmitStudent({
        name, email, phone,
        age: age ? Number(age) : undefined,
        timeZone, level, currentBook
      });
      setResult(created);
    }
  };

  // --- SUCCESS STATE ---
  if (result) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-5 text-center">
          <div className="w-14 h-14 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle size={26} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-white">You're in, {name.split(" ")[0]}!</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {role === "tutor"
                ? "Your tutor profile has been created and is now visible in our Scholars Registry."
                : "Your student profile has been created. A tutor from our team will reach out to schedule your first lesson."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {role === "tutor" && result.slug && (
              <button
                onClick={() => navigate(`/tutors/${result.slug}`)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                View My Public Profile
              </button>
            )}
            {role === "student" && (
              <button
                onClick={() => navigate("/tutors")}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                Browse Tutors
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FORM STATE ---
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden text-neutral-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 relative z-10">

        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </button>
          <button
            onClick={() => navigate(role === "student" ? "/signup/tutor" : "/signup/student")}
            className="text-[10px] text-neutral-500 hover:text-emerald-400 transition"
          >
            {role === "student" ? "Sign up as a Tutor instead →" : "Sign up as a Student instead →"}
          </button>
        </div>

        <div className="space-y-2 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
            role === "tutor" ? "bg-amber-950 text-amber-500 border border-amber-500/20" : "bg-indigo-950 text-indigo-400 border border-indigo-500/20"
          }`}>
            {role === "tutor" ? <GraduationCap size={22} /> : <Users size={22} />}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {role === "tutor" ? "Apply to Teach" : "Student Sign-Up"}
          </h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            {role === "tutor"
              ? "Tell us about your teaching background so we can add you to the Scholars Registry."
              : "Create your student profile to get matched with a certified Quran tutor."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 block">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-neutral-600 outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <Mail size={13} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white placeholder-neutral-600 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 block">Phone (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <Phone size={13} />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white placeholder-neutral-600 outline-none transition"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 block">Time Zone</label>
              <input
                type="text"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                placeholder="e.g., GMT+5, EST"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-neutral-600 outline-none transition"
              />
            </div>
          </div>

          {role === "student" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 block">Age (Optional)</label>
                  <input
                    type="number"
                    min={3}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g., 10"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-neutral-600 outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 block">Current Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3 text-xs text-white outline-none transition"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">What would you like to learn?</label>
                <select
                  value={currentBook}
                  onChange={(e) => setCurrentBook(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3 text-xs text-white outline-none transition"
                >
                  {SUBJECT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">Years of Teaching Experience</label>
                <input
                  type="text"
                  required
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g., 5+ years"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-neutral-600 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">Specialties</label>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTY_OPTIONS.map(s => {
                    const isChecked = specialties.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                          isChecked
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {isChecked && <CheckIcon size={10} className="stroke-[3]" />}
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">Languages Spoken</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_OPTIONS.map(l => {
                    const isChecked = languages.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLanguage(l)}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                          isChecked
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {isChecked && <CheckIcon size={10} className="stroke-[3]" />}
                        <span>{l}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">Short Bio / Introduction</label>
                <textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell students a bit about your teaching background and style..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-neutral-600 outline-none transition resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">Expected Hourly Rate (USD)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white outline-none transition"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-rose-950/40 border border-rose-500/25 text-rose-300 p-3 rounded-xl flex items-start space-x-2.5">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
              <p className="text-[11px] leading-relaxed font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center space-x-2"
          >
            <UserPlus size={14} />
            <span>{role === "tutor" ? "Submit Tutor Application" : "Create Student Profile"}</span>
          </button>

          <p className="text-[10px] text-neutral-500 text-center leading-relaxed flex items-center justify-center gap-1">
            <Sparkles size={10} className="text-amber-500 shrink-0" />
            This is a pilot build — your details are saved in this browser only, not sent to a server.
          </p>
        </form>
      </div>
    </div>
  );
}
