import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ExamRepository } from "@/services/repositories/exam-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const exam = await ExamRepository.getExamById(id, user?.role || "STUDENT");

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  return NextResponse.json({ exam });
}
