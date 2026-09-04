import { Shield, Lock, EyeOff, UserCheck, CheckCircle2, FileText } from "lucide-react";

export default function PrivacyCenterPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Lock className="h-3.5 w-3.5" />
          PRIVACY-FIRST ARCHITECTURE & STUDENT TRANSPARENCY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Aegis Privacy Center</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          We believe high-stakes academic integrity must never come at the expense of student privacy, dignity, or fairness.
        </p>
      </div>

      {/* Grid: What We Collect vs What We Never Store */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-base font-mono">
            <Shield className="h-5 w-5" />
            WHAT AEGIS PROCESSES & STORES
          </div>
          <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Exam Responses & Timings:</strong> Question answer choices, submission timestamps, and dwell durations.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Browser Security Telemetry:</strong> Sandboxed browser state (tab visibility changes, window blur/focus, fullscreen transitions).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Coarse Facial Presence Signals:</strong> Discrete events derived client-side (e.g. FACE_MISSING, MULTIPLE_FACES, coarse head yaw).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Cryptographic Audit Hashes:</strong> SHA-256 evidence chain hashes ensuring records cannot be retroactively manipulated.</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base font-mono">
            <EyeOff className="h-5 w-5" />
            WHAT AEGIS NEVER STORES
          </div>
          <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No Raw Video Recordings:</strong> Webcam streams are processed ephemerally in browser memory via MediaPipe and discarded immediately.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No Biometric Recognition:</strong> We do not match faces against external databases or store facial geometry templates.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No Demographic Attributes:</strong> Race, gender, age, ethnicity, or emotion inference are strictly barred from ML feature vectors.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No Autonomous Cheating Verdicts:</strong> AI and ML outputs serve exclusively as advisory telemetry for human examiners.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Fairness, Accommodations, and Human Review */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
          <UserCheck className="h-5 w-5 text-cyan-400" />
          Fairness Guardrails & Accommodation Policy
        </h3>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Traditional automated proctoring software frequently penalizes neurodivergent candidates, candidates with physical disabilities,
            or students taking exams in shared living spaces. Aegis addresses this with three foundational engineering guardrails:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-white block font-mono mb-1">1. Non-Penalized Accommodations</strong>
              Candidates with extended time or alternate camera accommodations have their baseline metrics adjusted without automated risk penalties.
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-white block font-mono mb-1">2. Temporal Risk Decay</strong>
              Single isolated blips (such as an accidental notification popup) decay over time rather than permanently poisoning an entire session.
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-white block font-mono mb-1">3. Mandatory Human Review</strong>
              Consequential decisions require an authorized human examiner to provide written factual rationale before any action is taken.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
