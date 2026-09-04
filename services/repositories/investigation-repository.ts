import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { AIInvestigation } from "@/types";

export class InvestigationRepository {
  static async saveInvestigation(investigation: AIInvestigation): Promise<AIInvestigation> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    if (supabase) {
      const { error } = await supabase.from("ai_investigations").upsert({
        id: investigation.id,
        attempt_id: investigation.attempt_id,
        investigation_status: investigation.investigation_status,
        input_snapshot: investigation.input_snapshot,
        summary: investigation.summary,
        key_findings: investigation.key_findings,
        correlated_evidence: investigation.correlated_evidence,
        timeline_interpretation: investigation.timeline_interpretation,
        alternative_explanations: investigation.alternative_explanations,
        risk_factors: investigation.risk_factors,
        recommended_action: investigation.recommended_action,
        confidence_notes: investigation.confidence_notes,
        model_name: investigation.model_name,
        created_at: investigation.created_at || now,
        updated_at: now,
      });

      if (error) {
        console.error("Error saving AI investigation to Supabase:", error);
      }

      return investigation;
    }

    db.ai_investigations.set(investigation.attempt_id, investigation);
    return investigation;
  }

  static async getInvestigation(attemptId: string): Promise<AIInvestigation | null> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("ai_investigations")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data as AIInvestigation;
    }

    return db.ai_investigations.get(attemptId) || null;
  }
}
