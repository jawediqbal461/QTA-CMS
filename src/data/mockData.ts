export interface Surah {
  id: string;
  number: number;
  nameArabic: string;
  nameEnglish: string;
  type: "Meccan" | "Medinan";
  totalVerses: number;
  audioUrl?: string;
  verses?: Array<{ verse_number: number; text_ar: string; text_translation: string; juz_id: number }>;
  // SEO — optional overrides for this surah's public page (/quran/:slug). Falls back to
  // generated defaults (name + verse count) when left blank.
  seoTitle?: string;
  seoDescription?: string;
}

export interface Juz {
  number: number;
  nameArabic: string;
  nameEnglish: string;
  startInfo: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  coverImage: string;
  status: "Draft" | "Published";
  publishedAt: string;
  tags: string[];
  // SEO — optional overrides for this post's public page (/blogs/:slug). Falls back to
  // title / excerpt / coverImage when left blank.
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
}

export interface Tutor {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  specialties: string[];
  experience: string;
  rating: number;
  studentsCount: number;
  lessonsCompleted: number;
  bio: string;
  videoUrl: string;
  timeZone: string;
  languages: string[];
  availability: {
    [key: string]: string[]; // e.g., "Monday": ["09:00", "10:00", "15:00"]
  };
  hourlyRate: number;
  // SEO — optional overrides for this tutor's public profile page (/tutors/:slug). Falls
  // back to name / bio / avatar when left blank.
  seoTitle?: string;
  seoDescription?: string;
}

export interface StudentProgress {
  currentBook: string; // e.g., "Noorani Qaida", "Holy Quran"
  currentChapter: string; // e.g., "Lesson 12", "Surah Al-Baqarah"
  currentVerse: number;
  juzMemorized: number[];
  surahsCompleted: string[];
  tajweedScore: number; // 0-100
  hifzProgress: number; // percentage
  attendanceRate: number; // percentage
  recentMistakes: {
    id: string;
    date: string;
    type: "Ghunnah" | "Madd" | "Makhraj" | "Qalqalah";
    description: string;
    severity: "minor" | "major";
  }[];
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  age: number;
  timeZone: string;
  assignedTutorId: string;
  progress: StudentProgress;
}

export interface Lesson {
  id: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  dateTime: string; // ISO String in UTC
  duration: number; // in minutes
  topic: string;
  status: "scheduled" | "completed" | "cancelled" | "live";
  notes?: string;
}

export interface Curriculum {
  id: string;
  title: string;
  category: "Qaida" | "Tajweed" | "Hifz" | "Tafseer";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lessonsCount: number;
  description: string;
  modules: {
    id: string;
    title: string;
    description: string;
    versesRange?: string;
  }[];
}

export const INITIAL_TUTORS: Tutor[] = [
  {
    id: "tutor-1",
    name: "Sheikh Ahmed Al-Misri",
    slug: "ahmed-al-misri",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    specialties: ["Ten Qira'at", "Advanced Tajweed Rules", "Hifz (Memorization)"],
    experience: "12 years",
    rating: 4.9,
    studentsCount: 14,
    lessonsCompleted: 1420,
    languages: ["Arabic", "English"],
    timeZone: "Africa/Cairo",
    bio: "Graduated from Al-Azhar University with a specialization in Quranic Sciences and Qira'at. Passionate about bringing authentic Tajweed methodology to students worldwide with patient, structured guidance.",
    videoUrl: "",
    availability: {
      Monday: ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
      Tuesday: ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
      Wednesday: ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
      Thursday: ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
      Saturday: ["09:00", "10:00", "11:00", "13:00", "14:00"]
    },
    hourlyRate: 30
  },
  {
    id: "tutor-2",
    name: "Ustadha Fatima Siddiqui",
    slug: "fatima-siddiqui",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    specialties: ["Children's Qaida", "Ijazah Training", "Female Students Section"],
    experience: "8 years",
    rating: 4.8,
    studentsCount: 11,
    lessonsCompleted: 980,
    languages: ["English", "Urdu", "Arabic"],
    timeZone: "Asia/Karachi",
    bio: "Certified Quran Tutor with an Ijazah in Hafs 'an 'Asim. Experienced in using visual aids, digital whiteboards, and child-friendly play-based pedagogy to teach kids Quran reading and rules.",
    videoUrl: "",
    availability: {
      Monday: ["11:00", "12:00", "13:00", "17:00", "18:00"],
      Wednesday: ["11:00", "12:00", "13:00", "17:00", "18:00"],
      Friday: ["09:00", "10:00", "14:00", "15:00", "16:00"],
      Sunday: ["10:00", "11:00", "12:00", "15:00", "16:00"]
    },
    hourlyRate: 25
  },
  {
    id: "tutor-3",
    name: "Sheikh Tariq Mahmood",
    slug: "tariq-mahmood",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    specialties: ["Hifz Intensive", "Tafseer Foundations", "Makharij Correction"],
    experience: "15 years",
    rating: 4.95,
    studentsCount: 18,
    lessonsCompleted: 2150,
    languages: ["English", "Arabic"],
    timeZone: "Europe/London",
    bio: "Dedicated Quran Hafiz and Scholar. Focuses heavily on memorization strategies, cognitive spacing, and correcting subtle mistakes in letter pronunciation (Makharij). Recommended for advanced Hifz tracking.",
    videoUrl: "",
    availability: {
      Monday: ["09:00", "10:00", "14:00", "15:00"],
      Tuesday: ["09:00", "10:00", "14:00", "15:00"],
      Thursday: ["09:00", "10:00", "14:00", "15:00"],
      Friday: ["09:00", "10:00", "14:00", "15:00"]
    },
    hourlyRate: 35
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "student-1",
    name: "Zayd Bilal",
    avatar: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150",
    level: "Intermediate",
    age: 12,
    timeZone: "America/New_York",
    assignedTutorId: "tutor-1",
    progress: {
      currentBook: "Holy Quran",
      currentChapter: "Surah Al-Kahf",
      currentVerse: 15,
      juzMemorized: [30, 29, 1],
      surahsCompleted: ["Al-Fatiha", "Al-Baqarah", "An-Nas", "Al-Falaq", "Al-Ikhlas", "Al-Masad", "An-Nasr"],
      tajweedScore: 84,
      hifzProgress: 12.5,
      attendanceRate: 96,
      recentMistakes: [
        {
          id: "mistake-1",
          date: "2026-06-25",
          type: "Ghunnah",
          description: "Forgot Ghunnah on Nun Mushaddad in Surah Al-Kahf Verse 8.",
          severity: "minor"
        },
        {
          id: "mistake-2",
          date: "2026-06-22",
          type: "Madd",
          description: "Shortened Madd Munfasil to only 2 beats instead of 4-5.",
          severity: "major"
        }
      ]
    }
  },
  {
    id: "student-2",
    name: "Maryam Khan",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    level: "Beginner",
    age: 8,
    timeZone: "Europe/London",
    assignedTutorId: "tutor-2",
    progress: {
      currentBook: "Noorani Qaida",
      currentChapter: "Lesson 14: Tashdeed Rules",
      currentVerse: 0,
      juzMemorized: [30],
      surahsCompleted: ["Al-Fatiha", "An-Nas", "Al-Falaq", "Al-Ikhlas"],
      tajweedScore: 78,
      hifzProgress: 3.2,
      attendanceRate: 100,
      recentMistakes: [
        {
          id: "mistake-3",
          date: "2026-06-26",
          type: "Makhraj",
          description: "Confused Makhraj of 'Saad' (ص) with 'Seen' (س).",
          severity: "major"
        }
      ]
    }
  },
  {
    id: "student-3",
    name: "Omar Farooq",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150",
    level: "Advanced",
    age: 21,
    timeZone: "America/Chicago",
    assignedTutorId: "tutor-3",
    progress: {
      currentBook: "Holy Quran",
      currentChapter: "Surah Al-Imran",
      currentVerse: 102,
      juzMemorized: [30, 29, 28, 27, 1, 2, 3],
      surahsCompleted: ["Al-Fatiha", "Al-Baqarah", "Al-Imran", "Yaseen", "Ar-Rahman", "Al-Mulk"],
      tajweedScore: 95,
      hifzProgress: 24.8,
      attendanceRate: 94,
      recentMistakes: [
        {
          id: "mistake-4",
          date: "2026-06-24",
          type: "Qalqalah",
          description: "Weak Qalqalah on the letter 'Qaaf' (ق) at stopping point.",
          severity: "minor"
        }
      ]
    }
  }
];

