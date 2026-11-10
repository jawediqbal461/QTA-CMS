CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REFUNDED');

CREATE TABLE "pilot_payments" (
  "id"            TEXT NOT NULL,
  "academyId"     TEXT NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "bookingId"     TEXT REFERENCES "bookings"("id") ON DELETE SET NULL,
  "payerId"       TEXT NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "amount"        DECIMAL(10,2) NOT NULL,
  "currency"      TEXT NOT NULL DEFAULT 'USD',
  "method"        TEXT NOT NULL,
  "reference"     TEXT,
  "notes"         TEXT,
  "status"        "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "confirmedAt"   TIMESTAMP(3),
  "confirmedById" TEXT REFERENCES "accounts"("id") ON DELETE SET NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "pilot_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pilot_payments_academyId_status_createdAt_idx"
  ON "pilot_payments"("academyId", "status", "createdAt");
CREATE INDEX "pilot_payments_bookingId_idx"
  ON "pilot_payments"("bookingId");
CREATE INDEX "pilot_payments_payerId_idx"
  ON "pilot_payments"("payerId");
