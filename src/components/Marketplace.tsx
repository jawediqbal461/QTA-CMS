import { createElement, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, GraduationCap, LogIn, UserPlus, Users } from "lucide-react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { accountRequest, ApiError, getStoredAdminToken, request } from "../lib/api";
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
type Profile = Tutor & {
  approvalStatus: Approval; qualifications: string | null; updatedAt: string;
  account: { fullName: string; timeZone: string; email?: string }; availabilitySlots: Slot[];
};
type Student = { id: string; fullName: string };
type Booking = {
  id: string; tutorId: string; scheduledAtUtc: string; durationMinutes: number; status: string;
  student: { fullName: string }; tutor?: { account: { fullName: string } };
  lessonSession?: { endedAt: string | null; tutorNotes: string | null } | null;
  progressEntry?: {
    currentBook: string; currentChapter: string; currentVerse: number | null;
    tajweedScore: number | null; hifzPercent: string | null;
  } | null;
};

const panel = "space-y-4 rounded-xl border border-neutral-700 p-5";
const button = "rounded bg-emerald-400 px-3 py-2 font-semibold text-neutral-950 disabled:opacity-50";
const input = "block w-full rounded border border-neutral-600 bg-neutral-900 p-2 text-white";
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const localTime = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
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
  return value ? <p role="alert" className="text-red-300">{value}</p> : null;
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mx-auto max-w-5xl space-y-5 px-4 py-10">
    <h1 className="text-3xl font-bold text-white">{title}</h1>
    {children}
  </section>;
}

function TutorCard({ tutor, detail = false }: { tutor: Tutor; detail?: boolean }) {
  return <article className={panel}>
    {!detail && <Link className="text-xl font-semibold text-emerald-300" to={`/tutors/${tutor.accountId}`}>{tutor.account.fullName}</Link>}
    <p>{tutor.specialties.join(", ")} · {tutor.languages.join(", ")}</p>
    <p>{tutor.experienceYears} years of experience · USD {tutor.hourlyRate} per hour</p>
    <p className={detail ? "whitespace-pre-wrap" : "line-clamp-3"}>{tutor.bio}</p>
    <Link className="inline-block text-emerald-300 underline" to={`/student?tutor=${tutor.accountId}`}>Book a lesson</Link>
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
    <Link className="text-emerald-300 underline" to="/tutors">View tutor directory</Link>
  </div>;
}

