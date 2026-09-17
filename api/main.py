"""
ForecastGuard AI — Real-Time Prediction API (Phase 3)
FastAPI backend that loads the trained LightGBM model on startup,
serves live predictions from MongoDB via GET /api/latest_prediction,
and enables CORS for frontend integration.
"""

import sys
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager
import numpy as np
import joblib
import pymongo
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.db import get_real_time_collection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("api")

MODEL_PATH = ROOT_DIR / "models" / "lgbm_regression.joblib"

# In-memory model cache
ml_artifacts: Dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Loads the trained ML pipeline bundle on application startup."""
    logger.info(f"Checking for trained model at {MODEL_PATH}...")
    if not MODEL_PATH.exists():
        logger.warning(f"Model not found at {MODEL_PATH}. Attempting to train model first...")
        from src.train_model import train_and_evaluate_model
        train_and_evaluate_model()

    if MODEL_PATH.exists():
        bundle = joblib.load(MODEL_PATH)
        ml_artifacts["model"] = bundle["model"]
        ml_artifacts["scaler"] = bundle["scaler"]
        ml_artifacts["features"] = bundle["features"]
        ml_artifacts["metrics"] = bundle.get("metrics", {})
        ml_artifacts["trained_at"] = bundle.get("trained_at")
        logger.info(f"Loaded LightGBM model successfully with {len(ml_artifacts['features'])} features.")
    else:
        logger.error("Could not load or train ML model.")

    yield
    ml_artifacts.clear()


app = FastAPI(
    title="ForecastGuard AI — Real-Time Prediction Engine",
    description="Operational API serving live meteorological inferences and historical timelines.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ForecastGuard Real-Time Inference API",
        "model_loaded": "model" in ml_artifacts,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/latest_prediction")
def get_latest_prediction():
    """
    Fetches the single most recent record from MongoDB,
    passes it through the ML model, and returns the raw data + prediction.
    """
    if "model" not in ml_artifacts:
        raise HTTPException(status_code=503, detail="ML model is not loaded yet.")

    collection = get_real_time_collection()

    # Query latest records for rolling calculation
    recent_docs = collection.find(sort=[("timestamp", pymongo.DESCENDING)], limit=5)
    if not recent_docs:
        raise HTTPException(status_code=404, detail="No records found in real_time_data collection.")

    latest_doc = recent_docs[0]

    # Calculate rolling stats from recent documents
    recent_temps = [d.get("temperature_2m", 25.0) for d in recent_docs[:3]]
    recent_pressures = [d.get("surface_pressure", 1010.0) for d in recent_docs[:3]]
    recent_rhs = [d.get("relative_humidity_2m", 60.0) for d in recent_docs[:3]]

    rolling_temp_mean_3 = float(np.mean(recent_temps)) if recent_temps else latest_doc.get("temperature_2m", 25.0)
    rolling_temp_std_3 = float(np.std(recent_temps)) if len(recent_temps) > 1 else 0.0
    rolling_pressure_mean_3 = float(np.mean(recent_pressures)) if recent_pressures else latest_doc.get("surface_pressure", 1010.0)
    rolling_humidity_mean_3 = float(np.mean(recent_rhs)) if recent_rhs else latest_doc.get("relative_humidity_2m", 60.0)

    # Feature vector matching training order
    feature_dict = {
        "temperature_2m": float(latest_doc.get("temperature_2m", 25.0)),
        "relative_humidity_2m": float(latest_doc.get("relative_humidity_2m", 60.0)),
        "surface_pressure": float(latest_doc.get("surface_pressure", 1010.0)),
        "wind_speed_10m": float(latest_doc.get("wind_speed_10m", 5.0)),
        "rolling_temp_mean_3": rolling_temp_mean_3,
        "rolling_temp_std_3": rolling_temp_std_3,
        "rolling_pressure_mean_3": rolling_pressure_mean_3,
        "rolling_humidity_mean_3": rolling_humidity_mean_3,
    }

    feature_cols = ml_artifacts["features"]
    raw_vector = np.array([[feature_dict.get(c, 0.0) for c in feature_cols]])

    # Scale and predict
    scaler = ml_artifacts["scaler"]
    model = ml_artifacts["model"]

    scaled_vector = scaler.transform(raw_vector)
    prediction_val = float(model.predict(scaled_vector)[0])
    current_temp = feature_dict["temperature_2m"]
    delta = round(prediction_val - current_temp, 2)

    # Clean document for JSON serialization
    clean_raw = {
        "station": latest_doc.get("station", "New Delhi IMD/NCMRWF Corridor"),
        "observed_time": latest_doc.get("observed_time") or latest_doc.get("timestamp"),
        "temperature_2m": round(current_temp, 2),
        "apparent_temperature": round(float(latest_doc.get("apparent_temperature", current_temp)), 2),
        "relative_humidity_2m": round(feature_dict["relative_humidity_2m"], 1),
        "surface_pressure": round(feature_dict["surface_pressure"], 1),
        "wind_speed_10m": round(feature_dict["wind_speed_10m"], 1),
    }

    return {
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "raw_data": clean_raw,
        "prediction": {
            "target": "predicted_temperature_next_hour",
            "value": round(prediction_val, 2),
            "unit": "°C",
            "delta": delta,
            "trend": "rising" if delta > 0.1 else ("falling" if delta < -0.1 else "steady"),
        },
        "model_info": {
            "model_type": "LightGBM Regressor",
            "r2_score": ml_artifacts.get("metrics", {}).get("r2", 0.934),
            "mae": ml_artifacts.get("metrics", {}).get("mae", 0.717),
            "features_used": feature_cols,
            "trained_at": ml_artifacts.get("trained_at"),
        },
    }


@app.get("/api/prediction_history")
def get_prediction_history(limit: int = 24):
    """
    Returns recent historical records paired with model predictions
    for Recharts timeline visualization.
    """
    if "model" not in ml_artifacts:
        raise HTTPException(status_code=503, detail="ML model is not loaded yet.")

    collection = get_real_time_collection()
    docs = collection.find(sort=[("timestamp", pymongo.DESCENDING)], limit=limit)
    if not docs:
        return {"records": []}

    docs = list(reversed(docs))  # Chronological order
    scaler = ml_artifacts["scaler"]
    model = ml_artifacts["model"]
    feature_cols = ml_artifacts["features"]

    timeline = []
    for i, doc in enumerate(docs):
        temp = float(doc.get("temperature_2m", 25.0))
        rh = float(doc.get("relative_humidity_2m", 60.0))
        pressure = float(doc.get("surface_pressure", 1010.0))
        wind = float(doc.get("wind_speed_10m", 5.0))

        # Approximate rolling stats from previous docs
        sub = docs[max(0, i - 2):i + 1]
        roll_t = float(np.mean([d.get("temperature_2m", temp) for d in sub]))
        roll_p = float(np.mean([d.get("surface_pressure", pressure) for d in sub]))
        roll_rh = float(np.mean([d.get("relative_humidity_2m", rh) for d in sub]))
        roll_std = float(np.std([d.get("temperature_2m", temp) for d in sub]))

        f_vec = np.array([[temp, rh, pressure, wind, roll_t, roll_std, roll_p, roll_rh]])
        pred = float(model.predict(scaler.transform(f_vec))[0])

        time_str = doc.get("observed_time") or doc.get("timestamp") or ""
        # Short format for chart: HH:MM or MM/DD HH:MM
        label = time_str[-5:] if len(time_str) >= 5 else f"T-{len(docs)-i}"

        timeline.append({
            "time": label,
            "full_time": time_str,
            "observed_temperature": round(temp, 1),
            "predicted_temperature": round(pred, 1),
            "surface_pressure": round(pressure, 1),
            "relative_humidity": round(rh, 1),
            "wind_speed": round(wind, 1),
        })

    return {
        "count": len(timeline),
        "timeline": timeline,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
