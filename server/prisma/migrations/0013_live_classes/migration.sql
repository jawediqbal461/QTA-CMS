CREATE TABLE "live_classes" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "program" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "live_classes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "live_classes_academyId_status_idx" ON "live_classes"("academyId", "status");
CREATE INDEX "live_classes_tutorId_idx" ON "live_classes"("tutorId");
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutor_profiles"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "live_class_sessions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "live_class_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "live_class_sessions_classId_startsAt_idx" ON "live_class_sessions"("classId", "startsAt");
CREATE INDEX "live_class_sessions_startsAt_idx" ON "live_class_sessions"("startsAt");
ALTER TABLE "live_class_sessions" ADD CONSTRAINT "live_class_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "live_class_members" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "live_class_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "live_class_members_classId_studentId_key" ON "live_class_members"("classId", "studentId");
CREATE INDEX "live_class_members_enrolledById_idx" ON "live_class_members"("enrolledById");
ALTER TABLE "live_class_members" ADD CONSTRAINT "live_class_members_classId_fkey" FOREIGN KEY ("classId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_members" ADD CONSTRAINT "live_class_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_members" ADD CONSTRAINT "live_class_members_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "mistake_logs" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "roomKey" TEXT NOT NULL,
    "studentId" TEXT,
    "recordedById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mistake_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "mistake_logs_roomKey_createdAt_idx" ON "mistake_logs"("roomKey", "createdAt");
CREATE INDEX "mistake_logs_studentId_createdAt_idx" ON "mistake_logs"("studentId", "createdAt");

CREATE TABLE "live_recordings" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "roomKey" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RECORDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "live_recordings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "live_recordings_roomKey_createdAt_idx" ON "live_recordings"("roomKey", "createdAt");
CREATE INDEX "live_recordings_academyId_createdAt_idx" ON "live_recordings"("academyId", "createdAt");
