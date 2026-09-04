# Aegis Technical Architecture

**Tagline:** Secure Exams. Trusted Results.  
**Platform Category:** Examination Integrity Intelligence & Human Review Platform

---

## 1. System Architecture Diagram

```text
[ Candidate Browser ]
   │
   ├─► MediaPipe Vision (Local wasm - Face Presence, Orientation, Multi-Face)
   ├─► Browser Telemetry (Visibility, Blur/Focus, Fullscreen, Copy/Paste)
   ├─► Server-Authoritative Timer & Autosave Engine
   │
   ▼  POST /api/attempts/:id/events
[ Next.js API & Services Gateway ]
   │
   ├─► 1. Cryptographic Hash Chaining (SHA-256 prev_hash + payload)
   ├─► 2. Database Persistence (Supabase PostgreSQL / Local Fallback Store)
   ├─► 3. Behavioral Feature Vector Extractor (16-dim Normalized Features)
   ├─► 4. Suspicious Episode Correlation Engine (Temporal Sliding Window)
   ├─► 5. Python ML Anomaly Service (FastAPI + Isolation Forest + MLflow)
   ├─► 6. Explainable Risk & Evidence Confidence Engine (Difficulty Context & Decay)
   │
   ├─► Realtime Push (Server-Sent Events / Supabase Realtime)
   │      │
   │      ▼
   │   [ Examiner Operations SOC & Live Monitoring Wall ]
   │
   ▼  Examiner Triggers Investigation
[ Google Gemini Structured AI Assistant ]
   │
   ├─► Server-Side Structured Analysis (Strict Zod Schema Validation)
   ├─► Plausible Alternative Explanations Synthesis
   │
   ▼
[ Human-in-the-Loop Review Workspace ]
   │
   ├─► Examiner Adjudication (NO_ACTION, NEEDS_MORE_REVIEW, POLICY_VIOLATION, DISMISSED)
   ├─► Mandatory Written Rationale
   ├─► Immutable Audit Log
   │
   ▼
[ Certified Examination Integrity Dossier ]
```

---

## 2. Core Service Components

### 2.1 Security Event Ingestion Service (`services/event-service`)
Receives discrete events from student browser sandboxes and local computer-vision workers.
- Verifies server-authoritative attempt duration.
- Generates SHA-256 tamper-evident hash links: `curr_hash = sha256(prev_hash : payload)`.
- Updates candidate activity timestamp.
- Dispatches event to feature extraction and episode correlation.

### 2.2 Suspicious Episode Engine (`services/episode-service`)
Solves the "alert fatigue" problem by grouping clustered security events within rolling temporal windows (e.g. 20 seconds).
- Correlates sequences like `WINDOW_BLUR -> TAB_SWITCH -> FACE_MISSING -> WINDOW_FOCUS -> ANSWER_CHANGED`.
- Derives episode severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), evidence confidence, and points to the specific question item.

### 2.3 Python ML Microservice (`ml-service/`)
- Built with **FastAPI**, **scikit-learn**, **pandas**, and **MLflow**.
- Algorithm: **Isolation Forest** unsupervised anomaly detector.
- Features: 16 behavioral features including dwell time variance, focus departure duration, and camera interruption bursts.
- Exposes: `/health`, `/model/info`, `/predict`, `/train`.

### 2.4 Explainable Risk & Evidence Confidence Engine (`services/risk-service`)
- Risk is a deterministic prioritization score (0–100), not an automated cheating verdict.
- Considers question difficulty context: intellectual pause on a hard question is discounted.
- Decays isolated alerts over time.
- Decouples Risk from **Evidence Confidence** (Low, Moderate, High) based on multi-source corroboration.

### 2.5 Gemini Investigation Assistant (`lib/ai/gemini.ts`)
- Server-side integration with Google Gemini.
- Enforces strict impartial prompt guidelines: never invent events, distinguish facts from interpretations, and highlight innocent alternative explanations.
- Validates returned structured JSON with Zod.

### 2.6 Human-in-the-Loop Adjudication
- Consequential decisions belong solely to the human examiner.
- Requires explicit written rationale and logs immutable audit records.
