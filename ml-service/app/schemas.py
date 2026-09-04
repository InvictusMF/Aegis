from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class FeaturePayload(BaseModel):
    attempt_id: str
    feature_version: str = "v1.0"
    features: Dict[str, float]

class PredictionResponse(BaseModel):
    attempt_id: str
    model_name: str
    model_version: str
    feature_version: str
    anomaly_score: float
    normalized_score: float
    is_anomaly: bool
    prediction_metadata: Dict[str, Any]

class TrainRequest(BaseModel):
    num_samples: int = Field(default=1000, ge=100, le=50000)
    contamination: float = Field(default=0.08, ge=0.01, le=0.5)

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    feature_version: str
    features_expected: list[str]
    training_samples: int
    contamination: float
    status: str
