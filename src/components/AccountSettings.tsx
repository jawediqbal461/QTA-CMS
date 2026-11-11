import { createElement, useRef, useState, type ReactNode } from "react";
import { Camera, KeyRound, Mail, Trash2, UserRound } from "lucide-react";
import { accountRequest } from "../lib/api";
import Avatar from "./Avatar";
import TimeZonePicker from "./TimeZonePicker";

export type AccountProfile = {
  id: string; email: string; fullName: string; timeZone: string; role: string;
  phone: string | null; country: string | null; city: string | null; address: string | null; avatar: string | null;
};

const panel = "space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6";
const field = "w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition focus:border-emerald-500/50";
const primary = "inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-neutral-950 transition disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2 text-xs font-bold text-white transition disabled:opacity-50";

function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <p role="alert" className="rounded-xl border border-rose-500/25 bg-rose-950/40 px-3.5 py-2.5 text-xs font-medium text-rose-300">{error}</p>;
  if (ok) return <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-950/40 px-3.5 py-2.5 text-xs font-medium text-emerald-300">{ok}</p>;
  return null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-xs font-bold text-neutral-300">{label}{children}</label>;
}

const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong.";

// Scales and crops the chosen photo to a small square so it stays well under the upload limit.
function squareJpeg(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(image.width, image.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Your browser could not process this image."));
      context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file is not a readable image.")); };
    image.src = url;
  });
}

