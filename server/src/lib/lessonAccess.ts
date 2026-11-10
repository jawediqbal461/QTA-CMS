import { MINUTE } from "./scheduling.js";

export const meetingWindowMessage = "Meeting access is available from 10 minutes before class until 15 minutes after the scheduled end.";

export const lessonSummary = {
  lessonSession: { select: { endedAt: true, tutorNotes: true } },
  progressEntry: {
    select: { currentBook: true, currentChapter: true, currentVerse: true, tajweedScore: true, hifzPercent: true },
  },
} as const;

export function canJoinLesson(booking: { status: string; scheduledAtUtc: Date; durationMinutes: number }, now = Date.now()) {
  const start = booking.scheduledAtUtc.getTime();
  return ["BOOKED", "RESCHEDULED"].includes(booking.status) &&
    now >= start - 10 * MINUTE && now < start + (booking.durationMinutes + 15) * MINUTE;
}
