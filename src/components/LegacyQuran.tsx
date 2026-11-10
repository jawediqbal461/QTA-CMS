import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  BookOpen, Search, Volume2, Eye, EyeOff, ChevronLeft, ChevronRight, Minus, Plus,
} from "lucide-react";
import index from "../data/quran-legacy/index.json";
import { useSEO } from "../hooks/useSEO";
import { extractSurahIntro } from "../lib/legacyQuranContent";

interface Ayah {
  numberInSurah: number;
  arabic: string;
  translation: string;
}
interface SurahVerses {
  number: number;
  slug: string;
  nameArabic: string;
  nameEnglish: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

const legacyPages = import.meta.glob<{ default: { html: string } }>(
  "../data/quran-legacy/surah-*.json",
);
const versePages = import.meta.glob<{ default: SurahVerses }>(
  "../data/quran-verses/surah-*.json",
);

const FONT_STEPS = [22, 26, 30, 34, 38];

function SurahIndexPage() {
  const [query, setQuery] = useState("");
  useSEO({ title: "Quran", description: "Browse and read the Holy Quran by Surah, with English translation." });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index;
    return index.filter(
      (s) => s.title.toLowerCase().includes(q) || String(s.number).includes(q),
    );
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center space-x-1.5 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          <BookOpen size={12} />
          <span>114 Surahs</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">The Noble Quran</h1>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto">
          Read every Surah with Arabic script and English translation, free to explore.
        </p>
      </div>

      <div className="relative max-w-sm mx-auto mb-8">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or number…"
          className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-600 outline-none transition"
        />
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ slug, title, number }) => {
          const [english, arabic] = title.split(" - ");
          return (
            <li key={slug}>
              <Link
                to={`/quran/${slug}/`}
                className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 hover:border-emerald-500/50 transition group"
              >
                <span className="shrink-0 w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-sm font-bold">
                  {number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white truncate">{english}</span>
                  <span className="block text-base text-neutral-400 font-arabic truncate" dir="rtl" lang="ar">{arabic}</span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-neutral-600 group-hover:text-emerald-400 transition" />
              </Link>
            </li>
          );
        })}
      </ol>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-neutral-500 mt-10">No Surah matches “{query}”.</p>
      )}
    </div>
  );
}

function SurahDetailPage({ surah }: { surah: { slug: string; title: string; number: number } }) {
  const [verses, setVerses] = useState<SurahVerses | "error">();
  const [intro, setIntro] = useState<{ introHtml: string; audioUrl?: string }>();
  const [showTranslation, setShowTranslation] = useState(true);
  const [fontStep, setFontStep] = useState(2);

  const [englishTitle] = surah.title.split(" - ");

  useSEO({
    title: `${englishTitle} — Read & Listen Online`,
    description: `Read Surah ${englishTitle} in Arabic with English translation, and listen to recitation audio.`,
  });

  useEffect(() => {
    setVerses(undefined);
    setIntro(undefined);
    let active = true;

    versePages[`../data/quran-verses/${surah.slug}.json`]().then(
      (m) => { if (active) setVerses(m.default); },
      () => { if (active) setVerses("error"); },
    );
    legacyPages[`../data/quran-legacy/${surah.slug}.json`]().then(
      (m) => { if (active) setIntro(extractSurahIntro(m.default.html)); },
      () => { /* intro text is a bonus, not required */ },
    );

    return () => { active = false; };
  }, [surah.slug]);

  const prev = index.find((s) => s.number === surah.number - 1);
  const next = index.find((s) => s.number === surah.number + 1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Link to="/quran/" className="inline-flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 mb-6">
        <ChevronLeft size={14} />
        <span>Quran Index</span>
      </Link>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 text-center space-y-3">
        <span className="inline-block text-xs font-bold text-emerald-400">Surah {surah.number}</span>
        <h1 className="text-2xl sm:text-3xl font-black text-white" dir="auto">{englishTitle}</h1>
        {verses && verses !== "error" && (
          <>
            <p className="text-3xl font-arabic text-amber-400" dir="rtl" lang="ar">{verses.nameArabic}</p>
            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400">
              <span className="px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800">{verses.revelationType}</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800">{verses.numberOfAyahs} Verses</span>
              {verses.englishNameTranslation && (
                <span className="px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800">"{verses.englishNameTranslation}"</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Prev / next + controls */}
      <div className="flex items-center justify-between gap-2 mt-5 mb-6">
        {prev ? (
          <Link to={`/quran/${prev.slug}/`} className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white">
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Previous</span>
          </Link>
        ) : <span />}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontStep((s) => Math.max(0, s - 1))}
            aria-label="Decrease Arabic text size"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={() => setFontStep((s) => Math.min(FONT_STEPS.length - 1, s + 1))}
            aria-label="Increase Arabic text size"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => setShowTranslation((v) => !v)}
            className="flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white"
          >
            {showTranslation ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showTranslation ? "Hide" : "Show"} Translation</span>
          </button>
        </div>

        {next ? (
          <Link to={`/quran/${next.slug}/`} className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={14} />
          </Link>
        ) : <span />}
      </div>

      {intro?.audioUrl && (
        <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 flex items-center gap-3">
          <Volume2 size={16} className="text-emerald-400 shrink-0" />
          <audio controls preload="none" src={intro.audioUrl} className="w-full h-9" />
        </div>
      )}

      {/* Ayahs */}
      {!verses ? (
        <p role="status" className="text-center text-sm text-neutral-500 py-10">Loading Surah…</p>
      ) : verses === "error" ? (
        <p role="alert" className="text-center text-sm text-rose-400 py-10">This Surah could not be loaded. Reload the page to try again.</p>
      ) : (
        <ol className="space-y-4">
          {verses.ayahs.map((ayah) => (
            <li key={ayah.numberInSurah} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-amber-950 text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                  {ayah.numberInSurah}
                </span>
                <p
                  dir="rtl"
                  lang="ar"
                  className="quran-ayah-arabic flex-1 text-right text-white"
                  style={{ fontSize: FONT_STEPS[fontStep] }}
                >
                  {ayah.arabic}
                </p>
              </div>
              {showTranslation && (
                <p className="text-sm text-neutral-300 leading-relaxed border-t border-neutral-800 pt-3">
                  {ayah.translation}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {intro?.introHtml && (
        <article
          className="legacy-quran-content mt-8 text-sm text-neutral-400 rounded-2xl border border-neutral-800 p-5 sm:p-6"
          dangerouslySetInnerHTML={{ __html: intro.introHtml }}
        />
      )}

      <p className="mt-6 text-center text-[11px] text-neutral-600">
        Arabic text: Uthmani script · Translation: Saheeh International
      </p>
    </div>
  );
}

export default function LegacyQuran() {
  const { surahSlug } = useParams();
  const { pathname, search, hash } = useLocation();
  const lookupSlug = surahSlug === "surah-yasin" ? "surah-yaseen" : surahSlug;
  const surah = index.find((entry) => entry.slug === lookupSlug);
  useSEO({ title: surah?.title ?? "Quran", noindex: !!surahSlug && !surah });

  if (!pathname.endsWith("/")) {
    return <Navigate replace to={{ pathname: pathname + "/", search, hash }} />;
  }

  if (!surahSlug) {
    return <SurahIndexPage />;
  }

  if (!surah) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Surah not found</h1>
        <Link to="/quran/" className="text-sm text-emerald-400">Back to the Quran index</Link>
      </div>
    );
  }

  return <SurahDetailPage surah={surah} />;
}
