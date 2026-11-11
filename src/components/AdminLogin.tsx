import React, { useState } from "react";
import {
  Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound,
  ShieldCheck, HelpCircle, AlertCircle
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { ApiError, ADMIN_TOKEN_KEY, loginAdmin } from "../lib/api";

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export default function AdminLogin({ onLoginSuccess, onBackToHome }: AdminLoginProps) {
  useSEO({ title: "Admin Login", noindex: true });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all security fields.");
      return;
    }

    setIsLoading(true);
    try {
      const { token, account } = await loginAdmin(email.trim(), password);
      if (account.role !== "ACADEMY_ADMIN" && account.role !== "PLATFORM_ADMIN") {
        setIsLoading(false);
        setError("This account does not have administrator access.");
        return;
      }
      setIsLoading(false);
      setSuccess(true);

      if (rememberMe) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      }

      // Let the success animation play for a moment before navigation
      setTimeout(() => {
        onLoginSuccess();
      }, 1200);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid administrator email or passphrase.");
      } else {
        setError("Could not reach the admin service. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden text-neutral-200">
      
      {/* Background ambient glowing shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
      
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 relative z-10">
        
        {/* Navigation back and branding */}
        <div className="flex justify-between items-center">
          <button 
            onClick={onBackToHome}
            className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Portal Home</span>
          </button>

          <div className="flex items-center space-x-1.5 bg-neutral-950 px-2.5 py-1 rounded-full border border-neutral-850">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Secure session</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 bg-amber-950 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
            <KeyRound size={22} />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Admin Gatekeeper</h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Authorized Quran Tutors Academy administrative credentials required to access CMS datasets.
          </p>
        </div>

        {/* MAIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* EMAIL FIELD */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 block">Admin Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Mail size={15} />
              </span>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="admin@qurantutorsacademy.com"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/50 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-neutral-600 outline-none transition"
                disabled={isLoading || success}
              />
            </div>
          </div>

          {/* PASSWORD FIELD */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-neutral-300">Security Passphrase</label>
            </div>
            
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                <Lock size={15} />
              </span>
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/50 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-neutral-600 outline-none transition"
                disabled={isLoading || success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-500 hover:text-white transition"
                tabIndex={-1}
                aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* REMEMBER ME TOGGLE */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-neutral-400 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-neutral-950 border-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                disabled={isLoading || success}
              />
              <span>Remember active session</span>
            </label>
          </div>

          {/* ERROR STATUS WINDOW */}
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/25 text-rose-300 p-3 rounded-xl flex items-start space-x-2.5 animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
              <p className="text-[11px] leading-relaxed font-medium">{error}</p>
            </div>
          )}

          {/* SUCCESS STATUS WINDOW */}
          {success && (
            <div className="bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 p-3 rounded-xl flex items-center space-x-2.5 animate-fade-in">
              <ShieldCheck size={16} className="shrink-0 text-emerald-400 animate-bounce" />
              <p className="text-[11px] leading-relaxed font-bold">Token approved! Redirecting securely...</p>
            </div>
          )}

          {/* ACTIONS SUBMIT */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 disabled:opacity-55 disabled:cursor-not-allowed font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-amber-500/10 transition flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : success ? (
              <span>Session Authorized</span>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Verify & Enter Admin CMS</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
