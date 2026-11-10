ALTER TABLE "progress_entries" ADD COLUMN "bookingId" TEXT;
CREATE UNIQUE INDEX "progress_entries_bookingId_key" ON "progress_entries"("bookingId");
ALTER TABLE "progress_entries"
  ADD CONSTRAINT "progress_entries_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
