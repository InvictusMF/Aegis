# Aegis Machine Learning Architecture

**Service Directory:** `ml-service/`  
**Model Name:** `IsolationForest-BehavioralAnomaly`  
**Version:** `v1.0.0`  
**Feature Set:** `v1.0 (16-Dimensional Behavioral Telemetry Vector)`  
**Experiment Tracking:** MLflow

---

## 1. Algorithm Rationale

Aegis employs **Isolation Forest** (scikit-learn) for behavioral anomaly inference.

In examination integrity monitoring:
1. Normal examination behavior occupies a dense cluster characterized by steady dwell time rhythms, rare focus departures, and consistent facial presence.
2. Anomalous telemetry (external reference search, unauthorized assistance, camera occlusion) requires fewer splits to isolate in randomized binary search trees.
3. The algorithm requires zero labeled cheating instances, avoiding the massive label noise inherent to proctoring datasets.

---

## 2. 16-Dimensional Engineered Feature Vector

| Feature Name | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| `focus_loss_frequency` | int | $\ge 0$ | Total number of window blur events |
| `focus_loss_duration_total`| float | $\ge 0.0$ | Cumulative seconds spent outside active exam window |
| `tab_switch_frequency` | int | $\ge 0$ | Total browser visibility change (hidden) events |
| `fullscreen_exit_count` | int | $\ge 0$ | Fullscreen exit departures |
| `answer_change_frequency` | int | $\ge 0$ | Total answer mutation count across all items |
| `avg_dwell_time_seconds` | float | $0 - \infty$ | Mean duration spent per question |
| `dwell_time_variance` | float | $\ge 0.0$ | Variance of dwell times across questions |
| `inactivity_bursts` | int | $\ge 0$ | Occurrences of user inactivity exceeding 45s |
| `rapid_navigation_bursts` | int | $\ge 0$ | Rapid question cycling bursts |
| `camera_interruption_count`| int | $\ge 0$ | MediaStream or device loss count |
| `face_missing_frequency` | int | $\ge 0$ | MediaPipe zero-face detection events (>1.5s) |
| `multiple_faces_count` | int | $\ge 0$ | MediaPipe &gt; 1 face detection events |
| `attention_deviation_frequency` | int | $\ge 0$ | Head yaw/pitch deviation threshold excursions |
| `copy_paste_attempts` | int | $\ge 0$ | Clipboard read/write attempts |
| `suspicious_episode_density`| int | $\ge 0$ | Correlated temporal episode count |
| `tamper_chain_integrity` | float | $0.0 - 1.0$ | SHA-256 evidence chain verification metric |

---

## 3. Training & Inference Pipeline

1. **Training Pipeline (`ml-service/training/train.py`):**
   - Synthesizes 1500 calibration candidates with normal and anomalous parameter distributions.
   - Fits `IsolationForest(n_estimators=100, contamination=0.08)`.
   - Logs model parameters, score distributions, and serialized joblib artifacts with MLflow.
   - Saves model to `ml-service/models/isolation_forest.joblib` and metadata to `ml-service/models/model_metadata.json`.

2. **Inference Service (`ml-service/app/main.py`):**
   - Receives validated feature payloads from Next.js backend via `POST /predict`.
   - Validates service secret `X-Aegis-Secret`.
   - Returns raw decision score and normalized probability score:
     $$\text{Normalized Score} = \text{clip}\left(0.5 - \frac{\text{DecisionFunction}(X)}{0.4}, 0.0, 1.0\right)$$

3. **Graceful Fallback Guarantee:**
   - If the Python microservice is offline or experiencing latency, `lib/ml/client.ts` automatically executes deterministic rule fallback scoring, ensuring 100% exam uptime without service interruptions.

---

## 4. Evaluation Notice

**Prototype evaluation on synthetic behavioral data.**  
All initial calibration figures reflect controlled synthetic parameter variations. Model outputs represent statistical signals for human review prioritization and do not constitute autonomous determinations of academic misconduct.
