import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Book, Search, Volume2, VolumeX, Play, Pause, RotateCcw,
  Sparkles, Compass, Bookmark, Flame,
  AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff, Type,
  BookOpen, Layers
} from "lucide-react";
import { Surah, Juz, INITIAL_SURAHS, INITIAL_JUZ, REALISTIC_QURAN_VERSES, slugifySurahName } from "../data/mockData";
import Breadcrumbs from "./Breadcrumbs";
import { useSEO } from "../hooks/useSEO";

const AUDIO_SERVERS = [
  {
    id: "quranicaudio",
    name: "QuranicAudio CDN",
    reciter: "Mishary Alafasy",
    getUrl: (num: number) => {
      const padded = num.toString().padStart(3, "0");
      return `https://download.quranicaudio.com/quran/mishari_alaafasy/${padded}.mp3`;
    }
  },
  {
    id: "islamicnetwork",
    name: "Islamic Network CDN",
    reciter: "Mishary Alafasy",
    getUrl: (num: number) => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${num}.mp3`
  },
  {
    id: "mp3quran",
    name: "MP3Quran Server",
    reciter: "Mishary Alafasy",
    getUrl: (num: number) => {
      const padded = num.toString().padStart(3, "0");
      return `https://server8.mp3quran.net/afs/${padded}.mp3`;
    }
  }
];

interface QuranExplorerProps {
  onNavigateHome?: () => void;
  onNavigateToAdmin?: (subTab?: "overview" | "architecture" | "sitemap" | "database" | "curriculum" | "profiles" | "quran_crud" | "blog_crud") => void;
}

