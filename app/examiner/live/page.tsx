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
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function LiveMonitoringWallPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "HIGH_RISK">("ALL");

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

  const filteredAttempts = attempts.filter((att) => {
    if (filter === "ACTIVE") return att.status === "IN_PROGRESS";
    if (filter === "HIGH_RISK") return att.risk_score >= 60;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
            Active Surveillance & Browser Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Candidate Monitoring Wall
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time privacy-preserving telemetry feeds streaming from candidate examination sandboxes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            SYNCHRONIZED CLIENTS
          </div>
          <Link
            href="/examiner"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Operations
          </Link>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase mr-1">
            Filter:
          </span>
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Candidates ({attempts.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === "ACTIVE"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Active Streaming ({attempts.filter((a) => a.status === "IN_PROGRESS").length})
          </button>
          <button
            onClick={() => setFilter("HIGH_RISK")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === "HIGH_RISK"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            High Risk Queue ({attempts.filter((a) => a.risk_score >= 60).length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono hidden sm:block">
          Showing {filteredAttempts.length} of {attempts.length} active sessions
        </div>
      </div>

      {/* Candidate Live Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <CheckCircle2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="font-semibold text-slate-800 text-sm">No Monitored Candidates Found</p>
          <p className="text-xs text-slate-500">No candidate sessions match the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttempts.map((att) => {
            const riskColor = getRiskColor(
              att.risk_score >= 80
                ? "CRITICAL"
                : att.risk_score >= 60
                ? "HIGH"
                : att.risk_score >= 30
                ? "MODERATE"
                : "LOW"
            );
            const conf = getConfidenceBadge(att.evidence_confidence);
            const isAlex = att.student_id === "d0000000-0000-0000-0000-000000000003";

            return (
              <div
                key={att.id}
                className={`rounded-2xl border bg-white p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
                  att.risk_score >= 60
                    ? "border-rose-200 ring-1 ring-rose-100"
                    : "border-slate-200"
                }`}
              >
                <div>
                  {/* Card Status Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          att.status === "IN_PROGRESS"
                            ? "bg-emerald-600 animate-pulse"
                            : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                        {att.status === "IN_PROGRESS" ? "Active Stream" : "Submitted"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                      <Wifi className="h-3 w-3" />
                      SECURE SSE
                    </div>
                  </div>

                  {/* Candidate Identity */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm">
                      {att.student?.full_name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {att.student?.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {att.exam?.title || "Examination"}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry Indicator Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-4 space-y-2.5">
                    {/* Camera / CV Signal */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-blue-600" />
                        MediaPipe Signal
                      </span>
                      <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        FACE TRACKED
                      </span>
                    </div>

                    {/* Risk Index */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Synthesized Risk:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-md border text-[11px] ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}
                      >
                        {att.risk_score} / 100
                      </span>
                    </div>

                    {/* Confidence */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Evidence Confidence:</span>
                      <span
                        className={`font-mono font-semibold px-2 py-0.5 rounded-md border text-[11px] ${conf.bg} ${conf.text} ${conf.border}`}
                      >
                        {conf.label}
                      </span>
                    </div>

                    {/* Flagged Episode Notice */}
                    {isAlex && (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 text-[11px] text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-950">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" /> Flagged Episode Detected
                        </div>
                        <span className="text-[10px] text-amber-800 block">
                          Window Blur + Tab Departure &rarr; Q2 Answer Modified (18s cluster)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/examiner/investigate/${att.id}`}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-xs"
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
