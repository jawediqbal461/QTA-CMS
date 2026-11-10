import { createElement, useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft, GraduationCap, LogIn, UserPlus, Users, Sparkles, Star, Clock, Bell,
  CalendarCheck, ChevronRight, LogOut, ShieldCheck, Search, BookOpen, Wallet,
  Award, Filter, RotateCcw, Check as CheckIcon, Globe, CheckCircle, Inbox,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { accountRequest, ApiError, request } from "../lib/api";
import { useSEO } from "../hooks/useSEO";

type Role = "TUTOR" | "GUARDIAN" | "STUDENT";
const accountPaths = {
  TUTOR: { portal: "/tutor", login: "/login/tutor", signup: "/signup/tutor", label: "Teacher" },
  STUDENT: { portal: "/student", login: "/login/student", signup: "/signup/student", label: "Student" },
  GUARDIAN: { portal: "/guardian", login: "/login/guardian", signup: "/signup/guardian", label: "Guardian" },
} as const;
type Approval = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
type Slot = { weekday: number; startTime: string; endTime: string };
type Tutor = {
  accountId: string; account: { fullName: string }; bio: string | null;
  experienceYears: number; hourlyRate: string; languages: string[]; specialties: string[];
};
type DirectoryTutor = Tutor & { availabilitySlots: { weekday: number }[] };
type Profile = Tutor & {
  approvalStatus: Approval; qualifications: string | null; updatedAt: string;
  account: { fullName: string; timeZone: string; email?: string }; availabilitySlots: Slot[];
};
type Student = { id: string; fullName: string };
type LearningRequest = {
  id: string; program: string; level: string; preferredLang: string;
  budgetMax: string | null; notes: string | null;
  status: "PENDING" | "MATCHED" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  assignedAt: string | null; createdAt: string;
  guardian?: { id: string; fullName: string; email: string };
  student: { id: string; fullName: string };
  assignedTutor: { accountId: string; account: { fullName: string } } | null;
};
type NotificationItem = { id: string; title: string; message: string; visibleAt: string; readAt: string | null };
type Booking = {
  id: string; tutorId: string; scheduledAtUtc: string; durationMinutes: number; status: string;
  student: { id: string; fullName: string }; tutor?: { account: { fullName: string } };
  lessonSession?: { endedAt: string | null; tutorNotes: string | null } | null;
  progressEntry?: {
    currentBook: string; currentChapter: string; currentVerse: number | null;
    tajweedScore: number | null; hifzPercent: string | null;
  } | null;
};

const panel = "space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6";
const button = "inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-neutral-950 transition disabled:cursor-not-allowed disabled:opacity-50";
const input = "w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition focus:border-emerald-500/50";
const badge = "inline-flex items-center rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[10px] font-bold text-neutral-400";
const ghostLink = "inline-flex items-center gap-1 text-xs font-bold text-emerald-400 transition hover:text-emerald-300";
const dangerLink = "inline-flex items-center gap-1 text-xs font-bold text-rose-400 transition hover:text-rose-300";
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const localTime = (iso: string, timeZone?: string) => new Date(iso).toLocaleString(undefined, {
  dateStyle: "medium", timeStyle: "short", timeZone,
});
const message = (error: unknown) => error instanceof Error ? error.message : "Something went wrong.";

function useResource<T>(path: string | null, token?: string, version = 0) {
  const [result, setResult] = useState<{ path: string; token?: string; data?: T; error?: string; unauthorized?: boolean }>();
  useEffect(() => {
    if (!path) return;
    let active = true;
    (token ? accountRequest<T>(path, token) : request<T>(path)).then(
      (data) => { if (active) setResult({ path, token, data }); },
      (error) => { if (active) setResult({ path, token, error: message(error), unauthorized: error instanceof ApiError && error.status === 401 }); },
    );
    return () => { active = false; };
  }, [path, token, version]);
  return result && result.path === path && result.token === token ? result : undefined;
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try { await work(); }
    catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }
  return { busy, error, run };
}

function ErrorText({ value }: { value?: string }) {
  return value ? (
    <p role="alert" className="rounded-xl border border-rose-500/25 bg-rose-950/40 px-3.5 py-2.5 text-xs font-medium text-rose-300">
      {value}
    </p>
  ) : null;
}

