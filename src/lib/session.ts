// The portal stores the raw JWT string per role (see AccountPortal in Marketplace.tsx).
export type StoredSession = { token: string; role: "tutor" | "guardian" | "student" };

export function getStoredSession(order: StoredSession["role"][] = ["student", "guardian", "tutor"]): StoredSession | null {
  for (const role of order) {
    try {
      const token = sessionStorage.getItem(`qta_session_${role}`);
      if (token) return { token, role };
    } catch { /* storage unavailable */ }
  }
  return null;
}
