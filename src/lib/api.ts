// Relative path works in both dev (proxied to the API by vite.config.ts)
// and production (same-origin, proxied by Nginx — see server/README.md).
const API_BASE = "/api";

export const ADMIN_TOKEN_KEY = "qta_admin_token";

export interface AdminAccount {
  id: string;
  email: string;
  fullName: string;
  role: string;
  academy: { id: string; name: string; slug: string };
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body && typeof body.error === "string" && body.error) ||
      "Something went wrong. Please try again.";
    throw new ApiError(res.status, message);
  }
  return body as T;
}

export function loginAdmin(email: string, password: string) {
  return request<{ token: string; account: AdminAccount }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearStoredAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
}
