import { prisma } from "./prisma.js";
import { publishedTutorWhere } from "./tutorProfile.js";
import { activeStatuses, availabilityMatcher, BOOKING_HORIZON, MINUTE, SLOT_STEP } from "./scheduling.js";

export async function availableStarts(academyId: string, tutorId: string, duration: number,
  reschedule?: { id: string; studentId: string }) {
  const tutor = await prisma.tutorProfile.findFirst({
    where: { accountId: tutorId, ...publishedTutorWhere(academyId) },
    select: { availabilitySlots: true },
  });
  if (!tutor) return null;
  const now = Date.now();
  const until = now + BOOKING_HORIZON;
  const bookings = await prisma.booking.findMany({
    where: {
      academyId, status: { in: [...activeStatuses] },
      ...(reschedule
        ? { id: { not: reschedule.id }, OR: [{ tutorId }, { studentId: reschedule.studentId }] }
        : { tutorId }),
      scheduledAtUtc: { lt: new Date(until + duration * MINUTE) },
    },
    select: { scheduledAtUtc: true, durationMinutes: true },
  });
  const occupied = bookings.map((booking) => ({
    start: booking.scheduledAtUtc.getTime(),
    end: booking.scheduledAtUtc.getTime() + booking.durationMinutes * MINUTE,
  })).filter((interval) => interval.end > now);
  const matches = availabilityMatcher(tutor.availabilitySlots);
  const slots: string[] = [];
  for (let start = Math.floor(now / SLOT_STEP) * SLOT_STEP + SLOT_STEP; start <= until; start += SLOT_STEP) {
    const end = start + duration * MINUTE;
    if (!occupied.some((interval) => start < interval.end && end > interval.start) && matches(start, duration)) {
      slots.push(new Date(start).toISOString());
    }
  }
  return slots;
}
