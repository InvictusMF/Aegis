import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { RiskAssessment } from "@/types";

export class RiskRepository {
  /**
   * Persist a computed risk assessment into PostgreSQL and update attempt risk fields.
   */
  static async saveRiskAssessment(assessment: RiskAssessment): Promise<RiskAssessment> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    if (supabase) {
      // 1. Upsert risk assessment in public.risk_assessments
      const { error: riskErr } = await supabase.from("risk_assessments").upsert({
        id: assessment.id,
        attempt_id: assessment.attempt_id,
        risk_score: assessment.risk_score,
        evidence_confidence: assessment.evidence_confidence,
        risk_band: assessment.risk_band,
        factors: assessment.factors,
        model_version: assessment.model_version,
        engine_version: assessment.engine_version,
        calculated_at: assessment.calculated_at || now,
      });

      if (riskErr) {
        console.error("Error saving risk assessment to Supabase:", riskErr);
      }

      // 2. Authoritatively update attempts table
      const updatePayload: Record<string, any> = {
        risk_score: assessment.risk_score,
        evidence_confidence: assessment.evidence_confidence,
        updated_at: now,
      };

      if (assessment.risk_score >= 60) {
        updatePayload.review_status = "REVIEW_RECOMMENDED";
      }

      await supabase.from("attempts").update(updatePayload).eq("id", assessment.attempt_id);

      db.broadcast("RISK_ASSESSMENT_UPDATED", {
        attempt_id: assessment.attempt_id,
        risk_score: assessment.risk_score,
        risk_band: assessment.risk_band,
        evidence_confidence: assessment.evidence_confidence,
        factors: assessment.factors,
      });

      return assessment;
    }

    // Fallback: Local authoritative store
    db.risk_assessments.set(assessment.attempt_id, assessment);

    const attempt = db.attempts.get(assessment.attempt_id);
    if (attempt) {
      attempt.risk_score = assessment.risk_score;
      attempt.evidence_confidence = assessment.evidence_confidence;
      if (assessment.risk_score >= 60 && attempt.review_status === "NORMAL") {
        attempt.review_status = "REVIEW_RECOMMENDED";
      }
    }

    db.broadcast("RISK_ASSESSMENT_UPDATED", {
      attempt_id: assessment.attempt_id,
      risk_score: assessment.risk_score,
      risk_band: assessment.risk_band,
      evidence_confidence: assessment.evidence_confidence,
      factors: assessment.factors,
    });

    return assessment;
  }

  static async getRiskAssessment(attemptId: string): Promise<RiskAssessment | null> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("risk_assessments")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data as RiskAssessment;
    }

    return db.risk_assessments.get(attemptId) || null;
  }
}
