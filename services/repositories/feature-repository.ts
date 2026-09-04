import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { BehaviorFeatures } from "@/types";

export class FeatureRepository {
  static async saveFeatures(features: BehaviorFeatures): Promise<BehaviorFeatures> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { error } = await supabase.from("behavior_features").upsert({
        id: features.id,
        attempt_id: features.attempt_id,
        feature_version: features.feature_version,
        feature_window_start: features.feature_window_start,
        feature_window_end: features.feature_window_end,
        feature_vector: features.feature_vector,
        feature_metadata: features.feature_metadata,
        computed_at: features.created_at || new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving behavior features to Supabase:", error);
      }
      return features;
    }

    db.behavior_features.set(features.attempt_id, features);
    return features;
  }

  static async getFeaturesForAttempt(attemptId: string): Promise<BehaviorFeatures | null> {
    const supabase = getServiceSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("behavior_features")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data as BehaviorFeatures;
    }

    return db.behavior_features.get(attemptId) || null;
  }
}