function PhotoCard({ token, profile, refresh }: { token: string; profile: AccountProfile; refresh: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function upload(file: File) {
    setBusy(true); setError(""); setOk("");
    try {
      const image = await squareJpeg(file);
      await accountRequest("/auth/me/avatar", token, "PUT", { image });
      setOk("Photo updated.");
      refresh();
    } catch (failure) { setError(errorText(failure)); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  return (
    <section className={panel}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Camera size={15} className="text-emerald-400" /> Profile photo</h2>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar src={profile.avatar} name={profile.fullName} className="h-20 w-20 text-2xl" />
        <div className="space-y-2">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading…" : profile.avatar ? "Change photo" : "Upload photo"}</button>
            {profile.avatar && (
              <button type="button" className={secondary} disabled={busy} onClick={async () => {
                setBusy(true); setError(""); setOk("");
                try { await accountRequest("/auth/me/avatar", token, "DELETE"); setOk("Photo removed."); refresh(); }
                catch (failure) { setError(errorText(failure)); }
                finally { setBusy(false); }
              }}><Trash2 size={12} /> Remove</button>
            )}
          </div>
          <p className="text-[11px] text-neutral-500">PNG, JPEG or WebP. It is cropped to a square.{profile.role === "TUTOR" ? " Approved tutors' photos are shown on the public directory." : " Only you and the academy team can see it."}</p>
        </div>
      </div>
      <Notice error={error} ok={ok} />
    </section>
  );
}

function DetailsCard({ token, role, profile, refresh }: { token: string; role: string; profile: AccountProfile; refresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  return (
    <form className={panel} onSubmit={async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      setBusy(true); setError(""); setOk("");
      try {
        await accountRequest("/auth/me", token, "PATCH", {
          fullName: String(data.get("fullName") ?? ""), phone: String(data.get("phone") ?? ""),
          country: String(data.get("country") ?? ""), city: String(data.get("city") ?? ""),
          address: String(data.get("address") ?? ""), timeZone: String(data.get("timeZone") ?? ""),
        });
        setOk("Your details were saved.");
        refresh();
      } catch (failure) { setError(errorText(failure)); }
      finally { setBusy(false); }
    }}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-white"><UserRound size={15} className="text-emerald-400" /> Personal details</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name"><input className={field} name="fullName" required minLength={2} maxLength={120} defaultValue={profile.fullName} /></Field>
        <Field label="Phone / WhatsApp"><input className={field} name="phone" type="tel" maxLength={40} defaultValue={profile.phone ?? ""} placeholder="+92 300 1234567" /></Field>
        <Field label="Country"><input className={field} name="country" maxLength={80} defaultValue={profile.country ?? ""} placeholder="Pakistan" /></Field>
        <Field label="City"><input className={field} name="city" maxLength={80} defaultValue={profile.city ?? ""} placeholder="Karachi" /></Field>
      </div>
      <Field label="Address"><textarea className={field} name="address" rows={2} maxLength={300} defaultValue={profile.address ?? ""} placeholder="Street, area, postal code" /></Field>
      <Field label="Time zone (lesson times are shown in this zone)"><TimeZonePicker name="timeZone" className={field} defaultValue={profile.timeZone} /></Field>
      {role === "TUTOR" && <p className="text-xs text-neutral-400">Changing your public name sends your teaching profile back to admin review.</p>}
      <Notice error={error} ok={ok} />
      <button className={primary} disabled={busy}>{busy ? "Saving…" : "Save details"}</button>
    </form>
  );
}

function SecurityCard({ token, profile, onSignOut }: { token: string; profile: AccountProfile; onSignOut: () => void }) {
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordOk, setPasswordOk] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailOk, setEmailOk] = useState("");

  return (
    <section className={panel}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-white"><KeyRound size={15} className="text-emerald-400" /> Sign-in details</h2>

      <form className="space-y-3" onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const next = String(data.get("newPassword") ?? "");
        if (next !== String(data.get("confirmPassword") ?? "")) { setPasswordError("The new passwords do not match."); setPasswordOk(""); return; }
        setPasswordBusy(true); setPasswordError(""); setPasswordOk("");
        try {
          await accountRequest("/auth/password", token, "PATCH", { currentPassword: String(data.get("currentPassword") ?? ""), newPassword: next });
          setPasswordOk("Password changed.");
          form.reset();
        } catch (failure) { setPasswordError(errorText(failure)); }
        finally { setPasswordBusy(false); }
      }}>
        <h3 className="text-xs font-bold text-neutral-300">Change password</h3>
        <Field label="Current password"><input className={field} name="currentPassword" type="password" required autoComplete="current-password" /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="New password (10+ characters)"><input className={field} name="newPassword" type="password" required minLength={10} autoComplete="new-password" /></Field>
          <Field label="Confirm new password"><input className={field} name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" /></Field>
        </div>
        <Notice error={passwordError} ok={passwordOk} />
        <button className={primary} disabled={passwordBusy}>{passwordBusy ? "Saving…" : "Change password"}</button>
      </form>

      <form className="space-y-3 border-t border-neutral-800 pt-4" onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        if (!window.confirm("You will be signed out and must verify the new address before signing in again. Continue?")) return;
        setEmailBusy(true); setEmailError(""); setEmailOk("");
        try {
          await accountRequest("/auth/email", token, "PATCH", { newEmail: String(data.get("newEmail") ?? ""), password: String(data.get("password") ?? "") });
          setEmailOk("Check your new inbox for a verification link. Signing you out…");
          window.setTimeout(onSignOut, 2500);
        } catch (failure) { setEmailError(errorText(failure)); }
        finally { setEmailBusy(false); }
      }}>
        <h3 className="flex items-center gap-1.5 text-xs font-bold text-neutral-300"><Mail size={12} /> Email address</h3>
        <p className="break-words text-xs text-neutral-400">Current: {profile.email}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="New email address"><input className={field} name="newEmail" type="email" required autoComplete="email" /></Field>
          <Field label="Current password"><input className={field} name="password" type="password" required autoComplete="current-password" /></Field>
        </div>
        <Notice error={emailError} ok={emailOk} />
        <button className={secondary} disabled={emailBusy}>{emailBusy ? "Sending…" : "Change email"}</button>
      </form>
    </section>
  );
}

export default function AccountSettings({ token, role, profile, refresh, onSignOut }: {
  token: string; role: string; profile: AccountProfile; refresh: () => void; onSignOut: () => void;
}) {
  return (
    <div id="desk-profile" className="space-y-4 scroll-mt-24">
      <PhotoCard token={token} profile={profile} refresh={refresh} />
      {createElement(DetailsCard, {
        key: [profile.id, profile.fullName, profile.timeZone, profile.phone, profile.country, profile.city, profile.address].join("|"),
        token, role, profile, refresh,
      })}
      <SecurityCard token={token} profile={profile} onSignOut={onSignOut} />
    </div>
  );
}
