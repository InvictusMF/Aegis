import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { ReviewDecision } from "@/types";
import crypto from "crypto";

export class DecisionRepository {
  /**
   * Persist a human examiner review decision into PostgreSQL, update attempt status, and log to audit.
   */
  static async recordDecision(params: {
    attemptId: string;
    examinerId: string;
    decision: ReviewDecision["decision"];
    rationale: string;
  }): Promise<ReviewDecision> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();
    const decisionId = crypto.randomUUID();

    const newDecision: ReviewDecision = {
      id: decisionId,
      attempt_id: params.attemptId,
      examiner_id: params.examinerId,
      decision: params.decision,
      rationale: params.rationale,
      reviewed_at: now,
      created_at: now,
    };

    if (supabase) {
      // 1. Insert review decision
      const { error: decError } = await supabase.from("review_decisions").insert(newDecision);
      if (decError) {
        console.error("Error inserting review decision to Supabase:", decError);
        throw new Error(`Failed to save review decision: ${decError.message}`);
      }

      // 2. Update attempt review_status
      await supabase
        .from("attempts")
        .update({
          review_status: "RESOLVED",
          updated_at: now,
        })
        .eq("id", params.attemptId);

      // 3. Write immutable audit log
      await supabase.from("audit_logs").insert({
        id: crypto.randomUUID(),
        actor_id: params.examinerId,
        action: `EXAMINER_DECISION_${params.decision}`,
        entity_type: "ATTEMPT",
        entity_id: params.attemptId,
        metadata: {
          decision: params.decision,
          rationale: params.rationale,
        },
        created_at: now,
      });

      return newDecision;
    }

    // Fallback: Local authoritative store
    db.review_decisions.set(params.attemptId, newDecision);

    const attempt = db.attempts.get(params.attemptId);
    if (attempt) {
      attempt.review_status = "RESOLVED";
      attempt.updated_at = now;
    }

    db.audit_logs.push({
      id: crypto.randomUUID(),
      actor_id: params.examinerId,
      action: `EXAMINER_DECISION_${params.decision}`,
      entity_type: "ATTEMPT",
      entity_id: params.attemptId,
      metadata: {
        decision: params.decision,
        rationale: params.rationale,
      },
      created_at: now,
    });

    return newDecision;
  }

  static async getDecisionForAttempt(attemptId: string): Promise<ReviewDecision | null> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("review_decisions")
        .select("*, examiner:profiles(*)")
        .eq("attempt_id", attemptId)
        .order("reviewed_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data as ReviewDecision;
    }

    return db.review_decisions.get(attemptId) || null;
  }
}
