import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { Exam, Question, Role } from "@/types";
import crypto from "crypto";

export interface CleanQuestion {
  id: string;
  question_type: Question["question_type"];
  question_text: string;
  options?: Array<{ id: string; text: string }>;
  difficulty: Question["difficulty"];
  points: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  correct_answer?: string; // Only populated for examiners/admins
  explanation?: string;    // Only populated for examiners/admins
}

export interface ExamWithQuestions extends Exam {
  questions: CleanQuestion[];
}

export class ExamRepository {
  /**
   * Retrieves an exam with its questions.
   * CRITICAL SECURITY: If role is STUDENT, correct_answer and explanation are NEVER returned.
   */
  static async getExamById(examId: string, userRole: Role = "STUDENT"): Promise<ExamWithQuestions | null> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (examError || !examData) {
        return null;
      }

      // Fetch questions linked through exam_questions
      const { data: qLinks, error: qError } = await supabase
        .from("exam_questions")
        .select("position, points, questions (*)")
        .eq("exam_id", examId)
        .order("position", { ascending: true });

      if (qError) {
        console.error("Error fetching questions from Supabase:", qError);
      }

      const questions: CleanQuestion[] = (qLinks || []).map((link: any) => {
        const rawQ = link.questions;
        const q: CleanQuestion = {
          id: rawQ.id,
          question_type: rawQ.question_type,
          question_text: rawQ.question_text,
          options: rawQ.options,
          difficulty: rawQ.difficulty,
          points: link.points || rawQ.points,
          metadata: rawQ.metadata,
          created_at: rawQ.created_at,
          updated_at: rawQ.updated_at,
        };

        // Only examiners/admins receive the answer key
        if (userRole === "EXAMINER" || userRole === "ADMIN") {
          q.correct_answer = rawQ.correct_answer;
          q.explanation = rawQ.explanation;
        }

        return q;
      });

      return {
        ...examData,
        questions,
      };
    }

    // Fallback: Local authoritative store
    const exam = db.exams.get(examId);
    if (!exam) return null;

    const links = db.exam_questions.filter((eq) => eq.exam_id === examId).sort((a, b) => a.position - b.position);
    const questions: CleanQuestion[] = links
      .map((l) => {
        const q = db.questions.get(l.question_id);
        if (!q) return null;

        const clean: CleanQuestion = {
          id: q.id,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options,
          difficulty: q.difficulty,
          points: l.points || q.points,
          metadata: q.metadata,
          created_at: q.created_at || new Date().toISOString(),
          updated_at: q.updated_at || new Date().toISOString(),
        };

        if (userRole === "EXAMINER" || userRole === "ADMIN") {
          clean.correct_answer = q.correct_answer;
          clean.explanation = q.explanation || undefined;
        }

        return clean;
      })
      .filter(Boolean) as CleanQuestion[];

    return {
      ...exam,
      questions,
    };
  }

  /**
   * List exams with role-based filtering.
   */
  static async listExams(userRole: Role = "EXAMINER", userId?: string): Promise<Exam[]> {
    const supabase = getServiceSupabase();

    if (supabase) {
      let query = supabase.from("exams").select("*");
      if (userRole === "STUDENT") {
        query = query.eq("status", "PUBLISHED");
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        console.error("Error querying exams from Supabase:", error);
        return [];
      }
      return data || [];
    }

    // Fallback: Local store
    const all = Array.from(db.exams.values());
    if (userRole === "STUDENT") {
      return all.filter((e) => e.status === "PUBLISHED");
    }
    return all.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }

  /**
   * Create a new exam with questions and assign students.
   */
  static async createExam(params: {
    title: string;
    description: string;
    instructions?: string;
    duration_minutes: number;
    created_by?: string;
    questions?: Array<{
      question_type: Question["question_type"];
      question_text: string;
      options?: Array<{ id: string; text: string }>;
      correct_answer: string;
      difficulty: Question["difficulty"];
      points: number;
    }>;
    assigned_student_ids?: string[];
  }): Promise<Exam> {
    const examId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newExam: Exam = {
      id: examId,
      title: params.title,
      description: params.description,
      instructions: params.instructions || "Please complete the examination within the allotted timeframe. Full browser integrity monitoring is active.",
      duration_minutes: params.duration_minutes,
      status: "PUBLISHED",
      created_by: params.created_by || "d0000000-0000-0000-0000-000000000001",
      created_at: now,
      updated_at: now,
    };

    const supabase = getServiceSupabase();

    if (supabase) {
      await supabase.from("exams").insert(newExam);

      if (params.questions && params.questions.length > 0) {
        for (let i = 0; i < params.questions.length; i++) {
          const q = params.questions[i];
          const qId = crypto.randomUUID();

          await supabase.from("questions").insert({
            id: qId,
            question_type: q.question_type,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            difficulty: q.difficulty,
            points: q.points,
            created_at: now,
            updated_at: now,
          });

          await supabase.from("exam_questions").insert({
            id: crypto.randomUUID(),
            exam_id: examId,
            question_id: qId,
            position: i + 1,
            points: q.points,
            created_at: now,
          });
        }
      }

      if (params.assigned_student_ids && params.assigned_student_ids.length > 0) {
        const assignments = params.assigned_student_ids.map((studentId) => ({
          id: crypto.randomUUID(),
          exam_id: examId,
          student_id: studentId,
          assigned_at: now,
          status: "ASSIGNED",
          created_at: now,
        }));
        await supabase.from("exam_assignments").insert(assignments);
      }

      return newExam;
    }

    // Local store
    db.exams.set(examId, newExam);

    if (params.questions) {
      params.questions.forEach((q, idx) => {
        const qId = crypto.randomUUID();
        const fullQ: Question = {
          id: qId,
          ...q,
          created_at: now,
          updated_at: now,
        };
        db.questions.set(qId, fullQ);
        db.exam_questions.push({
          id: crypto.randomUUID(),
          exam_id: examId,
          question_id: qId,
          position: idx + 1,
          points: q.points,
        });
      });
    }

    if (params.assigned_student_ids) {
      params.assigned_student_ids.forEach((studentId) => {
        const assignmentId = crypto.randomUUID();
        db.exam_assignments.set(assignmentId, {
          id: assignmentId,
          exam_id: examId,
          student_id: studentId,
          assigned_at: now,
          status: "ASSIGNED",
          created_at: now,
        });
      });
    }

    return newExam;
  }
}
