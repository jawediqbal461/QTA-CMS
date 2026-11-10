import { z } from "zod";

const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const timeZoneSchema = z.string().max(100).refine((value) => {
  if (/^[+-]/.test(value)) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; }
  catch { return false; }
}, "Invalid time zone");

export const availabilitySchema = z.object({
  timeZone: timeZoneSchema,
  slots: z.array(z.object({
    weekday: z.number().int().min(0).max(6),
    startTime: clock,
    endTime: clock,
  }).refine((slot) => slot.startTime < slot.endTime)).max(42),
});

export const LESSON_MINUTES = 45;
export const MINUTE = 60_000;
export const SLOT_STEP = 15 * MINUTE;
export const BOOKING_HORIZON = 14 * 24 * 60 * MINUTE;
export const activeStatuses = ["BOOKED", "RESCHEDULED"] as const;

type Slot = z.infer<typeof availabilitySchema>["slots"][number] & { timeZone: string };
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function availabilityMatcher(slots: Slot[]) {
  const zones = new Map<string, { slots: Slot[]; formatter: Intl.DateTimeFormat }>();
  for (const slot of slots) {
    let zone = zones.get(slot.timeZone);
    if (!zone) {
      zone = {
        slots: [],
        formatter: new Intl.DateTimeFormat("en-US", {
          timeZone: slot.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
        }),
      };
      zones.set(slot.timeZone, zone);
    }
    zone.slots.push(slot);
  }
  return (start: number, duration: number) => {
    for (const zone of zones.values()) {
      let candidates = zone.slots;
      // Check each local minute, including intervals that cross a clock change.
      for (let offset = 0; offset < duration && candidates.length; offset++) {
        const parts = zone.formatter.formatToParts(start + offset * MINUTE);
        const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
        const weekday = part("weekday");
        const time = `${part("hour")}:${part("minute")}`;
        candidates = candidates.filter((slot) =>
          weekdays[slot.weekday] === weekday && time >= slot.startTime && time < slot.endTime);
      }
      if (candidates.length) return true;
    }
    return false;
  };
}
