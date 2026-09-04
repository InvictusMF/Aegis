export type Role = "STUDENT" | "EXAMINER" | "ADMIN";

export type ExamStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export type AttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "CANCELLED";

export type ReviewStatus = "NORMAL" | "REVIEW_RECOMMENDED" | "UNDER_REVIEW" | "RESOLVED";

export type RiskBand = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type EvidenceConfidenceLevel = "LOW" | "MODERATE" | "HIGH";

export type EpisodeStatus = "OPEN" | "REVIEWED" | "DISMISSED" | "CONFIRMED_BY_EXAMINER";

export type ReviewDecisionType = "NO_ACTION" | "NEEDS_MORE_REVIEW" | "POLICY_VIOLATION" | "DISMISSED";

export type SecurityEventType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "FULLSCREEN_EXIT"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "CONTEXT_MENU_ATTEMPT"
  | "NAVIGATION_ATTEMPT"
  | "FACE_MISSING"
  | "MULTIPLE_FACES"
  | "FACE_DETECTED"
  | "ATTENTION_DEVIATION"
  | "CAMERA_INTERRUPTED"
  | "ANSWER_CHANGED"
  | "LONG_INACTIVITY"
  | "RAPID_NAVIGATION"
  | "SUSPICIOUS_SEQUENCE";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  instructions: string;
  duration_minutes: number;
  status: ExamStatus;
  created_by: string;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  question_type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "TRUE_FALSE" | "CODE_SNIPPET";
  question_text: string;
  options?: Array<{ id: string; text: string }>;
  correct_answer?: string; // Strip from student responses!
  explanation?: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface ExamAssignment {
  id: string;
  exam_id: string;
  student_id: string;
  assigned_at: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  created_at?: string;
  exam?: Exam;
}

export interface Attempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at?: string | null;
  status: AttemptStatus;
  last_activity_at?: string | null;
  score?: number | null;
  risk_score: number; // 0 - 100
  evidence_confidence: EvidenceConfidenceLevel;
  review_status: ReviewStatus;
  tamper_hash?: string;
  created_at?: string;
  updated_at?: string;
  student?: Profile;
  exam?: Exam;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_value: string;
  first_answered_at: string;
  last_answered_at: string;
  change_count: number;
  time_spent_seconds: number;
  is_final: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SecurityEvent {
  id: string;
  attempt_id: string;
  event_type: SecurityEventType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: "BROWSER" | "COMPUTER_VISION" | "BEHAVIORAL_METRIC" | "ATTACK_LAB";
  timestamp: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
  confidence: number; // 0.0 - 1.0
  prev_hash?: string;
  curr_hash?: string;
  created_at?: string;
}

export interface BehaviorMetric {
  id: string;
  attempt_id: string;
  question_id?: string | null;
  metric_type: string;
  metric_value: number;
  measurement_window?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface BehaviorFeatures {
  id: string;
  attempt_id: string;
  feature_version: string;
  feature_window_start: string;
  feature_window_end: string;
  feature_vector: Record<string, number>;
  feature_metadata?: Record<string, any>;
  created_at?: string;
}

export interface SuspiciousEpisode {
  id: string;
  attempt_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  episode_type: string;
  risk_contribution: number;
  evidence_confidence: EvidenceConfidenceLevel;
  summary: string;
  status: EpisodeStatus;
  question_id?: string | null;
  contributing_event_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface RiskAssessment {
  id: string;
  attempt_id: string;
  risk_score: number;
  evidence_confidence: EvidenceConfidenceLevel;
  risk_band: RiskBand;
  factors: Array<{
    factor: string;
    weight: number;
    description: string;
    mitigating_context?: string;
  }>;
  model_version: string;
  engine_version: string;
  calculated_at: string;
}

export interface MLPrediction {
  id: string;
  attempt_id: string;
  model_name: string;
  model_version: string;
  feature_version: string;
  anomaly_score: number; // Raw Isolation Forest decision function score
  normalized_score: number; // Scaled 0.0 - 1.0
  prediction_metadata?: Record<string, any>;
  created_at?: string;
}

export interface AIInvestigation {
  id: string;
  attempt_id: string;
  investigation_status: "COMPLETED" | "FAILED" | "IN_PROGRESS";
  input_snapshot?: Record<string, any>;
  summary: string;
  key_findings: string[];
  correlated_evidence: Array<{
    timestamp: string;
    signals: string[];
    significance: string;
  }>;
  timeline_interpretation: string;
  alternative_explanations: string[];
  risk_factors: string[];
  recommended_action: ReviewDecisionType;
  confidence_notes: string;
  model_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReviewDecision {
  id: string;
  attempt_id: string;
  examiner_id: string;
  decision: ReviewDecisionType;
  rationale: string;
  reviewed_at: string;
  created_at?: string;
  examiner?: Profile;
}

export interface Accommodation {
  id: string;
  student_id: string;
  exam_id?: string | null;
  extended_time_multiplier?: number;
  reduced_monitoring?: boolean;
  camera_exception?: boolean;
  notes?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, any>;
  created_at?: string;
}
