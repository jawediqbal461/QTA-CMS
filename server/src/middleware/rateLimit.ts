import type { NextFunction, Request, Response } from "express";

type Options = {
  windowMs: number;
  max: number;
  message?: string;
  key?: (req: Request) => string;
};

// In-memory fixed-window limiter. The API runs as a single pm2 process behind Nginx,
// so a shared store is unnecessary; counters reset on restart.
export function rateLimit({ windowMs, max, message = "Too many requests. Please try again later.", key }: Options) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of hits) if (entry.resetAt <= now) hits.delete(id);
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const id = key ? key(req) : req.ip ?? "unknown";
    const now = Date.now();
    const entry = hits.get(id);
    if (!entry || entry.resetAt <= now) {
      hits.set(id, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
