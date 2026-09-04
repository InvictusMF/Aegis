import { db } from "@/lib/db";
import { SecurityEvent, SecurityEventType } from "@/types";
import { computeEventHash } from "@/lib/security/evidence-chain";
import { extractBehaviorFeatures } from "@/services/feature-service";
import { correlateSuspiciousEpisodes } from "@/services/episode-service";
import { requestMLPrediction } from "@/lib/ml/client";
import { calculateRiskAssessment } from "@/services/risk-service";

interface IngestEventParams {
  attempt_id: string;
  event_type: SecurityEventType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: "BROWSER" | "COMPUTER_VISION" | "BEHAVIORAL_METRIC" | "ATTACK_LAB";
  timestamp?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
  confidence?: number;
}

export async function ingestSecurityEvent(params: IngestEventParams): Promise<{
  event: SecurityEvent;
  risk_score: number;
  evidence_confidence: string;
  episodes_count: number;
}> {
  const attempt = db.attempts.get(params.attempt_id);
  if (!attempt) {
    throw new Error(`Attempt ${params.attempt_id} not found`);
  }

  // Server-authoritative timer check: Reject event if attempt has expired
  const exam = db.exams.get(attempt.exam_id);
  if (exam && attempt.started_at) {
    const elapsedMinutes = (Date.now() - new Date(attempt.started_at).getTime()) / (60 * 1000);
    if (elapsedMinutes > exam.duration_minutes + 1) { // 1-minute grace margin for latency
      attempt.status = "EXPIRED";
      throw new Error("Attempt duration has expired; cannot record further telemetry.");
    }
  }

  const timestamp = params.timestamp || new Date().toISOString();

  // 1. Calculate tamper-evident cryptographic hash
  const lastEvent = db.security_events
    .filter((e) => e.attempt_id === params.attempt_id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const prevHash = lastEvent?.curr_hash || "0000000000000000000000000000000000000000000000000000000000000000";

  const partialEvent = {
    attempt_id: params.attempt_id,
    event_type: params.event_type,
    severity: params.severity,
    source: params.source,
    timestamp,
    duration_ms: params.duration_ms || 0,
    metadata: params.metadata || {},
    confidence: params.confidence ?? 1.0,
  };

  const currHash = computeEventHash(prevHash, partialEvent);

  const event: SecurityEvent = {
    id: `se-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...partialEvent,
    prev_hash: prevHash,
    curr_hash: currHash,
    created_at: new Date().toISOString(),
  };

  // 2. Persist event
  db.security_events.push(event);
  attempt.last_activity_at = timestamp;

  // 3. Behavioral Feature Vector Extraction
  const features = extractBehaviorFeatures(params.attempt_id);

  // 4. Temporal Suspicious Episode Correlation
  const episodes = correlateSuspiciousEpisodes(params.attempt_id);

  // 5. ML Anomaly Inference
  let mlNormalized = 0.5;
  try {
    const mlPrediction = await requestMLPrediction({
      attemptId: params.attempt_id,
      featureVersion: features.feature_version,
      features: features.feature_vector,
    });
    mlNormalized = mlPrediction.normalized_score;
  } catch (e) {
    // ML fallback handled inside client
  }

  // 6. Explainable Risk Assessment & Evidence Confidence
  const riskAssessment = calculateRiskAssessment(params.attempt_id, mlNormalized);

  // 7. Realtime Broadcast to connected Examiner Dashboards
  db.broadcast("SECURITY_EVENT_INGESTED", {
    attempt_id: params.attempt_id,
    event,
    risk_score: riskAssessment.risk_score,
    risk_band: riskAssessment.risk_band,
    evidence_confidence: riskAssessment.evidence_confidence,
    episodes,
  });

  return {
    event,
    risk_score: riskAssessment.risk_score,
    evidence_confidence: riskAssessment.evidence_confidence,
    episodes_count: episodes.length,
  };
}
