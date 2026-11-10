CREATE TYPE "ResourceAccessLevel" AS ENUM ('PUBLIC', 'ENROLLED');

CREATE TABLE "resources" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "program"     TEXT NOT NULL,
  "level"       TEXT NOT NULL,
  "language"    TEXT NOT NULL,
  "format"      TEXT NOT NULL,
  "url"         TEXT NOT NULL,
  "accessLevel" "ResourceAccessLevel" NOT NULL DEFAULT 'PUBLIC',
  "published"   BOOLEAN NOT NULL DEFAULT false,
  "authorName"  TEXT,
  "createdById" TEXT REFERENCES "accounts"("id") ON DELETE SET NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resources_program_level_language_published_idx"
  ON "resources"("program", "level", "language", "published");
