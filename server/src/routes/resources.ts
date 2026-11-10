import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { verifySession } from "../lib/jwt.js";

export const resourcesRouter = Router();

const resourceSelect = {
  id: true, title: true, description: true, program: true, level: true,
  language: true, format: true, url: true, accessLevel: true,
  authorName: true, createdAt: true,
} as const;

function isAuthenticated(req: import("express").Request): boolean {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return false;
  try { verifySession(token); return true; } catch { return false; }
}

const filterSchema = z.object({
  program:  z.string().optional(),
  level:    z.string().optional(),
  language: z.string().optional(),
  format:   z.string().optional(),
});

resourcesRouter.get("/", asyncHandler(async (req, res) => {
  const parsed = filterSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid filter parameters." });
  const { program, level, language, format } = parsed.data;
  const authenticated = isAuthenticated(req);
  res.json(await prisma.resource.findMany({
    where: {
      published: true,
      ...(authenticated ? {} : { accessLevel: "PUBLIC" }),
      ...(program  ? { program }  : {}),
      ...(level    ? { level }    : {}),
      ...(language ? { language } : {}),
      ...(format   ? { format }   : {}),
    },
    orderBy: [{ program: "asc" }, { level: "asc" }, { title: "asc" }],
    select: resourceSelect,
  }));
}));
