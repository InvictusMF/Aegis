import { NextResponse } from "next/server";
import { ingestSecurityEvent } from "@/services/event-service";
import { getCurrentUser } from "@/lib/auth";
import { SecurityEventType } from "@/types";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user?.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Attack Lab is restricted to examiners and proctors" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { attempt_id, action, question_id } = body;

    if (!attempt_id) {
      return NextResponse.json({ error: "attempt_id is required" }, { status: 400 });
    }

    const results: any[] = [];

    switch (action) {
      case "SIMULATE_TAB_SWITCH": {
        const res = await ingestSecurityEvent({
          attempt_id,
          event_type: "TAB_SWITCH",
          severity: "HIGH",
          source: "ATTACK_LAB",
          duration_ms: 3500,
          metadata: { document_hidden: true, attack_lab_simulation: true },
          confidence: 0.98,
        });
        results.push(res);
        break;
      }

      case "SIMULATE_FOCUS_LOSS": {
        const res = await ingestSecurityEvent({
          attempt_id,
          event_type: "WINDOW_BLUR",
          severity: "MEDIUM",
          source: "ATTACK_LAB",
          duration_ms: 4800,
          metadata: { target: "external_window", attack_lab_simulation: true },
          confidence: 0.95,
        });
        results.push(res);
        break;
      }

      case "SIMULATE_FULLSCREEN_EXIT": {
        const res = await ingestSecurityEvent({
          attempt_id,
          event_type: "FULLSCREEN_EXIT",
          severity: "HIGH",
          source: "ATTACK_LAB",
          duration_ms: 2100,
          metadata: { attack_lab_simulation: true },
          confidence: 1.0,
        });
        results.push(res);
        break;
      }

      case "SIMULATE_FACE_MISSING": {
        const res = await ingestSecurityEvent({
          attempt_id,
          event_type: "FACE_MISSING",
          severity: "MEDIUM",
          source: "ATTACK_LAB",
          duration_ms: 3200,
          metadata: { detection_confidence: 0.91, attack_lab_simulation: true },
          confidence: 0.92,
        });
        results.push(res);
        break;
      }

      case "SIMULATE_MULTIPLE_FACES": {
        const res = await ingestSecurityEvent({
          attempt_id,
          event_type: "MULTIPLE_FACES",
          severity: "HIGH",
          source: "ATTACK_LAB",
          duration_ms: 2500,
          metadata: { faces_detected: 2, attack_lab_simulation: true },
          confidence: 0.89,
        });
        results.push(res);
        break;
      }

      case "SIMULATE_ANSWER_CHANGE": {
        const res = await ingestSecurityEvent({
          attempt_id,
          event_type: "ANSWER_CHANGED",
          severity: "HIGH",
          source: "ATTACK_LAB",
          metadata: { question_id: question_id || "q1000000-0000-0000-0000-000000000002", attack_lab_simulation: true },
          confidence: 1.0,
        });
        results.push(res);
        break;
      }

      case "SIMULATE_RAPID_NAVIGATION": {
        const res = await ingestSecurityEvent({
          attempt_id,
          event_type: "RAPID_NAVIGATION",
          severity: "MEDIUM",
          source: "ATTACK_LAB",
          metadata: { questions_skipped: 4, dwell_window_seconds: 3, attack_lab_simulation: true },
          confidence: 0.94,
        });
        results.push(res);
        break;
      }

      case "SIMULATE_LONG_INACTIVITY": {
        const res = await ingestSecurityEvent({
          attempt_id,
          event_type: "LONG_INACTIVITY",
          severity: "LOW",
          source: "ATTACK_LAB",
          duration_ms: 60000,
          metadata: { idle_seconds: 60, attack_lab_simulation: true },
          confidence: 0.96,
        });
        results.push(res);
        break;
      }

      case "SIMULATE_SUSPICIOUS_SEQUENCE": {
        // High-Value Correlated Sequence:
        // Window Blur -> Tab Switch -> Face Missing -> Focus Regained -> Answer Changed
        const now = Date.now();
        const ev1 = await ingestSecurityEvent({
          attempt_id,
          event_type: "WINDOW_BLUR",
          severity: "MEDIUM",
          source: "ATTACK_LAB",
          timestamp: new Date(now - 12000).toISOString(),
          duration_ms: 4500,
          metadata: { attack_lab_sequence: true },
          confidence: 0.95,
        });
        const ev2 = await ingestSecurityEvent({
          attempt_id,
          event_type: "TAB_SWITCH",
          severity: "HIGH",
          source: "ATTACK_LAB",
          timestamp: new Date(now - 10000).toISOString(),
          duration_ms: 4000,
          metadata: { document_hidden: true, attack_lab_sequence: true },
          confidence: 0.98,
        });
        const ev3 = await ingestSecurityEvent({
          attempt_id,
          event_type: "FACE_MISSING",
          severity: "MEDIUM",
          source: "ATTACK_LAB",
          timestamp: new Date(now - 6000).toISOString(),
          duration_ms: 3000,
          metadata: { attack_lab_sequence: true },
          confidence: 0.91,
        });
        const ev4 = await ingestSecurityEvent({
          attempt_id,
          event_type: "WINDOW_FOCUS",
          severity: "LOW",
          source: "ATTACK_LAB",
          timestamp: new Date(now - 2000).toISOString(),
          metadata: { attack_lab_sequence: true },
          confidence: 0.99,
        });
        const ev5 = await ingestSecurityEvent({
          attempt_id,
          event_type: "ANSWER_CHANGED",
          severity: "HIGH",
          source: "ATTACK_LAB",
          timestamp: new Date(now).toISOString(),
          metadata: { question_id: question_id || "q1000000-0000-0000-0000-000000000002", attack_lab_sequence: true },
          confidence: 1.0,
        });

        results.push(ev1, ev2, ev3, ev4, ev5);
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      results,
      message: `Successfully executed real event pipeline for ${action}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to execute simulation" }, { status: 500 });
  }
}
