import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, AlertCircle, Loader2, CreditCard, Clock, RefreshCw,
  Plus, ChevronDown, ChevronUp, DollarSign, User, Calendar, FileText,
} from "lucide-react";
import { accountRequest } from "../lib/api";

// ─── Public Pricing Page ────────────────────────────────────────────────────

const PACKAGES = [
  {
    name: "Discovery Trial",
    sessions: 2,
    price: "Free",
    highlight: true,
    description: "Two complimentary sessions with a matched tutor — no commitment, no card required.",
    features: [
      "Personalised tutor matching",
      "Quran recitation assessment",
      "Tailored learning plan",
      "Full cancellation flexibility",
    ],
  },
  {
    name: "Starter",
    sessions: 8,
    price: "$120",
    perSession: "$15 / session",
    description: "Perfect for families who want to establish a consistent weekly routine.",
    features: [
      "Dedicated tutor",
      "Progress reports after every session",
      "1 free reschedule per month",
      "WhatsApp support",
    ],
  },
  {
    name: "Standard",
    sessions: 16,
    price: "$220",
    perSession: "$13.75 / session",
    description: "Our most popular plan — two sessions per week with deeper curriculum coverage.",
    features: [
      "Everything in Starter",
      "Bi-weekly parent updates",
      "2 free reschedules per month",
      "Priority tutor matching",
    ],
    badge: "Most Popular",
  },
  {
    name: "Intensive",
    sessions: 24,
    price: "$300",
    perSession: "$12.50 / session",
    description: "Three sessions per week for students preparing for exams or accelerating hifz.",
    features: [
      "Everything in Standard",
      "Dedicated senior tutor",
      "Unlimited reschedules",
      "Monthly progress certificate",
    ],
  },
];