function Page({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return <section className="mx-auto max-w-5xl space-y-6 px-4 py-10 text-neutral-200">
    <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-neutral-950 p-6 shadow-2xl md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-500/5 blur-[100px] -z-0" />
      {eyebrow && (
        <div className="relative mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
          <Sparkles size={11} />
          <span>{eyebrow}</span>
        </div>
      )}
      <h1 className="relative text-2xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
    </div>
    {children}
  </section>;
}

function TutorCard({ tutor, detail = false }: { tutor: Tutor; detail?: boolean }) {
  return <article className={`${panel} ${!detail ? "transition hover:border-emerald-500/40" : ""}`}>
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950 text-sm font-black text-emerald-400">
        {tutor.account.fullName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        {!detail ? (
          <Link className="text-base font-bold text-white transition hover:text-emerald-300" to={`/tutors/${tutor.accountId}`}>{tutor.account.fullName}</Link>
        ) : (
          <h2 className="text-lg font-bold text-white">{tutor.account.fullName}</h2>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Star size={11} className="text-amber-400" />
          <span>{tutor.experienceYears} yrs experience</span>
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-950 px-2.5 py-1 text-[11px] font-bold text-amber-400">
        ${tutor.hourlyRate}/hr
      </span>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {tutor.specialties.map((specialty) => <span key={specialty} className={badge}>{specialty}</span>)}
    </div>
    <p className={`text-xs leading-relaxed text-neutral-400 ${detail ? "whitespace-pre-wrap" : "line-clamp-3"}`}>{tutor.bio}</p>
    <p className="text-[11px] text-neutral-500">{tutor.languages.join(", ")}</p>
    <Link className={ghostLink} to={`/student?tutor=${tutor.accountId}`}>
      <span>Book a lesson</span>
      <ChevronRight size={13} />
    </Link>
  </article>;
}

export function FeaturedTutors() {
  const tutors = useResource<Tutor[]>("/tutors");
  return <div className="space-y-4">
    <ErrorText value={tutors?.error} />
    {tutors?.data?.length === 0 && <p>No approved tutors are listed yet.</p>}
    <div className="grid gap-4 md:grid-cols-3">
      {tutors?.data?.slice(0, 3).map((tutor) => createElement(TutorCard, { key: tutor.accountId, tutor }))}
    </div>
    <Link className={ghostLink} to="/tutors">
      <span>View tutor directory</span>
      <ChevronRight size={13} />
    </Link>
  </div>;
}

function DirectoryTutorCard({ tutor }: { tutor: DirectoryTutor }) {
  const navigate = useNavigate();
  return <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl transition duration-300 hover:border-neutral-700/80">
    <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 transition duration-300 group-hover:opacity-100" />
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950 text-lg font-black text-emerald-400 transition group-hover:border-emerald-500/50">
              {tutor.account.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-emerald-500 p-0.5 text-neutral-950 shadow">
              <CheckCircle size={10} className="fill-emerald-500" />
            </span>
          </div>
          <div>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">Graduated Scholar</h3>
            <h2 className="text-sm font-bold leading-snug text-white transition group-hover:text-emerald-400">{tutor.account.fullName}</h2>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[9px] uppercase text-neutral-500">{tutor.experienceYears} yrs exp.</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {tutor.specialties.map((spec) => (
          <span key={spec} className="rounded border border-neutral-850 bg-neutral-950 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wide text-neutral-400">{spec}</span>
        ))}
      </div>
      <p className="line-clamp-3 text-xs leading-relaxed text-neutral-400">{tutor.bio}</p>
      <div className="flex items-center justify-between rounded-xl border border-neutral-850 bg-neutral-950/60 p-2.5 font-mono text-[11px]">
        <div>
          <span className="block text-[8px] text-neutral-500">LANGUAGES</span>
          <span className="font-semibold text-neutral-300">{tutor.languages.join(", ")}</span>
        </div>
        <div className="text-right">
          <span className="block text-[8px] text-neutral-500">HOURLY RATE</span>
          <span className="text-xs font-extrabold text-emerald-400">${tutor.hourlyRate}/hr</span>
        </div>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-neutral-850/60 pt-4">
      <button onClick={() => navigate(`/tutors/${tutor.accountId}`)}
        className="rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-bold text-white transition hover:border-neutral-600 hover:bg-neutral-700">
        View Profile
      </button>
      <button onClick={() => navigate(`/student?tutor=${tutor.accountId}`)}
        className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-neutral-950 shadow shadow-emerald-500/10 transition hover:bg-emerald-400">
        Book Trial
      </button>
    </div>
  </div>;
}

export function PublicTutors() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const tutors = useResource<DirectoryTutor[]>("/tutors");
  const tutor = tutors?.data?.find((entry) => entry.accountId === slug);
  const [query, setQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState(500);
  const [sortBy, setSortBy] = useState<"experience" | "rate_low" | "rate_high" | "name">("experience");
  const title = slug ? tutor?.account.fullName ?? "Tutor profile" : "Find a Quran tutor";
  useSEO({
    title, description: tutor?.bio ?? "Browse certified Quran tutors specializing in Tajweed, Hifz, and Arabic. Filter by rate and weekly availability.",
    noindex: !!slug && !tutor,
  });

  const roster = tutors?.data ?? [];
  const allSpecialties: string[] = Array.from(new Set<string>(roster.flatMap((t) => t.specialties))).sort();
  const maxRate = Math.max(50, ...roster.map((t) => Number(t.hourlyRate)).filter((n) => Number.isFinite(n)));
  const filtersActive = !!query || selectedSubjects.length > 0 || selectedDays.length > 0 || priceRange < maxRate || sortBy !== "experience";
  const resetFilters = () => { setQuery(""); setSelectedSubjects([]); setSelectedDays([]); setPriceRange(500); setSortBy("experience"); };

  const toggleValue = (current: string[], value: string) => current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  const toggleDay = (current: number[], value: number) => current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

  const filtered = roster.filter((entry) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [entry.account.fullName, entry.bio ?? "", ...entry.languages, ...entry.specialties].join(" ").toLowerCase().includes(q);
    const matchesSubjects = selectedSubjects.length === 0 || selectedSubjects.some((s) => entry.specialties.includes(s));
    const matchesDays = selectedDays.length === 0 || selectedDays.some((d) => entry.availabilitySlots.some((slot) => slot.weekday === d));
    const matchesPrice = Number(entry.hourlyRate) <= priceRange;
    return matchesQuery && matchesSubjects && matchesDays && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === "experience") return b.experienceYears - a.experienceYears;
    if (sortBy === "rate_low") return Number(a.hourlyRate) - Number(b.hourlyRate);
    if (sortBy === "rate_high") return Number(b.hourlyRate) - Number(a.hourlyRate);
    return a.account.fullName.localeCompare(b.account.fullName);
  });

  if (slug) {
    return <Page title={title} eyebrow="Certified Scholars">
      <ErrorText value={tutors?.error} />
      {!tutors && <p role="status" className="text-sm text-neutral-500">Loading tutors…</p>}
      <Link className={ghostLink} to="/tutors">
        <ArrowLeft size={13} />
        <span>All tutors</span>
      </Link>
      {tutor ? <TutorCard tutor={tutor} detail /> : tutors?.data && <p className="text-sm text-neutral-400">This tutor is not listed.</p>}
    </Page>;
  }

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 text-neutral-200">
    <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-neutral-950 p-6 shadow-2xl md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-500/5 blur-[100px]" />
      <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            <Award size={11} className="text-amber-400" />
            <span>Verified Academy Scholars</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Find Your Perfect Quran Tutor</h1>
          <p className="text-xs leading-relaxed text-neutral-400 md:text-sm">
            Select from our network of certified scholars. Filter by subject, lesson rate, and matching weekly availability to fit your schedule.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => navigate("/quran")}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800">
            <BookOpen size={13} className="text-emerald-400" />
            <span>Quran Explorer</span>
          </button>
          <button onClick={() => navigate("/student")}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-neutral-950 transition hover:bg-emerald-400">
            <span>Student Desk</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>

    <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl">
      <div className="bg-neutral-950/40 p-4 md:p-6">
        <div className="flex flex-col gap-4 border-b border-neutral-850 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
              <Globe size={16} className="text-emerald-400" />
              <span>Quran Tutors Registry</span>
            </h2>
            <p className="text-xs text-neutral-400">Showing certified scholars with verified academy profiles.</p>
          </div>
          <ErrorText value={tutors?.error} />
          {tutors?.data && (
            <p className="font-mono text-[11px] text-neutral-400">
              Showing <strong className="text-emerald-400">{filtered.length}</strong> of {roster.length} scholars
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 pt-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 self-start rounded-2xl border border-neutral-800 bg-neutral-900 p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white">
                <Filter size={13} className="text-emerald-400" />
                <span>Search &amp; Filters</span>
              </h3>
              {filtersActive && (
                <button onClick={resetFilters} className="flex items-center gap-1 font-mono text-[9px] font-black uppercase text-amber-500 transition hover:text-amber-400">
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <Search size={10} className="mr-1 text-emerald-400" /> Scholar Keyword
              </label>
              <div className="relative">
                <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Ahmed, Tajweed…"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 pl-8 pr-3 text-xs text-white outline-none transition placeholder:text-neutral-500 focus:border-emerald-500/40" />
              </div>
            </div>

            {allSpecialties.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">Subjects</h4>
                <div className="space-y-1.5">
                  {allSpecialties.map((subject) => {
                    const checked = selectedSubjects.includes(subject);
                    return <button key={subject} type="button" onClick={() => setSelectedSubjects(toggleValue(selectedSubjects, subject))}
                      className="flex w-full items-center gap-2 py-1 text-left text-xs text-neutral-300 transition hover:text-white">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${checked ? "border-emerald-400 bg-emerald-500 text-neutral-950" : "border-neutral-800 bg-neutral-950"}`}>
                        {checked && <CheckIcon size={11} className="stroke-[3]" />}
                      </span>
                      <span className={checked ? "font-bold text-emerald-400" : ""}>{subject}</span>
                    </button>;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">Weekly Availability</h4>
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {days.map((day, weekday) => {
                  const checked = selectedDays.includes(weekday);
                  return <button key={day} type="button" onClick={() => setSelectedDays(toggleDay(selectedDays, weekday))}
                    className="flex w-full items-center gap-2 py-1 text-left text-xs text-neutral-300 transition hover:text-white">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${checked ? "border-emerald-400 bg-emerald-500 text-neutral-950" : "border-neutral-800 bg-neutral-950"}`}>
                      {checked && <CheckIcon size={11} className="stroke-[3]" />}
                    </span>
                    <span className={checked ? "font-bold text-emerald-400" : ""}>{day}</span>
                  </button>;
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <span>Max Hourly Budget</span>
                <span className="font-mono text-xs font-black text-emerald-400">${Math.min(priceRange, maxRate)}/hr</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono text-[9px] text-neutral-500">$0</span>
                <input type="range" min={0} max={maxRate} value={Math.min(priceRange, maxRate)} onChange={(event) => setPriceRange(Number(event.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-neutral-950 accent-emerald-500" />
                <span className="font-mono text-[9px] text-neutral-500">${maxRate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">Sorting Order</label>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                className="w-full cursor-pointer rounded-xl border border-neutral-800 bg-neutral-950 px-2.5 py-2 text-xs text-white outline-none transition focus:border-emerald-500/40">
                <option value="experience">Most Experienced First</option>
                <option value="rate_low">Budget (Low to High)</option>
                <option value="rate_high">Premium (High to Low)</option>
                <option value="name">Name (A to Z)</option>
              </select>
            </div>

            <button onClick={resetFilters}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950 py-2 text-[11px] font-bold text-neutral-400 transition hover:border-neutral-700 hover:bg-neutral-850 hover:text-white">
              <RotateCcw size={12} />
              <span>Reset All Filters</span>
            </button>
          </aside>

          <div className="space-y-6">
            {!tutors ? (
              <p role="status" className="text-sm text-neutral-500">Loading tutors…</p>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filtered.map((entry) => createElement(DirectoryTutorCard, { key: entry.accountId, tutor: entry }))}
              </div>
            ) : (
              <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-neutral-800 bg-neutral-900 p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-850 bg-neutral-950 text-amber-500">
                  <Search size={18} />
                </div>
                <h4 className="text-sm font-bold text-white">{roster.length === 0 ? "No approved tutors are listed yet." : "No scholars match your filters"}</h4>
                {roster.length > 0 && <>
                  <p className="text-xs leading-relaxed text-neutral-400">Try adjusting your search keywords, raising your hourly budget, or clearing subject filters.</p>
                  <button onClick={resetFilters} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 transition hover:bg-emerald-400">Reset All Filters</button>
                </>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>;
}

function profileData(form: FormData) {
  const list = (name: string) => String(form.get(name)).split(",").map((item) => item.trim()).filter(Boolean);
  return {
    bio: String(form.get("bio")), qualifications: String(form.get("qualifications")),
    specialties: list("specialties"), languages: list("languages"),
    experienceYears: Number(form.get("experienceYears")), hourlyRate: Number(form.get("hourlyRate")),
  };
}

function ProfileFields({ profile }: { profile?: Pick<Profile, "specialties" | "languages" | "experienceYears" | "hourlyRate" | "bio" | "qualifications"> }) {
  return <>
    <label className="block">Subjects (comma separated)<input className={input} name="specialties" required defaultValue={profile?.specialties.join(", ")} /></label>
    <label className="block">Teaching languages (comma separated)<input className={input} name="languages" required defaultValue={profile?.languages.join(", ")} /></label>
    <label className="block">Years of experience<input className={input} type="number" name="experienceYears" min="0" max="80" required defaultValue={profile?.experienceYears ?? 0} /></label>
    <label className="block">Hourly rate (USD)<input className={input} type="number" name="hourlyRate" min="0.01" max="99999" step="0.01" required defaultValue={profile?.hourlyRate} /></label>
    <label className="block">Public biography<textarea className={input} name="bio" maxLength={2000} defaultValue={profile?.bio ?? ""} /></label>
    <label className="block">Qualifications (private admin review)<textarea className={input} name="qualifications" maxLength={2000} defaultValue={profile?.qualifications ?? ""} /></label>
  </>;
}

function AccountForm({ role, register, onSession }: { role: Role; register: boolean; onSession: (token: string) => void }) {
  const action = useAction();
  const [verificationSent, setVerificationSent] = useState(false);
  const [params] = useSearchParams();
  const paths = accountPaths[role];
  const query = params.toString() ? `?${params.toString()}` : "";
  if (verificationSent) return <div className="space-y-4 rounded-xl border border-emerald-500/30 p-4">
    <p role="status">Check your email for a verification link. Verify your address before signing in.</p>
    <Link className={ghostLink} to={paths.login + query}>Continue to sign in</Link>
  </div>;
  return <form className="space-y-4 text-xs [&_label]:space-y-1.5 [&_label]:font-bold [&_label]:text-neutral-300 [&_label>input:not([type=checkbox])]:rounded-xl [&_label>input:not([type=checkbox])]:border-neutral-800 [&_label>input:not([type=checkbox])]:bg-neutral-950 [&_label>input:not([type=checkbox])]:px-3.5 [&_label>input:not([type=checkbox])]:py-2.5 [&_label>textarea]:rounded-xl [&_label>textarea]:border-neutral-800 [&_label>textarea]:bg-neutral-950 [&_input]:focus-visible:outline-emerald-500 [&_textarea]:focus-visible:outline-emerald-500" onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void action.run(async () => {
      const data = { email: String(form.get("email")).trim(), password: String(form.get("password")) };
      const payload = register ? {
        ...data, fullName: String(form.get("fullName")).trim(),
        ...(role === "STUDENT" ? { adult: form.get("adult") === "on" } : {}),
        ...(role === "TUTOR" ? profileData(form) : {}),
      } : data;
      if (register) {
        await request(`/auth/register/${role.toLowerCase()}`, { method: "POST", body: JSON.stringify(payload) });
        setVerificationSent(true);
        return;
      }
      const result = await request<{ token: string; account: { role: string } }>("/auth/login",
        { method: "POST", body: JSON.stringify(payload) });
      if (result.account.role !== role) throw new Error("Use the portal for your account role.");
      onSession(result.token);
    });
  }}>
    <div className={register ? "grid gap-3 sm:grid-cols-2" : ""}>
      {register && <label className="block">Full Name<input className={input} name="fullName" required minLength={2} maxLength={120} autoComplete="name" /></label>}
      <label className="block">Email Address<input className={input} name="email" type="email" required autoComplete="email" /></label>
    </div>
    <label className="block">Password<input className={input} name="password" type="password" required minLength={register ? 10 : undefined} autoComplete={register ? "new-password" : "current-password"} /></label>
    {register && role === "TUTOR" && <ProfileFields />}
    {register && role === "STUDENT" && <label className="flex items-center gap-2 rounded-xl border border-neutral-800 p-3">
      <input type="checkbox" name="adult" required /> I am an adult registering for my own lessons.
    </label>}
    <ErrorText value={action.error} />
    <button className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-extrabold text-neutral-950 transition disabled:opacity-60 ${role === "TUTOR" ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-500 hover:bg-emerald-400"}`} disabled={action.busy}>
      {register ? <UserPlus size={15} /> : <LogIn size={15} />}
      {action.busy ? "Please wait…" : register ? "Create Account" : "Sign In"}
    </button>
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-neutral-800 pt-4 text-center">
      <Link className="text-emerald-300 hover:underline" to={(register ? paths.login : paths.signup) + query}>
        {register ? "Already registered? Sign in" : "Create an account"}
      </Link>
      {role !== "TUTOR" && <Link className={ghostLink} to={accountPaths[role === "STUDENT" ? "GUARDIAN" : "STUDENT"].login + query}>
        {role === "STUDENT" ? "Sign in as a guardian" : "Sign in as a student"}
      </Link>}
      {register && role === "STUDENT" && <Link className={ghostLink} to={accountPaths.GUARDIAN.signup + query}>Register as a guardian</Link>}
    </div>
  </form>;
}

type DeskTab = "overview" | "lessons" | "assignments" | "requests" | "profile" | "notifications";

function DeskSidebar({ role, fullName, email, activeTab, setActiveTab, unread, signOut }: {
  role: Role; fullName: string; email: string; activeTab: DeskTab; setActiveTab: (tab: DeskTab) => void;
  unread: number; signOut: () => void;
}) {
  const tabs: Array<{ id: DeskTab; label: string; icon: typeof CalendarCheck; count?: number }> = [
    { id: "overview", label: "Overview", icon: CalendarCheck },
    { id: "lessons", label: "Lessons", icon: BookOpen },
    ...(role === "TUTOR" ? [{ id: "assignments" as DeskTab, label: "Assignments", icon: Inbox }] : []),
    ...(role === "GUARDIAN" ? [{ id: "requests" as DeskTab, label: "Tutor Requests", icon: Inbox }] : []),
    { id: "profile", label: "My profile", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell, count: unread },
  ];
  return <aside className="space-y-4 lg:sticky lg:top-6">
    <div className={panel}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950 text-sm font-black text-emerald-400">
          {fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{fullName}</p>
          <p className="truncate text-[11px] text-neutral-500">{email}</p>
        </div>
      </div>
      <span className={badge}>{accountPaths[role].label}</span>
    </div>
    <nav className="space-y-1 rounded-2xl border border-neutral-800 bg-neutral-900 p-2" aria-label="Desk sections">
      {tabs.map(({ id, label, icon: Icon, count }) => (
        <button key={id} type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
            activeTab === id
              ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
              : "border border-transparent text-neutral-300 hover:bg-neutral-800 hover:text-white"
          }`}>
          <Icon size={14} />
          <span className="flex-1">{label}</span>
          {!!count && <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold text-neutral-950">{count}</span>}
        </button>
      ))}
      <button type="button" onClick={signOut}
        className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-rose-400 transition hover:bg-rose-500/10">
        <LogOut size={14} />
        <span>Sign out</span>
      </button>
    </nav>
  </aside>;
}

export function AccountPortal({ role, register = false, login = false }: { role: Role; register?: boolean; login?: boolean }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const storageKey = `qta_session_${role.toLowerCase()}`;
  const [token, setToken] = useState(() => sessionStorage.getItem(storageKey) ?? "");
  const paths = accountPaths[role];
  const query = params.toString() ? `?${params.toString()}` : "";
  const [profileVersion, setProfileVersion] = useState(0);
  const [deskVersion, setDeskVersion] = useState(0);
  const [notifVersion, setNotifVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<DeskTab>("overview");
  const deskActive = !register && !login && !!token;
  useEffect(() => {
    if (!deskActive) return;
    const refresh = () => setDeskVersion((value) => value + 1);
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [deskActive]);
  const session = useResource<{ role: string; fullName: string; email: string; timeZone: string }>(
    !register && !login && token ? "/auth/me" : null, token, profileVersion);
  const alerts = useResource<NotificationItem[]>(
    deskActive ? "/notifications" : null, token, notifVersion + deskVersion);
  const unread = alerts?.data?.filter((alert) => !alert.readAt).length ?? 0;
  const title = `${paths.label} Desk`;
  useSEO({ title: register ? `${paths.label} registration` : login ? `${paths.label} login` : title, noindex: true });
  const signOut = () => { sessionStorage.removeItem(storageKey); setToken(""); };

  if (register || login) {
    const teacher = role === "TUTOR";
    const heading = register ? (teacher ? "Apply to Teach" : role === "STUDENT" ? "Sign Up as a Student" : "Create a Guardian Account") : `${paths.label} Login`;
    const Icon = teacher ? GraduationCap : Users;
    return <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-12 text-neutral-200">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="relative w-full max-w-lg space-y-6 rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-neutral-400 transition hover:text-white">
            <ArrowLeft size={13} /> Back to Home
          </Link>
          {role !== "GUARDIAN" && <Link className="text-xs text-neutral-400 hover:text-emerald-400"
            to={accountPaths[teacher ? "STUDENT" : "TUTOR"][register ? "signup" : "login"] + query}>
            {register ? "Sign up" : "Sign in"} as a {teacher ? "Student" : "Teacher"} instead
          </Link>}
        </div>
        <header className="space-y-2 text-center">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg ${teacher ? "border-amber-500/20 bg-amber-950 text-amber-400" : "border-emerald-500/20 bg-emerald-950 text-emerald-400"}`}>
            <Icon size={22} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">{heading}</h1>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-neutral-400">
            {register && teacher ? "Tell us about your teaching background so we can review your application."
              : register ? "Create an account to book Quran lessons and track progress."
                : "Sign in to access your lessons and account."}
          </p>
        </header>
        <AccountForm role={role} register={register} onSession={(value) => {
          sessionStorage.setItem(storageKey, value);
          navigate(paths.portal + query, { replace: true });
        }} />
      </div>
    </section>;
  }
  if (!token || session?.unauthorized || (session?.data && session.data.role !== role)) {
    return <Navigate replace to={paths.login + query} />;
  }
  return <section className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-neutral-200">
    <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-neutral-950 p-6 shadow-2xl md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-500/5 blur-[100px]" />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            <Sparkles size={11} />
            <span>{session?.data ? `Welcome, ${session.data.fullName}` : paths.label}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
        </div>
        {session?.data && (
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-center">
              <p className="text-lg font-black text-white">{unread}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Unread</p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-center">
              <p className="text-xs font-black text-emerald-400">{session.data.timeZone}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Time zone</p>
            </div>
          </div>
        )}
      </div>
    </div>
    <ErrorText value={session?.error} />
    {!session && <p role="status" className="text-sm text-neutral-500">Checking session…</p>}
    {session?.data && (
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-6">
        <DeskSidebar role={role} fullName={session.data.fullName} email={session.data.email}
          activeTab={activeTab} setActiveTab={setActiveTab} unread={unread} signOut={signOut} />
        <div className="mt-6 min-w-0 space-y-6 lg:mt-0">
          {role === "TUTOR" ? <TutorWorkspace token={token} profileVersion={profileVersion} deskVersion={deskVersion}
            timeZone={session.data.timeZone} refreshAccount={() => setProfileVersion((value) => value + 1)}
            activeTab={activeTab} onViewLessons={() => setActiveTab("lessons")} />
            : <GuardianWorkspace token={token} role={role} preferredTutor={params.get("tutor") ?? ""}
              timeZone={session.data.timeZone} deskVersion={deskVersion}
              activeTab={activeTab} onViewLessons={() => setActiveTab("lessons")} />}
          <div className={activeTab === "profile" ? "" : "hidden"}>
            <DeskProfile token={token} role={role} profile={session.data} refresh={() => setProfileVersion((value) => value + 1)} />
          </div>
          <div className={activeTab === "notifications" ? "" : "hidden"}>
            <DeskNotifications token={token} timeZone={session.data.timeZone} alerts={alerts}
              onMarkRead={() => setNotifVersion((value) => value + 1)} />
          </div>
          {role === "TUTOR" && (
            <div className={activeTab === "assignments" ? "" : "hidden"}>
              <TutorAssignments token={token} />
            </div>
          )}
          {role === "GUARDIAN" && (
            <div className={activeTab === "requests" ? "" : "hidden"}>
              <GuardianRequests token={token} />
            </div>
          )}
        </div>
      </div>
    )}
  </section>;
}

export function VerifyEmail() {
  const { hash } = useLocation();
  const token = hash.slice(1);
  const action = useAction();
  const [verified, setVerified] = useState(false);
  useSEO({ title: "Verify your email", noindex: true });
  return <Page title="Verify your email">
    <div className={panel}>
      {verified ? <p role="status">Email verified. You can now sign in.</p> : token ?
        <button className={button} disabled={action.busy} onClick={() => {
          void action.run(async () => {
            await request("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
            setVerified(true);
          });
        }}>Confirm email address</button> : <p>Open the verification link sent to your email.</p>}
      <ErrorText value={action.error} />
      <div className="flex flex-wrap gap-4 text-emerald-300">
        <Link to="/login/student">Student login</Link><Link to="/login/tutor">Teacher login</Link><Link to="/login/guardian">Guardian login</Link>
      </div>
    </div>
  </Page>;
}

function DeskProfile({ token, role, profile, refresh }: {
  token: string; role: Role; profile: { fullName: string; email: string; timeZone: string }; refresh: () => void;
}) {
  const action = useAction();
  const [saved, setSaved] = useState(false);
  return <form id="desk-profile" className={`${panel} scroll-mt-24`} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaved(false);
    void action.run(async () => {
      await accountRequest("/auth/me", token, "PATCH", {
        fullName: data.get("fullName"),
        ...(role === "TUTOR" ? {} : { timeZone: data.get("timeZone") }),
      });
      setSaved(true);
      refresh();
    });
  }}>
    <h2 className="text-sm font-bold text-white">My profile</h2>
    <p className="break-words text-neutral-400">{profile.email} · Verified email</p>
    <label className="block">Full name<input className={input} name="fullName" required minLength={2} maxLength={120} defaultValue={profile.fullName} /></label>
    {role !== "TUTOR" && <label className="block">IANA time zone<input className={input} name="timeZone" required defaultValue={profile.timeZone} /></label>}
    {role === "TUTOR" && <p className="text-sm text-neutral-400">Your teaching profile returns to admin review if you change your public name.</p>}
    <button className={button} disabled={action.busy}>Save profile</button>
    <ErrorText value={action.error} />
    {saved && <p role="status">Profile saved.</p>}
  </form>;
}

function DeskNotifications({ token, timeZone, alerts, onMarkRead }: {
  token: string; timeZone: string; alerts?: { data?: NotificationItem[]; error?: string }; onMarkRead: () => void;
}) {
  const action = useAction();
  const unread = alerts?.data?.filter((alert) => !alert.readAt).length ?? 0;
  return <section className={panel}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-bold text-white">
        <Bell size={15} className="text-emerald-400" />
        <span>Notifications</span>
        {unread > 0 && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-neutral-950">{unread}</span>}
      </h2>
      {unread > 0 && <button className={ghostLink} disabled={action.busy} onClick={() => {
        void action.run(async () => {
          await accountRequest("/notifications/read", token, "PATCH");
          onMarkRead();
        });
      }}>Mark all as read</button>}
    </div>
    <ErrorText value={alerts?.error ?? action.error} />
    {alerts?.data?.length === 0 && <p className="text-sm text-neutral-400">No class notifications yet.</p>}
    <ul className="space-y-3">
      {alerts?.data?.map((alert) => <li className={`rounded-xl border p-3 ${alert.readAt ? "border-neutral-800" : "border-emerald-500/40 bg-emerald-500/5"}`} key={alert.id}>
        <p className="text-xs font-bold text-white">{alert.title}</p>
        <p className="text-xs text-neutral-400">{alert.message}</p>
        <time className="text-[11px] text-neutral-500" dateTime={alert.visibleAt}>{localTime(alert.visibleAt, timeZone)}</time>
      </li>)}
    </ul>
  </section>;
}

function upcomingBooking(booking: Booking, now: number) {
  return ["BOOKED", "RESCHEDULED"].includes(booking.status) &&
    Date.parse(booking.scheduledAtUtc) + booking.durationMinutes * 60_000 > now;
}

function orderedLessons(bookings: Booking[] = []) {
  const now = Date.now();
  const upcoming = bookings.filter((booking) => upcomingBooking(booking, now));
  const history = bookings.filter((booking) => !upcomingBooking(booking, now)).reverse();
  return [...upcoming, ...history];
}

function DeskOverview({ bookings, role, token, timeZone, onViewLessons }: {
  bookings?: Booking[]; role: Role; token: string; timeZone: string; onViewLessons: () => void;
}) {
  const now = Date.now();
  const upcoming = bookings?.filter((booking) => upcomingBooking(booking, now)) ?? [];
  const people = new Map<string, string>();
  for (const booking of bookings ?? []) {
    if (booking.status === "CANCELLED") continue;
    if (role === "TUTOR") people.set(booking.student.id, booking.student.fullName);
    else if (booking.tutor) people.set(booking.tutorId, booking.tutor.account.fullName);
  }
  return <div className="grid gap-4 md:grid-cols-2">
    <div className={panel}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-white">
        <CalendarCheck size={15} className="text-emerald-400" />
        <span>Upcoming classes</span>
      </h2>
      {!bookings ? <p className="text-sm text-neutral-500">Loading classes…</p> : upcoming.length ? <>
        <p className={badge}>{upcoming.length} scheduled</p>
        <LessonDetails booking={upcoming[0]} timeZone={timeZone} />
        <LessonJoin booking={upcoming[0]} token={token} role={role} timeZone={timeZone} />
        <button type="button" className={ghostLink} onClick={onViewLessons}>
          <span>View lessons</span>
          <ChevronRight size={13} />
        </button>
      </> : <p className="text-sm text-neutral-400">No upcoming classes.</p>}
    </div>
    <div className={panel}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-white">
        <Users size={15} className="text-emerald-400" />
        <span>{role === "TUTOR" ? "My learners" : "My teachers"}</span>
      </h2>
      {!bookings ? <p className="text-sm text-neutral-500">Loading…</p> : people.size === 0 ? <p className="text-sm text-neutral-400">Contacts appear here after a lesson is booked.</p> :
        <ul className="space-y-2 text-xs text-neutral-300">{Array.from(people, ([id, name]) => <li key={id}>
          {role === "TUTOR" ? name : <Link className={ghostLink} to={`/tutors/${id}`}>{name}</Link>}
        </li>)}</ul>}
    </div>
  </div>;
}

function LessonDetails({ booking, timeZone }: { booking: Booking; timeZone?: string }) {
  const progress = booking.progressEntry;
  return <div className="space-y-2">
    <p>{booking.student.fullName}{booking.tutor ? ` with ${booking.tutor.account.fullName}` : ""}
      {" · "}{localTime(booking.scheduledAtUtc, timeZone)}{timeZone ? ` (${timeZone})` : ""} · {booking.durationMinutes} min · {booking.status.replaceAll("_", " ")}</p>
    {booking.lessonSession?.tutorNotes && <p className="whitespace-pre-wrap">Tutor notes: {booking.lessonSession.tutorNotes}</p>}
    {progress && <p>
      Progress: {progress.currentBook} · {progress.currentChapter}
      {progress.currentVerse != null && ` · Ayah ${progress.currentVerse}`}
      {progress.tajweedScore != null && ` · Tajweed ${progress.tajweedScore}%`}
      {progress.hifzPercent != null && ` · Hifz ${progress.hifzPercent}%`}
    </p>}
  </div>;
}

function LessonJoin({ booking, token, role, timeZone }: { booking: Booking; token: string; role: Role; timeZone: string }) {
  const join = useAction();
  const [, refreshClock] = useState(0);
  const start = Date.parse(booking.scheduledAtUtc);
  const opens = start - 10 * 60_000;
  const closes = start + (booking.durationMinutes + 15) * 60_000;
  const now = Date.now();
  const boundary = now < opens ? opens : now < closes ? closes : null;
  useEffect(() => {
    if (boundary === null) return;
    const timer = window.setTimeout(() => refreshClock((value) => value + 1), Math.min(2_147_483_647, Math.max(1, boundary - Date.now())));
    return () => window.clearTimeout(timer);
  }, [boundary]);
  if (!["BOOKED", "RESCHEDULED"].includes(booking.status)) return null;
  const label = now < opens ? `Join opens ${localTime(new Date(opens).toISOString(), timeZone)} (${timeZone}).`
    : now >= closes ? "The meeting window has closed." : "The meeting window is open.";
  return <div className="space-y-2">
    <button className={button} type="button" disabled={join.busy || now < opens || now >= closes} onClick={() => {
      void join.run(async () => {
        const { url } = await accountRequest<{ url: string }>(
          `/${role === "TUTOR" ? "tutor" : "guardian"}/bookings/${booking.id}/meeting`, token);
        if (new URL(url).protocol !== "https:") throw new Error("Invalid meeting link.");
        window.location.assign(url);
      });
    }}>Join lesson</button>
    <p className="text-sm text-neutral-400">{label}</p>
    <ErrorText value={join.error} />
  </div>;
}

function LessonActions({ booking, token, role, timeZone, refresh }: {
  booking: Booking; token: string; role: Role; timeZone: string; refresh?: () => void;
}) {
  const saveLink = useAction();
  const outcome = useAction();
  const [status, setStatus] = useState("COMPLETED");
  const [message, setMessage] = useState("");
  const path = `/tutor/bookings/${booking.id}`;
  if (!["BOOKED", "RESCHEDULED"].includes(booking.status)) return null;
  return <div className="space-y-3">
    <LessonJoin booking={booking} token={token} role={role} timeZone={timeZone} />
    {role === "TUTOR" && <>
      <details className="rounded border border-neutral-700 p-3">
        <summary className="cursor-pointer">Set meeting link</summary>
        <form className="mt-3 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const url = new FormData(form).get("url");
          setMessage("");
          void saveLink.run(async () => {
            await accountRequest(`${path}/meeting`, token, "PUT", { url, expectedStart: booking.scheduledAtUtc });
            form.reset();
            setMessage("Meeting link saved.");
          });
        }}>
          <label className="block">Private HTTPS meeting URL<input className={input} name="url" type="url" required maxLength={2000} /></label>
          <ErrorText value={saveLink.error} />
          <p role="status">{message}</p>
          <button className={button} disabled={saveLink.busy}>Save link</button>
        </form>
      </details>
      <details className="rounded border border-neutral-700 p-3">
        <summary className="cursor-pointer">Record attendance and progress</summary>
        <form className="mt-3 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const optionalNumber = (name: string) => form.get(name) ? Number(form.get(name)) : undefined;
          const progress = status === "COMPLETED" ? {
            currentBook: form.get("currentBook"), currentChapter: form.get("currentChapter"),
            currentVerse: optionalNumber("currentVerse"), tajweedScore: optionalNumber("tajweedScore"),
            hifzPercent: optionalNumber("hifzPercent"),
          } : undefined;
          void outcome.run(async () => {
            await accountRequest(`${path}/outcome`, token, "POST", {
              status, expectedStart: booking.scheduledAtUtc, notes: form.get("notes"), progress,
            });
            refresh?.();
          });
        }}>
          <label className="block">Attendance
            <select className={input} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="COMPLETED">Attended and completed</option>
              <option value="NO_SHOW">No-show</option>
            </select>
          </label>
          <label className="block">Lesson notes shared with the guardian<textarea className={input} name="notes" maxLength={2000} /></label>
          {status === "COMPLETED" && <>
            <label className="block">Book or program<input className={input} name="currentBook" required maxLength={120} /></label>
            <label className="block">Surah or chapter<input className={input} name="currentChapter" required maxLength={120} /></label>
            <label className="block">Ayah (optional)<input className={input} name="currentVerse" type="number" min="1" max="286" /></label>
            <label className="block">Tajweed score, % (optional)<input className={input} name="tajweedScore" type="number" min="0" max="100" /></label>
            <label className="block">Hifz progress, % (optional)<input className={input} name="hifzPercent" type="number" min="0" max="100" step="0.01" /></label>
          </>}
          <ErrorText value={outcome.error} />
          <button className={button} disabled={outcome.busy}>Save lesson outcome</button>
        </form>
      </details>
    </>}
  </div>;
}

function TutorWorkspace({ token, profileVersion, deskVersion, timeZone, refreshAccount, activeTab, onViewLessons }: {
  token: string; profileVersion: number; deskVersion: number; timeZone: string; refreshAccount: () => void;
  activeTab: DeskTab; onViewLessons: () => void;
}) {
  const [version, setVersion] = useState(0);
  const profile = useResource<Profile>("/tutor/profile", token, version + profileVersion);
  const bookings = useResource<Booking[]>("/tutor/bookings", token, version + deskVersion);
  return <>
    <div className={activeTab === "overview" ? "" : "hidden"}>
      <DeskOverview bookings={bookings?.data} role="TUTOR" token={token} timeZone={timeZone} onViewLessons={onViewLessons} />
    </div>
    <div className={`space-y-4 ${activeTab === "lessons" ? "" : "hidden"}`}>
      <ErrorText value={profile?.error ?? bookings?.error} />
      <section className={panel}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <CalendarCheck size={15} className="text-emerald-400" />
          <span>Your lessons</span>
        </h2>
        {bookings?.data?.length === 0 && <p className="text-sm text-neutral-400">No lessons booked yet.</p>}
        {orderedLessons(bookings?.data).map((booking) => <article className={panel} key={booking.id}>
          <LessonDetails booking={booking} timeZone={timeZone} />
          <LessonActions booking={booking} token={token} role="TUTOR" timeZone={timeZone} refresh={() => setVersion((value) => value + 1)} />
        </article>)}
      </section>
    </div>
    <div className={`space-y-4 ${activeTab === "profile" ? "" : "hidden"}`}>
      {!profile && <p role="status" className="text-sm text-neutral-500">Loading profile…</p>}
      {profile?.data && createElement(TutorEditor, {
        key: profile.data.updatedAt, profile: profile.data, token,
        refresh: refreshAccount,
      })}
    </div>
  </>;
}

function TutorEditor({ profile, token, refresh }: { profile: Profile; token: string; refresh: () => void }) {
  const profileAction = useAction();
  const availabilityAction = useAction();
  const [slots, setSlots] = useState(profile.availabilitySlots.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })));
  const suspended = profile.approvalStatus === "SUSPENDED";
  return <>
    <form className={panel} onSubmit={(event) => {
      event.preventDefault();
      const data = profileData(new FormData(event.currentTarget));
      void profileAction.run(async () => { await accountRequest("/tutor/profile", token, "PUT", data); refresh(); });
    }}>
      <h2 className="text-sm font-bold text-white">{profile.account.fullName} · {profile.approvalStatus}</h2>
      <p>Submitting profile changes removes your listing until an admin approves the new profile.</p>
      <ProfileFields profile={profile} />
      <ErrorText value={profileAction.error} />
      <button className={button} disabled={suspended || profileAction.busy}>Submit profile for review</button>
    </form>
    <form className={panel} onSubmit={(event) => {
      event.preventDefault();
      const timeZone = String(new FormData(event.currentTarget).get("timeZone"));
      void availabilityAction.run(async () => { await accountRequest("/tutor/availability", token, "PUT", { timeZone, slots }); refresh(); });
    }}>
      <h2 className="text-sm font-bold text-white">Weekly availability</h2>
      <label className="block">IANA time zone (for example Asia/Karachi)
        <input className={input} name="timeZone" required defaultValue={profile.account.timeZone} />
      </label>
      {slots.map((slot, index) => (
        <div className="grid gap-2 sm:grid-cols-4" key={index}>
          <select className={input} aria-label="Weekday" value={slot.weekday} onChange={(event) => {
            const weekday = Number(event.target.value);
            setSlots(slots.map((entry, i) => i === index ? { ...entry, weekday } : entry));
          }}>{days.map((day, i) => <option value={i} key={day}>{day}</option>)}</select>
          <input className={input} aria-label="Start time" type="time" required value={slot.startTime} onChange={(event) => {
            const startTime = event.target.value;
            setSlots(slots.map((entry, i) => i === index ? { ...entry, startTime } : entry));
          }} />
          <input className={input} aria-label="End time" type="time" required value={slot.endTime} onChange={(event) => {
            const endTime = event.target.value;
            setSlots(slots.map((entry, i) => i === index ? { ...entry, endTime } : entry));
          }} />
          <button type="button" className={ghostLink} onClick={() => setSlots(slots.filter((_, i) => i !== index))}>Remove window</button>
        </div>
      ))}
      <ErrorText value={availabilityAction.error} />
      <div className="flex gap-4">
        <button type="button" className={ghostLink} disabled={suspended || slots.length >= 42} onClick={() => setSlots([...slots, { weekday: 1, startTime: "09:00", endTime: "12:00" }])}>Add window</button>
        <button className={button} disabled={suspended || availabilityAction.busy}>Save availability</button>
      </div>
    </form>
  </>;
}

function GuardianWorkspace({ token, role, preferredTutor, deskVersion, timeZone, activeTab, onViewLessons }: {
  token: string; role: "GUARDIAN" | "STUDENT"; preferredTutor: string; deskVersion: number; timeZone: string;
  activeTab: DeskTab; onViewLessons: () => void;
}) {
  const [version, setVersion] = useState(0);
  const [tutorId, setTutorId] = useState(preferredTutor);
  const [reschedule, setReschedule] = useState<Booking>();
  const [attempt, setAttempt] = useState<{ key: string; id: string }>();
  const students = useResource<Student[]>("/guardian/students", token, version);
  const tutors = useResource<Tutor[]>("/tutors", undefined, version);
  const bookings = useResource<Booking[]>("/guardian/bookings", token, version + deskVersion);
  const selectedTutor = reschedule?.tutorId ?? tutorId;
  const slotsPath = reschedule ? `/guardian/bookings/${reschedule.id}/slots` : tutorId ? `/tutors/${tutorId}/slots` : null;
  const slots = useResource<string[]>(slotsPath, reschedule ? token : undefined, version + deskVersion);
  const learnerAction = useAction();
  const bookingAction = useAction();
  const refresh = () => setVersion((value) => value + 1);

  return <>
    <div className={activeTab === "overview" ? "" : "hidden"}>
      <DeskOverview bookings={bookings?.data} role={role} token={token} timeZone={timeZone} onViewLessons={onViewLessons} />
    </div>
    <div className={`space-y-6 ${activeTab === "lessons" ? "" : "hidden"}`}>
    {role === "GUARDIAN" && <form className={panel} onSubmit={(event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const fullName = new FormData(form).get("fullName");
      void learnerAction.run(async () => {
        await accountRequest("/guardian/students", token, "POST", { fullName });
        form.reset();
        refresh();
      });
    }}>
      <h2 className="text-sm font-bold text-white">Learners</h2>
      <ErrorText value={students?.error ?? learnerAction.error} />
      {students?.data?.map((student) => <p key={student.id}>{student.fullName}</p>)}
      <label className="block">Learner name<input className={input} name="fullName" required minLength={2} maxLength={120} /></label>
      <button className={button} disabled={learnerAction.busy}>Add learner</button>
    </form>}
    <form className={panel} key={reschedule?.id ?? "new"} onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const scheduledAtUtc = String(data.get("scheduledAtUtc"));
      void bookingAction.run(async () => {
        try {
          if (reschedule) {
            await accountRequest(`/guardian/bookings/${reschedule.id}`, token, "PATCH", {
              action: "reschedule", expectedStart: reschedule.scheduledAtUtc, scheduledAtUtc,
            });
            setReschedule(undefined);
          } else {
            const studentId = role === "STUDENT" ? students?.data?.[0]?.id : String(data.get("studentId"));
            if (!studentId) throw new Error("Select a learner before booking.");
            const key = JSON.stringify([studentId, tutorId, scheduledAtUtc]);
            const id = attempt?.key === key ? attempt.id : crypto.randomUUID();
            setAttempt({ key, id });
            await accountRequest("/guardian/bookings", token, "POST", { id, studentId, tutorId, scheduledAtUtc });
            setAttempt(undefined);
          }
        } finally { refresh(); }
      });
    }}>
      <h2 className="text-sm font-bold text-white">{reschedule ? "Reschedule lesson" : "Book a 45-minute lesson"}</h2>
      {reschedule ? (
        <p>{reschedule.student.fullName} · {reschedule.tutor?.account.fullName}</p>
      ) : (
        <>
          {role === "GUARDIAN" && <label className="block">Learner<select className={input} name="studentId" required defaultValue="">
            <option value="">Choose a learner</option>
            {students?.data?.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}
          </select></label>}
          <div>
            <label className="block" htmlFor="booking-tutor">Tutor</label>
            <select id="booking-tutor" className={input} value={tutorId} onChange={(event) => setTutorId(event.target.value)} required>
            <option value="">Choose a tutor</option>
            {tutors?.data?.map((tutor) => <option key={tutor.accountId} value={tutor.accountId}>{tutor.account.fullName}</option>)}
            </select>
          </div>
          {tutors?.data?.length === 0 && <p className="text-sm text-neutral-400">No approved tutors are available to book yet.</p>}
        </>
      )}
      <label className="block">Available times ({timeZone})
        <select key={selectedTutor} className={input} name="scheduledAtUtc" defaultValue="" required>
          <option value="">{slots?.data?.length ? "Choose a time" : "No times shown"}</option>
          {slots?.data?.map((slot) => <option key={slot} value={slot}>{localTime(slot, timeZone)}</option>)}
        </select>
      </label>
      <ErrorText value={bookingAction.error ?? slots?.error ?? tutors?.error ?? students?.error} />
      <div className="flex gap-4">
        <button className={button} disabled={bookingAction.busy || !slots?.data?.length || (!reschedule && !students?.data?.length)}>{reschedule ? "Save new time" : "Confirm booking"}</button>
        {reschedule && <button type="button" className={ghostLink} onClick={() => setReschedule(undefined)}>Keep original time</button>}
      </div>
    </form>
    <section className={panel}>
      <h2 className="text-sm font-bold text-white">Your lessons</h2>
      <ErrorText value={bookings?.error} />
      {bookings?.data?.length === 0 && <p className="text-sm text-neutral-400">No lessons booked yet.</p>}
      {orderedLessons(bookings?.data).map((booking) => (
        <div className="space-y-2 border-t border-neutral-700 pt-3" key={booking.id}>
          <LessonDetails booking={booking} timeZone={timeZone} />
          <LessonActions booking={booking} token={token} role={role} timeZone={timeZone} />
          {["BOOKED", "RESCHEDULED"].includes(booking.status) && new Date(booking.scheduledAtUtc).getTime() > Date.now() && (
            <div className="flex gap-4">
              <button className={ghostLink} disabled={bookingAction.busy} onClick={() => setReschedule(booking)}>Reschedule</button>
              <button className={dangerLink} disabled={bookingAction.busy} onClick={() => {
                if (!window.confirm("Cancel this lesson?")) return;
                void bookingAction.run(async () => {
                  await accountRequest(`/guardian/bookings/${booking.id}`, token, "PATCH", { action: "cancel", expectedStart: booking.scheduledAtUtc });
                  if (reschedule?.id === booking.id) setReschedule(undefined);
                  refresh();
                });
              }}>Cancel lesson</button>
            </div>
          )}
        </div>
      ))}
    </section>
    </div>
  </>;
}

const reqStatusColor: Record<string, string> = {
  PENDING: "border-amber-500/25 text-amber-400",
  MATCHED: "border-sky-500/25 text-sky-400",
  ACCEPTED: "border-emerald-500/25 text-emerald-400",
  DECLINED: "border-rose-500/25 text-rose-400",
  CANCELLED: "border-neutral-700 text-neutral-500",
};

function TutorAssignments({ token }: { token: string }) {
  const [version, setVersion] = useState(0);
  const result = useResource<LearningRequest[]>("/tutor/assignments", token, version);
  const action = useAction();
  return <div className="space-y-4">
    <section className={panel}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-white">
        <Inbox size={15} className="text-sky-400" />
        <span>Your assignments</span>
      </h2>
      <p className="text-xs text-neutral-400">The academy team assigns families here. Accept or decline each request.</p>
      {!result && <p role="status" className="text-sm text-neutral-500">Loading…</p>}
      <ErrorText value={result?.error ?? action.error} />
      {result?.data?.length === 0 && <p className="text-sm text-neutral-400">No assignments yet. The admin will assign families to you here.</p>}
      {result?.data?.map((req) => (
        <article key={req.id} className="border-t border-neutral-800 pt-3 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-white">{req.program} · {req.level}</p>
              <p className="text-xs text-neutral-400">Student: {req.student.fullName} · {req.preferredLang}{req.budgetMax ? ` · max $${req.budgetMax}/hr` : ""}</p>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${reqStatusColor[req.status] ?? ""}`}>{req.status}</span>
          </div>
          {req.notes && <p className="text-xs text-neutral-500 italic line-clamp-3">{req.notes}</p>}
          {req.status === "MATCHED" && (
            <div className="flex gap-3">
              <button className={button} disabled={action.busy} onClick={() => void action.run(async () => {
                await accountRequest(`/tutor/assignments/${req.id}`, token, "PATCH", { response: "ACCEPTED" });
                setVersion((v) => v + 1);
              })}>Accept assignment</button>
              <button className={dangerLink} disabled={action.busy} onClick={() => void action.run(async () => {
                await accountRequest(`/tutor/assignments/${req.id}`, token, "PATCH", { response: "DECLINED" });
                setVersion((v) => v + 1);
              })}>Decline</button>
            </div>
          )}
          {req.status === "ACCEPTED" && (
            <p className="text-xs text-emerald-400">Accepted — book a trial lesson from the Lessons tab with this family.</p>
          )}
        </article>
      ))}
    </section>
  </div>;
}

const reqPrograms = ["Quran Reading", "Hifz (Memorisation)", "Tajweed", "Arabic Language", "Islamic Studies"];
const reqLevels = ["Beginner", "Intermediate", "Advanced"];
const reqLangs = ["English", "Urdu", "Arabic", "Bengali", "French"];

function GuardianRequests({ token }: { token: string }) {
  const [version, setVersion] = useState(0);
  const result = useResource<LearningRequest[]>("/guardian/requests", token, version);
  const studentsResult = useResource<Student[]>("/guardian/students", token, 0);
  const action = useAction();
  const students = studentsResult?.data ?? [];
  return <div className="space-y-4">
    <form className={panel} onSubmit={(event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      void action.run(async () => {
        await accountRequest("/guardian/requests", token, "POST", {
          studentId: data.get("studentId"),
          program: data.get("program"),
          level: data.get("level"),
          preferredLang: data.get("preferredLang"),
          ...(data.get("budgetMax") ? { budgetMax: Number(data.get("budgetMax")) } : {}),
          ...(data.get("notes") ? { notes: String(data.get("notes")) } : {}),
        });
        form.reset();
        setVersion((v) => v + 1);
      });
    }}>
      <h2 className="text-sm font-bold text-white">Request a tutor</h2>
      <p className="text-xs text-neutral-400">Our team will match you with an approved tutor based on your requirements.</p>
      <label className="block">Learner
        <select name="studentId" className={input} required defaultValue="">
          <option value="">Choose a learner</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">Program
          <select name="program" className={input} required defaultValue="">
            <option value="">Choose a program</option>
            {reqPrograms.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="block">Level
          <select name="level" className={input} required defaultValue="">
            <option value="">Choose a level</option>
            {reqLevels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="block">Preferred language
          <select name="preferredLang" className={input} required defaultValue="">
            <option value="">Choose a language</option>
            {reqLangs.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="block">Max hourly rate (USD, optional)
          <input type="number" name="budgetMax" className={input} min={5} max={9999} step={1} placeholder="e.g. 25" />
        </label>
      </div>
      <label className="block">Additional notes (optional)
        <textarea name="notes" className={input} rows={3} maxLength={1000} placeholder="e.g. evenings only, female tutor preferred…" />
      </label>
      <ErrorText value={action.error} />
      <button className={button} disabled={action.busy || !students.length}>Submit request</button>
      {!students.length && <p className="text-xs text-neutral-500">Add a learner first from the Lessons tab, then come back here.</p>}
    </form>
    <section className={panel}>
      <h2 className="text-sm font-bold text-white">Your requests</h2>
      {!result && <p role="status" className="text-sm text-neutral-500">Loading…</p>}
      <ErrorText value={result?.error} />
      {result?.data?.length === 0 && <p className="text-sm text-neutral-400">No requests submitted yet.</p>}
      {result?.data?.map((req) => (
        <article key={req.id} className="border-t border-neutral-800 pt-3 space-y-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-white">{req.program} · {req.level}</p>
              <p className="text-xs text-neutral-400">{req.student.fullName} · {req.preferredLang}{req.budgetMax ? ` · max $${req.budgetMax}/hr` : ""}</p>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${reqStatusColor[req.status] ?? ""}`}>{req.status}</span>
          </div>
          {req.assignedTutor && <p className="text-xs text-sky-400">Matched with: {req.assignedTutor.account.fullName}</p>}
          {req.notes && <p className="text-xs text-neutral-500 italic line-clamp-2">{req.notes}</p>}
          {["PENDING", "MATCHED"].includes(req.status) && (
            <button className={dangerLink} disabled={action.busy} onClick={() => {
              if (!window.confirm("Cancel this tutor request?")) return;
              void action.run(async () => {
                await accountRequest(`/guardian/requests/${req.id}/cancel`, token, "PATCH", {});
                setVersion((v) => v + 1);
              });
            }}>Cancel request</button>
          )}
        </article>
      ))}
    </section>
  </div>;
}

type ManagedAccount = {
  membershipId: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  account: {
    id: string; fullName: string; email: string; timeZone: string; managedLearner: boolean;
    tutorProfile: Pick<Profile, "approvalStatus" | "specialties" | "languages" | "experienceYears" | "hourlyRate" | "bio" | "qualifications"> | null;
    studentLinks: Array<{ guardian: { id: string; fullName: string } }>;
  };
};

export function AccountsPanel({ token }: { token: string }) {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const action = useAction();
  const result = useResource<ManagedAccount[]>("/admin/accounts", token, version);
  const accounts = result?.data?.filter((entry) => entry.role in accountPaths) ?? [];
  const visible = accounts.filter((entry) =>
    (!role || entry.role === role) &&
    [entry.account.fullName, entry.account.email, entry.account.id].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const refresh = () => setVersion((value) => value + 1);
  return <>
    <div className="grid gap-3 sm:grid-cols-3">
      {(["TUTOR", "STUDENT", "GUARDIAN"] as const).map((key) => {
        const Icon = key === "TUTOR" ? GraduationCap : key === "STUDENT" ? BookOpen : Users;
        const active = role === key;
        return <button type="button" key={key}
          className={`${panel} text-left transition ${active ? "border-emerald-500/50 bg-emerald-500/5" : "hover:border-neutral-700"}`}
          onClick={() => setRole(active ? "" : key)} aria-pressed={active}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Active {accountPaths[key].label.toLowerCase()}s</span>
            <Icon size={15} className={active ? "text-emerald-400" : "text-neutral-600"} />
          </div>
          <span className="block text-3xl font-black text-white">{result?.data ? accounts.filter((entry) => entry.role === key && entry.status === "ACTIVE").length : "—"}</span>
        </button>;
      })}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-1.5 text-xs font-bold text-neutral-300">
        Search by name, email, or account ID
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input type="search" className={`${input} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </label>
      <label className="block space-y-1.5 text-xs font-bold text-neutral-300">Account role
        <select className={input} value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">All roles</option>
          <option value="TUTOR">Teachers</option><option value="STUDENT">Students</option><option value="GUARDIAN">Guardians</option>
        </select>
      </label>
    </div>
    <ErrorText value={action.error || result?.error} />
    {notice && <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-950/40 px-3.5 py-2.5 text-xs font-medium text-emerald-300">{notice}</p>}
    {!result && token && <p role="status" className="text-sm text-neutral-500">Loading accounts…</p>}
    {result?.data && !visible.length && <p className="text-sm text-neutral-400">No matching accounts.</p>}
    {visible.map(({ account, membershipId, role: kind, status }) => (
      <article key={membershipId} className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 break-words">
            <h2 className="text-base font-bold text-white">{account.fullName}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={badge}>{accountPaths[kind].label}</span>
              <span className={`${badge} ${status === "ACTIVE" ? "border-emerald-500/25 text-emerald-400" : status === "SUSPENDED" ? "border-amber-500/25 text-amber-400" : "border-rose-500/25 text-rose-400"}`}>{status}</span>
              {account.tutorProfile && <span className={badge}>Profile {account.tutorProfile.approvalStatus}</span>}
            </div>
            <p className="mt-2 text-xs text-neutral-400">{account.managedLearner ? "Guardian-managed learner" : account.email}</p>
            <p className="text-[11px] text-neutral-600">Account ID: <code>{account.id}</code></p>
            {account.studentLinks.length > 0 && <p className="text-[11px] text-neutral-500">
              Guardian: {account.studentLinks.map(({ guardian }) => guardian.fullName).join(", ")}
            </p>}
          </div>
          <button className={ghostLink} type="button" onClick={() => setSelected(selected === membershipId ? "" : membershipId)}>
            {selected === membershipId ? "Close profile" : "View and edit profile"}
          </button>
        </div>
        {selected === membershipId && <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          if (!token) return;
          setNotice("");
          void action.run(async () => {
            await accountRequest(`/admin/accounts/${account.id}/profile`, token, "PATCH", {
              fullName: data.get("fullName"), timeZone: kind === "TUTOR" ? account.timeZone : data.get("timeZone"),
              ...(account.tutorProfile ? { tutorProfile: profileData(data) } : {}),
            });
            setNotice("Profile saved.");
            refresh();
          });
        }}>
          <label className="block space-y-1.5 text-xs font-bold text-neutral-300">Full name<input name="fullName" className={input} required minLength={2} maxLength={120} defaultValue={account.fullName} /></label>
          {kind !== "TUTOR" && <label className="block space-y-1.5 text-xs font-bold text-neutral-300">IANA time zone<input name="timeZone" className={input} required defaultValue={account.timeZone} /></label>}
          {account.tutorProfile && <ProfileFields profile={account.tutorProfile} />}
          <button className={button} disabled={action.busy}>Save profile</button>
        </form>}
        <div className="flex flex-wrap gap-2 border-t border-neutral-800 pt-3">
          {([["ACTIVE", "Restore access"], ["SUSPENDED", "Suspend"], ["REVOKED", "Remove from academy"]] as const)
            .filter(([next]) => next !== status && !(status === "REVOKED" && next === "SUSPENDED"))
            .map(([next, label]) => <button type="button" key={next} disabled={action.busy}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${next === "ACTIVE" ? "text-emerald-400 hover:bg-emerald-500/10" : "text-rose-400 hover:bg-rose-500/10"}`}
              onClick={() => {
                if (!token || (next !== "ACTIVE" && !window.confirm(`${label} for ${account.fullName}? Booking and audit history will be kept.`))) return;
                setNotice("");
                void action.run(async () => {
                  try {
                    await accountRequest(`/admin/memberships/${membershipId}`, token, "PATCH", { status: next });
                    setNotice(`${account.fullName}: ${next.toLowerCase()}.`);
                  } finally { refresh(); }
                });
              }}>{label}</button>)}
        </div>
      </article>
    ))}
  </>;
}

