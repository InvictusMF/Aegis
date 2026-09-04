"""
Aegis ML Behavioral Anomaly Detection Training Pipeline
Model: Isolation Forest
Tracking: MLflow
Dataset: Clearly labeled synthetic exam behavioral telemetry (Prototype evaluation on synthetic behavioral data)
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

FEATURE_NAMES = [
    "focus_loss_frequency",
    "focus_loss_duration_total",
    "tab_switch_frequency",
    "fullscreen_exit_count",
    "answer_change_frequency",
    "avg_dwell_time_seconds",
    "dwell_time_variance",
    "inactivity_bursts",
    "rapid_navigation_bursts",
    "camera_interruption_count",
    "face_missing_frequency",
    "multiple_faces_count",
    "attention_deviation_frequency",
    "copy_paste_attempts",
    "suspicious_episode_density",
    "tamper_chain_integrity",
]

def generate_synthetic_telemetry(n_samples: int = 1500, anomaly_ratio: float = 0.08) -> pd.DataFrame:
    np.random.seed(42)
    n_anomalies = int(n_samples * anomaly_ratio)
    n_normals = n_samples - n_anomalies

    normal_data = {
        "focus_loss_frequency": np.random.poisson(lam=0.4, size=n_normals),
        "focus_loss_duration_total": np.random.exponential(scale=1.5, size=n_normals),
        "tab_switch_frequency": np.random.poisson(lam=0.2, size=n_normals),
        "fullscreen_exit_count": np.random.binomial(n=1, p=0.03, size=n_normals),
        "answer_change_frequency": np.random.poisson(lam=1.2, size=n_normals),
        "avg_dwell_time_seconds": np.random.normal(loc=75.0, scale=15.0, size=n_normals).clip(20, 240),
        "dwell_time_variance": np.random.gamma(shape=2.0, scale=100.0, size=n_normals),
        "inactivity_bursts": np.random.poisson(lam=0.3, size=n_normals),
        "rapid_navigation_bursts": np.random.poisson(lam=0.2, size=n_normals),
        "camera_interruption_count": np.random.binomial(n=1, p=0.02, size=n_normals),
        "face_missing_frequency": np.random.poisson(lam=0.5, size=n_normals),
        "multiple_faces_count": np.zeros(n_normals),
        "attention_deviation_frequency": np.random.poisson(lam=1.5, size=n_normals),
        "copy_paste_attempts": np.zeros(n_normals),
        "suspicious_episode_density": np.zeros(n_normals),
        "tamper_chain_integrity": np.ones(n_normals),
    }

    anomaly_data = {
        "focus_loss_frequency": np.random.poisson(lam=4.5, size=n_anomalies),
        "focus_loss_duration_total": np.random.exponential(scale=22.0, size=n_anomalies).clip(5, 120),
        "tab_switch_frequency": np.random.poisson(lam=3.8, size=n_anomalies),
        "fullscreen_exit_count": np.random.poisson(lam=1.8, size=n_anomalies),
        "answer_change_frequency": np.random.poisson(lam=4.2, size=n_anomalies),
        "avg_dwell_time_seconds": np.random.normal(loc=35.0, scale=20.0, size=n_anomalies).clip(10, 180),
        "dwell_time_variance": np.random.gamma(shape=5.0, scale=400.0, size=n_anomalies),
        "inactivity_bursts": np.random.poisson(lam=2.5, size=n_anomalies),
        "rapid_navigation_bursts": np.random.poisson(lam=3.0, size=n_anomalies),
        "camera_interruption_count": np.random.poisson(lam=1.2, size=n_anomalies),
        "face_missing_frequency": np.random.poisson(lam=5.0, size=n_anomalies),
        "multiple_faces_count": np.random.binomial(n=2, p=0.3, size=n_anomalies),
        "attention_deviation_frequency": np.random.poisson(lam=6.5, size=n_anomalies),
        "copy_paste_attempts": np.random.poisson(lam=1.5, size=n_anomalies),
        "suspicious_episode_density": np.random.poisson(lam=2.2, size=n_anomalies).clip(1, 10),
        "tamper_chain_integrity": np.random.choice([1.0, 0.0], p=[0.9, 0.1], size=n_anomalies),
    }

    df_normal = pd.DataFrame(normal_data)
    df_anomaly = pd.DataFrame(anomaly_data)

    df_combined = pd.concat([df_normal, df_anomaly], ignore_index=True)
    return df_combined.sample(frac=1.0, random_state=42).reset_index(drop=True)

def train_isolation_forest(
    n_samples: int = 1500,
    contamination: float = 0.08,
    output_dir: str = None
) -> dict:
    if output_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(base_dir, "models")

    os.makedirs(output_dir, exist_ok=True)
    df = generate_synthetic_telemetry(n_samples=n_samples, anomaly_ratio=contamination)
    X = df[FEATURE_NAMES].values

    iso_forest = IsolationForest(
        n_estimators=100,
        max_samples="auto",
        contamination=contamination,
        random_state=42,
        n_jobs=1,
    )
    iso_forest.fit(X)

    scores = iso_forest.decision_function(X)
    preds = iso_forest.predict(X)
    n_detected_anomalies = int(np.sum(preds == -1))

    model_path = os.path.join(output_dir, "isolation_forest.joblib")
    joblib.dump(iso_forest, model_path)

    metadata = {
        "model_name": "IsolationForest-BehavioralAnomaly",
        "model_version": "v1.0.0",
        "feature_version": "v1.0",
        "algorithm": "IsolationForest",
        "features_expected": FEATURE_NAMES,
        "n_samples": n_samples,
        "contamination": contamination,
        "n_detected_anomalies": n_detected_anomalies,
        "score_min": float(scores.min()),
        "score_max": float(scores.max()),
        "score_mean": float(scores.mean()),
        "dataset_notice": "Prototype evaluation on synthetic behavioral data.",
    }

    meta_path = os.path.join(output_dir, "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    mlflow_status = {"status": "untracked", "reason": "mlflow not initialized"}
    try:
        import mlflow
        os.environ["MLFLOW_ALLOW_FILE_STORE"] = "true"
        os.environ["MLFLOW_DISABLE_AGENT_HINT"] = "1"
        tracking_dir = os.path.abspath(os.path.join(output_dir, "..", "mlruns"))
        os.makedirs(tracking_dir, exist_ok=True)
        mlflow.set_tracking_uri(f"file:{tracking_dir}")
        mlflow.set_experiment("aegis_behavioral_anomaly")
        with mlflow.start_run(run_name="isolation_forest_v1") as run:
            mlflow.log_params({
                "model": "IsolationForest",
                "n_estimators": 100,
                "contamination": contamination,
                "n_samples": n_samples,
            })
            mlflow.log_metrics({
                "detected_anomalies": n_detected_anomalies,
                "score_mean": float(scores.mean()),
            })
            mlflow.log_artifact(model_path)
            mlflow.log_artifact(meta_path)
            mlflow_status = {
                "status": "tracked",
                "run_id": run.info.run_id,
                "experiment_id": run.info.experiment_id,
            }
    except Exception as e:
        print(f"[MLflow Warning] Tracking degraded or unavailable: {e}", flush=True)
        mlflow_status = {
            "status": "degraded",
            "reason": str(e),
        }

    metadata["mlflow_tracking"] = mlflow_status
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Training successfully completed. Model saved to {model_path}. MLflow: {mlflow_status['status']}", flush=True)
    return metadata

if __name__ == "__main__":
    train_isolation_forest()
