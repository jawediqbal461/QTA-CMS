import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CheckCircle, Film, Loader2, Plus, Trash2, Users, Video, XCircle } from "lucide-react";
import { accountRequest, request } from "../lib/api";

type Session = { id: string; startsAt: string; durationMinutes: number; status: string };
type ClassRow = {
  id: string; title: string; description: string | null; program: string; level: string; language: string;
  seats: number; seatsLeft: number; durationMinutes: number; status: string; reviewNote: string | null;
  tutor: { accountId: string; account: { fullName: string } };
  sessions?: Session[];
  members?: Array<{ student: { id: string; fullName: string } }>;
  student?: { id: string; fullName: string };
};

const panel = "space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6";
const field = "w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-emerald-500/50";
const primary = "inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-neutral-950 transition disabled:cursor-not-allowed disabled:opacity-50";
const ghost = "text-xs font-bold text-emerald-400 hover:text-emerald-300";
const danger = "text-xs font-bold text-rose-400 hover:text-rose-300";
const statusStyle: Record<string, string> = {
  PENDING: "border-amber-500/30 text-amber-300", PUBLISHED: "border-emerald-500/30 text-emerald-300",
  CANCELLED: "border-neutral-700 text-neutral-500", SCHEDULED: "border-sky-500/30 text-sky-300",
};
const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;
const when = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

