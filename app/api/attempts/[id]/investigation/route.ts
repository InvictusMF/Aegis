import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runGeminiInvestigation } from "@/lib/ai/gemini";
import { InvestigationRepository } from "@/services/repositories/investigation-repository";
import { AuditRepository } from "@/services/repositories/audit-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user?.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Investigations are restricted to examiners." }, { status: 403 });
  }

  let investigation = await InvestigationRepository.getInvestigation(id);
  if (!investigation) {
    investigation = await runGeminiInvestigation(id);
  }

  return NextResponse.json({ investigation });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user?.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Investigations are restricted to examiners." }, { status: 403 });
  }

  try {
    const investigation = await runGeminiInvestigation(id);

    await AuditRepository.logAction({
      actorId: user?.id,
      action: "AI_INVESTIGATION_TRIGGERED",
      entityType: "ATTEMPT",
      entityId: id,
      metadata: {
        model: investigation.model_name,
        status: investigation.investigation_status,
        recommendation: investigation.recommended_action,
      },
    });

    return NextResponse.json({ success: true, investigation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to trigger investigation" }, { status: 500 });
  }
}
