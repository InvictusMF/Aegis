import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AttemptRepository } from "@/services/repositories/attempt-repository";
import { AuditRepository } from "@/services/repositories/audit-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = await getCurrentUser();

  const examId = searchParams.get("exam_id") || undefined;
  let studentId = searchParams.get("student_id") || undefined;
  const status = searchParams.get("status") as any;

  // If student, restrict strictly to own attempts
  if (user?.role === "STUDENT") {
    studentId = user.id;
  }

  const attempts = await AttemptRepository.listAttempts({
    examId,
    studentId,
    status,
  });

  return NextResponse.json({ attempts });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized: Please sign in to start an exam." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { exam_id, restart } = body;

    if (!exam_id) {
      return NextResponse.json({ error: "exam_id is required" }, { status: 400 });
    }

    const attempt = await AttemptRepository.startAttempt(exam_id, user.id, !!restart);

    await AuditRepository.logAction({
      actorId: user.id,
      action: "ATTEMPT_STARTED",
      entityType: "ATTEMPT",
      entityId: attempt.id,
      metadata: { exam_id },
    });

    return NextResponse.json({ attempt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start attempt" }, { status: 400 });
  }
}
