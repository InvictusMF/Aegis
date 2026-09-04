import { MLPrediction } from "@/types";
import { db } from "@/lib/db";

interface PredictParams {
  attemptId: string;
  featureVersion: string;
  features: Record<string, number>;
}

export async function requestMLPrediction(params: PredictParams): Promise<MLPrediction> {
  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
  const mlServiceSecret = process.env.ML_SERVICE_SECRET || "aegis-ml-internal-secret-2026";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout

    const res = await fetch(`${mlServiceUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mlServiceSecret}`,
      },
      body: JSON.stringify({
        attempt_id: params.attemptId,
        feature_version: params.featureVersion,
        features: params.features,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const prediction: MLPrediction = {
        id: `mlp-${params.attemptId}-${Date.now()}`,
        attempt_id: params.attemptId,
        model_name: data.model_name || "IsolationForest-BehavioralAnomaly",
        model_version: data.model_version || "v1.0.0",
        feature_version: data.feature_version || "v1.0",
        anomaly_score: data.anomaly_score,
        normalized_score: data.normalized_score,
        prediction_metadata: data.prediction_metadata,
        created_at: new Date().toISOString(),
      };
      db.ml_predictions.set(params.attemptId, prediction);
      return prediction;
    }
  } catch (err) {
    // Microservice is offline or unreachable - fallback to deterministic behavioral anomaly scoring
  }

  // Fallback: Deterministic Behavioral Calculation (Zero crash, 100% operational integrity)
  const f = params.features;
  const rawScore =
    (f.focus_loss_frequency || 0) * 0.15 +
    ((f.focus_loss_duration_total || 0) > 10 ? 0.25 : 0) +
    (f.tab_switch_frequency || 0) * 0.2 +
    (f.face_missing_frequency || 0) * 0.15 +
    (f.multiple_faces_count || 0) * 0.35 +
    (f.answer_change_frequency > 2 ? 0.2 : 0) +
    (f.suspicious_episode_density || 0) * 0.25;

  const normalized = Math.min(1.0, Math.max(0.0, Number(rawScore.toFixed(2))));
  const pseudoDecision = Number((0.15 - normalized * 0.3).toFixed(4));

  const fallbackPrediction: MLPrediction = {
    id: `mlp-${params.attemptId}-${Date.now()}`,
    attempt_id: params.attemptId,
    model_name: "IsolationForest-RuleFallback",
    model_version: "v1.0.0-fallback",
    feature_version: params.featureVersion,
    anomaly_score: pseudoDecision,
    normalized_score: normalized,
    prediction_metadata: {
      status: "ML microservice offline; deterministic fallback evaluated",
      note: "Prototype evaluation on synthetic behavioral data.",
    },
    created_at: new Date().toISOString(),
  };

  db.ml_predictions.set(params.attemptId, fallbackPrediction);
  return fallbackPrediction;
}
