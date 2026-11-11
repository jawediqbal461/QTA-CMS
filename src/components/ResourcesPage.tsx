import { useEffect, useState } from "react";
import {
  BookOpen, Download, Edit2, ExternalLink, Filter, Lock, Plus, Search,
  Trash2, X, Globe, Eye, EyeOff,
} from "lucide-react";
import { accountRequest, ApiError, request } from "../lib/api";
import { useSEO } from "../hooks/useSEO";
import { getStoredSession } from "../lib/session";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  program: string;
  level: string;
  language: string;
  format: string;
  url: string;
  accessLevel: "PUBLIC" | "ENROLLED";
  published: boolean;
  authorName: string | null;
  createdAt: string;
  updatedAt?: string;
}

const PROGRAMS  = ["Qaida", "Tajweed", "Hifz", "Arabic", "General"];
const LEVELS    = ["Beginner", "Intermediate", "Advanced"];
const FORMATS   = ["PDF", "Audio", "Video", "Worksheet", "Guide"];
const LANGUAGES = ["English", "Urdu", "Arabic"];

const ALL = "All";

const FORMAT_COLORS: Record<string, string> = {
  PDF:       "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Audio:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Video:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Worksheet: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Guide:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// ─── Public page ─────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [program, setProgram]     = useState(ALL);
  const [level, setLevel]         = useState(ALL);
  const [format, setFormat]       = useState(ALL);
  const [language, setLanguage]   = useState(ALL);

  useSEO({
    title: "Learning Resources",
    description: "Free Quran and Islamic studies resources — PDFs, audio lessons, worksheets and study guides.",
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (program  !== ALL) params.set("program",  program);
    if (level    !== ALL) params.set("level",    level);
    if (format   !== ALL) params.set("format",   format);
    if (language !== ALL) params.set("language", language);
    // Signed-in students and guardians also see resources marked "enrolled only".
    const path = `/resources${params.size ? `?${params}` : ""}`;
    const session = getStoredSession(["student", "guardian", "tutor"]);
    (session ? accountRequest<Resource[]>(path, session.token) : request<Resource[]>(path))
      .then((data) => { setResources(data); setError(null); setLoading(false); })
      .catch(() => { setError("Could not load resources. Please try again."); setLoading(false); });
  }, [program, level, format, language]);

  const filtered = resources.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center space-x-1.5 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          <BookOpen size={12} />
          <span>Free Resources</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Learning Resources</h1>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto">
          PDFs, audio lessons, worksheets and study guides for Quran and Islamic studies.
        </p>
      </div>

      {/* Search + filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-8 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-600 outline-none transition"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-neutral-500" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Filter:</span>
          </div>
          {([
            { value: program,  setter: setProgram,  options: [ALL, ...PROGRAMS]  },
            { value: level,    setter: setLevel,    options: [ALL, ...LEVELS]    },
            { value: format,   setter: setFormat,   options: [ALL, ...FORMATS]   },
            { value: language, setter: setLanguage, options: [ALL, ...LANGUAGES] },
          ] as const).map(({ value, setter, options }, i) => (
            <select
              key={i}
              value={value}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
            >
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>
      </div>

      {error && <p className="text-center text-sm text-rose-400 py-10">{error}</p>}
      {loading && <p className="text-center text-sm text-neutral-500 py-10">Loading resources…</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-sm text-neutral-500 py-10">No resources match your filters.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <article key={r.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col gap-3 hover:border-neutral-700 transition">
              <div className="flex items-start justify-between gap-2">
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${FORMAT_COLORS[r.format] ?? "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                  {r.format}
                </span>
                {r.accessLevel === "ENROLLED" && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                    <Lock size={10} />
                    Enrolled only
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-snug">{r.title}</h3>
                {r.description && (
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{r.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {[r.program, r.level, r.language].map((tag) => (
                  <span key={tag} className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              {r.authorName && (
                <p className="text-[10px] text-neutral-600">By {r.authorName}</p>
              )}
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-600/20 transition"
              >
                {r.format === "PDF" ? <Download size={13} /> : <ExternalLink size={13} />}
                {r.format === "PDF" ? "Download PDF" : "Open Resource"}
              </a>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 text-center border-t border-neutral-900 pt-8">
        <p className="text-xs text-neutral-500">
          More resources available to enrolled students.{" "}
          <a href="/signup/student" className="text-emerald-400 hover:underline">Sign up</a> to get full access.
        </p>
      </div>
    </div>
  );
}

// ─── Admin panel ─────────────────────────────────────────────────────────────

const BLANK_FORM = {
  title: "", description: "", program: PROGRAMS[0], level: LEVELS[0],
  language: LANGUAGES[0], format: FORMATS[0], url: "",
  accessLevel: "PUBLIC" as "PUBLIC" | "ENROLLED", published: false, authorName: "",
};

export function ResourcesAdminPanel({ token }: { token: string }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState({ ...BLANK_FORM });
  const [formErr, setFormErr]     = useState<string | null>(null);
  const [search, setSearch]       = useState("");

  const load = () => {
    setLoading(true);
    accountRequest<Resource[]>("/admin/resources", token)
      .then((data) => { setResources(data); setLoading(false); })
      .catch((e) => { setErr(e instanceof ApiError ? e.message : "Failed to load resources."); setLoading(false); });
  };

  useEffect(load, [token]);

  const startEdit = (r: Resource) => {
    setEditId(r.id);
    setForm({
      title: r.title, description: r.description ?? "", program: r.program,
      level: r.level, language: r.language, format: r.format, url: r.url,
      accessLevel: r.accessLevel, published: r.published, authorName: r.authorName ?? "",
    });
    setShowForm(true);
    setFormErr(null);
  };

  const startNew = () => {
    setEditId(null);
    setForm({ ...BLANK_FORM });
    setShowForm(true);
    setFormErr(null);
  };

  const cancel = () => { setShowForm(false); setEditId(null); setFormErr(null); };

  const handleSubmit = async () => {
    if (!form.title.trim()) return setFormErr("Title is required.");
    if (!form.url.trim())   return setFormErr("URL is required.");
    setSaving(true);
    setFormErr(null);
    const body = {
      ...form,
      description: form.description || undefined,
      authorName: form.authorName || undefined,
    };
    try {
      if (editId) {
        await accountRequest(`/admin/resources/${editId}`, token, "PATCH", body);
      } else {
        await accountRequest("/admin/resources", token, "POST", body);
      }
      setShowForm(false);
      setEditId(null);
      load();
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : "Failed to save resource.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await accountRequest(`/admin/resources/${id}`, token, "DELETE");
      load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to delete resource.");
    }
  };

  const togglePublished = async (r: Resource) => {
    try {
      await accountRequest(`/admin/resources/${r.id}`, token, "PATCH", { published: !r.published });
      load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to update resource.");
    }
  };

  const filtered = resources.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.program.toLowerCase().includes(q);
  });

  const f = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));
  const selectCls = "w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none";
  const inputCls  = "w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-emerald-500/50 transition";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources…"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-8 pr-3 text-xs text-white placeholder-neutral-600 outline-none" />
        </div>
        <button onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs font-bold transition">
          <Plus size={13} />
          Add Resource
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="rounded-2xl border border-neutral-700 bg-neutral-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">{editId ? "Edit Resource" : "New Resource"}</span>
            <button onClick={cancel} className="text-neutral-400 hover:text-white"><X size={15} /></button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Title *</label>
              <input value={form.title} onChange={(e) => f("title", e.target.value)} placeholder="Resource title…" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => f("description", e.target.value)} rows={2}
                placeholder="Brief description…" className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Program</label>
              <select value={form.program} onChange={(e) => f("program", e.target.value)} className={selectCls}>
                {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Level</label>
              <select value={form.level} onChange={(e) => f("level", e.target.value)} className={selectCls}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Format</label>
              <select value={form.format} onChange={(e) => f("format", e.target.value)} className={selectCls}>
                {FORMATS.map((f2) => <option key={f2}>{f2}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Language</label>
              <select value={form.language} onChange={(e) => f("language", e.target.value)} className={selectCls}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">URL *</label>
              <input value={form.url} onChange={(e) => f("url", e.target.value)} placeholder="https://…" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Author Name</label>
              <input value={form.authorName} onChange={(e) => f("authorName", e.target.value)} placeholder="Optional" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Access Level</label>
              <select value={form.accessLevel} onChange={(e) => f("accessLevel", e.target.value)} className={selectCls}>
                <option value="PUBLIC">Public</option>
                <option value="ENROLLED">Enrolled only</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="res-pub" checked={form.published} onChange={(e) => f("published", e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer" />
              <label htmlFor="res-pub" className="text-xs text-neutral-300 cursor-pointer">Publish immediately</label>
            </div>
          </div>

          {formErr && <p className="text-xs text-rose-400">{formErr}</p>}

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-neutral-950 text-xs font-bold transition">
              {saving ? "Saving…" : editId ? "Save Changes" : "Create Resource"}
            </button>
            <button onClick={cancel} className="px-4 py-2 rounded-xl border border-neutral-800 text-xs text-neutral-400 hover:text-white transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-xs text-rose-400">{err}</p>}
      {loading && <p className="text-sm text-neutral-500 text-center py-8">Loading…</p>}

      {!loading && !err && filtered.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <BookOpen size={36} className="text-neutral-700 mx-auto" />
          <p className="text-sm text-neutral-500">No resources yet. Add one to get started.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="rounded-2xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                {["Title", "Program", "Level", "Format", "Access", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filtered.map((r) => (
                <tr key={r.id} className="bg-neutral-950 hover:bg-neutral-900/40 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white truncate max-w-[200px]">{r.title}</div>
                    {r.description && <div className="text-neutral-500 truncate max-w-[200px] mt-0.5">{r.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{r.program}</td>
                  <td className="px-4 py-3 text-neutral-400">{r.level}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${FORMAT_COLORS[r.format] ?? "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                      {r.format}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.accessLevel === "PUBLIC" ? (
                      <span className="flex items-center gap-1 text-emerald-400"><Globe size={11} />Public</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400"><Lock size={11} />Enrolled</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublished(r)}
                      className={`flex items-center gap-1 text-[10px] font-bold ${r.published ? "text-emerald-400" : "text-neutral-500"}`}>
                      {r.published ? <Eye size={11} /> : <EyeOff size={11} />}
                      {r.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(r)} className="text-neutral-400 hover:text-white transition">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(r.id, r.title)} className="text-neutral-600 hover:text-rose-400 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
