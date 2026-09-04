import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { Attempt, AttemptStatus, Profile, Exam } from "@/types";
import crypto from "crypto";

export interface AttemptWithDetails extends Attempt {
  student?: Profile;
  exam?: Exam;
}

export class AttemptRepository {
  /**
   * Get an attempt by ID with associated student and exam metadata.
   */
  static async getAttemptById(attemptId: string): Promise<AttemptWithDetails | null> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data: attempt, error } = await supabase
        .from("attempts")
        .select("*, student:profiles(*), exam:exams(*)")
        .eq("id", attemptId)
        .single();

      if (error || !attempt) {
        return null;
      }

      return attempt as AttemptWithDetails;
    }

    const attempt = db.attempts.get(attemptId);
    if (!attempt) return null;

    const student = db.profiles.get(attempt.student_id);
    const exam = db.exams.get(attempt.exam_id);

    return {
      ...attempt,
      student,
      exam,
    };
  }

  /**
   * List attempts with optional filters.
   */
  static async listAttempts(filter?: { examId?: string; studentId?: string; status?: AttemptStatus }): Promise<AttemptWithDetails[]> {
    const supabase = getServiceSupabase();

    if (supabase) {
      let query = supabase.from("attempts").select("*, student:profiles(*), exam:exams(*)");

      if (filter?.examId) query = query.eq("exam_id", filter.examId);
      if (filter?.studentId) query = query.eq("student_id", filter.studentId);
      if (filter?.status) query = query.eq("status", filter.status);

      const { data, error } = await query.order("started_at", { ascending: false });
      if (error) {
        console.error("Error querying attempts from Supabase:", error);
        return [];
      }
      return (data || []) as AttemptWithDetails[];
    }

    let all = Array.from(db.attempts.values());
    if (filter?.examId) all = all.filter((a) => a.exam_id === filter.examId);
    if (filter?.studentId) all = all.filter((a) => a.student_id === filter.studentId);
    if (filter?.status) all = all.filter((a) => a.status === filter.status);

    return all
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .map((a) => ({
        ...a,
        student: db.profiles.get(a.student_id),
        exam: db.exams.get(a.exam_id),
      }));
  }

  /**
   * Starts an attempt or resumes an active one.
   * Uses real database assignment verification (no synthetic ea-... keys!).
   * Enforces server-authoritative timer.
   */
  static async startAttempt(examId: string, studentId: string): Promise<Attempt> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    if (supabase) {
      // 1. Verify student assignment in PostgreSQL
      const { data: assignment, error: assignErr } = await supabase
        .from("exam_assignments")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", studentId)
        .single();

      if (assignErr || !assignment) {
        // If not explicitly assigned, check if exam is open to student
        const { data: exam } = await supabase.from("exams").select("*").eq("id", examId).single();
        if (!exam || exam.status !== "PUBLISHED") {
          throw new Error("Student is not assigned to this exam or exam is not published.");
        }
        // Auto-assign
        await supabase.from("exam_assignments").insert({
          id: crypto.randomUUID(),
          exam_id: examId,
          student_id: studentId,
          status: "IN_PROGRESS",
          assigned_at: now,
        });
      }

      // 2. Check for existing attempt
      const { data: existing } = await supabase
        .from("attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", studentId)
        .single();

      if (existing) {
        // If already submitted or expired, reject restarting
        if (existing.status === "SUBMITTED" || existing.status === "EXPIRED") {
          return existing;
        }

        // Server-authoritative timer expiry check
        const { data: examData } = await supabase.from("exams").select("duration_minutes").eq("id", examId).single();
        if (examData && existing.started_at) {
          const elapsed = (Date.now() - new Date(existing.started_at).getTime()) / (60 * 1000);
          if (elapsed > examData.duration_minutes) {
            await supabase.from("attempts").update({ status: "EXPIRED" }).eq("id", existing.id);
            existing.status = "EXPIRED";
            return existing;
          }
        }

        return existing;
      }

      // 3. Create new attempt in PostgreSQL with real UUID
      const attemptId = crypto.randomUUID();
      const newAttempt: Attempt = {
        id: attemptId,
        exam_id: examId,
        student_id: studentId,
        started_at: now,
        status: "IN_PROGRESS",
        last_activity_at: now,
        score: undefined,
        risk_score: 0,
        evidence_confidence: "LOW",
        review_status: "NORMAL",
        created_at: now,
        updated_at: now,
      };

      const { data: created, error: insertError } = await supabase
        .from("attempts")
        .insert(newAttempt)
        .select("*")
        .single();

      if (insertError) {
        throw new Error(`Failed to create attempt: ${insertError.message}`);
      }

      // Update assignment status
      await supabase
        .from("exam_assignments")
        .update({ status: "IN_PROGRESS" })
        .eq("exam_id", examId)
        .eq("student_id", studentId);

      return created;
    }

    // Fallback: Local authoritative store
    let existingAttempt: Attempt | undefined;
    for (const a of db.attempts.values()) {
      if (a.exam_id === examId && a.student_id === studentId) {
        existingAttempt = a;
        break;
      }
    }

    if (existingAttempt) {
      if (existingAttempt.status === "SUBMITTED" || existingAttempt.status === "EXPIRED") {
        return existingAttempt;
      }
      const exam = db.exams.get(examId);
      if (exam && existingAttempt.started_at) {
        const elapsed = (Date.now() - new Date(existingAttempt.started_at).getTime()) / (60 * 1000);
        if (elapsed > exam.duration_minutes) {
          existingAttempt.status = "EXPIRED";
          return existingAttempt;
        }
      }
      return existingAttempt;
    }

    // Verify assignment or create one
    let assigned = false;
    for (const ea of db.exam_assignments.values()) {
      if (ea.exam_id === examId && ea.student_id === studentId) {
        assigned = true;
        ea.status = "IN_PROGRESS";
        break;
      }
    }
    if (!assigned) {
      const assignmentId = crypto.randomUUID();
      db.exam_assignments.set(assignmentId, {
        id: assignmentId,
        exam_id: examId,
        student_id: studentId,
        assigned_at: now,
        status: "IN_PROGRESS",
        created_at: now,
      });
    }

    const attemptId = crypto.randomUUID();
    const newAttempt: Attempt = {
      id: attemptId,
      exam_id: examId,
      student_id: studentId,
      started_at: now,
      status: "IN_PROGRESS",
      last_activity_at: now,
      score: undefined,
      risk_score: 0,
      evidence_confidence: "LOW",
      review_status: "NORMAL",
      created_at: now,
      updated_at: now,
    };

    db.attempts.set(attemptId, newAttempt);
    return newAttempt;
  }

  /**
   * Submits an attempt with server-side grading and authoritative validation.
   * Students CANNOT pass their own score or modify risk scores!
   */
  static async submitAttempt(attemptId: string, studentId: string): Promise<Attempt> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    if (supabase) {
      // 1. Fetch attempt and verify ownership
      const { data: attempt, error } = await supabase
        .from("attempts")
        .select("*, exam:exams(*)")
        .eq("id", attemptId)
        .single();

      if (error || !attempt) {
        throw new Error("Attempt not found");
      }

      if (attempt.student_id !== studentId) {
        throw new Error("Unauthorized: Attempt does not belong to the requesting student.");
      }

      if (attempt.status === "SUBMITTED") {
        return attempt;
      }

      // 2. Fetch saved answers from attempt_answers
      const { data: answers } = await supabase
        .from("attempt_answers")
        .select("*")
        .eq("attempt_id", attemptId);

      // 3. Fetch questions with correct answers to perform server-side grading
      const { data: qLinks } = await supabase
        .from("exam_questions")
        .select("question_id, points, questions(id, correct_answer)")
        .eq("exam_id", attempt.exam_id);

      let totalPoints = 0;
      let earnedPoints = 0;

      const answerMap = new Map((answers || []).map((a: any) => [a.question_id, a.answer_value]));

      (qLinks || []).forEach((link: any) => {
        const q = link.questions;
        const pts = link.points || 1.0;
        totalPoints += pts;

        const studentAns = answerMap.get(q.id);
        if (studentAns && studentAns.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
          earnedPoints += pts;
        }
      });

      const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;

      // 4. Update attempt in PostgreSQL
      const { data: updated, error: updateError } = await supabase
        .from("attempts")
        .update({
          status: "SUBMITTED",
          submitted_at: now,
          score: finalScore,
          last_activity_at: now,
          updated_at: now,
        })
        .eq("id", attemptId)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(`Failed to submit attempt: ${updateError.message}`);
      }

      // Mark assignment completed
      await supabase
        .from("exam_assignments")
        .update({ status: "COMPLETED" })
        .eq("exam_id", attempt.exam_id)
        .eq("student_id", studentId);

      return updated;
    }

    // Fallback: Local authoritative store
    const attempt = db.attempts.get(attemptId);
    if (!attempt) throw new Error("Attempt not found");

    if (attempt.student_id !== studentId) {
      throw new Error("Unauthorized: Attempt does not belong to the requesting student.");
    }

    if (attempt.status === "SUBMITTED") {
      return attempt;
    }

    const answers = Array.from(db.attempt_answers.values()).filter((a) => a.attempt_id === attemptId);
    const links = db.exam_questions.filter((eq) => eq.exam_id === attempt.exam_id);

    let totalPoints = 0;
    let earnedPoints = 0;

    links.forEach((l) => {
      const q = db.questions.get(l.question_id);
      if (!q) return;
      const pts = l.points || 1.0;
      totalPoints += pts;

      const ans = answers.find((a) => a.question_id === q.id);
      if (ans && q.correct_answer && ans.answer_value?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
        earnedPoints += pts;
      }
    });

    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;

    attempt.status = "SUBMITTED";
    attempt.submitted_at = now;
    attempt.score = finalScore;
    attempt.last_activity_at = now;
    attempt.updated_at = now;

    for (const ea of db.exam_assignments.values()) {
      if (ea.exam_id === attempt.exam_id && ea.student_id === studentId) {
        ea.status = "COMPLETED";
        break;
      }
    }

    return attempt;
  }
}