function Badge({ status }: { status: string }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle[status] ?? "border-neutral-700 text-neutral-400"}`}>{status}</span>;
}

// A session's classroom is open from 15 minutes before the start until 30 minutes after it ends.
function sessionOpen(session: Session) {
  const start = new Date(session.startsAt).getTime();
  return session.status === "SCHEDULED" && Date.now() >= start - 15 * 60_000 && Date.now() < start + session.durationMinutes * 60_000 + 30 * 60_000;
}

function SessionList({ sessions, onCancel }: { sessions: Session[]; onCancel?: (session: Session) => void }) {
  return (
    <ul className="space-y-1.5">
      {sessions.map((session) => (
        <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 text-neutral-300"><CalendarClock size={12} className="text-neutral-500" />{when(session.startsAt)} · {session.durationMinutes} min <Badge status={session.status} /></span>
          <span className="flex items-center gap-3">
            {sessionOpen(session) && <Link className={ghost} to={`/classroom/class/${session.id}`}><Video size={12} className="mr-1 inline" />Enter classroom</Link>}
            {onCancel && session.status === "SCHEDULED" && new Date(session.startsAt).getTime() > Date.now() && <button className={danger} onClick={() => onCancel(session)}>Cancel session</button>}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── Tutor ───────────────────────────────────────────────────────────────────

export function TutorLiveClasses({ token }: { token: string }) {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    accountRequest<ClassRow[]>("/live-classes/mine", token).then(setClasses, (e: unknown) => setError(message(e, "Failed to load.")));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <form className={panel} onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setBusy(true); setError(""); setOk("");
        try {
          await accountRequest("/live-classes", token, "POST", {
            title: String(data.get("title")), description: String(data.get("description") ?? "") || undefined,
            program: String(data.get("program")), level: String(data.get("level")), language: String(data.get("language")),
            seats: Number(data.get("seats")), durationMinutes: Number(data.get("durationMinutes")), weeks: Number(data.get("weeks")),
            startsAt: new Date(String(data.get("startsAt"))).toISOString(),
          });
          form.reset();
          setOk("Class created. It opens for enrollment once the academy approves it.");
          load();
        } catch (failure) { setError(message(failure, "Could not create the class.")); }
        finally { setBusy(false); }
      }}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Plus size={15} className="text-emerald-400" /> New group class</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-bold text-neutral-300 sm:col-span-2">Title<input className={field} name="title" required minLength={3} maxLength={120} placeholder="Tajweed basics — evening batch" /></label>
          <label className="space-y-1 text-xs font-bold text-neutral-300">Program<input className={field} name="program" required maxLength={80} placeholder="Tajweed" /></label>
          <label className="space-y-1 text-xs font-bold text-neutral-300">Level<input className={field} name="level" required maxLength={80} placeholder="Beginner" /></label>
          <label className="space-y-1 text-xs font-bold text-neutral-300">Language<input className={field} name="language" required maxLength={60} placeholder="English / Urdu" /></label>
          <label className="space-y-1 text-xs font-bold text-neutral-300">Seats (2–30)<input className={field} name="seats" type="number" min={2} max={30} defaultValue={8} required /></label>
          <label className="space-y-1 text-xs font-bold text-neutral-300">Length (minutes)<input className={field} name="durationMinutes" type="number" min={20} max={120} defaultValue={45} required /></label>
          <label className="space-y-1 text-xs font-bold text-neutral-300">Number of weekly sessions<input className={field} name="weeks" type="number" min={1} max={26} defaultValue={8} required /></label>
          <label className="space-y-1 text-xs font-bold text-neutral-300 sm:col-span-2">First session (your device's time zone)<input className={field} name="startsAt" type="datetime-local" required /></label>
          <label className="space-y-1 text-xs font-bold text-neutral-300 sm:col-span-2">Description<textarea className={field} name="description" rows={2} maxLength={1000} /></label>
        </div>
        <p className="text-[11px] text-neutral-500">Sessions repeat weekly at the same time. The class must be approved by the academy before learners can join.</p>
        {error && <p role="alert" className="rounded-xl border border-rose-500/25 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">{error}</p>}
        {ok && <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300">{ok}</p>}
        <button className={primary} disabled={busy}>{busy ? "Creating…" : "Create class"}</button>
      </form>

      <section className={panel}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Users size={15} className="text-emerald-400" /> My group classes</h2>
        {!classes && !error && <p role="status" className="text-sm text-neutral-500">Loading…</p>}
        {classes?.length === 0 && <p className="text-sm text-neutral-400">No group classes yet.</p>}
        {classes?.map((liveClass) => (
          <article key={liveClass.id} className="space-y-3 border-t border-neutral-800 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{liveClass.title}</p>
                <p className="text-xs text-neutral-400">{liveClass.program} · {liveClass.level} · {liveClass.language} · {liveClass.seats - liveClass.seatsLeft}/{liveClass.seats} seats filled</p>
              </div>
              <Badge status={liveClass.status} />
            </div>
            {liveClass.reviewNote && <p className="text-xs text-amber-300">Academy note: {liveClass.reviewNote}</p>}
            {liveClass.members && liveClass.members.length > 0 && (
              <p className="text-xs text-neutral-400">Learners: {liveClass.members.map((member) => member.student.fullName).join(", ")}</p>
            )}
            {liveClass.sessions && (
              <SessionList sessions={liveClass.sessions} onCancel={async (session) => {
                if (!window.confirm("Cancel this session?")) return;
                try { await accountRequest(`/live-classes/${liveClass.id}/sessions/${session.id}/cancel`, token, "PATCH"); load(); }
                catch (failure) { setError(message(failure, "Could not cancel.")); }
              }} />
            )}
            {liveClass.status !== "CANCELLED" && (
              <button className={danger} onClick={async () => {
                if (!window.confirm("Cancel the whole class and all upcoming sessions?")) return;
                try { await accountRequest(`/live-classes/${liveClass.id}/cancel`, token, "PATCH"); load(); }
                catch (failure) { setError(message(failure, "Could not cancel.")); }
              }}>Cancel entire class</button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

// ─── Students and guardians ──────────────────────────────────────────────────

export function LearnerLiveClasses({ token, role }: { token: string; role: "GUARDIAN" | "STUDENT" }) {
  const [open, setOpen] = useState<ClassRow[] | null>(null);
  const [mine, setMine] = useState<ClassRow[] | null>(null);
  const [students, setStudents] = useState<Array<{ id: string; fullName: string }>>([]);
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    request<ClassRow[]>("/live-classes").then(setOpen, () => setOpen([]));
    accountRequest<ClassRow[]>("/live-classes/my", token).then(setMine, (e: unknown) => setError(message(e, "Failed to load.")));
  }, [token]);
  useEffect(() => {
    load();
    accountRequest<Array<{ id: string; fullName: string }>>("/guardian/students", token).then((list) => { setStudents(list); if (list.length === 1) setStudentId(list[0].id); }).catch(() => undefined);
  }, [load, token]);

  const joinedKeys = new Set((mine ?? []).map((entry) => `${entry.id}:${entry.student?.id}`));

  return (
    <div className="space-y-4">
      <section className={panel}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Video size={15} className="text-emerald-400" /> My group classes</h2>
        {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
        {!mine && !error && <p role="status" className="text-sm text-neutral-500">Loading…</p>}
        {mine?.length === 0 && <p className="text-sm text-neutral-400">You have not joined a group class yet. Choose one below.</p>}
        {mine?.map((liveClass) => (
          <article key={`${liveClass.id}:${liveClass.student?.id}`} className="space-y-2 border-t border-neutral-800 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{liveClass.title}</p>
                <p className="text-xs text-neutral-400">{liveClass.student?.fullName} · with {liveClass.tutor.account.fullName} · {liveClass.program} · {liveClass.level}</p>
              </div>
              <Badge status={liveClass.status} />
            </div>
            {liveClass.sessions && liveClass.sessions.length > 0 ? <SessionList sessions={liveClass.sessions} /> : <p className="text-xs text-neutral-500">No upcoming sessions.</p>}
            <button className={danger} onClick={async () => {
              if (!window.confirm("Leave this class?")) return;
              try { await accountRequest(`/live-classes/${liveClass.id}/members/${liveClass.student?.id}`, token, "DELETE"); load(); }
              catch (failure) { setError(message(failure, "Could not leave.")); }
            }}>Leave class</button>
          </article>
        ))}
      </section>

      <section className={panel}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Users size={15} className="text-emerald-400" /> Open group classes</h2>
        {role === "GUARDIAN" && (
          <label className="block text-xs font-bold text-neutral-300">Learner to enroll
            <select className={`${field} mt-1`} value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              <option value="">Choose a learner</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}
            </select>
          </label>
        )}
        {!open && <p role="status" className="text-sm text-neutral-500">Loading…</p>}
        {open?.length === 0 && <p className="text-sm text-neutral-400">No group classes are open for enrollment right now.</p>}
        {open?.map((liveClass) => {
          const already = !!studentId && joinedKeys.has(`${liveClass.id}:${studentId}`);
          return (
            <article key={liveClass.id} className="space-y-2 border-t border-neutral-800 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{liveClass.title}</p>
                  <p className="text-xs text-neutral-400">with {liveClass.tutor.account.fullName} · {liveClass.program} · {liveClass.level} · {liveClass.language} · {liveClass.durationMinutes} min</p>
                  {liveClass.description && <p className="mt-1 text-xs text-neutral-500">{liveClass.description}</p>}
                </div>
                <span className="text-[11px] font-bold text-neutral-300">{liveClass.seatsLeft} of {liveClass.seats} seats left</span>
              </div>
              {liveClass.sessions && <p className="text-[11px] text-neutral-500">Next: {liveClass.sessions.slice(0, 3).map((session) => when(session.startsAt)).join(" · ")}</p>}
              <button className={primary} disabled={busyId === liveClass.id || !studentId || already || liveClass.seatsLeft === 0} onClick={async () => {
                setBusyId(liveClass.id); setError("");
                try { await accountRequest(`/live-classes/${liveClass.id}/join`, token, "POST", { studentId }); load(); }
                catch (failure) { setError(message(failure, "Could not join.")); }
                finally { setBusyId(null); }
              }}>{already ? "Already joined" : liveClass.seatsLeft === 0 ? "Full" : "Join this class"}</button>
            </article>
          );
        })}
      </section>
    </div>
  );
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function LiveClassesAdminPanel({ token }: { token: string }) {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(() => {
    accountRequest<ClassRow[]>("/live-classes/admin/all", token).then(setClasses, (e: unknown) => setError(message(e, "Failed to load.")));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: "PUBLISHED" | "PENDING" | "CANCELLED") {
    const reviewNote = status === "PUBLISHED" ? undefined : window.prompt("Optional note for the tutor:") ?? undefined;
    setBusyId(id); setError("");
    try { await accountRequest(`/live-classes/admin/${id}`, token, "PATCH", { status, reviewNote }); load(); }
    catch (failure) { setError(message(failure, "Action failed.")); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center space-x-2 text-base font-bold text-white"><Users size={16} className="text-amber-400" /><span>Group Classes</span></h2>
        <p className="mt-0.5 text-xs text-neutral-500">Approve tutor-created classes so families can enroll. Cancelling a class cancels its upcoming sessions.</p>
      </div>
      {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
      {!classes && !error && <div className="flex justify-center py-10 text-neutral-500"><Loader2 size={18} className="animate-spin" /></div>}
      {classes?.length === 0 && <p className="py-10 text-center text-xs text-neutral-500">No group classes yet.</p>}
      {classes?.map((liveClass) => (
        <div key={liveClass.id} className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{liveClass.title}</p>
              <p className="text-xs text-neutral-500">{liveClass.tutor.account.fullName} · {liveClass.program} · {liveClass.level} · {liveClass.language} · {liveClass.durationMinutes} min · {liveClass.seats - liveClass.seatsLeft}/{liveClass.seats} seats</p>
              {liveClass.description && <p className="mt-1 text-xs text-neutral-400">{liveClass.description}</p>}
            </div>
            <Badge status={liveClass.status} />
          </div>
          {liveClass.sessions && <p className="text-[11px] text-neutral-500">{liveClass.sessions.filter((s) => s.status === "SCHEDULED").length} upcoming of {liveClass.sessions.length} sessions · first {liveClass.sessions[0] ? when(liveClass.sessions[0].startsAt) : "—"}</p>}
          {liveClass.members && liveClass.members.length > 0 && <p className="text-xs text-neutral-400">Learners: {liveClass.members.map((member) => member.student.fullName).join(", ")}</p>}
          <div className="flex flex-wrap gap-2">
            {liveClass.status !== "PUBLISHED" && liveClass.status !== "CANCELLED" && (
              <button disabled={busyId === liveClass.id} onClick={() => void setStatus(liveClass.id, "PUBLISHED")} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"><CheckCircle size={11} />Approve & publish</button>
            )}
            {liveClass.status === "PUBLISHED" && (
              <button disabled={busyId === liveClass.id} onClick={() => void setStatus(liveClass.id, "PENDING")} className="rounded-xl bg-neutral-800 px-3 py-1.5 text-[11px] font-bold text-neutral-300 hover:bg-neutral-700 disabled:opacity-50">Unpublish</button>
            )}
            {liveClass.status !== "CANCELLED" && (
              <button disabled={busyId === liveClass.id} onClick={() => void setStatus(liveClass.id, "CANCELLED")} className="flex items-center gap-1.5 rounded-xl bg-neutral-800 px-3 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-neutral-700 disabled:opacity-50"><XCircle size={11} />Cancel class</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Recordings (all roles) ──────────────────────────────────────────────────

type RecordingRow = { id: string; title: string; roomKey: string; sizeBytes: number; durationSec: number; status: string; createdAt: string };

export function RecordingsPanel({ token, canDelete }: { token: string; canDelete: boolean }) {
  const [items, setItems] = useState<RecordingRow[] | null>(null);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState<{ id: string; url: string } | null>(null);
  const load = useCallback(() => {
    accountRequest<RecordingRow[]>("/live/recordings", token).then(setItems, (e: unknown) => setError(message(e, "Failed to load.")));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  return (
    <section className={panel}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Film size={15} className="text-emerald-400" /> Class recordings</h2>
      <p className="text-xs text-neutral-400">Recordings are made by the teacher with everyone's knowledge and are visible only to the academy, the teacher, and the learners' families.</p>
      {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
      {!items && !error && <p role="status" className="text-sm text-neutral-500">Loading…</p>}
      {items?.length === 0 && <p className="text-sm text-neutral-400">No recordings yet.</p>}
      {items?.map((item) => (
        <article key={item.id} className="space-y-2 border-t border-neutral-800 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="text-[11px] text-neutral-500">{when(item.createdAt)} · {Math.round(item.durationSec / 60)} min · {(item.sizeBytes / 1_000_000).toFixed(1)} MB · {item.status}</p>
            </div>
            <span className="flex items-center gap-3">
              <button className={ghost} onClick={async () => {
                try { const { url } = await accountRequest<{ url: string }>(`/live/recordings/${item.id}/url`, token); setPlaying({ id: item.id, url }); }
                catch (failure) { setError(message(failure, "Could not open the recording.")); }
              }}>Watch</button>
              {canDelete && <button className={danger} onClick={async () => {
                if (!window.confirm("Delete this recording permanently?")) return;
                try { await accountRequest(`/live/recordings/${item.id}`, token, "DELETE"); setPlaying(null); load(); }
                catch (failure) { setError(message(failure, "Could not delete.")); }
              }}><Trash2 size={12} className="mr-1 inline" />Delete</button>}
            </span>
          </div>
          {playing?.id === item.id && <video src={playing.url} controls autoPlay className="w-full rounded-xl border border-neutral-800 bg-black" />}
        </article>
      ))}
    </section>
  );
}
