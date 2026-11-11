import { useState } from "react";
import type { MistakeEntry } from "../../lib/liveRtc";

const TYPES = ["Makhraj", "Tajweed rule", "Qalqalah", "Madd", "Ghunna", "Idghaam", "Ikhfa", "Memorization", "Fluency", "Other"];

export default function MistakeLogger({ isTutor, learners, mistakes, ayahRef, onLog }: {
  isTutor: boolean;
  learners: Array<{ id: string; fullName: string }>;
  mistakes: MistakeEntry[];
  ayahRef: string | null;
  onLog: (entry: { studentId?: string; type: string; description: string; severity: "minor" | "major" }) => void;
}) {
  const [studentId, setStudentId] = useState(learners[0]?.id ?? "");
  const [type, setType] = useState(TYPES[0]);
  const [severity, setSeverity] = useState<"minor" | "major">("minor");
  const [description, setDescription] = useState("");
  const names = new Map(learners.map((learner) => [learner.id, learner.fullName]));

  return (
    <div className="space-y-3">
      {isTutor ? (
        <form className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3" onSubmit={(event) => {
          event.preventDefault();
          const text = description.trim();
          if (!text) return;
          onLog({ studentId: studentId || undefined, type, severity, description: ayahRef ? `[${ayahRef}] ${text}` : text });
          setDescription("");
        }}>
          {learners.length > 1 && (
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-white" aria-label="Learner">
              {learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.fullName}</option>)}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-white" aria-label="Mistake type">
              {TYPES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={severity} onChange={(event) => setSeverity(event.target.value as "minor" | "major")} className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-white" aria-label="Severity">
              <option value="minor">Minor</option>
              <option value="major">Major</option>
            </select>
          </div>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={500} required
            placeholder={ayahRef ? `What went wrong at ${ayahRef}?` : "What went wrong?"}
            className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-2 text-xs text-white placeholder-neutral-600" />
          <button className="w-full rounded-lg bg-amber-500 py-2 text-xs font-extrabold text-neutral-950 hover:bg-amber-400">Save mistake</button>
          <p className="text-[10px] text-neutral-500">Saved mistakes appear in the student's and guardian's lesson record.</p>
        </form>
      ) : (
        <p className="text-[11px] text-neutral-500">Your teacher's notes about this lesson appear here and stay in your lesson record.</p>
      )}
      <ul className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
        {mistakes.length === 0 && <li className="py-4 text-center text-xs text-neutral-500">No mistakes recorded yet.</li>}
        {mistakes.map((entry) => (
          <li key={entry.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-bold text-white">{entry.type}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${entry.severity === "major" ? "border-rose-500/30 text-rose-400" : "border-amber-500/30 text-amber-400"}`}>{entry.severity}</span>
            </div>
            <p className="text-neutral-300">{entry.description}</p>
            <p className="mt-1 text-[10px] text-neutral-500">{entry.studentId ? names.get(entry.studentId) ?? "Learner" : "Class"} · {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
