import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle, GraduationCap, Loader2, RefreshCw, XCircle } from "lucide-react";
import { accountRequest } from "../lib/api";
import { getStoredSession } from "../lib/session";

type EnrollmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
const ENROLL_STYLES: Record<EnrollmentStatus, string> = {
  PENDING: "bg-amber-900/40 text-amber-300 border-amber-500/30",
  CONFIRMED: "bg-emerald-900/40 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-neutral-800 text-neutral-500 border-neutral-700",
};

function EnrollBadge({ status }: { status: EnrollmentStatus }) {
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ENROLL_STYLES[status]}`}>{status}</span>;
}

const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function EnrollBox({ course }: { course: { id: string; title: string } }) {
  const [session] = useState(() => getStoredSession(["guardian", "student"]));
  const [students, setStudents] = useState<Array<{ id: string; fullName: string }>>([]);
  const [studentId, setStudentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    accountRequest<Array<{ id: string; fullName: string }>>("/guardian/students", session.token)
      .then((list) => { setStudents(list); if (list.length === 1) setStudentId(list[0].id); })
      .catch(() => {});
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        <span>To enroll, sign in or register:</span>
        <Link to="/login/guardian" className="font-bold text-sky-400 hover:text-sky-300">Guardian sign in</Link>
        <span>·</span>
        <Link to="/login/student" className="font-bold text-sky-400 hover:text-sky-300">Student sign in</Link>
        <span>·</span>
        <Link to="/signup/guardian" className="font-bold text-sky-400 hover:text-sky-300">Create an account</Link>
      </div>
    );
  }
  if (done) return <p role="status" className="text-xs font-bold text-emerald-400">Enrollment requested. The academy will confirm it — track it under Enrollments in your desk.</p>;

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={async (event) => {
      event.preventDefault();
      setBusy(true); setError("");
      try {
        await accountRequest("/guardian/enrollments", session.token, "POST", { courseId: course.id, studentId });
        setDone(true);
      } catch (failure) {
        setError(message(failure, "Could not enroll."));
      } finally { setBusy(false); }
    }}>
      {session.role === "guardian" && (
        <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Learner
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required
            className="mt-1 block rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs normal-case tracking-normal text-white">
            <option value="">Choose a learner</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}
          </select>
        </label>
      )}
      <button disabled={busy || !studentId}
        className="inline-flex items-center space-x-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-neutral-950 transition hover:bg-sky-400 disabled:opacity-50">
        <span>{busy ? "Enrolling…" : "Enroll in this course"}</span>
        <ArrowRight size={12} />
      </button>
      {session.role === "guardian" && students.length === 0 && (
        <p className="w-full text-[11px] text-neutral-500">Add a learner first from the Lessons tab of your guardian desk.</p>
      )}
      {error && <p role="alert" className="w-full text-xs text-rose-400">{error}</p>}
    </form>
  );
}

type DeskEnrollment = {
  id: string; status: EnrollmentStatus; createdAt: string;
  course: { id: string; title: string; program: string; level: string; priceAmount: string | null; priceCurrency: string; tutor: { account: { fullName: string } } };
  student: { id: string; fullName: string };
};

export function EnrollmentsPanel({ token }: { token: string }) {
  const [items, setItems] = useState<DeskEnrollment[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    accountRequest<DeskEnrollment[]>("/guardian/enrollments", token).then(setItems, (e: unknown) => setError(message(e, "Failed to load.")));
  }, [token]);
  useEffect(() => { load(); }, [load]);
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-white"><GraduationCap size={15} className="text-sky-400" /> Course enrollments</h2>
      <p className="text-xs text-neutral-400">Enroll from the <Link to="/courses" className="font-bold text-sky-400">Courses</Link> page. The academy confirms each request.</p>
      {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
      {!items && !error && <p role="status" className="text-sm text-neutral-500">Loading…</p>}
      {items?.length === 0 && <p className="text-sm text-neutral-400">No enrollments yet.</p>}
      {items?.map((item) => (
        <article key={item.id} className="space-y-1 border-t border-neutral-800 pt-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-white">{item.course.title}</p>
              <p className="text-xs text-neutral-400">{item.student.fullName} · {item.course.program} · {item.course.level} · by {item.course.tutor.account.fullName}</p>
            </div>
            <EnrollBadge status={item.status} />
          </div>
          {item.status !== "CANCELLED" && (
            <button className="text-xs font-bold text-rose-400 hover:text-rose-300" onClick={async () => {
              if (!window.confirm("Cancel this enrollment?")) return;
              try { await accountRequest(`/guardian/enrollments/${item.id}/cancel`, token, "PATCH"); load(); }
              catch (e: unknown) { setError(message(e, "Could not cancel.")); }
            }}>Cancel enrollment</button>
          )}
        </article>
      ))}
    </section>
  );
}

type AdminEnrollment = DeskEnrollment & { enrolledBy: { id: string; fullName: string; email: string } };

export function EnrollmentsAdminPanel({ token }: { token: string }) {
  const [items, setItems] = useState<AdminEnrollment[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(() => {
    accountRequest<AdminEnrollment[]>("/admin/enrollments", token).then(setItems, (e: unknown) => setError(message(e, "Failed to load.")));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function act(id: string, status: "CONFIRMED" | "CANCELLED") {
    setBusyId(id); setError("");
    try { await accountRequest(`/admin/enrollments/${id}`, token, "PATCH", { status }); load(); }
    catch (e: unknown) { setError(message(e, "Action failed.")); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center space-x-2 text-base font-bold text-white"><GraduationCap size={16} className="text-amber-400" /><span>Course Enrollments</span></h2>
          <p className="mt-0.5 text-xs text-neutral-500">Requests from guardians and students. Confirming notifies the family.</p>
        </div>
        <button onClick={load} className="rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 transition hover:text-white"><RefreshCw size={13} /></button>
      </div>
      {error && <p role="alert" className="flex items-center space-x-2 text-xs text-rose-400"><AlertCircle size={14} /><span>{error}</span></p>}
      {!items && !error && <div className="flex justify-center py-12 text-neutral-500"><Loader2 size={18} className="mr-2 animate-spin" /><span className="text-xs">Loading…</span></div>}
      {items?.length === 0 && <p className="py-12 text-center text-xs text-neutral-500">No enrollments yet.</p>}
      {items?.map((item) => (
        <div key={item.id} className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="font-semibold text-white">{item.course.title}</p>
              <p className="text-xs text-neutral-500">
                Learner: {item.student.fullName} · Requested by {item.enrolledBy.fullName} ({item.enrolledBy.email}) · Tutor: {item.course.tutor.account.fullName}
              </p>
              <p className="text-[11px] text-neutral-600">
                {new Date(item.createdAt).toLocaleString()}
                {item.course.priceAmount ? ` · ${item.course.priceCurrency} ${Number(item.course.priceAmount).toFixed(2)}` : ""}
              </p>
            </div>
            <EnrollBadge status={item.status} />
          </div>
          <div className="flex gap-2">
            {item.status === "PENDING" && (
              <button onClick={() => act(item.id, "CONFIRMED")} disabled={busyId === item.id}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
                <CheckCircle size={11} /><span>Confirm</span>
              </button>
            )}
            {item.status !== "CANCELLED" && (
              <button onClick={() => act(item.id, "CANCELLED")} disabled={busyId === item.id}
                className="flex items-center space-x-1.5 rounded-xl bg-neutral-800 px-3 py-1.5 text-[11px] font-bold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-50">
                <XCircle size={11} /><span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

type TutorEnrollment = { id: string; status: EnrollmentStatus; createdAt: string; course: { id: string; title: string }; student: { fullName: string } };

export function TutorEnrollments({ token }: { token: string }) {
  const [items, setItems] = useState<TutorEnrollment[]>([]);
  useEffect(() => {
    accountRequest<TutorEnrollment[]>("/courses/tutor/enrollments", token).then(setItems).catch(() => {});
  }, [token]);
  if (items.length === 0) return null;
  return (
    <div className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
      <h3 className="text-xs font-bold text-white">Learners enrolled in your courses</h3>
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-neutral-300">{item.student.fullName} <span className="text-neutral-500">— {item.course.title}</span></span>
          <EnrollBadge status={item.status} />
        </div>
      ))}
    </div>
  );
}
