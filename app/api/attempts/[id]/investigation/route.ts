import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { runGeminiInvestigation } from "@/lib/ai/gemini";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user?.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const investigation = db.ai_investigations.get(id) || (await runGeminiInvestigation(id));
  return NextResponse.json({ investigation });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user?.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const investigation = await runGeminiInvestigation(id);

    db.audit_logs.push({
      id: `al-${Date.now()}`,
      actor_id: user?.id,
      action: "AI_INVESTIGATION_GENERATED",
      entity_type: "attempt",
      entity_id: id,
      metadata: { model: investigation.model_name, recommendation: investigation.recommended_action },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, investigation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate investigation" }, { status: 500 });
  }
}
