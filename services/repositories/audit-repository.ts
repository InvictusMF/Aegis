import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { AuditLog } from "@/types";
import crypto from "crypto";

export class AuditRepository {
  static async logAction(params: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();
    const logId = crypto.randomUUID();

    const logEntry: AuditLog = {
      id: logId,
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: params.metadata || {},
      created_at: now,
    };

    if (supabase) {
      const { error } = await supabase.from("audit_logs").insert(logEntry);
      if (error) {
        console.error("Error writing audit log to Supabase:", error);
      }
      return logEntry;
    }

    db.audit_logs.push(logEntry);
    return logEntry;
  }

  static async getLogsForEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) return [];
      return data || [];
    }

    return db.audit_logs
      .filter((l) => l.entity_type === entityType && l.entity_id === entityId)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }
}
