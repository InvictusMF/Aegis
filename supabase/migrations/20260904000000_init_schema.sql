-- Aegis Examination Integrity Platform - PostgreSQL / Supabase Schema
-- Migration: 20260904000000_init_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('STUDENT', 'EXAMINER', 'ADMIN')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_type TEXT NOT NULL CHECK (question_type IN ('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'TRUE_FALSE', 'CODE_SNIPPET')),
    question_text TEXT NOT NULL,
    options JSONB, -- Array of { id, text }
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    points NUMERIC NOT NULL DEFAULT 1.0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Exam Questions (Join Table)
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    points NUMERIC NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(exam_id, question_id)
);

-- 5. Exam Assignments Table
CREATE TABLE IF NOT EXISTS public.exam_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- 6. Attempts Table
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'CANCELLED')),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    score NUMERIC,
    risk_score NUMERIC NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    evidence_confidence TEXT NOT NULL DEFAULT 'LOW' CHECK (evidence_confidence IN ('LOW', 'MODERATE', 'HIGH')),
    review_status TEXT NOT NULL DEFAULT 'NORMAL' CHECK (review_status IN ('NORMAL', 'REVIEW_RECOMMENDED', 'UNDER_REVIEW', 'RESOLVED')),
    tamper_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Attempt Answers Table
CREATE TABLE IF NOT EXISTS public.attempt_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_value TEXT,
    first_answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_count INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds NUMERIC NOT NULL DEFAULT 0,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 8. Security Events Table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    source TEXT NOT NULL CHECK (source IN ('BROWSER', 'COMPUTER_VISION', 'BEHAVIORAL_METRIC', 'ATTACK_LAB')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    confidence NUMERIC NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1.0),
    prev_hash TEXT,
    curr_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Behavior Metrics Table
CREATE TABLE IF NOT EXISTS public.behavior_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    measurement_window TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 10. Behavior Features Table (ML-ready feature vectors)
CREATE TABLE IF NOT EXISTS public.behavior_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    feature_version TEXT NOT NULL DEFAULT 'v1',
    feature_window_start TIMESTAMPTZ NOT NULL,
    feature_window_end TIMESTAMPTZ NOT NULL,
    feature_vector JSONB NOT NULL,
    feature_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Suspicious Episodes Table
CREATE TABLE IF NOT EXISTS public.suspicious_episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_seconds NUMERIC NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    episode_type TEXT NOT NULL,
    risk_contribution NUMERIC NOT NULL DEFAULT 0,
    evidence_confidence TEXT NOT NULL CHECK (evidence_confidence IN ('LOW', 'MODERATE', 'HIGH')),
    summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REVIEWED', 'DISMISSED', 'CONFIRMED_BY_EXAMINER')),
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Episode Events (Join Table)
CREATE TABLE IF NOT EXISTS public.episode_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES public.suspicious_episodes(id) ON DELETE CASCADE,
    security_event_id UUID NOT NULL REFERENCES public.security_events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(episode_id, security_event_id)
);

