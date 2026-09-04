import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DecisionRepository } from "@/services/repositories/decision-repository";
import { AttemptRepository } from "@/services/repositories/attempt-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attemptId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Students cannot make review decisions." }, { status: 403 });
  }

  const attempt = await AttemptRepository.getAttemptById(attemptId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { decision, rationale } = body;

    if (!rationale || rationale.trim().length < 5) {
      return NextResponse.json(
        { error: "A substantive written rationale is mandatory for examiner review decisions." },
        { status: 400 }
      );
    }

    const reviewDecision = await DecisionRepository.recordDecision({
      attemptId,
      examinerId: user.id,
      decision,
      rationale: rationale.trim(),
    });

    const updatedAttempt = await AttemptRepository.getAttemptById(attemptId);

    return NextResponse.json({ success: true, decision: reviewDecision, attempt: updatedAttempt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit decision" }, { status: 500 });
  }
}
