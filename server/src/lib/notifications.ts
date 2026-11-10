import type { Prisma } from "@prisma/client";
import nodemailer from "nodemailer";
import { prisma } from "./prisma.js";
import { verificationToken } from "./verification.js";

type BookingNotice = { id: string; academyId: string; tutorId: string; studentId: string; scheduledAtUtc: Date };

export async function notifyBooking(tx: Prisma.TransactionClient, booking: BookingNotice,
  action: "booked" | "rescheduled" | "cancelled" | "completed" | "no-show") {
  const { id, academyId, tutorId, studentId, scheduledAtUtc } = booking;
  await tx.portalNotification.updateMany({
    where: { bookingId: id, kind: "REMINDER", cancelledAt: null },
    data: { cancelledAt: new Date() },
  });
  const recipients = await tx.academyMembership.findMany({
    where: {
      academyId, status: "ACTIVE",
      OR: [
        { role: "TUTOR", accountId: tutorId },
        { role: "STUDENT", accountId: studentId, account: { email: { not: { endsWith: "@learner.invalid" } } } },
        { role: "GUARDIAN", account: { guardianLinks: { some: { studentId } } } },
      ],
    },
    select: { accountId: true },
  });
  const base = recipients.map(({ accountId }) => ({ accountId, academyId, bookingId: id }));
  const time = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(scheduledAtUtc);
  const reminders = action === "booked" || action === "rescheduled";
  const due = new Date(scheduledAtUtc.getTime() - 15 * 60_000);
  await tx.portalNotification.createMany({ data: [
    ...base.map((recipient) => ({
      ...recipient, kind: "BOOKING", title: `Lesson ${action}`,
      message: `Lesson time: ${time} UTC. Open your desk for details.`,
    })),
    ...(reminders && due.getTime() > Date.now() ? base.map((recipient) => ({
      ...recipient, kind: "REMINDER", title: "Lesson starts in 15 minutes",
      message: `Lesson time: ${time} UTC. Open your desk to join when the meeting window opens.`,
      visibleAt: due, nextAttempt: due,
    })) : []),
  ] });
}

// SMTP, not a transactional-email API — works with any mailbox (Hestia's
// own mail server, Gmail, a hosting provider's SMTP, etc.).
export function mailConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM?.trim();
  if (!host || !user || !pass || !from || !process.env.PUBLIC_APP_URL || !Number.isInteger(port) || port <= 0) return null;
  try {
    const app = new URL(process.env.PUBLIC_APP_URL);
    return app.protocol === "https:" && !app.username && !app.password ? { host, port, user, pass, from, app } : null;
  } catch {
    return null;
  }
}

export function startNotificationWorker() {
  const config = mailConfig();
  if (!config) {
    console.warn("Email delivery is disabled. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM, and an HTTPS PUBLIC_APP_URL.");
    return;
  }
  const { host, port, user, pass, from, app } = config;
  const transporter = nodemailer.createTransport({
    host, port, secure: port === 465, auth: { user, pass },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 10_000,
  });
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const pending = await prisma.portalNotification.findMany({
        where: { emailedAt: null, cancelledAt: null, nextAttempt: { lte: now }, attempts: { lt: 6 } },
        orderBy: { nextAttempt: "asc" }, take: 10,
        include: { account: { select: { email: true, emailVerifiedAt: true } } },
      });
      for (const event of pending) {
        const claimed = await prisma.portalNotification.updateMany({
          where: { id: event.id, nextAttempt: event.nextAttempt, emailedAt: null, cancelledAt: null, attempts: event.attempts },
          data: { attempts: { increment: 1 }, nextAttempt: new Date(Date.now() + 60_000 * 2 ** event.attempts) },
        });
        if (!claimed.count) continue;
        const verify = event.kind === "VERIFY_EMAIL";
        if ((verify && (event.account.emailVerifiedAt || Date.now() >= event.createdAt.getTime() + 86_400_000)) ||
          (!verify && !event.account.emailVerifiedAt) ||
          (event.kind === "REMINDER" && Date.now() >= event.visibleAt.getTime() + 15 * 60_000)) {
          // Keep booking alerts in the portal even when their email is skipped.
          await prisma.portalNotification.update({ where: { id: event.id }, data: verify
            ? { cancelledAt: new Date() } : { attempts: 6 } });
          continue;
        }
        const membership = await prisma.academyMembership.findUnique({
          where: { academyId_accountId: { academyId: event.academyId, accountId: event.accountId } },
        });
        if (membership?.status !== "ACTIVE") {
          await prisma.portalNotification.update({ where: { id: event.id }, data: { cancelledAt: new Date() } });
          continue;
        }
        const url = verify ? new URL("/verify-email", app) : new URL(
          membership.role === "TUTOR" ? "/tutor" : membership.role === "GUARDIAN" ? "/guardian" : "/student", app);
        if (verify) url.hash = verificationToken(event.accountId, event.account.email, event.createdAt);
        try {
          await transporter.sendMail({
            from, to: event.account.email, subject: event.title,
            text: `${event.message}\n\n${url.href}`,
            headers: { "X-Idempotency-Key": event.id },
          });
          await prisma.portalNotification.update({ where: { id: event.id }, data: { emailedAt: new Date() } });
        } catch (error) {
          console.error("Notification email failed", event.id, error instanceof Error ? error.message : "Unknown error");
        }
      }
    } catch (error) { console.error("Notification worker failed", error); }
    finally { running = false; }
  };
  void tick();
  setInterval(() => void tick(), 30_000).unref();
}
