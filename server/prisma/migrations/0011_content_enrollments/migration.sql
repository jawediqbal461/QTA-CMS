-- 0010 created these two tables with snake_case columns and UUID types, which do not
-- match the Prisma schema (quoted camelCase + TEXT ids). They have never held data.
DROP TABLE IF EXISTS "demo_rooms";
DROP TABLE IF EXISTS "tajweed_quiz_results";

CREATE TABLE "demo_rooms" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "roomSlug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "demo_rooms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "demo_rooms_roomSlug_key" ON "demo_rooms"("roomSlug");

CREATE TABLE "tajweed_quiz_results" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tajweed_quiz_results_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tajweed_quiz_results_createdAt_idx" ON "tajweed_quiz_results"("createdAt");

CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[],
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "blog_posts_academyId_slug_key" ON "blog_posts"("academyId", "slug");
CREATE INDEX "blog_posts_academyId_status_publishedAt_idx" ON "blog_posts"("academyId", "status", "publishedAt");
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_academyId_fkey"
    FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "quran_surah_overrides" (
    "number" INTEGER NOT NULL,
    "nameArabic" TEXT,
    "nameEnglish" TEXT,
    "englishNameTranslation" TEXT,
    "revelationType" TEXT,
    "audioUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ayahs" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quran_surah_overrides_pkey" PRIMARY KEY ("number")
);

CREATE TABLE "quran_juz" (
    "number" INTEGER NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "nameEnglish" TEXT NOT NULL,
    "startInfo" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quran_juz_pkey" PRIMARY KEY ("number")
);

CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledById" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "course_enrollments_courseId_studentId_key" ON "course_enrollments"("courseId", "studentId");
CREATE INDEX "course_enrollments_academyId_status_createdAt_idx" ON "course_enrollments"("academyId", "status", "createdAt");
CREATE INDEX "course_enrollments_enrolledById_idx" ON "course_enrollments"("enrolledById");
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_academyId_fkey"
    FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_enrolledById_fkey"
    FOREIGN KEY ("enrolledById") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