// Builds an ISO timestamp offset from "now" (in whole days) at a fixed UTC hour,
// so the demo's schedule always looks current instead of drifting into the past.
const isoAtOffset = (dayOffset: number, hour: number, minute: number = 0): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: "lesson-1",
    tutorId: "tutor-1",
    tutorName: "Sheikh Ahmed Al-Misri",
    studentId: "student-1",
    studentName: "Zayd Bilal",
    dateTime: isoAtOffset(0, 14), // Today
    duration: 45,
    topic: "Surah Al-Kahf recitation and Tajweed analysis (Verses 15-25)",
    status: "scheduled"
  },
  {
    id: "lesson-2",
    tutorId: "tutor-2",
    tutorName: "Ustadha Fatima Siddiqui",
    studentId: "student-2",
    studentName: "Maryam Khan",
    dateTime: isoAtOffset(1, 10), // Tomorrow
    duration: 30,
    topic: "Noorani Qaida Lesson 14: Tashdeed Exercises",
    status: "scheduled"
  },
  {
    id: "lesson-3",
    tutorId: "tutor-3",
    tutorName: "Sheikh Tariq Mahmood",
    studentId: "student-3",
    studentName: "Omar Farooq",
    dateTime: isoAtOffset(2, 15), // Day after tomorrow
    duration: 60,
    topic: "Hifz Revision of Juz 28 & Surah Al-Imran Memorization assessment",
    status: "scheduled"
  },
  {
    id: "lesson-completed-1",
    tutorId: "tutor-1",
    tutorName: "Sheikh Ahmed Al-Misri",
    studentId: "student-1",
    studentName: "Zayd Bilal",
    dateTime: isoAtOffset(-18, 14),
    duration: 60,
    topic: "Introduction to Makharij and Arabic phonetics",
    status: "completed"
  },
  {
    id: "lesson-completed-2",
    tutorId: "tutor-1",
    tutorName: "Sheikh Ahmed Al-Misri",
    studentId: "student-1",
    studentName: "Zayd Bilal",
    dateTime: isoAtOffset(-13, 15),
    duration: 45,
    topic: "Nun Sakinah Rules: Idgham and Izhar practice",
    status: "completed"
  },
  {
    id: "lesson-completed-3",
    tutorId: "tutor-1",
    tutorName: "Sheikh Ahmed Al-Misri",
    studentId: "student-2",
    studentName: "Maryam Khan",
    dateTime: isoAtOffset(-10, 16),
    duration: 45,
    topic: "Surah Al-Mulk Memorization: Verses 1 to 5 recitation",
    status: "completed"
  },
  {
    id: "lesson-completed-4",
    tutorId: "tutor-1",
    tutorName: "Sheikh Ahmed Al-Misri",
    studentId: "student-3",
    studentName: "Omar Farooq",
    dateTime: isoAtOffset(-6, 14),
    duration: 60,
    topic: "Tajweed rules of Meem Sakinah and Ghunnah",
    status: "completed"
  },
  {
    id: "lesson-completed-5",
    tutorId: "tutor-1",
    tutorName: "Sheikh Ahmed Al-Misri",
    studentId: "student-1",
    studentName: "Zayd Bilal",
    dateTime: isoAtOffset(-3, 14),
    duration: 45,
    topic: "Surah Al-Kahf recitation - Verses 1 to 10 feedback",
    status: "completed"
  },
  {
    id: "lesson-completed-6",
    tutorId: "tutor-2",
    tutorName: "Ustadha Fatima Siddiqui",
    studentId: "student-2",
    studentName: "Maryam Khan",
    dateTime: isoAtOffset(-16, 11),
    duration: 30,
    topic: "Noorani Qaida Lesson 10: Vowels and Sukoon exercises",
    status: "completed"
  },
  {
    id: "lesson-completed-7",
    tutorId: "tutor-2",
    tutorName: "Ustadha Fatima Siddiqui",
    studentId: "student-2",
    studentName: "Maryam Khan",
    dateTime: isoAtOffset(-9, 11),
    duration: 30,
    topic: "Noorani Qaida Lesson 11: Tashdeed rules",
    status: "completed"
  }
];