const FAQS = [
  {
    q: "How does the trial work?",
    a: "After submitting a learning request, our staff matches you with a suitable tutor within 48 hours. You attend two sessions at no cost. If you are happy, you choose a paid package — no payment is taken until you decide to continue.",
  },
  {
    q: "What is the cancellation policy?",
    a: "You may cancel any unused sessions at any time. Starter and Standard plans allow one or two reschedules per month respectively; unused reschedules do not carry over. Intensive plans include unlimited reschedules.",
  },
  {
    q: "How are payments processed?",
    a: "During the pilot phase, payments are handled manually by our admin team — bank transfer, cash, or digital wallet — and confirmed in your portal once reconciled. Automated online checkout is on our roadmap.",
  },
  {
    q: "Can I switch plans mid-cycle?",
    a: "Yes. Contact us and we will adjust your remaining sessions to the new plan rate, crediting any difference forward.",
  },
  {
    q: "Is there a sibling discount?",
    a: "Yes — enrol two or more siblings and receive a 10% discount on each additional enrolment. Mention this when submitting your request.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 text-center">
        <div className="inline-flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
          <DollarSign size={13} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">Pilot Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
          Start with two free trial sessions — no card required. When you are ready, choose the plan that fits your
          family's pace and budget.
        </p>
      </section>

      {/* Packages */}
      <section className="px-4 pb-16 max-w-5xl mx-auto">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-2xl border p-5 flex flex-col ${
                pkg.highlight
                  ? "bg-emerald-950/40 border-emerald-500/30"
                  : pkg.badge
                  ? "bg-sky-950/30 border-sky-500/30"
                  : "bg-neutral-900/60 border-neutral-800"
              }`}
            >
              {pkg.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold bg-sky-500 text-neutral-950 px-3 py-0.5 rounded-full uppercase tracking-wider">
                  {pkg.badge}
                </span>
              )}
              <div className="mb-3">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">{pkg.name}</p>
                <p className="text-3xl font-extrabold">{pkg.price}</p>
                {pkg.perSession && <p className="text-xs text-neutral-500 mt-0.5">{pkg.perSession}</p>}
                <p className="text-xs text-neutral-500 mt-1">{pkg.sessions} sessions</p>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">{pkg.description}</p>
              <ul className="space-y-1.5 mt-auto">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start space-x-2 text-xs text-neutral-300">
                    <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Trial terms callout */}
      <section className="px-4 pb-14 max-w-2xl mx-auto">
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 text-center space-y-3">
          <Clock size={20} className="text-amber-400 mx-auto" />
          <h2 className="text-base font-bold">Trial Terms</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The two-session Discovery Trial is free for new families. Trials are non-transferable and limited to one per
            household. If you cancel mid-trial, the remaining session lapses — it cannot be rescheduled to a different
            tutor. After the trial, you are under no obligation to continue.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 max-w-2xl mx-auto">
        <h2 className="text-base font-bold text-center mb-6">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center px-4 py-3 text-xs font-semibold text-left text-white hover:bg-neutral-800/50 transition"
              >
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp size={14} className="text-neutral-400 shrink-0" /> : <ChevronDown size={14} className="text-neutral-400 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3 text-xs text-neutral-400 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Admin Payments Panel ────────────────────────────────────────────────────

type PaymentStatus = "PENDING" | "CONFIRMED" | "REFUNDED";

interface Payment {
  id: string;
  bookingId: string | null;
  payerId: string;
  amount: string;
  currency: string;
  method: string;
  reference: string | null;
  notes: string | null;
  status: PaymentStatus;
  confirmedAt: string | null;
  confirmedById: string | null;
  createdAt: string;
  payer: { fullName: string; email: string };
  confirmedBy: { fullName: string } | null;
  booking: { scheduledAtUtc: string; student: { fullName: string } } | null;
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING:   "bg-amber-900/40 text-amber-300 border-amber-500/30",
  CONFIRMED: "bg-emerald-900/40 text-emerald-300 border-emerald-500/30",
  REFUNDED:  "bg-neutral-800 text-neutral-400 border-neutral-700",
};

export function PaymentsAdminPanel({ token }: { token: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    bookingId: "", payerId: "", amount: "", currency: "USD",
    method: "", reference: "", notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountRequest<Payment[]>("/api/admin/payments", token);
      setPayments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id: string, action: "confirm" | "refund") {
    setActionId(id);
    try {
      await accountRequest(`/api/admin/payments/${id}/${action}`, token, "PATCH");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActionId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.payerId.trim()) { setFormError("Payer account ID is required."); return; }
    if (!form.amount || isNaN(Number(form.amount))) { setFormError("Valid amount is required."); return; }
    if (!form.method.trim()) { setFormError("Payment method is required."); return; }
    setSaving(true);
    try {
      await accountRequest("/api/admin/payments", token, "POST", {
        bookingId: form.bookingId.trim() || undefined,
        payerId: form.payerId.trim(),
        amount: Number(form.amount),
        currency: form.currency.trim() || "USD",
        method: form.method.trim(),
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setShowForm(false);
      setForm({ bookingId: "", payerId: "", amount: "", currency: "USD", method: "", reference: "", notes: "" });
      await load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to create payment.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-sky-500/50";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <CreditCard size={16} className="text-sky-400" />
            <span>Pilot Payment Reconciliation</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">Log and confirm manual payments from families.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={load}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-sky-500 text-neutral-950 text-xs font-bold hover:bg-sky-400 transition"
          >
            <Plus size={13} />
            <span>Log Payment</span>
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-3 animate-fade-in">
          <h3 className="text-xs font-bold text-white">New Payment Record</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Payer Account ID *</label>
              <input value={form.payerId} onChange={(e) => setForm({ ...form, payerId: e.target.value })} placeholder="UUID" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Booking ID (optional)</label>
              <input value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })} placeholder="UUID" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Amount *</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Currency</label>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" maxLength={3} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Method *</label>
              <input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="Bank Transfer / Cash / Wise…" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Reference</label>
              <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Transaction ID / receipt #" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Internal notes…" className={inputCls + " resize-none"} />
          </div>
          {formError && (
            <div className="flex items-center space-x-2 text-xs text-rose-400">
              <AlertCircle size={13} />
              <span>{formError}</span>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-500 text-neutral-950 hover:bg-sky-400 disabled:opacity-50 transition flex items-center space-x-1.5">
              {saving && <Loader2 size={12} className="animate-spin" />}
              <span>{saving ? "Saving…" : "Save Payment"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-neutral-500">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-xs">Loading payments…</span>
        </div>
      ) : error ? (
        <div className="flex items-center space-x-2 text-xs text-rose-400 py-6">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <CreditCard size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                    <span className="text-sm font-extrabold text-white">{p.currency} {Number(p.amount).toFixed(2)}</span>
                    <span className="text-xs text-neutral-500">{p.method}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-neutral-400">
                    <User size={11} className="shrink-0" />
                    <span>{p.payer.fullName}</span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-600">{p.payer.email}</span>
                  </div>
                  {p.booking && (
                    <div className="flex items-center space-x-1 text-xs text-neutral-500">
                      <Calendar size={11} className="shrink-0" />
                      <span>Booking: {p.booking.student.fullName} — {new Date(p.booking.scheduledAtUtc).toLocaleDateString()}</span>
                    </div>
                  )}
                  {p.reference && (
                    <div className="flex items-center space-x-1 text-xs text-neutral-500">
                      <FileText size={11} className="shrink-0" />
                      <span>Ref: {p.reference}</span>
                    </div>
                  )}
                  {p.notes && <p className="text-[11px] text-neutral-600 mt-1 max-w-sm">{p.notes}</p>}
                  {p.confirmedAt && p.confirmedBy && (
                    <p className="text-[10px] text-emerald-500">
                      Confirmed by {p.confirmedBy.fullName} on {new Date(p.confirmedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  {p.status === "PENDING" && (
                    <button
                      onClick={() => handleAction(p.id, "confirm")}
                      disabled={actionId === p.id}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition flex items-center space-x-1"
                    >
                      {actionId === p.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                      <span>Confirm</span>
                    </button>
                  )}
                  {p.status !== "REFUNDED" && (
                    <button
                      onClick={() => handleAction(p.id, "refund")}
                      disabled={actionId === p.id}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:opacity-50 transition flex items-center space-x-1"
                    >
                      {actionId === p.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      <span>Refund</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-neutral-700 mt-2">ID: {p.id} · {new Date(p.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
