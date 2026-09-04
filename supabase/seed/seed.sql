-- Aegis Seed Data
-- Seed: supabase/seed/seed.sql

-- Profiles
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'examiner@aegis.local', 'Dr. Evelyn Vance', 'EXAMINER', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
  ('d0000000-0000-0000-0000-000000000002', 'marcus@aegis.local', 'Marcus Aurelius', 'STUDENT', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
  ('d0000000-0000-0000-0000-000000000003', 'student@aegis.local', 'Alex Mercer', 'STUDENT', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
  ('d0000000-0000-0000-0000-000000000004', 'elena@aegis.local', 'Elena Rostova', 'STUDENT', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
  ('d0000000-0000-0000-0000-000000000005', 'admin@aegis.local', 'Chief Proctor Admin', 'ADMIN', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150')
ON CONFLICT (id) DO NOTHING;

-- Exam
INSERT INTO public.exams (id, title, description, instructions, duration_minutes, status, created_by, starts_at, ends_at)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'CS 401: Distributed Systems & Security Engineering',
    'Midterm examination covering distributed consensus, Byzantine fault tolerance, cryptographic commitments, and zero-knowledge primitives.',
    'You have 45 minutes to complete this exam. This session utilizes privacy-preserving browser telemetry and local computer-vision monitoring. Fullscreen mode is required. Do not navigate away from the exam tab.',
    45,
    'PUBLISHED',
    'd0000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '24 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Questions
INSERT INTO public.questions (id, question_type, question_text, options, correct_answer, explanation, difficulty, points)
VALUES
  (
    'q1000000-0000-0000-0000-000000000001',
    'MULTIPLE_CHOICE',
    'In the Raft consensus algorithm, what prevents two distinct candidate nodes from both being elected leader in the exact same term?',
    '[
      {"id": "a", "text": "Randomized heartbeat timeout timers ensuring only one candidate wakes up"},
      {"id": "b", "text": "Each voter casts at most one vote per term on a first-come, first-served basis, requiring a strict majority (N/2 + 1)"},
      {"id": "c", "text": "Candidates must hold the highest monotonically increasing sequence token from ZooKeeper"},
      {"id": "d", "text": "The existing leader cryptographically signs a handoff certificate before stepping down"}
    ]'::jsonb,
    'b',
    'In Raft, each server votes for at most one candidate in a given term (on a first-come-first-served basis), and a candidate must receive votes from a majority of servers. The majority overlap property guarantees at most one leader per term.',
    'MEDIUM',
    10
  ),
  (
    'q1000000-0000-0000-0000-000000000002',
    'MULTIPLE_CHOICE',
    'In an asynchronous distributed network with Crash-Stop failures (CFT), what is the maximum fraction of faulty nodes that a consensus protocol can tolerate according to the FLP impossibility theorem and Paxos bounds?',
    '[
      {"id": "a", "text": "Less than 1/2 of the nodes (f < n/2)"},
      {"id": "b", "text": "Less than 1/3 of the nodes (f < n/3)"},
      {"id": "c", "text": "Exactly 1 node regardless of cluster size"},
      {"id": "d", "text": "No consensus is possible even with 1 failure without partially synchronous timing assumptions"}
    ]'::jsonb,
    'd',
    'The classic FLP theorem (Fischer, Lynch, Paterson 1985) proves that in a purely asynchronous network, no deterministic consensus protocol can guarantee liveness in the presence of even a single unannounced crash failure.',
    'HARD',
    15
  ),
  (
    'q1000000-0000-0000-0000-000000000003',
    'TRUE_FALSE',
    'In TLS 1.3, static RSA key transport was deprecated in favor of Ephemeral Diffie-Hellman (DHE / ECDHE) specifically to guarantee Forward Secrecy.',
    '[
      {"id": "true", "text": "True"},
      {"id": "false", "text": "False"}
    ]'::jsonb,
    'true',
    'TLS 1.3 removed static RSA key exchange to eliminate the risk that a compromise of the server long-term private key allows retroactively decrypting recorded past sessions (PFS).',
    'EASY',
    10
  ),
  (
    'q1000000-0000-0000-0000-000000000004',
    'MULTIPLE_CHOICE',
    'What are the two fundamental properties required of a cryptographic commitment scheme (such as Pedersen commitments)?',
    '[
      {"id": "a", "text": "Hiding and Binding"},
      {"id": "b", "text": "Soundness and Completeness"},
      {"id": "c", "text": "Linearity and Homomorphism"},
      {"id": "d", "text": "Confidentiality and Non-repudiation"}
    ]'::jsonb,
    'a',
    'A commitment scheme must be Hiding (the commitment reveals no information about the committed value before opening) and Binding (the committer cannot open the commitment to a different value).',
    'MEDIUM',
    10
  ),
  (
    'q1000000-0000-0000-0000-000000000005',
    'SHORT_ANSWER',
    'In PBFT (Practical Byzantine Fault Tolerance), how many total replica nodes (n) are required to tolerate f arbitrary/malicious Byzantine failures?',
    NULL,
    '3f + 1',
    'PBFT requires n >= 3f + 1 nodes to ensure that the intersection of two quorums of size 2f + 1 always contains at least one non-faulty node.',
    'MEDIUM',
    15
  )
