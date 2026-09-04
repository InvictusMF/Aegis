import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExamRepository } from "@/services/repositories/exam-repository";
import { AuditRepository } from "@/services/repositories/audit-repository";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  const exams = await ExamRepository.listExams(user?.role || "STUDENT", user?.id);
  return NextResponse.json({ exams });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Only Examiners or Admins can create exams." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, instructions, duration_minutes, questions } = body;

    if (!title || !duration_minutes) {
      return NextResponse.json({ error: "Title and duration are required." }, { status: 400 });
    }

    // Determine students to assign
    const studentProfiles = Array.from(db.profiles.values()).filter((p) => p.role === "STUDENT");
    const assignedStudentIds = studentProfiles.map((s) => s.id);

    const createdExam = await ExamRepository.createExam({
      title,
      description: description || "",
      instructions: instructions || "Fullscreen mode is required. Telemetry monitoring is active.",
      duration_minutes: Number(duration_minutes),
      created_by: user.id,
      questions: questions || [],
      assigned_student_ids: assignedStudentIds,
    });

    await AuditRepository.logAction({
      actorId: user.id,
      action: "EXAM_CREATED",
      entityType: "EXAM",
      entityId: createdExam.id,
      metadata: { title, duration_minutes },
    });

    return NextResponse.json({ success: true, exam: createdExam });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create exam" }, { status: 500 });
  }
}
