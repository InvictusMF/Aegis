import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AttemptRepository } from "@/services/repositories/attempt-repository";
import { AnswerRepository } from "@/services/repositories/answer-repository";
import { ingestSecurityEvent } from "@/services/event-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const answers = await AnswerRepository.getAnswersForAttempt(id);
  return NextResponse.json({ answers });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attemptId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempt = await AttemptRepository.getAttemptById(attemptId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Authorization check: student can only save own answers
  if (user.role === "STUDENT" && attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized: Attempt mismatch." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { question_id, answer_value, time_spent_delta = 0 } = body;

    if (!question_id) {
      return NextResponse.json({ error: "question_id is required" }, { status: 400 });
    }

    // Check previous answer to detect mutations
    const existingAnswers = await AnswerRepository.getAnswersForAttempt(attemptId);
    const existing = existingAnswers.find((a) => a.question_id === question_id);
    const isChanged = existing && existing.answer_value !== answer_value;

    const savedAnswer = await AnswerRepository.saveAnswer({
      attemptId,
      studentId: attempt.student_id,
      questionId: question_id,
      answerValue: answer_value,
      timeSpentSeconds: time_spent_delta,
    });

    // Ingest telemetry event on answer modification
    if (isChanged) {
      ingestSecurityEvent({
        attempt_id: attemptId,
        event_type: "ANSWER_CHANGED",
        severity: "HIGH",
        source: "BEHAVIORAL_METRIC",
        metadata: {
          question_id,
          old_value: existing.answer_value,
          new_value: answer_value,
          change_count: savedAnswer.change_count,
        },
        confidence: 1.0,
      }).catch((e) => console.error("Error ingesting answer changed event:", e));
    }

    return NextResponse.json({ success: true, answer: savedAnswer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to persist answer" }, { status: 400 });
  }
}
