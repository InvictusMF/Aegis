import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ReviewDecision } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attemptId } = await params;
  const user = await getCurrentUser();

  if (user?.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Students cannot make review decisions" }, { status: 403 });
  }

  const attempt = db.attempts.get(attemptId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { decision, rationale } = body;

    if (!rationale || rationale.trim().length < 5) {
      return NextResponse.json(
        { error: "A substantive written rationale is mandatory for examiner review decisions." },
        { status: 400 }
      );
    }

    const reviewDecision: ReviewDecision = {
      id: `rd-${attemptId}-${Date.now()}`,
      attempt_id: attemptId,
      examiner_id: user?.id || "d0000000-0000-0000-0000-000000000001",
      decision,
      rationale: rationale.trim(),
      reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      examiner: user || undefined,
    };

    db.review_decisions.set(attemptId, reviewDecision);

    // Update attempt review status
    if (decision === "POLICY_VIOLATION" || decision === "DISMISSED" || decision === "NO_ACTION") {
      attempt.review_status = "RESOLVED";
    } else if (decision === "NEEDS_MORE_REVIEW") {
      attempt.review_status = "UNDER_REVIEW";
    }

    attempt.updated_at = new Date().toISOString();

    db.audit_logs.push({
      id: `al-${Date.now()}`,
      actor_id: user?.id,
      action: `REVIEW_DECISION_${decision}`,
      entity_type: "attempt",
      entity_id: attemptId,
      metadata: { decision, rationale },
      created_at: new Date().toISOString(),
    });

    db.broadcast("REVIEW_DECISION_SUBMITTED", {
      attempt_id: attemptId,
      decision: reviewDecision,
      review_status: attempt.review_status,
    });

    return NextResponse.json({ success: true, decision: reviewDecision, attempt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit decision" }, { status: 500 });
  }
}
