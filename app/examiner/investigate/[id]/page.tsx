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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"timeline" | "episodes" | "matrix" | "ml" | "graph" | "ai">("episodes");

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
        setTimeout(() => setDecisionSuccess(false), 3000);
      }
    } catch (e) {
      alert("Failed to submit review decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  const attempt = data?.attempt;
  const risk = data?.riskAssessment;
  const riskColor = getRiskColor(risk?.risk_band || "LOW");
  const confBadge = getConfidenceBadge(risk?.evidence_confidence || "LOW");
  const chain = data?.chainIntegrity;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-1">
            <Link href="/examiner" className="hover:underline text-slate-400">Examiner Operations</Link>
            <span>/</span>
            <span>Candidate Investigation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Investigation: {attempt?.student?.full_name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{attempt?.exam?.title}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/examiner/report/${attemptId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <FileText className="h-3.5 w-3.5" />
            Integrity Report
          </Link>
          <Link
            href="/examiner/attack-lab"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-all"
          >
            Attack Lab
          </Link>
        </div>
      </div>

      {/* Top Cards: Candidate Overview & Explainable Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate & Attempt Summary */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono text-slate-400">CANDIDATE DOSSIER</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {attempt?.status}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-base">
                {attempt?.student?.full_name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{attempt?.student?.full_name}</h3>
                <p className="text-xs text-slate-400 font-mono">{attempt?.student?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-4">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Attempt Started</span>
                <span className="text-slate-200">{formatDate(attempt?.started_at)}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Exam Score</span>
                <span className="text-cyan-400 font-bold">{attempt?.score ?? "In-Progress"}%</span>
              </div>
            </div>
          </div>

          {/* Tamper-Evident SHA256 Evidence Chain Badge */}
          <div className="border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-cyan-400" /> Evidence Chain:
              </span>
              {chain?.valid ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> VERIFIED ({chain.totalEvents} blocks)
                </span>
              ) : (
                <span className="text-rose-400 font-bold">TAMPER DETECTED</span>
              )}
            </div>
          </div>
        </div>

        {/* Explainable Risk Assessment Dial */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <Shield className="h-4 w-4 text-cyan-400" />
                EXPLAINABLE RISK & EVIDENCE CONFIDENCE
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Engine: {risk?.engine_version || "aegis-risk-v1.2"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-mono text-slate-400 mb-1">AGGREGATE RISK INDEX</span>
                <div className={`text-4xl font-black font-mono my-1 ${riskColor.text}`}>
                  {risk?.risk_score || 0}
                  <span className="text-xs text-slate-500 font-normal"> / 100</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}>
                  {risk?.risk_band || "LOW"}
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-mono text-slate-400 mb-1">EVIDENCE CONFIDENCE</span>
                <div className="text-xl font-bold font-mono my-2 text-white">
                  {confBadge.label}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Strength & corroboration of independent signals
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-mono text-slate-400 mb-1">FLAGGED EPISODES</span>
                <div className="text-3xl font-bold font-mono my-1 text-amber-400">
                  {data?.episodes?.length || 0}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Correlated temporal event clusters
                </p>
              </div>
            </div>

            {/* Risk Factors List */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">Contributing Risk Factors:</span>
              {risk?.factors?.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-start justify-between text-xs bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                  <div className="text-slate-300">
                    <strong className="text-white">{f.factor}:</strong> {f.description}
                    {f.mitigating_context && (
                      <span className="block text-[10px] text-cyan-400/90 mt-0.5">
                        Mitigation: {f.mitigating_context}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400 pl-3">
                    {f.weight > 0 ? `+${f.weight}` : f.weight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Deep Investigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: "episodes", label: `Suspicious Episodes (${data?.episodes?.length || 0})`, icon: Layers },
          { id: "matrix", label: "Question Behavior Matrix", icon: Activity },
          { id: "timeline", label: `Telemetry Timeline (${data?.events?.length || 0})`, icon: Clock },
          { id: "ml", label: "ML Isolation Forest Analysis", icon: Cpu },
          { id: "graph", label: "Aegis Evidence Graph", icon: GitBranch },
          { id: "ai", label: "Gemini AI Investigation", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {/* 1. Suspicious Episodes */}
      {activeTab === "episodes" && (
        <div className="space-y-4">
          {data?.episodes && data.episodes.length > 0 ? (
            data.episodes.map((ep) => (
              <div key={ep.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      {ep.severity} SEVERITY
                    </span>
                    <h3 className="font-bold text-white text-base">{ep.episode_type}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Duration: {ep.duration_seconds}s</span>
                    <span>•</span>
                    <span className="text-cyan-400">Confidence: {ep.evidence_confidence}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-4">{ep.summary}</p>

                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 text-xs font-mono space-y-1">
                  <div className="text-slate-500">Contributing Telemetry Signals ({ep.contributing_event_ids?.length || 0}):</div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ep.contributing_event_ids?.map((eid) => {
                      const ev = data?.events?.find((e) => e.id === eid);
                      return (
                        <span key={eid} className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                          {ev?.event_type || "TELEMETRY_EVENT"} ({ev?.source})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-sm">
              No suspicious episodes detected for this attempt.
            </div>
          )}
        </div>
      )}

      {/* 2. Question Behavior Matrix */}
      {activeTab === "matrix" && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg overflow-x-auto">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Question Behavior Matrix</h3>
            <p className="text-xs text-slate-400">
              Correlating dwell duration, mutation counts, and telemetry events across exam items.
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3">Item #</th>
                <th className="pb-3">Question Preview</th>
                <th className="pb-3">Difficulty</th>
                <th className="pb-3">Dwell Time</th>
                <th className="pb-3">Answer Changes</th>
                <th className="pb-3">Telemetry Events</th>
                <th className="pb-3">Anomaly Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {data?.questionMatrix?.map((qm, idx) => (
                <tr key={qm.question_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-bold text-white">Q{idx + 1}</td>
                  <td className="py-3 text-slate-300 font-sans max-w-xs truncate">{qm.question_text}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        qm.difficulty === "HARD" ? "text-rose-400" : qm.difficulty === "MEDIUM" ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {qm.difficulty}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{formatDuration(qm.time_spent_seconds)}</td>
                  <td className="py-3">
                    <span className={qm.change_count > 1 ? "text-amber-400 font-bold" : "text-slate-300"}>
                      {qm.change_count}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{qm.events_count}</td>
                  <td className="py-3">
                    {qm.has_anomaly ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        ANOMALY OBSERVED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
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
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="mb-2">
            <h3 className="text-base font-bold text-white">Chronological Telemetry Timeline</h3>
            <p className="text-xs text-slate-400">Ordered chronological ledger of sandboxed events with hash chain hashes.</p>
          </div>

          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {data?.events?.map((ev) => (
              <div key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">{formatDate(ev.timestamp)}</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                    {ev.event_type}
                  </span>
                  <span className="text-slate-400">({ev.source})</span>
                </div>
                <div className="text-slate-500 text-[10px] truncate max-w-sm">
                  Hash: {ev.curr_hash?.slice(0, 16)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ML Isolation Forest Analysis */}
      {activeTab === "ml" && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-1">
              <Cpu className="h-3.5 w-3.5" />
              UNSUPERVISED ANOMALY MODEL (SCIKIT-LEARN)
            </div>
            <h3 className="text-xl font-bold text-white">Behavioral Outlier Inference</h3>
            <p className="text-xs text-slate-400 mt-1">
              Isolation Forest separates unusual telemetry observations in high-dimensional feature space.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-mono block mb-1">Model Name & Version</span>
              <span className="text-white font-bold font-mono">{data?.mlPrediction?.model_name}</span>
              <span className="text-[10px] text-slate-500 block">{data?.mlPrediction?.model_version}</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-mono block mb-1">Raw Decision Score</span>
              <span className="text-cyan-400 font-bold font-mono text-xl">{data?.mlPrediction?.anomaly_score}</span>
              <span className="text-[10px] text-slate-500 block">&lt; 0 indicates anomaly boundary</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-mono block mb-1">Normalized Anomaly Index</span>
              <span className="text-rose-400 font-bold font-mono text-xl">
                {((data?.mlPrediction?.normalized_score || 0) * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 block">Outlier probability relative to cohort</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-white">Scientific Methodology & Limitations Notice:</div>
            <p>
              The Isolation Forest calculates anomaly scores based on 16 engineered behavioral features (focus duration, dwell variance, camera interruptions, etc.).
              Anomalous observations reflect statistical atypicality and do not constitute autonomous academic misconduct verdicts.
            </p>
            <p className="text-[11px] text-cyan-400 font-mono">
              Notice: Prototype evaluation on synthetic behavioral data.
            </p>
          </div>
        </div>
      )}

      {/* 5. Aegis Evidence Graph */}
      {activeTab === "graph" && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-cyan-400" />
              Aegis Sentinel Evidence Graph
            </h3>
            <p className="text-xs text-slate-400">
              Interactive structural lineage mapping Candidate &rarr; Attempt &rarr; Events &rarr; Episodes &rarr; ML &rarr; Risk &rarr; AI &rarr; Decision.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-xs font-mono space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                <span className="text-cyan-400 font-bold block mb-1">1. ROOT CANDIDATE</span>
                <span className="text-white">{attempt?.student?.full_name}</span>
                <span className="text-slate-500 block text-[10px]">Attempt: {attemptId.slice(0, 8)}...</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                <span className="text-amber-400 font-bold block mb-1">2. TELEMETRY CLUSTERS</span>
                <span className="text-white">{data?.episodes?.length || 0} Correlated Episodes</span>
                <span className="text-slate-500 block text-[10px]">{data?.events?.length || 0} Raw Security Events</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                <span className="text-purple-400 font-bold block mb-1">3. ML & RISK ENGINE</span>
                <span className="text-white">Risk: {risk?.risk_score} / 100</span>
                <span className="text-slate-500 block text-[10px]">Confidence: {risk?.evidence_confidence}</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                <span className="text-emerald-400 font-bold block mb-1">4. HUMAN ADJUDICATION</span>
                <span className="text-white">{data?.decision?.decision || "PENDING REVIEW"}</span>
                <span className="text-slate-500 block text-[10px]">Authoritative Verdict</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300 font-sans text-xs leading-relaxed">
              <strong className="text-white font-mono block mb-1">Provenancial Narrative:</strong>
              The candidate began the examination session at {formatDate(attempt?.started_at)}. Telemetry was clean until Question 2,
              where a cluster of {data?.events?.length} multi-modal signals occurred in rapid temporal succession. The Suspicious Episode Engine
              synthesized this into a single episode, which increased the deterministic risk to {risk?.risk_score}/100 while maintaining a
              Moderate evidence confidence. Gemini synthesized the timeline for human examiner evaluation.
            </div>
          </div>
        </div>
      )}

      {/* 6. Gemini AI Investigation */}
      {activeTab === "ai" && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-purple-400 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                GOOGLE GEMINI STRUCTURED INVESTIGATION
              </div>
              <h3 className="text-xl font-bold text-white">Objective AI Telemetry Synthesis</h3>
              <p className="text-xs text-slate-400 mt-1">
                Structured timeline interpretation and alternative hypothesis generation.
              </p>
            </div>

            <button
              disabled={rerunningAI}
              onClick={handleRerunGemini}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rerunningAI ? "animate-spin" : ""}`} />
              {rerunningAI ? "Synthesizing..." : "Re-Run Gemini Assistant"}
            </button>
          </div>

          {data?.aiInvestigation ? (
            <div className="space-y-6 text-xs leading-relaxed">
              {/* Summary */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <h4 className="font-mono font-bold text-slate-300 mb-2 uppercase text-[11px]">Executive Summary</h4>
                <p className="text-slate-200 text-sm">{data.aiInvestigation.summary}</p>
              </div>

              {/* Key Findings */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <h4 className="font-mono font-bold text-slate-300 mb-2 uppercase text-[11px]">Key Findings</h4>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                  {data.aiInvestigation.key_findings.map((kf, i) => (
                    <li key={i}>{kf}</li>
                  ))}
                </ul>
              </div>

              {/* Alternative Explanations */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <h4 className="font-mono font-bold text-cyan-400 mb-2 uppercase text-[11px]">
                  Plausible Alternative Explanations
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                  {data.aiInvestigation.alternative_explanations.map((ae, i) => (
                    <li key={i}>{ae}</li>
                  ))}
                </ul>
              </div>

              {/* Timeline & Confidence Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-mono font-bold text-slate-300 mb-2 uppercase text-[11px]">Timeline Interpretation</h4>
                  <p className="text-slate-300">{data.aiInvestigation.timeline_interpretation}</p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-mono font-bold text-slate-300 mb-2 uppercase text-[11px]">Confidence & Limitation Notes</h4>
                  <p className="text-slate-300">{data.aiInvestigation.confidence_notes}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl font-mono text-purple-300">
                <span>AI Recommended Action: <strong className="text-white">{data.aiInvestigation.recommended_action}</strong></span>
                <span className="text-[10px] text-purple-400">Model: {data.aiInvestigation.model_name}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">Generating AI investigation...</div>
          )}
        </div>
      )}

      {/* Human Examiner Review Decision Workspace (The Final Decision) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            HUMAN-IN-THE-LOOP ADJUDICATION
          </div>
          <h3 className="text-xl font-bold text-white">Examiner Review Decision</h3>
          <p className="text-xs text-slate-400 mt-1">
            AI and ML telemetry are non-authoritative advisory signals. Only the authorized human examiner renders the final academic integrity verdict.
          </p>
        </div>

        <form onSubmit={handleSaveDecision} className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">Select Determination:</label>
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
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    decisionType === opt.val
                      ? "bg-cyan-500/10 border-cyan-400 text-white shadow-md shadow-cyan-500/10"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="font-bold text-xs block text-white">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">
              Mandatory Examiner Written Rationale:
            </label>
            <textarea
              rows={4}
              required
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Detail the factual basis for your determination, including any verification of candidate scratch paper or technical review..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {decisionSuccess ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="h-4 w-4" /> Review Decision Persisted & Audit Logged
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Decision is immutably logged with examiner timestamp and signature.
              </span>
            )}

            <button
              type="submit"
              disabled={submittingDecision}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {submittingDecision ? "Saving..." : "Save Examiner Determination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
