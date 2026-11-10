import type { NextFunction, Request, Response } from "express";
import { verifySession, type SessionPayload } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

// Re-checks the account's academy membership on every request rather than
// trusting the JWT's role/status claims for the token's whole lifetime.
// This is what makes a revoked or suspended membership take effect
// immediately, instead of only at the token's next expiry.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  let payload: SessionPayload;
  try {
    payload = verifySession(token);
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  try {
    const membership = await prisma.academyMembership.findUnique({
      where: { academyId_accountId: { academyId: payload.academyId, accountId: payload.accountId } },
    });
    if (!membership || membership.status !== "ACTIVE") {
      return res.status(401).json({ error: "Session is no longer valid" });
    }
    req.session = { accountId: payload.accountId, academyId: payload.academyId, role: membership.role };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: SessionPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !roles.includes(req.session.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