export function OperationsPanel({ token }: { token: string }) {
  const [version, setVersion] = useState(0);
  const action = useAction();
  const operations = useResource<{
    missed: Booking[];
    audit: Array<{ id: string; action: string; targetType: string; targetId: string | null; createdAt: string;
      actor: { fullName: string } | null; resolution: { status: string; reason: string } | null }>;
  }>("/admin/operations", token, version);
  if (operations?.unauthorized) return <p className="text-sm text-rose-400">Your session expired. Sign in again.</p>;
  return <>
    <div className="flex gap-4">
      <button className={ghostLink} onClick={() => setVersion((value) => value + 1)}>Refresh queue</button>
    </div>
    <ErrorText value={action.error || operations?.error} />
    {!operations && <p role="status">Loading operations…</p>}
    {operations?.data && <>
      <section className={panel}>
        <h2 className="text-sm font-bold text-white">Unresolved past lessons</h2>
        {operations.data.missed.length === 0 && <p>No lessons need review.</p>}
        {operations.data.missed.map((booking) => (
          <form key={booking.id} className="space-y-3 border-t border-neutral-700 pt-4" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void action.run(async () => {
              try {
                await accountRequest(`/admin/operations/bookings/${booking.id}`, token, "PATCH", {
                  status: form.get("status"), reason: form.get("reason"), expectedStart: booking.scheduledAtUtc,
                });
              } finally { setVersion((value) => value + 1); }
            });
          }}>
            <LessonDetails booking={booking} />
            <label className="block">Resolution<select className={input} name="status" required defaultValue="">
              <option value="">Choose a resolution</option>
              <option value="NO_SHOW">Mark no-show</option>
              <option value="CANCELLED">Cancel lesson</option>
            </select></label>
            <label className="block">Internal reason<textarea className={input} name="reason" required minLength={5} maxLength={500} /></label>
            <button className={button} disabled={action.busy}>Resolve lesson</button>
          </form>
        ))}
      </section>
      <section className={panel}>
        <h2 className="text-sm font-bold text-white">Recent audit activity</h2>
        {operations.data.audit.length === 0 && <p>No events recorded.</p>}
        <ul className="space-y-3">
          {operations.data.audit.map((event) => (
            <li key={event.id} className="break-words border-t border-neutral-700 pt-3">
              <p>{localTime(event.createdAt)} · {event.actor?.fullName ?? "System"} · {event.action}</p>
              <p className="text-sm text-neutral-400">{event.targetType} {event.targetId}</p>
              {event.resolution && <p>{event.resolution.status.replaceAll("_", " ")} · {event.resolution.reason}</p>}
            </li>
          ))}
        </ul>
      </section>
    </>}
  </>;
}

