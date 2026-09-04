import { SecurityEvent, SecurityEventType } from "@/types";
import { EventRepository } from "@/services/repositories/event-repository";
import { AttemptRepository } from "@/services/repositories/attempt-repository";
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
  // 1. Authoritative verification of attempt & timer
  const attempt = await AttemptRepository.getAttemptById(params.attempt_id);
  if (!attempt) {
    throw new Error(`Attempt ${params.attempt_id} not found`);
  }

  if (attempt.status === "SUBMITTED" || attempt.status === "EXPIRED") {
    throw new Error(`Cannot record event for attempt in ${attempt.status} status.`);
  }

  if (attempt.exam && attempt.started_at) {
    const elapsedMinutes = (Date.now() - new Date(attempt.started_at).getTime()) / (60 * 1000);
    if (elapsedMinutes > attempt.exam.duration_minutes + 1) { // 1 min grace margin
      throw new Error("Attempt duration has expired; cannot record further telemetry.");
    }
  }

  // 2. Persist event into PostgreSQL with cryptographic tamper-evident hash chaining
  const event = await EventRepository.recordEvent({
    attemptId: params.attempt_id,
    eventType: params.event_type,
    severity: params.severity,
    source: params.source,
    timestamp: params.timestamp,
    durationMs: params.duration_ms,
    metadata: params.metadata,
    confidence: params.confidence,
  });

  // 3. Behavioral Feature Vector Extraction with verified chain integrity
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
    // Graceful degraded mode if ML microservice is unavailable
  }

  // 6. Explainable Aegis Risk Assessment & Evidence Confidence
  const riskAssessment = calculateRiskAssessment(params.attempt_id, mlNormalized);

  return {
    event,
    risk_score: riskAssessment.risk_score,
    evidence_confidence: riskAssessment.evidence_confidence,
    episodes_count: episodes.length,
  };
}
