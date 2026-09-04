import { db } from "@/lib/db";
import { BehaviorFeatures, SecurityEvent } from "@/types";
import { verifyEvidenceChain } from "@/lib/security/evidence-chain";
import { FeatureRepository } from "@/services/repositories/feature-repository";
import crypto from "crypto";

export function extractBehaviorFeatures(attemptId: string, eventsOverride?: SecurityEvent[]): BehaviorFeatures {
  const events = eventsOverride || db.security_events.filter((e) => e.attempt_id === attemptId);
  const answers = Array.from(db.attempt_answers.values()).filter((a) => a.attempt_id === attemptId);
  const episodes = Array.from(db.suspicious_episodes.values()).filter((ep) => ep.attempt_id === attemptId);

  // Compute metrics
  const focusLossEvents = events.filter((e) => e.event_type === "WINDOW_BLUR");
  const focusLossDurationTotal = focusLossEvents.reduce((acc, curr) => acc + (curr.duration_ms || 0) / 1000, 0);
  const tabSwitchEvents = events.filter((e) => e.event_type === "TAB_SWITCH");
  const fullscreenExits = events.filter((e) => e.event_type === "FULLSCREEN_EXIT");
  const answerChangeEvents = events.filter((e) => e.event_type === "ANSWER_CHANGED");
  const copyPasteEvents = events.filter((e) => e.event_type === "COPY_ATTEMPT" || e.event_type === "PASTE_ATTEMPT");
  const inactivityEvents = events.filter((e) => e.event_type === "LONG_INACTIVITY");
  const rapidNavEvents = events.filter((e) => e.event_type === "RAPID_NAVIGATION");
  const cameraInterrupted = events.filter((e) => e.event_type === "CAMERA_INTERRUPTED");
  const faceMissing = events.filter((e) => e.event_type === "FACE_MISSING");
  const multipleFaces = events.filter((e) => e.event_type === "MULTIPLE_FACES");
  const attentionDev = events.filter((e) => e.event_type === "ATTENTION_DEVIATION");

  // Dwell times
  const dwellTimes = answers.map((a) => a.time_spent_seconds).filter((t) => t > 0);
  const avgDwell = dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 60;
  const dwellVariance =
    dwellTimes.length > 1
      ? dwellTimes.reduce((acc, val) => acc + Math.pow(val - avgDwell, 2), 0) / (dwellTimes.length - 1)
      : 0;

  // Real Tamper-Evident Hash Chain Verification
  const chainVerification = verifyEvidenceChain(events);
  const chainIntegrity = chainVerification.valid ? 1.0 : 0.0;

  const featureVector: Record<string, number> = {
    focus_loss_frequency: focusLossEvents.length,
    focus_loss_duration_total: Number(focusLossDurationTotal.toFixed(2)),
    tab_switch_frequency: tabSwitchEvents.length,
    fullscreen_exit_count: fullscreenExits.length,
    answer_change_frequency: answerChangeEvents.length,
    avg_dwell_time_seconds: Number(avgDwell.toFixed(1)),
    dwell_time_variance: Number(dwellVariance.toFixed(1)),
    inactivity_bursts: inactivityEvents.length,
    rapid_navigation_bursts: rapidNavEvents.length,
    camera_interruption_count: cameraInterrupted.length,
    face_missing_frequency: faceMissing.length,
    multiple_faces_count: multipleFaces.length,
    attention_deviation_frequency: attentionDev.length,
    copy_paste_attempts: copyPasteEvents.length,
    suspicious_episode_density: episodes.length,
    tamper_chain_integrity: chainIntegrity, // Verified from actual cryptographic chain
  };

  const bfId = crypto.randomUUID();
  const now = new Date().toISOString();

  const bf: BehaviorFeatures = {
    id: bfId,
    attempt_id: attemptId,
    feature_version: "v1.0",
    feature_window_start: events[0]?.timestamp || now,
    feature_window_end: events[events.length - 1]?.timestamp || now,
    feature_vector: featureVector,
    feature_metadata: {
      total_events_processed: events.length,
      questions_answered: answers.length,
      chain_status: chainVerification.valid ? "verified" : "compromised",
      broken_at_index: chainVerification.brokenIndex,
      computed_at: now,
    },
    created_at: now,
  };

  // Persist via repository
  FeatureRepository.saveFeatures(bf).catch((err) => {
    console.error("Async error saving features:", err);
  });

  return bf;
}
