import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { recordAudit } from "../lib/audit.js";

async function defaultAcademy() {
  return prisma.academy.findFirst({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
}

const postListSelect = {
  id: true, title: true, slug: true, excerpt: true, author: true, coverImage: true,
  publishedAt: true, tags: true,
} as const;

// ─── Public ──────────────────────────────────────────────────────────────────

export const contentPublicRouter = Router();

contentPublicRouter.get("/blog", asyncHandler(async (_req, res) => {
  const academy = await defaultAcademy();
  if (!academy) return res.json([]);
  res.json(await prisma.blogPost.findMany({
    where: { academyId: academy.id, status: "Published" },
    orderBy: { publishedAt: "desc" },
    select: postListSelect,
  }));
}));

contentPublicRouter.get("/blog/:slug", asyncHandler(async (req, res) => {
  const academy = await defaultAcademy();
  const post = academy && await prisma.blogPost.findFirst({
    where: { academyId: academy.id, slug: req.params.slug, status: "Published" },
    select: { ...postListSelect, content: true, seoTitle: true, seoDescription: true, seoImage: true },
  });
  if (!post) return res.status(404).json({ error: "Article not found." });
  res.json(post);
}));

contentPublicRouter.get("/quran/overrides", asyncHandler(async (_req, res) => {
  res.json(await prisma.quranSurahOverride.findMany({
    select: {
      number: true, nameArabic: true, nameEnglish: true, englishNameTranslation: true,
      revelationType: true, audioUrl: true, seoTitle: true, seoDescription: true,
    },
  }));
}));

contentPublicRouter.get("/quran/surahs/:number", asyncHandler(async (req, res) => {
  const number = Number(req.params.number);
  if (!Number.isInteger(number) || number < 1 || number > 114) return res.status(404).json({ error: "Not found." });
  const row = await prisma.quranSurahOverride.findUnique({ where: { number } });
  if (!row) return res.status(404).json({ error: "No override." });
  res.json(row);
}));

contentPublicRouter.get("/quran/juz", asyncHandler(async (_req, res) => {
  res.json(await prisma.quranJuz.findMany({ orderBy: { number: "asc" } }));
}));

// ─── Admin ───────────────────────────────────────────────────────────────────

export const contentAdminRouter = Router();
contentAdminRouter.use(requireAuth, requireRole("ACADEMY_ADMIN", "PLATFORM_ADMIN"));

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const optionalText = (max: number) => z.string().trim().max(max).optional();
const imageUrl = z.string().trim().max(2000).refine((value) => value === "" || /^https?:\/\//i.test(value), "Image must be an http(s) URL");

const blogBody = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().max(120).regex(slugPattern).optional().or(z.literal("")),
  excerpt: optionalText(500),
  content: z.string().trim().min(1).max(100_000),
  author: optionalText(100),
  coverImage: imageUrl.optional(),
  status: z.enum(["Draft", "Published"]),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  seoTitle: optionalText(200),
  seoDescription: optionalText(300),
  seoImage: imageUrl.optional(),
});

const DEFAULT_COVER = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400";

function slugFromTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "post";
}

function blogData(body: z.infer<typeof blogBody>) {
  return {
    title: body.title,
    slug: body.slug || slugFromTitle(body.title),
    excerpt: body.excerpt || body.title,
    content: body.content,
    author: body.author || "Administrator",
    coverImage: body.coverImage || DEFAULT_COVER,
    status: body.status,
    tags: body.tags,
    seoTitle: body.seoTitle || null,
    seoDescription: body.seoDescription || null,
    seoImage: body.seoImage || null,
  };
}

contentAdminRouter.get("/blog", asyncHandler(async (req, res) => {
  res.json(await prisma.blogPost.findMany({
    where: { academyId: req.session!.academyId },
    orderBy: { createdAt: "desc" },
  }));
}));

contentAdminRouter.post("/blog", asyncHandler(async (req, res) => {
  const parsed = blogBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the title, slug, content, and image links." });
  const { academyId, accountId } = req.session!;
  const post = await prisma.blogPost.create({ data: { academyId, ...blogData(parsed.data) } });
  await recordAudit({ actorId: accountId, academyId, action: "blog.created", targetType: "blog_post", targetId: post.id });
  res.status(201).json(post);
}));

