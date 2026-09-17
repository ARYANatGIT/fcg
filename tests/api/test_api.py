import sys
from pathlib import Path

# Add root directory to path so Python can find the 'backend' module
sys.path.append(str(Path(__file__).resolve().parents[2]))

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.model_service import model_service
import json
import pandas as pd

# EXPLICITLY load the models for the test environment
model_service.load_models()

# Initialize the test client
client = TestClient(app)

def get_valid_payload():
    """Generates a valid payload dynamically from the saved features."""
    with open("models/model_metadata.json", "r") as f:
        meta = json.load(f)
    features = {feat: 0.0 for feat in meta["features"]}
    return {
        "initialization_time": "2026-01-05 00:00:00",
        "valid_time": "2026-01-10 00:00:00",
        "latitude": 20.0,
        "longitude": 80.0,
        "lead_day": 5,
        "features": features
    }

def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model_loaded"] == True

def test_analyze_endpoint_success():
    payload = get_valid_payload()
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "prediction_and_explanation" in data["data"]
    assert "analogs" in data["data"]
    assert data["metadata"]["data_status"] in ["synthetic", "real_time"]

def test_leakage_protection():
    payload = get_valid_payload()
    payload["features"]["observed_temperature"] = 25.0
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422
    assert "LEAKAGE" in response.json()["detail"]

def test_model_info():
    response = client.get("/api/v1/model")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "feature_count" in data["data"]

def test_features_catalog():
    response = client.get("/api/v1/features")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["data"]["features"]) > 0
    assert "forbidden_features" in data["data"]

def test_predict_endpoint():
    payload = get_valid_payload()
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "calibrated_bust_probability" in data["data"]
    assert "forecast_confidence" in data["data"]
    assert "risk_category" in data["data"]

def test_explain_endpoint():
    payload = get_valid_payload()
    response = client.post("/api/v1/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction_details" in data["data"]
    assert "top_supporting_features" in data["data"]

def test_analogs_endpoint():
    payload = get_valid_payload()
    response = client.post("/api/v1/analogs", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data["data"] or "available" in data["data"]

def test_revisions_endpoint():
    payload = {
        "valid_time": "2026-01-10 00:00:00",
        "latitude": 20.0,
        "longitude": 80.0
    }
    response = client.post("/api/v1/revisions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "revision_available" in data["data"]
    assert "runs" in data["data"]

def test_spatial_grid():
    response = client.get("/api/v1/spatial-grid?lead_day=5")
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["lead_day"] == 5
    assert len(data["data"]["stations"]) > 0
    station = data["data"]["stations"][0]
    assert "bust_probability" in station
    assert "confidence" in station
    assert "risk_category" in station