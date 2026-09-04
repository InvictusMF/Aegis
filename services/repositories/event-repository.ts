import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { SecurityEvent } from "@/types";
import { computeEventHash } from "@/lib/security/evidence-chain";
import crypto from "crypto";

export class EventRepository {
  /**
   * Persist a validated security event into PostgreSQL with cryptographic chaining.
   */
  static async recordEvent(params: {
    attemptId: string;
    eventType: SecurityEvent["event_type"];
    severity: SecurityEvent["severity"];
    source: SecurityEvent["source"];
    timestamp?: string;
    durationMs?: number;
    metadata?: Record<string, any>;
    confidence?: number;
  }): Promise<SecurityEvent> {
    const supabase = getServiceSupabase();
    const timestamp = params.timestamp || new Date().toISOString();
    const eventId = crypto.randomUUID();

    if (supabase) {
      // 1. Get the last event for this attempt to build the tamper chain
      const { data: lastEvents } = await supabase
        .from("security_events")
        .select("curr_hash")
        .eq("attempt_id", params.attemptId)
        .order("timestamp", { ascending: false })
        .limit(1);

      const prevHash = lastEvents?.[0]?.curr_hash || "0000000000000000000000000000000000000000000000000000000000000000";

      const partialEvent = {
        attempt_id: params.attemptId,
        event_type: params.eventType,
        severity: params.severity,
        source: params.source,
        timestamp,
        duration_ms: params.durationMs || 0,
        metadata: params.metadata || {},
        confidence: params.confidence ?? 1.0,
      };

      const currHash = computeEventHash(prevHash, partialEvent);

      const newEvent: SecurityEvent = {
        id: eventId,
        ...partialEvent,
        prev_hash: prevHash,
        curr_hash: currHash,
        created_at: timestamp,
      };

      const { data: inserted, error } = await supabase
        .from("security_events")
        .insert(newEvent)
        .select("*")
        .single();

      if (error) {
        console.error("Error inserting security event to Supabase:", error);
        throw new Error(`Failed to record security event: ${error.message}`);
      }

      // Also mirror to local broadcast dispatcher for connected examiner SSE clients
      db.broadcast("SECURITY_EVENT_INGESTED", {
        attempt_id: params.attemptId,
        event: inserted,
      });

      return inserted;
    }

    // Fallback: Local authoritative store
    const existingEvents = db.security_events.filter((e) => e.attempt_id === params.attemptId);
    const lastEvent = existingEvents.length > 0 ? existingEvents[existingEvents.length - 1] : null;

    const prevHash = lastEvent?.curr_hash || "0000000000000000000000000000000000000000000000000000000000000000";

    const partialEvent = {
      attempt_id: params.attemptId,
      event_type: params.eventType,
      severity: params.severity,
      source: params.source,
      timestamp,
      duration_ms: params.durationMs || 0,
      metadata: params.metadata || {},
      confidence: params.confidence ?? 1.0,
    };

    const currHash = computeEventHash(prevHash, partialEvent);

    const newEvent: SecurityEvent = {
      id: eventId,
      ...partialEvent,
      prev_hash: prevHash,
      curr_hash: currHash,
      created_at: timestamp,
    };

    db.security_events.push(newEvent);

    db.broadcast("SECURITY_EVENT_INGESTED", {
      attempt_id: params.attemptId,
      event: newEvent,
    });

    return newEvent;
  }

  /**
   * Get all security events for an attempt in chronological order.
   */
  static async getEventsForAttempt(attemptId: string): Promise<SecurityEvent[]> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("security_events")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error querying security events from Supabase:", error);
        return [];
      }
      return data || [];
    }

    return db.security_events.filter((e) => e.attempt_id === attemptId);
  }
}