-- 13. Risk Assessments Table
CREATE TABLE IF NOT EXISTS public.risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    risk_score NUMERIC NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    evidence_confidence TEXT NOT NULL CHECK (evidence_confidence IN ('LOW', 'MODERATE', 'HIGH')),
    risk_band TEXT NOT NULL CHECK (risk_band IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_version TEXT NOT NULL,
    engine_version TEXT NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ML Predictions Table
CREATE TABLE IF NOT EXISTS public.ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    feature_version TEXT NOT NULL,
    anomaly_score NUMERIC NOT NULL,
    normalized_score NUMERIC NOT NULL CHECK (normalized_score >= 0 AND normalized_score <= 1.0),
    prediction_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. AI Investigations Table
CREATE TABLE IF NOT EXISTS public.ai_investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    investigation_status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (investigation_status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
    input_snapshot JSONB,
    summary TEXT NOT NULL,
    key_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    correlated_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeline_interpretation TEXT NOT NULL,
    alternative_explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_action TEXT NOT NULL CHECK (recommended_action IN ('NO_ACTION', 'NEEDS_MORE_REVIEW', 'POLICY_VIOLATION', 'DISMISSED')),
    confidence_notes TEXT NOT NULL,
    model_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Review Decisions Table
CREATE TABLE IF NOT EXISTS public.review_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    examiner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('NO_ACTION', 'NEEDS_MORE_REVIEW', 'POLICY_VIOLATION', 'DISMISSED')),
    rationale TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Accommodations Table
CREATE TABLE IF NOT EXISTS public.accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    extended_time_multiplier NUMERIC DEFAULT 1.0,
    reduced_monitoring BOOLEAN DEFAULT FALSE,
    camera_exception BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON public.exams(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON public.exam_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_student ON public.attempts(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON public.attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_review_status ON public.attempts(review_status);
CREATE INDEX IF NOT EXISTS idx_attempts_risk_score ON public.attempts(risk_score);
CREATE INDEX IF NOT EXISTS idx_security_events_attempt ON public.security_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON public.security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_episodes_attempt ON public.suspicious_episodes(attempt_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON public.suspicious_episodes(status);
CREATE INDEX IF NOT EXISTS idx_behavior_features_attempt ON public.behavior_features(attempt_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Users can view own profile; Examiners & Admins can view all profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.current_user_role() IN ('EXAMINER', 'ADMIN'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Exams: Published exams visible to assigned students; all exams visible to Examiners & Admins
CREATE POLICY "Exams select policy" ON public.exams
  FOR SELECT USING (
    status = 'PUBLISHED' OR public.current_user_role() IN ('EXAMINER', 'ADMIN')
  );

CREATE POLICY "Exams examiner modify" ON public.exams
  FOR ALL USING (public.current_user_role() IN ('EXAMINER', 'ADMIN'));

-- Questions: Examiners/Admins full access; Students access questions only through active attempt
CREATE POLICY "Examiners full question access" ON public.questions
  FOR ALL USING (public.current_user_role() IN ('EXAMINER', 'ADMIN'));

CREATE POLICY "Students read assigned questions" ON public.questions
  FOR SELECT USING (
    public.current_user_role() = 'STUDENT' AND
    EXISTS (
      SELECT 1 FROM public.exam_questions eq
      JOIN public.exam_assignments ea ON ea.exam_id = eq.exam_id
      WHERE eq.question_id = questions.id AND ea.student_id = auth.uid()
    )
  );

-- Exam Assignments: Students view own assignments; Examiners view all
CREATE POLICY "Assignments select policy" ON public.exam_assignments
  FOR SELECT USING (student_id = auth.uid() OR public.current_user_role() IN ('EXAMINER', 'ADMIN'));

-- Attempts: Students manage own attempts; Examiners view and review all
CREATE POLICY "Attempts select policy" ON public.attempts
  FOR SELECT USING (student_id = auth.uid() OR public.current_user_role() IN ('EXAMINER', 'ADMIN'));

CREATE POLICY "Attempts student insert own" ON public.attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Attempts update policy" ON public.attempts
  FOR UPDATE USING (student_id = auth.uid() OR public.current_user_role() IN ('EXAMINER', 'ADMIN'));

-- Attempt Answers: Students manage own answers; Examiners view
CREATE POLICY "Answers access policy" ON public.attempt_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.attempts a
      WHERE a.id = attempt_answers.attempt_id AND (a.student_id = auth.uid() OR public.current_user_role() IN ('EXAMINER', 'ADMIN'))
    )
  );

-- Security Events: Students can insert their own events; Examiners can view
CREATE POLICY "Security events insert own" ON public.security_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attempts a
      WHERE a.id = security_events.attempt_id AND (a.student_id = auth.uid() OR public.current_user_role() IN ('EXAMINER', 'ADMIN'))
    )
  );

CREATE POLICY "Security events select policy" ON public.security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.attempts a
      WHERE a.id = security_events.attempt_id AND (a.student_id = auth.uid() OR public.current_user_role() IN ('EXAMINER', 'ADMIN'))
    )
  );

-- Suspicious Episodes, Risk Assessments, AI Investigations: Examiners & Admins only
CREATE POLICY "Episodes examiner only" ON public.suspicious_episodes
  FOR ALL USING (public.current_user_role() IN ('EXAMINER', 'ADMIN'));

CREATE POLICY "Risk assessments examiner only" ON public.risk_assessments
  FOR ALL USING (public.current_user_role() IN ('EXAMINER', 'ADMIN'));

CREATE POLICY "AI investigations examiner only" ON public.ai_investigations
  FOR ALL USING (public.current_user_role() IN ('EXAMINER', 'ADMIN'));

CREATE POLICY "Review decisions examiner only" ON public.review_decisions
  FOR ALL USING (public.current_user_role() IN ('EXAMINER', 'ADMIN'));

CREATE POLICY "Audit logs examiner only" ON public.audit_logs
  FOR ALL USING (public.current_user_role() IN ('EXAMINER', 'ADMIN'));
