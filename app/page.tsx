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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-8 animate-pulse">
          <Shield className="h-3.5 w-3.5" />
          NEXT-GENERATION EXAMINATION INTEGRITY PLATFORM
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
          Secure Exams. <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Trusted Results.
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-400 leading-relaxed mb-10">
          Aegis is an AI + Machine Learning powered examination integrity platform that correlates behavioral, browser-security,
          question-level, and privacy-preserving computer-vision signals into explainable suspicious episodes for human examiner review.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href="/examiner"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          >
            <Cpu className="h-4 w-4" />
            Launch Examiner Operations
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/student/exams"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
          >
            <UserCheck className="h-4 w-4" />
            Enter Student Exam
          </Link>

          <Link
            href="/examiner/attack-lab"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-sm transition-all"
          >
            <Terminal className="h-4 w-4" />
            Open Attack Lab Simulator
          </Link>
        </div>

        {/* Live Demo Candidate Spotlight Card */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md text-left shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono text-xs text-slate-300 font-semibold uppercase tracking-wider">
                Flagship Demo Investigation Ready
              </span>
            </div>
            <Link
              href="/examiner/investigate/at000000-0000-0000-0000-000000000002"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              Open Alex Mercer Workspace &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Candidate</span>
              <span className="text-white font-medium text-sm">Alex Mercer</span>
              <span className="text-[10px] text-slate-400 block font-mono">CS 401 Distributed Systems</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Explainable Risk</span>
              <span className="text-rose-400 font-bold text-sm">78 / 100 (HIGH)</span>
              <span className="text-[10px] text-amber-400 block font-mono">Confidence: MODERATE</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Correlated Episode</span>
              <span className="text-amber-300 font-medium block">Focus Loss + Tab Switch</span>
              <span className="text-[10px] text-slate-400 block">Q2 Answer Modified in 8s</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">ML Isolation Forest</span>
              <span className="text-cyan-400 font-bold text-sm">96th Percentile Anomaly</span>
              <span className="text-[10px] text-slate-400 block font-mono">Version v1.0.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Non-Negotiable End-to-End Chain */}
      <section className="py-16 bg-[#090d16] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">The Integrity Intelligence Pipeline</h2>
            <p className="text-sm text-slate-400">
              A continuous, explainable chain correlating multi-modal signals into contextual evidence.
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
                  className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-center hover:border-cyan-500/30 transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-mono text-xs font-bold text-white mb-1">{item.step}</h3>
                  <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Product Pillars */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Privacy-Preserving Vision</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              MediaPipe vision runs entirely inside the student browser. No continuous video is uploaded to the server.
              Only coarse facial presence and orientation signals are preserved.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Suspicious Episode Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instead of firing hundreds of disjointed alerts, Aegis clusters correlated events into unified temporal episodes:
              connecting window blur, tab departure, camera occlusion, and answer modifications.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Human-in-the-Loop Review</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI advises; humans decide. Gemini synthesizes evidence timelines and highlights plausible alternative explanations,
              while the examiner renders the authoritative integrity verdict with mandatory rationale.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
