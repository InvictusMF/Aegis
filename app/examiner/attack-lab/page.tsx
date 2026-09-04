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
          `[SUCCESS] ${label} processed: Ingested event & computed hash chain.`,
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
    { action: "SIMULATE_TAB_SWITCH", label: "Simulate Tab Switch", severity: "HIGH", desc: "Triggers browser visibility change (tab departure)" },
    { action: "SIMULATE_FOCUS_LOSS", label: "Simulate Focus Loss", severity: "MEDIUM", desc: "Triggers window blur to external desktop application" },
    { action: "SIMULATE_FULLSCREEN_EXIT", label: "Simulate Fullscreen Exit", severity: "HIGH", desc: "Triggers fullscreen change departure alert" },
    { action: "SIMULATE_FACE_MISSING", label: "Simulate Face Missing", severity: "MEDIUM", desc: "Simulates MediaPipe absent facial landmarks (1.5s+)" },
    { action: "SIMULATE_MULTIPLE_FACES", label: "Simulate Multiple Faces", severity: "HIGH", desc: "Simulates secondary candidate detected in frame" },
    { action: "SIMULATE_ANSWER_CHANGE", label: "Simulate Answer Change", severity: "HIGH", desc: "Mutates saved answer value and records telemetry" },
    { action: "SIMULATE_RAPID_NAVIGATION", label: "Simulate Rapid Navigation", severity: "MEDIUM", desc: "Simulates atypical rapid cycling across questions" },
    { action: "SIMULATE_LONG_INACTIVITY", label: "Simulate Long Inactivity", severity: "LOW", desc: "Simulates 60s idle duration without user inputs" },
    { action: "SIMULATE_SUSPICIOUS_SEQUENCE", label: "Simulate Suspicious Sequence", severity: "CRITICAL", desc: "Blur &rarr; Tab Switch &rarr; Face Missing &rarr; Focus &rarr; Answer Modified" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-amber-400 mb-1">
            <Terminal className="h-3.5 w-3.5" />
            LIVE ATTACK LAB & REAL-PIPELINE SIMULATOR
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Aegis Attack Lab</h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate realistic examination anomalies through the identical multi-modal backend processing pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/examiner"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            Examiner Operations
          </Link>
          {selectedAttemptId && (
            <Link
              href={`/examiner/investigate/${selectedAttemptId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              Open Candidate Workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Target Candidate Selector */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
          Target Candidate Attempt for Injection:
        </label>
        <select
          value={selectedAttemptId}
          onChange={(e) => setSelectedAttemptId(e.target.value)}
          className="w-full sm:w-auto min-w-[320px] rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
        >
          {attempts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.student?.full_name} — {a.exam?.title?.slice(0, 30)}... (Risk: {a.risk_score})
            </option>
          ))}
        </select>
        <span className="text-[11px] text-slate-500 block mt-2">
          Events injected here flow through the real pipeline: Hash Chaining &rarr; Feature Extraction &rarr; Episode Correlation &rarr; Isolation Forest &rarr; Risk Engine &rarr; SSE Broadcast.
        </span>
      </div>

      {/* Simulator Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {simulationActions.map((sim) => (
          <div
            key={sim.action}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    sim.severity === "CRITICAL"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      : sim.severity === "HIGH"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {sim.severity}
                </span>
                <span className="text-[10px] font-mono text-slate-500">API: /api/attack-lab</span>
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{sim.label}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{sim.desc}</p>
            </div>

            <button
              disabled={isSimulating || !selectedAttemptId}
              onClick={() => runSimulation(sim.action, sim.label)}
              className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                sim.severity === "CRITICAL"
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
                  : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
              } disabled:opacity-40`}
            >
              <Play className="h-3.5 w-3.5" />
              Trigger Injection
            </button>
          </div>
        ))}
      </div>

      {/* Realtime Terminal Console Output */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-xs shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 font-bold text-white text-xs">PIPELINE EXECUTION TELEMETRY LOG</span>
          </div>
          <button
            onClick={() => setConsoleLogs(["Console cleared."])}
            className="text-[10px] text-slate-500 hover:text-slate-400"
          >
            Clear Log
          </button>
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
          {consoleLogs.map((log, idx) => (
            <div
              key={idx}
              className={
                log.startsWith("[SUCCESS]")
                  ? "text-emerald-400"
                  : log.startsWith("[ERROR]") || log.startsWith("[FATAL]")
                  ? "text-rose-400"
                  : log.startsWith("[PIPELINE]")
                  ? "text-cyan-400"
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
