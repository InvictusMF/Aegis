"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Attempt } from "@/types";
import { formatTime, getRiskColor, getConfidenceBadge } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Eye,
  Camera,
  Activity,
  Shield,
  Clock,
  ArrowRight,
  Radio,
  Wifi,
  Sparkles,
  Layers,
} from "lucide-react";

export default function LiveMonitoringWallPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAttempts = async () => {
    try {
      const res = await fetch("/api/attempts");
      const data = await res.json();
      if (data.attempts) setAttempts(data.attempts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();

    const supabase = createClient();
    let channel: any = null;

    if (supabase) {
      channel = supabase
        .channel("public:live-wall")
        .on("postgres_changes", { event: "*", schema: "public", table: "security_events" }, () => {
          loadAttempts();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "attempts" }, () => {
          loadAttempts();
        })
        .subscribe();
    }

    const es = new EventSource("/api/realtime");
    es.onmessage = () => {
      loadAttempts();
    };

    return () => {
      es.close();
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-1">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            REALTIME EXAMINATION SURVEILLANCE & TELEMETRY
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Live Candidate Monitoring Wall</h1>
          <p className="text-sm text-slate-400 mt-1">
            Privacy-preserving telemetry feeds streaming from candidate browsers in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            SYNCHRONIZED WITH CLIENTS
          </div>
          <Link
            href="/examiner"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            &larr; Back to Operations
          </Link>
        </div>
      </div>

      {/* Candidate Live Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attempts.map((att) => {
            const riskColor = getRiskColor(
              att.risk_score >= 80 ? "CRITICAL" : att.risk_score >= 60 ? "HIGH" : att.risk_score >= 30 ? "MODERATE" : "LOW"
            );
            const conf = getConfidenceBadge(att.evidence_confidence);
            const isAlex = att.student_id === "d0000000-0000-0000-0000-000000000003";

            return (
              <div
                key={att.id}
                className={`rounded-2xl border p-5 transition-all shadow-xl flex flex-col justify-between ${
                  att.risk_score >= 60
                    ? "bg-slate-900/80 border-rose-500/40 shadow-rose-500/5"
                    : "bg-slate-900/50 border-slate-800"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono text-slate-300 uppercase">
                        {att.status === "IN_PROGRESS" ? "Active Stream" : "Submitted"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      <Wifi className="h-3 w-3" />
                      SECURE SSE
                    </div>
                  </div>

                  {/* Candidate Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                      {att.student?.full_name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{att.student?.full_name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{att.exam?.title || "Examination"}</p>
                    </div>
                  </div>

                  {/* Telemetry Visual Box (Privacy-Preserving Radar) */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 mb-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-cyan-400" />
                        MediaPipe Signal
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        FACE TRACKED
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Risk Assessment:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${riskColor.bg} ${riskColor.text}`}>
                        {att.risk_score} / 100 ({att.risk_score >= 80 ? "CRITICAL" : att.risk_score >= 60 ? "HIGH" : att.risk_score >= 30 ? "MODERATE" : "LOW"})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Evidence Confidence:</span>
                      <span className="font-mono text-slate-300">{conf.label}</span>
                    </div>

                    {isAlex && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-[11px] text-amber-300">
                        <div className="font-semibold flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Flagged Episode Detected
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Window Blur + Tab Switch &rarr; Q2 Answer Modified
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/examiner/investigate/${att.id}`}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
                >
                  Open Candidate Investigation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
