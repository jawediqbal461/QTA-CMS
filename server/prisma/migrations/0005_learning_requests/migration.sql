CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'MATCHED', 'ACCEPTED', 'DECLINED', 'CANCELLED');

CREATE TABLE "learning_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "academyId" TEXT NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "guardianId" TEXT NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "program" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "preferredLang" TEXT NOT NULL,
    "budgetMax" DECIMAL(10,2),
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTutorId" TEXT REFERENCES "tutor_profiles"("accountId") ON DELETE SET NULL ON UPDATE CASCADE,
    "assignedAt" TIMESTAMP(3),
    "assignedById" TEXT REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "tutorResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "learning_requests_academyId_status_createdAt_idx" ON "learning_requests"("academyId", "status", "createdAt");
CREATE INDEX "learning_requests_guardianId_idx" ON "learning_requests"("guardianId");
CREATE INDEX "learning_requests_assignedTutorId_idx" ON "learning_requests"("assignedTutorId");
