import { Shield, Lock, EyeOff, UserCheck, CheckCircle2, FileText, Check } from "lucide-react";

export default function PrivacyCenterPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-bold shadow-xs">
          <Lock className="h-3.5 w-3.5 text-blue-600" />
          PRIVACY-FIRST ARCHITECTURE & STUDENT TRANSPARENCY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Aegis Privacy & Ethics Center
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We believe high-stakes academic integrity must never come at the expense of student privacy, dignity, or fairness.
        </p>
      </div>

      {/* Grid: What We Process vs What We Never Store */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What Aegis Processes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-sm font-mono border-b border-slate-100 pb-3">
            <Shield className="h-4 w-4 text-blue-600" />
            WHAT AEGIS PROCESSES & STORES
          </div>
          <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">Exam Responses & Timings:</strong> Question answer choices, submission timestamps, and dwell durations.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">Browser Security Telemetry:</strong> Sandboxed browser state (tab visibility changes, window blur/focus, fullscreen transitions).
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">Discrete Facial Presence Signals:</strong> Coarse events derived client-side in browser memory (e.g. FACE_MISSING, MULTIPLE_FACES).
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">Cryptographic Audit Hashes:</strong> SHA-256 evidence chain blocks ensuring records cannot be retroactively modified.
              </span>
            </li>
          </ul>
        </div>

        {/* What Aegis Never Stores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm font-mono border-b border-slate-100 pb-3">
            <EyeOff className="h-4 w-4 text-emerald-600" />
            WHAT AEGIS NEVER STORES
          </div>
          <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">No Raw Video Recordings:</strong> Webcam feeds are analyzed ephemerally in browser memory via MediaPipe and discarded immediately.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">No Biometric Identification:</strong> We do not match faces against external databases or store facial geometry templates.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">No Demographic Profiling:</strong> Race, gender, age, ethnicity, or emotion inference are strictly barred from ML feature vectors.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">No Autonomous Cheating Verdicts:</strong> AI and ML outputs serve exclusively as advisory telemetry for human examiners.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Fairness, Accommodations, and Human Review Guardrails */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-mono">
            <UserCheck className="h-4 w-4 text-blue-600" />
            Fairness Guardrails & Accommodation Policy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Architectural safeguards preventing discrimination against neurodivergent candidates or students in shared spaces.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
            <strong className="text-slate-900 block font-bold font-sans">
              1. Non-Penalized Accommodations
            </strong>
            <p className="text-slate-600 leading-relaxed">
              Candidates with approved extended time or alternate camera accommodations have their feature vectors adjusted without automated risk penalties.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
            <strong className="text-slate-900 block font-bold font-sans">
              2. Temporal Risk Decay
            </strong>
            <p className="text-slate-600 leading-relaxed">
              Single isolated blips (such as an accidental OS notification popup) decay over time rather than permanently poisoning an entire session.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
            <strong className="text-slate-900 block font-bold font-sans">
              3. Mandatory Human Review
            </strong>
            <p className="text-slate-600 leading-relaxed">
              Consequential determinations require an authorized human examiner to provide written factual rationale before any official action is taken.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
