"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Attempt } from "@/types";
import {
  Terminal,
  Play,
  Activity,
  Layers,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Cpu,
  ArrowLeft,
  Sliders,
  Radio,
  Eye,
  Camera,
  Keyboard,
} from "lucide-react";

export default function AttackLabPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "Aegis Attack Lab Initialized.",
    "Select target candidate attempt to simulate security anomalies.",
  ]);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/attempts")
      .then((r) => r.json())
      .then((d) => {
        if (d.attempts) {
          setAttempts(d.attempts);
          if (d.attempts.length > 0) {
            setSelectedAttemptId(d.attempts[0].id);
          }
        }
      });
  }, []);

  const runSimulation = async (action: string, label: string) => {
    if (!selectedAttemptId) return;

    setIsSimulating(true);
    setConsoleLogs((prev) => [
      `[SIMULATE] Triggering ${label} on attempt ${selectedAttemptId.slice(0, 10)}...`,
      ...prev,
    ]);

    try {
      const res = await fetch("/api/attack-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: selectedAttemptId,
          action,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLastResult(data);
        setConsoleLogs((prev) => [
          `[SUCCESS] ${label} processed: Ingested event & computed SHA-256 hash block.`,
          `[PIPELINE] Behavioral feature vector v1 re-extracted.`,
          `[PIPELINE] Suspicious episode clustering completed.`,
          `[PIPELINE] Isolation Forest ML anomaly evaluated.`,
          `[PIPELINE] Deterministic risk score updated & SSE broadcast fired.`,
          ...prev,
        ]);
      } else {
        setConsoleLogs((prev) => [`[ERROR] ${data.error || "Simulation failed"}`, ...prev]);
      }
    } catch (e: any) {
      setConsoleLogs((prev) => [`[FATAL] Network error: ${e.message}`, ...prev]);
    } finally {
      setIsSimulating(false);
    }
  };

  const simulationActions = [
    {
      action: "SIMULATE_TAB_SWITCH",
      label: "Simulate Tab Switch",
      category: "BROWSER FOCUS",
      severity: "HIGH",
      desc: "Triggers browser visibility change (tab departure)",
      icon: Eye,
    },
    {
      action: "SIMULATE_FOCUS_LOSS",
      label: "Simulate Focus Loss",
      category: "BROWSER FOCUS",
      severity: "MEDIUM",
      desc: "Triggers window blur to external desktop application",
      icon: Eye,
    },
    {
      action: "SIMULATE_FULLSCREEN_EXIT",
      label: "Simulate Fullscreen Exit",
      category: "BROWSER FOCUS",
      severity: "HIGH",
      desc: "Triggers fullscreen departure alert and telemetry event",
      icon: Eye,
    },
    {
      action: "SIMULATE_FACE_MISSING",
      label: "Simulate Face Missing",
      category: "VISION CV",
      severity: "MEDIUM",
      desc: "Simulates MediaPipe absent facial landmarks (1.5s+)",
      icon: Camera,
    },
    {
      action: "SIMULATE_MULTIPLE_FACES",
      label: "Simulate Multiple Faces",
      category: "VISION CV",
      severity: "HIGH",
      desc: "Simulates secondary person detected in camera view",
      icon: Camera,
    },
    {
      action: "SIMULATE_ANSWER_CHANGE",
      label: "Simulate Answer Change",
      category: "ITEM INTERACTION",
      severity: "HIGH",
      desc: "Mutates saved answer value and records telemetry",
      icon: Keyboard,
    },
    {
      action: "SIMULATE_RAPID_NAVIGATION",
      label: "Simulate Rapid Navigation",
      category: "ITEM INTERACTION",
      severity: "MEDIUM",
      desc: "Simulates atypical rapid cycling across exam questions",
      icon: Activity,
    },
    {
      action: "SIMULATE_LONG_INACTIVITY",
      label: "Simulate Long Inactivity",
      category: "ITEM INTERACTION",
      severity: "LOW",
      desc: "Simulates 60s idle duration without candidate input",
      icon: Activity,
    },
    {
      action: "SIMULATE_SUSPICIOUS_SEQUENCE",
      label: "Simulate Suspicious Sequence",
      category: "MULTI-MODAL ATTACK",
      severity: "CRITICAL",
      desc: "Blur → Tab Switch → Face Missing → Focus → Answer Modified",
      icon: Layers,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            <Terminal className="h-4 w-4 text-amber-700" />
            Controlled Simulation Laboratory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Aegis Attack Simulation Lab
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inject synthetic behavioral and browser anomalies into the actual multi-modal Aegis processing pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/examiner"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Operations
          </Link>
          {selectedAttemptId && (
            <Link
              href={`/examiner/investigate/${selectedAttemptId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              Open Candidate Workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Target Candidate Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-2">
        <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
          Target Candidate Session for Anomaly Injection:
        </label>
        <select
          value={selectedAttemptId}
          onChange={(e) => setSelectedAttemptId(e.target.value)}
          className="w-full sm:w-auto min-w-[360px] rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 font-mono font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
        >
          {attempts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.student?.full_name} — {a.exam?.title?.slice(0, 32)}... (Current Risk: {a.risk_score} / 100)
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 pt-1 leading-relaxed">
          Injected events immediately execute the full production chain: SHA-256 Hash Chaining &rarr; Feature Extraction &rarr; Episode Correlation &rarr; Isolation Forest ML &rarr; Deterministic Risk Scoring &rarr; Realtime Broadcast.
        </p>
      </div>

      {/* Simulator Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {simulationActions.map((sim) => {
          const Icon = sim.icon;
          const isCritical = sim.severity === "CRITICAL";
          const isHigh = sim.severity === "HIGH";

          return (
            <div
              key={sim.action}
              className={`rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isCritical
                  ? "border-rose-200 ring-1 ring-rose-100"
                  : isHigh
                  ? "border-amber-200/80"
                  : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isCritical
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : isHigh
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {sim.severity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-medium">
                    {sim.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5 mt-2">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{sim.label}</h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">{sim.desc}</p>
              </div>

              <button
                disabled={isSimulating || !selectedAttemptId}
                onClick={() => runSimulation(sim.action, sim.label)}
                className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  isCritical
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                } disabled:opacity-40`}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Trigger Injection
              </button>
            </div>
          );
        })}
      </div>

      {/* Realtime Terminal Console Output */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 font-mono text-xs shadow-xl text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 font-bold text-white text-xs">PIPELINE EXECUTION TELEMETRY LOG</span>
          </div>
          <button
            onClick={() => setConsoleLogs(["Console cleared."])}
            className="text-[10px] text-slate-400 hover:text-white transition-colors"
          >
            Clear Log
          </button>
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2 font-mono text-[11px]">
          {consoleLogs.map((log, idx) => (
            <div
              key={idx}
              className={
                log.startsWith("[SUCCESS]")
                  ? "text-emerald-400"
                  : log.startsWith("[ERROR]") || log.startsWith("[FATAL]")
                  ? "text-rose-400"
                  : log.startsWith("[PIPELINE]")
                  ? "text-blue-400"
                  : "text-slate-400"
              }
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
