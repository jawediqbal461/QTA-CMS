import "dotenv/config";
import express from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { tutorRouter } from "./routes/tutor.js";
import { guardianRouter } from "./routes/guardian.js";
import { directoryRouter } from "./routes/directory.js";
import { resourcesRouter } from "./routes/resources.js";
import { coursesRouter } from "./routes/courses.js";
import { notificationsRouter } from "./routes/notifications.js";
import { reviewsRouter } from "./routes/reviews.js";
import { messagesRouter } from "./routes/messages.js";
import { classroomRouter } from "./routes/classroom.js";
import { quizRouter } from "./routes/quiz.js";
import { mailConfig, startNotificationWorker } from "./lib/notifications.js";
import { prisma } from "./lib/prisma.js";
import { asyncHandler } from "./lib/asyncHandler.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  })
);
app.use(express.json());

// Registered at both paths: the Nginx proxy forwards the full
// /api/* prefix as-is (see server/README.md), but /health alone is
// handy for direct checks against 127.0.0.1:4000 on the VPS.
const healthHandler = asyncHandler(async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", db: "unreachable" });
  }
});
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);
app.get("/api/health/email", (_req, res) => {
  const configured = !!mailConfig();
  res.status(configured ? 200 : 503).json({ status: configured ? "configured" : "unavailable" });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/tutor", tutorRouter);
app.use("/api/guardian", guardianRouter);
app.use("/api/tutors", directoryRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/tutors/:tutorId/reviews", reviewsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/classroom", classroomRouter);
app.use("/api/quiz", quizRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({ error: "A record with those details already exists." });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, "127.0.0.1", () => {
  console.log(`QTA CMS API listening on 127.0.0.1:${port}`);
});
startNotificationWorker();
