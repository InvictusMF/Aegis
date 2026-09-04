import { db } from "@/lib/db";
import { SecurityEvent, SuspiciousEpisode, EvidenceConfidenceLevel } from "@/types";

interface EpisodeCluster {
  events: SecurityEvent[];
  startTime: number;
  endTime: number;
}

export function correlateSuspiciousEpisodes(attemptId: string): SuspiciousEpisode[] {
  const events = db.security_events
    .filter((e) => e.attempt_id === attemptId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (events.length === 0) {
    return [];
  }

  // Filter events of significance (ignore standalone low focus gained without prior blur)
  const significantEvents = events.filter((e) => {
    return (
      e.event_type === "TAB_SWITCH" ||
      e.event_type === "WINDOW_BLUR" ||
      e.event_type === "FULLSCREEN_EXIT" ||
      e.event_type === "FACE_MISSING" ||
      e.event_type === "MULTIPLE_FACES" ||
      e.event_type === "ATTENTION_DEVIATION" ||
      e.event_type === "COPY_ATTEMPT" ||
      e.event_type === "PASTE_ATTEMPT" ||
      e.event_type === "ANSWER_CHANGED" ||
      e.event_type === "RAPID_NAVIGATION" ||
      e.event_type === "SUSPICIOUS_SEQUENCE"
    );
  });

  // Cluster events occurring within a rolling window of 20 seconds
  const CLUSTER_WINDOW_MS = 20 * 1000;
  const clusters: EpisodeCluster[] = [];

  let currentCluster: EpisodeCluster | null = null;

  for (const event of significantEvents) {
    const time = new Date(event.timestamp).getTime();

    if (!currentCluster) {
      currentCluster = { events: [event], startTime: time, endTime: time };
    } else {
      if (time - currentCluster.endTime <= CLUSTER_WINDOW_MS) {
        currentCluster.events.push(event);
        currentCluster.endTime = Math.max(currentCluster.endTime, time);
      } else {
        clusters.push(currentCluster);
        currentCluster = { events: [event], startTime: time, endTime: time };
      }
    }
  }

  if (currentCluster) {
    clusters.push(currentCluster);
  }

  const generatedEpisodes: SuspiciousEpisode[] = [];

  for (let idx = 0; idx < clusters.length; idx++) {
    const cluster = clusters[idx];
    const eventTypes = cluster.events.map((e) => e.event_type);

    // Single isolated low-impact event does not justify an episode
    if (cluster.events.length === 1 && (eventTypes[0] === "ATTENTION_DEVIATION" || eventTypes[0] === "WINDOW_BLUR")) {
      continue;
    }

    const hasNavExit = eventTypes.includes("TAB_SWITCH") || eventTypes.includes("WINDOW_BLUR") || eventTypes.includes("FULLSCREEN_EXIT");
    const hasAnswerChange = eventTypes.includes("ANSWER_CHANGED");
    const hasFaceAnomaly = eventTypes.includes("FACE_MISSING") || eventTypes.includes("MULTIPLE_FACES");
    const hasClipboard = eventTypes.includes("COPY_ATTEMPT") || eventTypes.includes("PASTE_ATTEMPT");

    let episodeType = "Suspicious Activity Cluster";
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let confidence: EvidenceConfidenceLevel = "LOW";
    let riskContrib = 15;
    let summary = "";

    // Find affected question if any
    let questionId: string | null = null;
    for (const ev of cluster.events) {
      if (ev.metadata?.question_id) {
        questionId = ev.metadata.question_id;
        break;
      }
    }

    if (hasNavExit && hasAnswerChange && hasFaceAnomaly) {
      episodeType = "Focus Departure with Camera Interruption & Answer Modification";
      severity = "HIGH";
      confidence = "MODERATE";
      riskContrib = 35;
      summary = `Candidate departed the active exam tab for ${(cluster.endTime - cluster.startTime) / 1000}s with simultaneous camera face occlusion, followed immediately by answer modification.`;
    } else if (hasNavExit && hasAnswerChange) {
      episodeType = "Focus Departure Followed by Immediate Answer Modification";
      severity = "HIGH";
      confidence = "MODERATE";
      riskContrib = 28;
      summary = `Tab switch/window blur sequence immediately followed by answer modification on question ${questionId || "active question"}.`;
    } else if (hasClipboard && hasNavExit) {
      episodeType = "External Clipboard Copy/Paste Event Sequence";
      severity = "CRITICAL";
      confidence = "HIGH";
      riskContrib = 45;
      summary = "Candidate triggered clipboard interactions in rapid succession with tab departure.";
    } else if (hasFaceAnomaly && hasNavExit) {
      episodeType = "Window Inactivity with Facial Occlusion";
      severity = "MEDIUM";
      confidence = "MODERATE";
      riskContrib = 22;
      summary = "Candidate lost window focus concurrently with absent facial landmarks from computer-vision.";
    } else if (cluster.events.length >= 3) {
      episodeType = "Multi-Signal Behavioral Anomaly Burst";
      severity = "MEDIUM";
      confidence = "MODERATE";
      riskContrib = 20;
      summary = `Dense burst of ${cluster.events.length} concurrent security events recorded within a ${(cluster.endTime - cluster.startTime) / 1000}s timeframe.`;
    } else {
      episodeType = "Correlated Behavioral Telemetry Sequence";
      severity = "LOW";
      confidence = "LOW";
      riskContrib = 10;
      summary = `Cluster of ${cluster.events.length} telemetry signals observed during attempt.`;
    }

    const episodeId = `ep-${attemptId}-${idx + 1}`;
    const durationSec = Math.max(1, Math.round((cluster.endTime - cluster.startTime) / 1000));

    const episode: SuspiciousEpisode = {
      id: episodeId,
      attempt_id: attemptId,
      started_at: new Date(cluster.startTime).toISOString(),
      ended_at: new Date(cluster.endTime).toISOString(),
      duration_seconds: durationSec,
      severity,
      episode_type: episodeType,
      risk_contribution: riskContrib,
      evidence_confidence: confidence,
      summary,
      status: "OPEN",
      question_id: questionId,
      contributing_event_ids: cluster.events.map((e) => e.id),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.suspicious_episodes.set(episode.id, episode);
    generatedEpisodes.push(episode);
  }

  return generatedEpisodes;
}
