import pytest
import os
import joblib
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
AUTH_HEADER = {"Authorization": "Bearer aegis-ml-internal-secret-2026"}

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_model_info():
    res = client.get("/model/info")
    assert res.status_code == 200
    data = res.json()
    assert data["model_name"] == "IsolationForest-BehavioralAnomaly"
    assert len(data["features_expected"]) == 16
    assert data["status"] == "ready"

def test_predict_unauthorized():
    res = client.post("/predict", json={"attempt_id": "test", "feature_version": "v1.0", "features": {}})
    assert res.status_code == 401

def test_predict_normal_behavior():
    payload = {
        "attempt_id": "att-normal",
        "feature_version": "v1.0",
        "features": {
            "focus_loss_frequency": 0,
            "focus_loss_duration_total": 0.0,
            "tab_switch_frequency": 0,
            "fullscreen_exit_count": 0,
            "answer_change_frequency": 1,
            "avg_dwell_time_seconds": 65.0,
            "dwell_time_variance": 50.0,
            "inactivity_bursts": 0,
            "rapid_navigation_bursts": 0,
            "camera_interruption_count": 0,
            "face_missing_frequency": 0,
            "multiple_faces_count": 0,
            "attention_deviation_frequency": 1,
            "copy_paste_attempts": 0,
            "suspicious_episode_density": 0,
            "tamper_chain_integrity": 1.0,
        },
    }
    res = client.post("/predict", json=payload, headers=AUTH_HEADER)
    assert res.status_code == 200
    data = res.json()
    assert data["attempt_id"] == "att-normal"
    assert data["normalized_score"] <= 0.65
    assert data["prediction_metadata"]["features_missing"] == 0
    assert data["prediction_metadata"]["feature_confidence"] == "HIGH"

def test_predict_missing_feature_handling():
    # Only providing 3 features, rest should be safely imputed
    payload = {
        "attempt_id": "att-sparse",
        "feature_version": "v1.0",
        "features": {
            "focus_loss_frequency": 2,
            "tab_switch_frequency": 1,
            "tamper_chain_integrity": 1.0,
        },
    }
    res = client.post("/predict", json=payload, headers=AUTH_HEADER)
    assert res.status_code == 200
    data = res.json()
    assert data["prediction_metadata"]["features_missing"] > 0
    assert "avg_dwell_time_seconds" in data["prediction_metadata"]["missing_imputed"]