export const INITIAL_CURRICULUM: Curriculum[] = [
  {
    id: "curr-1",
    title: "Noorani Qaida for Beginners",
    category: "Qaida",
    difficulty: "Beginner",
    lessonsCount: 17,
    description: "The gold standard syllabus for learning how to read Arabic letters, connect sounds, and pronounce with initial vowel markings.",
    modules: [
      { id: "mod-1-1", title: "Lesson 1: Alphabet pronunciation (Makharij)", description: "Pronunciation of singular Arabic letters correctly from their source points." },
      { id: "mod-1-2", title: "Lesson 2: Joint letters (Huroof-e-Murakkabat)", description: "Recognizing letters in their initial, medial, and final forms." },
      { id: "mod-1-3", title: "Lesson 3: Harakat (Short Vowels)", description: "Understanding Fatha, Kasra, and Damma rules and sounds." },
      { id: "mod-1-4", title: "Lesson 14: Tashdeed (Shaddah)", description: "Learning stress and duplication of letters with Tajweed accentuation." }
    ]
  },
  {
    id: "curr-2",
    title: "Essential Tajweed Rules & Practice",
    category: "Tajweed",
    difficulty: "Intermediate",
    lessonsCount: 12,
    description: "Master the rules of recitation including Nun Sakinah, Meem Sakinah, Madd rules, and Qalqalah to recite exactly as the Prophet (PBUH) did.",
    modules: [
      { id: "mod-2-1", title: "Rule of Nun Sakinah: Izhar & Idgham", description: "When to express the Nun sound clearly and when to merge it with the following letter." },
      { id: "mod-2-2", title: "Rule of Nun Sakinah: Iqlab & Ikhfa", description: "Converting Nun to Meem, and hiding the Nun sound in the nasal cavity (Ghunnah)." },
      { id: "mod-2-3", title: "Madd Rules (Prolongations)", description: "Understanding primary and secondary prolongations (Madd Lazim, Madd Jaiz, etc.)." }
    ]
  },
  {
    id: "curr-3",
    title: "Juz Amma (Juz 30) Memorization Program",
    category: "Hifz",
    difficulty: "Beginner",
    lessonsCount: 37,
    description: "Structured memorization program from Surah An-Naba to Surah An-Nas with daily recitation reviews and visual checkpoint scoring.",
    modules: [
      { id: "mod-3-1", title: "The Short Surahs (An-Nas to Al-Ma'un)", description: "Perfecting pronunciation and retention of standard prayer Surahs." },
      { id: "mod-3-2", title: "The Middle Surahs (Al-Qari'ah to Al-Fajr)", description: "Focusing on rhythm, visual cue memorization, and breathing control." },
      { id: "mod-3-3", title: "The Long Surahs (Al-Ghashiyah to An-Naba)", description: "Transitioning to longer verses, memorization structure, and advanced review protocols." }
    ]
  }
];

export const TAJWEED_QUIZ = [
  {
    id: "q1",
    question: "What is the primary meaning of the word 'Tajweed' in Arabic?",
    options: [
      "To write beautiful calligraphy",
      "To make better, or to perfect our pronunciation",
      "To translate the holy verses",
      "To memorize the book by heart"
    ],
    answer: 1,
    tip: "Tajweed comes from 'Jawwada', meaning to beautify or improve, ensuring every letter is given its due right."
  },
  {
    id: "q2",
    question: "Which of these are the Qalqalah (echoing/bouncing sound) letters?",
    options: [
      "ب , ج , د , ط , ق (Qutb Jaddin)",
      "ا , و , ي (Alif, Waw, Ya)",
      "ر , ل , م , ن (Ra, Lam, Meem, Nun)",
      "خ , ص , ض , غ , ط , ق , ظ (Khussa Dhaghtin Qidh)"
    ],
    answer: 0,
    tip: "The Qalqalah letters are five: Qaaf, Ta, Ba, Jeem, and Dal, summed up in the phrase 'Qutb Jaddin'."
  },
  {
    id: "q3",
    question: "When a Nun Sakinah or Tanween is followed by the letter 'Ba' (ب), what rule is applied?",
    options: [
      "Izhar (Clear pronunciation)",
      "Idgham (Merging sound)",
      "Iqlab (Conversion to a Meem sound with Ghunnah)",
      "Ikhfa (Hiding the sound)"
    ],
    answer: 2,
    tip: "Iqlab occurs when Nun Sakinah or Tanween is followed by 'Ba'. The Nun is flipped into a silent Meem with a beautiful nasal echo."
  }
];

export const ARCHITECTURE_INFO = {
  stack: [
    {
      component: "Frontend / App Engine",
      tech: "Next.js (React + TypeScript)",
      benefits: "Ultra-fast Initial Server Render (SSR) for SEO-optimized tutor directories, Static Regeneration (ISR) for tutor profiles, and hydration to a highly reactive interactive client-side app."
    },
    {
      component: "Database & Backend Service",
      tech: "Supabase (PostgreSQL)",
      benefits: "Real-time subscriptions for instant schedule updates, built-in robust row-level security (RLS) for privacy-first parent-student data, and rapid API generation over a full relational engine."
    },
    {
      component: "Virtual Live Classroom",
      tech: "Agora.io or Daily.co WebRTC",
      benefits: "Embeds zero-latency peer-to-peer or selective forwarding unit (SFU) video feeds into browser. Outperforms generic Zoom links by allowing deep synchronization between our Quran digital whiteboard, verse highlights, and logs."
    },
    {
      component: "Task Queue / Sync Workers",
      tech: "Redis & Node.js Cron",
      benefits: "Failsafe cron worker schedules to manage session reminders, auto-close idle classrooms, trigger email reminders 15 minutes before lessons, and synchronize tutor calendars with Google Calendar."
    }
  ],
  schemas: {
    users: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'tutor', 'student')),
  full_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  time_zone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tutor_profiles (
  tutor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialties TEXT[] NOT NULL,
  experience_years INT NOT NULL,
  bio TEXT,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  languages TEXT[] NOT NULL,
  availability JSONB NOT NULL -- Weekly schedule template: {"Monday": ["09:00", "10:00"]}
);

