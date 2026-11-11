import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Download, BookOpen, Star, ChevronLeft } from "lucide-react";
import { accountRequest } from "../lib/api";
import { useSEO } from "../hooks/useSEO";

type Session = { token: string; role: string; name: string; email: string } | null;

function getSession(): Session {
  try {
    const raw = localStorage.getItem("qta_session");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

type Booking = {
  id: string;
  status: string;
  scheduledAtUtc: string;
  tutor?: { account?: { fullName?: string } };
};

export default function CertificatePage() {
  const navigate = useNavigate();
  const session = getSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  useSEO({ title: "Certificate of Achievement", noindex: true });

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    accountRequest("/student/bookings", session.token)
      .then((data: Booking[]) => {
        setBookings((data || []).filter(b => b.status === "COMPLETED"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!session) return (
    <div className="max-w-md mx-auto mt-24 text-center space-y-4 p-8">
      <Award size={40} className="text-neutral-600 mx-auto" />
      <h2 className="text-lg font-bold text-white">Sign in to view your certificate</h2>
      <button onClick={() => navigate("/student")} className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-sm">
        Go to Student Desk
      </button>
    </div>
  );

  const completedCount = bookings.length;
  const tutorNames = [...new Set(bookings.map(b => b.tutor?.account?.fullName).filter(Boolean))];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/student")} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition font-medium">
          <ChevronLeft size={14} /> Back to Desk
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition"
        >
          <Download size={13} /> Print / Download PDF
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-neutral-800 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : completedCount === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen size={36} className="text-neutral-600 mx-auto" />
          <p className="text-neutral-400 text-sm">Complete your first lesson to unlock your certificate.</p>
        </div>
      ) : (
        /* Certificate — printable */
        <div
          id="certificate-print"
          className="bg-white text-neutral-900 rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
          style={{ minHeight: "600px" }}
        >
          {/* Top green band */}
          <div className="bg-emerald-700 px-10 py-6 text-white text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-200 font-mono">Quran Tutors Academy</p>
            <h1 className="text-2xl md:text-3xl font-black mt-1 tracking-tight">Certificate of Achievement</h1>
          </div>

          <div className="px-10 py-10 text-center space-y-6">
            {/* Decorative circle */}
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center">
              <Award size={36} className="text-emerald-600" />
            </div>

            <p className="text-sm text-neutral-500 uppercase tracking-[0.2em] font-medium font-mono">This certifies that</p>

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-neutral-900 tracking-tight">{session.name}</h2>
              <div className="h-0.5 w-24 bg-emerald-500 mx-auto rounded-full" />
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed max-w-md mx-auto">
              has successfully completed <strong className="text-emerald-700 text-base">{completedCount} Quran lesson{completedCount !== 1 ? "s" : ""}</strong> at Quran Tutors Academy, demonstrating dedication to Quranic recitation, Tajweed, and Islamic studies.
            </p>

            {tutorNames.length > 0 && (
              <p className="text-xs text-neutral-500">
                Taught by: <span className="font-semibold text-neutral-700">{tutorNames.join(", ")}</span>
              </p>
            )}

            <div className="flex items-center justify-center gap-2 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} className="fill-amber-400" />)}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-neutral-200 max-w-sm mx-auto text-xs text-neutral-500">
              <div className="text-center">
                <div className="h-px bg-neutral-300 w-full mb-2" />
                <p className="font-semibold text-neutral-700">Date Issued</p>
                <p>{today}</p>
              </div>
              <div className="text-center">
                <div className="h-px bg-neutral-300 w-full mb-2" />
                <p className="font-semibold text-neutral-700">Academy Director</p>
                <p>Quran Tutors Academy</p>
              </div>
            </div>
          </div>

          {/* Bottom band */}
          <div className="bg-emerald-50 border-t border-emerald-100 px-10 py-4 text-center">
            <p className="text-[10px] text-emerald-700 font-mono tracking-wider uppercase">
              new.qurantutorsacademy.com · Verified Academy Certificate
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; }
          #certificate-print { width: 100%; }
          button, header, footer, nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
