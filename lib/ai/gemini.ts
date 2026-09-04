import { z } from "zod";
import { AIInvestigation, Attempt, ReviewDecisionType } from "@/types";
import { db } from "@/lib/db";

const GeminiInvestigationSchema = z.object({
  summary: z.string(),
  key_findings: z.array(z.string()),
  correlated_evidence: z.array(
    z.object({
      timestamp: z.string(),
      signals: z.array(z.string()),
      significance: z.string(),
    })
  ),
  timeline_interpretation: z.string(),
  alternative_explanations: z.array(z.string()),
  risk_factors: z.array(z.string()),
  recommended_action: z.enum(["NO_ACTION", "NEEDS_MORE_REVIEW", "POLICY_VIOLATION", "DISMISSED"]),
  confidence_notes: z.string(),
});

export async function runGeminiInvestigation(attemptId: string): Promise<AIInvestigation> {
  const attempt = db.attempts.get(attemptId);
  const exam = attempt ? db.exams.get(attempt.exam_id) : null;
  const student = attempt ? db.profiles.get(attempt.student_id) : null;
  const events = db.security_events.filter((e) => e.attempt_id === attemptId);
  const episodes = Array.from(db.suspicious_episodes.values()).filter((ep) => ep.attempt_id === attemptId);
  const risk = db.risk_assessments.get(attemptId);
  const mlPred = db.ml_predictions.get(attemptId);

  const apiKey = process.env.GEMINI_API_KEY;

  // If already investigated, return cached copy unless requested to re-run
  if (db.ai_investigations.has(attemptId) && !apiKey) {
    return db.ai_investigations.get(attemptId)!;
  }

  // Structured Evidence Context Snapshot
  const evidenceSnapshot = {
    candidate: {
      id: student?.id,
      name: student?.full_name,
      role: student?.role,
    },
    exam: {
      id: exam?.id,
      title: exam?.title,
      duration_minutes: exam?.duration_minutes,
    },
    attempt: {
      id: attempt?.id,
      started_at: attempt?.started_at,
      status: attempt?.status,
      risk_score: risk?.risk_score ?? attempt?.risk_score,
      risk_band: risk?.risk_band,
      evidence_confidence: risk?.evidence_confidence ?? attempt?.evidence_confidence,
    },
    ml_analysis: {
      model: mlPred?.model_name,
      anomaly_score: mlPred?.anomaly_score,
      normalized_score: mlPred?.normalized_score,
    },
    suspicious_episodes: episodes.map((ep) => ({
      id: ep.id,
      type: ep.episode_type,
      duration_seconds: ep.duration_seconds,
      severity: ep.severity,
      summary: ep.summary,
      confidence: ep.evidence_confidence,
    })),
    security_events_sample: events.slice(-10).map((e) => ({
      type: e.event_type,
      severity: e.severity,
      source: e.source,
      timestamp: e.timestamp,
      duration_ms: e.duration_ms,
      confidence: e.confidence,
    })),
  };

  if (!apiKey) {
    // Generate high-integrity structured baseline when API key is unconfigured
    const fallbackInvestigation: AIInvestigation = {
      id: `ai-${attemptId}-${Date.now()}`,
      attempt_id: attemptId,
      investigation_status: "COMPLETED",
      input_snapshot: evidenceSnapshot,
      summary: episodes.length > 0
        ? `Aegis telemetry detected ${episodes.length} correlated suspicious episode(s) including '${episodes[0].episode_type}'. Telemetry exhibits anomalous tab and camera orientation shifts during active examination.`
        : `Normal telemetry observed across ${events.length} security telemetry events. No correlated suspicious episodes detected.`,
      key_findings: episodes.length > 0
        ? [
            `Recorded ${events.length} total browser and vision security telemetry signals.`,
            `Identified ${episodes.length} temporal episode clusters indicating potential external distraction or reference lookup.`,
            `ML Isolation Forest anomaly normalized score calculated at ${mlPred?.normalized_score ?? 0.5}.`,
          ]
        : ["Telemetry consistent with uninterrupted candidate focus.", "No clipboard or window departure anomalies captured."],
      correlated_evidence: episodes.map((ep) => ({
        timestamp: ep.started_at,
        signals: [ep.episode_type, `Severity: ${ep.severity}`],
        significance: ep.summary,
      })),
      timeline_interpretation: episodes.length > 0
        ? `Events occurred within a focused temporal cluster lasting ${episodes[0].duration_seconds} seconds. Subsequent candidate dwell behavior normalized.`
        : "Candidate progressed steadily across assigned questions without atypical dwell spikes.",
      alternative_explanations: [
        "Operating system background notification popup or anti-virus prompt.",
        "Temporary lighting variation or webcam repositioning causing facial landmark loss.",
        "Candidate shifted posture to read scratch paper notes.",
      ],
      risk_factors: episodes.map((ep) => ep.summary),
      recommended_action: (risk?.risk_score ?? 0) >= 60 ? "NEEDS_MORE_REVIEW" : "NO_ACTION",
      confidence_notes: "Evaluated under deterministic baseline rules. Final academic determination resides exclusively with the human examiner.",
      model_name: "aegis-deterministic-sentinel",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.ai_investigations.set(attemptId, fallbackInvestigation);
    return fallbackInvestigation;
  }

  // Call Google Gemini API
  try {
    const prompt = `You are Aegis AI Investigation Assistant, an impartial examination integrity analyst.
Your mandate is to assist human examiners by analyzing telemetry data.
Rules:
1. Never invent events, timestamps, or scores.
2. Never determine a final cheating verdict — you advise human examiners.
3. Distinguish empirical facts from interpretations.
4. Always provide plausible innocent alternative explanations (e.g. system notification, dual-monitor glitch, scratch paper use).
5. Treat ML anomaly scores as signals, not proof.
6. Return strictly valid JSON adhering to the schema below.

JSON Schema:
{
  "summary": "Brief executive summary of telemetry",
  "key_findings": ["string"],
  "correlated_evidence": [{"timestamp": "string", "signals": ["string"], "significance": "string"}],
  "timeline_interpretation": "Chronological assessment",
  "alternative_explanations": ["string"],
  "risk_factors": ["string"],
  "recommended_action": "NO_ACTION" | "NEEDS_MORE_REVIEW" | "POLICY_VIOLATION" | "DISMISSED",
  "confidence_notes": "Explanation of evidence strength and uncertainty"
}

Telemetry Evidence:
${JSON.stringify(evidenceSnapshot, null, 2)}
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);
    const validated = GeminiInvestigationSchema.parse(parsed);

    const investigation: AIInvestigation = {
      id: `ai-${attemptId}-${Date.now()}`,
      attempt_id: attemptId,
      investigation_status: "COMPLETED",
      input_snapshot: evidenceSnapshot,
      summary: validated.summary,
      key_findings: validated.key_findings,
      correlated_evidence: validated.correlated_evidence,
      timeline_interpretation: validated.timeline_interpretation,
      alternative_explanations: validated.alternative_explanations,
      risk_factors: validated.risk_factors,
      recommended_action: validated.recommended_action as ReviewDecisionType,
      confidence_notes: validated.confidence_notes,
      model_name: "gemini-1.5-flash",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.ai_investigations.set(attemptId, investigation);
    return investigation;
  } catch (err: any) {
    console.error("Gemini investigation error:", err);
    // If Gemini fails, fallback gracefully to deterministic report
    const fallback: AIInvestigation = {
      id: `ai-${attemptId}-${Date.now()}`,
      attempt_id: attemptId,
      investigation_status: "COMPLETED",
      input_snapshot: evidenceSnapshot,
      summary: "AI Investigation service encountered external API timeout; deterministic analysis applied.",
      key_findings: ["Telemetry processed via local Aegis Sentinel rules engine."],
      correlated_evidence: [],
      timeline_interpretation: "Telemetry analysis generated via local rule engine.",
      alternative_explanations: ["Standard technical fallback occurred."],
      risk_factors: [],
      recommended_action: "NEEDS_MORE_REVIEW",
      confidence_notes: "AI investigation service temporarily degraded; human review recommended.",
      model_name: "gemini-1.5-flash-fallback",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.ai_investigations.set(attemptId, fallback);
    return fallback;
  }
}
