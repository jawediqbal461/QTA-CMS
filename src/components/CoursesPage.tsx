import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, ChevronDown, ChevronUp, GraduationCap, Clock, Globe,
  CheckCircle, AlertCircle, Loader2, Plus, Trash2, Edit2, ArrowRight,
  RefreshCw, Send, Eye, EyeOff, XCircle,
} from "lucide-react";
import { request, accountRequest } from "../lib/api";
import { useSEO } from "../hooks/useSEO";

// ─── Types ───────────────────────────────────────────────────────────────────

type CourseStatus = "DRAFT" | "PENDING_REVIEW" | "CHANGES_REQUESTED" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";

interface CourseModule { id: string; position: number; title: string; description: string | null; }

interface PublicCourse {
  id: string; title: string; description: string | null;
  program: string; level: string; language: string; format: string;
  durationWeeks: number | null; outcomes: string | null;
  priceAmount: string | null; priceCurrency: string;
  publishedAt: string | null;
  tutor: { account: { fullName: string } };
  modules: CourseModule[];
}

interface AdminCourse extends PublicCourse {
  tutorId: string; prerequisites: string | null;
  status: CourseStatus; reviewNote: string | null; updatedAt: string;
  tutor: { account: { fullName: string; email: string } };
  reviewedBy: { fullName: string } | null;
}

interface TutorCourse {
  id: string; title: string; description: string | null;
  program: string; level: string; language: string; format: string;
  durationWeeks: number | null; prerequisites: string | null; outcomes: string | null;
  priceAmount: string | null; priceCurrency: string;
  status: CourseStatus; reviewNote: string | null;
  createdAt: string; updatedAt: string;
  modules: CourseModule[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<CourseStatus, string> = {
  DRAFT:             "bg-neutral-800 text-neutral-400 border-neutral-700",
  PENDING_REVIEW:    "bg-amber-900/40 text-amber-300 border-amber-500/30",
  CHANGES_REQUESTED: "bg-orange-900/40 text-orange-300 border-orange-500/30",
  PUBLISHED:         "bg-emerald-900/40 text-emerald-300 border-emerald-500/30",
  UNPUBLISHED:       "bg-neutral-800 text-neutral-500 border-neutral-700",
  ARCHIVED:          "bg-neutral-900 text-neutral-600 border-neutral-800",
};

function StatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Public Courses Page ──────────────────────────────────────────────────────

export default function CoursesPage() {
  useSEO({
    title: "Courses | Quran Tutors Academy",
    description: "Browse our structured Quran and Arabic courses — Tajweed, Hifz, Quranic Arabic, and more.",
  });
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState({ program: "", level: "", language: "", format: "" });

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    (Object.entries(filters) as [string, string][]).forEach(([k, v]) => { if (v) params.set(k, v); });
    request<PublicCourse[]>(`/api/courses?${params}`)
      .then(setCourses)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load courses."))
      .finally(() => setLoading(false));
  }, [filters]);

  const programs = [...new Set(courses.map((c) => c.program))].sort();
  const levels   = [...new Set(courses.map((c) => c.level))].sort();
  const languages = [...new Set(courses.map((c) => c.language))].sort();
  const formats  = [...new Set(courses.map((c) => c.format))].sort();

