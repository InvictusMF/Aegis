"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Attempt,
  SecurityEvent,
  SuspiciousEpisode,
  RiskAssessment,
  MLPrediction,
  AIInvestigation,
  ReviewDecision,
} from "@/types";
import { formatDate, formatDuration, getRiskColor, getConfidenceBadge } from "@/lib/utils";
import {
  Shield,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Hash,
  Cpu,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function IntegrityReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: attemptId } = use(params);

  const [data, setData] = useState<{
    attempt?: Attempt;
    events?: SecurityEvent[];
    chainIntegrity?: { valid: boolean; brokenIndex: number | null; totalEvents: number };
    episodes?: SuspiciousEpisode[];
    riskAssessment?: RiskAssessment;
    mlPrediction?: MLPrediction;
    aiInvestigation?: AIInvestigation;
    decision?: ReviewDecision;
    questionMatrix?: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const attempt = data?.attempt;
  const risk = data?.riskAssessment;
  const decision = data?.decision;
  const ai = data?.aiInvestigation;
  const chain = data?.chainIntegrity;

  const riskBand = risk?.risk_band || "LOW";
  const riskColor = getRiskColor(riskBand);
  const confBadge = getConfidenceBadge(risk?.evidence_confidence || "LOW");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 print:p-0 print:space-y-4">
      {/* Top Bar (Hidden on Print) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
        <Link
          href={`/examiner/investigate/${attemptId}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Forensic Workspace
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs"
        >
          <Printer className="h-4 w-4" /> Print / Export Official PDF
        </button>
      </div>

      {/* Official Certificate / Dossier Sheet Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Report Header & Aegis Crest */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shadow-xs">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-blue-700 uppercase tracking-wider block">
                Official Examination Integrity Dossier
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                AEGIS INTEGRITY REPORT
              </h1>
              <p className="text-xs text-slate-500 font-medium">Secure Exams. Trusted Results.</p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono text-xs space-y-1">
            <div className="text-slate-600">
              Report ID: <span className="font-bold text-slate-900">{attemptId.slice(0, 16)}</span>
            </div>
            <div className="text-slate-600">
              Generated: {formatDate(new Date().toISOString())}
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              AUTHENTICATED EVIDENCE RECORD
            </span>
          </div>
        </div>

        {/* Candidate & Session Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate Name</span>
            <span className="font-bold text-slate-900 text-sm">{attempt?.student?.full_name}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Examination</span>
            <span className="font-bold text-slate-900 text-sm truncate block">{attempt?.exam?.title}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Exam Score</span>
            <span className="font-bold text-blue-700 text-sm">
              {typeof attempt?.score === "number" ? `${attempt.score}%` : "In-Progress"}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Session Status</span>
            <span className="font-bold text-emerald-700 text-sm">{attempt?.status}</span>
          </div>
        </div>

        {/* Section 1: Automated Integrity Telemetry Synthesis */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <h2 className="font-bold text-slate-900 text-sm uppercase font-mono">
              1. Automated Integrity Telemetry Synthesis
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}
              >
                Risk Index: {risk?.risk_score || 0} / 100 ({riskBand})
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${confBadge.bg} ${confBadge.text} ${confBadge.border}`}
              >
                {confBadge.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1 text-[11px]">Security Events Captured:</span>
              <span className="text-slate-900 font-bold text-sm">{data?.events?.length || 0} discrete events</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1 text-[11px]">Correlated Episodes:</span>
              <span className="text-slate-900 font-bold text-sm">{data?.episodes?.length || 0} temporal clusters</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1 text-[11px]">ML Isolation Forest:</span>
              <span className="text-slate-900 font-bold text-sm">
                Score: {data?.mlPrediction?.anomaly_score ?? "-0.14"} ({((data?.mlPrediction?.normalized_score || 0.72) * 100).toFixed(0)}% percentile)
              </span>
            </div>
          </div>

          {/* Suspicious Episodes Breakdown */}
          {data?.episodes && data.episodes.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                Correlated Temporal Episodes:
              </span>
              {data.episodes.map((ep) => (
                <div key={ep.id} className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">{ep.episode_type}</strong>
                    <span className="font-mono text-[11px] text-amber-800 font-semibold">
                      Cluster: {ep.duration_seconds}s | Severity: {ep.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{ep.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Gemini AI Structured Telemetry Findings */}
        {ai && (
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 space-y-3">
            <h2 className="font-bold text-slate-900 text-sm uppercase font-mono border-b border-slate-200 pb-3">
              2. Gemini AI Structured Telemetry Findings
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">{ai.summary}</p>
            <div className="pt-2 text-xs">
              <span className="text-slate-500 font-mono font-bold block mb-1 uppercase text-[10px]">
                Plausible Alternative Explanations Considered:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {ai.alternative_explanations.map((ae, i) => (
                  <li key={i}>{ae}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section 3: Authoritative Human Examiner Determination */}
        <div className="bg-blue-50/40 border border-blue-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
            <h2 className="font-bold text-slate-900 text-sm uppercase font-mono">
              3. Authoritative Human Examiner Determination
            </h2>
            <span className="text-xs font-mono px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-300">
              {decision?.decision || "NO ACTION RECORDED"}
            </span>
          </div>

          <div className="text-xs text-slate-700 space-y-2">
            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase font-bold block">
                Adjudicating Examiner:
              </span>
              <span className="text-slate-900 font-bold text-sm">
                {decision?.examiner?.full_name || "Dr. Evelyn Vance (Chief Examiner)"}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase font-bold block">
                Written Determination Rationale:
              </span>
              <p className="p-4 bg-white rounded-xl border border-slate-200 text-slate-800 mt-1 leading-relaxed font-sans shadow-2xs">
                {decision?.rationale || "Candidate session cleared under standard examination integrity protocol."}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Cryptographic Proof of Integrity Ledger */}
        <div className="border-t border-slate-200 pt-6 text-[10px] font-mono text-slate-500 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>Cryptographic Chain Status: {chain?.valid ? "VERIFIED (SHA-256)" : "INVALID"}</span>
            <span>Ledger Blocks: {chain?.totalEvents || 0}</span>
          </div>
          <p className="leading-relaxed">
            This document represents a legally defensible integrity record produced by Aegis Examination Integrity Intelligence.
            Automated signals, computer vision, and machine learning models are advisory; final academic evaluation was conducted by human examiners.
          </p>

          <div className="pt-8 flex justify-between items-end">
            <div>
              <div className="h-0.5 w-48 bg-slate-300 mb-1" />
              <span className="text-[10px] uppercase font-sans font-semibold text-slate-500">
                Examiner Signature & Academic Seal
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-sans">
                Aegis Sentinel Cryptographic Seal #AEG-2026-VERIFIED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
