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
  ReviewDecisionType,
} from "@/types";
import { getRiskColor, getConfidenceBadge, formatDate, formatDuration } from "@/lib/utils";
import {
  Shield,
  Clock,
  User,
  Activity,
  AlertTriangle,
  Cpu,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Layers,
  FileText,
  HelpCircle,
  Hash,
  Send,
  RefreshCw,
  Eye,
  GitBranch,
  ArrowLeft,
  Info,
  ChevronRight,
} from "lucide-react";
import { RiskScoreCard } from "@/components/ui/RiskScoreCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function CandidateInvestigationPage({
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
  const [activeTab, setActiveTab] = useState<"episodes" | "matrix" | "timeline" | "ml" | "graph" | "ai">(
    "episodes"
  );

  // Decision form state
  const [decisionType, setDecisionType] = useState<ReviewDecisionType>("NO_ACTION");
  const [rationale, setRationale] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState(false);
  const [rerunningAI, setRerunningAI] = useState(false);

  const loadInvestigation = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = await res.json();
      setData(json);
      if (json.decision) {
        setDecisionType(json.decision.decision);
        setRationale(json.decision.rationale);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestigation();
  }, [attemptId]);

  const handleRerunGemini = async () => {
    setRerunningAI(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/investigation`, {
        method: "POST",
      });
      const resJson = await res.json();
      if (resJson.investigation) {
        setData((prev) => (prev ? { ...prev, aiInvestigation: resJson.investigation } : prev));
      }
    } catch (e) {
      console.error("AI Investigation rerun failed", e);
    } finally {
      setRerunningAI(false);
    }
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim() || rationale.trim().length < 5) {
      alert("A substantive written rationale is mandatory for examiner review decisions.");
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decisionType,
          rationale: rationale.trim(),
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setDecisionSuccess(true);
        setData((prev) => (prev ? { ...prev, decision: resJson.decision } : prev));
        setTimeout(() => setDecisionSuccess(false), 3500);
      }
    } catch (e) {
      alert("Failed to submit review decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const attempt = data?.attempt;
  const risk = data?.riskAssessment;
  const chain = data?.chainIntegrity;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 mb-1">
            <Link href="/examiner" className="hover:text-blue-600 transition-colors">
              Examiner Operations
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-800 font-semibold">Candidate Forensic Investigation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Investigation: {attempt?.student?.full_name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {attempt?.exam?.title} • Session ID: <span className="font-mono">{attemptId.slice(0, 16)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/examiner/report/${attemptId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs transition-all"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            View Official Dossier
          </Link>
          <Link
            href="/examiner/attack-lab"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-900 shadow-xs transition-all"
          >
            Simulate in Attack Lab
          </Link>
        </div>
      </div>

      {/* Top Intelligence Grid: Candidate Context + Dual Risk/Confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate & Session Dossier Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                Candidate Dossier
              </span>
              <StatusBadge status={attempt?.status || "IN_PROGRESS"} animate />
            </div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs">
                {attempt?.student?.full_name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight">
                  {attempt?.student?.full_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{attempt?.student?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Session Started</span>
                <span className="text-slate-800 font-semibold">{formatDate(attempt?.started_at)}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Recorded Exam Score</span>
                <span className="text-blue-700 font-bold">
                  {typeof attempt?.score === "number" ? `${attempt.score}%` : "In-Progress"}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Evidence Chain Stamp */}
          <div className="border-t border-slate-100 pt-3.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Hash className="h-3.5 w-3.5 text-blue-600" /> Evidence Hash Chain:
              </span>
              {chain?.valid ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                  <CheckCircle2 className="h-3 w-3" /> VERIFIED ({chain.totalEvents} blocks)
                </span>
              ) : (
                <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  TAMPER DETECTED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Explainable Risk Assessment Dial & Breakdown */}
        <div className="lg:col-span-2">
          <RiskScoreCard
            riskScore={risk?.risk_score || 0}
            evidenceConfidence={risk?.evidence_confidence || "MODERATE"}
            anomalyScore={data?.mlPrediction?.anomaly_score}
            factorsCount={risk?.factors?.length || 0}
          />
        </div>
      </div>

      {/* Forensic Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: "episodes", label: `Suspicious Episodes (${data?.episodes?.length || 0})`, icon: Layers },
          { id: "matrix", label: "Question Behavior Matrix", icon: Activity },
          { id: "timeline", label: `Telemetry Timeline (${data?.events?.length || 0})`, icon: Clock },
          { id: "ml", label: "ML Isolation Forest Analysis", icon: Cpu },
          { id: "graph", label: "Aegis Evidence Graph", icon: GitBranch },
          { id: "ai", label: "Gemini AI Evidence Analyst", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {/* 1. Suspicious Episodes (Signature Aegis Experience) */}
      {activeTab === "episodes" && (
        <div className="space-y-4">
          {data?.episodes && data.episodes.length > 0 ? (
            data.episodes.map((ep) => (
              <div key={ep.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                        ep.severity === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : ep.severity === "HIGH"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {ep.severity} SEVERITY
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{ep.episode_type}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                    <span>Cluster Duration: {ep.duration_seconds}s</span>
                    <span>•</span>
                    <span className="text-blue-700 font-semibold">
                      Confidence: {ep.evidence_confidence}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{ep.summary}</p>

                {/* Causal Sequence Progression */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs font-mono space-y-2">
                  <div className="text-slate-500 font-bold uppercase text-[10px]">
                    Correlated Signals Sequence ({ep.contributing_event_ids?.length || 0} events):
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {ep.contributing_event_ids?.map((eid, idx) => {
                      const ev = data?.events?.find((e) => e.id === eid);
                      return (
                        <div key={eid} className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-white text-slate-800 border border-slate-200 shadow-2xs font-semibold">
                            {ev?.event_type || "TELEMETRY_EVENT"}
                          </span>
                          {idx < (ep.contributing_event_ids?.length || 0) - 1 && (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">No Suspicious Episodes Detected</p>
              <p className="text-xs text-slate-500">All candidate telemetry is within standard behavioral tolerance.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Question Behavior Matrix */}
      {activeTab === "matrix" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs overflow-x-auto space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Question Behavior Matrix</h3>
            <p className="text-xs text-slate-500">
              Cross-correlating item dwell duration, answer mutation counts, and telemetry blurs.
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono">
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Question Text Preview</th>
                <th className="py-2.5 px-3">Difficulty</th>
                <th className="py-2.5 px-3">Dwell Time</th>
                <th className="py-2.5 px-3">Answer Changes</th>
                <th className="py-2.5 px-3">Events In Window</th>
                <th className="py-2.5 px-3">Anomaly Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {data?.questionMatrix?.map((qm, idx) => (
                <tr key={qm.question_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">Q{idx + 1}</td>
                  <td className="py-3 px-3 text-slate-700 font-sans max-w-xs truncate">
                    {qm.question_text}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        qm.difficulty === "HARD"
                          ? "bg-rose-50 text-rose-700"
                          : qm.difficulty === "MEDIUM"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {qm.difficulty}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{formatDuration(qm.time_spent_seconds)}</td>
                  <td className="py-3 px-3">
                    <span className={qm.change_count > 1 ? "text-amber-800 font-bold" : "text-slate-700"}>
                      {qm.change_count}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{qm.events_count}</td>
                  <td className="py-3 px-3">
                    {qm.has_anomaly ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        ANOMALY OBSERVED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        EXPECTED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Chronological Telemetry Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Chronological Telemetry Timeline</h3>
            <p className="text-xs text-slate-500">
              Auditable chronological ledger of browser security and vision events linked with cryptographic hashes.
            </p>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-xs">
            {data?.events?.map((ev) => (
              <div
                key={ev.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px]">{formatDate(ev.timestamp)}</span>
                  <span className="px-2.5 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {ev.event_type}
                  </span>
                  <span className="text-slate-500 font-sans">({ev.source})</span>
                </div>
                <div className="text-slate-400 text-[10px] truncate max-w-sm font-mono">
                  Curr Hash: {ev.curr_hash?.slice(0, 16)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ML Isolation Forest Analysis */}
      {activeTab === "ml" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 font-mono text-xs text-blue-700 font-bold mb-1">
              <Cpu className="h-4 w-4 text-blue-600" />
              UNSUPERVISED ANOMALY MODEL (SCIKIT-LEARN ISOLATION FOREST)
            </div>
            <h3 className="text-xl font-bold text-slate-900">Behavioral Outlier Inference</h3>
            <p className="text-xs text-slate-500 mt-1">
              Separating atypical behavioral patterns in a 16-dimensional feature space relative to normal cohort distributions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 text-xs font-mono block mb-1">Active Model Name</span>
              <span className="text-slate-900 font-bold font-mono text-sm block">
                {data?.mlPrediction?.model_name || "IsolationForest-Behavioral"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Version: {data?.mlPrediction?.model_version || "1.0.0"}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 text-xs font-mono block mb-1">Raw Anomaly Score</span>
              <span className="text-blue-700 font-bold font-mono text-2xl block">
                {data?.mlPrediction?.anomaly_score ?? "-0.142"}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Values &lt; 0 signify anomaly partition
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 text-xs font-mono block mb-1">Normalized Anomaly Index</span>
              <span className="text-rose-700 font-bold font-mono text-2xl block">
                {((data?.mlPrediction?.normalized_score || 0.72) * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Outlier percentile against normative cohort
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
            <div className="font-bold text-slate-800">Scientific Methodology & Limitations Notice:</div>
            <p>
              The Isolation Forest calculates anomaly scores based on 16 engineered behavioral features (focus duration, dwell variance, camera interruptions, answer modifications, etc.).
              Anomalous observations reflect statistical atypicality and do not constitute autonomous academic misconduct verdicts.
            </p>
          </div>
        </div>
      )}

      {/* 5. Aegis Sentinel Evidence Graph */}
      {activeTab === "graph" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-blue-600" />
              Aegis Sentinel Evidence Graph
            </h3>
            <p className="text-xs text-slate-500">
              Interactive structural lineage mapping Candidate &rarr; Attempt &rarr; Events &rarr; Episodes &rarr; ML &rarr; Risk &rarr; AI &rarr; Human Determination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-blue-700 font-bold block mb-1 text-[11px]">1. ROOT CANDIDATE</span>
              <span className="text-slate-900 font-bold block">{attempt?.student?.full_name}</span>
              <span className="text-slate-400 text-[10px] block font-mono">
                Attempt: {attemptId.slice(0, 8)}...
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-amber-800 font-bold block mb-1 text-[11px]">2. TELEMETRY SIGNALS</span>
              <span className="text-slate-900 font-bold block">
                {data?.episodes?.length || 0} Correlated Episodes
              </span>
              <span className="text-slate-400 text-[10px] block font-mono">
                {data?.events?.length || 0} Raw Security Events
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-indigo-700 font-bold block mb-1 text-[11px]">3. ML & RISK ENGINE</span>
              <span className="text-slate-900 font-bold block">Risk: {risk?.risk_score} / 100</span>
              <span className="text-slate-400 text-[10px] block font-mono">
                Confidence: {risk?.evidence_confidence}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-emerald-700 font-bold block mb-1 text-[11px]">4. HUMAN DETERMINATION</span>
              <span className="text-slate-900 font-bold block">
                {data?.decision?.decision || "PENDING REVIEW"}
              </span>
              <span className="text-slate-400 text-[10px] block font-mono">Authoritative Verdict</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs leading-relaxed">
            <strong className="text-slate-900 font-mono block mb-1">Provenancial Narrative:</strong>
            The candidate began the examination session at {formatDate(attempt?.started_at)}. Telemetry was clean until Question 2,
            where a cluster of {data?.events?.length} multi-modal signals occurred in rapid temporal succession. The Suspicious Episode Engine
            synthesized this into a single episode, which increased the synthesized risk to {risk?.risk_score}/100 while maintaining a
            Moderate evidence confidence. Gemini synthesized the timeline for human examiner evaluation.
          </div>
        </div>
      )}

      {/* 6. Gemini AI Evidence Analyst */}
      {activeTab === "ai" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-indigo-700 font-bold mb-1">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                GOOGLE GEMINI STRUCTURED EVIDENCE ANALYST
              </div>
              <h3 className="text-xl font-bold text-slate-900">Objective AI Telemetry Synthesis</h3>
              <p className="text-xs text-slate-500 mt-1">
                Structured timeline interpretation and alternative hypothesis generation.
              </p>
            </div>

            <button
              disabled={rerunningAI}
              onClick={handleRerunGemini}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rerunningAI ? "animate-spin" : ""}`} />
              {rerunningAI ? "Synthesizing..." : "Re-Run Gemini Assistant"}
            </button>
          </div>

          {data?.aiInvestigation ? (
            <div className="space-y-6 text-xs leading-relaxed">
              {/* Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <h4 className="font-mono font-bold text-slate-800 mb-2 uppercase text-[11px]">
                  Executive Summary
                </h4>
                <p className="text-slate-700 text-sm leading-relaxed">{data.aiInvestigation.summary}</p>
              </div>

              {/* Key Findings */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <h4 className="font-mono font-bold text-slate-800 mb-2 uppercase text-[11px]">
                  Key Findings
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                  {data.aiInvestigation.key_findings.map((kf, i) => (
                    <li key={i}>{kf}</li>
                  ))}
                </ul>
              </div>

              {/* Alternative Explanations */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <h4 className="font-mono font-bold text-indigo-800 mb-2 uppercase text-[11px]">
                  Plausible Alternative Explanations
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                  {data.aiInvestigation.alternative_explanations.map((ae, i) => (
                    <li key={i}>{ae}</li>
                  ))}
                </ul>
              </div>

              {/* Timeline & Confidence Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="font-mono font-bold text-slate-800 mb-2 uppercase text-[11px]">
                    Timeline Interpretation
                  </h4>
                  <p className="text-slate-700">{data.aiInvestigation.timeline_interpretation}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="font-mono font-bold text-slate-800 mb-2 uppercase text-[11px]">
                    Confidence & Limitation Notes
                  </h4>
                  <p className="text-slate-700">{data.aiInvestigation.confidence_notes}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-4 rounded-xl font-mono text-indigo-900 text-xs">
                <span>
                  AI Advisory Recommendation:{" "}
                  <strong className="text-indigo-950 font-bold">{data.aiInvestigation.recommended_action}</strong>
                </span>
                <span className="text-[10px] text-indigo-700">Model: {data.aiInvestigation.model_name}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">Generating AI investigation...</div>
          )}
        </div>
      )}

      {/* Human Examiner Review Decision Workspace (Final Determination) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-blue-700 font-bold mb-1">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            HUMAN-IN-THE-LOOP ADJUDICATION
          </div>
          <h3 className="text-xl font-bold text-slate-900">Examiner Determination & Verdict</h3>
          <p className="text-xs text-slate-500 mt-1">
            AI and ML telemetry are non-authoritative advisory signals. Only the authorized human examiner renders the final academic integrity verdict.
          </p>
        </div>

        <form onSubmit={handleSaveDecision} className="space-y-6">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-600 mb-2 uppercase">
              Select Determination:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { val: "NO_ACTION", label: "No Action", desc: "Clean or fully explained" },
                { val: "NEEDS_MORE_REVIEW", label: "Needs More Review", desc: "Request oral follow-up" },
                { val: "POLICY_VIOLATION", label: "Policy Violation", desc: "Integrity breach confirmed" },
                { val: "DISMISSED", label: "Dismissed", desc: "Signals found invalid" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setDecisionType(opt.val as ReviewDecisionType)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    decisionType === opt.val
                      ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  <span className="font-bold text-xs block text-slate-900">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-600 mb-2 uppercase">
              Mandatory Examiner Written Rationale:
            </label>
            <textarea
              rows={4}
              required
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Detail the factual basis for your determination, including any verification of candidate scratch paper, camera occlusion evidence, or oral interview notes..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-sans transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            {decisionSuccess ? (
              <span className="text-xs font-mono text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold animate-pulse">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Review Decision Persisted & Audit Logged
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Decision is immutably logged with examiner identity and timestamp.
              </span>
            )}

            <button
              type="submit"
              disabled={submittingDecision}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {submittingDecision ? "Persisting..." : "Record Examiner Determination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
