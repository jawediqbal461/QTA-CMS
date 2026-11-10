import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export async function recordAudit(params: {
  actorId?: string | null;
  academyId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditEvent.create({
    data: {
      actorId: params.actorId ?? null,
      academyId: params.academyId ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      metadata: params.metadata,
    },
  });
}