ON CONFLICT (id) DO NOTHING;

-- Exam Questions link
INSERT INTO public.exam_questions (id, exam_id, question_id, position, points)
VALUES
  ('eq000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'q1000000-0000-0000-0000-000000000001', 1, 10),
  ('eq000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'q1000000-0000-0000-0000-000000000002', 2, 15),
  ('eq000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'q1000000-0000-0000-0000-000000000003', 3, 10),
  ('eq000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'q1000000-0000-0000-0000-000000000004', 4, 10),
  ('eq000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001', 'q1000000-0000-0000-0000-000000000005', 5, 15)
ON CONFLICT (id) DO NOTHING;

-- Assignments
INSERT INTO public.exam_assignments (id, exam_id, student_id, assigned_at, status)
VALUES
  ('ea000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', 'IN_PROGRESS'),
  ('ea000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour', 'IN_PROGRESS'),
  ('ea000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 hour', 'COMPLETED')
ON CONFLICT (id) DO NOTHING;

-- Seed Attempts
-- Attempt 1: Marcus Aurelius (Normal candidate, Low Risk)
INSERT INTO public.attempts (id, exam_id, student_id, started_at, status, score, risk_score, evidence_confidence, review_status)
VALUES
  ('at000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '25 minutes', 'IN_PROGRESS', 35, 8, 'LOW', 'NORMAL')
ON CONFLICT (id) DO NOTHING;

-- Attempt 2: Alex Mercer (Flagship Demo Candidate with correlated episode)
INSERT INTO public.attempts (id, exam_id, student_id, started_at, status, score, risk_score, evidence_confidence, review_status)
VALUES
  ('at000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes', 'IN_PROGRESS', 45, 78, 'MODERATE', 'REVIEW_RECOMMENDED')
ON CONFLICT (id) DO NOTHING;

-- Attempt 3: Elena Rostova (High-Risk completed attempt)
INSERT INTO public.attempts (id, exam_id, student_id, started_at, submitted_at, status, score, risk_score, evidence_confidence, review_status)
VALUES
  ('at000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '5 minutes', 'SUBMITTED', 55, 92, 'HIGH', 'RESOLVED')
ON CONFLICT (id) DO NOTHING;

-- Seed Attempt 2 Answers (Alex Mercer)
INSERT INTO public.attempt_answers (id, attempt_id, question_id, answer_value, first_answered_at, last_answered_at, change_count, time_spent_seconds, is_final)
VALUES
  ('ans00000-0000-0000-0000-000000000001', 'at000000-0000-0000-0000-000000000002', 'q1000000-0000-0000-0000-000000000001', 'b', NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '27 minutes', 0, 95, FALSE),
  ('ans00000-0000-0000-0000-000000000002', 'at000000-0000-0000-0000-000000000002', 'q1000000-0000-0000-0000-000000000002', 'd', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '12 minutes', 3, 340, FALSE),
  ('ans00000-0000-0000-0000-000000000003', 'at000000-0000-0000-0000-000000000002', 'q1000000-0000-0000-0000-000000000003', 'true', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes', 0, 42, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Seed Security Events for Alex Mercer (The flagship demo chain)
INSERT INTO public.security_events (id, attempt_id, event_type, severity, source, timestamp, duration_ms, metadata, confidence)
VALUES
  ('se000000-0000-0000-0000-000000000001', 'at000000-0000-0000-0000-000000000002', 'WINDOW_BLUR', 'MEDIUM', 'BROWSER', NOW() - INTERVAL '14 minutes 30 seconds', 4200, '{"target": "external_window"}'::jsonb, 0.95),
  ('se000000-0000-0000-0000-000000000002', 'at000000-0000-0000-0000-000000000002', 'TAB_SWITCH', 'HIGH', 'BROWSER', NOW() - INTERVAL '14 minutes 28 seconds', 3800, '{"document_hidden": true}'::jsonb, 0.98),
  ('se000000-0000-0000-0000-000000000003', 'at000000-0000-0000-0000-000000000002', 'FACE_MISSING', 'MEDIUM', 'COMPUTER_VISION', NOW() - INTERVAL '14 minutes 24 seconds', 2900, '{"detection_confidence": 0.92}'::jsonb, 0.91),
  ('se000000-0000-0000-0000-000000000004', 'at000000-0000-0000-0000-000000000002', 'WINDOW_FOCUS', 'LOW', 'BROWSER', NOW() - INTERVAL '14 minutes 20 seconds', 0, '{"restored": true}'::jsonb, 0.99),
  ('se000000-0000-0000-0000-000000000005', 'at000000-0000-0000-0000-000000000002', 'ANSWER_CHANGED', 'HIGH', 'BEHAVIORAL_METRIC', NOW() - INTERVAL '14 minutes 12 seconds', 0, '{"question_id": "q1000000-0000-0000-0000-000000000002", "old": "a", "new": "d"}'::jsonb, 1.0)
ON CONFLICT (id) DO NOTHING;

-- Correlated Suspicious Episode for Alex Mercer
INSERT INTO public.suspicious_episodes (id, attempt_id, started_at, ended_at, duration_seconds, severity, episode_type, risk_contribution, evidence_confidence, summary, status, question_id)
VALUES
  (
    'ep000000-0000-0000-0000-000000000001',
    'at000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '14 minutes 30 seconds',
    NOW() - INTERVAL '14 minutes 12 seconds',
    18,
    'HIGH',
    'Focus/Navigation Anomaly with Camera Interruption & Answer Modification',
    34,
    'MODERATE',
    'Candidate switched tabs and lost window focus for 4.2s accompanied by momentary facial occlusion. Immediately upon focus return, candidate altered answer to Question 2.',
    'OPEN',
    'q1000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (id) DO NOTHING;

-- Risk Assessment for Alex Mercer
INSERT INTO public.risk_assessments (id, attempt_id, risk_score, evidence_confidence, risk_band, factors, model_version, engine_version, calculated_at)
VALUES
  (
    'ra000000-0000-0000-0000-000000000001',
    'at000000-0000-0000-0000-000000000002',
    78,
    'MODERATE',
    'HIGH',
    '[
      {"factor": "Correlated Window Blur + Tab Switch Episode", "weight": 35, "description": "Candidate departed exam tab during Question 2"},
      {"factor": "Immediate Answer Mutation on Focus Return", "weight": 25, "description": "Answer modified within 8 seconds of regaining focus"},
      {"factor": "MediaPipe Face Occlusion Burst", "weight": 18, "description": "Camera lost face orientation while unfocused"}
    ]'::jsonb,
    'aegis-isoforest-v1.0',
    'aegis-risk-engine-v1.2',
    NOW() - INTERVAL '14 minutes'
  )
ON CONFLICT (id) DO NOTHING;

-- ML Anomaly Prediction for Alex Mercer
INSERT INTO public.ml_predictions (id, attempt_id, model_name, model_version, feature_version, anomaly_score, normalized_score, prediction_metadata)
VALUES
  (
    'mlp00000-0000-0000-0000-000000000001',
    'at000000-0000-0000-0000-000000000002',
    'IsolationForest-BehavioralAnomaly',
    'v1.0.0',
    'v1',
    -0.1824,
    0.74,
    '{"features_evaluated": 16, "outlier_percentile": "96th", "top_feature": "focus_loss_duration_total"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- AI Investigation for Alex Mercer
INSERT INTO public.ai_investigations (id, attempt_id, investigation_status, summary, key_findings, correlated_evidence, timeline_interpretation, alternative_explanations, risk_factors, recommended_action, confidence_notes, model_name)
VALUES
  (
    'ai000000-0000-0000-0000-000000000001',
    'at000000-0000-0000-0000-000000000002',
    'COMPLETED',
    'The telemetry timeline indicates a tightly clustered 18-second sequence during Question 2 (FLP Impossibility & Consensus Bounds). The candidate navigated away from the exam tab, had brief face detection loss, returned to the window, and altered their selected answer. While this sequence exhibits behavioral characteristics consistent with external reference lookup or potential AI-assistance lookup, the evidence remains circumstantial.',
    '[
      "Tab switch and window blur occurred concurrently at T-14m30s lasting 4.2s.",
      "MediaPipe computer-vision reported Face Missing for 2.9s during the unfocused interval.",
      "Answer for Question 2 was updated from option A to option D within 8s of focus restoration.",
      "No secondary clipboard copy/paste events were captured by the browser security sandbox."
    ]'::jsonb,
    '[
      {"timestamp": "T-14m30s", "signals": ["WINDOW_BLUR", "TAB_SWITCH"], "significance": "Active window context lost during difficult theoretical question"},
      {"timestamp": "T-14m24s", "signals": ["FACE_MISSING"], "significance": "Candidate looked down or moved outside camera frame"},
      {"timestamp": "T-14m12s", "signals": ["ANSWER_CHANGED"], "significance": "Immediate answer modification to correct theoretical option"}
    ]'::jsonb,
    'Candidate was engaged with Question 2 for approximately 180 seconds before the anomaly. Following the 4.2-second departure and subsequent return, the answer was changed. Subsequent behavior on Question 3 proceeded with normal continuous focus and expected dwell rhythm.',
    '[
      "Accidental window minimization or operating system notification popup (e.g., calendar reminder or background updater).",
      "Candidate dropped pen/scratch paper causing physical movement away from camera frame.",
      "Legitimate sudden realization of the correct theorem formulation while adjusting posture."
    ]'::jsonb,
    '[
      "High temporal proximity between tab exit and answer modification",
      "Question 2 carries high difficulty rating (15 points)",
      "Corroboration between browser-level events and computer-vision tracking"
    ]'::jsonb,
    'NEEDS_MORE_REVIEW',
    'Evidence Confidence is evaluated as MODERATE: The sequence is temporally correlated, but absence of clipboard capture or screen-mirroring evidence prevents definitive determination. Human examiner review of candidate scratch paper or verbal verification is recommended.',
    'gemini-1.5-flash'
  )
ON CONFLICT (id) DO NOTHING;

-- Audit Log Entry
INSERT INTO public.audit_logs (id, actor_id, action, entity_type, entity_id, metadata)
VALUES
  (
    'al000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'EXAM_PUBLISHED',
    'exam',
    'e1000000-0000-0000-0000-000000000001',
    '{"title": "CS 401: Distributed Systems & Security Engineering"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
