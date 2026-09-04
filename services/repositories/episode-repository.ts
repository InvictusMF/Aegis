import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { SuspiciousEpisode } from "@/types";
import crypto from "crypto";

export class EpisodeRepository {
  /**
   * Save or update correlated suspicious episodes into PostgreSQL.
   */
  static async saveEpisodes(episodes: SuspiciousEpisode[]): Promise<SuspiciousEpisode[]> {
    if (episodes.length === 0) return [];

    const supabase = getServiceSupabase();

    if (supabase) {
      for (const ep of episodes) {
        // Upsert episode into public.suspicious_episodes
        const { error: epError } = await supabase.from("suspicious_episodes").upsert({
          id: ep.id,
          attempt_id: ep.attempt_id,
          started_at: ep.started_at,
          ended_at: ep.ended_at,
          duration_seconds: ep.duration_seconds,
          severity: ep.severity,
          episode_type: ep.episode_type,
          risk_contribution: ep.risk_contribution,
          evidence_confidence: ep.evidence_confidence,
          summary: ep.summary,
          status: ep.status,
          question_id: ep.question_id || null,
          created_at: ep.created_at,
          updated_at: ep.updated_at,
        });

        if (epError) {
          console.error("Error upserting suspicious episode in Supabase:", epError);
        }

        // Link contributing events in episode_events
        if (ep.contributing_event_ids && ep.contributing_event_ids.length > 0) {
          const links = ep.contributing_event_ids.map((eventId) => ({
            id: crypto.randomUUID(),
            episode_id: ep.id,
            security_event_id: eventId,
          }));

          // Ignore potential duplicate link inserts
          await supabase.from("episode_events").upsert(links, { onConflict: "id", ignoreDuplicates: true });
        }
      }

      return episodes;
    }

    // Fallback: Local authoritative store
    episodes.forEach((ep) => {
      db.suspicious_episodes.set(ep.id, ep);
      if (ep.contributing_event_ids) {
        ep.contributing_event_ids.forEach((evId) => {
          db.episode_events.push({
            id: crypto.randomUUID(),
            episode_id: ep.id,
            security_event_id: evId,
          });
        });
      }
    });

    return episodes;
  }

  /**
   * Get all suspicious episodes for an attempt.
   */
  static async getEpisodesForAttempt(attemptId: string): Promise<SuspiciousEpisode[]> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("suspicious_episodes")
        .select("*, episode_events(security_event_id)")
        .eq("attempt_id", attemptId)
        .order("started_at", { ascending: true });

      if (error) {
        console.error("Error querying episodes from Supabase:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        ...row,
        contributing_event_ids: (row.episode_events || []).map((e: any) => e.security_event_id),
      }));
    }

    return Array.from(db.suspicious_episodes.values())
      .filter((ep) => ep.attempt_id === attemptId)
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  }
}
