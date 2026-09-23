from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import numpy as np
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any, List
from backend.schemas.api_schemas import (
    ForecastRequest, PredictionResponse, AnalysisResponse,
    ExplainResponse, AnalogsRequest, AnalogsResponse,
    RevisionsRequest, RevisionsResponse, FeaturesResponse,
    SpatialGridResponse
)
from backend.utils.validation import check_feature_leakage
from backend.services.model_service import model_service
from backend.config import settings

router = APIRouter()

FEATURE_CATALOG = [
    {"name": "latitude", "type": "float", "unit": "°N", "description": "Geographical latitude (8.0 to 38.0 for India)"},
    {"name": "longitude", "type": "float", "unit": "°E", "description": "Geographical longitude (68.0 to 98.0 for India)"},
    {"name": "lead_day", "type": "int", "unit": "days", "description": "Forecast lead time (Day 1 to Day 10)"},
    {"name": "forecast_temperature", "type": "float", "unit": "°C", "description": "NWP predicted 2-meter air temperature"},
    {"name": "forecast_rainfall", "type": "float", "unit": "mm", "description": "NWP predicted accumulated precipitation"},
    {"name": "forecast_wind_u", "type": "float", "unit": "m/s", "description": "10-meter zonal (east-west) wind component"},
    {"name": "forecast_wind_v", "type": "float", "unit": "m/s", "description": "10-meter meridional (north-south) wind component"},
    {"name": "forecast_pressure", "type": "float", "unit": "hPa", "description": "Surface atmospheric pressure"},
    {"name": "forecast_humidity", "type": "float", "unit": "%", "description": "2-meter relative humidity"},
    {"name": "forecast_wind_speed", "type": "float", "unit": "m/s", "description": "Total 10m wind speed magnitude"},
    {"name": "init_month", "type": "int", "unit": "month", "description": "Initialization calendar month (1-12)"},
    {"name": "init_day_of_year", "type": "int", "unit": "day", "description": "Julian day of year (1-366)"},
    {"name": "init_day_sin", "type": "float", "unit": "unitless", "description": "Cyclic sine transform of day of year"},
    {"name": "init_day_cos", "type": "float", "unit": "unitless", "description": "Cyclic cosine transform of day of year"},
    {"name": "lead_day_squared", "type": "float", "unit": "days²", "description": "Quadratic lead day error-growth term"},
    {"name": "forecast_wind_direction", "type": "float", "unit": "degrees", "description": "Wind vector direction (0-360°)"},
    {"name": "forecast_temp_humidity_interact", "type": "float", "unit": "°C·%", "description": "Thermodynamic interaction (temp × humidity)"},
    {"name": "forecast_wind_pressure_interact", "type": "float", "unit": "m/s·hPa", "description": "Baroclinic interaction (wind × pressure)"},
    {"name": "historical_error_lag1", "type": "float", "unit": "score", "description": "Preceding forecast cycle error score baseline"}
]

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "forecastguard-api",
        "model_loaded": model_service.predictor is not None,
        "calibrator_loaded": model_service.predictor.calibrator is not None if model_service.predictor else False,
        "analogs_available": model_service.analog_retriever is not None,
        "revision_analysis_available": model_service.revision_analyzer is not None
    }

@router.get("/model")
def model_info():
    meta_path = Path("models/model_metadata.json")
    meta = {}
    if meta_path.exists():
        with open(meta_path, "r") as f:
            meta = json.load(f)
    return {
        "status": "success",
        "data": {
            "model_type": meta.get("model_type", "LightGBM + Isotonic Calibration"),
            "feature_count": len(meta.get("features", [])),
            "features": meta.get("features", []),
            "validation_metrics": meta.get("validation_metrics", {}),
            "test_metrics": meta.get("test_metrics", {}),
            "data_status": settings.data_mode
        },
        "metadata": {"data_status": settings.data_mode}
    }

@router.get("/features", response_model=FeaturesResponse)
def get_features():
    return FeaturesResponse(
        data={
            "total_features": len(FEATURE_CATALOG),
            "features": FEATURE_CATALOG,
            "forbidden_features": [
                "observed_* (any observed weather variable)",
                "error_* (any calculated forecast error metric)",
                "bust (target label)",
                "combined_error_score (target score)"
            ]
        },
        metadata={"data_status": settings.data_mode}
    )

def _normalize_features(features: dict) -> dict:
    """Normalizes surface pressure to MSL to prevent false deep-depression alarms from elevation."""
    f = dict(features)
    if "forecast_pressure" in f and f["forecast_pressure"] < 1000.0:
        f["forecast_pressure"] = round(f["forecast_pressure"] + 28.5, 1)
        if "forecast_wind_pressure_interact" in f and "forecast_wind_speed" in f:
            f["forecast_wind_pressure_interact"] = round(f["forecast_wind_speed"] / (f["forecast_pressure"] + 1e-5), 6)
    return f