CREATE TABLE student_profiles (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age INT,
  level VARCHAR(20) NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  assigned_tutor_id UUID REFERENCES users(id) ON DELETE SET NULL
);`,
    scheduling: `CREATE TABLE booked_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Stored strictly in UTC
  duration_minutes INT DEFAULT 45 NOT NULL,
  topic VARCHAR(255),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  tutor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index to query upcoming lessons in UTC instantly
CREATE INDEX idx_lessons_schedule ON booked_lessons(scheduled_at);`,
    tracking: `CREATE TABLE student_progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES users(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_book VARCHAR(100) NOT NULL, -- e.g., 'Holy Quran', 'Noorani Qaida'
  current_chapter VARCHAR(150) NOT NULL, -- e.g., 'Surah Al-Kahf'
  current_verse INT DEFAULT 0,
  tajweed_score INT CHECK (tajweed_score BETWEEN 0 AND 100),
  hifz_progress_percentage NUMERIC(5,2),
  notes TEXT
);

CREATE TABLE mistakes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_log_id UUID REFERENCES student_progress_logs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mistake_type VARCHAR(50) CHECK (mistake_type IN ('Ghunnah', 'Madd', 'Makhraj', 'Qalqalah')),
  description TEXT NOT NULL,
  severity VARCHAR(10) CHECK (severity IN ('minor', 'major')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
    quran: `CREATE TABLE quran_surahs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_number INT UNIQUE NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  name_arabic VARCHAR(100) NOT NULL,
  name_english VARCHAR(150) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Meccan', 'Medinan')),
  total_verses INT NOT NULL CHECK (total_verses > 0),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching surah by number quickly
CREATE INDEX idx_quran_surah_number ON quran_surahs(surah_number);`,
    blog: `CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown formatting supported
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  published_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast blog queries by slug or status and date
CREATE UNIQUE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status_published ON blog_posts(status, published_at DESC);`
  }
};

