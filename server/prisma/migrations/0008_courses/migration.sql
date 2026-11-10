CREATE TYPE "CourseStatus" AS ENUM (
  'DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'
);

CREATE TABLE "courses" (
  "id"            TEXT NOT NULL,
  "academyId"     TEXT NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "tutorId"       TEXT NOT NULL REFERENCES "tutor_profiles"("accountId") ON DELETE CASCADE,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "program"       TEXT NOT NULL,
  "level"         TEXT NOT NULL,
  "language"      TEXT NOT NULL,
  "format"        TEXT NOT NULL,
  "durationWeeks" INTEGER,
  "prerequisites" TEXT,
  "outcomes"      TEXT,
  "priceAmount"   DECIMAL(10,2),
  "priceCurrency" TEXT NOT NULL DEFAULT 'USD',
  "status"        "CourseStatus" NOT NULL DEFAULT 'DRAFT',
  "reviewNote"    TEXT,
  "reviewedById"  TEXT REFERENCES "accounts"("id") ON DELETE SET NULL,
  "publishedAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "courses_academyId_status_program_idx" ON "courses"("academyId", "status", "program");
CREATE INDEX "courses_tutorId_idx" ON "courses"("tutorId");

CREATE TABLE "course_modules" (
  "id"          TEXT NOT NULL,
  "courseId"    TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "position"    INTEGER NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "course_modules_courseId_position_idx" ON "course_modules"("courseId", "position");
