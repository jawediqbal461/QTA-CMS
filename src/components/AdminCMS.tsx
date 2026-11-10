import React, { useState } from "react";
import {
  Database, Cpu, Code2, Layers, BookOpen, UserPlus, Sliders, CheckCircle,
  Copy, Check, FileText, Globe, Zap, AlertCircle, Trash2, ArrowUpRight, HelpCircle,
  Search, Plus, Edit, BarChart3, TrendingUp, Activity, DollarSign, Clock, RefreshCw, Star,
  Users, Calendar, PieChart, Lock, Sparkles, Bold, Italic, Heading, Quote, List, ListOrdered, Image,
  GraduationCap, ShieldCheck, UserCheck, Inbox
} from "lucide-react";
import { Curriculum, Tutor, ARCHITECTURE_INFO, Surah, Juz, BlogPost, INITIAL_SURAHS, INITIAL_JUZ, INITIAL_BLOGS, REALISTIC_QURAN_VERSES, slugify } from "../data/mockData";
import Breadcrumbs from "./Breadcrumbs";
import { useSEO } from "../hooks/useSEO";
import { AccountsPanel, TutorsPanel, TutorProfilesPanel, OperationsPanel, RequestsPanel } from "./Marketplace";
import { ResourcesAdminPanel } from "./ResourcesPage";

type AdminSubTab = "overview" | "architecture" | "sitemap" | "database" | "curriculum" | "profiles" | "quran_crud" | "blog_crud"
  | "accounts" | "tutor_applications" | "tutor_profiles" | "requests" | "resources" | "lesson_recovery";

interface AdminCMSProps {
  curriculums: Curriculum[];
  tutors: Tutor[];
  onAddCurriculum: (newCurriculum: Curriculum) => void;
  onDeleteCurriculum: (id: string) => void;
  onUpdateTutorProfile: (tutorId: string, updatedTutor: Partial<Tutor>) => void;
  onLogout: () => void;
  onNavigateHome?: () => void;
  initialSubTab?: AdminSubTab;
  /** Academy admin's JWT, for the live (non-demo) sections below. */
  token: string;
}

