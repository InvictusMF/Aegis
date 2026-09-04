import { db } from "@/lib/db";
import { RiskAssessment, RiskBand, EvidenceConfidenceLevel } from "@/types";

export function calculateRiskAssessment(
  attemptId: string,
  mlAnomalyNormalized?: number
): RiskAssessment {
  const events = db.security_events.filter((e) => e.attempt_id === attemptId);
  const episodes = Array.from(db.suspicious_episodes.values()).filter((ep) => ep.attempt_id === attemptId);
  const attempt = db.attempts.get(attemptId);
  const answers = Array.from(db.attempt_answers.values()).filter((a) => a.attempt_id === attemptId);

  const factors: Array<{
    factor: string;
    weight: number;
    description: string;
    mitigating_context?: string;
  }> = [];

  let rawRisk = 0;

  // 1. Evaluate Suspicious Episodes (highest priority explainable signal)
  for (const ep of episodes) {
    let epWeight = ep.risk_contribution || 15;
    if (ep.status === "DISMISSED") {
      continue; // Dismissed by examiner
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
          mitigating_context: "Question has HIGH difficulty rating; intellectual hesitation is common.",
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
      description: `${tabSwitches} browser tab switch event(s) recorded without immediate answer modification.`,
    });
  }

  const faceMissingEvents = events.filter((e) => e.event_type === "FACE_MISSING").length;
  if (faceMissingEvents > 2) {
    const w = Math.min(20, faceMissingEvents * 5);
    rawRisk += w;
    factors.push({
      factor: "Repeated Facial Absence Signals",
      weight: w,
      description: `${faceMissingEvents} camera frames without localized facial landmarks.`,
      mitigating_context: "Could be camera angle shift or head posture.",
    });
  }

  const multipleFaces = events.filter((e) => e.event_type === "MULTIPLE_FACES").length;
  if (multipleFaces > 0) {
    const w = Math.min(30, multipleFaces * 15);
    rawRisk += w;
    factors.push({
      factor: "Multiple Faces Detected in View",
      weight: w,
      description: `${multipleFaces} incident(s) with secondary person detected by MediaPipe.`,
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
      description: `Attempt telemetry deviates into the ${Math.round(mlScore * 100)}th percentile of anomaly distribution.`,
    });
  }

  // 4. Temporal Risk Decay
  // If no new events in the last 15 minutes, apply slight decay to prevent early single blip dominance
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

  // Normalize final risk score to [0, 100]
  const finalScore = Math.min(100, Math.max(0, Math.round(rawRisk)));

  // Determine Risk Band
  let riskBand: RiskBand = "LOW";
  if (finalScore >= 80) riskBand = "CRITICAL";
  else if (finalScore >= 60) riskBand = "HIGH";
  else if (finalScore >= 30) riskBand = "MODERATE";

  // Determine Evidence Confidence
  // Evidence confidence increases with corroborating independent sources
  const distinctSources = new Set(events.map((e) => e.source)).size;
  let evidenceConfidence: EvidenceConfidenceLevel = "LOW";

  if (distinctSources >= 3 && episodes.length >= 1) {
    evidenceConfidence = "HIGH";
  } else if (distinctSources >= 2 || episodes.length >= 1) {
    evidenceConfidence = "MODERATE";
  }

  const assessment: RiskAssessment = {
    id: `ra-${attemptId}-${Date.now()}`,
    attempt_id: attemptId,
    risk_score: finalScore,
    evidence_confidence: evidenceConfidence,
    risk_band: riskBand,
    factors,
    model_version: "aegis-isoforest-v1.0",
    engine_version: "aegis-risk-engine-v1.2",
    calculated_at: new Date().toISOString(),
  };

  db.risk_assessments.set(attemptId, assessment);

  // Update Attempt record in memory
  if (attempt) {
    attempt.risk_score = finalScore;
    attempt.evidence_confidence = evidenceConfidence;
    if (finalScore >= 60 && attempt.review_status === "NORMAL") {
      attempt.review_status = "REVIEW_RECOMMENDED";
    }
  }

  return assessment;
}