contentAdminRouter.patch("/blog/:id", asyncHandler(async (req, res) => {
  const parsed = blogBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the title, slug, content, and image links." });
  const { academyId, accountId } = req.session!;
  const existing = await prisma.blogPost.findFirst({ where: { id: req.params.id, academyId } });
  if (!existing) return res.status(404).json({ error: "Article not found." });
  const data = blogData(parsed.data);
  const post = await prisma.blogPost.update({
    where: { id: existing.id },
    data: { ...data, ...(existing.status !== "Published" && data.status === "Published" ? { publishedAt: new Date() } : {}) },
  });
  await recordAudit({ actorId: accountId, academyId, action: "blog.updated", targetType: "blog_post", targetId: post.id });
  res.json(post);
}));

contentAdminRouter.delete("/blog/:id", asyncHandler(async (req, res) => {
  const { academyId, accountId } = req.session!;
  const removed = await prisma.blogPost.deleteMany({ where: { id: req.params.id, academyId } });
  if (!removed.count) return res.status(404).json({ error: "Article not found." });
  await recordAudit({ actorId: accountId, academyId, action: "blog.deleted", targetType: "blog_post", targetId: req.params.id });
  res.json({ deleted: true });
}));

const surahBody = z.object({
  nameArabic: optionalText(100),
  nameEnglish: optionalText(100),
  englishNameTranslation: optionalText(150),
  revelationType: z.enum(["Meccan", "Medinan"]).optional(),
  audioUrl: z.string().trim().max(2000).refine((value) => value === "" || /^https?:\/\//i.test(value), "Audio must be an http(s) URL").optional(),
  seoTitle: optionalText(200),
  seoDescription: optionalText(300),
  ayahs: z.array(z.object({
    numberInSurah: z.number().int().min(1).max(300),
    arabic: z.string().trim().min(1).max(5000),
    translation: z.string().trim().max(5000),
  })).max(300).optional(),
});

function surahNumber(raw: string) {
  const number = Number(raw);
  return Number.isInteger(number) && number >= 1 && number <= 114 ? number : null;
}

contentAdminRouter.get("/quran/surahs", asyncHandler(async (_req, res) => {
  res.json(await prisma.quranSurahOverride.findMany({ orderBy: { number: "asc" } }));
}));

contentAdminRouter.put("/quran/surahs/:number", asyncHandler(async (req, res) => {
  const number = surahNumber(req.params.number);
  const parsed = surahBody.safeParse(req.body);
  if (number === null || !parsed.success) return res.status(400).json({ error: "Check the surah number, names, audio link, and verses." });
  const { ayahs, ...fields } = parsed.data;
  const data = {
    nameArabic: fields.nameArabic || null, nameEnglish: fields.nameEnglish || null,
    englishNameTranslation: fields.englishNameTranslation || null,
    revelationType: fields.revelationType ?? null, audioUrl: fields.audioUrl || null,
    seoTitle: fields.seoTitle || null, seoDescription: fields.seoDescription || null,
    ayahs: ayahs ?? undefined,
  };
  const row = await prisma.quranSurahOverride.upsert({ where: { number }, create: { number, ...data }, update: data });
  await recordAudit({ actorId: req.session!.accountId, academyId: req.session!.academyId, action: "quran.surah_saved", targetType: "quran_surah", targetId: String(number) });
  res.json(row);
}));

contentAdminRouter.delete("/quran/surahs/:number", asyncHandler(async (req, res) => {
  const number = surahNumber(req.params.number);
  if (number === null) return res.status(400).json({ error: "Invalid surah number." });
  await prisma.quranSurahOverride.deleteMany({ where: { number } });
  res.json({ reset: true });
}));

const juzBody = z.object({
  nameArabic: z.string().trim().min(1).max(100),
  nameEnglish: z.string().trim().min(1).max(100),
  startInfo: z.string().trim().max(150),
});

contentAdminRouter.put("/quran/juz/:number", asyncHandler(async (req, res) => {
  const number = Number(req.params.number);
  const parsed = juzBody.safeParse(req.body);
  if (!Number.isInteger(number) || number < 1 || number > 30 || !parsed.success) {
    return res.status(400).json({ error: "Check the juz number and names." });
  }
  res.json(await prisma.quranJuz.upsert({ where: { number }, create: { number, ...parsed.data }, update: parsed.data }));
}));

contentAdminRouter.delete("/quran/juz/:number", asyncHandler(async (req, res) => {
  const number = Number(req.params.number);
  if (!Number.isInteger(number) || number < 1 || number > 30) return res.status(400).json({ error: "Invalid juz number." });
  await prisma.quranJuz.deleteMany({ where: { number } });
  res.json({ reset: true });
}));
