"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Attempt } from "@/types";
import { formatDate, getRiskColor, getConfidenceBadge } from "@/lib/utils";
import {
  Cpu,
  ShieldAlert,
  Users,
  Activity,
  ArrowRight,
  Eye,
  FileCheck2,
  Sparkles,
  Terminal,
  Radio,
  Clock,
} from "lucide-react";

export default function ExaminerDashboardPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);

  const fetchAttempts = async () => {
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
    fetchAttempts();

    // Connect to Server-Sent Events (SSE) Realtime feed
    const es = new EventSource("/api/realtime");

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.type === "SECURITY_EVENT_INGESTED" || parsed.type === "REVIEW_DECISION_SUBMITTED" || parsed.type === "ATTEMPT_SUBMITTED") {
          setRealtimeLogs((prev) => [
            {
              id: Date.now(),
              type: parsed.type,
              time: new Date().toLocaleTimeString(),
              payload: parsed.payload,
            },
            ...prev.slice(0, 7),
          ]);
          fetchAttempts();
        }
      } catch (err) {
        // Safe swallow
      }
    };

    return () => es.close();
  }, []);

  const totalAttempts = attempts.length;
  const inProgress = attempts.filter((a) => a.status === "IN_PROGRESS").length;
  const highRisk = attempts.filter((a) => a.risk_score >= 60).length;
  const underReview = attempts.filter((a) => a.review_status === "REVIEW_RECOMMENDED" || a.review_status === "UNDER_REVIEW").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-1">
            <Cpu className="h-3.5 w-3.5" />
            SECURITY OPERATIONS CENTER (SOC)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Examiner Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Realtime exam integrity monitoring, behavioral correlation, and human review dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/examiner/live"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-all shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            Live Monitoring Wall
          </Link>
          <Link
            href="/examiner/attack-lab"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-all shadow-sm"
          >
            <Terminal className="h-3.5 w-3.5" />
            Launch Attack Lab
          </Link>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">TOTAL CANDIDATES</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalAttempts}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered in current cohort</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">ACTIVE IN-PROGRESS</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{inProgress}</div>
          <span className="text-[11px] text-emerald-500/80 mt-1 block flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live telemetry streaming
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">HIGH-RISK QUEUE</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{highRisk}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Risk index &ge; 60 / 100</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">REVIEW PENDING</span>
            <FileCheck2 className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{underReview}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Requires examiner adjudication</span>
        </div>
      </div>

      {/* Realtime Live Telemetry Log Stream */}
      {realtimeLogs.length > 0 && (
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
              LIVE TELEMETRY INGESTION STREAM (SSE)
            </div>
            <span className="text-[10px] font-mono text-slate-500">Realtime Broadcast Active</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            {realtimeLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-slate-300 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800/60">
                <span className="text-cyan-400 font-semibold">[{log.time}] {log.type}</span>
                <span className="text-slate-400 truncate max-w-md">
                  Attempt: {log.payload.attempt_id?.slice(0, 10)}... | Risk: {log.payload.risk_score} | Event: {log.payload.event?.event_type || "STATUS_CHANGE"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidates & Attempts Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Examination Candidates & Telemetry Status</h2>
            <p className="text-xs text-slate-400">Prioritized by explainable risk assessment and evidence confidence.</p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Showing {attempts.length} attempts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 font-semibold">Candidate</th>
                <th className="pb-3 font-semibold">Exam Title</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Risk Index</th>
                <th className="pb-3 font-semibold">Evidence Confidence</th>
                <th className="pb-3 font-semibold">Review Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attempts.map((att) => {
                const riskColor = getRiskColor(
                  att.risk_score >= 80 ? "CRITICAL" : att.risk_score >= 60 ? "HIGH" : att.risk_score >= 30 ? "MODERATE" : "LOW"
                );
                const conf = getConfidenceBadge(att.evidence_confidence);

                return (
                  <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                          {att.student?.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <span className="font-semibold text-white block text-sm">{att.student?.full_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{att.student?.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-slate-300 font-medium max-w-[200px] truncate">
                      {att.exam?.title || "Exam Session"}
                    </td>

                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono ${
                          att.status === "IN_PROGRESS"
                            ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 animate-pulse"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {att.status === "IN_PROGRESS" && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                        {att.status}
                      </span>
                    </td>

                    <td className="py-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}>
                          {att.risk_score} / 100
                        </span>
                      </div>
                    </td>

                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>
                        {conf.label}
                      </span>
                    </td>

                    <td className="py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          att.review_status === "REVIEW_RECOMMENDED"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                            : att.review_status === "RESOLVED"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {att.review_status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-4 text-right">
                      <Link
                        href={`/examiner/investigate/${att.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
                      >
                        Investigate <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
