import {
  Profile,
  Exam,
  Question,
  ExamAssignment,
  Attempt,
  AttemptAnswer,
  SecurityEvent,
  BehaviorMetric,
  BehaviorFeatures,
  SuspiciousEpisode,
  RiskAssessment,
  MLPrediction,
  AIInvestigation,
  ReviewDecision,
  Accommodation,
  AuditLog,
} from "@/types";

// In-Memory Real State Store initialized with complete realistic seed data
// Persists mutations during application runtime and supports full CRUD queries.

class AegisDatabase {
  private static instance: AegisDatabase;

  public profiles: Map<string, Profile> = new Map();
  public exams: Map<string, Exam> = new Map();
  public questions: Map<string, Question> = new Map();
  public exam_questions: Array<{ id: string; exam_id: string; question_id: string; position: number; points: number }> = [];
  public exam_assignments: Map<string, ExamAssignment> = new Map();
  public attempts: Map<string, Attempt> = new Map();
  public attempt_answers: Map<string, AttemptAnswer> = new Map();
  public security_events: SecurityEvent[] = [];
  public behavior_metrics: BehaviorMetric[] = [];
  public behavior_features: Map<string, BehaviorFeatures> = new Map();
  public suspicious_episodes: Map<string, SuspiciousEpisode> = new Map();
  public episode_events: Array<{ id: string; episode_id: string; security_event_id: string }> = [];
  public risk_assessments: Map<string, RiskAssessment> = new Map();
  public ml_predictions: Map<string, MLPrediction> = new Map();
  public ai_investigations: Map<string, AIInvestigation> = new Map();
  public review_decisions: Map<string, ReviewDecision> = new Map();
  public accommodations: Map<string, Accommodation> = new Map();
  public audit_logs: AuditLog[] = [];

  // Realtime listeners for SSE / dashboard broadcast
  private listeners: Set<(event: { type: string; payload: any }) => void> = new Set();

  private constructor() {
    this.seedInitialData();
  }

  public static getInstance(): AegisDatabase {
    if (!AegisDatabase.instance) {
      AegisDatabase.instance = new AegisDatabase();
    }
    return AegisDatabase.instance;
  }

