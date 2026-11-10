import { createHmac, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";

const lifetime = 24 * 60 * 60_000;
const cooldown = 5 * 60_000;

function signature(accountId: string, email: string, expires: number) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return createHmac("sha256", secret).update(JSON.stringify(["verify-email", accountId, email, expires])).digest("hex");
}

export function verificationToken(accountId: string, email: string, createdAt: Date) {
  const expires = createdAt.getTime() + lifetime;
  return `${accountId}.${expires}.${signature(accountId, email, expires)}`;
}

export function validVerification(token: string, accountId: string, email: string) {
  const [id, time, hash] = token.split(".");
  const expires = Number(time);
  if (id !== accountId || !Number.isSafeInteger(expires) || expires <= Date.now() || !/^[a-f0-9]{64}$/.test(hash ?? "")) return false;
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(signature(id, email, expires), "hex"));
}

export async function queueVerification(tx: Prisma.TransactionClient, accountId: string, academyId: string) {
  const now = Date.now();
  await tx.portalNotification.upsert({
    where: { id: `verify:${accountId}:${Math.floor(now / cooldown)}` },
    update: {},
    create: {
      id: `verify:${accountId}:${Math.floor(now / cooldown)}`,
      accountId, academyId, kind: "VERIFY_EMAIL",
      title: "Verify your Quran Tutors Academy email",
      message: "Confirm your email address to sign in to your academy account. This link expires after 24 hours.",
    },
  });
}
