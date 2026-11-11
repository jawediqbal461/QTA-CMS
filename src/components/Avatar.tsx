import { useEffect, useState } from "react";

// Shows a profile photo and falls back to the person's initial when there is no photo or it fails to load.
export default function Avatar({ src, name, className = "h-11 w-11 text-sm" }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return src && !failed ? (
    <img src={src} alt={name} onError={() => setFailed(true)} className={`shrink-0 rounded-2xl border border-emerald-500/20 object-cover ${className}`} />
  ) : (
    <div aria-label={name} className={`flex shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950 font-black text-emerald-400 ${className}`}>
      {initial}
    </div>
  );
}

export const tutorAvatarUrl = (accountId: string) => `/api/tutors/${accountId}/avatar`;
