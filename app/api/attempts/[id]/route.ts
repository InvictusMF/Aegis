import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AttemptRepository } from "@/services/repositories/attempt-repository";
import { ExamRepository } from "@/services/repositories/exam-repository";
import { AnswerRepository } from "@/services/repositories/answer-repository";
import { EventRepository } from "@/services/repositories/event-repository";
import { EpisodeRepository } from "@/services/repositories/episode-repository";
import { RiskRepository } from "@/services/repositories/risk-repository";
import { InvestigationRepository } from "@/services/repositories/investigation-repository";
import { DecisionRepository } from "@/services/repositories/decision-repository";
import { verifyEvidenceChain } from "@/lib/security/evidence-chain";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const attempt = await AttemptRepository.getAttemptById(id);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Authorization check: Student can only view own attempt
  if (user?.role === "STUDENT" && attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized access to attempt." }, { status: 403 });
  }

  const exam = await ExamRepository.getExamById(attempt.exam_id, user?.role || "STUDENT");
  const answers = await AnswerRepository.getAnswersForAttempt(id);
  const events = await EventRepository.getEventsForAttempt(id);
  const episodes = await EpisodeRepository.getEpisodesForAttempt(id);
  const riskAssessment = await RiskRepository.getRiskAssessment(id);
  const aiInvestigation = await InvestigationRepository.getInvestigation(id);
  const decision = await DecisionRepository.getDecisionForAttempt(id);
  const mlPrediction = db.ml_predictions.get(id);

  const chainIntegrity = verifyEvidenceChain(events);

  // Build Question Behavior Matrix
  const questions = exam?.questions || [];
  const questionMatrix = questions.map((q) => {
    const ans = answers.find((a) => a.question_id === q.id);
    const relatedEvents = events.filter((e) => e.metadata?.question_id === q.id);
    const relatedEpisodes = episodes.filter((ep) => ep.question_id === q.id);

    return {
      question_id: q.id,
      question_text: q.question_text.slice(0, 80) + (q.question_text.length > 80 ? "..." : ""),
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
      exam,
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
