import Link from "next/link";
import {
  Shield,
  Cpu,
  Eye,
  Terminal,
  UserCheck,
  Lock,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  FileCheck2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-slate-50 text-slate-900">
      {/* Subtle, soft light background atmospheric accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-blue-100/40 via-teal-50/20 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-bold mb-8 shadow-xs">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          ENTERPRISE EXAMINATION INTEGRITY PLATFORM
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 font-sans">
          Secure Exams. <br />
          <span className="text-blue-600">
            Trusted Results.
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-600 leading-relaxed mb-10 font-normal">
          Aegis is an AI + Machine Learning powered examination integrity platform that correlates behavioral, browser-security,
          question-level, and privacy-preserving computer-vision signals into explainable suspicious episodes for human examiner review.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-16">
          <Link
            href="/examiner"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-xs"
          >
            <Cpu className="h-4 w-4" />
            Launch Examiner Operations
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/student/exams"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm transition-all shadow-xs"
          >
            <UserCheck className="h-4 w-4 text-blue-600" />
            Enter Student Exam
          </Link>

          <Link
            href="/examiner/attack-lab"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-sm transition-all shadow-xs"
          >
            <Terminal className="h-4 w-4 text-amber-700" />
            Open Attack Lab Simulator
          </Link>
        </div>

        {/* Flagship Candidate Spotlight Card */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-left shadow-md relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
              </span>
              <span className="font-mono text-xs text-slate-700 font-bold uppercase tracking-wider">
                Flagship Case Study: Correlated Multi-Signal Anomaly
              </span>
            </div>
            <Link
              href="/examiner/investigate/at000000-0000-0000-0000-000000000002"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              Open Alex Mercer Workspace &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Candidate</span>
              <span className="text-slate-900 font-bold text-sm font-sans">Alex Mercer</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">CS 401 Distributed Systems</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Explainable Risk</span>
              <span className="text-rose-700 font-bold text-sm block">78 / 100 (HIGH)</span>
              <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">Confidence: MODERATE</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Correlated Episode</span>
              <span className="text-slate-900 font-bold text-xs block font-sans">Focus Loss + Tab Switch</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">Q2 Answer Modified in 18s</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">ML Isolation Forest</span>
              <span className="text-slate-900 font-bold text-sm block">96th Percentile</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Unsupervised Outlier</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Integrity Intelligence Pipeline */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
              The Integrity Intelligence Pipeline
            </h2>
            <p className="text-sm text-slate-500">
              A continuous, explainable chain correlating multi-modal signals into contextual, auditable evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-center">
            {[
              { step: "1. Signals", desc: "Browser sandboxing & MediaPipe vision events", icon: Eye },
              { step: "2. Aggregation", desc: "16-dim behavioral feature vectors", icon: Layers },
              { step: "3. ML Outlier", desc: "Unsupervised Isolation Forest scoring", icon: Cpu },
              { step: "4. Episodes", desc: "Deterministic temporal clustering", icon: Activity },
              { step: "5. Risk Engine", desc: "Contextual difficulty & risk decay", icon: Shield },
              { step: "6. Gemini AI", desc: "Structured timeline & alternatives", icon: Sparkles },
              { step: "7. Human Verdict", desc: "Examiner decision & audit report", icon: CheckCircle2 },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-blue-300 transition-all shadow-xs"
                >
                  <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-2.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-mono text-xs font-bold text-slate-900 mb-1">{item.step}</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Privacy-Preserving Vision</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              MediaPipe computer vision executes entirely within candidate browser memory. No raw video is ever uploaded or stored.
              Only coarse facial presence and orientation events are retained.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Suspicious Episode Engine</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Instead of generating noisy disconnected alerts, Aegis clusters correlated events into unified temporal episodes:
              connecting window blur, tab departure, camera occlusion, and answer modifications.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Human-in-the-Loop Oversight</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI advises; humans decide. Gemini synthesizes evidence timelines and highlights plausible alternative explanations,
              while the examiner renders the authoritative integrity verdict with mandatory written rationale.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
