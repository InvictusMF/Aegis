import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { AttemptAnswer } from "@/types";
import crypto from "crypto";

export class AnswerRepository {
  /**
   * Save or update an answer for an attempt with server-authoritative timer validation.
   */
  static async saveAnswer(params: {
    attemptId: string;
    studentId: string;
    questionId: string;
    answerValue: string;
    timeSpentSeconds?: number;
  }): Promise<AttemptAnswer> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    if (supabase) {
      // 1. Verify attempt ownership and expiry in PostgreSQL
      const { data: attempt, error: attemptErr } = await supabase
        .from("attempts")
        .select("*, exam:exams(duration_minutes)")
        .eq("id", params.attemptId)
        .single();

      if (attemptErr || !attempt) {
        throw new Error("Attempt not found");
      }

      if (attempt.student_id !== params.studentId) {
        throw new Error("Unauthorized attempt modification.");
      }

      if (attempt.status === "SUBMITTED" || attempt.status === "EXPIRED") {
        throw new Error("Cannot modify answers for a submitted or expired attempt.");
      }

      const durationMinutes = attempt.exam?.duration_minutes || 60;
      const elapsed = (Date.now() - new Date(attempt.started_at).getTime()) / (60 * 1000);
      if (elapsed > durationMinutes + 1) { // 1 min latency grace
        await supabase.from("attempts").update({ status: "EXPIRED" }).eq("id", params.attemptId);
        throw new Error("Exam time limit has expired.");
      }

      // 2. Fetch existing answer
      const { data: existing } = await supabase
        .from("attempt_answers")
        .select("*")
        .eq("attempt_id", params.attemptId)
        .eq("question_id", params.questionId)
        .single();

      if (existing) {
        const updatedChangeCount = (existing.change_count || 0) + 1;
        const totalTimeSpent = (existing.time_spent_seconds || 0) + (params.timeSpentSeconds || 0);

        const { data: updated, error: updateErr } = await supabase
          .from("attempt_answers")
          .update({
            answer_value: params.answerValue,
            last_answered_at: now,
            change_count: updatedChangeCount,
            time_spent_seconds: totalTimeSpent,
            updated_at: now,
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (updateErr) throw new Error(updateErr.message);

        // Update attempt last_activity_at
        await supabase.from("attempts").update({ last_activity_at: now }).eq("id", params.attemptId);
        return updated;
      }

      // 3. Insert new answer
      const answerId = crypto.randomUUID();
      const newAnswer: AttemptAnswer = {
        id: answerId,
        attempt_id: params.attemptId,
        question_id: params.questionId,
        answer_value: params.answerValue,
        first_answered_at: now,
        last_answered_at: now,
        change_count: 0,
        time_spent_seconds: params.timeSpentSeconds || 0,
        is_final: false,
        created_at: now,
        updated_at: now,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("attempt_answers")
        .insert(newAnswer)
        .select("*")
        .single();

      if (insertErr) throw new Error(insertErr.message);

      await supabase.from("attempts").update({ last_activity_at: now }).eq("id", params.attemptId);
      return inserted;
    }

    // Fallback: Local authoritative store
    const attempt = db.attempts.get(params.attemptId);
    if (!attempt) throw new Error("Attempt not found");

    if (attempt.student_id !== params.studentId) {
      throw new Error("Unauthorized attempt modification.");
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "EXPIRED") {
      throw new Error("Cannot modify answers for a submitted or expired attempt.");
    }

    const exam = db.exams.get(attempt.exam_id);
    if (exam && attempt.started_at) {
      const elapsed = (Date.now() - new Date(attempt.started_at).getTime()) / (60 * 1000);
      if (elapsed > exam.duration_minutes + 1) {
        attempt.status = "EXPIRED";
        throw new Error("Exam time limit has expired.");
      }
    }

    let existingAnswer: AttemptAnswer | undefined;
    for (const ans of db.attempt_answers.values()) {
      if (ans.attempt_id === params.attemptId && ans.question_id === params.questionId) {
        existingAnswer = ans;
        break;
      }
    }

    if (existingAnswer) {
      existingAnswer.answer_value = params.answerValue;
      existingAnswer.last_answered_at = now;
      existingAnswer.change_count += 1;
      existingAnswer.time_spent_seconds += params.timeSpentSeconds || 0;
      existingAnswer.updated_at = now;
      attempt.last_activity_at = now;
      return existingAnswer;
    }

    const answerId = crypto.randomUUID();
    const newAns: AttemptAnswer = {
      id: answerId,
      attempt_id: params.attemptId,
      question_id: params.questionId,
      answer_value: params.answerValue,
      first_answered_at: now,
      last_answered_at: now,
      change_count: 0,
      time_spent_seconds: params.timeSpentSeconds || 0,
      is_final: false,
      created_at: now,
      updated_at: now,
    };

    db.attempt_answers.set(answerId, newAns);
    attempt.last_activity_at = now;
    return newAns;
  }

  /**
   * Get all answers for an attempt (restores state on browser refresh).
   */
  static async getAnswersForAttempt(attemptId: string): Promise<AttemptAnswer[]> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("attempt_answers")
        .select("*")
        .eq("attempt_id", attemptId);

      if (error) {
        console.error("Error fetching attempt answers:", error);
        return [];
      }
      return data || [];
    }

    return Array.from(db.attempt_answers.values()).filter((a) => a.attempt_id === attemptId);
  }
}
