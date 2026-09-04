"use client";

import { getRiskColor, getConfidenceBadge } from "@/lib/utils";
import { ShieldAlert, Info, HelpCircle } from "lucide-react";
import { useState } from "react";

interface RiskScoreCardProps {
  riskScore: number;
  evidenceConfidence: string;
  anomalyScore?: number;
  factorsCount?: number;
  className?: string;
  showExplanation?: boolean;
}

export function RiskScoreCard({
  riskScore,
  evidenceConfidence,
  anomalyScore,
  factorsCount,
  className = "",
  showExplanation = true,
}: RiskScoreCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const riskBand =
    riskScore >= 80 ? "CRITICAL" : riskScore >= 60 ? "HIGH" : riskScore >= 30 ? "MODERATE" : "LOW";
  const riskColor = getRiskColor(riskBand);
  const confidence = getConfidenceBadge(evidenceConfidence);

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Integrity Risk Assessment
            </h3>
            <span className="text-[11px] text-slate-500">Explainable multi-signal synthesis</span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            title="Understanding Risk & Confidence"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-7 z-30 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none">
              <p className="font-semibold text-slate-200">Risk Score vs Evidence Confidence</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Risk Score:</strong> Severity and frequency of anomalous behavioral indicators.
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Evidence Confidence:</strong> Statistical depth and multi-sensor correlation backing the signal.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Risk Score */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide block">
            Synthesized Risk
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {riskScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${riskColor.dot}`} />
            {riskBand}
          </span>
        </div>

        {/* Evidence Confidence */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide block">
            Evidence Confidence
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-800 tracking-tight pt-1">
              {evidenceConfidence || "MODERATE"}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${confidence.bg} ${confidence.text} ${confidence.border}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${confidence.dot}`} />
            {confidence.label}
          </span>
        </div>
      </div>

      {showExplanation && (
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-amber-950">
              Core Principle: Risk is not proof.
            </strong>
            <span>
              A high risk index denotes statistical anomaly correlation, not automatic culpability. Examiner review and human adjudication are strictly required.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