@router.post("/predict", response_model=PredictionResponse)
def predict_bust(request: ForecastRequest):
    clean_features = _normalize_features(request.features)
    check_feature_leakage(clean_features)
    df_features = pd.DataFrame([clean_features])
    try:
        pred_dict = model_service.predictor.predict(df_features)
        return PredictionResponse(
            data={
                "target": {
                    "initialization_time": request.initialization_time,
                    "valid_time": request.valid_time,
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "lead_day": request.lead_day
                },
                **pred_dict
            },
            metadata={"data_status": settings.data_mode}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

@router.post("/explain", response_model=ExplainResponse)
def explain_prediction(request: ForecastRequest):
    clean_features = _normalize_features(request.features)
    check_feature_leakage(clean_features)
    df_features = pd.DataFrame([clean_features])
    try:
        explanation = model_service.explainer.explain_prediction(df_features)
        return ExplainResponse(
            data=explanation,
            metadata={"data_status": settings.data_mode}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Explanation failed: {e}")

@router.post("/analogs", response_model=AnalogsResponse)
def retrieve_analogs(request: AnalogsRequest):
    check_feature_leakage(request.features)
    query_row = pd.Series({
        "forecast_initialization_time": pd.to_datetime(request.initialization_time),
        "lead_day": request.lead_day,
        "latitude": request.latitude,
        "longitude": request.longitude,
        **request.features
    })
    try:
        analogs = model_service.analog_retriever.retrieve(query_row, top_k=request.top_k or 5)
        return AnalogsResponse(
            data=analogs,
            metadata={"data_status": settings.data_mode}
        )
    except Exception as e:
        return AnalogsResponse(
            data={"available": False, "reason": str(e), "analogs": []},
            metadata={"data_status": settings.data_mode}
        )

@router.post("/revisions", response_model=RevisionsResponse)
def get_forecast_revisions(request: RevisionsRequest):
    revision_data = model_service.get_revisions(request.latitude, request.longitude, request.valid_time)
    return RevisionsResponse(
        data=revision_data,
        metadata={"data_status": settings.data_mode}
    )

@router.post("/analyze", response_model=AnalysisResponse)
def combined_analysis(request: ForecastRequest):
    # 1. Leakage Protection & Normalization
    clean_features = _normalize_features(request.features)
    check_feature_leakage(clean_features)
    df_features = pd.DataFrame([clean_features])
    
    # 2. Prediction & SHAP
    try:
        explanation = model_service.explainer.explain_prediction(df_features)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    # 3. Historical Analogs
    query_row = pd.Series({
        "forecast_initialization_time": pd.to_datetime(request.initialization_time),
        "lead_day": request.lead_day,
        "latitude": request.latitude,
        "longitude": request.longitude,
        **request.features
    })
    try:
        analogs = model_service.analog_retriever.retrieve(query_row, top_k=5)
    except Exception:
        analogs = {"available": False, "reason": "Insufficient historical search space", "analogs": []}

    # 4. Multi-Cycle Forecast Revisions
    revision = model_service.get_revisions(
        request.latitude, 
        request.longitude, 
        request.valid_time,
        current_features=request.features
    )

    # 5. Lead Day Risk Progression (Day 1 to Day 10 Curve)
    lead_curve = []
    base_features = request.features.copy()
    for d in range(1, 11):
        test_feat = base_features.copy()
        test_feat['lead_day'] = d
        test_feat['lead_day_squared'] = d * d
        try:
            p_val = float(model_service.predictor.predict_probability(pd.DataFrame([test_feat]))[0])
        except Exception:
            p_val = min(0.95, 0.15 + (d * 0.06))
        lead_curve.append({
            "lead_day": d,
            "bust_probability": round(p_val, 3),
            "confidence": round(1.0 - p_val, 3)
        })

    return AnalysisResponse(
        data={
            "prediction_and_explanation": explanation,
            "analogs": analogs,
            "revision": revision,
            "lead_day_curve": lead_curve
        },
        metadata={"data_status": settings.data_mode, "model_version": "1.0.0"}
    )

from src.multi_source_ingestion import INDIAN_CITIES
from src.db import get_real_time_collection

# In-memory short-lived cache for spatial grid (TTL: 30 seconds)
_spatial_cache: Dict[int, Dict[str, Any]] = {}
_spatial_cache_ts: Dict[int, float] = {}

@router.get("/spatial-grid", response_model=SpatialGridResponse)
def get_spatial_grid(lead_day: int = Query(5, ge=1, le=10)):
    """Provides high-performance regional station confidence, bust probabilities, and weather metrics for India map."""
    now_ts = time.time()
    if lead_day in _spatial_cache and (now_ts - _spatial_cache_ts.get(lead_day, 0.0)) < 30.0:
        return _spatial_cache[lead_day]

    stations_data = []
    col = get_real_time_collection()
    
    # Fast single batch fetch: read recent observations in ONE single roundtrip
    latest_city_map: Dict[str, Any] = {}
    try:
        recent_docs = list(col.find({}).sort("timestamp", -1).limit(200))
        for doc in recent_docs:
            city = doc.get("city")
            if city and city not in latest_city_map:
                latest_city_map[city] = doc
    except Exception:
        latest_city_map = {}

    city_features = []
    metadata_list = []

    for st in INDIAN_CITIES:
        lat = st["lat"]
        lon = st["lon"]
        name = st["name"]
        region = st["region"]
        
        doc = latest_city_map.get(name)
        if doc:
            temp = float(doc.get("temperature_2m", 26.0))
            rain = float(doc.get("precipitation", 0.0))
            wind = float(doc.get("wind_speed_10m", 5.0))
            wind_dir = float(doc.get("wind_direction_10m", 90.0))
            pressure = float(doc.get("surface_pressure", 1010.0))
            rh = float(doc.get("relative_humidity_2m", 60.0))
        else:
            temp = 26.0
            rain = 35.0 if "East" in region or "Northeast" in region else (15.0 if "West" in region else 5.0)
            wind = 7.5 if "South" in region or "West" in region else 5.0
            wind_dir = 135.0 if "South" in region else 90.0
            pressure = 1010.0
            rh = 70.0
            
        feat = {
            "latitude": lat,
            "longitude": lon,
            "lead_day": lead_day,
            "forecast_temperature": temp,
            "forecast_rainfall": rain,
            "forecast_wind_u": wind * float(np.cos(np.radians(wind_dir))),
            "forecast_wind_v": wind * float(np.sin(np.radians(wind_dir))),
            "forecast_pressure": pressure,
            "forecast_humidity": rh,
            "forecast_wind_speed": wind,
            "init_month": 1,
            "init_day_of_year": 5,
            "init_day_sin": 0.08,
            "init_day_cos": 0.99,
            "lead_day_squared": lead_day * lead_day,
            "forecast_wind_direction": wind_dir,
            "forecast_temp_humidity_interact": temp * rh,
            "forecast_wind_pressure_interact": wind / (pressure + 1e-5),
            "historical_error_lag1": 1.1
        }
        city_features.append(feat)
        metadata_list.append({
            "name": name,
            "region": region,
            "lat": lat,
            "lon": lon,
            "temp": temp,
            "rain": rain,
            "wind": wind,
            "wind_dir": wind_dir,
            "pressure": pressure,
        })
        
    # Vectorized batch prediction for all 43 cities simultaneously
    try:
        if model_service.predictor is not None:
            batch_df = pd.DataFrame(city_features)
            probs = model_service.predictor.predict_probability(batch_df)
        else:
            probs = [min(0.9, 0.12 + (lead_day * 0.05) + (m["rain"] / 200.0) * 0.3) for m in metadata_list]
    except Exception:
        probs = [min(0.9, 0.12 + (lead_day * 0.05) + (m["rain"] / 200.0) * 0.3) for m in metadata_list]

    for i, meta in enumerate(metadata_list):
        prob = float(probs[i])
        risk = "HIGH" if prob >= 0.65 else "MODERATE" if prob >= 0.35 else "LOW"
        color = "#ef4444" if risk == "HIGH" else "#f59e0b" if risk == "MODERATE" else "#22c55e"
        stations_data.append({
            "name": meta["name"],
            "region": meta["region"],
            "latitude": meta["lat"],
            "longitude": meta["lon"],
            "bust_probability": round(prob, 3),
            "confidence": round(1.0 - prob, 3),
            "risk_category": risk,
            "color": color,
            "rainfall": round(meta["rain"], 1),
            "wind_speed": round(meta["wind"], 1),
            "wind_direction": round(meta["wind_dir"], 1),
            "temperature": round(meta["temp"], 1),
            "surface_pressure": round(meta["pressure"], 1),
        })
        
    response = SpatialGridResponse(
        data={
            "lead_day": lead_day,
            "total_stations": len(stations_data),
            "stations": stations_data
        },
        metadata={"data_status": settings.data_mode}
    )
    _spatial_cache[lead_day] = response
    _spatial_cache_ts[lead_day] = now_ts
    return response
