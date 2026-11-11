import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, ChevronRight, Award, BookOpen, RotateCcw, Loader2 } from "lucide-react";
import { useSEO } from "../hooks/useSEO";

const QUESTIONS = [
  {
    q: "What is Qalqalah (قَلْقَلَة) in Tajweed?",
    options: [
      "A prolonged vowel sound lasting 2 counts",
      "An echoing or bouncing sound produced when certain letters have sukoon",
      "The merging of two similar letters",
      "Hiding the sound of Noon Sakinah",
    ],
    answer: 1,
    tip: "Qalqalah letters are: ق ط ب ج د — remember them with the phrase 'QaTaBaJaDa'. When these carry a sukoon, they produce a slight echo.",
  },
  {
    q: "When Noon Sakinah (نْ) is followed by a Qalqalah letter, which rule applies?",
    options: ["Izhar (clear pronunciation)", "Idghaam (merging)", "Iqlab (conversion)", "Ikhfa (hiding)"],
    answer: 3,
    tip: "Ikhfa applies when Noon Sakinah is followed by 15 specific letters not in Izhar, Idghaam, or Iqlab groups. The sound is partially hidden with a nasal resonance.",
  },
  {
    q: "What is the standard duration of Madd Tabee'ee (المد الطبيعي)?",
    options: ["1 count (haraka)", "2 counts (harakatayn)", "4 counts", "6 counts"],
    answer: 1,
    tip: "Madd Tabee'ee is the natural madd — it lasts exactly 2 counts. It occurs when a madd letter (ا و ي) follows its matching short vowel without a hamzah or sukoon.",
  },
  {
    q: "Which rule applies when Noon Sakinah meets the letters و or ي without a vowel between them (in the same word)?",
    options: ["Izhar (Halqi)", "Idghaam with Ghunna", "Idghaam without Ghunna", "Iqlab"],
    answer: 1,
    tip: "When نْ or tanween meets و or ي (and they are in different words), it's Idghaam with Ghunna — the noon merges into the next letter with a nasal sound (2 counts).",
  },
  {
    q: "What is Ghunna (غُنَّة)?",
    options: [
      "A type of madd elongation",
      "A nasal resonance sound produced from the nose lasting 2 counts",
      "The heavy pronunciation of letters",
      "An echo on stopped letters",
    ],
    answer: 1,
    tip: "Ghunna is the nasal sound that must accompany Meem and Noon in certain rules. Its duration is 2 counts (harakatayn).",
  },
  {
    q: "When Noon Sakinah is followed by one of the letters أ هـ ع ح غ خ, which rule applies?",
    options: ["Ikhfa", "Idghaam", "Izhar Halqi (clear pronunciation)", "Iqlab"],
    answer: 2,
    tip: "These 6 letters are the 'throat letters' (Huroof Halqiyyah). Noon Sakinah before them requires Izhar — pronouncing the noon clearly without any ghunna.",
  },
  {
    q: "What is Iqlab (إِقْلَاب)?",
    options: [
      "Merging Noon Sakinah into the following letter",
      "Converting Noon Sakinah into a Meem sound before the letter ب",
      "Hiding Noon Sakinah before 15 letters",
      "Clear pronunciation before throat letters",
    ],
    answer: 1,
    tip: "Iqlab literally means 'to change'. When Noon Sakinah meets the letter ب, the noon sound changes to a meem with a ghunna of 2 counts.",
  },
  {
    q: "The letter Lam (ل) in the word 'Allah' (اللَّه) is pronounced:",
    options: ["Light (Lam Muraqqaqah)", "Heavy (Lam Mufakhamah)", "Silent", "With a shadda only"],
    answer: 1,
    tip: "The Lam in 'Allah' is pronounced heavy (Mufakhamah) when preceded by a Fathah or Dhammah. It becomes light (Muraqqaqah) when preceded by a Kasrah.",
  },
  {
    q: "What is Idghaam (إِدْغَام)?",
    options: [
      "An echoing vibration on stopped letters",
      "The merging of Noon Sakinah/Tanween into the following letter",
      "Prolonging a vowel for 4 or 6 counts",
      "The nasal resonance of Meem",
    ],
    answer: 1,
    tip: "Idghaam means 'to merge'. When Noon Sakinah meets the letters ي ر م ل و ن (in different words), the noon merges into those letters — with or without ghunna depending on the specific letter.",
  },
  {
    q: "Which of the following is an example of Madd Lazim Kalimi (obligatory madd within a word)?",
    options: ["The alif in بِسْمِ", "The waw in الصَّاخَّة", "The alif-sukoon in آلْئَـٰنَ", "The ya in بِيَدِهِ"],
    answer: 2,
    tip: "Madd Lazim Kalimi occurs when a madd letter is followed by a letter with shadda or sukoon permanently within the same word. It is prolonged for 6 counts.",
  },
];

