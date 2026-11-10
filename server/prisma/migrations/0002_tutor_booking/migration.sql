CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "tutor_profiles" ADD COLUMN "qualifications" TEXT;
DROP INDEX "bookings_tutorId_scheduledAtUtc_key";

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_tutor_no_overlap"
  EXCLUDE USING gist ("tutorId" WITH =,
    tsrange("scheduledAtUtc", "scheduledAtUtc" + "durationMinutes" * interval '1 minute', '[)') WITH &&)
  WHERE ("status" IN ('BOOKED', 'RESCHEDULED')),
  ADD CONSTRAINT "bookings_student_no_overlap"
  EXCLUDE USING gist ("studentId" WITH =,
    tsrange("scheduledAtUtc", "scheduledAtUtc" + "durationMinutes" * interval '1 minute', '[)') WITH &&)
  WHERE ("status" IN ('BOOKED', 'RESCHEDULED'));
