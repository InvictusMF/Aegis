import crypto from "crypto";
import { SecurityEvent } from "@/types";

export function computeEventHash(prevHash: string, event: Partial<SecurityEvent>): string {
  const canonicalPayload = JSON.stringify({
    attempt_id: event.attempt_id,
    event_type: event.event_type,
    severity: event.severity,
    source: event.source,
    timestamp: event.timestamp,
    duration_ms: event.duration_ms || 0,
    metadata: event.metadata || {},
    confidence: event.confidence ?? 1.0,
  });

  return crypto
    .createHash("sha256")
    .update(`${prevHash}:${canonicalPayload}`)
    .digest("hex");
}

export function verifyEvidenceChain(events: SecurityEvent[]): {
  valid: boolean;
  brokenIndex: number | null;
  totalEvents: number;
} {
  if (events.length === 0) {
    return { valid: true, brokenIndex: null, totalEvents: 0 };
  }

  let expectedPrevHash = "0000000000000000000000000000000000000000000000000000000000000000";

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.prev_hash && ev.prev_hash !== expectedPrevHash) {
      return { valid: false, brokenIndex: i, totalEvents: events.length };
    }

    const calculated = computeEventHash(expectedPrevHash, ev);
    if (ev.curr_hash && ev.curr_hash !== calculated) {
      return { valid: false, brokenIndex: i, totalEvents: events.length };
    }

    expectedPrevHash = ev.curr_hash || calculated;
  }

  return { valid: true, brokenIndex: null, totalEvents: events.length };
}
