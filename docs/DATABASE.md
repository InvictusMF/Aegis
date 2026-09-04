# Aegis Database & Persistence Documentation

**Engine:** PostgreSQL / Supabase  
**Migrations:** `supabase/migrations/`  
**Seed Data:** `supabase/seed/`  
**Security:** Full Row Level Security (RLS) across all tables

---

## 1. Relational Entity Schema

Aegis enforces strict relational integrity across 18 specialized tables:

1. **`profiles`**: User identities (STUDENT, EXAMINER, ADMIN) linked to Supabase Auth.
2. **`exams`**: Assessments created by examiners with durations, instructions, and lifecycle states (DRAFT, PUBLISHED, CLOSED, ARCHIVED).
3. **`questions`**: Individual test items with difficulty ratings, options, and points. Correct answers are protected and stripped from student endpoints.
4. **`exam_questions`**: Ordering and question associations per exam.
5. **`exam_assignments`**: Student exam allocations and completion states.
6. **`attempts`**: Examination sessions with start times, server-authoritative submission times, aggregate risk scores, and review statuses.
7. **`attempt_answers`**: Individual question responses, change counts, and dwell durations.
8. **`security_events`**: Immutable telemetry signals (TAB_SWITCH, WINDOW_BLUR, FACE_MISSING, etc.) with cryptographic hash links.
9. **`behavior_metrics`**: Raw aggregated metrics measured during test windows.
10. **`behavior_features`**: ML-ready 16-dimensional feature vectors tagged with feature versions.
11. **`suspicious_episodes`**: Correlated temporal clusters linking related events into explainable narratives.
12. **`episode_events`**: Join table binding suspicious episodes to their underlying security events.
13. **`risk_assessments`**: Deterministic risk scores, risk bands (LOW, MODERATE, HIGH, CRITICAL), and factor weightings.
14. **`ml_predictions`**: Persisted outputs from the Isolation Forest microservice.
15. **`ai_investigations`**: Structured Gemini findings, timeline interpretations, and alternative explanations.
16. **`review_decisions`**: Authoritative determinations submitted by examiners with written rationale.
17. **`accommodations`**: Accessibility parameters (extended time, modified proctoring).
18. **`audit_logs`**: Immutable security-sensitive action log with actor IDs and metadata.

---

## 2. Row Level Security (RLS) Model

Every table in Aegis has Row Level Security enabled:
- **Profiles:** Users view their own profile; Examiners & Admins view all profiles.
- **Questions:** Correct answers and explanations are accessible exclusively to Examiners and Admins. Students receive sanitized questions.
- **Attempts & Answers:** Students can only read and modify their own in-progress attempts. Submissions are immutable once submitted.
- **Investigations & Decisions:** Suspicious episodes, risk assessments, and review decision panels are restricted strictly to Examiners and Admins.

---

## 3. Dual-Mode Persistence Architecture

To guarantee zero broken screens, zero dead cards, and immediate execution in all testing environments:
1. **Remote Supabase Mode:** When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are populated, the application integrates with Supabase PostgreSQL and Supabase Realtime.
2. **Local Persistence Engine (`lib/db/index.ts`):** In local demo mode or offline environments, Aegis executes against an in-memory/JSON relational persistence layer pre-seeded with complete realistic exam data, supporting full CRUD, event ingestion, and Server-Sent Events (SSE) realtime streaming with 100% feature parity.
