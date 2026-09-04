import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attemptId } = await params;
  const user = await getCurrentUser();
  const attempt = db.attempts.get(attemptId);

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (user?.role === "STUDENT" && attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (attempt.status === "SUBMITTED") {
    return NextResponse.json({ error: "Attempt already submitted", attempt });
  }

  // Calculate score based on actual correct answers
  const exam = db.exams.get(attempt.exam_id);
  const answers = Array.from(db.attempt_answers.values()).filter((a) => a.attempt_id === attemptId);

  let earnedPoints = 0;
  let totalPoints = 0;

  for (const q of db.questions.values()) {
    // Check if question belongs to exam
    const belongs =
      exam?.questions?.some((eq) => eq.id === q.id) ||
      db.exam_questions.some((eq) => eq.exam_id === attempt.exam_id && eq.question_id === q.id);

    if (belongs) {
      totalPoints += q.points;
      const ans = answers.find((a) => a.question_id === q.id);
      if (ans && q.correct_answer && ans.answer_value.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
        earnedPoints += q.points;
      }
    }
  }

  const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  attempt.status = "SUBMITTED";
  attempt.submitted_at = new Date().toISOString();
  attempt.score = finalScore;
  attempt.last_activity_at = new Date().toISOString();

  // Review status prioritization
  if (attempt.risk_score >= 60 && attempt.review_status === "NORMAL") {
    attempt.review_status = "REVIEW_RECOMMENDED";
  }

  // Update assignment status
  const assignmentKey = `ea-${attempt.exam_id}-${attempt.student_id}`;
  if (db.exam_assignments.has(assignmentKey)) {
    db.exam_assignments.get(assignmentKey)!.status = "COMPLETED";
  }

  db.audit_logs.push({
    id: `al-${Date.now()}`,
    actor_id: user?.id,
    action: "ATTEMPT_SUBMITTED",
    entity_type: "attempt",
    entity_id: attemptId,
    metadata: { score: finalScore, risk_score: attempt.risk_score },
    created_at: new Date().toISOString(),
  });

  db.broadcast("ATTEMPT_SUBMITTED", {
    attempt_id: attemptId,
    score: finalScore,
    risk_score: attempt.risk_score,
    review_status: attempt.review_status,
  });

  return NextResponse.json({
    success: true,
    attempt,
    score: finalScore,
    earnedPoints,
    totalPoints,
  });
}
