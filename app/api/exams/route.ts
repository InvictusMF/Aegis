import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Exam, Question } from "@/types";

export async function GET() {
  const user = await getCurrentUser();
  const allExams = Array.from(db.exams.values());

  if (user?.role === "STUDENT") {
    const studentExams = allExams.filter((e) => e.status === "PUBLISHED");
    return NextResponse.json({ exams: studentExams });
  }

  return NextResponse.json({ exams: allExams });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user?.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, instructions, duration_minutes, questions } = body;

    const examId = `e-${Date.now()}`;
    const newQuestions: Question[] = (questions || []).map((q: any, i: number) => ({
      id: `q-${examId}-${i + 1}`,
      question_type: q.question_type || "MULTIPLE_CHOICE",
      question_text: q.question_text,
      options: q.options || [],
      correct_answer: q.correct_answer || "",
      explanation: q.explanation || "",
      difficulty: q.difficulty || "MEDIUM",
      points: q.points || 10,
    }));

    newQuestions.forEach((q) => db.questions.set(q.id, q));

    const newExam: Exam = {
      id: examId,
      title,
      description,
      instructions: instructions || "Fullscreen mode is required. Telemetry monitoring is active.",
      duration_minutes: duration_minutes || 60,
      status: "PUBLISHED",
      created_by: user?.id || "d0000000-0000-0000-0000-000000000001",
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: newQuestions,
    };

    db.exams.set(examId, newExam);

    // Assign to all demo students
    Array.from(db.profiles.values())
      .filter((p) => p.role === "STUDENT")
      .forEach((s) => {
        const assignmentId = `ea-${examId}-${s.id}`;
        db.exam_assignments.set(assignmentId, {
          id: assignmentId,
          exam_id: examId,
          student_id: s.id,
          assigned_at: new Date().toISOString(),
          status: "ASSIGNED",
        });
      });

    db.audit_logs.push({
      id: `al-${Date.now()}`,
      actor_id: user?.id,
      action: "EXAM_CREATED",
      entity_type: "exam",
      entity_id: examId,
      metadata: { title },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, exam: newExam });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create exam" }, { status: 500 });
  }
}