const approvalBadge: Record<string, string> = {
  PENDING: "border-amber-500/25 text-amber-400",
  APPROVED: "border-emerald-500/25 text-emerald-400",
  REJECTED: "border-rose-500/25 text-rose-400",
  SUSPENDED: "border-orange-500/25 text-orange-400",
};

export function TutorsPanel({ token }: { token: string }) {
  const [version, setVersion] = useState(0);
  const [expanded, setExpanded] = useState<string>("");
  const tutors = useResource<Profile[]>("/admin/tutors", token, version);
  const action = useAction();
  if (tutors?.unauthorized) return <p className="text-sm text-rose-400">Your session expired. Sign in again.</p>;
  return <>
    <ErrorText value={action.error || tutors?.error} />
    {!tutors && <p role="status" className="text-sm text-neutral-500">Loading applications…</p>}
    {tutors?.data?.length === 0 && <p className="text-sm text-neutral-400">No tutor applications yet.</p>}
    {tutors?.data?.map((tutor) => (
      <article className={panel} key={tutor.accountId}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 text-sm font-black text-neutral-300">
              {tutor.account.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">{tutor.account.fullName}</h2>
              <p className="text-xs text-neutral-400">{tutor.account.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className={`${badge} ${approvalBadge[tutor.approvalStatus] ?? ""}`}>{tutor.approvalStatus}</span>
                <span className={badge}>{tutor.experienceYears} yrs · ${tutor.hourlyRate}/hr</span>
              </div>
            </div>
          </div>
          <button className={ghostLink} type="button" onClick={() => setExpanded(expanded === tutor.accountId ? "" : tutor.accountId)}>
            {expanded === tutor.accountId ? "Collapse" : "Review details"}
          </button>
        </div>
        {expanded === tutor.accountId && (
          <div className="space-y-3 border-t border-neutral-800 pt-3 text-xs text-neutral-400">
            <p><span className="font-bold text-neutral-300">Subjects:</span> {tutor.specialties.join(", ") || "—"}</p>
            <p><span className="font-bold text-neutral-300">Languages:</span> {tutor.languages.join(", ") || "—"}</p>
            {tutor.bio && <div>
              <p className="mb-1 font-bold text-neutral-300">Bio</p>
              <p className="whitespace-pre-wrap leading-relaxed">{tutor.bio}</p>
            </div>}
            {tutor.qualifications && <div>
              <p className="mb-1 font-bold text-neutral-300">Qualifications</p>
              <p className="whitespace-pre-wrap leading-relaxed">{tutor.qualifications}</p>
            </div>}
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t border-neutral-800 pt-3">
          {([["Approve", "APPROVED"], ["Reject", "REJECTED"], ["Suspend", "SUSPENDED"]] as const).map(([label, status]) => (
            <button key={status} disabled={action.busy || tutor.approvalStatus === status}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
                status === "APPROVED" ? "text-emerald-400 hover:bg-emerald-500/10"
                : status === "REJECTED" ? "text-rose-400 hover:bg-rose-500/10"
                : "text-orange-400 hover:bg-orange-500/10"
              }`}
              onClick={() => void action.run(async () => {
                try { await accountRequest(`/admin/tutors/${tutor.accountId}`, token, "PATCH", { status, updatedAt: tutor.updatedAt }); }
                finally { setVersion((v) => v + 1); }
              })}>
              {label}
            </button>
          ))}
        </div>
      </article>
    ))}
  </>;
}

export function TutorProfilesPanel({ token }: { token: string }) {
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const action = useAction();
  const result = useResource<ManagedAccount[]>("/admin/accounts", token, version);
  const tutors = (result?.data ?? []).filter(
    (entry) => entry.role === "TUTOR" && entry.account.tutorProfile?.approvalStatus === "APPROVED"
  );
  if (result?.unauthorized) return <p className="text-sm text-rose-400">Session expired. Sign in again.</p>;
  return <>
    <ErrorText value={action.error || result?.error} />
    {notice && <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-950/40 px-3.5 py-2.5 text-xs font-medium text-emerald-300">{notice}</p>}
    {!result && token && <p role="status" className="text-sm text-neutral-500">Loading tutor profiles…</p>}
    {result?.data && !tutors.length && <p className="text-sm text-neutral-400">No approved tutors yet. Approve applications from the Tutor Applications tab.</p>}
    {tutors.map(({ account, membershipId }) => (
      <article key={membershipId} className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-950 text-sm font-black text-emerald-400">
              {account.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">{account.fullName}</h2>
              <p className="text-xs text-neutral-400">{account.email}</p>
              {account.tutorProfile && (
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  {account.tutorProfile.specialties.join(", ")} · {account.tutorProfile.languages.join(", ")} · ${account.tutorProfile.hourlyRate}/hr
                </p>
              )}
            </div>
          </div>
          <button className={ghostLink} type="button" onClick={() => { setSelected(selected === membershipId ? "" : membershipId); setNotice(""); }}>
            {selected === membershipId ? "Close" : "Edit profile"}
          </button>
        </div>
        {account.tutorProfile?.bio && (
          <p className={`text-xs leading-relaxed text-neutral-400 ${selected === membershipId ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
            {account.tutorProfile.bio}
          </p>
        )}
        {selected === membershipId && (
          <form className="space-y-3 border-t border-neutral-800 pt-3" onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setNotice("");
            void action.run(async () => {
              await accountRequest(`/admin/accounts/${account.id}/profile`, token, "PATCH", {
                fullName: data.get("fullName"),
                timeZone: account.timeZone,
                ...(account.tutorProfile ? { tutorProfile: profileData(data) } : {}),
              });
              setNotice(`${account.fullName}: profile saved.`);
              setVersion((v) => v + 1);
            });
          }}>
            <label className="block space-y-1.5 text-xs font-bold text-neutral-300">
              Full name
              <input name="fullName" className={input} required minLength={2} maxLength={120} defaultValue={account.fullName} />
            </label>
            {account.tutorProfile && <ProfileFields profile={account.tutorProfile} />}
            <button className={button} disabled={action.busy}>Save profile changes</button>
          </form>
        )}
      </article>
    ))}
  </>;
}

export function RequestsPanel({ token }: { token: string }) {
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const action = useAction();
  const result = useResource<LearningRequest[]>("/admin/requests", token, version);
  const tutorsResult = useResource<ManagedAccount[]>("/admin/accounts", token, version);
  const approvedTutors = (tutorsResult?.data ?? []).filter(
    (m) => m.role === "TUTOR" && m.account.tutorProfile?.approvalStatus === "APPROVED"
  );
  if (result?.unauthorized) return <p className="text-sm text-rose-400">Session expired. Sign in again.</p>;
  const requests = result?.data ?? [];
  const active = requests.filter((r) => !["CANCELLED", "ACCEPTED"].includes(r.status));
  const completed = requests.filter((r) => ["CANCELLED", "ACCEPTED"].includes(r.status));
  return <>
    <ErrorText value={action.error || result?.error} />
    {notice && <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-950/40 px-3.5 py-2.5 text-xs font-medium text-emerald-300">{notice}</p>}
    {!result && token && <p role="status" className="text-sm text-neutral-500">Loading requests…</p>}
    {result?.data && !requests.length && (
      <div className={panel}><p className="text-sm text-neutral-400">No learning requests yet. Guardians submit requests from their portal.</p></div>
    )}
    {active.map((req) => (
      <article key={req.id} className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white">{req.program} · {req.level}</h2>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${reqStatusColor[req.status] ?? ""}`}>{req.status}</span>
            </div>
            <p className="mt-0.5 text-xs text-neutral-400">
              Family: {req.guardian?.fullName} · Student: {req.student.fullName} · {req.preferredLang}
              {req.budgetMax ? ` · max $${req.budgetMax}/hr` : ""}
            </p>
            {req.assignedTutor && <p className="mt-0.5 text-xs text-sky-400">Assigned to: {req.assignedTutor.account.fullName}</p>}
          </div>
          <button className={ghostLink} type="button" onClick={() => { setSelected(selected === req.id ? "" : req.id); setNotice(""); }}>
            {selected === req.id ? "Close" : "Assign tutor"}
          </button>
        </div>
        {req.notes && <p className="text-xs text-neutral-500 italic line-clamp-2">{req.notes}</p>}
        {selected === req.id && (
          <form className="space-y-3 border-t border-neutral-800 pt-3" onSubmit={(event) => {
            event.preventDefault();
            const tutorId = (new FormData(event.currentTarget).get("tutorId") as string) || null;
            setNotice("");
            void action.run(async () => {
              await accountRequest(`/admin/requests/${req.id}/assign`, token, "PATCH", { tutorId });
              setNotice(`Request ${tutorId ? "assigned" : "unassigned"} successfully.`);
              setSelected("");
              setVersion((v) => v + 1);
            });
          }}>
            <label className="block text-xs font-bold text-neutral-300">Assign an approved tutor
              <select name="tutorId" className={input} defaultValue={req.assignedTutor?.accountId ?? ""}>
                <option value="">— Unassign / leave unmatched —</option>
                {approvedTutors.map(({ account }) => (
                  <option key={account.id} value={account.id}>
                    {account.fullName}{account.tutorProfile ? ` · ${account.tutorProfile.specialties.slice(0, 2).join(", ")}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button className={button} disabled={action.busy}>Save assignment</button>
          </form>
        )}
      </article>
    ))}
    {completed.length > 0 && (
      <details className={panel}>
        <summary className="cursor-pointer text-xs font-bold text-neutral-500">Completed &amp; Cancelled ({completed.length})</summary>
        <div className="mt-3 space-y-3">
          {completed.map((req) => (
            <div key={req.id} className="border-t border-neutral-800 pt-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-neutral-300">{req.program} · {req.level}</p>
                  <p className="text-xs text-neutral-500">{req.guardian?.fullName} · {req.student.fullName}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${reqStatusColor[req.status] ?? ""}`}>{req.status}</span>
              </div>
            </div>
          ))}
        </div>
      </details>
    )}
  </>;
}