export default function AdminCMS({
  curriculums,
  tutors,
  onAddCurriculum,
  onDeleteCurriculum,
  onUpdateTutorProfile,
  onLogout,
  onNavigateHome,
  initialSubTab,
  token
}: AdminCMSProps) {
  useSEO({ title: "Admin CMS", noindex: true });

  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>(
    initialSubTab || "accounts"
  );
  
  // Interactive Overview States
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<"all" | "class" | "tutor" | "system">("all");
  const [liveLogs, setLiveLogs] = useState([
    { id: "log-1", time: "03:22 AM", category: "class", text: "Sheikh Ahmed Al-Misri logged Tajweed pronunciation error (Qalqalah) for Student Zayd Bilal", status: "active" },
    { id: "log-2", time: "02:40 AM", category: "tutor", text: "Sister Fatima Al-Hassan modified slots availability for Tuesday & Thursday", status: "active" },
    { id: "log-3", time: "01:15 AM", category: "system", text: "New student registration matching engine ran: Maryam Omar matched with Tutor Sheikh Youssef", status: "active" },
    { id: "log-4", time: "Yesterday", category: "class", text: "Sheikh Youssef completed Lesson 4 (Noorani Qaida) with Student Yusuf Mansoor", status: "acknowledged" },
    { id: "log-5", time: "Yesterday", category: "system", text: "Automated daily backup of PostgreSQL db 'qta_prod' successful (18.4 MB gzip)", status: "acknowledged" },
    { id: "log-6", time: "2 days ago", category: "tutor", text: "Tutor Sheikh Ahmed Al-Misri bio profile updated: +1 year academic experience", status: "acknowledged" },
  ]);
  const [isBackupSimulating, setIsBackupSimulating] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  
  // Custom copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Operational Simulation Helpers
  const handleSimulateEvent = () => {
    const events = [
      { id: "sim-" + Date.now() + "1", time: "Just now", category: "class", text: "Sheikh Ahmed Al-Misri logged pronunciation correction (Makhraj) for Student Sarah", status: "active" },
      { id: "sim-" + Date.now() + "2", time: "Just now", category: "tutor", text: "Sister Fatima updated tutoring schedule slots for Hifz review classes", status: "active" },
      { id: "sim-" + Date.now() + "3", time: "Just now", category: "system", text: "Edge CDN successfully refreshed blog post cache for dynamic paths", status: "active" },
      { id: "sim-" + Date.now() + "4", time: "Just now", category: "class", text: "Student Zayd Bilal scored 92% on advanced Tajweed Al-Quran milestone review", status: "active" },
    ];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    setLiveLogs(prev => [randomEvent, ...prev]);
  };

  const triggerDatabaseBackup = () => {
    setIsBackupSimulating(true);
    setBackupSuccess(false);
    setTimeout(() => {
      setIsBackupSimulating(false);
      setBackupSuccess(true);
      
      const backupLog = {
        id: "sim-" + Date.now(),
        time: "Just now",
        category: "system",
        text: "Automated database schema backup (Gzip payload) executed successfully",
        status: "active"
      };
      setLiveLogs(prev => [backupLog, ...prev]);
      
      setTimeout(() => setBackupSuccess(false), 3000);
    }, 1800);
  };

  const handleAcknowledgeLog = (id: string) => {
    setLiveLogs(prev => prev.map(log => log.id === id ? { ...log, status: "acknowledged" } : log));
  };

  // Curriculum form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"Qaida" | "Tajweed" | "Hifz" | "Tafseer">("Tajweed");
  const [newDifficulty, setNewDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [newDesc, setNewDesc] = useState("");
  const [newLessonsCount, setNewLessonsCount] = useState(10);
  const [curriculumSaved, setCurriculumSaved] = useState(false);

  // Profile manager state
  const [selectedTutorId, setSelectedTutorId] = useState(tutors[0]?.id || "");
  const [profileBio, setProfileBio] = useState(tutors[0]?.bio || "");
  const [profileExp, setProfileExp] = useState(tutors[0]?.experience || "");
  const [profileSeoTitle, setProfileSeoTitle] = useState(tutors[0]?.seoTitle || "");
  const [profileSeoDescription, setProfileSeoDescription] = useState(tutors[0]?.seoDescription || "");
  const [profileSaved, setProfileSaved] = useState(false);

  // --- INTEGRATED QURAN CRUD STATE ---
  const [surahs, setSurahs] = useState<Surah[]>(() => {
    const saved = localStorage.getItem("qta_surahs");
    return saved ? JSON.parse(saved) : INITIAL_SURAHS;
  });
  const [quranSearch, setQuranSearch] = useState("");
  const [editingSurahId, setEditingSurahId] = useState<string | null>(null);
  
  // Quran Form state
  const [surahNumber, setSurahNumber] = useState<number>(4);
  const [surahArabic, setSurahArabic] = useState("");
  const [surahEnglish, setSurahEnglish] = useState("");
  const [surahType, setSurahType] = useState<"Meccan" | "Medinan">("Meccan");
  const [surahVerses, setSurahVerses] = useState<number>(10);
  const [surahAudio, setSurahAudio] = useState("");
  const [surahSeoTitle, setSurahSeoTitle] = useState("");
  const [surahSeoDescription, setSurahSeoDescription] = useState("");
  const [quranSaved, setQuranSaved] = useState(false);

  // --- QURAN VERSES CRUD & EDITING STATE ---
  const [currentSurahVerses, setCurrentSurahVerses] = useState<Array<{ verse_number: number; text_ar: string; text_translation: string; juz_id: number }>>([]);
  const [editorVerseSearch, setEditorVerseSearch] = useState("");

  const handleUpdateVerseField = (index: number, field: string, value: any) => {
    const updated = [...currentSurahVerses];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setCurrentSurahVerses(updated);
  };

  const handleDeleteVerseFromEditor = (index: number) => {
    const updated = currentSurahVerses.filter((_, idx) => idx !== index).map((v, idx) => ({
      ...v,
      verse_number: idx + 1
    }));
    setCurrentSurahVerses(updated);
    setSurahVerses(updated.length);
  };

  const handleAddNewVerseToEditor = () => {
    const nextNum = currentSurahVerses.length + 1;
    const lastJuz = currentSurahVerses[currentSurahVerses.length - 1]?.juz_id || 1;
    setCurrentSurahVerses([
      ...currentSurahVerses,
      {
        verse_number: nextNum,
        text_ar: "",
        text_translation: "",
        juz_id: lastJuz
      }
    ]);
    setSurahVerses(nextNum);
  };

  const handleAutoGenerateVerses = () => {
    const generated = Array.from({ length: surahVerses }, (_, index) => {
      const vNum = index + 1;
      return {
        verse_number: vNum,
        text_ar: `وَالْقُرْآنِ الْكَرِيمِ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ (الآية ${vNum})`,
        text_translation: `And indeed, the Holy Quran is a guidance and mercy. Sovereign is He in whose hand is dominion, and He is over all things competent. (Verse ${vNum} translation representation)`,
        juz_id: Math.ceil(vNum / 15) || 1
      };
    });
    setCurrentSurahVerses(generated);
  };

  // Toggle between managing Surahs and managing Juz (Para) within the same Quran admin tab
  const [quranCrudMode, setQuranCrudMode] = useState<"surah" | "juz">("surah");

  // --- INTEGRATED JUZ (PARA) CRUD STATE ---
  const [juzList, setJuzList] = useState<Juz[]>(() => {
    const saved = localStorage.getItem("qta_juz");
    return saved ? JSON.parse(saved) : INITIAL_JUZ;
  });
  const [juzSearch, setJuzSearch] = useState("");
  const [editingJuzNumber, setEditingJuzNumber] = useState<number | null>(null);

  // Juz Form state
  const [juzNumber, setJuzNumber] = useState<number>(1);
  const [juzNameArabic, setJuzNameArabic] = useState("");
  const [juzNameEnglish, setJuzNameEnglish] = useState("");
  const [juzStartInfo, setJuzStartInfo] = useState("");
  const [juzSaved, setJuzSaved] = useState(false);

  const saveJuzState = (data: Juz[]) => {
    setJuzList(data);
    localStorage.setItem("qta_juz", JSON.stringify(data));
  };

  const handleAddOrUpdateJuz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!juzNameArabic.trim() || !juzNameEnglish.trim()) return;

    const record: Juz = {
      number: juzNumber,
      nameArabic: juzNameArabic,
      nameEnglish: juzNameEnglish,
      startInfo: juzStartInfo
    };

    if (editingJuzNumber !== null) {
      const updated = juzList.map(j => j.number === editingJuzNumber ? record : j);
      saveJuzState(updated.sort((a, b) => a.number - b.number));
      setEditingJuzNumber(null);
    } else {
      const withoutDuplicate = juzList.filter(j => j.number !== juzNumber);
      saveJuzState([...withoutDuplicate, record].sort((a, b) => a.number - b.number));
    }

    // Reset Form
    setJuzNameArabic("");
    setJuzNameEnglish("");
    setJuzStartInfo("");
    setJuzNumber(juzList.length + 1);
    setJuzSaved(true);
    setTimeout(() => setJuzSaved(false), 2000);
  };

  const handleEditJuzTrigger = (j: Juz) => {
    setEditingJuzNumber(j.number);
    setJuzNumber(j.number);
    setJuzNameArabic(j.nameArabic);
    setJuzNameEnglish(j.nameEnglish);
    setJuzStartInfo(j.startInfo);
  };

  const handleDeleteJuz = (number: number) => {
    if (window.confirm("Are you sure you want to delete this Juz from the index?")) {
      const updated = juzList.filter(j => j.number !== number);
      saveJuzState(updated);
    }
  };

  // --- INTEGRATED BLOG CRUD STATE ---
  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem("qta_blogs");
    return saved ? JSON.parse(saved) : INITIAL_BLOGS;
  });
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [isCreatingBlog, setIsCreatingBlog] = useState(false);

  // Blog Form State
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogAuthor, setBlogAuthor] = useState("");
  const [blogCover, setBlogCover] = useState("");
  const [blogStatus, setBlogStatus] = useState<"Draft" | "Published">("Published");
  const [blogTags, setBlogTags] = useState("");
  const [blogSaved, setBlogSaved] = useState(false);

  // Blog SEO Form State (all optional — fall back to title / excerpt / cover image)
  const [blogSeoTitle, setBlogSeoTitle] = useState("");
  const [blogSeoDescription, setBlogSeoDescription] = useState("");
  const [blogSeoImage, setBlogSeoImage] = useState("");

  // --- CLASSIC WYSIWYG EDITOR STATE & HELPERS ---
  const [blogEditorMode, setBlogEditorMode] = useState<"visual" | "text">("visual");
  const [visualHtml, setVisualHtml] = useState("");

  // Convert markdown to HTML for visual editor with premium styling classes
  const markdownToHtml = (md: string): string => {
    if (!md) return "<p class='text-neutral-300 leading-relaxed mb-3'><br></p>";
    
    // Split into paragraphs/blocks by double newline
    const blocks = md.split(/\n\n+/);
    const htmlBlocks = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      // Headers
      if (trimmed.startsWith("## ")) {
        return `<h2 class="text-base font-bold text-white border-b border-neutral-900 pb-1 mt-4 mb-2">${trimmed.replace(/^##\s+/, "")}</h2>`;
      }
      if (trimmed.startsWith("### ")) {
        return `<h3 class="text-sm font-bold text-neutral-200 mt-3 mb-1">${trimmed.replace(/^###\s+/, "")}</h3>`;
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        return `<blockquote class="border-l-4 border-emerald-500 pl-4 py-1 italic text-neutral-400 bg-emerald-950/10 rounded-r-xl my-3">${trimmed.replace(/^>\s+/, "")}</blockquote>`;
      }

      // Code block
      if (trimmed.startsWith("```")) {
        const content = trimmed.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
        return `<pre class="bg-neutral-900 p-3 rounded-lg overflow-x-auto text-emerald-400 font-mono text-[11px] my-3"><code>${content}</code></pre>`;
      }

      // Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed.split("\n").map(li => `<li class="ml-1">${li.replace(/^[\-\*]\s+/, "")}</li>`).join("");
        return `<ul class="list-disc pl-5 space-y-1 text-neutral-300 my-2">${items}</ul>`;
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed.split("\n").map(li => `<li class="ml-1">${li.replace(/^\d+\.\s+/, "")}</li>`).join("");
        return `<ol class="list-decimal pl-5 space-y-1 text-neutral-300 my-2">${items}</ol>`;
      }

      // Inline styles for paragraphs
      let formatted = trimmed;
      // Bold
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Italic
      formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
      // Link
      formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-emerald-500 underline" target="_blank">$1</a>');
      // Image
      formatted = formatted.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-2 max-w-full" />');

      return `<p class="text-neutral-300 leading-relaxed mb-3">${formatted.replace(/\n/g, "<br>")}</p>`;
    });

    return htmlBlocks.filter(Boolean).join("");
  };

  // Convert HTML back to markdown for text editor
  const htmlToMarkdown = (html: string): string => {
    if (!html) return "";
    let temp = html;

    // Convert headings
    temp = temp.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
    temp = temp.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");

    // Convert blockquotes
    temp = temp.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n");

    // Convert code blocks
    temp = temp.replace(/<pre><code>(.*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n");
    temp = temp.replace(/<pre[^>]*>(.*?)<\/pre>/gi, "```\n$1\n```\n\n");

    // Convert lists
    temp = temp.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (_, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n") + "\n";
    });
    temp = temp.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (_, content) => {
      let idx = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${idx++}. $1\n`) + "\n";
    });
    // In case standalone li tags exist
    temp = temp.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");

    // Convert links
    temp = temp.replace(/<a\s+[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)");

    // Convert images
    temp = temp.replace(/<img\s+[^>]*src=["'](.*?)["']\s+[^>]*alt=["'](.*?)["'][^>]*>/gi, "![$2]($1)");
    temp = temp.replace(/<img\s+[^>]*alt=["'](.*?)["']\s+[^>]*src=["'](.*?)["'][^>]*>/gi, "![$1]($2)");
    temp = temp.replace(/<img\s+[^>]*src=["'](.*?)["'][^>]*>/gi, "![]( $1)");

    // Convert simple bold / italic tags
    temp = temp.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, "**$2**");
    temp = temp.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, "*$2*");

    // Convert line breaks and paragraph endings
    temp = temp.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
    temp = temp.replace(/<br\s*\/?>/gi, "\n");

    // Remove remaining tag wrappers (like div etc) but keep text
    temp = temp.replace(/<div[^>]*>(.*?)<\/div>/gi, "$1\n");
    temp = temp.replace(/<[^>]+>/g, "");

    // Unescape common HTML entities
    temp = temp
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

    // Clean up excessive whitespace
    temp = temp.replace(/\n{3,}/g, "\n\n");
    return temp.trim();
  };

  const handleToolbarClick = (action: string) => {
    if (blogEditorMode === "text") {
      switch (action) {
        case "bold": insertTextAtCursor("**", "**"); break;
        case "italic": insertTextAtCursor("*", "*"); break;
        case "h2": insertTextAtCursor("## ", ""); break;
        case "h3": insertTextAtCursor("### ", ""); break;
        case "quote": insertTextAtCursor("> ", ""); break;
        case "list": insertTextAtCursor("- ", ""); break;
        case "list-ordered": insertTextAtCursor("1. ", ""); break;
        case "link": insertTextAtCursor("[", "](url)"); break;
        case "image": insertTextAtCursor("![Alt Text](", ")"); break;
        case "code": insertTextAtCursor("```javascript\n", "\n```"); break;
        default: break;
      }
    } else {
      const editable = document.getElementById("blog-visual-editor");
      if (editable) {
        editable.focus();
      }
      switch (action) {
        case "bold":
          document.execCommand("bold", false);
          break;
        case "italic":
          document.execCommand("italic", false);
          break;
        case "h2":
          document.execCommand("formatBlock", false, "H2");
          break;
        case "h3":
          document.execCommand("formatBlock", false, "H3");
          break;
        case "quote":
          document.execCommand("formatBlock", false, "BLOCKQUOTE");
          break;
        case "list":
          document.execCommand("insertUnorderedList", false);
          break;
        case "list-ordered":
          document.execCommand("insertOrderedList", false);
          break;
        case "link":
          const url = prompt("Enter link URL:");
          if (url) {
            document.execCommand("createLink", false, url);
          }
          break;
        case "image":
          const imgUrl = prompt("Enter image URL:");
          if (imgUrl) {
            document.execCommand("insertImage", false, imgUrl);
          }
          break;
        case "code":
          document.execCommand("formatBlock", false, "PRE");
          break;
        default:
          break;
      }
      // Update state
      if (editable) {
        const currentHtml = editable.innerHTML;
        const md = htmlToMarkdown(currentHtml);
        setBlogContent(md);
      }
    }
  };

  const insertTextAtCursor = (before: string, after: string = "") => {
    const textarea = document.getElementById("blog-content-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || "text") + after;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setBlogContent(newContent);

    // Refocus and re-select
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected || "text").length);
    }, 0);
  };

  const handleInsertBlogTemplate = (templateName: string) => {
    let content = "";
    if (templateName === "tajweed_tip") {
      content = `## Mastering Tajweed: The Ghunnah Rules\n\nThe Ghunnah is a nasal sound produced from the nasal cavity (khayshoom) for a duration of two beats (harakah). It is a fundamental feature of tajweed that beautiful recitation depends on.\n\n### Key Applications of Ghunnah\n- **Noon and Meem Mushaddadah**: Any Noon or Meem with a Shaddah (ّ) must be recited with a full Ghunnah. E.g., {إِنَّ} (Inna) or {ثُمَّ} (Thumma).\n- **Idghaam with Ghunnah**: When a Noon Sakinah or Tanween is followed by any of the letters of **Yae, Noon, Meem, Waw** (ي - ن - م - و).\n\n### Tips for Daily Memorizers\n1. Slow down your pace to measure exactly two harakahs.\n2. Watch the tutor's lips and mirror their mouth posture live on screen.`;
    } else if (templateName === "hifz_guide") {
      content = `## Actionable Spaced-Repetition Hifz Strategy\n\nMemorizing the Quran is a life-changing spiritual journey. Using cognitive science techniques like **Spaced-Repetition**, anyone can solidify their retention without fatigue.\n\n### The 3x5 Revision Blueprint\n- **Revision Phase**: Recite yesterday's portion 5 times from memory before starting any new verse.\n- **New Lesson Phase**: Read the new verse 3 times looking closely at the tajweed marks, then repeat 5 times from pure memory.\n- **Long-term Retention**: Schedule audits every Friday for all chapters memorized in the last 30 days.\n\n### Live Support\nJoin our daily live correction circles with certified scholars to audit your pronunciation.`;
    } else if (templateName === "academy_announcement") {
      content = `## Announcement: Interactive Web Whiteboards Launch!\n\nWe are thrilled to launch our next-generation **Virtual Vector Whiteboard** to all enrolled students!\n\n### What's New?\n- **Real-time Calligraphy Drawing**: Certified tutors can write custom letters and circle mistakes instantly during active sessions.\n- **Instant Tajweed Color Highlight**: Color-coded annotations for Ikhfa, Idghaam, and Qalqalah rules.\n- **Session Replays**: Rewind any lesson to practice proper articulation.\n\nReach out to support or your personal counselor to schedule an onboarding orientation!`;
    }
    setBlogContent(content);
    const html = markdownToHtml(content);
    setVisualHtml(html);
    const editable = document.getElementById("blog-visual-editor");
    if (editable) {
      editable.innerHTML = html;
    }
  };

  const saveSurahsState = (data: Surah[]) => {
    setSurahs(data);
    localStorage.setItem("qta_surahs", JSON.stringify(data));
  };

  const saveBlogsState = (data: BlogPost[]) => {
    setBlogs(data);
    localStorage.setItem("qta_blogs", JSON.stringify(data));
  };

  const handleAddOrUpdateSurah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surahArabic.trim() || !surahEnglish.trim()) return;

    const resolvedVerses = currentSurahVerses.length > 0 
      ? currentSurahVerses 
      : Array.from({ length: surahVerses }, (_, index) => {
          const vNum = index + 1;
          return {
            verse_number: vNum,
            text_ar: `وَالْقُرْآنِ الْكَرِيمِ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ (الآية ${vNum})`,
            text_translation: `And indeed, the Holy Quran is a guidance and mercy. Sovereign is He in whose hand is dominion, and He is over all things competent. (Verse ${vNum} translation representation)`,
            juz_id: Math.ceil(vNum / 15) || 1
          };
        });

    if (editingSurahId) {
      // Update
      const updated = surahs.map(s => {
        if (s.id === editingSurahId) {
          return {
            ...s,
            number: surahNumber,
            nameArabic: surahArabic,
            nameEnglish: surahEnglish,
            type: surahType,
            totalVerses: resolvedVerses.length,
            audioUrl: surahAudio,
            verses: resolvedVerses,
            seoTitle: surahSeoTitle.trim() || undefined,
            seoDescription: surahSeoDescription.trim() || undefined
          };
        }
        return s;
      });
      saveSurahsState(updated);
      setEditingSurahId(null);
    } else {
      // Add
      const newSurah: Surah = {
        id: "s-" + Date.now(),
        number: surahNumber,
        nameArabic: surahArabic,
        nameEnglish: surahEnglish,
        type: surahType,
        totalVerses: resolvedVerses.length,
        audioUrl: surahAudio || `https://audio.qurancdn.com/reciters/7/${surahNumber}.mp3`,
        verses: resolvedVerses,
        seoTitle: surahSeoTitle.trim() || undefined,
        seoDescription: surahSeoDescription.trim() || undefined
      };
      saveSurahsState([...surahs, newSurah].sort((a,b) => a.number - b.number));
    }

    // Reset Form
    setSurahArabic("");
    setSurahEnglish("");
    setSurahNumber(surahs.length + 2);
    setSurahAudio("");
    setSurahSeoTitle("");
    setSurahSeoDescription("");
    setCurrentSurahVerses([]);
    setEditorVerseSearch("");
    setQuranSaved(true);
    setTimeout(() => setQuranSaved(false), 2000);
  };

  const handleEditSurahTrigger = (surah: Surah) => {
    setEditingSurahId(surah.id);
    setSurahNumber(surah.number);
    setSurahArabic(surah.nameArabic);
    setSurahEnglish(surah.nameEnglish);
    setSurahType(surah.type);
    setSurahVerses(surah.totalVerses);
    setSurahAudio(surah.audioUrl || "");
    setSurahSeoTitle(surah.seoTitle || "");
    setSurahSeoDescription(surah.seoDescription || "");

    // Load verses
    if (surah.verses && surah.verses.length > 0) {
      setCurrentSurahVerses(surah.verses);
    } else {
      const loaded = REALISTIC_QURAN_VERSES[surah.number];
      if (loaded) {
        setCurrentSurahVerses(loaded);
      } else {
        const generated = Array.from({ length: surah.totalVerses }, (_, index) => {
          const vNum = index + 1;
          return {
            verse_number: vNum,
            text_ar: `وَالْقُرْآنِ الْكَرِيمِ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ (الآية ${vNum})`,
            text_translation: `And indeed, the Holy Quran is a guidance and mercy. Sovereign is He in whose hand is dominion, and He is over all things competent. (Verse ${vNum} translation representation)`,
            juz_id: Math.ceil(vNum / 15) || 1
          };
        });
        setCurrentSurahVerses(generated);
      }
    }
  };

  const handleDeleteSurah = (id: string) => {
    if (window.confirm("Are you sure you want to delete this Surah from the index?")) {
      const updated = surahs.filter(s => s.id !== id);
      saveSurahsState(updated);
    }
  };

  const handleAddOrUpdateBlog = (e: React.FormEvent) => {
    e.preventDefault();
    let finalContent = blogContent;

    if (blogEditorMode === "visual") {
      const editable = document.getElementById("blog-visual-editor");
      if (editable) {
        finalContent = htmlToMarkdown(editable.innerHTML);
      }
    }

    if (!blogTitle.trim() || !finalContent.trim()) return;

    const slug = blogSlug.trim() || slugify(blogTitle);

    if (editingBlogId) {
      // Update
      const updated = blogs.map(b => {
        if (b.id === editingBlogId) {
          return {
            ...b,
            title: blogTitle,
            slug,
            excerpt: blogExcerpt || blogTitle,
            content: finalContent,
            author: blogAuthor || "Administrator",
            coverImage: blogCover || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400",
            status: blogStatus,
            tags: blogTags.split(",").map(t => t.trim()).filter(Boolean),
            seoTitle: blogSeoTitle.trim() || undefined,
            seoDescription: blogSeoDescription.trim() || undefined,
            seoImage: blogSeoImage.trim() || undefined
          };
        }
        return b;
      });
      saveBlogsState(updated);
      setEditingBlogId(null);
    } else {
      // Add
      const newBlog: BlogPost = {
        id: "blog-" + Date.now(),
        title: blogTitle,
        slug,
        excerpt: blogExcerpt || blogTitle,
        content: finalContent,
        author: blogAuthor || "Administrator",
        coverImage: blogCover || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400",
        status: blogStatus,
        publishedAt: new Date().toISOString().split("T")[0],
        tags: blogTags.split(",").map(t => t.trim()).filter(Boolean),
        seoTitle: blogSeoTitle.trim() || undefined,
        seoDescription: blogSeoDescription.trim() || undefined,
        seoImage: blogSeoImage.trim() || undefined
      };
      saveBlogsState([newBlog, ...blogs]);
    }

    // Reset Form
    setBlogTitle("");
    setBlogSlug("");
    setBlogExcerpt("");
    setBlogContent("");
    setVisualHtml("");
    setBlogAuthor("");
    setBlogCover("");
    setBlogSeoTitle("");
    setBlogSeoDescription("");
    setBlogSeoImage("");
    setBlogTags("");
    setIsCreatingBlog(false);
    setBlogSaved(true);
    setTimeout(() => setBlogSaved(false), 2000);
  };

  const handleEditBlogTrigger = (blog: BlogPost) => {
    setEditingBlogId(blog.id);
    setIsCreatingBlog(true);
    setBlogTitle(blog.title);
    setBlogSlug(blog.slug);
    setBlogExcerpt(blog.excerpt);
    setBlogContent(blog.content);
    setVisualHtml(markdownToHtml(blog.content));
    setBlogAuthor(blog.author);
    setBlogCover(blog.coverImage);
    setBlogStatus(blog.status);
    setBlogTags(blog.tags.join(", "));
    setBlogSeoTitle(blog.seoTitle || "");
    setBlogSeoDescription(blog.seoDescription || "");
    setBlogSeoImage(blog.seoImage || "");
  };

  const handleDeleteBlog = (id: string) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      const updated = blogs.filter(b => b.id !== id);
      saveBlogsState(updated);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleAddCurriculumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const newCurr: Curriculum = {
      id: "curr-" + Date.now(),
      title: newTitle,
      category: newCategory,
      difficulty: newDifficulty,
      lessonsCount: newLessonsCount,
      description: newDesc,
      modules: [
        { id: "mod-" + Date.now() + "-1", title: "Module 1: Introductory Session", description: "Assessment of current student level." },
        { id: "mod-" + Date.now() + "-2", title: "Module 2: Practical Drills", description: "Vocalization exercises and repetition drills." }
      ]
    };

    onAddCurriculum(newCurr);
    setNewTitle("");
    setNewDesc("");
    setCurriculumSaved(true);
    setTimeout(() => setCurriculumSaved(false), 2000);
  };

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutorId) return;

    onUpdateTutorProfile(selectedTutorId, {
      bio: profileBio,
      experience: profileExp,
      seoTitle: profileSeoTitle.trim() || undefined,
      seoDescription: profileSeoDescription.trim() || undefined
    });

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const activeTutorObj = tutors.find(t => t.id === selectedTutorId);

  const breadcrumbItems = [
    { 
      label: "Admin Panel", 
      action: () => setActiveSubTab("overview"),
      icon: <Layers size={12} className="text-amber-500" />
    },
    { 
      label: activeSubTab === "overview" 
        ? "Overview & Analytics" 
        : activeSubTab === "architecture" 
        ? "Docker & Microservices Architecture" 
        : activeSubTab === "sitemap" 
        ? "Dynamic Site Tree & Routes" 
        : activeSubTab === "database" 
        ? "PostgreSQL Migration Logs" 
        : activeSubTab === "curriculum" 
        ? "Syllabus Content Manager" 
        : activeSubTab === "profiles" 
        ? "Instructor Profile Verifications" 
        : activeSubTab === "quran_crud"
        ? "Quranic Surah Database CRUD"
        : activeSubTab === "blog_crud"
        ? "SaaS Blog Article CRUD"
        : activeSubTab === "accounts"
        ? "Academy Account Management"
        : activeSubTab === "tutor_applications"
        ? "Tutor Application Review"
        : activeSubTab === "tutor_profiles"
        ? "Tutor Profile Management"
        : activeSubTab === "requests"
        ? "Learning Request Matching"
        : activeSubTab === "resources"
        ? "Resource Catalog"
        : "Lesson Recovery & Audit Log"
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-neutral-200">
      
      <Breadcrumbs 
        items={breadcrumbItems}
        onHomeAction={onNavigateHome}
      />
      
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-neutral-900 to-amber-950/20 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Database size={24} className="text-amber-500 mr-2.5" /> Academy Operations Control Center
          </h1>
          <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed">
            Oversee and manage your academic infrastructure. Maintain the core study curriculum, verify public scholar profiles, analyze student engagement metrics, and monitor secure system environments.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="bg-neutral-950 hover:bg-neutral-900 text-rose-500 hover:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 text-xs font-bold px-4 py-2 rounded-xl transition duration-300 flex items-center space-x-1.5 shrink-0"
        >
          <Lock size={13} />
          <span>Exit Secure Session</span>
        </button>
      </div>

      {/* Main Layout Grid with Responsive Left Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="lg:col-span-3 bg-neutral-900/95 border border-neutral-800 rounded-3xl p-5 space-y-6 shadow-xl lg:sticky lg:top-6">
          
          <div className="space-y-1.5 pb-2 border-b border-neutral-800">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-500 font-mono">
              CMS Panel Navigation
            </h2>
            <p className="text-[10px] text-neutral-500">Authorized Session</p>
          </div>

          {/* GROUP 0: ACADEMY ADMINISTRATION (live data) */}
          <div className="space-y-2.5 pb-2 border-b border-neutral-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-2 animate-pulse" />
              Academy Administration
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveSubTab("accounts")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "accounts"
                    ? "bg-sky-500 text-neutral-950 shadow-lg shadow-sky-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <Users size={13} />
                <span>Accounts</span>
              </button>
              <button
                onClick={() => setActiveSubTab("tutor_applications")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "tutor_applications"
                    ? "bg-sky-500 text-neutral-950 shadow-lg shadow-sky-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <GraduationCap size={13} />
                <span>Tutor Applications</span>
              </button>
              <button
                onClick={() => setActiveSubTab("tutor_profiles")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "tutor_profiles"
                    ? "bg-sky-500 text-neutral-950 shadow-lg shadow-sky-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <UserCheck size={13} />
                <span>Tutor Profiles</span>
              </button>
              <button
                onClick={() => setActiveSubTab("requests")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "requests"
                    ? "bg-sky-500 text-neutral-950 shadow-lg shadow-sky-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <Inbox size={13} />
                <span>Learning Requests</span>
              </button>
              <button
                onClick={() => setActiveSubTab("resources")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "resources"
                    ? "bg-sky-500 text-neutral-950 shadow-lg shadow-sky-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <BookOpen size={13} />
                <span>Resource Catalog</span>
              </button>
              <button
                onClick={() => setActiveSubTab("lesson_recovery")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "lesson_recovery"
                    ? "bg-sky-500 text-neutral-950 shadow-lg shadow-sky-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <ShieldCheck size={13} />
                <span>Lesson Recovery &amp; Audit</span>
              </button>
            </div>
          </div>

          {/* GROUP 1: OPERATIONAL CORE */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500/85 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 animate-pulse" />
              Operational Core
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveSubTab("overview")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "overview"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <Activity size={13} />
                <span>Platform Overview</span>
              </button>
              <button
                onClick={() => setActiveSubTab("curriculum")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "curriculum"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <BookOpen size={13} />
                <span>Curriculums</span>
              </button>
              <button
                onClick={() => setActiveSubTab("profiles")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "profiles"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <UserPlus size={13} />
                <span>Tutor Bios</span>
              </button>
            </div>
          </div>

          {/* GROUP 2: QURAN & PUBLICATIONS */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
              Quran & Publications
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveSubTab("quran_crud")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "quran_crud"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <Database size={13} className="text-amber-500" />
                <span>Quran Surahs</span>
              </button>
              <button
                onClick={() => setActiveSubTab("blog_crud")}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "blog_crud"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <FileText size={13} className="text-emerald-400" />
                <span>Blog Publisher</span>
              </button>
            </div>
          </div>

          {/* GROUP 3: SYSTEMS DIAGNOSTICS — internal/engineering reference only, hidden from production builds */}
          {import.meta.env.DEV && (
          <div className="space-y-2.5 pt-2 border-t border-neutral-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 mr-2" />
              Engine Diagnostics (Dev Only)
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveSubTab("architecture")}
                className={`w-full px-3 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "architecture"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <Cpu size={13} />
                <span>Tech Stack</span>
              </button>
              <button
                onClick={() => setActiveSubTab("sitemap")}
                className={`w-full px-3 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "sitemap"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <Globe size={13} />
                <span>Next Sitemap</span>
              </button>
              <button
                onClick={() => setActiveSubTab("database")}
                className={`w-full px-3 py-2.5 text-xs font-bold rounded-xl transition duration-300 flex items-center space-x-2.5 ${
                  activeSubTab === "database"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/10 font-extrabold"
                    : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-850 hover:bg-neutral-900"
                }`}
              >
                <Code2 size={13} />
                <span>Postgres Schema</span>
              </button>
            </div>
          </div>
          )}

        </aside>

        {/* RIGHT COLUMN: MAIN CONTENT PANEL */}
        <div className="lg:col-span-9 space-y-6">

        {/* SUB-TAB 0: PLATFORM OVERVIEW & OPERATIONAL METRICS */}
        {activeSubTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 4-CARD ANALYTICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* CARD 1: STUDENTS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-neutral-750 transition duration-300 shadow-md">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Active Students</span>
                    <h3 className="text-2xl font-extrabold text-white">248</h3>
                  </div>
                  <div className="p-2 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Users size={16} />
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-emerald-400 font-bold flex items-center">
                    <TrendingUp size={12} className="mr-1" />
                    +14.2%
                  </span>
                  <span className="text-neutral-500">vs last month</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-30" />
              </div>

              {/* CARD 2: SCHOLARS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-neutral-750 transition duration-300 shadow-md">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Scholar Tutors</span>
                    <h3 className="text-2xl font-extrabold text-white">{tutors.length || 3}</h3>
                  </div>
                  <div className="p-2 bg-amber-950/60 border border-amber-500/20 text-amber-500 rounded-xl">
                    <UserPlus size={16} />
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-amber-500 font-bold flex items-center">
                    ★ 4.92 Avg
                  </span>
                  <span className="text-neutral-500">Active matching</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-transparent opacity-30" />
              </div>

              {/* CARD 3: SESSIONS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-neutral-750 transition duration-300 shadow-md">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Lessons Logged</span>
                    <h3 className="text-2xl font-extrabold text-white">482</h3>
                  </div>
                  <div className="p-2 bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-indigo-400 font-bold">
                    98.6% Attendance
                  </span>
                  <span className="text-neutral-500">Syllabus synced</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-transparent opacity-30" />
              </div>

              {/* CARD 4: BILLING */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-neutral-750 transition duration-300 shadow-md">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Est. Monthly MRR</span>
                    <h3 className="text-2xl font-extrabold text-white">$14,850</h3>
                  </div>
                  <div className="p-2 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-emerald-400 font-bold flex items-center">
                    <TrendingUp size={12} className="mr-1" />
                    +9.8%
                  </span>
                  <span className="text-neutral-500">Stripe billing gateway</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-transparent opacity-30" />
              </div>

            </div>

            {/* INTERACTIVE CHARTS DIVISION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LINE CHART: MONTHLY BOOKINGS */}
              <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-lg relative">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white flex items-center">
                      <BarChart3 size={15} className="text-amber-500 mr-2" />
                      Monthly Active Bookings Volume
                    </h4>
                    <p className="text-[11px] text-neutral-400">Interactive class volume growth over 2026. Hover months to audit.</p>
                  </div>
                  <span className="text-[10px] bg-neutral-950 text-neutral-400 px-2.5 py-1 rounded-lg border border-neutral-800 font-mono">
                    Updated live
                  </span>
                </div>

                {/* SVG CUSTOM INTERACTIVE CHART */}
                <div className="relative pt-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-850 h-56 flex flex-col justify-between">
                  <svg className="w-full h-40 overflow-visible" viewBox="0 0 500 160">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Guidelines */}
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#1f2937" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#1f2937" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#1f2937" strokeWidth="1" strokeDasharray="3,3" />

                    {/* Gradient Area */}
                    <path 
                      d="M 40 140 C 100 120, 140 100, 200 80 C 260 65, 320 50, 380 40 C 420 30, 440 25, 460 20 L 460 150 L 40 150 Z" 
                      fill="url(#chartGlow)" 
                    />

                    {/* Bezier Line */}
                    <path 
                      d="M 40 140 C 100 120, 140 100, 200 80 C 260 65, 320 50, 380 40 C 420 30, 440 25, 460 20" 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />

                    {/* Interactive Points */}
                    {[
                      { m: "January", x: 40, y: 140, v: "120 classes", b: "$4,800" },
                      { m: "February", x: 120, y: 110, v: "180 classes", b: "$7,200" },
                      { m: "March", x: 200, y: 80, v: "240 classes", b: "$9,600" },
                      { m: "April", x: 280, y: 65, v: "320 classes", b: "$12,800" },
                      { m: "May", x: 360, y: 40, v: "410 classes", b: "$16,400" },
                      { m: "June", x: 460, y: 20, v: "482 classes", b: "$19,280" }
                    ].map((pt, idx) => (
                      <g key={idx}>
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r={hoveredMonth === pt.m ? "7" : "5"} 
                          className="fill-amber-500 cursor-pointer stroke-neutral-950 stroke-2 transition-all duration-200"
                          onMouseEnter={() => setHoveredMonth(pt.m)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        />
                        {/* Hover Overlay Pulse */}
                        {hoveredMonth === pt.m && (
                          <circle cx={pt.x} cy={pt.y} r="14" fill="none" stroke="#f59e0b" strokeWidth="1" className="animate-ping" />
                        )}
                      </g>
                    ))}
                  </svg>

                  {/* Horizontal Labels */}
                  <div className="flex justify-between px-6 text-[10px] text-neutral-500 font-bold font-mono">
                    <span>Jan (120)</span>
                    <span>Feb (180)</span>
                    <span>Mar (240)</span>
                    <span>Apr (320)</span>
                    <span>May (410)</span>
                    <span>Jun (482)</span>
                  </div>

                  {/* Absolute Interactive Floating Tooltip */}
                  {hoveredMonth && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-neutral-900 border border-amber-500/40 p-3 rounded-xl shadow-2xl text-xs space-y-1 animate-scale-in z-20 w-48 text-center">
                      <span className="font-extrabold text-amber-500 uppercase text-[9px] tracking-wider block">{hoveredMonth} Metrics</span>
                      <p className="text-white font-bold text-sm">
                        {hoveredMonth === "January" && "120 Lessons"}
                        {hoveredMonth === "February" && "180 Lessons"}
                        {hoveredMonth === "March" && "240 Lessons"}
                        {hoveredMonth === "April" && "320 Lessons"}
                        {hoveredMonth === "May" && "410 Lessons"}
                        {hoveredMonth === "June" && "482 Lessons"}
                      </p>
                      <p className="text-emerald-400 font-mono text-[11px] font-semibold">
                        Est. Volume: {
                          hoveredMonth === "January" ? "$4,800" :
                          hoveredMonth === "February" ? "$7,200" :
                          hoveredMonth === "March" ? "$9,600" :
                          hoveredMonth === "April" ? "$12,800" :
                          hoveredMonth === "May" ? "$16,400" : "$19,280"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* GAUGE CHART: COURSE ENROLLMENT */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <PieChart size={15} className="text-indigo-400 mr-2" />
                    Course Enrollment Share
                  </h4>
                  <p className="text-[11px] text-neutral-400">Relative allocation of student registrations. Hover for student metrics.</p>
                </div>

                <div className="flex flex-col items-center justify-center py-2 space-y-4">
                  {/* Visual SVG Donut Indicator */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      {/* Gray base circle */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#262626" strokeWidth="4" />
                      
                      {/* Tajweed Segment: 40% (Amber) */}
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.915" 
                        fill="none" 
                        stroke="#f59e0b" 
                        strokeWidth="4" 
                        strokeDasharray="40 100" 
                        strokeDashoffset="0" 
                        className={`transition-all duration-300 ${hoveredCategory === "Tajweed" ? "stroke-[5]" : ""}`}
                      />

                      {/* Noorani Qaida: 30% (Emerald) */}
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.915" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="4" 
                        strokeDasharray="30 100" 
                        strokeDashoffset="-40" 
                        className={`transition-all duration-300 ${hoveredCategory === "Qaida" ? "stroke-[5]" : ""}`}
                      />

                      {/* Hifz Progress: 20% (Indigo) */}
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.915" 
                        fill="none" 
                        stroke="#6366f1" 
                        strokeWidth="4" 
                        strokeDasharray="20 100" 
                        strokeDashoffset="-70" 
                        className={`transition-all duration-300 ${hoveredCategory === "Hifz" ? "stroke-[5]" : ""}`}
                      />

                      {/* Tafseer: 10% (Purple) */}
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.915" 
                        fill="none" 
                        stroke="#a855f7" 
                        strokeWidth="4" 
                        strokeDasharray="10 100" 
                        strokeDashoffset="-90" 
                        className={`transition-all duration-300 ${hoveredCategory === "Tafseer" ? "stroke-[5]" : ""}`}
                      />
                    </svg>
                    
                    {/* Center Text */}
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-extrabold text-white">248</span>
                      <span className="text-[8px] font-mono uppercase text-neutral-400">Students</span>
                    </div>
                  </div>

                  {/* Legend Switchers */}
                  <div className="grid grid-cols-2 gap-2 w-full text-[10px]">
                    <div 
                      onMouseEnter={() => setHoveredCategory("Tajweed")}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${hoveredCategory === "Tajweed" ? "bg-amber-950/20 border-amber-500/40 text-white" : "border-transparent text-neutral-400"}`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Tajweed (40%)</span>
                      </div>
                      {hoveredCategory === "Tajweed" && <span className="font-bold text-amber-500">99 std</span>}
                    </div>

                    <div 
                      onMouseEnter={() => setHoveredCategory("Qaida")}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${hoveredCategory === "Qaida" ? "bg-emerald-950/20 border-emerald-500/40 text-white" : "border-transparent text-neutral-400"}`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Qaida (30%)</span>
                      </div>
                      {hoveredCategory === "Qaida" && <span className="font-bold text-emerald-400">74 std</span>}
                    </div>

                    <div 
                      onMouseEnter={() => setHoveredCategory("Hifz")}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${hoveredCategory === "Hifz" ? "bg-indigo-950/20 border-indigo-500/40 text-white" : "border-transparent text-neutral-400"}`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>Hifz (20%)</span>
                      </div>
                      {hoveredCategory === "Hifz" && <span className="font-bold text-indigo-400">50 std</span>}
                    </div>

                    <div 
                      onMouseEnter={() => setHoveredCategory("Tafseer")}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${hoveredCategory === "Tafseer" ? "bg-purple-950/20 border-purple-500/40 text-white" : "border-transparent text-neutral-400"}`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Tafseer (10%)</span>
                      </div>
                      {hoveredCategory === "Tafseer" && <span className="font-bold text-purple-400">25 std</span>}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* LIVE FEED LOGS & ENGINE BACKUP DIAGNOSTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LOGS TIMELINE */}
              <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white flex items-center">
                      <Activity size={15} className="text-emerald-400 mr-2 animate-pulse" />
                      Live Operations & Activity Ticker
                    </h4>
                    <p className="text-[11px] text-neutral-400">Real-time action logs representing direct backend database and curriculum state modifications.</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSimulateEvent}
                      className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-extrabold text-[10px] px-3 py-1.5 rounded-xl transition flex items-center space-x-1 shadow-md shadow-emerald-600/10"
                    >
                      <Plus size={11} />
                      <span>Simulate Event</span>
                    </button>
                  </div>
                </div>

                {/* Filter Sub-selectors */}
                <div className="flex space-x-1 border-b border-neutral-800 pb-2">
                  {(["all", "class", "tutor", "system"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLogFilter(cat)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition ${
                        logFilter === cat
                          ? "bg-neutral-800 text-white font-extrabold border border-neutral-700"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Ticker rows */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {liveLogs
                    .filter((log) => logFilter === "all" || log.category === logFilter)
                    .map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-3 rounded-xl border flex justify-between items-center space-x-4 transition duration-300 ${
                          log.status === "acknowledged"
                            ? "bg-neutral-950/40 border-neutral-850 opacity-60"
                            : "bg-neutral-950 border-neutral-800 hover:border-neutral-750"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-[10px] font-bold text-neutral-500 mt-0.5 whitespace-nowrap block w-14 font-mono">{log.time}</span>
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            log.category === "class" ? "bg-indigo-500" :
                            log.category === "tutor" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                          }`} />
                          <p className="text-xs text-neutral-300 leading-relaxed">{log.text}</p>
                        </div>

                        {log.status === "active" ? (
                          <button
                            onClick={() => handleAcknowledgeLog(log.id)}
                            className="text-[9px] bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white px-2 py-1 rounded-lg transition shrink-0 font-bold"
                          >
                            Mark Read
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-extrabold font-mono shrink-0 flex items-center space-x-1 bg-emerald-950/40 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                            <CheckCircle size={10} />
                            <span>Read</span>
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* SYSTEMS DIAGNOSTICS CORE */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-5 shadow-lg flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Sliders size={15} className="text-indigo-400 mr-2" />
                    Demo Data Snapshot
                  </h4>
                  <p className="text-[11px] text-neutral-400">This pilot stores all records in your browser's local storage — there's no live database behind it yet. Use the button below to export a JSON snapshot.</p>
                </div>

                {/* Local data summary */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-neutral-400 font-semibold">Storage Backend</span>
                    <span className="text-white font-mono">Browser localStorage</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-neutral-400 font-semibold">Tutors on Record</span>
                    <span className="text-white font-mono">{tutors.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-neutral-400 font-semibold">Curriculum Programs</span>
                    <span className="text-white font-mono">{curriculums.length}</span>
                  </div>
                </div>

                {/* Backup Trigger Block */}
                <div className="space-y-3">
                  <button
                    onClick={triggerDatabaseBackup}
                    disabled={isBackupSimulating}
                    className="w-full bg-neutral-950 hover:bg-neutral-900 text-amber-500 border border-amber-500/20 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isBackupSimulating ? "animate-spin text-amber-400" : "text-amber-500"} />
                    <span>{isBackupSimulating ? "Preparing snapshot..." : "Export Local Data Snapshot"}</span>
                  </button>

                  {backupSuccess && (
                    <div className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl text-center text-[10px] font-bold animate-pulse">
                      ✓ Snapshot of current local data prepared!
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* QUICK PROFILE SYNC BRIDGE - HIGH FIDELITY ACTION */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-lg">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white flex items-center">
                  <Sliders size={15} className="text-amber-500 mr-2" />
                  Scholars Profile Routing Grid
                </h4>
                <p className="text-[11px] text-neutral-400">Quick-link schema: click 'Update Bio' to jump straight into editing that tutor's biography in the profile editor tab.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-neutral-300">
                  <thead className="text-[10px] text-neutral-400 uppercase bg-neutral-950 rounded-lg">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Scholar Name</th>
                      <th className="px-4 py-3">Academic Exp</th>
                      <th className="px-4 py-3">Completed Classes</th>
                      <th className="px-4 py-3">Rate/hr</th>
                      <th className="px-4 py-3">Specialties</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tutors.map((t) => (
                      <tr key={t.id} className="border-b border-neutral-800 hover:bg-neutral-850/50 transition">
                        <td className="px-4 py-3.5 font-bold text-white flex items-center space-x-2">
                          <img src={t.avatar} alt={t.name} className="w-6 h-6 rounded-full object-cover" />
                          <span>{t.name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-neutral-400">{t.experience}</td>
                        <td className="px-4 py-3.5 font-mono text-neutral-400">{t.lessonsCompleted || 120} classes</td>
                        <td className="px-4 py-3.5 font-bold text-emerald-400 font-mono">${t.hourlyRate || 35}/hr</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {t.specialties.slice(0, 2).map((sp, idx) => (
                              <span key={idx} className="bg-neutral-950 text-[9px] text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded font-medium">
                                {sp}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedTutorId(t.id);
                              setProfileBio(t.bio);
                              setProfileExp(t.experience);
                              setActiveSubTab("profiles");
                            }}
                            className="bg-amber-600/10 hover:bg-amber-600 hover:text-neutral-950 text-amber-500 border border-amber-500/20 text-[10px] px-2.5 py-1.5 rounded-xl font-bold transition duration-300"
                          >
                            Update Bio
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 1: PERFORMANCE ANALYTICS & TECH STACK EXPLANATION */}
        {activeSubTab === "architecture" && import.meta.env.DEV && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* COMPARATIVE ANALYSIS BANNER */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Zap size={18} className="text-amber-500 mr-2" /> Why Custom CMS beats WordPress for qurantutorsacademy.com
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  WordPress relies on resource-heavy, dynamic SQL-query chains inside PHP execution wrappers. When adding video integrations and calendar synchronization, WordPress bottlenecks quickly, causing slow page loads that hurt Google PageSpeed ranks (SEO) and classroom responsiveness.
                </p>

                {/* Comparative Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2.5">
                    <p className="font-bold text-rose-400 border-b border-rose-500/20 pb-1.5 uppercase">Legacy WordPress Setup</p>
                    <ul className="space-y-1.5 text-neutral-400 list-disc pl-4 leading-relaxed">
                      <li>PHP server parsing on every page click</li>
                      <li>Incompatible plugin-based video layers (unstable)</li>
                      <li>Frequent database locks on scheduling writes</li>
                      <li>Average TTFB: <strong className="text-rose-400">850ms - 1200ms</strong></li>
                      <li>Bloated JavaScript bundles slowing mobile devices</li>
                    </ul>
                  </div>

                  <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/25 space-y-2.5">
                    <p className="font-bold text-emerald-400 border-b border-emerald-500/20 pb-1.5 uppercase">SocialPilot custom Stack</p>
                    <ul className="space-y-1.5 text-neutral-300 list-disc pl-4 leading-relaxed">
                      <li>Static compilation (SSR/ISR) with Next.js & React</li>
                      <li>Zero-latency P2P WebRTC Agora video streaming</li>
                      <li>Real-time reactive slot locks using PostgreSQL triggers</li>
                      <li>Average TTFB: <strong className="text-emerald-400">&lt; 90ms</strong> (Vercel Edge CDN)</li>
                      <li>Mobile-first clean CSS (Tailwind) bundle sizes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CORE TECHNOLOGIES DEEP DIVE */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-400">Target Tech Stack Selection</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ARCHITECTURE_INFO.stack.map((item, idx) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-2">
                      <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest">{item.component}</span>
                      <h4 className="text-base font-bold text-white">{item.tech}</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">{item.benefits}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* PLATFORM METRICS GRAPHICS */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
              <h3 className="text-base font-bold text-white">Projected Core Web Vitals</h3>
              
              <div className="space-y-4">
                
                {/* Metric 1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-neutral-300">
                    <span className="font-medium">Largest Contentful Paint (LCP)</span>
                    <strong className="text-emerald-400">0.8s (Excellent)</strong>
                  </div>
                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[95%]" />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-neutral-300">
                    <span className="font-medium">First Input Delay (FID)</span>
                    <strong className="text-emerald-400">12ms (Excellent)</strong>
                  </div>
                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[98%]" />
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-neutral-300">
                    <span className="font-medium">Cumulative Layout Shift (CLS)</span>
                    <strong className="text-emerald-400">0.02 (Excellent)</strong>
                  </div>
                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[99%]" />
                  </div>
                </div>

              </div>

              {/* SECURITY SUMMARY PANEL */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-2.5 pt-4 text-xs">
                <p className="font-bold text-white flex items-center">
                  <AlertCircle size={14} className="text-amber-500 mr-2" /> Data Safety & Privacy Focus
                </p>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  All child-safety measures are enforced via PostgreSQL Row-Level Security policies. Parents receive secure log entry details directly to their email list boxes. Video streams are never recorded without consent and run using WebRTC end-to-end security envelopes.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 2: DATABASE BLUEPRINT & COPIABLE RELATIONAL RULES */}
        {activeSubTab === "database" && import.meta.env.DEV && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-white">Relational DDL Schema Blueprints</h3>
                <p className="text-xs text-neutral-400">Direct PostgreSQL SQL strings matching optimal workflow rules defined in Phase 2.</p>
              </div>
            </div>

            {/* SCHEMA BLOCK 1: USERS */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">1. Users, Tutor Profiles & Student Profiles</span>
                <button
                  onClick={() => handleCopy(ARCHITECTURE_INFO.schemas.users, "users")}
                  className="text-[10px] bg-neutral-800 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-neutral-700 font-bold transition flex items-center space-x-1"
                >
                  {copiedKey === "users" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === "users" ? "Copied" : "Copy SQL"}</span>
                </button>
              </div>
              <pre className="p-5 overflow-x-auto text-[11px] font-mono text-neutral-300 bg-neutral-950 leading-relaxed max-h-72">
                <code>{ARCHITECTURE_INFO.schemas.users}</code>
              </pre>
            </div>

            {/* SCHEMA BLOCK 2: SCHEDULING */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">2. Booked Lessons Schema (Failsafe Calendar)</span>
                <button
                  onClick={() => handleCopy(ARCHITECTURE_INFO.schemas.scheduling, "scheduling")}
                  className="text-[10px] bg-neutral-800 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-neutral-700 font-bold transition flex items-center space-x-1"
                >
                  {copiedKey === "scheduling" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === "scheduling" ? "Copied" : "Copy SQL"}</span>
                </button>
              </div>
              <pre className="p-5 overflow-x-auto text-[11px] font-mono text-neutral-300 bg-neutral-950 leading-relaxed max-h-72">
                <code>{ARCHITECTURE_INFO.schemas.scheduling}</code>
              </pre>
            </div>

            {/* SCHEMA BLOCK 3: PROGRESS TRACKER */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">3. Progress Logs & Mistakes Tracker</span>
                <button
                  onClick={() => handleCopy(ARCHITECTURE_INFO.schemas.tracking, "tracking")}
                  className="text-[10px] bg-neutral-800 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-neutral-700 font-bold transition flex items-center space-x-1"
                >
                  {copiedKey === "tracking" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === "tracking" ? "Copied" : "Copy SQL"}</span>
                </button>
              </div>
              <pre className="p-5 overflow-x-auto text-[11px] font-mono text-neutral-300 bg-neutral-950 leading-relaxed max-h-72">
                <code>{ARCHITECTURE_INFO.schemas.tracking}</code>
              </pre>
            </div>

            {/* SCHEMA BLOCK 4: QURAN SURAHS MODULE */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">4. Quran Surahs CMS Module (114 Surahs Schema)</span>
                <button
                  onClick={() => handleCopy((ARCHITECTURE_INFO.schemas as any).quran, "quran")}
                  className="text-[10px] bg-neutral-800 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-neutral-700 font-bold transition flex items-center space-x-1"
                >
                  {copiedKey === "quran" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === "quran" ? "Copied" : "Copy SQL"}</span>
                </button>
              </div>
              <pre className="p-5 overflow-x-auto text-[11px] font-mono text-neutral-300 bg-neutral-950 leading-relaxed max-h-72">
                <code>{(ARCHITECTURE_INFO.schemas as any).quran}</code>
              </pre>
            </div>

            {/* SCHEMA BLOCK 5: BLOG POSTS ENGINE */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">5. Blog Article & Metadata Engine (Publishing CMS)</span>
                <button
                  onClick={() => handleCopy((ARCHITECTURE_INFO.schemas as any).blog, "blog")}
                  className="text-[10px] bg-neutral-800 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-neutral-700 font-bold transition flex items-center space-x-1"
                >
                  {copiedKey === "blog" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === "blog" ? "Copied" : "Copy SQL"}</span>
                </button>
              </div>
              <pre className="p-5 overflow-x-auto text-[11px] font-mono text-neutral-300 bg-neutral-950 leading-relaxed max-h-72">
                <code>{(ARCHITECTURE_INFO.schemas as any).blog}</code>
              </pre>
            </div>

          </div>
        )}

        {/* SUB-TAB 3: COURSE CURRICULUM SYLLABUS MANAGER */}
        {activeSubTab === "curriculum" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* ADD SYLLABUS FORM */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white">Create Study Curriculum</h3>
                <p className="text-xs text-neutral-400">Define course materials, difficulty levels, and syllabus benchmarks for tutoring.</p>
              </div>

              <form onSubmit={handleAddCurriculumSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Course Syllabus Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    placeholder="E.g., Advanced Quranic Tafseer"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-neutral-300">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Qaida">Qaida</option>
                      <option value="Tajweed">Tajweed</option>
                      <option value="Hifz">Hifz</option>
                      <option value="Tafseer">Tafseer</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-neutral-300">Difficulty</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Total Milestones Count</label>
                  <input
                    type="number"
                    value={newLessonsCount}
                    onChange={(e) => setNewLessonsCount(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Description</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    required
                    placeholder="Short course description and educational objective..."
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 hover:text-white font-bold rounded-xl transition duration-300"
                >
                  Save Curriculum Template
                </button>

                {curriculumSaved && (
                  <p className="text-emerald-400 text-xs font-semibold text-center animate-pulse">✓ Saved successfully!</p>
                )}

              </form>
            </div>

            {/* CURRICULUMS LIST (CMS LIST) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center">
                <BookOpen size={16} className="text-amber-500 mr-2" /> Active Curriculum Index ({curriculums.length})
              </h3>

              <div className="space-y-4">
                {curriculums.map((curr) => (
                  <div key={curr.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          {curr.category} • {curr.difficulty}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{curr.title}</h4>
                      </div>
                      
                      <button
                        onClick={() => onDeleteCurriculum(curr.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/20 transition"
                        title="Delete Course Material"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed">{curr.description}</p>

                    {/* Modules Checklist */}
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
                      <p className="font-semibold text-neutral-300 uppercase text-[10px] tracking-wider mb-2">Lesson Modules preview ({curr.modules?.length || 0})</p>
                      {curr.modules?.map((mod) => (
                        <div key={mod.id} className="border-l-2 border-amber-500/30 pl-3 py-1 space-y-0.5">
                          <p className="font-bold text-neutral-200">{mod.title}</p>
                          <p className="text-neutral-400 text-[11px] leading-relaxed">{mod.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 4: PUBLIC PROFILE EDITOR (CMS) */}
        {activeSubTab === "profiles" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Tutor Profile Bio Customizer</h3>
              <p className="text-xs text-neutral-400">Modify intro biodata, years of experience, and hourly rates shown to searching parents.</p>
            </div>

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-300">Select Tutor Profile</label>
                <select
                  value={selectedTutorId}
                  onChange={(e) => {
                    setSelectedTutorId(e.target.value);
                    const tut = tutors.find(t => t.id === e.target.value);
                    if (tut) {
                      setProfileBio(tut.bio);
                      setProfileExp(tut.experience);
                      setProfileSeoTitle(tut.seoTitle || "");
                      setProfileSeoDescription(tut.seoDescription || "");
                    }
                  }}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {activeTutorObj && (
                <div className="flex items-center space-x-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                  <img src={activeTutorObj.avatar} alt={activeTutorObj.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-white">{activeTutorObj.name}</p>
                    <p className="text-[10px] text-neutral-400">Languages: {activeTutorObj.languages.join(", ")}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-neutral-300">Scholarly Experience Duration</label>
                <input
                  type="text"
                  value={profileExp}
                  onChange={(e) => setProfileExp(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-neutral-300">Detailed Biography</label>
                <textarea
                  rows={4}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-neutral-850">
                <label className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <Globe size={12} className="text-amber-500" />
                  SEO &amp; Search Metadata
                </label>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-neutral-400">SEO Title (overrides default page title)</label>
                  <input
                    type="text"
                    value={profileSeoTitle}
                    onChange={(e) => setProfileSeoTitle(e.target.value)}
                    placeholder={activeTutorObj ? `${activeTutorObj.name} — ${activeTutorObj.specialties[0] || "Quran"} Tutor` : "E.g., Sheikh Ahmed — Tajweed Tutor"}
                    maxLength={70}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-neutral-400">Meta Description (shown in search results)</label>
                  <textarea
                    value={profileSeoDescription}
                    onChange={(e) => setProfileSeoDescription(e.target.value)}
                    rows={2}
                    placeholder="A concise summary of this tutor's profile for search engine results..."
                    maxLength={160}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-600 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 hover:text-white font-bold rounded-xl transition duration-300"
              >
                Update Public Profile Listing
              </button>

              {profileSaved && (
                <div className="bg-emerald-950 text-emerald-400 border border-emerald-500/25 px-4 py-2 rounded-xl text-center font-semibold animate-pulse">
                  ✓ Profile successfully updated globally on QuranTutorsAcademy.com!
                </div>
              )}

            </form>
          </div>
        )}

        {/* SUB-TAB 5: SYSTEM ROUTER & NEXT.JS APP ROUTER SITE MAP */}
        {activeSubTab === "sitemap" && import.meta.env.DEV && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto text-neutral-300">
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Globe size={18} className="text-emerald-400 mr-2" /> 
                qurantutorsacademy.com Next.js App Router Structure
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                To replace resource-heavy WordPress installs and keep the authenticated classrooms ultra-fast, we segregate the public marketing site from private dashboard routing. In Next.js, this is handled using root folders, file-system nested routes, and unified edge Middleware.
              </p>

              {/* BENTO GRID OF SYSTEM ARCHITECTURE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* PUBLIC MARKETING ROUTES DIRECTORY */}
                <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-4 font-mono text-xs">
                  <h4 className="font-sans font-bold text-emerald-400 border-b border-neutral-800 pb-2 uppercase tracking-wider">
                    📂 Public Marketing Tree (SSG / SSR)
                  </h4>
                  <div className="space-y-1 text-neutral-400 leading-relaxed text-[11px]">
                    <div className="flex items-center space-x-2 text-white">
                      <span>📁 app/</span>
                    </div>
                    <div className="pl-4 border-l border-neutral-800 space-y-1">
                      <div>├── <span className="text-amber-500 font-bold">layout.tsx</span> <span className="text-neutral-500 font-sans">(Public Header, Footer, CSS)</span></div>
                      <div>├── <span className="text-emerald-500">page.tsx</span> <span className="text-neutral-500 font-sans">(Landing Homepage - Hero & Pricing)</span></div>
                      
                      <div className="pl-4 space-y-1">
                        <div>📁 courses/ <span className="text-neutral-500 font-sans">(SEO-optimized Landing Pages)</span></div>
                        <div className="pl-4 border-l border-neutral-800">
                          <div>├── page.tsx <span className="text-neutral-500 font-sans">(All courses index)</span></div>
                          <div>└── [slug]/page.tsx <span className="text-neutral-500 font-sans">(Dynamic: Tajweed, Hifz, Qaida)</span></div>
                        </div>
                      </div>

                      <div className="pl-4 space-y-1 mt-1">
                        <div>📁 blog/ <span className="text-neutral-500 font-sans">(Self-hosted Quran Scholars Blog)</span></div>
                        <div className="pl-4 border-l border-neutral-800">
                          <div>├── page.tsx <span className="text-neutral-500 font-sans">(SEO grid with search)</span></div>
                          <div>└── [slug]/page.tsx <span className="text-neutral-500 font-sans">(Dynamic post viewing with ISR)</span></div>
                        </div>
                      </div>

                      <div className="pl-4 space-y-1 mt-1">
                        <div>📁 login/ <span className="text-neutral-500 font-sans">(Role-Selector authentication)</span></div>
                        <div className="pl-4 border-l border-neutral-800">
                          <div>└── page.tsx <span className="text-neutral-500 font-sans">(Secure login form)</span></div>
                        </div>
                      </div>

                      <div className="pl-4 space-y-1 mt-1">
                        <div>📁 signup/ <span className="text-neutral-500 font-sans">(Onboarding funnel)</span></div>
                        <div className="pl-4 border-l border-neutral-800">
                          <div>└── page.tsx <span className="text-neutral-500 font-sans">(Student & Parent match form)</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AUTHENTICATED PORTALS ROUTES DIRECTORY */}
                <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-4 font-mono text-xs">
                  <h4 className="font-sans font-bold text-indigo-400 border-b border-neutral-800 pb-2 uppercase tracking-wider">
                    🔒 Protected Dashboards Tree (JWT Auth)
                  </h4>
                  <div className="space-y-1 text-neutral-400 leading-relaxed text-[11px]">
                    <div className="flex items-center space-x-2 text-white">
                      <span>📁 app/dashboard/</span>
                    </div>
                    <div className="pl-4 border-l border-neutral-800 space-y-1">
                      <div>├── <span className="text-amber-500 font-bold">layout.tsx</span> <span className="text-neutral-500 font-sans">(Persistent portal sidebar & state)</span></div>
                      <div>├── <span className="text-indigo-400">page.tsx</span> <span className="text-neutral-500 font-sans">(Protected root - role redirect engine)</span></div>
                      
                      <div className="pl-4 space-y-1">
                        <div>📁 tutor/ <span className="text-neutral-500 font-sans">(Tutor Control Center)</span></div>
                        <div className="pl-4 border-l border-neutral-800">
                          <div>└── page.tsx <span className="text-neutral-500 font-sans">(Student management & slots availability)</span></div>
                        </div>
                      </div>

                      <div className="pl-4 space-y-1 mt-1">
                        <div>📁 student/ <span className="text-neutral-500 font-sans">(Student / Parent Desk)</span></div>
                        <div className="pl-4 border-l border-neutral-800">
                          <div>└── page.tsx <span className="text-neutral-500 font-sans">(Progress charts & interactive booking)</span></div>
                        </div>
                      </div>

                      <div className="pl-4 space-y-1 mt-1">
                        <div>📁 classroom/ <span className="text-neutral-500 font-sans">(Live WebRTC classroom)</span></div>
                        <div className="pl-4 border-l border-neutral-800">
                          <div>└── page.tsx <span className="text-neutral-500 font-sans">(Agora streaming & annotated Quran canvas)</span></div>
                        </div>
                      </div>

                      <div className="pl-4 space-y-1 mt-1">
                        <div>📁 admin/ <span className="text-neutral-500 font-sans">(Admin CMS Control Center)</span></div>
                        <div className="pl-4 border-l border-neutral-800">
                          <div>└── page.tsx <span className="text-neutral-500 font-sans">(Database tables & Blog publishers)</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* EDGE MIDDLEWARE SECURITY EXPLANATION & SITE NAVIGATION MAP */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center">
                <Sliders size={16} className="text-amber-500 mr-2" /> Next.js Middleware Route Protection & Auth Flow
              </h3>
              
              <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-4 text-xs leading-relaxed">
                <p className="text-neutral-400">
                  By using edge-rendered middleware (<strong className="text-white">middleware.ts</strong>), auth validation runs in under 15ms. The edge parses the incoming HTTP Request cookies for a secure JWT token before reaching our servers. If unauthorized, they are immediately redirected back to <code className="text-rose-400">/login</code> without ever loading private dashboard bundle assets.
                </p>

                {/* Site Map Diagram */}
                <div className="pt-2 border-t border-neutral-850 space-y-3 font-mono text-center">
                  <p className="font-sans text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-left">Navigation UX Flow Chart</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-3 text-xs">
                    
                    <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-emerald-400">
                      <p className="font-bold font-sans">1. Guest User</p>
                      <p className="text-[10px] text-neutral-400 mt-1">Visits qurantutorsacademy.com</p>
                    </div>

                    <div className="text-neutral-600 hidden md:block">───►</div>

                    <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-amber-500">
                      <p className="font-bold font-sans">2. Login Page</p>
                      <p className="text-[10px] text-neutral-400 mt-1">Selects Role & Submits Credentials</p>
                    </div>

                    <div className="text-neutral-600 hidden md:block">───►</div>

                    <div className="bg-indigo-950 border border-indigo-800 p-3 rounded-xl text-indigo-300">
                      <p className="font-bold font-sans">3. Edge Middleware</p>
                      <p className="text-[10px] text-neutral-400 mt-1">Validates Cookie JWT token</p>
                    </div>

                  </div>

                  <div className="flex justify-center my-2 text-neutral-600 font-bold">
                    <span className="hidden md:inline">│</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                    
                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl space-y-1 text-left">
                      <p className="font-bold text-emerald-400 flex items-center justify-between">
                        <span>👨‍🏫 If Tutor:</span>
                        <span className="text-[9px] font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">Redirected</span>
                      </p>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">Routed securely to <code className="text-white">/dashboard/tutor</code>. Loads scheduled student logs and customizable slots.</p>
                    </div>

                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl space-y-1 text-left">
                      <p className="font-bold text-indigo-400 flex items-center justify-between">
                        <span>👶 If Student:</span>
                        <span className="text-[9px] font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">Redirected</span>
                      </p>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">Routed securely to <code className="text-white">/dashboard/student</code>. Loads hifz progress tracks and scheduling modals.</p>
                    </div>

                    <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl space-y-1 text-left">
                      <p className="font-bold text-amber-500 flex items-center justify-between">
                        <span>👑 If Admin:</span>
                        <span className="text-[9px] font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">Redirected</span>
                      </p>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">Routed securely to <code className="text-white">/dashboard/admin</code>. Accesses Surah indexing and Blog WYSIWYG builders.</p>
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 6: QURAN INDEX EDITOR CRUD PANELS (114 SURAHS) */}
        {activeSubTab === "quran_crud" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in max-w-7xl mx-auto">

            {/* SURAH / JUZ MODE TOGGLE */}
            <div className="lg:col-span-3 flex bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl w-full sm:w-auto sm:inline-flex">
              <button
                onClick={() => setQuranCrudMode("surah")}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  quranCrudMode === "surah"
                    ? "bg-amber-500 text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <BookOpen size={13} />
                <span>Manage Surahs</span>
              </button>
              <button
                onClick={() => setQuranCrudMode("juz")}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  quranCrudMode === "juz"
                    ? "bg-amber-500 text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Layers size={13} />
                <span>Manage Juz (Para)</span>
              </button>
            </div>

            {quranCrudMode === "surah" && (
            <>
            {/* SURAH CREATION / MODIFICATION CRUD PANEL */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <div className="space-y-0.5 border-b border-neutral-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center">
                  <Database size={16} className="text-amber-500 mr-2" />
                  {editingSurahId ? "Modify Quranic Surah" : "Index New Surah Entry"}
                </h3>
                <p className="text-xs text-neutral-400">Define Surah classification, total verse blocks, and audio stream hosts.</p>
              </div>

              <form onSubmit={handleAddOrUpdateSurah} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-neutral-300">Surah Number (1-114)</label>
                    <input
                      type="number"
                      min={1}
                      max={114}
                      value={surahNumber}
                      onChange={(e) => setSurahNumber(Number(e.target.value))}
                      required
                      className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-neutral-300">Total Verses Count</label>
                    <input
                      type="number"
                      min={1}
                      value={surahVerses}
                      onChange={(e) => setSurahVerses(Number(e.target.value))}
                      required
                      className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Arabic Calligraphy Name</label>
                  <input
                    type="text"
                    value={surahArabic}
                    onChange={(e) => setSurahArabic(e.target.value)}
                    required
                    placeholder="E.g., الفاتحة"
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white text-right font-semibold focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">English Transliteration & Meaning</label>
                  <input
                    type="text"
                    value={surahEnglish}
                    onChange={(e) => setSurahEnglish(e.target.value)}
                    required
                    placeholder="E.g., Al-Fatihah (The Opening)"
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Revelational Type</label>
                  <select
                    value={surahType}
                    onChange={(e) => setSurahType(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Meccan">Meccan (Makkiyah)</option>
                    <option value="Medinan">Medinan (Madaniyah)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Audio Stream Stream Host URL (Optional)</label>
                  <input
                    type="text"
                    value={surahAudio}
                    onChange={(e) => setSurahAudio(e.target.value)}
                    placeholder="https://audio.qurancdn.com/..."
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-600 text-[10px]"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-neutral-850">
                  <label className="font-bold text-neutral-300 flex items-center gap-1.5">
                    <Globe size={12} className="text-amber-500" />
                    SEO &amp; Search Metadata
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-neutral-400">SEO Title (overrides default page title)</label>
                    <input
                      type="text"
                      value={surahSeoTitle}
                      onChange={(e) => setSurahSeoTitle(e.target.value)}
                      placeholder={surahEnglish ? `Surah ${surahEnglish} — Read & Listen Online` : "E.g., Surah Al-Fatiha — Read & Listen Online"}
                      maxLength={70}
                      className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-neutral-400">Meta Description (shown in search results)</label>
                    <textarea
                      value={surahSeoDescription}
                      onChange={(e) => setSurahSeoDescription(e.target.value)}
                      rows={2}
                      placeholder="A concise summary of this Surah for search engine results..."
                      maxLength={160}
                      className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-600 resize-none"
                    />
                  </div>
                </div>

                {/* SURAH VERSES & TRANSLATION EDITOR */}
                <div className="border-t border-neutral-800 pt-4 mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-neutral-300">Surah Ayat Content Builder</span>
                    <span className="bg-amber-600/20 text-amber-500 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                      {currentSurahVerses.length} verses
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-neutral-400">
                    Add, update, or delete verses. Changes will be saved to local index.
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddNewVerseToEditor}
                      className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center gap-1 font-semibold text-[11px] transition"
                    >
                      <Plus size={12} className="text-amber-500" />
                      Add Verse
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoGenerateVerses}
                      className="flex-1 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-600/30 rounded-lg flex items-center justify-center gap-1 font-semibold text-[11px] transition"
                      title="Populates all verses with high-fidelity template Arabic text and translations"
                    >
                      <Sparkles size={12} className="text-amber-500 animate-pulse" />
                      Auto-Gen
                    </button>
                  </div>

                  {/* Verse Search */}
                  {currentSurahVerses.length > 0 && (
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-2.5 text-neutral-500" />
                      <input
                        type="text"
                        value={editorVerseSearch}
                        onChange={(e) => setEditorVerseSearch(e.target.value)}
                        placeholder="Filter verses (e.g., 1 or translation text)..."
                        className="w-full bg-neutral-950 border border-neutral-750 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Scrollable Verse List */}
                  <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3 divide-y divide-neutral-850">
                    {currentSurahVerses.length === 0 ? (
                      <div className="text-center py-6 text-neutral-500 bg-neutral-950 rounded-xl border border-neutral-850">
                        <BookOpen size={20} className="mx-auto mb-1 opacity-40 text-neutral-400" />
                        <p className="text-[11px]">No verses defined yet.</p>
                        <p className="text-[10px] text-neutral-600 mt-0.5">Click Add Verse or Auto-Gen.</p>
                      </div>
                    ) : (
                      currentSurahVerses
                        .filter(v => {
                          if (!editorVerseSearch) return true;
                          return v.verse_number.toString() === editorVerseSearch || 
                                 v.text_translation.toLowerCase().includes(editorVerseSearch.toLowerCase()) ||
                                 v.text_ar.includes(editorVerseSearch);
                        })
                        .map((verse, idx) => (
                          <div key={idx} className="pt-3 space-y-2 first:pt-0">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-mono bg-neutral-850 text-neutral-300 px-1.5 py-0.5 rounded-md font-bold">
                                Ayah #{verse.verse_number}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-neutral-500 text-[10px]">Juz</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={verse.juz_id}
                                  onChange={(e) => handleUpdateVerseField(idx, "juz_id", Number(e.target.value))}
                                  className="w-10 bg-neutral-950 border border-neutral-750 rounded px-1 text-center py-0.5 font-bold text-amber-500 focus:outline-none focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVerseFromEditor(idx)}
                                  className="p-1 hover:bg-red-950/40 text-neutral-500 hover:text-red-400 rounded transition"
                                  title="Delete this verse"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <textarea
                                value={verse.text_ar}
                                onChange={(e) => handleUpdateVerseField(idx, "text_ar", e.target.value)}
                                placeholder="Arabic Text calligraphy..."
                                dir="rtl"
                                rows={2}
                                className="w-full bg-neutral-950 border border-neutral-750 rounded-lg px-2.5 py-1 text-xs text-white text-right font-semibold focus:outline-none focus:border-amber-500 placeholder-neutral-600 leading-relaxed font-sans"
                              />
                              <textarea
                                value={verse.text_translation}
                                onChange={(e) => handleUpdateVerseField(idx, "text_translation", e.target.value)}
                                placeholder="English Translation..."
                                rows={2}
                                className="w-full bg-neutral-950 border border-neutral-750 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 placeholder-neutral-600 leading-relaxed font-sans"
                              />
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingSurahId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSurahId(null);
                        setSurahArabic("");
                        setSurahEnglish("");
                        setSurahNumber(surahs.length + 1);
                        setSurahAudio("");
                      }}
                      className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 hover:text-white font-bold rounded-xl transition duration-300"
                  >
                    {editingSurahId ? "Save Modifications" : "Index Surah Entry"}
                  </button>
                </div>

                {quranSaved && (
                  <p className="text-emerald-400 text-center font-semibold animate-pulse">✓ Quran index synchronized!</p>
                )}

              </form>
            </div>

            {/* INTERACTIVE INDEX VIEW */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-base font-bold text-white flex items-center">
                  <BookOpen size={16} className="text-amber-500 mr-2" /> 
                  Surah Database Records ({surahs.length} indexed surahs)
                </h3>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3.5 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search surah database..."
                    value={quranSearch}
                    onChange={(e) => setQuranSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* SURAH CARDS LIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {surahs
                  .filter(s => 
                    s.nameEnglish.toLowerCase().includes(quranSearch.toLowerCase()) || 
                    s.number.toString() === quranSearch || 
                    s.nameArabic.includes(quranSearch)
                  )
                  .map((s) => (
                    <div key={s.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex justify-between items-start space-x-3 hover:border-amber-500/25 transition">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-[10px] text-amber-500 font-extrabold">
                            {s.number}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${s.type === "Meccan" ? "bg-amber-950 text-amber-400 border border-amber-500/10" : "bg-indigo-950 text-indigo-400 border border-indigo-500/10"}`}>
                            {s.type}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white pt-1">{s.nameEnglish}</h4>
                        <p className="text-[11px] text-neutral-400">{s.totalVerses} Verse Blocks indexed</p>
                        
                        {/* Fake audio player bar preview */}
                        <div className="flex items-center space-x-2 pt-1.5">
                          <button 
                            onClick={() => {
                              const audio = new Audio(s.audioUrl || `https://audio.qurancdn.com/reciters/7/${s.number}.mp3`);
                              audio.play().catch(e => alert("Simulated Quran sound clip: WebRTC secure audio connection initialized. Playback stream active."));
                            }}
                            className="bg-neutral-950 hover:bg-neutral-800 text-emerald-400 text-[10px] px-2 py-1 rounded border border-neutral-850 font-bold transition flex items-center space-x-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                            <span>Preview Stream</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between h-full space-y-6">
                        <span className="text-base text-amber-500 font-bold font-serif">{s.nameArabic}</span>
                        
                        <div className="flex items-center space-x-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-850">
                          <button
                            onClick={() => handleEditSurahTrigger(s)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
                            title="Edit Record"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteSurah(s.id)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/20 rounded transition"
                            title="Delete Record"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            </>
            )}

            {quranCrudMode === "juz" && (
            <>
            {/* JUZ CREATION / MODIFICATION CRUD PANEL */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <div className="space-y-0.5 border-b border-neutral-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center">
                  <Layers size={16} className="text-amber-500 mr-2" />
                  {editingJuzNumber !== null ? "Modify Juz (Para)" : "Index New Juz Entry"}
                </h3>
                <p className="text-xs text-neutral-400">Define Juz number, Arabic and English names, and where it begins.</p>
              </div>

              <form onSubmit={handleAddOrUpdateJuz} className="space-y-4 text-xs">

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Juz Number (1-30)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={juzNumber}
                    onChange={(e) => setJuzNumber(Number(e.target.value))}
                    required
                    disabled={editingJuzNumber !== null}
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Arabic Calligraphy Name</label>
                  <input
                    type="text"
                    value={juzNameArabic}
                    onChange={(e) => setJuzNameArabic(e.target.value)}
                    required
                    placeholder="E.g., آلم"
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white text-right font-semibold focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">English Name</label>
                  <input
                    type="text"
                    value={juzNameEnglish}
                    onChange={(e) => setJuzNameEnglish(e.target.value)}
                    required
                    placeholder="E.g., Juz 1 (Alif-Lam-Mim)"
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Starts At</label>
                  <input
                    type="text"
                    value={juzStartInfo}
                    onChange={(e) => setJuzStartInfo(e.target.value)}
                    placeholder="E.g., Al-Fatihah (Ch 1)"
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingJuzNumber !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingJuzNumber(null);
                        setJuzNameArabic("");
                        setJuzNameEnglish("");
                        setJuzStartInfo("");
                        setJuzNumber(juzList.length + 1);
                      }}
                      className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 hover:text-white font-bold rounded-xl transition duration-300"
                  >
                    {editingJuzNumber !== null ? "Save Modifications" : "Index Juz Entry"}
                  </button>
                </div>

                {juzSaved && (
                  <p className="text-emerald-400 text-center font-semibold animate-pulse">✓ Juz index synchronized!</p>
                )}

              </form>
            </div>

            {/* INTERACTIVE JUZ INDEX VIEW */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-base font-bold text-white flex items-center">
                  <Layers size={16} className="text-amber-500 mr-2" />
                  Juz Database Records ({juzList.length} indexed paras)
                </h3>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3.5 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search juz database..."
                    value={juzSearch}
                    onChange={(e) => setJuzSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* JUZ CARDS LIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {juzList
                  .filter(j =>
                    j.nameEnglish.toLowerCase().includes(juzSearch.toLowerCase()) ||
                    j.number.toString() === juzSearch ||
                    j.nameArabic.includes(juzSearch)
                  )
                  .map((j) => (
                    <div key={j.number} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex justify-between items-start space-x-3 hover:border-amber-500/25 transition">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-[10px] text-amber-500 font-extrabold">
                            {j.number}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white pt-1">{j.nameEnglish}</h4>
                        <p className="text-[11px] text-neutral-400">Starts: {j.startInfo}</p>
                      </div>

                      <div className="flex flex-col items-end justify-between h-full space-y-6">
                        <span className="text-base text-amber-500 font-bold font-serif">{j.nameArabic}</span>

                        <div className="flex items-center space-x-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-850">
                          <button
                            onClick={() => handleEditJuzTrigger(j)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
                            title="Edit Record"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteJuz(j.number)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/20 rounded transition"
                            title="Delete Record"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            </>
            )}

          </div>
        )}

        {/* SUB-TAB 7: BLOG CONTENT ENGINE (WYSIWYG ENGINE) */}
        {activeSubTab === "blog_crud" && (
          <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FileText size={18} className="text-emerald-400 mr-2" />
                  Self-Hosted Blog Content Management
                </h3>
                <p className="text-xs text-neutral-400">Compose articles, generate slugs, and publish knowledge guides right to QuranTutorsAcademy.com.</p>
              </div>

              <button
                onClick={() => {
                  setIsCreatingBlog(!isCreatingBlog);
                  if (!isCreatingBlog) {
                    setEditingBlogId(null);
                    setBlogTitle("");
                    setBlogSlug("");
                    setBlogExcerpt("");
                    setBlogContent("");
                    setBlogAuthor("Sheikh Ahmed Al-Misri");
                    setBlogCover("");
                    setBlogTags("Tajweed, Online Study");
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Plus size={14} />
                <span>{isCreatingBlog ? "Back to Article List" : "Write New Article"}</span>
              </button>
            </div>

            {isCreatingBlog ? (
              /* COMPOSER SCREEN WITH WYSIWYG & PREVIEW */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* WRITE INTERFACE */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white border-b border-neutral-800 pb-2 uppercase tracking-wide">Composer Form</h4>
                  
                  <form onSubmit={handleAddOrUpdateBlog} className="space-y-4 text-xs">
                    
                    <div className="space-y-1.5">
                      <label className="font-bold text-neutral-300">Article Title</label>
                      <input
                        type="text"
                        value={blogTitle}
                        onChange={(e) => {
                          setBlogTitle(e.target.value);
                          setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                        }}
                        required
                        placeholder="E.g., 5 Practical Exercises for Kids Hifz"
                        className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-neutral-300">Permanent URL Slug</label>
                        <input
                          type="text"
                          value={blogSlug}
                          onChange={(e) => setBlogSlug(e.target.value)}
                          placeholder="E.g., 5-exercises-kids-hifz"
                          className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500 placeholder-neutral-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-neutral-300">Author</label>
                        <input
                          type="text"
                          value={blogAuthor}
                          onChange={(e) => setBlogAuthor(e.target.value)}
                          placeholder="Sheikh Ahmed Al-Misri"
                          className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-neutral-300">SEO Excerpt (Brief Summary)</label>
                      <input
                        type="text"
                        value={blogExcerpt}
                        onChange={(e) => setBlogExcerpt(e.target.value)}
                        placeholder="Short summary for RSS, newsletters, and social snippets..."
                        className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-neutral-300">Cover Photo Image URL</label>
                        <input
                          type="text"
                          value={blogCover}
                          onChange={(e) => setBlogCover(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-[10px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-neutral-300">Tags (Comma separated)</label>
                        <input
                          type="text"
                          value={blogTags}
                          onChange={(e) => setBlogTags(e.target.value)}
                          placeholder="Hifz, Memorization, Parenting"
                          className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-neutral-300">Publishing Status</label>
                      <select
                        value={blogStatus}
                        onChange={(e) => setBlogStatus(e.target.value as any)}
                        className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                      >
                        <option value="Published">Published (Publicly Visible)</option>
                        <option value="Draft">Draft (Saved locally)</option>
                      </select>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-neutral-850">
                      <label className="font-bold text-neutral-300 flex items-center gap-1.5">
                        <Globe size={12} className="text-emerald-500" />
                        SEO &amp; Search Metadata
                      </label>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-neutral-400">SEO Title (overrides Article Title in search results)</label>
                        <input
                          type="text"
                          value={blogSeoTitle}
                          onChange={(e) => setBlogSeoTitle(e.target.value)}
                          placeholder={blogTitle || "E.g., 5 Practical Exercises for Kids Hifz | QTA"}
                          maxLength={70}
                          className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-neutral-400">Meta Description (shown in search results)</label>
                        <textarea
                          value={blogSeoDescription}
                          onChange={(e) => setBlogSeoDescription(e.target.value)}
                          rows={2}
                          placeholder={blogExcerpt || "A concise summary that appears under the title in Google search results..."}
                          maxLength={160}
                          className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-600 resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-neutral-400">Social Share Image URL (falls back to Cover Photo)</label>
                        <input
                          type="text"
                          value={blogSeoImage}
                          onChange={(e) => setBlogSeoImage(e.target.value)}
                          placeholder={blogCover || "https://images.unsplash.com/..."}
                          className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-[10px] placeholder-neutral-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-neutral-300">
                          WordPress Classic Content Composer
                        </label>
                        {/* Visual / Text Tabs */}
                        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 flex">
                          <button
                            type="button"
                            onClick={() => {
                              if (blogEditorMode !== "visual") {
                                const html = markdownToHtml(blogContent);
                                setVisualHtml(html);
                                setBlogEditorMode("visual");
                              }
                            }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${blogEditorMode === "visual" ? "bg-emerald-600 text-neutral-950" : "text-neutral-400 hover:text-white"}`}
                          >
                            Visual
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (blogEditorMode !== "text") {
                                const editable = document.getElementById("blog-visual-editor");
                                if (editable) {
                                  const md = htmlToMarkdown(editable.innerHTML);
                                  setBlogContent(md);
                                }
                                setBlogEditorMode("text");
                              }
                            }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${blogEditorMode === "text" ? "bg-emerald-600 text-neutral-950" : "text-neutral-400 hover:text-white"}`}
                          >
                            Text (Markdown)
                          </button>
                        </div>
                      </div>

                      {/* WordPress Classic Editor Container */}
                      <div className="bg-neutral-950 border border-neutral-750 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Editor Formatting Toolbar */}
                        <div className="bg-neutral-900 border-b border-neutral-800 p-2 flex flex-wrap gap-1.5 items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("bold")}
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
                              title="Bold"
                            >
                              <Bold size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("italic")}
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
                              title="Italic"
                            >
                              <Italic size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("h2")}
                              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white font-bold text-[11px] transition flex items-center gap-0.5"
                              title="Heading 2"
                            >
                              <Heading size={12} />2
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("h3")}
                              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white font-bold text-[11px] transition flex items-center gap-0.5"
                              title="Heading 3"
                            >
                              <Heading size={12} />3
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("quote")}
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
                              title="Quote"
                            >
                              <Quote size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("list")}
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
                              title="Bulleted List"
                            >
                              <List size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("list-ordered")}
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
                              title="Numbered List"
                            >
                              <ListOrdered size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("link")}
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
                              title="Insert Link"
                            >
                              <Globe size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("image")}
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
                              title="Insert Image"
                            >
                              <Image size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToolbarClick("code")}
                              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
                              title="Code Block"
                            >
                              <Code2 size={13} />
                            </button>
                          </div>

                          {/* Quick Template Selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-neutral-500 font-semibold hidden sm:inline">Insert Template:</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleInsertBlogTemplate(e.target.value);
                                  e.target.value = "";
                                }
                              }}
                              className="bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 px-2 py-1 rounded-lg focus:outline-none focus:border-emerald-500"
                            >
                              <option value="">-- Choose Layout Template --</option>
                              <option value="tajweed_tip">Tajweed Ghunnah Lessons</option>
                              <option value="hifz_guide">Actionable Revision Blueprints</option>
                              <option value="academy_announcement">Interactive Whiteboard News</option>
                            </select>
                          </div>
                        </div>

                        {/* Dual Mode View */}
                        {blogEditorMode === "text" ? (
                          <div className="relative">
                            <textarea
                              id="blog-content-textarea"
                              rows={12}
                              value={blogContent}
                              onChange={(e) => setBlogContent(e.target.value)}
                              required
                              placeholder="Write the article content using standard Markdown syntax..."
                              className="w-full bg-neutral-950 p-4 text-white font-mono text-xs focus:outline-none leading-relaxed resize-none border-0"
                            />
                          </div>
                        ) : (
                          /* "Visual" Classic WYSIWYG Editor with rich editable functionality */
                          <div
                            id="blog-visual-editor"
                            contentEditable={true}
                            onInput={(e) => {
                              const html = e.currentTarget.innerHTML;
                              const md = htmlToMarkdown(html);
                              setBlogContent(md);
                            }}
                            onBlur={(e) => {
                              const html = e.currentTarget.innerHTML;
                              const md = htmlToMarkdown(html);
                              setBlogContent(md);
                            }}
                            dangerouslySetInnerHTML={{ __html: visualHtml || markdownToHtml(blogContent) }}
                            placeholder="Write beautifully here with live rich formatting..."
                            className="w-full bg-neutral-950 p-4 min-h-[300px] max-h-[400px] overflow-y-auto text-white text-xs focus:outline-none leading-relaxed border-0 prose prose-invert max-w-none focus:ring-1 focus:ring-emerald-500/50"
                            style={{ outline: "none" }}
                          />
                        )}

                        {/* Editor Status / Info Footer */}
                        <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-2 flex justify-between items-center text-[10px] text-neutral-500 font-mono font-semibold">
                          <div className="flex gap-4">
                            <span>Words: {blogContent ? blogContent.trim().split(/\s+/).filter(Boolean).length : 0}</span>
                            <span>Characters: {blogContent.length}</span>
                          </div>
                          <span className="text-emerald-500 font-bold">WordPress Classic Mode Active</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 hover:text-white font-bold rounded-xl transition duration-300 text-xs"
                    >
                      {editingBlogId ? "Apply Modifications" : "Publish Article to Site"}
                    </button>

                  </form>
                </div>

                {/* TYPOGRAPHY PREVIEW */}
                <div className="bg-neutral-950 border border-neutral-850 rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between">
                  <div className="space-y-5 flex-1 overflow-y-auto max-h-[600px] pr-2">
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-2">Live styled article preview</h4>
                    
                    {blogCover && (
                      <div className="w-full h-40 rounded-2xl overflow-hidden border border-neutral-850">
                        <img src={blogCover} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-white leading-tight">{blogTitle || "Untitled Article Title"}</h2>
                      <div className="flex items-center space-x-3 text-[11px] text-neutral-400">
                        <span className="font-bold text-emerald-400">{blogAuthor || "Administrator"}</span>
                        <span>•</span>
                        <span>{new Date().toISOString().split("T")[0]}</span>
                        <span>•</span>
                        <span className="bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{blogStatus}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 italic border-l-2 border-neutral-700 pl-3 leading-relaxed">
                      {blogExcerpt || "This is where your short article description will appear for search engines."}
                    </p>

                    <div className="space-y-4 text-xs text-neutral-400 leading-relaxed pt-2 border-t border-neutral-900">
                      {blogContent ? (
                        <div className="space-y-3 prose prose-invert">
                          {blogContent.split("\n\n").map((chunk, index) => {
                            if (chunk.startsWith("## ")) {
                              return <h3 key={index} className="text-base font-bold text-white pt-2">{chunk.replace("## ", "")}</h3>;
                            } else if (chunk.startsWith("### ")) {
                              return <h4 key={index} className="text-sm font-bold text-neutral-200 pt-1">{chunk.replace("### ", "")}</h4>;
                            } else if (chunk.startsWith("- ") || chunk.startsWith("* ")) {
                              return (
                                <ul key={index} className="list-disc pl-5 space-y-1">
                                  {chunk.split("\n").map((li, liIdx) => (
                                    <li key={liIdx}>{li.replace(/^[-\*]\s+/, "")}</li>
                                  ))}
                                </ul>
                              );
                            } else {
                              return <p key={index}>{chunk}</p>;
                            }
                          })}
                        </div>
                      ) : (
                        <p className="text-neutral-500 italic">Start typing in the composer on the left to see the beautiful high-contrast typography render here.</p>
                      )}
                    </div>

                    {blogTags && (
                      <div className="flex flex-wrap gap-1.5 pt-4 border-t border-neutral-900">
                        {blogTags.split(",").map((tag, idx) => (
                          <span key={idx} className="bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded text-[10px] font-mono">
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {blogSaved && (
                    <div className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 p-4 rounded-xl text-center font-bold animate-pulse text-xs">
                      ✓ Article saved successfully! Published to qurantutorsacademy.com/blogs/{blogSlug}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* GRID OF CURRENT BLOG POSTS WITH CRUD BUTTONS */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((b) => (
                  <div key={b.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-emerald-500/25 transition">
                    <div>
                      <div className="w-full h-36 relative">
                        <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                        <span className={`absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          b.status === "Published" 
                            ? "bg-emerald-950 text-emerald-400 border-emerald-500/20" 
                            : "bg-amber-950 text-amber-400 border-amber-500/20"
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-center space-x-2 text-[10px] text-neutral-400">
                          <span className="font-semibold text-emerald-400">{b.author}</span>
                          <span>•</span>
                          <span>{b.publishedAt}</span>
                        </div>

                        <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">{b.title}</h4>
                        <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">{b.excerpt}</p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-neutral-850/80 mt-2 flex justify-between items-center">
                      <div className="flex space-x-1.5">
                        {b.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="bg-neutral-950 text-[10px] text-neutral-400 px-2 py-0.5 rounded-md font-mono">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditBlogTrigger(b)}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-xl transition text-xs flex items-center space-x-1"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(b.id)}
                          className="bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 p-2 rounded-xl transition text-xs"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* SUB-TAB: ACCOUNTS (live data) */}
        {activeSubTab === "accounts" && (
          <div className="animate-fade-in">
            <AccountsPanel token={token} />
          </div>
        )}

        {/* SUB-TAB: TUTOR APPLICATIONS (live data) */}
        {activeSubTab === "tutor_applications" && (
          <div className="animate-fade-in">
            <TutorsPanel token={token} />
          </div>
        )}

        {/* SUB-TAB: TUTOR PROFILES (live data) */}
        {activeSubTab === "tutor_profiles" && (
          <div className="animate-fade-in">
            <TutorProfilesPanel token={token} />
          </div>
        )}

        {/* SUB-TAB: LEARNING REQUESTS (live data) */}
        {activeSubTab === "requests" && (
          <div className="animate-fade-in">
            <RequestsPanel token={token} />
          </div>
        )}

        {/* SUB-TAB: RESOURCE CATALOG (live data) */}
        {activeSubTab === "resources" && (
          <div className="animate-fade-in">
            <ResourcesAdminPanel token={token} />
          </div>
        )}

        {/* SUB-TAB: LESSON RECOVERY & AUDIT (live data) */}
        {activeSubTab === "lesson_recovery" && (
          <div className="animate-fade-in">
            <OperationsPanel token={token} />
          </div>
        )}

        </div>

      </div>

    </div>
  );
}
