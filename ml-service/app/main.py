import os
import json
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from .schemas import FeaturePayload, PredictionResponse, TrainRequest, ModelInfoResponse

app = FastAPI(
    title="Aegis Behavioral Anomaly Detection ML Service",
    version="1.0.0",
    description="Isolation Forest inference and training service for examination behavioral telemetry.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "isolation_forest.joblib")
META_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

MODEL = None
METADATA = {}

def load_artifacts():
    global MODEL, METADATA
    if os.path.exists(MODEL_PATH):
        MODEL = joblib.load(MODEL_PATH)
    if os.path.exists(META_PATH):
        with open(META_PATH, "r") as f:
            METADATA = json.load(f)

load_artifacts()

def verify_secret(credentials: HTTPAuthorizationCredentials = Security(security)):
    expected = os.getenv("ML_SERVICE_SECRET", "aegis-ml-internal-secret-2026")
    if not credentials or credentials.credentials != expected:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid ML service secret")
    return True

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Aegis ML Behavioral Anomaly Service",
        "model_loaded": MODEL is not None,
        "version": "1.0.0",
    }

@app.get("/model/info", response_model=ModelInfoResponse)
def model_info():
    if not MODEL or not METADATA:
        return ModelInfoResponse(
            model_name="IsolationForest-BehavioralAnomaly",
            model_version="v1.0.0",
            feature_version="v1.0",
            features_expected=[],
            training_samples=0,
            contamination=0.08,
            status="uninitialized",
        )
    return ModelInfoResponse(
        model_name=METADATA.get("model_name", "IsolationForest-BehavioralAnomaly"),
        model_version=METADATA.get("model_version", "v1.0.0"),
        feature_version=METADATA.get("feature_version", "v1.0"),
        features_expected=METADATA.get("features_expected", []),
        training_samples=METADATA.get("n_samples", 0),
        contamination=METADATA.get("contamination", 0.08),
        status="ready",
    )

@app.post("/predict", response_model=PredictionResponse)
def predict_anomaly(payload: FeaturePayload, authorized: bool = Depends(verify_secret)):
    global MODEL, METADATA
    if MODEL is None:
        load_artifacts()
    if MODEL is None:
        raise HTTPException(status_code=503, detail="ML model is not yet loaded or trained")

    features_expected = METADATA.get("features_expected", [])
    if not features_expected:
        from ..training.train import FEATURE_NAMES
        features_expected = FEATURE_NAMES

    # Build input vector in strict expected order
    vec = []
    missing = []
    for f in features_expected:
        if f in payload.features:
            vec.append(float(payload.features[f]))
        else:
            missing.append(f)
            vec.append(0.0)

    X = np.array([vec])
    raw_score = float(MODEL.decision_function(X)[0])
    pred = int(MODEL.predict(X)[0]) # -1 for anomaly, 1 for normal

    # Normalize score to [0.0, 1.0] where 1.0 is most anomalous
    # Decision function returns negative for anomalies, positive for normal
    # Typical range ~ [-0.3, 0.3]
    normalized_score = float(np.clip(0.5 - (raw_score / 0.4), 0.0, 1.0))

    return PredictionResponse(
        attempt_id=payload.attempt_id,
        model_name=METADATA.get("model_name", "IsolationForest-BehavioralAnomaly"),
        model_version=METADATA.get("model_version", "v1.0.0"),
        feature_version=payload.feature_version,
        anomaly_score=round(raw_score, 4),
        normalized_score=round(normalized_score, 4),
        is_anomaly=(pred == -1),
        prediction_metadata={
            "features_evaluated": len(features_expected),
            "missing_imputed": missing,
            "raw_decision_value": raw_score,
            "note": "Prototype evaluation on synthetic behavioral data.",
        },
    )

@app.post("/train")
def trigger_training(req: TrainRequest, authorized: bool = Depends(verify_secret)):
    from ..training.train import train_isolation_forest
    meta = train_isolation_forest(
        n_samples=req.num_samples,
        contamination=req.contamination,
        output_dir=MODELS_DIR
    )
    load_artifacts()
    return {"success": True, "metadata": meta}
