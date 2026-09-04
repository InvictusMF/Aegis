import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AttemptRepository } from "@/services/repositories/attempt-repository";
import { AuditRepository } from "@/services/repositories/audit-repository";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attemptId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized: Sign in required." }, { status: 401 });
  }

  const attempt = await AttemptRepository.getAttemptById(attemptId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Authorization check: student can only submit their own attempt
  if (user.role === "STUDENT" && attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized: Attempt mismatch." }, { status: 403 });
  }

  if (attempt.status === "SUBMITTED") {
    return NextResponse.json({ success: true, attempt, alreadySubmitted: true });
  }

  try {
    const submittedAttempt = await AttemptRepository.submitAttempt(attemptId, attempt.student_id);

    await AuditRepository.logAction({
      actorId: user.id,
      action: "ATTEMPT_SUBMITTED",
      entityType: "ATTEMPT",
      entityId: attemptId,
      metadata: {
        score: submittedAttempt.score,
        risk_score: submittedAttempt.risk_score,
        evidence_confidence: submittedAttempt.evidence_confidence,
      },
    });

    db.broadcast("ATTEMPT_SUBMITTED", {
      attempt_id: attemptId,
      score: submittedAttempt.score,
      risk_score: submittedAttempt.risk_score,
      review_status: submittedAttempt.review_status,
    });

    return NextResponse.json({
      success: true,
      attempt: submittedAttempt,
      score: submittedAttempt.score,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit attempt" }, { status: 400 });
  }
}
