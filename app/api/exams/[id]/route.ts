import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const exam = db.exams.get(id);

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  // Fetch questions for this exam
  let questions = exam.questions;
  if (!questions || questions.length === 0) {
    const qLinks = db.exam_questions.filter((eq) => eq.exam_id === id);
    questions = qLinks
      .map((l) => db.questions.get(l.question_id))
      .filter((q): q is NonNullable<typeof q> => !!q);
  }

  // Security Hardening: Strip correct answers for students!
  const sanitizedQuestions = questions.map((q) => {
    if (user?.role === "STUDENT") {
      const { correct_answer, explanation, ...sanitized } = q;
      return sanitized;
    }
    return q;
  });

  return NextResponse.json({
    exam: {
      ...exam,
      questions: sanitizedQuestions,
    },
  });
}