  const selectCls = "bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50 cursor-pointer";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hero */}
      <section className="pt-20 pb-10 px-4 text-center">
        <div className="inline-flex items-center space-x-2 bg-sky-950/60 border border-sky-500/20 rounded-full px-4 py-1.5 mb-6">
          <GraduationCap size={13} className="text-sky-400" />
          <span className="text-xs font-semibold text-sky-300 tracking-wide uppercase">Courses</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Structured Learning Programs</h1>
        <p className="text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
          Tutor-designed syllabi, reviewed and published by QTA. Each course includes a week-by-week module plan.
        </p>
      </section>

      {/* Filters */}
      <section className="px-4 pb-8 max-w-4xl mx-auto">
        <div className="flex flex-wrap gap-2">
          <select value={filters.program} onChange={(e) => setFilters({ ...filters, program: e.target.value })} className={selectCls}>
            <option value="">All Programs</option>
            {programs.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} className={selectCls}>
            <option value="">All Levels</option>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} className={selectCls}>
            <option value="">All Languages</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filters.format} onChange={(e) => setFilters({ ...filters, format: e.target.value })} className={selectCls}>
            <option value="">All Formats</option>
            {formats.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </section>

      {/* Course list */}
      <section className="px-4 pb-20 max-w-4xl mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-16 text-neutral-500">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-xs">Loading courses…</span>
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-xs text-rose-400 py-6">
            <AlertCircle size={14} /><span>{error}</span>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <BookOpen size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No published courses yet.</p>
            <p className="text-xs text-neutral-600 mt-1">Check back soon as our tutors publish their curricula.</p>
          </div>
        ) : courses.map((course) => (
          <div key={course.id} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === course.id ? null : course.id)}
              className="w-full px-5 py-4 flex justify-between items-start text-left hover:bg-neutral-800/40 transition"
            >
              <div className="space-y-1 pr-4">
                <p className="font-bold text-white">{course.title}</p>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                  <span className="flex items-center space-x-1"><BookOpen size={11} /><span>{course.program} · {course.level}</span></span>
                  <span className="flex items-center space-x-1"><Globe size={11} /><span>{course.language}</span></span>
                  {course.durationWeeks && <span className="flex items-center space-x-1"><Clock size={11} /><span>{course.durationWeeks} weeks</span></span>}
                  <span className="text-neutral-600">by {course.tutor.account.fullName}</span>
                </div>
                {course.priceAmount && (
                  <p className="text-xs font-bold text-emerald-400">{course.priceCurrency} {Number(course.priceAmount).toFixed(2)}</p>
                )}
              </div>
              {expanded === course.id ? <ChevronUp size={16} className="text-neutral-400 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-neutral-400 shrink-0 mt-1" />}
            </button>

            {expanded === course.id && (
              <div className="px-5 pb-5 space-y-4 border-t border-neutral-800 pt-4">
                {course.description && <p className="text-xs text-neutral-400 leading-relaxed">{course.description}</p>}
                {course.outcomes && (
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Learning Outcomes</p>
                    <p className="text-xs text-neutral-300 leading-relaxed">{course.outcomes}</p>
                  </div>
                )}
                {course.modules.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Syllabus ({course.modules.length} modules)</p>
                    <ol className="space-y-1.5">
                      {course.modules.map((m) => (
                        <li key={m.id} className="flex items-start space-x-2 text-xs">
                          <span className="text-neutral-600 w-5 shrink-0 text-right">{m.position}.</span>
                          <div>
                            <span className="text-white font-semibold">{m.title}</span>
                            {m.description && <span className="text-neutral-500 ml-1">— {m.description}</span>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <button className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 text-neutral-950 text-xs font-bold hover:bg-sky-400 transition">
                  <span>Enquire about this course</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

// ─── Tutor Course Editor ──────────────────────────────────────────────────────

type ModuleDraft = { title: string; description: string };

const EMPTY_FORM = {
  title: "", description: "", program: "", level: "", language: "",
  format: "", durationWeeks: "", prerequisites: "", outcomes: "",
  priceAmount: "", priceCurrency: "USD",
};

export function TutorCoursePanel({ token }: { token: string }) {
  const [courses, setCourses] = useState<TutorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<TutorCourse | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [modules, setModules] = useState<ModuleDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await accountRequest<TutorCourse[]>("/courses/tutor/my", token);
      setCourses(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null); setForm({ ...EMPTY_FORM }); setModules([]); setFormError(null); setCreating(true);
  }

  function openEdit(c: TutorCourse) {
    setCreating(false);
    setForm({
      title: c.title, description: c.description ?? "", program: c.program, level: c.level,
      language: c.language, format: c.format, durationWeeks: c.durationWeeks?.toString() ?? "",
      prerequisites: c.prerequisites ?? "", outcomes: c.outcomes ?? "",
      priceAmount: c.priceAmount ? Number(c.priceAmount).toFixed(2) : "",
      priceCurrency: c.priceCurrency,
    });
    setModules(c.modules.map((m) => ({ title: m.title, description: m.description ?? "" })));
    setFormError(null);
    setEditing(c);
  }

  function closeForm() { setCreating(false); setEditing(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setFormError(null);
    if (!form.title.trim() || !form.program.trim() || !form.level.trim() || !form.language.trim() || !form.format.trim()) {
      setFormError("Title, program, level, language, and format are required."); return;
    }
    setSaving(true);
    const payload = {
      ...form,
      durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : undefined,
      priceAmount: form.priceAmount ? Number(form.priceAmount) : undefined,
      description: form.description || undefined,
      prerequisites: form.prerequisites || undefined,
      outcomes: form.outcomes || undefined,
      modules: modules.filter((m) => m.title.trim()),
    };
    try {
      if (editing) {
        await accountRequest(`/courses/tutor/my/${editing.id}`, token, "PATCH", payload);
      } else {
        await accountRequest("/courses/tutor/my", token, "POST", payload);
      }
      closeForm(); await load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to save.");
    } finally { setSaving(false); }
  }

  async function handleSubmit(id: string) {
    setActionId(id);
    try {
      await accountRequest(`/courses/tutor/my/${id}/submit`, token, "POST");
      await load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed to submit."); }
    finally { setActionId(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course permanently?")) return;
    setActionId(id);
    try {
      await accountRequest(`/courses/tutor/my/${id}`, token, "DELETE");
      await load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed to delete."); }
    finally { setActionId(null); }
  }

  const inputCls = "w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-sky-500/50";

  const isEditable = (c: TutorCourse) => ["DRAFT", "CHANGES_REQUESTED"].includes(c.status);
  const isSubmittable = (c: TutorCourse) => ["DRAFT", "CHANGES_REQUESTED"].includes(c.status);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <GraduationCap size={16} className="text-sky-400" />
            <span>My Courses</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">Draft, edit and submit courses for admin review.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={load} className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"><RefreshCw size={13} /></button>
          <button onClick={openCreate} className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-sky-500 text-neutral-950 text-xs font-bold hover:bg-sky-400 transition">
            <Plus size={13} /><span>New Course</span>
          </button>
        </div>
      </div>

      {/* Form */}
      {(creating || editing) && (
        <form onSubmit={handleSave} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-white">{editing ? "Edit Course" : "New Course"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Title *", "title", "Introduction to Tajweed"],
              ["Program *", "program", "Tajweed / Hifz / Arabic…"],
              ["Level *", "level", "Beginner / Intermediate…"],
              ["Language *", "language", "English / Urdu / Arabic…"],
              ["Format *", "format", "Online 1-on-1 / Group…"],
              ["Duration (weeks)", "durationWeeks", "8"],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">{label}</label>
                <input value={(form as Record<string, string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} className={inputCls} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Overview of the course…" className={inputCls + " resize-none"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Prerequisites</label>
              <textarea value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
                rows={2} placeholder="What learners should know first…" className={inputCls + " resize-none"} />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Learning Outcomes</label>
              <textarea value={form.outcomes} onChange={(e) => setForm({ ...form, outcomes: e.target.value })}
                rows={2} placeholder="What learners will be able to do…" className={inputCls + " resize-none"} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Price</label>
              <input type="number" step="0.01" min="0" value={form.priceAmount} onChange={(e) => setForm({ ...form, priceAmount: e.target.value })}
                placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Currency</label>
              <input value={form.priceCurrency} onChange={(e) => setForm({ ...form, priceCurrency: e.target.value })}
                maxLength={3} placeholder="USD" className={inputCls} />
            </div>
          </div>

          {/* Modules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Syllabus Modules</label>
              <button type="button" onClick={() => setModules([...modules, { title: "", description: "" }])}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1">
                <Plus size={11} /><span>Add Module</span>
              </button>
            </div>
            {modules.map((m, i) => (
              <div key={i} className="flex items-start space-x-2 mb-2">
                <span className="text-xs text-neutral-600 mt-2 w-5 text-right shrink-0">{i + 1}.</span>
                <input value={m.title} onChange={(e) => { const n = [...modules]; n[i] = { ...n[i], title: e.target.value }; setModules(n); }}
                  placeholder="Module title" className={inputCls + " flex-1"} />
                <input value={m.description} onChange={(e) => { const n = [...modules]; n[i] = { ...n[i], description: e.target.value }; setModules(n); }}
                  placeholder="Brief description" className={inputCls + " flex-1"} />
                <button type="button" onClick={() => setModules(modules.filter((_, j) => j !== i))}
                  className="p-2 mt-0.5 text-neutral-600 hover:text-rose-400 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {formError && (
            <div className="flex items-center space-x-2 text-xs text-rose-400">
              <AlertCircle size={13} /><span>{formError}</span>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={closeForm} className="px-3 py-1.5 text-xs rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-500 text-neutral-950 hover:bg-sky-400 disabled:opacity-50 transition flex items-center space-x-1.5">
              {saving && <Loader2 size={12} className="animate-spin" />}
              <span>{saving ? "Saving…" : "Save Draft"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Course list */}
      {loading ? (
        <div className="flex justify-center py-10 text-neutral-500">
          <Loader2 size={18} className="animate-spin mr-2" /><span className="text-xs">Loading…</span>
        </div>
      ) : error ? (
        <div className="flex items-center space-x-2 text-xs text-rose-400 py-4"><AlertCircle size={14} /><span>{error}</span></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-10 text-neutral-500">
          <GraduationCap size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No courses yet. Create your first course above.</p>
        </div>
      ) : courses.map((c) => (
        <div key={c.id} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <StatusBadge status={c.status} />
                <span className="font-semibold text-white text-sm">{c.title}</span>
              </div>
              <p className="text-xs text-neutral-500">{c.program} · {c.level} · {c.language} · {c.format}</p>
              {c.modules.length > 0 && <p className="text-xs text-neutral-600">{c.modules.length} module{c.modules.length !== 1 ? "s" : ""}</p>}
              {c.reviewNote && (
                <div className="flex items-start space-x-1.5 mt-1 bg-orange-950/30 border border-orange-500/20 rounded-xl px-3 py-2">
                  <AlertCircle size={12} className="text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-300 leading-relaxed">{c.reviewNote}</p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              {isEditable(c) && (
                <button onClick={() => openEdit(c)} className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition">
                  <Edit2 size={12} />
                </button>
              )}
              {isSubmittable(c) && (
                <button onClick={() => handleSubmit(c.id)} disabled={actionId === c.id}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 disabled:opacity-50 transition">
                  {actionId === c.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                  <span>Submit</span>
                </button>
              )}
              {!["PUBLISHED"].includes(c.status) && (
                <button onClick={() => handleDelete(c.id)} disabled={actionId === c.id}
                  className="p-2 rounded-xl bg-neutral-800 text-neutral-600 hover:text-rose-400 hover:bg-neutral-700 transition">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Admin Course Approval Panel ──────────────────────────────────────────────

export function CourseApprovalPanel({ token }: { token: string }) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const data = await accountRequest<AdminCourse[]>(`/admin/courses${params}`, token);
      setCourses(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally { setLoading(false); }
  }, [token, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function doAction(id: string, action: "approve" | "unpublish") {
    setActionId(id);
    try {
      await accountRequest(`/admin/courses/${id}/${action}`, token, "PATCH");
      await load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Action failed."); }
    finally { setActionId(null); }
  }

  async function requestChanges(id: string) {
    setNoteError(null);
    if (!note.trim()) { setNoteError("Note is required."); return; }
    setActionId(id);
    try {
      await accountRequest(`/admin/courses/${id}/request-changes`, token, "PATCH", { note: note.trim() });
      setNoteId(null); setNote("");
      await load();
    } catch (e: unknown) { setNoteError(e instanceof Error ? e.message : "Failed."); }
    finally { setActionId(null); }
  }

  const selectCls = "bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <BookOpen size={16} className="text-amber-400" />
            <span>Course Approval Queue</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">Review submitted courses and approve or request changes.</p>
        </div>
        <div className="flex space-x-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">All Statuses</option>
            {["DRAFT","PENDING_REVIEW","CHANGES_REQUESTED","PUBLISHED","UNPUBLISHED","ARCHIVED"].map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <button onClick={load} className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-neutral-500">
          <Loader2 size={18} className="animate-spin mr-2" /><span className="text-xs">Loading…</span>
        </div>
      ) : error ? (
        <div className="flex items-center space-x-2 text-xs text-rose-400 py-6"><AlertCircle size={14} /><span>{error}</span></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No courses match the current filter.</p>
        </div>
      ) : courses.map((c) => (
        <div key={c.id} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            className="w-full px-5 py-4 flex justify-between items-start text-left hover:bg-neutral-800/40 transition"
          >
            <div className="space-y-1 pr-4">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <StatusBadge status={c.status} />
                <span className="font-semibold text-white">{c.title}</span>
              </div>
              <p className="text-xs text-neutral-500">
                {c.program} · {c.level} · {c.language} · {c.format} ·{" "}
                <span className="text-neutral-600">{c.tutor.account.fullName} ({c.tutor.account.email})</span>
              </p>
              {c.reviewNote && (
                <p className="text-[11px] text-orange-400 mt-1">Review note: {c.reviewNote}</p>
              )}
            </div>
            {expanded === c.id ? <ChevronUp size={16} className="text-neutral-400 mt-1 shrink-0" /> : <ChevronDown size={16} className="text-neutral-400 mt-1 shrink-0" />}
          </button>

          {expanded === c.id && (
            <div className="px-5 pb-5 border-t border-neutral-800 pt-4 space-y-4">
              {c.description && <p className="text-xs text-neutral-400 leading-relaxed">{c.description}</p>}
              {c.outcomes && (
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Outcomes</p>
                  <p className="text-xs text-neutral-300">{c.outcomes}</p>
                </div>
              )}
              {c.prerequisites && (
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Prerequisites</p>
                  <p className="text-xs text-neutral-300">{c.prerequisites}</p>
                </div>
              )}
              {c.modules.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Modules</p>
                  <ol className="space-y-1">
                    {c.modules.map((m) => (
                      <li key={m.id} className="flex items-start space-x-2 text-xs">
                        <span className="text-neutral-600 w-5 shrink-0 text-right">{m.position}.</span>
                        <span className="text-white">{m.title}{m.description && <span className="text-neutral-500"> — {m.description}</span>}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Request-changes note input */}
              {noteId === c.id && (
                <div className="space-y-2">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                    placeholder="Describe the required changes…"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500/50 resize-none" />
                  {noteError && <p className="text-xs text-rose-400">{noteError}</p>}
                  <div className="flex space-x-2">
                    <button onClick={() => { setNoteId(null); setNote(""); setNoteError(null); }}
                      className="px-3 py-1.5 text-xs rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition">Cancel</button>
                    <button onClick={() => requestChanges(c.id)} disabled={actionId === c.id}
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-50 transition flex items-center space-x-1.5">
                      {actionId === c.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                      <span>Send Feedback</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {c.status === "PENDING_REVIEW" && (
                  <>
                    <button onClick={() => doAction(c.id, "approve")} disabled={actionId === c.id}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                      {actionId === c.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                      <span>Approve & Publish</span>
                    </button>
                    <button onClick={() => { setNoteId(c.id); setNote(""); setNoteError(null); }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-orange-700 text-white hover:bg-orange-600 transition">
                      <XCircle size={11} /><span>Request Changes</span>
                    </button>
                  </>
                )}
                {c.status === "PUBLISHED" && (
                  <button onClick={() => doAction(c.id, "unpublish")} disabled={actionId === c.id}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-600 disabled:opacity-50 transition">
                    {actionId === c.id ? <Loader2 size={11} className="animate-spin" /> : <EyeOff size={11} />}
                    <span>Unpublish</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