export function PublicTutors() {
  const { slug } = useParams();
  const tutors = useResource<Tutor[]>("/tutors");
  const tutor = tutors?.data?.find((entry) => entry.accountId === slug);
  const [query, setQuery] = useState("");
  const title = slug ? tutor?.account.fullName ?? "Tutor profile" : "Find a Quran tutor";
  useSEO({ title, description: tutor?.bio ?? undefined, noindex: !!slug && !tutor });
  const matching = tutors?.data?.filter((entry) =>
    [entry.account.fullName, ...entry.languages, ...entry.specialties].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  return <Page title={title}>
    <ErrorText value={tutors?.error} />
    {!tutors && <p role="status">Loading tutors…</p>}
    {slug ? (
      <>
        <Link className="text-emerald-300 underline" to="/tutors">All tutors</Link>
        {tutor ? <TutorCard tutor={tutor} detail /> : tutors?.data && <p>This tutor is not listed.</p>}
      </>
    ) : (
      <>
        <label className="block max-w-md">Search by name, language, or subject
          <input className={input} type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {matching?.length === 0 && <p>No approved tutors match this search.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {matching?.map((entry) => createElement(TutorCard, { key: entry.accountId, tutor: entry }))}
        </div>
      </>
    )}
  </Page>;
}

function profileData(form: FormData) {
  const list = (name: string) => String(form.get(name)).split(",").map((item) => item.trim()).filter(Boolean);
  return {
    bio: String(form.get("bio")), qualifications: String(form.get("qualifications")),
    specialties: list("specialties"), languages: list("languages"),
    experienceYears: Number(form.get("experienceYears")), hourlyRate: Number(form.get("hourlyRate")),
  };
}

function ProfileFields({ profile }: { profile?: Profile }) {
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
  const [params] = useSearchParams();
  const paths = accountPaths[role];
  const query = params.toString() ? `?${params.toString()}` : "";
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
      const result = await request<{ token: string; account: { role: string } }>(
        register ? `/auth/register/${role.toLowerCase()}` : "/auth/login",
        { method: "POST", body: JSON.stringify(payload) },
      );
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
      {role !== "TUTOR" && <Link className="text-emerald-300 underline" to={accountPaths[role === "STUDENT" ? "GUARDIAN" : "STUDENT"].login + query}>
        {role === "STUDENT" ? "Sign in as a guardian" : "Sign in as a student"}
      </Link>}
      {register && role === "STUDENT" && <Link className="text-emerald-300 underline" to={accountPaths.GUARDIAN.signup + query}>Register as a guardian</Link>}
    </div>
  </form>;
}

export function AccountPortal({ role, register = false, login = false }: { role: Role; register?: boolean; login?: boolean }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const storageKey = `qta_session_${role.toLowerCase()}`;
  const [token, setToken] = useState(() => sessionStorage.getItem(storageKey) ?? "");
  const paths = accountPaths[role];
  const query = params.toString() ? `?${params.toString()}` : "";
  const session = useResource<{ role: string }>(!register && !login && token ? "/auth/me" : null, token);
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
  return <Page title={title}>
    <button className="text-emerald-300 underline" onClick={signOut}>Sign out</button>
    <ErrorText value={session?.error} />
    {!session && <p role="status">Checking session…</p>}
    {session?.data && (role === "TUTOR" ? <TutorWorkspace token={token} /> : <GuardianWorkspace token={token} role={role} preferredTutor={params.get("tutor") ?? ""} />)}
  </Page>;
}

function LessonDetails({ booking }: { booking: Booking }) {
  const progress = booking.progressEntry;
  return <div className="space-y-2">
    <p>{booking.student.fullName}{booking.tutor ? ` with ${booking.tutor.account.fullName}` : ""}
      {" · "}{localTime(booking.scheduledAtUtc)} · {booking.durationMinutes} min · {booking.status.replaceAll("_", " ")}</p>
    {booking.lessonSession?.tutorNotes && <p className="whitespace-pre-wrap">Tutor notes: {booking.lessonSession.tutorNotes}</p>}
    {progress && <p>
      Progress: {progress.currentBook} · {progress.currentChapter}
      {progress.currentVerse != null && ` · Ayah ${progress.currentVerse}`}
      {progress.tajweedScore != null && ` · Tajweed ${progress.tajweedScore}%`}
      {progress.hifzPercent != null && ` · Hifz ${progress.hifzPercent}%`}
    </p>}
  </div>;
}

function LessonActions({ booking, token, role, refresh }: {
  booking: Booking; token: string; role: Role; refresh?: () => void;
}) {
  const join = useAction();
  const saveLink = useAction();
  const outcome = useAction();
  const [status, setStatus] = useState("COMPLETED");
  const [message, setMessage] = useState("");
  const path = `/${role === "TUTOR" ? "tutor" : "guardian"}/bookings/${booking.id}`;
  if (!["BOOKED", "RESCHEDULED"].includes(booking.status)) return null;
  return <div className="space-y-3">
    <button className={button} type="button" disabled={join.busy} onClick={() => {
      void join.run(async () => {
        const { url } = await accountRequest<{ url: string }>(`${path}/meeting`, token);
        if (new URL(url).protocol !== "https:") throw new Error("Invalid meeting link.");
        window.location.assign(url);
      });
    }}>Join lesson</button>
    <p className="text-sm text-neutral-400">Meeting access opens 10 minutes before class.</p>
    <ErrorText value={join.error} />
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

function TutorWorkspace({ token }: { token: string }) {
  const [version, setVersion] = useState(0);
  const profile = useResource<Profile>("/tutor/profile", token, version);
  const bookings = useResource<Booking[]>("/tutor/bookings", token, version);
  return <>
    <ErrorText value={profile?.error ?? bookings?.error} />
    {!profile && <p role="status">Loading profile…</p>}
    {profile?.data && createElement(TutorEditor, {
      key: profile.data.updatedAt, profile: profile.data, token,
      refresh: () => setVersion((value) => value + 1),
    })}
    <section className={panel}>
      <h2 className="text-xl font-semibold">Your lessons</h2>
      {bookings?.data?.length === 0 && <p>No lessons booked yet.</p>}
      {bookings?.data?.map((booking) => <article className={panel} key={booking.id}>
        <LessonDetails booking={booking} />
        <LessonActions booking={booking} token={token} role="TUTOR" refresh={() => setVersion((value) => value + 1)} />
      </article>)}
    </section>
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
      <h2 className="text-xl font-semibold">{profile.account.fullName} · {profile.approvalStatus}</h2>
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
      <h2 className="text-xl font-semibold">Weekly availability</h2>
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
          <button type="button" className="text-emerald-300 underline" onClick={() => setSlots(slots.filter((_, i) => i !== index))}>Remove window</button>
        </div>
      ))}
      <ErrorText value={availabilityAction.error} />
      <div className="flex gap-4">
        <button type="button" className="text-emerald-300 underline" disabled={suspended || slots.length >= 42} onClick={() => setSlots([...slots, { weekday: 1, startTime: "09:00", endTime: "12:00" }])}>Add window</button>
        <button className={button} disabled={suspended || availabilityAction.busy}>Save availability</button>
      </div>
    </form>
  </>;
}