export default function QuranExplorer({ onNavigateHome, onNavigateToAdmin }: QuranExplorerProps = {}) {
  const navigate = useNavigate();
  const { surahSlug } = useParams<{ surahSlug?: string }>();

  // Navigation & Toggle States
  const [surahs] = useState<Surah[]>(() => {
    try {
      const saved = localStorage.getItem("qta_surahs");
      return saved ? JSON.parse(saved) : INITIAL_SURAHS;
    } catch {
      return INITIAL_SURAHS;
    }
  });

  // Juz (Para) index — editable from the Admin CMS, same as surahs
  const [juzList] = useState<Juz[]>(() => {
    try {
      const saved = localStorage.getItem("qta_juz");
      return saved ? JSON.parse(saved) : INITIAL_JUZ;
    } catch {
      return INITIAL_JUZ;
    }
  });

  const [sidebarTab, setSidebarTab] = useState<"surah" | "para">("surah");
  const [selectedSurah, setSelectedSurah] = useState<Surah>(() => {
    if (surahSlug) {
      const match = surahs.find(s => slugifySurahName(s.nameEnglish) === surahSlug);
      if (match) return match;
    }
    return surahs[0] || INITIAL_SURAHS[0];
  });
  const [selectedJuz, setSelectedJuz] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Reading Control States
  const [showTranslations, setShowTranslations] = useState(true);
  const [showArabic, setShowArabic] = useState(true);
  const [arabicFontSize, setArabicFontSize] = useState<number>(28); // Slide size between 20px and 48px
  const [bookmarkedVerses, setBookmarkedVerses] = useState<string[]>(["v-1-1"]);
  const [verseSearch, setVerseSearch] = useState("");

  // Dynamic Content Loading Simulation (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const versesPerPage = 10;

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedServer, setSelectedServer] = useState("quranicaudio");
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep the selected surah in sync with the URL, and always land on a real,
  // canonical /quran/:surahSlug address instead of a bare /quran with no resource.
  useEffect(() => {
    if (!surahSlug) {
      navigate(`/quran/${slugifySurahName(selectedSurah.nameEnglish)}`, { replace: true });
      return;
    }
    const match = surahs.find(s => slugifySurahName(s.nameEnglish) === surahSlug);
    if (match) {
      if (match.id !== selectedSurah.id) {
        setSelectedSurah(match);
        setSidebarTab("surah");
      }
    } else {
      // Unknown slug — fall back to the first surah's real URL.
      navigate(`/quran/${slugifySurahName(surahs[0].nameEnglish)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahSlug]);

  // Selects a surah and pushes its own real URL, so every surah is individually linkable.
  const goToSurah = (s: Surah) => {
    setSidebarTab("surah");
    setSelectedSurah(s);
    navigate(`/quran/${slugifySurahName(s.nameEnglish)}`);
  };

  // Dynamic content resolution based on selection
  const currentSurahInState = surahs.find(s => s.id === selectedSurah.id) || selectedSurah;

  const getActiveVerses = () => {
    let rawVerses: Array<{ verse_number: number; text_ar: string; text_translation: string; juz_id: number }> = [];

    if (sidebarTab === "surah") {
      // Check if this surah has custom edited verses (added via the Admin CMS)
      if (currentSurahInState.verses && currentSurahInState.verses.length > 0) {
        rawVerses = currentSurahInState.verses;
      } else {
        // Only use verse text we actually have curated — no invented placeholder Arabic.
        const loaded = REALISTIC_QURAN_VERSES[currentSurahInState.number];
        if (loaded) {
          rawVerses = loaded;
        }
      }
    } else {
      // Selected a Juz (Para). Show any real verses tagged with this Juz.
      Object.entries(REALISTIC_QURAN_VERSES).forEach(([, versesList]) => {
        versesList.forEach((v) => {
          if (v.juz_id === selectedJuz) {
            rawVerses.push(v);
          }
        });
      });
    }

    // Apply internal search filter
    if (verseSearch) {
      rawVerses = rawVerses.filter(v =>
        v.text_ar.includes(verseSearch) ||
        v.text_translation.toLowerCase().includes(verseSearch.toLowerCase()) ||
        v.verse_number.toString() === verseSearch
      );
    }

    return rawVerses;
  };

  const activeVersesList = getActiveVerses();
  const totalVersesCount = activeVersesList.length;
  const hasCuratedText = totalVersesCount > 0 || !!verseSearch;

  // Pagination chunking
  const indexOfLastVerse = currentPage * versesPerPage;
  const indexOfFirstVerse = indexOfLastVerse - versesPerPage;
  const paginatedVerses = activeVersesList.slice(indexOfFirstVerse, indexOfLastVerse);
  const totalPages = Math.ceil(totalVersesCount / versesPerPage) || 1;

  // Reset to page 1 whenever the selected surah/juz changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSurah, selectedJuz, sidebarTab]);

  const getAudioUrl = (surahNum: number) => {
    const server = AUDIO_SERVERS.find((s) => s.id === selectedServer) || AUDIO_SERVERS[0];
    return server.getUrl(surahNum);
  };

  // Initialize and handle audio events
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setAudioError(null);
    const targetSurahNum = sidebarTab === "surah" ? selectedSurah.number : 1; // Default to Al-Fatihah audio if Juz selected
    const audioUrl = getAudioUrl(targetSurahNum);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.warn("Audio load error on url:", audioUrl);
      setAudioError("The selected audio CDN is unresponsive. Try swapping the CDN Server using the configurator below.");
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("Playback prevented or error", err);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [selectedSurah, selectedServer, selectedJuz, sidebarTab]);

  // Controls Handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error("Playback block", e);
        setAudioError("Audio playback failed. Please try a different server or interaction.");
      });
    }
  };

  // Jumps straight to a surah and starts playing its recitation audio in one click.
  const listenToSurah = (s: Surah, e: React.MouseEvent) => {
    e.stopPropagation();
    goToSurah(s);
    setIsPlaying(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.volume = nextMute ? 0 : volume;
  };

  const toggleBookmark = (id: string) => {
    if (bookmarkedVerses.includes(id)) {
      setBookmarkedVerses(bookmarkedVerses.filter(v => v !== id));
    } else {
      setBookmarkedVerses([...bookmarkedVerses, id]);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Filter surahs based on query
  const filteredSurahs = surahs.filter(
    (s) =>
      s.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameArabic.includes(searchQuery) ||
      s.number.toString() === searchQuery
  );

  // Filter Paras based on query
  const filteredParas = juzList.filter(
    (j) =>
      j.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.number.toString() === searchQuery
  );

  const breadcrumbItems = [
    {
      label: "Quran Companion",
      action: () => {
        setVerseSearch("");
        setSearchQuery("");
      },
      icon: <Book size={12} className="text-emerald-400" />
    },
    {
      label: sidebarTab === "surah" ? `Surah ${selectedSurah.nameEnglish}` : `Juz ${selectedJuz}`
    }
  ];

  useSEO({
    title: sidebarTab === "surah"
      ? (selectedSurah.seoTitle || `Surah ${selectedSurah.nameEnglish} (${selectedSurah.nameArabic}) — Read & Listen Online`)
      : `Juz ${selectedJuz} — Read & Listen Online`,
    description: sidebarTab === "surah"
      ? (selectedSurah.seoDescription || `Read Surah ${selectedSurah.nameEnglish}, a ${selectedSurah.type} chapter of ${selectedSurah.totalVerses} verses, with English translation and audio recitation by Mishary Alafasy.`)
      : `Read and listen to Juz ${selectedJuz} of the Holy Quran, with English translation and audio recitation.`,
    schema: sidebarTab === "surah" ? {
      "@type": "WebPage",
      name: `Surah ${selectedSurah.nameEnglish}`,
      description: selectedSurah.seoDescription || `Surah ${selectedSurah.nameEnglish} — ${selectedSurah.type}, ${selectedSurah.totalVerses} verses.`,
      isPartOf: { "@type": "Book", name: "The Holy Quran" }
    } : undefined
  });

  return (
    <div id="quran-root" className="max-w-7xl mx-auto p-4 md:p-6 text-neutral-200 space-y-6">

      <Breadcrumbs
        items={breadcrumbItems}
        onHomeAction={onNavigateHome}
      />

      {/* HEADER HERO AREA */}
      <div id="quran-hero" className="relative bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-amber-950/20 border border-neutral-800 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -z-10" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
              <Compass size={11} className="animate-spin-slow text-amber-500 mr-1" />
              <span>Noble Quran Study Companion</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center">
              <Book size={28} className="text-emerald-400 mr-2.5 shrink-0" /> Explore the Noble Quran
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Immerse yourself in divine revelation with precise word-by-word translation, Tajweed color-coded rules, professional audio recitations, and deep thematic surah details.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
            <div className="hidden sm:flex items-center space-x-2.5 bg-neutral-950/60 border border-neutral-800 px-4 py-2 rounded-xl text-xs">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Flame size={14} className="animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px]">Academic View</p>
                <p className="text-[9px] text-neutral-500">Tajweed Optimized</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* RESPONSIVE LEFT SIDEBAR (Surahs Index & Paras Index toggles) */}
        <aside id="quran-sidebar" className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">

          {/* TOGGLE HEADER */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Index Navigation
              </h3>
              <span className="text-[10px] bg-neutral-950 border border-neutral-800 text-emerald-400 px-2.5 py-1 rounded-full font-bold">
                114 Surahs
              </span>
            </div>

            {/* TOGGLE COMPONENT */}
            <div className="grid grid-cols-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-850">
              <button
                id="toggle-114-surahs"
                onClick={() => setSidebarTab("surah")}
                className={`py-2 text-xs font-black rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  sidebarTab === "surah"
                    ? "bg-emerald-500 text-neutral-950 shadow-md font-extrabold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <BookOpen size={13} />
                <span>114 Surahs</span>
              </button>
              <button
                id="toggle-30-paras"
                onClick={() => setSidebarTab("para")}
                className={`py-2 text-xs font-black rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  sidebarTab === "para"
                    ? "bg-emerald-500 text-neutral-950 shadow-md font-extrabold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Layers size={13} />
                <span>30 Paras (Juz)</span>
              </button>
            </div>
          </div>

          {/* INDEX SEARCH BAR */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={sidebarTab === "surah" ? "Search surah by name, number..." : "Search Juz by name, number..."}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-neutral-600 outline-none transition"
            />
          </div>

          {/* LIST ITEMS (DETERMINISTIC & SCROLLABLE) */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {sidebarTab === "surah" ? (
              filteredSurahs.length > 0 ? (
                filteredSurahs.map((s) => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => goToSurah(s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToSurah(s);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left cursor-pointer ${
                      selectedSurah.id === s.id
                        ? "bg-emerald-950/40 border-emerald-500/40 text-white"
                        : "bg-neutral-950/40 border-neutral-850 hover:bg-neutral-950 text-neutral-300 hover:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center font-mono shrink-0 ${
                        selectedSurah.id === s.id ? "bg-emerald-500 text-neutral-950" : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                      }`}>
                        {s.number}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold">{s.nameEnglish}</h4>
                        <p className="text-[9px] text-neutral-500 font-mono">
                          {s.type} • {s.totalVerses} Verses
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-neutral-400 font-mono text-right">
                        {s.nameArabic}
                      </span>
                      <button
                        onClick={(e) => listenToSurah(s, e)}
                        title={`Listen to ${s.nameEnglish}`}
                        aria-label={`Listen to ${s.nameEnglish} recitation`}
                        className="w-6 h-6 rounded-full bg-neutral-900 hover:bg-emerald-500 border border-neutral-800 hover:border-emerald-400 text-neutral-400 hover:text-neutral-950 flex items-center justify-center shrink-0 transition"
                      >
                        <Play size={10} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500 space-y-2 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
                  <Compass size={22} className="mx-auto text-neutral-600 animate-spin-slow" />
                  <p>No Surahs matched your search query.</p>
                </div>
              )
            ) : (
              // Para (Juz) list
              filteredParas.length > 0 ? (
                filteredParas.map((j) => (
                  <button
                    key={j.number}
                    onClick={() => setSelectedJuz(j.number)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left ${
                      selectedJuz === j.number
                        ? "bg-emerald-950/40 border-emerald-500/40 text-white"
                        : "bg-neutral-950/40 border-neutral-850 hover:bg-neutral-950 text-neutral-300 hover:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center font-mono ${
                        selectedJuz === j.number ? "bg-emerald-500 text-neutral-950" : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                      }`}>
                        {j.number}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold">{j.nameEnglish}</h4>
                        <p className="text-[9px] text-neutral-500 font-mono">
                          Starts: {j.startInfo}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-neutral-400 font-mono text-right">
                      {j.nameArabic}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500 space-y-2 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
                  <Compass size={22} className="mx-auto text-neutral-600" />
                  <p>No Juz found.</p>
                </div>
              )
            )}
          </div>

          {/* SIDEBAR AUDIO STREAM MODULE */}
          <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase font-mono">Recitation Stream</span>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                Alafasy
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white truncate">
                {sidebarTab === "surah" ? selectedSurah.nameEnglish : `Juz ${selectedJuz} recitation`}
              </p>
              <p className="text-[9px] text-neutral-500 truncate">
                {sidebarTab === "surah" ? `Chapter ${selectedSurah.number} Recitation` : "Recited during Para study"}
              </p>
            </div>

            {audioError && (
              <div className="p-2 bg-red-950/40 border border-red-500/20 rounded-xl text-[10px] text-red-400 flex items-start space-x-1.5">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <p>{audioError}</p>
              </div>
            )}

            {/* PROGRESS BAR */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full accent-emerald-500 bg-neutral-800 h-1 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition"
                title={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute recitation audio" : "Mute recitation audio"}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition flex items-center justify-center shadow-md shadow-emerald-500/20"
                aria-label={isPlaying ? "Pause recitation audio" : "Play recitation audio"}
              >
                {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="text-neutral-400 hover:text-white transition"
                title="Restart"
                aria-label="Restart recitation audio"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* VOLUME CONTROL */}
            <div className="flex items-center space-x-2 pt-1 border-t border-neutral-900">
              <span className="text-[9px] text-neutral-500 font-mono">VOL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-neutral-400 bg-neutral-800 h-0.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* SERVER SWITCHER */}
            <div className="pt-2 border-t border-neutral-900 space-y-1">
              <span className="text-[8px] uppercase font-bold text-neutral-500 font-mono block">CDN Server</span>
              <div className="grid grid-cols-1 gap-1">
                {AUDIO_SERVERS.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => setSelectedServer(server.id)}
                    className={`w-full flex items-center justify-between p-1.5 rounded text-left text-[9px] transition ${
                      selectedServer === server.id
                        ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold"
                        : "bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <span>{server.name}</span>
                    <span className="text-[7px] opacity-60 uppercase font-mono">{server.id === "quranicaudio" ? "Primary" : "Mirror"}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </aside>

        {/* MAIN READER COMPONENT */}
        <main id="quran-main-reader" className="lg:col-span-8 space-y-6">

          {/* SELECTION SUMMARY & VIEWPORT TOOLBAR */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-850">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                  {sidebarTab === "surah" ? "Active Surah Selection" : "Active Para (Juz) Selection"}
                </span>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-xl font-black text-white">
                    {sidebarTab === "surah" ? `${selectedSurah.nameEnglish}` : `Juz ${selectedJuz}`}
                  </h2>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {sidebarTab === "surah" ? selectedSurah.nameArabic : juzList.find(j => j.number === selectedJuz)?.nameArabic}
                  </span>
                </div>
              </div>

              {/* STATS BUBBLES */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 rounded-xl font-bold font-mono">
                  {sidebarTab === "surah" ? `${selectedSurah.type} Classified` : `Juz ${selectedJuz} Loaded`}
                </span>
                <span className="text-[10px] bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl font-bold font-mono">
                  {totalVersesCount} Verses In View
                </span>
              </div>
            </div>

            {/* CONTROLS TOOLBAR */}
            <div className="flex flex-wrap justify-between items-center gap-3.5 pt-1">

              {/* SLIDER FOR ARABIC TEXT SIZE (Very beneficial for study ease) */}
              <div className="flex items-center space-x-2 bg-neutral-950 border border-neutral-850 p-2 rounded-xl text-xs w-full sm:w-auto">
                <Type size={14} className="text-neutral-400 shrink-0" />
                <span className="text-[10px] font-mono text-neutral-400">Arabic Scale</span>
                <input
                  type="range"
                  min="20"
                  max="48"
                  value={arabicFontSize}
                  onChange={(e) => setArabicFontSize(parseInt(e.target.value))}
                  className="accent-emerald-500 bg-neutral-800 h-1 rounded-lg appearance-none cursor-pointer w-24"
                />
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{arabicFontSize}px</span>
              </div>

              {/* SEARCH INSIDE DYNAMIC VERSES */}
              <div className="relative w-full sm:w-48">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-neutral-500">
                  <Search size={12} />
                </span>
                <input
                  type="text"
                  value={verseSearch}
                  onChange={(e) => setVerseSearch(e.target.value)}
                  placeholder="Filter verses text..."
                  className="w-full bg-neutral-950 border border-neutral-850 focus:border-emerald-500/40 rounded-xl py-1.5 pl-8 pr-3 text-[11px] text-white outline-none placeholder-neutral-600"
                />
              </div>

              {/* ARABIC TEXT TOGGLE */}
              <button
                id="toggle-arabic"
                onClick={() => {
                  if (!showTranslations && showArabic) {
                    // Prevent hiding both at the same time for UI safety
                    setShowTranslations(true);
                  }
                  setShowArabic(!showArabic);
                }}
                className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  showArabic
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                    : "bg-neutral-950 border-neutral-850 text-neutral-500"
                }`}
              >
                {showArabic ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>{showArabic ? "Arabic Script Active" : "Arabic Script Hidden"}</span>
              </button>

              {/* TRANSLATION TOGGLE */}
              <button
                id="toggle-translation"
                onClick={() => {
                  if (!showArabic && showTranslations) {
                    // Prevent hiding both at the same time for UI safety
                    setShowArabic(true);
                  }
                  setShowTranslations(!showTranslations);
                }}
                className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  showTranslations
                    ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-300"
                    : "bg-neutral-950 border-neutral-850 text-neutral-500"
                }`}
              >
                {showTranslations ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>{showTranslations ? "Translation Active" : "Translation Hidden"}</span>
              </button>

            </div>

            {/* PAGINATED VERSES DISPLAY COMPONENT */}
            <div id="verses-reader-view" className="space-y-4">
              {paginatedVerses.length > 0 ? (
                paginatedVerses.map((v) => {
                  const verseKey = `v-${sidebarTab === "surah" ? selectedSurah.number : "juz"}-${v.verse_number}`;
                  const isBookmarked = bookmarkedVerses.includes(verseKey);
                  return (
                    <div
                      key={verseKey}
                      className="bg-neutral-950 border border-neutral-850/60 rounded-2xl p-4 md:p-6 space-y-4 transition hover:border-neutral-800"
                    >
                      {/* Arabic Verse row with custom adjustable font-size */}
                      {showArabic && (
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-emerald-500 font-mono text-[10px] bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md self-start shrink-0 mt-1 font-bold">
                            Verse {v.verse_number}
                          </span>

                          <p
                            className="text-right text-neutral-100 font-serif leading-loose tracking-wide font-medium w-full"
                            dir="rtl"
                            style={{ fontSize: `${arabicFontSize}px` }}
                          >
                            {v.text_ar}
                          </p>
                        </div>
                      )}

                      {/* English translation section */}
                      {showTranslations && (
                        <div className={`pt-3 ${showArabic ? "border-t border-neutral-900" : ""}`}>
                          {!showArabic && (
                            <span className="text-emerald-500 font-mono text-[9px] bg-emerald-950/40 border border-emerald-500/10 px-1.5 py-0.5 rounded mr-2 font-bold inline-block">
                              Verse {v.verse_number}
                            </span>
                          )}
                          <p className="text-xs text-neutral-400 italic leading-relaxed inline">
                            {v.text_translation}
                          </p>
                        </div>
                      )}

                      {/* Interactive bookmark / teacher aids */}
                      <div className="flex justify-between items-center pt-2 text-[10px] text-neutral-500">
                        <span className="font-mono">
                          Juz {v.juz_id} • Chapter {sidebarTab === "surah" ? selectedSurah.number : "Ref"}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleBookmark(verseKey)}
                            className={`p-1.5 rounded-lg border transition ${
                              isBookmarked
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold"
                                : "bg-neutral-900 border-neutral-850 text-neutral-500 hover:text-white"
                            }`}
                            title="Bookmark this verse"
                            aria-label={isBookmarked ? `Remove bookmark from verse ${v.verse_number}` : `Bookmark verse ${v.verse_number}`}
                          >
                            <Bookmark size={11} fill={isBookmarked ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : hasCuratedText ? (
                <div className="p-12 text-center text-xs text-neutral-500 space-y-2 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
                  <Compass size={24} className="mx-auto text-neutral-600 animate-spin-slow" />
                  <p>No verses matched the target search / selection criteria.</p>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-neutral-400 space-y-3 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
                  <BookOpen size={24} className="mx-auto text-neutral-600" />
                  <p className="font-semibold text-neutral-300">
                    Full verse-by-verse text for {sidebarTab === "surah" ? selectedSurah.nameEnglish : `Juz ${selectedJuz}`} isn't in our local library yet.
                  </p>
                  <p className="max-w-md mx-auto leading-relaxed">
                    We're gradually adding accurate Arabic text and translation for every surah. In the meantime, you can still listen to the complete recitation using the audio player on the left.
                  </p>
                  <button
                    onClick={togglePlay}
                    className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Listen to Recitation</span>
                  </button>
                </div>
              )}
            </div>

            {/* PAGINATION INTERACTIVE FOOTER */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-neutral-850 text-xs">
                <span className="text-neutral-500 font-mono">
                  Showing {indexOfFirstVerse + 1} - {Math.min(indexOfLastVerse, totalVersesCount)} of {totalVersesCount}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span className="px-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono font-bold text-[11px]">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* TAJWEED EDUCATION PORTAL */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-500">
              <Sparkles size={16} />
              <h4 className="text-xs font-black uppercase tracking-wider">
                Why Choose Quran Tutors Academy?
              </h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Browse the complete Quran by Surah or Juz, read alongside English translation, and listen to certified recitation — right here, free to explore. During live lessons, tutors use the same interactive whiteboard to trace root syllables directly on the verses you're studying.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1">
                <span className="text-xs font-black text-white block">114 Surahs & 30 Paras</span>
                <span className="text-[10px] text-neutral-500 block">Browse the full Quran index by chapter or Juz, with instant search by name or number, each with its own page.</span>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1">
                <span className="text-xs font-black text-white block">Adjustable Reading View</span>
                <span className="text-[10px] text-neutral-500 block">Resize the Arabic script, toggle translation on or off, and bookmark verses to revisit later.</span>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1">
                <span className="text-xs font-black text-white block">Certified Reciter Audio</span>
                <span className="text-[10px] text-neutral-500 block">Listen to Sheikh Mishary Alafasy's recitation for every surah, with automatic fallback across audio servers if one is slow.</span>
              </div>
            </div>
          </div>

        </main>

      </div>
    </div>
  );
}
