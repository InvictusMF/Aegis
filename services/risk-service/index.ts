import { db } from "@/lib/db";
import { RiskAssessment, RiskBand, EvidenceConfidenceLevel, SecurityEvent } from "@/types";
import { RiskRepository } from "@/services/repositories/risk-repository";
import crypto from "crypto";

export function calculateRiskAssessment(
  attemptId: string,
  mlAnomalyNormalized?: number,
  eventsOverride?: SecurityEvent[]
): RiskAssessment {
  const events = eventsOverride || db.security_events.filter((e) => e.attempt_id === attemptId);
  const episodes = Array.from(db.suspicious_episodes.values()).filter((ep) => ep.attempt_id === attemptId);

  const factors: Array<{
    factor: string;
    weight: number;
    description: string;
    mitigating_context?: string;
  }> = [];

  let rawRisk = 0;

  // 1. Evaluate Suspicious Episodes
  for (const ep of episodes) {
    let epWeight = ep.risk_contribution || 15;
    if (ep.status === "DISMISSED") {
      continue;
    }

    // Contextual check: question difficulty mitigation
    if (ep.question_id && db.questions.has(ep.question_id)) {
      const q = db.questions.get(ep.question_id)!;
      if (q.difficulty === "HARD") {
        epWeight = Math.max(5, epWeight - 8);
        factors.push({
          factor: `Episode: ${ep.episode_type}`,
          weight: epWeight,
          description: ep.summary,
          mitigating_context: "Question has HIGH difficulty rating; intellectual dwell/hesitation is expected.",
        });
      } else {
        factors.push({
          factor: `Episode: ${ep.episode_type}`,
          weight: epWeight,
          description: ep.summary,
        });
      }
    } else {
      factors.push({
        factor: `Episode: ${ep.episode_type}`,
        weight: epWeight,
        description: ep.summary,
      });
    }

    rawRisk += epWeight;
  }

  // 2. Evaluate Individual Unclustered Security Events
  const tabSwitches = events.filter((e) => e.event_type === "TAB_SWITCH").length;
  if (tabSwitches > 0 && episodes.length === 0) {
    const w = Math.min(25, tabSwitches * 8);
    rawRisk += w;
    factors.push({
      factor: "Uncorrelated Tab Switches",
      weight: w,
      description: `${tabSwitches} browser tab departure event(s) recorded without immediate answer modification.`,
    });
  }

  const faceMissingEvents = events.filter((e) => e.event_type === "FACE_MISSING").length;
  if (faceMissingEvents > 2) {
    const w = Math.min(20, faceMissingEvents * 5);
    rawRisk += w;
    factors.push({
      factor: "Repeated Facial Absence Signals",
      weight: w,
      description: `${faceMissingEvents} camera telemetry instances without localized facial landmarks.`,
      mitigating_context: "May represent legitimate head tilt or desk note inspection.",
    });
  }

  const multipleFaces = events.filter((e) => e.event_type === "MULTIPLE_FACES").length;
  if (multipleFaces > 0) {
    const w = Math.min(30, multipleFaces * 15);
    rawRisk += w;
    factors.push({
      factor: "Multiple Faces Detected in View",
      weight: w,
      description: `${multipleFaces} incident(s) with secondary face presence detected by computer vision.`,
    });
  }

  // 3. Incorporate ML Behavioral Anomaly Score if available
  const mlPred = db.ml_predictions.get(attemptId);
  const mlScore = mlAnomalyNormalized ?? mlPred?.normalized_score;
  if (typeof mlScore === "number" && mlScore > 0.5) {
    const mlWeight = Math.round((mlScore - 0.5) * 40); // Max +20 risk
    rawRisk += mlWeight;
    factors.push({
      factor: "ML Isolation Forest Behavioral Outlier",
      weight: mlWeight,
      description: `Attempt telemetry deviates into the ${Math.round(mlScore * 100)}th percentile of synthetic anomaly distribution.`,
    });
  }

  // 4. Temporal Risk Decay
  if (events.length > 0) {
    const lastEventTime = new Date(events[events.length - 1].timestamp).getTime();
    const minutesSinceLast = (Date.now() - lastEventTime) / (60 * 1000);
    if (minutesSinceLast > 15 && rawRisk > 10) {
      const decay = Math.min(15, Math.floor(minutesSinceLast / 5) * 3);
      rawRisk = Math.max(5, rawRisk - decay);
      factors.push({
        factor: "Temporal Risk Decay",
        weight: -decay,
        description: `Risk reduced by ${decay} points due to sustained continuous integrity without recent alerts (${Math.round(minutesSinceLast)}m elapsed).`,
      });
    }
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawRisk)));

  let riskBand: RiskBand = "LOW";
  if (finalScore >= 80) riskBand = "CRITICAL";
  else if (finalScore >= 60) riskBand = "HIGH";
  else if (finalScore >= 30) riskBand = "MODERATE";

  const distinctSources = new Set(events.map((e) => e.source)).size;
  let evidenceConfidence: EvidenceConfidenceLevel = "LOW";

  if (distinctSources >= 3 && episodes.length >= 1) {
    evidenceConfidence = "HIGH";
  } else if (distinctSources >= 2 || episodes.length >= 1) {
    evidenceConfidence = "MODERATE";
  }

  const assessmentId = crypto.randomUUID();
  const now = new Date().toISOString();

  const assessment: RiskAssessment = {
    id: assessmentId,
    attempt_id: attemptId,
    risk_score: finalScore,
    evidence_confidence: evidenceConfidence,
    risk_band: riskBand,
    factors,
    model_version: "aegis-isoforest-v1.0",
    engine_version: "aegis-risk-engine-v1.2",
    calculated_at: now,
  };

  // Persist asynchronously via repository
  RiskRepository.saveRiskAssessment(assessment).catch((err) => {
    console.error("Async error saving risk assessment:", err);
  });

  return assessment;
}
