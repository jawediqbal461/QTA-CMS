ALTER TABLE "accounts" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE TABLE "portal_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "academyId" TEXT NOT NULL,
    "bookingId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "visibleAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "emailedAt" TIMESTAMP(3),
    "nextAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3)
);
CREATE INDEX "portal_notifications_accountId_academyId_visibleAt_idx" ON "portal_notifications"("accountId", "academyId", "visibleAt");
CREATE INDEX "portal_notifications_bookingId_kind_idx" ON "portal_notifications"("bookingId", "kind");
CREATE INDEX "portal_notifications_nextAttempt_idx" ON "portal_notifications"("nextAttempt");
