import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AttemptRepository } from "@/services/repositories/attempt-repository";
import { EventRepository } from "@/services/repositories/event-repository";
import { ingestSecurityEvent } from "@/services/event-service";
import { verifyEvidenceChain } from "@/lib/security/evidence-chain";

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

  if (user?.role === "STUDENT" && attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized access to telemetry." }, { status: 403 });
  }

  const events = await EventRepository.getEventsForAttempt(id);
  const chain = verifyEvidenceChain(events);

  return NextResponse.json({ events, chainIntegrity: chain });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attemptId } = await params;
  const user = await getCurrentUser();
  const attempt = await AttemptRepository.getAttemptById(attemptId);

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // If student is recording browser/CV telemetry, verify attempt ownership
  if (user?.role === "STUDENT" && attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized: Attempt mismatch." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { event_type, severity = "LOW", source = "BROWSER", duration_ms = 0, metadata = {}, confidence = 1.0 } = body;

    if (!event_type) {
      return NextResponse.json({ error: "event_type is required" }, { status: 400 });
    }

    const result = await ingestSecurityEvent({
      attempt_id: attemptId,
      event_type,
      severity,
      source,
      duration_ms,
      metadata,
      confidence,
    });

    return NextResponse.json({
      success: true,
      event: result.event,
      risk_score: result.risk_score,
      evidence_confidence: result.evidence_confidence,
      episodes_count: result.episodes_count,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to ingest event" }, { status: 400 });
  }
}
