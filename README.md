# Aegis — Secure Exams. Trusted Results.

> **Aegis is an AI + Machine Learning powered examination integrity platform that correlates behavioral, browser-security, question-level, and privacy-preserving computer-vision signals into explainable suspicious episodes for human examiner review.**

---

## 1. Problem & Product Philosophy

Traditional online examination proctoring platforms suffer from severe design flaws:
- **Invasive surveillance:** Continuous uploading of raw webcam footage violates candidate privacy (FERPA / GDPR).
- **Black-box alert fatigue:** Examiners are flooded with hundreds of disconnected, context-free false positives (e.g. looking down at scratch paper, accidental mouse slips).
- **Autonomous penalties:** Biased automated software frequently penalizes students without human oversight or due process.

**Aegis re-engineers exam integrity as an explainable intelligence discipline:**
1. **Privacy-First On-Device Vision:** MediaPipe WebAssembly models run client-side. Zero raw video frames are uploaded to Aegis servers.
2. **Suspicious Episode Correlation:** Instead of isolated alarms, temporal bursts (e.g. *Window Blur &rarr; Tab Departure &rarr; Facial Occlusion &rarr; Answer Modification*) are clustered into explainable episodes.
3. **Unsupervised ML Anomaly Detection:** An Isolation Forest model evaluates multidimensional behavioral features against cohort baselines.
4. **Decoupled Risk & Evidence Confidence:** The system separates *how concerning a pattern is* from *how conclusive the evidence is*.
5. **AI Telemetry Synthesis:** Google Gemini synthesizes structured timelines, considers innocent alternative hypotheses, and advises examiners.
6. **Mandatory Human-in-the-Loop:** Automated systems never determine academic verdicts. The human examiner renders the final decision with written factual rationale.

---

## 2. The Non-Negotiable Operational Chain

```text
Candidate (Browser Sandbox + MediaPipe CV)
  │
  ├─► Security Event Ingestion (SHA-256 Cryptographic Hash Chain)
  ├─► Database Persistence (Supabase PostgreSQL / Local Fallback Store)
  ├─► 16-Dimensional Behavioral Feature Extraction
  ├─► Suspicious Episode Correlation Engine (Temporal Sliding Window)
  ├─► ML Anomaly Inference (Python FastAPI Isolation Forest + MLflow)
  ├─► Explainable Risk Assessment (Question Difficulty Mitigation & Decay)
  │
  ├─► Realtime Push (Server-Sent Events / Supabase Realtime)
  │      ▼
  │   Examiner Operations SOC & Live Monitoring Wall
  │
  ├─► Google Gemini Structured AI Telemetry Investigation
  ├─► Human Examiner Review Determination (NO_ACTION, NEEDS_MORE_REVIEW, POLICY_VIOLATION, DISMISSED)
  └─► Certified Tamper-Evident Integrity Dossier
```

---

## 3. Technology Stack

- **Frontend & Application Gateway:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Zod.
- **Database & Persistence:** Supabase PostgreSQL with Row Level Security (RLS) policies, indexes, migrations (`supabase/migrations/`), seed scripts (`supabase/seed/`), and local persistence adapter.
- **Computer Vision:** MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) client-side face landmarking and orientation telemetry.
- **Machine Learning Microservice:** Python 3, FastAPI, scikit-learn (`IsolationForest`), pandas, NumPy, joblib, and MLflow experiment tracking (`ml-service/`).
- **AI Investigation Assistant:** Google Gemini API with strict structured JSON output and server-side Zod validation.
- **Cryptographic Evidence Chain:** SHA-256 tamper-evident hash links verifying telemetry provenance.

---

## 4. Quick Start & Execution Guide

### Prerequisites
- Node.js $\ge 18$
- Python $\ge 3.10$

### 1. Install & Build
```bash
# Install Next.js dependencies
npm install

# Run automated tests
npm test

# Run TypeScript check
npm run typecheck

# Build production bundle
npm run build
```

### 2. Start Python ML Microservice (Optional but Recommended)
```bash
# Train or verify Isolation Forest model
python ml-service/training/train.py

# Launch FastAPI microservice (runs on port 8000)
python -m uvicorn ml-service.app.main:app --host 127.0.0.1 --port 8000
```
*(Note: If the ML service is not running, Aegis automatically activates its high-integrity deterministic rule-based fallback with zero downtime.)*

### 3. Launch Aegis Web Application
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 5. Pre-Seeded Demo Accounts

Switch users seamlessly using the top-right user selector:

| User | Role | Persona & Significance |
| :--- | :--- | :--- |
| **Dr. Evelyn Vance** | `EXAMINER` | Chief Examiner. Access to Operations Dashboard, Live Monitoring Wall, and Investigation Workspaces. |
| **Alex Mercer** | `STUDENT` | **Flagship Demo Candidate.** Has active attempt with correlated focus loss, tab switch, camera occlusion, and Q2 answer change. |
| **Marcus Aurelius** | `STUDENT` | Normal baseline candidate with clean, uninterrupted telemetry. |
| **Elena Rostova** | `STUDENT` | Submitted candidate with resolved high-risk policy violation. |
| **Chief Proctor** | `ADMIN` | System administrator. |

---

## 6. Live Presentation Demo Flow (2–5 Minutes)

1. **Open Examiner Operations (`/examiner`):** View aggregate metrics, high-risk queue, and live telemetry ingestion stream.
2. **Open Live Monitoring Wall (`/examiner/live`):** View candidate cards with privacy-preserving radar indicators.
3. **Open Alex Mercer Investigation (`/examiner/investigate/at000000-0000-0000-0000-000000000002`):**
   - Inspect **Explainable Risk** (78 / 100) vs **Evidence Confidence** (MODERATE).
   - View **Suspicious Episode** grouping 5 events into a single explainable 18-second cluster.
   - Inspect **Question Behavior Matrix** showing anomaly localized to Question 2.
   - Inspect **ML Isolation Forest** placing the session in the 96th percentile outlier band.
   - Inspect **Aegis Evidence Graph** mapping candidate &rarr; events &rarr; episode &rarr; ML &rarr; risk &rarr; decision.
   - Review **Gemini AI Investigation** analyzing plausible innocent alternative explanations.
   - Make an authoritative **Examiner Review Decision** with mandatory rationale.
4. **Inspect Official Integrity Report (`/examiner/report/at000000-0000-0000-0000-000000000002`):**
   - Click **Print / Save PDF** to generate an authenticated examination integrity dossier.
5. **Interactive Attack Lab (`/examiner/attack-lab`):**
   - Select candidate and click **Simulate Suspicious Sequence** to observe events flowing live through the backend pipeline into the examiner dashboard!

---

## 7. Ethical Disclosure & Scientific Limitations

- **Browser Events:** Browser sandboxing APIs can be influenced by OS notifications or hardware configurations.
- **Camera Telemetry:** Head orientation or momentary gaze shifts do not equal cheating; they are contextual signals.
- **Synthetic Data Disclaimer:** Initial prototype model evaluation was conducted on clearly documented synthetic behavioral telemetry.
- **Human Authority:** AI and ML algorithms in Aegis are strictly advisory. Final determinations of academic integrity require human evaluation.
