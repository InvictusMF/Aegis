import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { verifyEvidenceChain } from "@/lib/security/evidence-chain";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const attempt = db.attempts.get(id);

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Authorization check: Student can only view own attempt
  if (user?.role === "STUDENT" && attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const student = db.profiles.get(attempt.student_id);
  const exam = db.exams.get(attempt.exam_id);

  // Retrieve questions for this exam
  let questions = exam?.questions || [];
  if (questions.length === 0 && exam) {
    const qLinks = db.exam_questions.filter((eq) => eq.exam_id === exam.id);
    questions = qLinks
      .map((l) => db.questions.get(l.question_id))
      .filter((q): q is NonNullable<typeof q> => !!q);
  }

  // Sanitize questions if student
  const sanitizedQuestions = questions.map((q) => {
    if (user?.role === "STUDENT" && attempt.status !== "SUBMITTED") {
      const { correct_answer, explanation, ...sanitized } = q;
      return sanitized;
    }
    return q;
  });

  const answers = Array.from(db.attempt_answers.values()).filter((a) => a.attempt_id === id);
  const events = db.security_events
    .filter((e) => e.attempt_id === id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const chainIntegrity = verifyEvidenceChain(events);
  const episodes = Array.from(db.suspicious_episodes.values()).filter((ep) => ep.attempt_id === id);
  const riskAssessment = db.risk_assessments.get(id);
  const mlPrediction = db.ml_predictions.get(id);
  const aiInvestigation = db.ai_investigations.get(id);
  const decision = db.review_decisions.get(id);

  // Build Question Behavior Matrix
  const questionMatrix = questions.map((q) => {
    const ans = answers.find((a) => a.question_id === q.id);
    const relatedEvents = events.filter((e) => e.metadata?.question_id === q.id);
    const relatedEpisodes = episodes.filter((ep) => ep.question_id === q.id);

    return {
      question_id: q.id,
      question_text: q.question_text.slice(0, 80) + "...",
      difficulty: q.difficulty,
      points: q.points,
      time_spent_seconds: ans?.time_spent_seconds || 0,
      change_count: ans?.change_count || 0,
      answer_value: ans?.answer_value || "",
      events_count: relatedEvents.length,
      episodes_count: relatedEpisodes.length,
      has_anomaly: relatedEpisodes.length > 0 || (ans?.change_count || 0) > 2,
    };
  });

  return NextResponse.json({
    attempt: {
      ...attempt,
      student,
      exam: exam ? { ...exam, questions: sanitizedQuestions } : undefined,
    },
    answers,
    events,
    chainIntegrity,
    episodes,
    riskAssessment,
    mlPrediction,
    aiInvestigation,
    decision,
    questionMatrix,
  });
}
