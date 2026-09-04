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
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";

export default function ExaminerDashboardPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

    // 1. Supabase Realtime Channel
    const supabase = createClient();
    let channel: any = null;

    if (supabase) {
      channel = supabase
        .channel("public:telemetry-feed")
        .on("postgres_changes", { event: "*", schema: "public", table: "security_events" }, (payload: any) => {
          setRealtimeLogs((prev) => [
            {
              id: Date.now(),
              type: "SECURITY_EVENT_INGESTED",
              time: new Date().toLocaleTimeString(),
              payload: payload.new,
            },
            ...prev.slice(0, 5),
          ]);
          fetchAttempts();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "attempts" }, () => {
          fetchAttempts();
        })
        .subscribe();
    }

    // 2. Server-Sent Events (SSE) Fallback/Local Bridge
    const es = new EventSource("/api/realtime");

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (
          parsed.type === "SECURITY_EVENT_INGESTED" ||
          parsed.type === "REVIEW_DECISION_SUBMITTED" ||
          parsed.type === "ATTEMPT_SUBMITTED" ||
          parsed.type === "RISK_ASSESSMENT_UPDATED"
        ) {
          setRealtimeLogs((prev) => [
            {
              id: Date.now(),
              type: parsed.type,
              time: new Date().toLocaleTimeString(),
              payload: parsed.payload,
            },
            ...prev.slice(0, 5),
          ]);
          fetchAttempts();
        }
      } catch (err) {
        // Safe swallow
      }
    };

    return () => {
      es.close();
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const totalAttempts = attempts.length;
  const inProgress = attempts.filter((a) => a.status === "IN_PROGRESS").length;
  const highRisk = attempts.filter((a) => a.risk_score >= 60).length;
  const underReview = attempts.filter(
    (a) => a.review_status === "REVIEW_RECOMMENDED" || a.review_status === "UNDER_REVIEW"
  ).length;

  const filteredAttempts = attempts.filter((a) => {
    const matchesSearch =
      a.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.exam?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "HIGH_RISK") return a.risk_score >= 60;
    if (statusFilter === "IN_PROGRESS") return a.status === "IN_PROGRESS";
    if (statusFilter === "UNDER_REVIEW")
      return a.review_status === "REVIEW_RECOMMENDED" || a.review_status === "UNDER_REVIEW";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Context Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <Cpu className="h-4 w-4" />
            Security Operations Center (SOC)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Examiner Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time candidate telemetry monitoring, behavioral anomaly correlation, and human review dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/examiner/live"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition-all"
          >
            <Eye className="h-3.5 w-3.5 text-blue-600" />
            Live Monitoring Wall
          </Link>
          <Link
            href="/examiner/attack-lab"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 shadow-xs transition-all"
          >
            <Terminal className="h-3.5 w-3.5" />
            Attack Simulation Lab
          </Link>
        </div>
      </div>

      {/* Attention Triage Banner (Dashboard Attention Model) */}
      {highRisk > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-950">
                Action Required: {highRisk} High-Risk Examination {highRisk === 1 ? "Session" : "Sessions"} Detected
              </h2>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Candidate sessions exhibiting correlated behavioral anomalies (e.g. window blur + tab switches + question modification) are queued for examiner adjudication.
              </p>
            </div>
          </div>
          <Link
            href="/examiner/investigate/at000000-0000-0000-0000-000000000002"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            Review Flagship Case (Alex Mercer) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* High-Density Key Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cohort"
          value={totalAttempts}
          subtitle="Registered examinees in session"
          icon={<Users className="h-4 w-4" />}
          highlight="default"
        />

        <StatCard
          label="Active In-Progress"
          value={inProgress}
          subtitle="Live telemetry streaming from browsers"
          icon={<Activity className="h-4 w-4" />}
          highlight="blue"
        />

        <StatCard
          label="High-Risk Queue"
          value={highRisk}
          subtitle="Synthesized risk index >= 60 / 100"
          icon={<ShieldAlert className="h-4 w-4" />}
          highlight={highRisk > 0 ? "rose" : "default"}
        />

        <StatCard
          label="Pending Adjudication"
          value={underReview}
          subtitle="Requires human examiner determination"
          icon={<FileCheck2 className="h-4 w-4" />}
          highlight={underReview > 0 ? "amber" : "default"}
        />
      </div>

      {/* Realtime Telemetry Broadcast Feed */}
      {realtimeLogs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-700">
              <Radio className="h-3.5 w-3.5 animate-pulse text-blue-600" />
              REALTIME TELEMETRY INGESTION STREAM (SSE + POSTGRES)
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-medium">
              Synchronized & Active
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {realtimeLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 gap-1 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-bold">[{log.time}]</span>
                  <span className="font-semibold text-slate-900">{log.type}</span>
                </div>
                <div className="text-slate-500 truncate max-w-lg">
                  Attempt: {log.payload.attempt_id?.slice(0, 8)}... | Risk: {log.payload.risk_score ?? "N/A"} | Event: {log.payload.event?.event_type || log.payload.event_type || "TELEMETRY_UPDATE"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Sessions Roster */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls & Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Monitored Candidate Sessions & Telemetry Roster
            </h2>
            <p className="text-xs text-slate-500">
              Prioritized by explainable multi-sensor risk assessment and evidence confidence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or exam..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-52 sm:w-64"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">All Sessions ({attempts.length})</option>
              <option value="HIGH_RISK">High Risk (Score 60+)</option>
              <option value="IN_PROGRESS">Active In-Progress</option>
              <option value="UNDER_REVIEW">Review Pending</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CheckCircle2 className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-800 text-sm">No Matching Sessions</p>
            <p className="text-xs text-slate-500">No candidates match your current search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-mono">
                  <th className="py-3 px-5 font-semibold">Candidate</th>
                  <th className="py-3 px-5 font-semibold">Exam Title</th>
                  <th className="py-3 px-5 font-semibold">Session Status</th>
                  <th className="py-3 px-5 font-semibold">Risk Index</th>
                  <th className="py-3 px-5 font-semibold">Evidence Confidence</th>
                  <th className="py-3 px-5 font-semibold">Review Status</th>
                  <th className="py-3 px-5 font-semibold text-right">Adjudication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {att.student?.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {att.student?.full_name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {att.student?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-slate-700 font-medium max-w-[200px] truncate">
                        {att.exam?.title || "Exam Session"}
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge status={att.status} animate />
                      </td>

                      <td className="py-4 px-5 font-mono">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${riskColor.dot}`} />
                          {att.risk_score} / 100
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
                          {conf.label}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge status={att.review_status} />
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/examiner/investigate/${att.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-xs"
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
        )}
      </div>
    </div>
  );
}
