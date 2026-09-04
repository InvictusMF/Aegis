# Aegis — Secure Exams. Trusted Results.

> **Aegis is an AI + Machine Learning powered examination integrity platform that correlates behavioral, browser-security, question-level, and privacy-preserving computer-vision signals into explainable suspicious episodes for human examiner review.**

---

## 1. Problem & Product Philosophy

Traditional online examination proctoring platforms suffer from severe design flaws:
- **Invasive surveillance:** Continuous uploading of raw webcam footage violates candidate privacy (FERPA / GDPR).
- **Black-box alert fatigue:** Examiners are flooded with hundreds of disconnected, context-free false positives (e.g. looking down at scratch paper, accidental mouse slips).
- **Autonomous penalties:** Biased automated software frequently penalizes students without human oversight or due process.

**Aegis re-engineers exam integrity as an explainable intelligence discipline:**
1. **Privacy-First On-Device Vision:** MediaPipe WebAssembly models run client-side in the candidate's browser. Zero raw video frames or webcam streams are ever uploaded to Aegis servers.
2. **Suspicious Episode Correlation:** Instead of isolated alarms, temporal bursts (e.g. *Window Blur &rarr; Tab Departure &rarr; Facial Occlusion &rarr; Answer Modification*) are clustered into unified, explainable episodes.
3. **Unsupervised ML Anomaly Detection:** An Isolation Forest model evaluates multidimensional behavioral features against cohort baselines. It measures behavioral anomaly, not "cheating probability".
4. **Decoupled Risk & Evidence Confidence:** Aegis Risk Index (0–100) is decoupled from Evidence Confidence (`LOW`, `MODERATE`, `HIGH`).
5. **AI Telemetry Synthesis:** Google Gemini synthesizes structured timelines, evaluates plausible innocent alternative hypotheses (e.g. scratch paper, OS popups, room lighting), and advises human examiners.
6. **Mandatory Human-in-the-Loop:** Automated systems never determine academic verdicts. The human examiner renders the final decision with written factual rationale and immutable audit logging.

---

## 2. Production Architecture

```text
                    AEGIS
                      │
             ┌────────▼────────┐
             │    Next.js      │
             │ React + TS      │
             │ App Router      │
             └────────┬────────┘
                      │
             authenticated APIs & Repositories
                      │
             ┌────────▼────────┐
             │    Supabase     │
             │                 │
             │ PostgreSQL      │
             │ Auth            │
             │ RLS (18 tables) │
             │ Realtime        │
             │ Storage         │
             └──────┬─────┬────┘
                    │     │
             ┌──────▼─┐ ┌─▼─────────┐
             │ ML API │ │ Gemini API │
             │FastAPI │ │ server-side│
             │+MLflow │ │  (Zod)    │
             └────────┘ └───────────┘
```

And the end-to-end integrity pipeline:

```text
Candidate Browser (Sandbox + MediaPipe CV)
   ↓
Authenticated APIs & Server-Authoritative Timer
   ↓
Cryptographic Tamper-Evident Hash Chain (SHA-256)
   ↓
Supabase PostgreSQL & Repositories (`services/repositories/*`)
   ↓
16-Dimensional Behavioral Feature Extraction
   ↓
Suspicious Episode Engine (Idempotent Temporal Correlation)
   ↓
ML Behavioral Anomaly Detection (Python FastAPI Isolation Forest)
   ↓
Explainable Aegis Risk Index & Evidence Confidence
   ↓
Supabase Realtime Feed
   ↓
Examiner Operations SOC & Live Monitoring Wall
   ↓
Google Gemini Structured AI Telemetry Investigation
   ↓
Human Examiner Review Decision (With Written Rationale)
   ↓
Immutable Audit Log & Certified Integrity Dossier
```

---

## 3. Technology Stack

- **Frontend & Application Gateway:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Zod.
- **Database & Persistence:** Supabase PostgreSQL with 18 tables, Row Level Security (RLS) policies, indexes, migrations (`supabase/migrations/`), seed scripts (`supabase/seed/`), and local repository fallback.
- **Authentication:** Supabase Auth with SSR session refresh (`middleware.ts`), server-side role resolution (`STUDENT`, `EXAMINER`, `ADMIN`), and labeled DEMO MODE.
- **Computer Vision:** MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) client-side face landmarking and head orientation telemetry.
- **Machine Learning Microservice:** Python 3, FastAPI, scikit-learn (`IsolationForest`), pandas, NumPy, joblib, and MLflow experiment tracking (`ml-service/`).
- **AI Investigation Assistant:** Google Gemini API with strict structured JSON output and server-side Zod validation.
- **Cryptographic Evidence Chain:** SHA-256 tamper-evident hash links verifying telemetry provenance.

---

## 4. Quick Start & Execution Guide

### Prerequisites
- **Node.js:** $\ge 18$ (tested on v24.17.0)
- **Python:** $\ge 3.10$ (tested on v3.14.0)

### 1. Install Dependencies & Build
```bash
# Install Node dependencies
npm install

# Run automated test suite (Node tests & end-to-end pipeline test)
npm test

# Run TypeScript check
npm run typecheck

# Build production bundle
npm run build
```

### 2. Start Python ML Microservice
```bash
cd ml-service

# Train Isolation Forest model with MLflow experiment tracking
python -m training.train

# Run ML unit tests
python -m pytest tests/

# Launch FastAPI microservice (runs on port 8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*(Note: If the ML service is not running, Aegis automatically activates its high-integrity deterministic rule-based fallback with zero downtime.)*

### 3. Launch Aegis Web Application
```bash
# In the root directory:
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 5. Pre-Seeded Demo Accounts & Demo Flow

When `NEXT_PUBLIC_DEMO_MODE=true`, select accounts from the top navigation bar or log in with credentials:

| Role | Name | Email | Scenario / Purpose |
| :--- | :--- | :--- | :--- |
| **Examiner** | Dr. Evelyn Vance | `examiner@aegis.local` | Primary examiner account with full operational access to SOC dashboard, live monitoring, investigations, and adjudication. |
| **Student** | Alex Mercer | `student@aegis.local` | Flagship demo candidate with high-risk telemetry (tab switch, window blur, camera occlusion, answer mutation). |
| **Student** | Marcus Aurelius | `marcus@aegis.local` | Normal focused candidate with low risk score (clean baseline). |
| **Student** | Elena Rostova | `elena@aegis.local` | Previously adjudicated candidate with resolved review status and audit trail. |

---

## 6. Environment Configuration

Copy `.env.example` to `.env.local`:

```ini
# Supabase PostgreSQL (Remote or Local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Aegis ML Microservice
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_SECRET=aegis-ml-internal-secret-2026

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
```

---

## 7. Known Limitations & Responsible AI Notice

- **Synthetic Training Data:** The ML Isolation Forest model is trained on synthetic behavioral distributions (`Prototype evaluation on synthetic behavioral data`). Production deployments require recalibration on institution-specific labeled baselines.
- **Computer Vision Limits:** MediaPipe face tracking runs client-side; performance depends on candidate hardware and ambient lighting. Head movement alone does not establish misconduct.
- **Human Discretion Required:** Automated risk scores and Gemini investigation summaries are advisory tools designed to eliminate false alarms and prioritize examiner attention. They never constitute disciplinary findings on their own.
