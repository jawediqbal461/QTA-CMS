import jwt, { type SignOptions } from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export interface SessionPayload {
  accountId: string;
  academyId: string;
  role: "PLATFORM_ADMIN" | "ACADEMY_ADMIN" | "TUTOR" | "GUARDIAN" | "STUDENT";
}

export function signSession(payload: SessionPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, getJwtSecret()) as unknown as SessionPayload;
}
