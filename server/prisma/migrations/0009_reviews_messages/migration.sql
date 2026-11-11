-- M17: Tutor reviews
CREATE TABLE "tutor_reviews" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tutor_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tutor_reviews_tutorId_authorId_key" ON "tutor_reviews"("tutorId", "authorId");
CREATE INDEX "tutor_reviews_tutorId_createdAt_idx" ON "tutor_reviews"("tutorId", "createdAt");
ALTER TABLE "tutor_reviews" ADD CONSTRAINT "tutor_reviews_tutorId_fkey"
    FOREIGN KEY ("tutorId") REFERENCES "tutor_profiles"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutor_reviews" ADD CONSTRAINT "tutor_reviews_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- M19: In-portal messaging
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_academyId_fromId_createdAt_idx" ON "messages"("academyId", "fromId", "createdAt");
CREATE INDEX "messages_academyId_toId_createdAt_idx" ON "messages"("academyId", "toId", "createdAt");
ALTER TABLE "messages" ADD CONSTRAINT "messages_fromId_fkey"
    FOREIGN KEY ("fromId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_toId_fkey"
    FOREIGN KEY ("toId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
