import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Attempt } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = await getCurrentUser();

  const examId = searchParams.get("exam_id");
  const studentId = searchParams.get("student_id");
  const status = searchParams.get("status");
  const reviewStatus = searchParams.get("review_status");

  let attemptsList = Array.from(db.attempts.values()).map((att) => ({
    ...att,
    student: db.profiles.get(att.student_id),
    exam: db.exams.get(att.exam_id),
  }));

  // Role filtering
  if (user?.role === "STUDENT") {
    attemptsList = attemptsList.filter((a) => a.student_id === user.id);
  }

  if (examId) attemptsList = attemptsList.filter((a) => a.exam_id === examId);
  if (studentId) attemptsList = attemptsList.filter((a) => a.student_id === studentId);
  if (status) attemptsList = attemptsList.filter((a) => a.status === status);
  if (reviewStatus) attemptsList = attemptsList.filter((a) => a.review_status === reviewStatus);

  return NextResponse.json({ attempts: attemptsList });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { exam_id } = body;

    const exam = db.exams.get(exam_id);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check if an attempt is already in progress for this student
    for (const existing of db.attempts.values()) {
      if (existing.exam_id === exam_id && existing.student_id === user.id && existing.status === "IN_PROGRESS") {
        return NextResponse.json({ attempt: existing, resumed: true });
      }
    }

    // Create fresh attempt
    const attemptId = `at-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newAttempt: Attempt = {
      id: attemptId,
      exam_id,
      student_id: user.id,
      started_at: new Date().toISOString(),
      status: "IN_PROGRESS",
      score: null,
      risk_score: 0,
      evidence_confidence: "LOW",
      review_status: "NORMAL",
      student: user,
      exam,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.attempts.set(attemptId, newAttempt);

    // Update assignment status
    const assignmentKey = `ea-${exam_id}-${user.id}`;
    if (db.exam_assignments.has(assignmentKey)) {
      db.exam_assignments.get(assignmentKey)!.status = "IN_PROGRESS";
    }

    db.audit_logs.push({
      id: `al-${Date.now()}`,
      actor_id: user.id,
      action: "ATTEMPT_STARTED",
      entity_type: "attempt",
      entity_id: attemptId,
      metadata: { exam_title: exam.title },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ attempt: newAttempt, resumed: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start attempt" }, { status: 500 });
  }
}