function GuardianWorkspace({ token, role, preferredTutor }: { token: string; role: "GUARDIAN" | "STUDENT"; preferredTutor: string }) {
  const [version, setVersion] = useState(0);
  const [tutorId, setTutorId] = useState(preferredTutor);
  const [reschedule, setReschedule] = useState<Booking>();
  const [attempt, setAttempt] = useState<{ key: string; id: string }>();
  const students = useResource<Student[]>("/guardian/students", token, version);
  const tutors = useResource<Tutor[]>("/tutors", undefined, version);
  const bookings = useResource<Booking[]>("/guardian/bookings", token, version);
  const selectedTutor = reschedule?.tutorId ?? tutorId;
  const slotsPath = reschedule ? `/guardian/bookings/${reschedule.id}/slots` : tutorId ? `/tutors/${tutorId}/slots` : null;
  const slots = useResource<string[]>(slotsPath, reschedule ? token : undefined, version);
  const learnerAction = useAction();
  const bookingAction = useAction();
  const refresh = () => setVersion((value) => value + 1);

  return <>
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
      <h2 className="text-xl font-semibold">Learners</h2>
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
      <h2 className="text-xl font-semibold">{reschedule ? "Reschedule lesson" : "Book a 45-minute lesson"}</h2>
      {reschedule ? (
        <p>{reschedule.student.fullName} · {reschedule.tutor?.account.fullName}</p>
      ) : (
        <>
          {role === "GUARDIAN" && <label className="block">Learner<select className={input} name="studentId" required defaultValue="">
            <option value="">Choose a learner</option>
            {students?.data?.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}
          </select></label>}
          <label className="block">Tutor<select className={input} value={tutorId} onChange={(event) => setTutorId(event.target.value)} required>
            <option value="">Choose a tutor</option>
            {tutors?.data?.map((tutor) => <option key={tutor.accountId} value={tutor.accountId}>{tutor.account.fullName}</option>)}
          </select></label>
        </>
      )}
      <label className="block">Available times ({Intl.DateTimeFormat().resolvedOptions().timeZone})
        <select key={selectedTutor} className={input} name="scheduledAtUtc" defaultValue="" required>
          <option value="">{slots?.data?.length ? "Choose a time" : "No times shown"}</option>
          {slots?.data?.map((slot) => <option key={slot} value={slot}>{localTime(slot)}</option>)}
        </select>
      </label>
      <ErrorText value={bookingAction.error ?? slots?.error ?? tutors?.error ?? students?.error} />
      <div className="flex gap-4">
        <button className={button} disabled={bookingAction.busy || !slots?.data?.length || (!reschedule && !students?.data?.length)}>{reschedule ? "Save new time" : "Confirm booking"}</button>
        {reschedule && <button type="button" className="text-emerald-300 underline" onClick={() => setReschedule(undefined)}>Keep original time</button>}
      </div>
    </form>
    <section className={panel}>
      <h2 className="text-xl font-semibold">Your lessons</h2>
      <ErrorText value={bookings?.error} />
      {bookings?.data?.length === 0 && <p>No lessons booked yet.</p>}
      {bookings?.data?.map((booking) => (
        <div className="space-y-2 border-t border-neutral-700 pt-3" key={booking.id}>
          <LessonDetails booking={booking} />
          <LessonActions booking={booking} token={token} role={role} />
          {["BOOKED", "RESCHEDULED"].includes(booking.status) && new Date(booking.scheduledAtUtc).getTime() > Date.now() && (
            <div className="flex gap-4">
              <button className="text-emerald-300 underline" disabled={bookingAction.busy} onClick={() => setReschedule(booking)}>Reschedule</button>
              <button className="text-red-300 underline" disabled={bookingAction.busy} onClick={() => {
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
  </>;
}

export function AcademyOperations() {
  const token = getStoredAdminToken();
  const [version, setVersion] = useState(0);
  const action = useAction();
  const operations = useResource<{
    missed: Booking[];
    audit: Array<{ id: string; action: string; targetType: string; targetId: string | null; createdAt: string;
      actor: { fullName: string } | null; resolution: { status: string; reason: string } | null }>;
  }>(token ? "/admin/operations" : null, token ?? undefined, version);
  useSEO({ title: "Academy operations", noindex: true });
  if (!token || operations?.unauthorized) return <Page title="Academy operations">
    <Link to="/admin">Sign in as an administrator</Link>
  </Page>;
  return <Page title="Academy operations">
    <div className="flex gap-4">
      <Link className="text-emerald-300 underline" to="/admin">Admin CMS</Link>
      <button className="text-emerald-300 underline" onClick={() => setVersion((value) => value + 1)}>Refresh queue</button>
    </div>
    <ErrorText value={action.error ?? operations?.error} />
    {!operations && <p role="status">Loading operations…</p>}
    {operations?.data && <>
      <section className={panel}>
        <h2 className="text-xl font-semibold">Unresolved past lessons</h2>
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
        <h2 className="text-xl font-semibold">Recent audit activity</h2>
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
  </Page>;
}

export function TutorReview() {
  const token = getStoredAdminToken();
  const [version, setVersion] = useState(0);
  const tutors = useResource<Profile[]>(token ? "/admin/tutors" : null, token ?? undefined, version);
  const action = useAction();
  useSEO({ title: "Tutor review", noindex: true });
  if (!token || tutors?.unauthorized) return <Page title="Tutor review"><Link to="/admin">Sign in as an administrator</Link></Page>;
  return <Page title="Tutor review">
    <Link className="text-emerald-300 underline" to="/admin">Admin CMS</Link>
    <ErrorText value={action.error ?? tutors?.error} />
    {!tutors && <p role="status">Loading applications…</p>}
    {tutors?.data?.length === 0 && <p>No tutor applications yet.</p>}
    {tutors?.data?.map((tutor) => <article className={panel} key={tutor.accountId}>
      <h2 className="text-xl font-semibold">{tutor.account.fullName} · {tutor.approvalStatus}</h2>
      <p>{tutor.account.email}</p>
      <p>{tutor.specialties.join(", ")} · {tutor.languages.join(", ")} · {tutor.experienceYears} years · USD {tutor.hourlyRate}/hour</p>
      <p className="whitespace-pre-wrap">{tutor.bio}</p>
      <p className="whitespace-pre-wrap">Qualifications: {tutor.qualifications || "None supplied"}</p>
      <div className="flex flex-wrap gap-3">
        {([["Approve", "APPROVED"], ["Reject", "REJECTED"], ["Suspend", "SUSPENDED"]] as const).map(([label, status]) => (
          <button className={button} key={status} disabled={action.busy || tutor.approvalStatus === status} onClick={() => {
            void action.run(async () => {
              try {
                await accountRequest(`/admin/tutors/${tutor.accountId}`, token, "PATCH", { status, updatedAt: tutor.updatedAt });
              } finally { setVersion((value) => value + 1); }
            });
          }}>{label}</button>
        ))}
      </div>
    </article>)}
  </Page>;
}