export default function TajweedQuiz() {
  useSEO({
    title: "Tajweed Skill Quiz | Quran Tutors Academy",
    description: "Test your Tajweed knowledge with our free interactive quiz. Assess your understanding of Qalqalah, Madd, Idghaam and more.",
  });
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0=intro, 1=quiz, 2=result
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleStart = () => {
    if (!name.trim()) return;
    setStep(1);
  };

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleCheck = () => {
    if (selected === null) return;
    setSubmitted(true);
    setAnswers(prev => ({ ...prev, [currentQ]: selected }));
    if (selected === QUESTIONS[currentQ].answer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setStep(2);
    const finalScore = score + (selected === QUESTIONS[currentQ].answer && !submitted ? 1 : 0);
    setSaving(true);
    try {
      await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          score: finalScore,
          maxScore: QUESTIONS.length,
          answers,
        }),
      });
      setSaved(true);
    } catch {
      setSaveError("Could not save result — but your score is shown above.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep(0); setCurrentQ(0); setSelected(null); setSubmitted(false);
    setAnswers({}); setScore(0); setSaved(false); setSaveError(""); setName(""); setEmail("");
  };

  const pct = Math.round((score / QUESTIONS.length) * 100);
  const grade = pct >= 90 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "Developing" : "Needs Practice";
  const gradeColor = pct >= 90 ? "text-emerald-400" : pct >= 70 ? "text-teal-400" : pct >= 50 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition">
        ← Back to Home
      </button>

      {/* Intro */}
      {step === 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-500/30 flex items-center justify-center">
              <BookOpen size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Tajweed Skill Quiz</h1>
              <p className="text-xs text-neutral-400">{QUESTIONS.length} questions · ~5 minutes</p>
            </div>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Test your knowledge of key Tajweed rules — Qalqalah, Madd, Idghaam, Ikhfa, and more. Your result is saved so our tutors can suggest the right learning path for you.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Your name <span className="text-rose-400">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmed Abdullah"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Email (optional — for follow-up)</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
          <button onClick={handleStart} disabled={!name.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-black text-sm py-3 rounded-xl transition flex items-center justify-center gap-2">
            Start Quiz <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Quiz */}
      {step === 1 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-bold">Question {currentQ + 1} of {QUESTIONS.length}</span>
            <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-mono">
              {score} / {QUESTIONS.length}
            </span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300" style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }} />
          </div>

          <h2 className="text-base font-bold text-white leading-relaxed">{QUESTIONS[currentQ].q}</h2>

          <div className="space-y-2">
            {QUESTIONS[currentQ].options.map((opt, i) => {
              const isCorrect = QUESTIONS[currentQ].answer === i;
              const isSelected = selected === i;
              let cls = "border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700";
              if (submitted) {
                if (isCorrect) cls = "border-emerald-500/60 bg-emerald-950/40 text-emerald-200 font-semibold";
                else if (isSelected) cls = "border-rose-500/60 bg-rose-950/40 text-rose-300";
                else cls = "border-neutral-900 bg-neutral-900/30 text-neutral-600 opacity-60";
              } else if (isSelected) {
                cls = "border-amber-500 bg-amber-950/30 text-amber-200 font-semibold";
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={submitted}
                  className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${cls}`}>
                  <span>{opt}</span>
                  {submitted && isCorrect && <CheckCircle size={15} className="text-emerald-400 shrink-0" />}
                  {submitted && isSelected && !isCorrect && <XCircle size={15} className="text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-4 text-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">Scholar's Tip</span>
              <p className="text-neutral-300 leading-relaxed">{QUESTIONS[currentQ].tip}</p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            {!submitted ? (
              <button onClick={handleCheck} disabled={selected === null}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-xl transition">
                Check Answer
              </button>
            ) : (
              <button onClick={handleNext}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                {currentQ < QUESTIONS.length - 1 ? "Next Question" : "See Results"} <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
              <Award size={28} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Quiz Complete!</h2>
              <p className="text-neutral-400 text-sm mt-1">Great work, {name}!</p>
            </div>
            <div className="text-5xl font-black text-white">{score}<span className="text-neutral-500 text-2xl">/{QUESTIONS.length}</span></div>
            <div>
              <span className={`text-lg font-black ${gradeColor}`}>{grade}</span>
              <span className="text-neutral-500 text-sm ml-2">({pct}%)</span>
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
                <Loader2 size={12} className="animate-spin" /> Saving result...
              </div>
            )}
            {saved && <p className="text-xs text-emerald-400">Result saved — a tutor may follow up with personalised guidance.</p>}
            {saveError && <p className="text-xs text-amber-400">{saveError}</p>}
          </div>

          {/* Answer review */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Review</h3>
            {QUESTIONS.map((q, i) => {
              const userAns = answers[i];
              const correct = userAns === q.answer;
              return (
                <div key={i} className={`rounded-xl border p-4 text-sm space-y-2 ${correct ? "border-emerald-800 bg-emerald-950/20" : "border-rose-800 bg-rose-950/20"}`}>
                  <div className="flex items-start gap-2">
                    {correct ? <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" /> : <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />}
                    <p className="text-white font-semibold text-xs leading-snug">{q.q}</p>
                  </div>
                  {!correct && userAns !== undefined && (
                    <p className="text-xs text-rose-300 pl-5">Your answer: {q.options[userAns]}</p>
                  )}
                  <p className="text-xs text-emerald-300 pl-5">Correct: {q.options[q.answer]}</p>
                  <p className="text-[11px] text-neutral-400 pl-5 italic">{q.tip}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-3 rounded-xl transition">
              <RotateCcw size={13} /> Retake Quiz
            </button>
            <button onClick={() => navigate("/tutors")} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl transition">
              Find a Tutor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