export const MOCK_QURAN_PAGES = [
  {
    pageNumber: 293,
    surahName: "Surah Al-Isra' (The Night Journey)",
    verses: [
      { id: "v1", arabic: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى", translation: "Exalted is He who took His Servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa...", audioWord: "Subhaana" },
      { id: "v2", arabic: "وَآتَيْنَا مُوسَى الْكِتَابَ وَجَعَلْنَاهُ هُدًى لِّبَنِي إِسْرَائِيلَ أَلَّا تَتَّخِذُوا مِن دُونِي وَكِيلًا", translation: "And We gave Moses the Scripture and made it a guidance for the Children of Israel...", audioWord: "Wa aataynaa" },
      { id: "v3", arabic: "ذُرِّيَّةَ مَنْ حَمَلْنَا مَعَ نُوحٍ ۚ إِنَّهُ كَانَ عَبْدًا شَكُورًا", translation: "O descendants of those We carried [in the ship] with Noah. Indeed, he was a grateful servant.", audioWord: "Dhurriyyata" }
    ]
  },
  {
    pageNumber: 302,
    surahName: "Surah Al-Kahf (The Cave)",
    verses: [
      { id: "v4", arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا", translation: "[All] praise is [due] to Allah, who has sent down upon His Servant the Book and has not made therein any deviance.", audioWord: "Alhamdu lillah" },
      { id: "v5", arabic: "قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا", translation: "[He has made it] straight to warn of severe punishment from Him and to give good tidings to the believers...", audioWord: "Qayyiman" },
      { id: "v6", arabic: "مَّاكِثِينَ فِيهِ أَبَدًا", translation: "In which they will remain forever.", audioWord: "Maakitheena" }
    ]
  }
];

// Turns any text into a clean, URL-safe slug, e.g. "Aal-E-Imran" -> "aal-e-imran".
// Used to build real, shareable, SEO-friendly URLs across the app (surahs, new tutor profiles, blog posts, ...).
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Kept as a named alias for surah slugs specifically, since it's used in several places already.
export function slugifySurahName(name: string): string {
  return slugify(name);
}

// Canonical metadata for all 114 surahs of the Quran (number, names, revelation type, verse count).
// This is standard reference data, not placeholder content — every surah gets a real entry so the
// index, search, and per-surah URLs cover the whole Quran, not just a handful of samples.
const SURAH_META: Array<{ number: number; nameArabic: string; nameEnglish: string; type: "Meccan" | "Medinan"; totalVerses: number }> = [
  { number: 1, nameArabic: "الفاتحة", nameEnglish: "Al-Fatihah", type: "Meccan", totalVerses: 7 },
  { number: 2, nameArabic: "البقرة", nameEnglish: "Al-Baqarah", type: "Medinan", totalVerses: 286 },
  { number: 3, nameArabic: "آل عمران", nameEnglish: "Aal-E-Imran", type: "Medinan", totalVerses: 200 },
  { number: 4, nameArabic: "النساء", nameEnglish: "An-Nisa", type: "Medinan", totalVerses: 176 },
  { number: 5, nameArabic: "المائدة", nameEnglish: "Al-Ma'idah", type: "Medinan", totalVerses: 120 },
  { number: 6, nameArabic: "الأنعام", nameEnglish: "Al-An'am", type: "Meccan", totalVerses: 165 },
  { number: 7, nameArabic: "الأعراف", nameEnglish: "Al-A'raf", type: "Meccan", totalVerses: 206 },
  { number: 8, nameArabic: "الأنفال", nameEnglish: "Al-Anfal", type: "Medinan", totalVerses: 75 },
  { number: 9, nameArabic: "التوبة", nameEnglish: "At-Tawbah", type: "Medinan", totalVerses: 129 },
  { number: 10, nameArabic: "يونس", nameEnglish: "Yunus", type: "Meccan", totalVerses: 109 },
  { number: 11, nameArabic: "هود", nameEnglish: "Hud", type: "Meccan", totalVerses: 123 },
  { number: 12, nameArabic: "يوسف", nameEnglish: "Yusuf", type: "Meccan", totalVerses: 111 },
  { number: 13, nameArabic: "الرعد", nameEnglish: "Ar-Ra'd", type: "Medinan", totalVerses: 43 },
  { number: 14, nameArabic: "إبراهيم", nameEnglish: "Ibrahim", type: "Meccan", totalVerses: 52 },
  { number: 15, nameArabic: "الحجر", nameEnglish: "Al-Hijr", type: "Meccan", totalVerses: 99 },
  { number: 16, nameArabic: "النحل", nameEnglish: "An-Nahl", type: "Meccan", totalVerses: 128 },
  { number: 17, nameArabic: "الإسراء", nameEnglish: "Al-Isra", type: "Meccan", totalVerses: 111 },
  { number: 18, nameArabic: "الكهف", nameEnglish: "Al-Kahf", type: "Meccan", totalVerses: 110 },
  { number: 19, nameArabic: "مريم", nameEnglish: "Maryam", type: "Meccan", totalVerses: 98 },
  { number: 20, nameArabic: "طه", nameEnglish: "Ta-Ha", type: "Meccan", totalVerses: 135 },
  { number: 21, nameArabic: "الأنبياء", nameEnglish: "Al-Anbiya", type: "Meccan", totalVerses: 112 },
  { number: 22, nameArabic: "الحج", nameEnglish: "Al-Hajj", type: "Medinan", totalVerses: 78 },
  { number: 23, nameArabic: "المؤمنون", nameEnglish: "Al-Mu'minun", type: "Meccan", totalVerses: 118 },
  { number: 24, nameArabic: "النور", nameEnglish: "An-Nur", type: "Medinan", totalVerses: 64 },
  { number: 25, nameArabic: "الفرقان", nameEnglish: "Al-Furqan", type: "Meccan", totalVerses: 77 },
  { number: 26, nameArabic: "الشعراء", nameEnglish: "Ash-Shu'ara", type: "Meccan", totalVerses: 227 },
  { number: 27, nameArabic: "النمل", nameEnglish: "An-Naml", type: "Meccan", totalVerses: 93 },
  { number: 28, nameArabic: "القصص", nameEnglish: "Al-Qasas", type: "Meccan", totalVerses: 88 },
  { number: 29, nameArabic: "العنكبوت", nameEnglish: "Al-Ankabut", type: "Meccan", totalVerses: 69 },
  { number: 30, nameArabic: "الروم", nameEnglish: "Ar-Rum", type: "Meccan", totalVerses: 60 },
  { number: 31, nameArabic: "لقمان", nameEnglish: "Luqman", type: "Meccan", totalVerses: 34 },
  { number: 32, nameArabic: "السجدة", nameEnglish: "As-Sajdah", type: "Meccan", totalVerses: 30 },
  { number: 33, nameArabic: "الأحزاب", nameEnglish: "Al-Ahzab", type: "Medinan", totalVerses: 73 },
  { number: 34, nameArabic: "سبأ", nameEnglish: "Saba", type: "Meccan", totalVerses: 54 },
  { number: 35, nameArabic: "فاطر", nameEnglish: "Fatir", type: "Meccan", totalVerses: 45 },
  { number: 36, nameArabic: "يس", nameEnglish: "Ya-Sin", type: "Meccan", totalVerses: 83 },
  { number: 37, nameArabic: "الصافات", nameEnglish: "As-Saffat", type: "Meccan", totalVerses: 182 },
  { number: 38, nameArabic: "ص", nameEnglish: "Sad", type: "Meccan", totalVerses: 88 },
  { number: 39, nameArabic: "الزمر", nameEnglish: "Az-Zumar", type: "Meccan", totalVerses: 75 },
  { number: 40, nameArabic: "غافر", nameEnglish: "Ghafir", type: "Meccan", totalVerses: 85 },
  { number: 41, nameArabic: "فصلت", nameEnglish: "Fussilat", type: "Meccan", totalVerses: 54 },
  { number: 42, nameArabic: "الشورى", nameEnglish: "Ash-Shuraa", type: "Meccan", totalVerses: 53 },
  { number: 43, nameArabic: "الزخرف", nameEnglish: "Az-Zukhruf", type: "Meccan", totalVerses: 89 },
  { number: 44, nameArabic: "الدخان", nameEnglish: "Ad-Dukhan", type: "Meccan", totalVerses: 59 },
  { number: 45, nameArabic: "الجاثية", nameEnglish: "Al-Jathiyah", type: "Meccan", totalVerses: 37 },
  { number: 46, nameArabic: "الأحقاف", nameEnglish: "Al-Ahqaf", type: "Meccan", totalVerses: 35 },
  { number: 47, nameArabic: "محمد", nameEnglish: "Muhammad", type: "Medinan", totalVerses: 38 },
  { number: 48, nameArabic: "الفتح", nameEnglish: "Al-Fath", type: "Medinan", totalVerses: 29 },
  { number: 49, nameArabic: "الحجرات", nameEnglish: "Al-Hujurat", type: "Medinan", totalVerses: 18 },
  { number: 50, nameArabic: "ق", nameEnglish: "Qaf", type: "Meccan", totalVerses: 45 },
  { number: 51, nameArabic: "الذاريات", nameEnglish: "Adh-Dhariyat", type: "Meccan", totalVerses: 60 },
  { number: 52, nameArabic: "الطور", nameEnglish: "At-Tur", type: "Meccan", totalVerses: 49 },
  { number: 53, nameArabic: "النجم", nameEnglish: "An-Najm", type: "Meccan", totalVerses: 62 },
  { number: 54, nameArabic: "القمر", nameEnglish: "Al-Qamar", type: "Meccan", totalVerses: 55 },
  { number: 55, nameArabic: "الرحمن", nameEnglish: "Ar-Rahman", type: "Medinan", totalVerses: 78 },
  { number: 56, nameArabic: "الواقعة", nameEnglish: "Al-Waqi'ah", type: "Meccan", totalVerses: 96 },
  { number: 57, nameArabic: "الحديد", nameEnglish: "Al-Hadid", type: "Medinan", totalVerses: 29 },
  { number: 58, nameArabic: "المجادلة", nameEnglish: "Al-Mujadila", type: "Medinan", totalVerses: 22 },
  { number: 59, nameArabic: "الحشر", nameEnglish: "Al-Hashr", type: "Medinan", totalVerses: 24 },
  { number: 60, nameArabic: "الممتحنة", nameEnglish: "Al-Mumtahanah", type: "Medinan", totalVerses: 13 },
  { number: 61, nameArabic: "الصف", nameEnglish: "As-Saf", type: "Medinan", totalVerses: 14 },
  { number: 62, nameArabic: "الجمعة", nameEnglish: "Al-Jumu'ah", type: "Medinan", totalVerses: 11 },
  { number: 63, nameArabic: "المنافقون", nameEnglish: "Al-Munafiqun", type: "Medinan", totalVerses: 11 },
  { number: 64, nameArabic: "التغابن", nameEnglish: "At-Taghabun", type: "Medinan", totalVerses: 18 },
  { number: 65, nameArabic: "الطلاق", nameEnglish: "At-Talaq", type: "Medinan", totalVerses: 12 },
  { number: 66, nameArabic: "التحريم", nameEnglish: "At-Tahrim", type: "Medinan", totalVerses: 12 },
  { number: 67, nameArabic: "الملك", nameEnglish: "Al-Mulk", type: "Meccan", totalVerses: 30 },
  { number: 68, nameArabic: "القلم", nameEnglish: "Al-Qalam", type: "Meccan", totalVerses: 52 },
  { number: 69, nameArabic: "الحاقة", nameEnglish: "Al-Haqqah", type: "Meccan", totalVerses: 52 },
  { number: 70, nameArabic: "المعارج", nameEnglish: "Al-Ma'arij", type: "Meccan", totalVerses: 44 },
  { number: 71, nameArabic: "نوح", nameEnglish: "Nuh", type: "Meccan", totalVerses: 28 },
  { number: 72, nameArabic: "الجن", nameEnglish: "Al-Jinn", type: "Meccan", totalVerses: 28 },
  { number: 73, nameArabic: "المزمل", nameEnglish: "Al-Muzzammil", type: "Meccan", totalVerses: 20 },
  { number: 74, nameArabic: "المدثر", nameEnglish: "Al-Muddaththir", type: "Meccan", totalVerses: 56 },
  { number: 75, nameArabic: "القيامة", nameEnglish: "Al-Qiyamah", type: "Meccan", totalVerses: 40 },
  { number: 76, nameArabic: "الإنسان", nameEnglish: "Al-Insan", type: "Medinan", totalVerses: 31 },
  { number: 77, nameArabic: "المرسلات", nameEnglish: "Al-Mursalat", type: "Meccan", totalVerses: 50 },
  { number: 78, nameArabic: "النبأ", nameEnglish: "An-Naba", type: "Meccan", totalVerses: 40 },
  { number: 79, nameArabic: "النازعات", nameEnglish: "An-Nazi'at", type: "Meccan", totalVerses: 46 },
  { number: 80, nameArabic: "عبس", nameEnglish: "Abasa", type: "Meccan", totalVerses: 42 },
  { number: 81, nameArabic: "التكوير", nameEnglish: "At-Takwir", type: "Meccan", totalVerses: 29 },
  { number: 82, nameArabic: "الإنفطار", nameEnglish: "Al-Infitar", type: "Meccan", totalVerses: 19 },
  { number: 83, nameArabic: "المطففين", nameEnglish: "Al-Mutaffifin", type: "Meccan", totalVerses: 36 },
  { number: 84, nameArabic: "الإنشقاق", nameEnglish: "Al-Inshiqaq", type: "Meccan", totalVerses: 25 },
  { number: 85, nameArabic: "البروج", nameEnglish: "Al-Buruj", type: "Meccan", totalVerses: 22 },
  { number: 86, nameArabic: "الطارق", nameEnglish: "At-Tariq", type: "Meccan", totalVerses: 17 },
  { number: 87, nameArabic: "الأعلى", nameEnglish: "Al-A'la", type: "Meccan", totalVerses: 19 },
  { number: 88, nameArabic: "الغاشية", nameEnglish: "Al-Ghashiyah", type: "Meccan", totalVerses: 26 },
  { number: 89, nameArabic: "الفجر", nameEnglish: "Al-Fajr", type: "Meccan", totalVerses: 30 },
  { number: 90, nameArabic: "البلد", nameEnglish: "Al-Balad", type: "Meccan", totalVerses: 20 },
  { number: 91, nameArabic: "الشمس", nameEnglish: "Ash-Shams", type: "Meccan", totalVerses: 15 },
  { number: 92, nameArabic: "الليل", nameEnglish: "Al-Layl", type: "Meccan", totalVerses: 21 },
  { number: 93, nameArabic: "الضحى", nameEnglish: "Ad-Duhaa", type: "Meccan", totalVerses: 11 },
  { number: 94, nameArabic: "الشرح", nameEnglish: "Ash-Sharh", type: "Meccan", totalVerses: 8 },
  { number: 95, nameArabic: "التين", nameEnglish: "At-Tin", type: "Meccan", totalVerses: 8 },
  { number: 96, nameArabic: "العلق", nameEnglish: "Al-Alaq", type: "Meccan", totalVerses: 19 },
  { number: 97, nameArabic: "القدر", nameEnglish: "Al-Qadr", type: "Meccan", totalVerses: 5 },
  { number: 98, nameArabic: "البينة", nameEnglish: "Al-Bayyinah", type: "Medinan", totalVerses: 8 },
  { number: 99, nameArabic: "الزلزلة", nameEnglish: "Az-Zalzalah", type: "Medinan", totalVerses: 8 },
  { number: 100, nameArabic: "العاديات", nameEnglish: "Al-Adiyat", type: "Meccan", totalVerses: 11 },
  { number: 101, nameArabic: "القارعة", nameEnglish: "Al-Qari'ah", type: "Meccan", totalVerses: 11 },
  { number: 102, nameArabic: "التكاثر", nameEnglish: "At-Takathur", type: "Meccan", totalVerses: 8 },
  { number: 103, nameArabic: "العصر", nameEnglish: "Al-Asr", type: "Meccan", totalVerses: 3 },
  { number: 104, nameArabic: "الهمزة", nameEnglish: "Al-Humazah", type: "Meccan", totalVerses: 9 },
  { number: 105, nameArabic: "الفيل", nameEnglish: "Al-Fil", type: "Meccan", totalVerses: 5 },
  { number: 106, nameArabic: "قريش", nameEnglish: "Quraysh", type: "Meccan", totalVerses: 4 },
  { number: 107, nameArabic: "الماعون", nameEnglish: "Al-Ma'un", type: "Meccan", totalVerses: 7 },
  { number: 108, nameArabic: "الكوثر", nameEnglish: "Al-Kawthar", type: "Meccan", totalVerses: 3 },
  { number: 109, nameArabic: "الكافرون", nameEnglish: "Al-Kafirun", type: "Meccan", totalVerses: 6 },
  { number: 110, nameArabic: "النصر", nameEnglish: "An-Nasr", type: "Medinan", totalVerses: 3 },
  { number: 111, nameArabic: "المسد", nameEnglish: "Al-Masad", type: "Meccan", totalVerses: 5 },
  { number: 112, nameArabic: "الإخلاص", nameEnglish: "Al-Ikhlas", type: "Meccan", totalVerses: 4 },
  { number: 113, nameArabic: "الفلق", nameEnglish: "Al-Falaq", type: "Meccan", totalVerses: 5 },
  { number: 114, nameArabic: "الناس", nameEnglish: "An-Nas", type: "Meccan", totalVerses: 6 }
];

// Full 114-surah index. Audio streams from the same public recitation CDN already used
// elsewhere in the app (Mishary Alafasy, reciter id 7), which covers every surah — not just
// the handful that had hand-typed verse text.
export const INITIAL_SURAHS: Surah[] = SURAH_META.map(s => ({
  id: `s-${s.number}`,
  ...s,
  audioUrl: `https://audio.qurancdn.com/reciters/7/${s.number}.mp3`
}));

// Canonical metadata for all 30 Paras (Ajza) of the Quran, editable from the Admin CMS
// the same way surahs are — so "Manage Surahs" and "Manage Juz" both work on real, persisted data.
const JUZ_ARABIC_NAMES = [
  "آلم", "سيقول", "تلك الرسل", "لن تنالوا", "والمحصنات",
  "لا يحب الله", "وإذا سمعوا", "ولو أننا", "قال الملأ", "واعلموا",
  "يعتذرون", "وما من دابة", "وما أبرئ", "ربما", "سبحان الذي",
  "قال ألم", "اقترب للناس", "قد أفلح", "وقال الذين", "أمن خلق",
  "اتل ما أوحي", "ومن يقنت", "وما لي", "فمن أظلم", "إليه يرد",
  "حم", "قال فما خطبكم", "قد سمع الله", "تبارك الذي", "عم"
];

const JUZ_ENGLISH_NAMES = [
  "Alif-Lam-Mim", "Sayaqool", "Tilkal Rusul", "Lan Tanaloo", "Wal-Muhsanat",
  "La Yuhibbullah", "Wa Iza Sami'oo", "Wa Lau Annana", "Qalal Mala'u", "Wa'lamu",
  "Ya'tazirun", "Wa Ma Min Dabbah", "Wa Ma Ubri'u", "Rubama", "Subhanallazi",
  "Qala Alam", "Iqtaraba Lin-Nasi", "Qad Aflaha", "Wa Qalal-Lazina", "Amman Khalaq",
  "Utlu Ma Uhiya", "Wa Man Yaqnut", "Wa Mali", "Faman Azlam", "Ilaihi Yuraddu",
  "Ha-Mim", "Qala Fama Khatbukum", "Qad Sami'allah", "Tabarakallazi", "Amma"
];

// Standard Madinah mushaf: the surah and ayah where each Juz begins.
const JUZ_STARTS: Array<[number, number]> = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

export const INITIAL_JUZ: Juz[] = Array.from({ length: 30 }, (_, i) => {
  const [surahNum, ayah] = JUZ_STARTS[i];
  const startSurahName = SURAH_META[surahNum - 1].nameEnglish;

  return {
    number: i + 1,
    nameArabic: JUZ_ARABIC_NAMES[i] || "جزء",
    nameEnglish: `Juz ${i + 1} (${JUZ_ENGLISH_NAMES[i]})`,
    startInfo: `${startSurahName} (${surahNum}:${ayah})`
  };
});

export const INITIAL_BLOGS: BlogPost[] = [
  {
    id: "blog-1",
    title: "Mastering Tajweed: Why Precise Vowels Matter",
    slug: "mastering-tajweed-vowels",
    excerpt: "Discover how a single mispronounced short vowel (harakah) can alter the entire meaning of a Quranic verse, and how our custom virtual whiteboard helps correct it.",
    content: `## The Spiritual Significance of Tajweed

Reciting the Holy Quran with proper Tajweed is not merely an aesthetic choice; it is an obligation to preserve the exact words of Allah as they were revealed to Prophet Muhammad (PBUH). 

### How Vowels Alter Quranic Meanings

In the Arabic language, short vowels (Fatha, Kasra, and Damma) dictate grammatical structures and word definitions. For example:
- A misplaced vowel can change a subject to an object.
- It can transform an active verb into a passive verb.
- In severe cases, it can reverse the theological meaning of a verse.

### The Role of Technology in Learning

Through qurantutorsacademy.com, we bridge physical distance using active WebRTC screens and our interactive, vector-drawn whiteboard. Tutors can circle specific letters, draw makhraj maps, and log mistakes in the student profile in real-time, preventing incorrect memorization.`,
    author: "Sheikh Ahmed Al-Misri",
    coverImage: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400",
    status: "Published",
    publishedAt: "2026-06-25",
    tags: ["Tajweed", "Quranic Sciences", "Online Learning"]
  },
  {
    id: "blog-2",
    title: "5 Spaced-Repetition Hifz Strategies for Kids",
    slug: "spaced-repetition-hifz-kids",
    excerpt: "Help your child retain Surah memorization without stressful cramming. Learn the cognitive science behind spaced recall and how our tutors apply it daily.",
    content: `## Cognitive Science in Hifz

Memorizing long chapters of the Quran requires systematic retention models. Spaced-repetition is a proven cognitive strategy that strengthens synaptic pathways by prompting recall right before a memory begins to fade.

### The 5 Core Strategies

1. The 3:5 Rule: Recite a new verse 3 times with eyes open on the text, and 5 times from pure memory.
2. Weekly Spaced Audits: Review Surahs memorized 7, 14, and 30 days ago to transfer them from working memory to permanent storage.
3. Audio-Visual Association: Play the audio recitation of the target surah in the background during playtime or sleep to prime the brain.
4. Mistake Tracking Analysis: Use our digital progress dashboards to identify specific recurring mistakes (such as Ghunnah omissions) and target them specifically.
5. Generous Praise & Token Reward Systems: Incentivize children through milestone badges rather than long, fatiguing study hours.`,
    author: "Ustadha Fatima Siddiqui",
    coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400",
    status: "Published",
    publishedAt: "2026-06-20",
    tags: ["Hifz", "Child Pedagogy", "Spaced Repetition"]
  }
];

export const REALISTIC_QURAN_VERSES: Record<number, Array<{ verse_number: number; text_ar: string; text_translation: string; juz_id: number }>> = {
  1: [
    { verse_number: 1, text_ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", text_translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.", juz_id: 1 },
    { verse_number: 2, text_ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", text_translation: "[All] praise is [due] to Allah, Lord of the worlds -", juz_id: 1 },
    { verse_number: 3, text_ar: "الرَّحْمَٰنِ الرَّحِيمِ", text_translation: "The Entirely Merciful, the Especially Merciful,", juz_id: 1 },
    { verse_number: 4, text_ar: "مَالِكِ يَوْمِ الدِّينِ", text_translation: "Sovereign of the Day of Recompense.", juz_id: 1 },
    { verse_number: 5, text_ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", text_translation: "It is You we worship and You we ask for help.", juz_id: 1 },
    { verse_number: 6, text_ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", text_translation: "Guide us to the straight path -", juz_id: 1 },
    { verse_number: 7, text_ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", text_translation: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.", juz_id: 1 },
  ],
  2: [
    { verse_number: 1, text_ar: "الم", text_translation: "Alif, Lam, Meem.", juz_id: 1 },
    { verse_number: 2, text_ar: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ", text_translation: "This is the Book about which there is no doubt, a guidance for those conscious of Allah -", juz_id: 1 },
    { verse_number: 3, text_ar: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ", text_translation: "Who believe in the unseen, establish prayer, and spend out of what We have provided for them,", juz_id: 1 },
    { verse_number: 4, text_ar: "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ", text_translation: "And who believe in what has been revealed to you, [O Muhammad], and what was revealed before you, and of the Hereafter they are certain [in faith].", juz_id: 1 },
    { verse_number: 5, text_ar: "أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ", text_translation: "Those are upon [right] guidance from their Lord, and it is those who are the successful.", juz_id: 1 },
  ],
  18: [
    { verse_number: 1, text_ar: "الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا", text_translation: "[All] praise is [due] to Allah, who has sent down upon His Servant the Book and has not made therein any deviance.", juz_id: 15 },
    { verse_number: 2, text_ar: "قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا", text_translation: "[He has made it] straight to warn of severe punishment from Him and to give good tidings to the believers who do righteous deeds that they will have a good reward", juz_id: 15 },
    { verse_number: 3, text_ar: "مَّاكِثِينَ فِيهِ أَبَدًا", text_translation: "In which they will remain forever", juz_id: 15 },
    { verse_number: 4, text_ar: "وَيُنذِرَ الَّذِينَ قَالُوا اتَّخَذَ اللَّهُ وَلَدًا", text_translation: "And to warn those who say, 'Allah has taken a son.'", juz_id: 15 },
    { verse_number: 5, text_ar: "مَّا لَهُم بِهِ مِنْ عِلْمٍ وَلَا لِآبَائِهِمْ ۚ كَبُرَتْ كَلِمَةً تَخْرُجُ مِنْ أَفْوَاهِهِمْ ۚ إِن يَقُولُونَ إِلَّا كَذِبًا", text_translation: "They have no knowledge of it, nor had their fathers. Grave is the word that comes out of their mouths; they speak not except a lie.", juz_id: 15 }
  ],
  36: [
    { verse_number: 1, text_ar: "يس", text_translation: "Ya, Seen.", juz_id: 22 },
    { verse_number: 2, text_ar: "وَالْقُرْآنِ الْحَكِيمِ", text_translation: "By the wise Qur'an,", juz_id: 22 },
    { verse_number: 3, text_ar: "إِنَّكَ لَمِنَ الْمُرْسَلِينَ", text_translation: "Indeed you, [O Muhammad], are from among the messengers,", juz_id: 22 },
    { verse_number: 4, text_ar: "عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ", text_translation: "On a straight path.", juz_id: 22 },
    { verse_number: 5, text_ar: "تَنزِيلَ الْعَزِيزِ الرَّحِيمِ", text_translation: "[This is] a revelation of the Exalted in Might, the Especially Merciful,", juz_id: 22 }
  ],
  114: [
    { verse_number: 1, text_ar: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", text_translation: "Say, 'I seek refuge in the Lord of mankind,", juz_id: 30 },
    { verse_number: 2, text_ar: "مَلِكِ النَّاسِ", text_translation: "The Sovereign of mankind,", juz_id: 30 },
    { verse_number: 3, text_ar: "إِلَٰهِ النَّاسِ", text_translation: "The God of mankind,", juz_id: 30 },
    { verse_number: 4, text_ar: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", text_translation: "From the evil of the retreating whisperer -", juz_id: 30 },
    { verse_number: 5, text_ar: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", text_translation: "Who whispers [evil] into the breasts of mankind -", juz_id: 30 },
    { verse_number: 6, text_ar: "مِنَ الْجِنَّةِ وَالنَّاسِ", text_translation: "From among the jinn and mankind.'", juz_id: 30 }
  ]
};

