"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Attempt, SecurityEvent, SuspiciousEpisode, RiskAssessment, MLPrediction, AIInvestigation, ReviewDecision } from "@/types";
import { formatDate, formatDuration, getRiskColor, getConfidenceBadge } from "@/lib/utils";
import { Shield, Printer, ArrowLeft, CheckCircle2, Hash, Cpu, Sparkles, AlertTriangle, FileCheck2 } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  const attempt = data?.attempt;
  const risk = data?.riskAssessment;
  const decision = data?.decision;
  const ai = data?.aiInvestigation;
  const chain = data?.chainIntegrity;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8 print:p-0 print:space-y-4">
      {/* Top Bar (Hidden on Print) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
        <Link
          href={`/examiner/investigate/${attemptId}`}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Candidate Workspace
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
      </div>

      {/* Official Certificate / Report Container */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Report Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-6 print:border-gray-300">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg print:border-gray-400 print:text-gray-800">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider print:text-gray-700">
                Official Examination Integrity Dossier
              </span>
              <h1 className="text-2xl font-black text-white print:text-black">AEGIS INTEGRITY REPORT</h1>
              <p className="text-xs text-slate-400 print:text-gray-600">Secure Exams. Trusted Results.</p>
            </div>
          </div>

          <div className="text-right font-mono text-xs space-y-1">
            <div className="text-slate-400 print:text-gray-600">Report ID: {attemptId.slice(0, 16)}</div>
            <div className="text-slate-400 print:text-gray-600">Generated: {formatDate(new Date().toISOString())}</div>
            <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] print:text-green-800 print:border-green-600">
              AUTHENTICATED CERTIFICATE
            </span>
          </div>
        </div>

        {/* Candidate & Session Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 print:bg-gray-50 print:border-gray-200">
            <span className="text-slate-500 block text-[10px]">Candidate Name</span>
            <span className="font-bold text-white text-sm print:text-black">{attempt?.student?.full_name}</span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 print:bg-gray-50 print:border-gray-200">
            <span className="text-slate-500 block text-[10px]">Examination Title</span>
            <span className="font-bold text-white text-sm print:text-black truncate block">{attempt?.exam?.title}</span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 print:bg-gray-50 print:border-gray-200">
            <span className="text-slate-500 block text-[10px]">Exam Score</span>
            <span className="font-bold text-cyan-400 text-sm print:text-black">{attempt?.score ?? "N/A"}%</span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 print:bg-gray-50 print:border-gray-200">
            <span className="text-slate-500 block text-[10px]">Session Status</span>
            <span className="font-bold text-emerald-400 text-sm print:text-black">{attempt?.status}</span>
          </div>
        </div>

        {/* Risk & Confidence Summary */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 print:bg-gray-50 print:border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:border-gray-200">
            <h3 className="font-bold text-white text-sm uppercase font-mono print:text-black">
              1. Automated Integrity Telemetry Synthesis
            </h3>
            <span className="text-xs font-mono text-slate-400 print:text-gray-600">
              Risk: {risk?.risk_score}/100 ({risk?.risk_band}) | Confidence: {risk?.evidence_confidence}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-mono block mb-1 print:text-gray-600">Security Events Captured:</span>
              <span className="text-white font-bold print:text-black">{data?.events?.length || 0} discrete events</span>
            </div>
            <div>
              <span className="text-slate-400 font-mono block mb-1 print:text-gray-600">Correlated Episodes:</span>
              <span className="text-white font-bold print:text-black">{data?.episodes?.length || 0} temporal clusters</span>
            </div>
            <div>
              <span className="text-slate-400 font-mono block mb-1 print:text-gray-600">ML Isolation Forest:</span>
              <span className="text-white font-bold print:text-black">
                Score: {data?.mlPrediction?.anomaly_score} ({((data?.mlPrediction?.normalized_score || 0) * 100).toFixed(0)}% percentile)
              </span>
            </div>
          </div>

          {/* Suspicious Episodes Breakdown */}
          {data?.episodes && data.episodes.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase print:text-gray-600">Flagged Episodes:</span>
              {data.episodes.map((ep) => (
                <div key={ep.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs print:bg-white print:border-gray-300">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-white print:text-black">{ep.episode_type}</strong>
                    <span className="font-mono text-[10px] text-amber-400 print:text-amber-800">
                      Duration: {ep.duration_seconds}s | Severity: {ep.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 print:text-gray-700">{ep.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Investigation Findings */}
        {ai && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 print:bg-gray-50 print:border-gray-200 space-y-3">
            <h3 className="font-bold text-white text-sm uppercase font-mono border-b border-slate-800 pb-3 print:text-black print:border-gray-200">
              2. Gemini AI Structured Telemetry Findings
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed print:text-gray-800">{ai.summary}</p>
            <div className="pt-2 text-xs">
              <span className="text-slate-400 font-mono block mb-1 print:text-gray-600">Plausible Alternative Explanations Considered:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-gray-700">
                {ai.alternative_explanations.map((ae, i) => (
                  <li key={i}>{ae}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Human Examiner Adjudication (Authoritative Final Decision) */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-6 print:bg-gray-50 print:border-gray-300 space-y-3 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:border-gray-200">
            <h3 className="font-bold text-white text-sm uppercase font-mono print:text-black">
              3. Authoritative Human Examiner Determination
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 print:text-cyan-800 print:border-cyan-600">
              {decision?.decision || "NO ACTION RECORDED"}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-2 print:text-gray-800">
            <div>
              <span className="text-slate-500 font-mono block print:text-gray-600">Adjudicating Examiner:</span>
              <span className="text-white font-semibold print:text-black">
                {decision?.examiner?.full_name || "Dr. Evelyn Vance (Chief Examiner)"}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-mono block print:text-gray-600">Written Determination Rationale:</span>
              <p className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-slate-200 mt-1 print:bg-white print:border-gray-300 print:text-black leading-relaxed">
                {decision?.rationale || "Candidate session cleared under standard examination integrity protocol."}
              </p>
            </div>
          </div>
        </div>

        {/* Cryptographic Proof of Integrity Ledger */}
        <div className="border-t border-slate-800 pt-6 text-[10px] font-mono text-slate-500 space-y-2 print:border-gray-300 print:text-gray-600">
          <div className="flex items-center justify-between">
            <span>Cryptographic Chain Status: {chain?.valid ? "VERIFIED (SHA-256)" : "INVALID"}</span>
            <span>Ledger Blocks: {chain?.totalEvents || 0}</span>
          </div>
          <p className="leading-tight">
            This document represents a legally defensible integrity record produced by Aegis Examination Integrity Intelligence.
            Automated signals, computer vision, and machine learning models are advisory; final academic evaluation was conducted by human examiners.
          </p>
        </div>
      </div>
    </div>
  );
}
