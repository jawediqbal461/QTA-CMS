import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Link2, Unlink2 } from "lucide-react";
import index from "../../data/quran-legacy/index.json";

type Ayah = { numberInSurah: number; arabic: string; translation: string };
type SurahData = { ayahs: Ayah[] };
type IndexEntry = { slug: string; title: string; number: number };

const pages = import.meta.glob<{ default: SurahData }>("../../data/quran-verses/surah-*.json");
const entries = index as IndexEntry[];

export default function QuranPanel({ isTutor, shared, onSync }: {
  isTutor: boolean;
  shared: { surah: number; ayah: number } | null;
  onSync: (surah: number, ayah: number) => void;
}) {
  const [surah, setSurah] = useState(shared?.surah ?? 1);
  const [ayah, setAyah] = useState(shared?.ayah ?? 1);
  const [follow, setFollow] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [data, setData] = useState<SurahData | "error" | null>(null);
  const rows = useRef(new Map<number, HTMLLIElement>());

  const entry = useMemo(() => entries.find((item) => item.number === surah), [surah]);

  useEffect(() => {
    if (!isTutor && follow && shared) { setSurah(shared.surah); setAyah(shared.ayah); }
  }, [isTutor, follow, shared]);

  useEffect(() => {
    setData(null);
    const load = entry ? pages[`../../data/quran-verses/${entry.slug}.json`] : undefined;
    if (!load) { setData("error"); return; }
    let active = true;
    load().then((module) => { if (active) setData(module.default); }, () => { if (active) setData("error"); });
    return () => { active = false; };
  }, [entry]);

  useEffect(() => { rows.current.get(ayah)?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [ayah, data]);

  const total = data && data !== "error" ? data.ayahs.length : 0;
  const choose = (nextSurah: number, nextAyah: number) => {
    setSurah(nextSurah); setAyah(nextAyah);
    if (isTutor) onSync(nextSurah, nextAyah);
  };
  const step = (delta: number) => {
    const next = ayah + delta;
    if (next >= 1 && next <= total) choose(surah, next);
    else if (next < 1 && surah > 1) choose(surah - 1, 1);
    else if (next > total && surah < 114) choose(surah + 1, 1);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={surah} onChange={(event) => choose(Number(event.target.value), 1)} disabled={!isTutor && follow}
          className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-white disabled:opacity-60" aria-label="Surah">
          {entries.map((item) => <option key={item.slug} value={item.number}>{item.number}. {item.title.split(" - ")[0]}</option>)}
        </select>
        <button type="button" onClick={() => setShowTranslation((value) => !value)} className="rounded-lg border border-neutral-700 p-1.5 text-neutral-300" aria-label="Toggle translation">
          {showTranslation ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        {!isTutor && (
          <button type="button" onClick={() => setFollow((value) => !value)} className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold ${follow ? "border-emerald-500/40 text-emerald-400" : "border-neutral-700 text-neutral-300"}`}>
            {follow ? <Link2 size={12} /> : <Unlink2 size={12} />}{follow ? "Following teacher" : "Browsing freely"}
          </button>
        )}
      </div>
      {(isTutor || !follow) && (
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <button type="button" onClick={() => step(-1)} className="flex items-center gap-1 rounded-lg border border-neutral-700 px-2 py-1"><ChevronLeft size={13} /> Previous ayah</button>
          <span className="font-mono">Ayah {ayah}{total ? ` / ${total}` : ""}</span>
          <button type="button" onClick={() => step(1)} className="flex items-center gap-1 rounded-lg border border-neutral-700 px-2 py-1">Next ayah <ChevronRight size={13} /></button>
        </div>
      )}
      <div className="max-h-[52vh] overflow-y-auto pr-1">
        {data === null && <p role="status" className="py-6 text-center text-xs text-neutral-500">Loading…</p>}
        {data === "error" && <p role="alert" className="py-6 text-center text-xs text-rose-400">This surah could not be loaded.</p>}
        {data && data !== "error" && (
          <ol className="space-y-2">
            {data.ayahs.map((item) => (
              <li key={item.numberInSurah} ref={(node) => { if (node) rows.current.set(item.numberInSurah, node); else rows.current.delete(item.numberInSurah); }}
                onClick={() => { if (isTutor || !follow) choose(surah, item.numberInSurah); }}
                className={`rounded-xl border p-3 transition ${item.numberInSurah === ayah ? "border-emerald-500/60 bg-emerald-500/10" : "border-neutral-800 bg-neutral-900/60"} ${isTutor || !follow ? "cursor-pointer" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-950 text-[10px] font-bold text-amber-400">{item.numberInSurah}</span>
                  <p dir="rtl" lang="ar" className="quran-ayah-arabic flex-1 text-right text-2xl leading-loose text-white">{item.arabic}</p>
                </div>
                {showTranslation && <p className="mt-2 border-t border-neutral-800 pt-2 text-xs leading-relaxed text-neutral-400">{item.translation}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
