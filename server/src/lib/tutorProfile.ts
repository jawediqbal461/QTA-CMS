import type { Prisma } from "@prisma/client";
import { z } from "zod";

const list = z.array(z.string().trim().min(1).max(80)).min(1).max(12);

export const tutorFields = z.object({
  bio: z.string().trim().max(2000).optional(),
  qualifications: z.string().trim().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(80),
  hourlyRate: z.number().positive().max(99_999).multipleOf(0.01),
  languages: list,
  specialties: list,
});

export const publicTutorSelect = {
  accountId: true, specialties: true, experienceYears: true, bio: true,
  hourlyRate: true, languages: true, account: { select: { fullName: true } },
  // Weekday only (no start/end time) - enough for a public "available on
  // Tuesdays" filter without exposing the tutor's exact daily schedule.
  availabilitySlots: { select: { weekday: true }, distinct: ["weekday"] },
} satisfies Prisma.TutorProfileSelect;

export function publishedTutorWhere(academyId: string): Prisma.TutorProfileWhereInput {
  return {
    academyId,
    approvalStatus: "APPROVED",
    account: { memberships: { some: { academyId, role: "TUTOR", status: "ACTIVE" } } },
  };
}
