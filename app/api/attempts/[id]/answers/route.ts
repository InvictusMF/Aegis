import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ingestSecurityEvent } from "@/services/event-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const answers = Array.from(db.attempt_answers.values()).filter((a) => a.attempt_id === id);
  return NextResponse.json({ answers });
}

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

  // Authorization check
  if (user?.role === "STUDENT" && attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Server-authoritative timer expiry validation
  const exam = db.exams.get(attempt.exam_id);
  if (exam && attempt.started_at) {
    const elapsedMinutes = (Date.now() - new Date(attempt.started_at).getTime()) / (60 * 1000);
    if (elapsedMinutes > exam.duration_minutes + 1) {
      attempt.status = "EXPIRED";
      return NextResponse.json(
        { error: "Exam time limit has expired. Submission is closed.", expired: true },
        { status: 403 }
      );
    }
  }

  try {
    const body = await request.json();
    const { question_id, answer_value, time_spent_delta = 0 } = body;

    const answerKey = `ans-${attemptId}-${question_id}`;
    let existing = db.attempt_answers.get(answerKey);

    const isChanged = existing && existing.answer_value !== answer_value;

    if (!existing) {
      existing = {
        id: answerKey,
        attempt_id: attemptId,
        question_id,
        answer_value,
        first_answered_at: new Date().toISOString(),
        last_answered_at: new Date().toISOString(),
        change_count: 0,
        time_spent_seconds: time_spent_delta,
        is_final: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.attempt_answers.set(answerKey, existing);
    } else {
      const prevVal = existing.answer_value;
      existing.answer_value = answer_value;
      existing.last_answered_at = new Date().toISOString();
      if (isChanged) {
        existing.change_count += 1;
      }
      existing.time_spent_seconds += time_spent_delta;
      existing.updated_at = new Date().toISOString();

      // Trigger telemetry signal for answer mutation
      if (isChanged) {
        await ingestSecurityEvent({
          attempt_id: attemptId,
          event_type: "ANSWER_CHANGED",
          severity: "HIGH",
          source: "BEHAVIORAL_METRIC",
          metadata: {
            question_id,
            old_value: prevVal,
            new_value: answer_value,
            change_count: existing.change_count,
          },
          confidence: 1.0,
        });
      }
    }

    attempt.last_activity_at = new Date().toISOString();

    return NextResponse.json({ success: true, answer: existing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save answer" }, { status: 500 });
  }
}
