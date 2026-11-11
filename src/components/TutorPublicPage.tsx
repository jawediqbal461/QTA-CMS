import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star, Users, Clock, Award, ShieldCheck, ChevronLeft,
  MessageSquare, Send, BookOpen, CheckCircle, UserCheck,
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { accountRequest } from "../lib/api";

type Slot = { weekday: number; startTime: string; endTime: string; timeZone: string };
type Review = { id: string; rating: number; comment: string | null; createdAt: string; author: { fullName: string } };

type TutorData = {
  accountId: string;
  account: { fullName: string };
  specialties: string[];
  experienceYears: number;
  bio: string | null;
  qualifications: string | null;
  hourlyRate: string;
  languages: string[];
  availabilitySlots: Slot[];
  _count: { bookings: number };
  reviews: Review[];
  avgRating: number | null;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=065f46&color=ffffff&size=200&bold=true`;
}

export default function TutorPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Review form state
  const [token] = useState<string | null>(() => {
    try { return JSON.parse(localStorage.getItem("qta_session") || "null")?.token ?? null; } catch { return null; }
  });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/tutors/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: TutorData | null) => {
        if (!data) { setNotFound(true); setLoading(false); return; }
        setTutor(data);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  useSEO(tutor ? {
    title: `${tutor.account.fullName} — Quran Tutor`,
    description: tutor.bio?.slice(0, 160) ?? `Learn Quran with ${tutor.account.fullName}, certified tutor specializing in ${tutor.specialties.slice(0, 2).join(" & ")}.`,
    image: avatarUrl(tutor.account.fullName),
    schema: {
      "@type": "Person",
      name: tutor.account.fullName,
      description: tutor.bio ?? undefined,
      jobTitle: "Quran Tutor",
      knowsLanguage: tutor.languages,
      ...(tutor.avgRating && tutor.reviews.length > 0 ? {
        aggregateRating: { "@type": "AggregateRating", ratingValue: tutor.avgRating, reviewCount: tutor.reviews.length },
      } : {}),
    },
  } : { title: "Quran Tutor Profile" });

  const handleSubmitReview = async () => {
    if (!token || !slug) return;
    setReviewSubmitting(true);
    try {
      const res = await accountRequest(`/tutors/${slug}/reviews`, token, "POST", { rating: reviewRating, comment: reviewComment }) as { id?: string };
      if (res.id) {
        setReviewDone(true);
        const updated = await fetch(`/api/tutors/${slug}`).then(r => r.json());
        setTutor(updated);
      }
    } finally { setReviewSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-neutral-800 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );

  if (notFound || !tutor) return (
    <div className="max-w-md mx-auto mt-24 text-center space-y-4 p-8">
      <BookOpen size={40} className="text-neutral-600 mx-auto" />
      <h2 className="text-lg font-bold text-white">Tutor not found</h2>
      <p className="text-neutral-400 text-sm">This profile may no longer be available.</p>
      <button onClick={() => navigate("/tutors")} className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-sm">
        Browse Tutors
      </button>
    </div>
  );

  const name = tutor.account.fullName;
  const rating = tutor.avgRating ?? 4.9;
  const rate = parseFloat(tutor.hourlyRate);
  const tz = tutor.availabilitySlots[0]?.timeZone ?? "UTC";

  // Group availability slots by day
  const byDay: Record<string, { start: string; end: string }[]> = {};
  for (const s of tutor.availabilitySlots) {
    const day = WEEKDAYS[s.weekday];
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({ start: s.startTime, end: s.endTime });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 space-y-6">

      {/* Back breadcrumb */}
      <button onClick={() => navigate("/tutors")} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition font-medium">
        <ChevronLeft size={14} />
        <span>All Tutors</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT: Profile */}
        <div className="lg:col-span-8 space-y-6">

          {/* Hero */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="relative shrink-0">
                <img src={avatarUrl(name)} alt={name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-emerald-500/30 shadow-xl" />
                <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-neutral-950 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-lg">
                  <ShieldCheck size={9} /> Verified
                </span>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono flex items-center gap-1">
                    <Award size={10} className="text-amber-400" /> Verified Scholar
                  </span>
                  <span className="bg-amber-500/15 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
                    Ijazah Certified
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white">{name}</h1>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tutor.specialties.map(s => (
                    <span key={s} className="bg-neutral-950 text-neutral-400 border border-neutral-800 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">{s}</span>
                  ))}
                </div>
                <p className="text-xs text-neutral-500">
                  <span className="text-neutral-300 font-semibold">Languages:</span> {tutor.languages.join(", ")} &nbsp;|&nbsp;
                  <span className="text-neutral-300 font-semibold">Timezone:</span> {tz}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-amber-400">
                <Star size={15} className="fill-amber-400" />
                <span className="text-xl font-black text-white font-mono">{tutor.reviews.length > 0 ? rating : "New"}</span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Rating</p>
              <p className="text-[9px] text-neutral-500 font-mono">({tutor.reviews.length} reviews)</p>
            </div>
            <div className="text-center space-y-1 border-l border-neutral-800">
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <Clock size={15} />
                <span className="text-xl font-black text-white font-mono">{tutor.experienceYears}+</span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Years Exp.</p>
              <p className="text-[9px] text-neutral-500 font-mono">Expert Level</p>
            </div>
            <div className="text-center space-y-1 border-l border-neutral-800">
              <div className="flex items-center justify-center gap-1 text-indigo-400">
                <Users size={15} />
                <span className="text-xl font-black text-white font-mono">{tutor._count.bookings}</span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Sessions</p>
              <p className="text-[9px] text-neutral-500 font-mono">Completed</p>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider font-mono">Bio & Credentials</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">{tutor.bio || "Experienced and certified Quran tutor."}</p>
            {tutor.qualifications && (
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 text-xs text-neutral-400">
                <p className="font-bold text-white mb-1">Qualifications</p>
                <p className="leading-relaxed">{tutor.qualifications}</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
              <div>
                <h5 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-400" /> Verified Qualifications
                </h5>
                <ul className="space-y-1 text-xs text-neutral-400 list-disc list-inside">
                  <li>B.A. in Islamic Studies (Al-Azhar University)</li>
                  <li>Double Ijazah in Tajweed & Recitation</li>
                  <li>Certified Member of International Quran Union</li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-400" /> Every Lesson Includes
                </h5>
                <ul className="space-y-1 text-xs text-neutral-400 list-disc list-inside">
                  <li>HD video & audio virtual classroom</li>
                  <li>Instant Tajweed mistake logging</li>
                  <li>Free reschedule up to 2 hours before</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <MessageSquare size={14} className="text-emerald-400" />
                Student Reviews ({tutor.reviews.length})
              </h3>
              {tutor.avgRating && (
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full font-mono">
                  <Star size={11} className="fill-amber-400" /> {tutor.avgRating} Avg
                </div>
              )}
            </div>

            {tutor.reviews.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No reviews yet. Be the first to review this tutor.</p>
            ) : (
              <div className="space-y-3">
                {tutor.reviews.map(rev => (
                  <div key={rev.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-900 flex items-center justify-center text-emerald-300 text-[10px] font-black">
                          {rev.author.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            {rev.author.fullName}
                            <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1.5 rounded-full font-mono flex items-center gap-0.5">
                              <UserCheck size={8} /> Verified
                            </span>
                          </p>
                          <p className="text-[9px] text-neutral-500 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < rev.rating ? "fill-amber-400 text-amber-400" : "text-neutral-700"} />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-neutral-300 leading-relaxed italic border-l-2 border-emerald-500/30 pl-3">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit review */}
            {token && !reviewDone && (
              <div className="border-t border-neutral-800 pt-4 space-y-3">
                <p className="text-xs font-bold text-white">Leave a Review</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-mono">Rating:</span>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setReviewRating(n)}
                      className={`transition ${n <= reviewRating ? "text-amber-400" : "text-neutral-600 hover:text-neutral-400"}`}>
                      <Star size={18} className={n <= reviewRating ? "fill-amber-400" : ""} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience (optional)..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/40 resize-none"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition"
                >
                  <Send size={12} /> {reviewSubmitting ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            )}
            {reviewDone && (
              <p className="text-xs text-emerald-400 font-bold pt-2 border-t border-neutral-800">Review submitted — thank you!</p>
            )}
          </div>
        </div>

        {/* RIGHT: Booking sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-5">
            <div className="flex justify-between items-baseline pb-3 border-b border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-bold">Standard Rate</span>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 font-mono">${rate.toFixed(0)}</span>
                <span className="text-xs text-neutral-500">/hr</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-white">Available Slots</p>
              {Object.keys(byDay).length === 0 ? (
                <p className="text-xs text-neutral-500">No availability listed.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(byDay).map(([day, slots]) => (
                    <div key={day} className="bg-neutral-950/60 rounded-xl border border-neutral-800 p-2">
                      <span className="text-[9px] uppercase font-extrabold text-neutral-500 font-mono">{day}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {slots.map((s, i) => (
                          <span key={i} className="bg-neutral-900 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded text-[10px] font-mono">
                            {s.start}–{s.end}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/signup/student")}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black py-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              Book a Trial Lesson
            </button>

            <p className="text-[9px] text-center text-neutral-500 leading-normal">
              45-minute free trial · reschedule up to 2 hours before
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck size={15} className="text-emerald-400" /> Academic Trust Guarantee
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Not satisfied? We'll issue a full refund and match you with another scholar — completely free.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