  public subscribe(listener: (event: { type: string; payload: any }) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public broadcast(type: string, payload: any) {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("Broadcast listener error", err);
      }
    });
  }

  public seedInitialData() {
    // 1. Profiles
    const p1: Profile = {
      id: "d0000000-0000-0000-0000-000000000001",
      email: "examiner@aegis.local",
      full_name: "Dr. Evelyn Vance",
      role: "EXAMINER",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    };
    const p2: Profile = {
      id: "d0000000-0000-0000-0000-000000000002",
      email: "marcus@aegis.local",
      full_name: "Marcus Aurelius",
      role: "STUDENT",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    };
    const p3: Profile = {
      id: "d0000000-0000-0000-0000-000000000003",
      email: "student@aegis.local",
      full_name: "Alex Mercer",
      role: "STUDENT",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    };
    const p4: Profile = {
      id: "d0000000-0000-0000-0000-000000000004",
      email: "elena@aegis.local",
      full_name: "Elena Rostova",
      role: "STUDENT",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    };
    const p5: Profile = {
      id: "d0000000-0000-0000-0000-000000000005",
      email: "admin@aegis.local",
      full_name: "Chief Proctor Admin",
      role: "ADMIN",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    };

    [p1, p2, p3, p4, p5].forEach((p) => this.profiles.set(p.id, p));

    // 2. Questions
    const q1: Question = {
      id: "q1000000-0000-0000-0000-000000000001",
      question_type: "MULTIPLE_CHOICE",
      question_text: "In the Raft consensus algorithm, what prevents two distinct candidate nodes from both being elected leader in the exact same term?",
      options: [
        { id: "a", text: "Randomized heartbeat timeout timers ensuring only one candidate wakes up" },
        { id: "b", text: "Each voter casts at most one vote per term on a first-come, first-served basis, requiring a strict majority (N/2 + 1)" },
        { id: "c", text: "Candidates must hold the highest monotonically increasing sequence token from ZooKeeper" },
        { id: "d", text: "The existing leader cryptographically signs a handoff certificate before stepping down" },
      ],
      correct_answer: "b",
      explanation: "In Raft, each server votes for at most one candidate in a given term, and a candidate must receive votes from a majority of servers. The majority overlap property guarantees at most one leader per term.",
      difficulty: "MEDIUM",
      points: 10,
    };
    const q2: Question = {
      id: "q1000000-0000-0000-0000-000000000002",
      question_type: "MULTIPLE_CHOICE",
      question_text: "In an asynchronous distributed network with Crash-Stop failures (CFT), what is the maximum fraction of faulty nodes that a consensus protocol can tolerate according to the FLP impossibility theorem and Paxos bounds?",
      options: [
        { id: "a", text: "Less than 1/2 of the nodes (f < n/2)" },
        { id: "b", text: "Less than 1/3 of the nodes (f < n/3)" },
        { id: "c", text: "Exactly 1 node regardless of cluster size" },
        { id: "d", text: "No consensus is possible even with 1 failure without partially synchronous timing assumptions" },
      ],
      correct_answer: "d",
      explanation: "The classic FLP theorem (Fischer, Lynch, Paterson 1985) proves that in a purely asynchronous network, no deterministic consensus protocol can guarantee liveness in the presence of even a single unannounced crash failure.",
      difficulty: "HARD",
      points: 15,
    };
    const q3: Question = {
      id: "q1000000-0000-0000-0000-000000000003",
      question_type: "TRUE_FALSE",
      question_text: "In TLS 1.3, static RSA key transport was deprecated in favor of Ephemeral Diffie-Hellman (DHE / ECDHE) specifically to guarantee Forward Secrecy.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct_answer: "true",
      explanation: "TLS 1.3 removed static RSA key exchange to eliminate the risk that a compromise of the server long-term private key allows retroactively decrypting recorded past sessions (PFS).",
      difficulty: "EASY",
      points: 10,
    };
    const q4: Question = {
      id: "q1000000-0000-0000-0000-000000000004",
      question_type: "MULTIPLE_CHOICE",
      question_text: "What are the two fundamental properties required of a cryptographic commitment scheme (such as Pedersen commitments)?",
      options: [
        { id: "a", text: "Hiding and Binding" },
        { id: "b", text: "Soundness and Completeness" },
        { id: "c", text: "Linearity and Homomorphism" },
        { id: "d", text: "Confidentiality and Non-repudiation" },
      ],
      correct_answer: "a",
      explanation: "A commitment scheme must be Hiding (the commitment reveals no information about the committed value before opening) and Binding (the committer cannot open the commitment to a different value).",
      difficulty: "MEDIUM",
      points: 10,
    };
    const q5: Question = {
      id: "q1000000-0000-0000-0000-000000000005",
      question_type: "SHORT_ANSWER",
      question_text: "In PBFT (Practical Byzantine Fault Tolerance), how many total replica nodes (n) are required to tolerate f arbitrary/malicious Byzantine failures?",
      correct_answer: "3f + 1",
      explanation: "PBFT requires n >= 3f + 1 nodes to ensure that the intersection of two quorums of size 2f + 1 always contains at least one non-faulty node.",
      difficulty: "MEDIUM",
      points: 15,
    };

    [q1, q2, q3, q4, q5].forEach((q) => this.questions.set(q.id, q));

    // 3. Exam
    const exam1: Exam = {
      id: "e1000000-0000-0000-0000-000000000001",
      title: "CS 401: Distributed Systems & Security Engineering",
      description: "Midterm examination covering distributed consensus, Byzantine fault tolerance, cryptographic commitments, and zero-knowledge primitives.",
      instructions: "You have 45 minutes to complete this exam. This session utilizes privacy-preserving browser telemetry and local computer-vision monitoring. Fullscreen mode is required. Do not navigate away from the exam tab.",
      duration_minutes: 45,
      status: "PUBLISHED",
      created_by: "d0000000-0000-0000-0000-000000000001",
      starts_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 86400 * 1000).toISOString(),
      questions: [q1, q2, q3, q4, q5],
    };
    this.exams.set(exam1.id, exam1);

    // 4. Exam Questions
    [q1, q2, q3, q4, q5].forEach((q, idx) => {
      this.exam_questions.push({
        id: `eq-00${idx + 1}`,
        exam_id: exam1.id,
        question_id: q.id,
        position: idx + 1,
        points: q.points,
      });
    });

    // 5. Assignments
    this.exam_assignments.set("ea-01", {
      id: "ea-01",
      exam_id: exam1.id,
      student_id: p2.id,
      assigned_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      status: "IN_PROGRESS",
    });
    this.exam_assignments.set("ea-02", {
      id: "ea-02",
      exam_id: exam1.id,
      student_id: p3.id, // Alex Mercer
      assigned_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      status: "IN_PROGRESS",
    });
    this.exam_assignments.set("ea-03", {
      id: "ea-03",
      exam_id: exam1.id,
      student_id: p4.id,
      assigned_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      status: "COMPLETED",
    });

    // 6. Attempts
    // Attempt 1 (Marcus)
    const at1: Attempt = {
      id: "at000000-0000-0000-0000-000000000001",
      exam_id: exam1.id,
      student_id: p2.id,
      started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      status: "IN_PROGRESS",
      score: 35,
      risk_score: 8,
      evidence_confidence: "LOW",
      review_status: "NORMAL",
      student: p2,
      exam: exam1,
    };

    // Attempt 2 (Alex Mercer - The flagship demo candidate)
    const at2: Attempt = {
      id: "at000000-0000-0000-0000-000000000002",
      exam_id: exam1.id,
      student_id: p3.id,
      started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "IN_PROGRESS",
      score: 45,
      risk_score: 78,
      evidence_confidence: "MODERATE",
      review_status: "REVIEW_RECOMMENDED",
      student: p3,
      exam: exam1,
    };

    // Attempt 3 (Elena Rostova - Resolved)
    const at3: Attempt = {
      id: "at000000-0000-0000-0000-000000000003",
      exam_id: exam1.id,
      student_id: p4.id,
      started_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      submitted_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: "SUBMITTED",
      score: 55,
      risk_score: 92,
      evidence_confidence: "HIGH",
      review_status: "RESOLVED",
      student: p4,
      exam: exam1,
    };

    [at1, at2, at3].forEach((at) => this.attempts.set(at.id, at));

    // 7. Answers for Alex Mercer
    this.attempt_answers.set(`ans-${at2.id}-${q1.id}`, {
      id: `ans-${at2.id}-${q1.id}`,
      attempt_id: at2.id,
      question_id: q1.id,
      answer_value: "b",
      first_answered_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      last_answered_at: new Date(Date.now() - 27 * 60 * 1000).toISOString(),
      change_count: 0,
      time_spent_seconds: 95,
      is_final: false,
    });
    this.attempt_answers.set(`ans-${at2.id}-${q2.id}`, {
      id: `ans-${at2.id}-${q2.id}`,
      attempt_id: at2.id,
      question_id: q2.id,
      answer_value: "d",
      first_answered_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      last_answered_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      change_count: 3,
      time_spent_seconds: 340,
      is_final: false,
    });
    this.attempt_answers.set(`ans-${at2.id}-${q3.id}`, {
      id: `ans-${at2.id}-${q3.id}`,
      attempt_id: at2.id,
      question_id: q3.id,
      answer_value: "true",
      first_answered_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      last_answered_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
      change_count: 0,
      time_spent_seconds: 42,
      is_final: false,
    });

    // 8. Security Events for Alex Mercer
    const se1: SecurityEvent = {
      id: "se000000-0000-0000-0000-000000000001",
      attempt_id: at2.id,
      event_type: "WINDOW_BLUR",
      severity: "MEDIUM",
      source: "BROWSER",
      timestamp: new Date(Date.now() - 14 * 60 * 1000 - 30 * 1000).toISOString(),
      duration_ms: 4200,
      metadata: { target: "external_window" },
      confidence: 0.95,
      prev_hash: "0000000000000000000000000000000000000000000000000000000000000000",
      curr_hash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    };
    const se2: SecurityEvent = {
      id: "se000000-0000-0000-0000-000000000002",
      attempt_id: at2.id,
      event_type: "TAB_SWITCH",
      severity: "HIGH",
      source: "BROWSER",
      timestamp: new Date(Date.now() - 14 * 60 * 1000 - 28 * 1000).toISOString(),
      duration_ms: 3800,
      metadata: { document_hidden: true },
      confidence: 0.98,
      prev_hash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      curr_hash: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72",
    };
    const se3: SecurityEvent = {
      id: "se000000-0000-0000-0000-000000000003",
      attempt_id: at2.id,
      event_type: "FACE_MISSING",
      severity: "MEDIUM",
      source: "COMPUTER_VISION",
      timestamp: new Date(Date.now() - 14 * 60 * 1000 - 24 * 1000).toISOString(),
      duration_ms: 2900,
      metadata: { detection_confidence: 0.92 },
      confidence: 0.91,
      prev_hash: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72",
      curr_hash: "2c6a465997d82643e032e178546473f5e6ff4f389390680692d41fb781caab62",
    };
    const se4: SecurityEvent = {
      id: "se000000-0000-0000-0000-000000000004",
      attempt_id: at2.id,
      event_type: "WINDOW_FOCUS",
      severity: "LOW",
      source: "BROWSER",
      timestamp: new Date(Date.now() - 14 * 60 * 1000 - 20 * 1000).toISOString(),
      duration_ms: 0,
      metadata: { restored: true },
      confidence: 0.99,
      prev_hash: "2c6a465997d82643e032e178546473f5e6ff4f389390680692d41fb781caab62",
      curr_hash: "185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969",
    };
    const se5: SecurityEvent = {
      id: "se000000-0000-0000-0000-000000000005",
      attempt_id: at2.id,
      event_type: "ANSWER_CHANGED",
      severity: "HIGH",
      source: "BEHAVIORAL_METRIC",
      timestamp: new Date(Date.now() - 14 * 60 * 1000 - 12 * 1000).toISOString(),
      duration_ms: 0,
      metadata: { question_id: q2.id, old: "a", new: "d" },
      confidence: 1.0,
      prev_hash: "185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969",
      curr_hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    };

    this.security_events.push(se1, se2, se3, se4, se5);

    // 9. Suspicious Episode
    const ep1: SuspiciousEpisode = {
      id: "ep000000-0000-0000-0000-000000000001",
      attempt_id: at2.id,
      started_at: se1.timestamp,
      ended_at: se5.timestamp,
      duration_seconds: 18,
      severity: "HIGH",
      episode_type: "Focus/Navigation Anomaly with Camera Interruption & Answer Modification",
      risk_contribution: 34,
      evidence_confidence: "MODERATE",
      summary: "Candidate switched tabs and lost window focus for 4.2s accompanied by momentary facial occlusion. Immediately upon focus return, candidate altered answer to Question 2.",
      status: "OPEN",
      question_id: q2.id,
      contributing_event_ids: [se1.id, se2.id, se3.id, se4.id, se5.id],
    };
    this.suspicious_episodes.set(ep1.id, ep1);

    // 10. Risk Assessment for Alex Mercer
    this.risk_assessments.set(at2.id, {
      id: "ra000000-0000-0000-0000-000000000001",
      attempt_id: at2.id,
      risk_score: 78,
      evidence_confidence: "MODERATE",
      risk_band: "HIGH",
      factors: [
        { factor: "Correlated Window Blur + Tab Switch Episode", weight: 35, description: "Candidate departed exam tab during Question 2" },
        { factor: "Immediate Answer Mutation on Focus Return", weight: 25, description: "Answer modified within 8 seconds of regaining focus" },
        { factor: "MediaPipe Face Occlusion Burst", weight: 18, description: "Camera lost face orientation while unfocused" },
      ],
      model_version: "aegis-isoforest-v1.0",
      engine_version: "aegis-risk-engine-v1.2",
      calculated_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    });

    // 11. ML Prediction
    this.ml_predictions.set(at2.id, {
      id: "mlp00000-0000-0000-0000-000000000001",
      attempt_id: at2.id,
      model_name: "IsolationForest-BehavioralAnomaly",
      model_version: "v1.0.0",
      feature_version: "v1",
      anomaly_score: -0.1824,
      normalized_score: 0.74,
      prediction_metadata: {
        features_evaluated: 16,
        outlier_percentile: "96th",
        top_feature: "focus_loss_duration_total",
      },
      created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    });

    // 12. AI Investigation
    this.ai_investigations.set(at2.id, {
      id: "ai000000-0000-0000-0000-000000000001",
      attempt_id: at2.id,
      investigation_status: "COMPLETED",
      summary: "The telemetry timeline indicates a tightly clustered 18-second sequence during Question 2 (FLP Impossibility & Consensus Bounds). The candidate navigated away from the exam tab, had brief face detection loss, returned to the window, and altered their selected answer. While this sequence exhibits behavioral characteristics consistent with external reference lookup or potential AI-assistance lookup, the evidence remains circumstantial.",
      key_findings: [
        "Tab switch and window blur occurred concurrently at T-14m30s lasting 4.2s.",
        "MediaPipe computer-vision reported Face Missing for 2.9s during the unfocused interval.",
        "Answer for Question 2 was updated from option A to option D within 8s of focus restoration.",
        "No secondary clipboard copy/paste events were captured by the browser security sandbox.",
      ],
      correlated_evidence: [
        { timestamp: "T-14m30s", signals: ["WINDOW_BLUR", "TAB_SWITCH"], significance: "Active window context lost during difficult theoretical question" },
        { timestamp: "T-14m24s", signals: ["FACE_MISSING"], significance: "Candidate looked down or moved outside camera frame" },
        { timestamp: "T-14m12s", signals: ["ANSWER_CHANGED"], significance: "Immediate answer modification to correct theoretical option" },
      ],
      timeline_interpretation: "Candidate was engaged with Question 2 for approximately 180 seconds before the anomaly. Following the 4.2-second departure and subsequent return, the answer was changed. Subsequent behavior on Question 3 proceeded with normal continuous focus and expected dwell rhythm.",
      alternative_explanations: [
        "Accidental window minimization or operating system notification popup (e.g., calendar reminder or background updater).",
        "Candidate dropped pen/scratch paper causing physical movement away from camera frame.",
        "Legitimate sudden realization of the correct theorem formulation while adjusting posture.",
      ],
      risk_factors: [
        "High temporal proximity between tab exit and answer modification",
        "Question 2 carries high difficulty rating (15 points)",
        "Corroboration between browser-level events and computer-vision tracking",
      ],
      recommended_action: "NEEDS_MORE_REVIEW",
      confidence_notes: "Evidence Confidence is evaluated as MODERATE: The sequence is temporally correlated, but absence of clipboard capture or screen-mirroring evidence prevents definitive determination. Human examiner review of candidate scratch paper or verbal verification is recommended.",
      model_name: "gemini-1.5-flash",
      created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    });

    // 13. Audit Log
    this.audit_logs.push({
      id: "al000000-0000-0000-0000-000000000001",
      actor_id: p1.id,
      action: "EXAM_PUBLISHED",
      entity_type: "exam",
      entity_id: exam1.id,
      metadata: { title: exam1.title },
      created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    });
  }
}

export const db = AegisDatabase.getInstance();
