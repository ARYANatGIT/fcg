from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import numpy as np
import json
from pathlib import Path
from typing import Optional
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

@router.post("/predict", response_model=PredictionResponse)
def predict_bust(request: ForecastRequest):
    check_feature_leakage(request.features)
    df_features = pd.DataFrame([request.features])
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
    check_feature_leakage(request.features)
    df_features = pd.DataFrame([request.features])
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
    # 1. Leakage Protection
    check_feature_leakage(request.features)
    df_features = pd.DataFrame([request.features])
    
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

KEY_STATIONS = [
    {"name": "New Delhi", "region": "North", "latitude": 28.6, "longitude": 77.2},
    {"name": "Srinagar", "region": "North", "latitude": 34.1, "longitude": 74.8},
    {"name": "Amritsar", "region": "North", "latitude": 31.6, "longitude": 74.9},
    {"name": "Jaipur", "region": "West", "latitude": 26.9, "longitude": 75.8},
    {"name": "Ahmedabad", "region": "West", "latitude": 23.0, "longitude": 72.6},
    {"name": "Mumbai", "region": "West", "latitude": 19.1, "longitude": 72.9},
    {"name": "Pune", "region": "West", "latitude": 18.5, "longitude": 73.9},
    {"name": "Nagpur", "region": "Central", "latitude": 21.1, "longitude": 79.1},
    {"name": "Bhopal", "region": "Central", "latitude": 23.3, "longitude": 77.4},
    {"name": "Raipur", "region": "Central", "latitude": 21.3, "longitude": 81.6},
    {"name": "Bhubaneswar", "region": "East", "latitude": 20.3, "longitude": 85.8},
    {"name": "Kolkata", "region": "East", "latitude": 22.6, "longitude": 88.4},
    {"name": "Patna", "region": "East", "latitude": 25.6, "longitude": 85.1},
    {"name": "Bengaluru", "region": "South", "latitude": 12.9, "longitude": 77.6},
    {"name": "Chennai", "region": "South", "latitude": 13.1, "longitude": 80.3},
    {"name": "Hyderabad", "region": "South", "latitude": 17.4, "longitude": 78.5},
    {"name": "Thiruvananthapuram", "region": "South", "latitude": 8.5, "longitude": 76.9},
    {"name": "Guwahati", "region": "Northeast", "latitude": 26.2, "longitude": 91.7},
    {"name": "Shillong", "region": "Northeast", "latitude": 25.6, "longitude": 91.9}
]

@router.get("/spatial-grid", response_model=SpatialGridResponse)
def get_spatial_grid(lead_day: int = Query(5, ge=1, le=10)):
    """Provides regional station confidence and bust probabilities for India map."""
    stations_data = []
    
    # Standard baseline features for spatial evaluation
    for st in KEY_STATIONS:
        lat = st["latitude"]
        lon = st["longitude"]
        
        # Spatial weather variability
        rain_val = 45.0 if st["region"] in ["East", "Northeast"] else 15.0 if st["region"] == "West" else 20.0
        wind_val = 7.5 if st["region"] in ["South", "West"] else 4.5
        
        dummy_feat = {
            "latitude": lat,
            "longitude": lon,
            "lead_day": lead_day,
            "forecast_temperature": 26.0,
            "forecast_rainfall": rain_val,
            "forecast_wind_u": wind_val * 0.7,
            "forecast_wind_v": wind_val * 0.7,
            "forecast_pressure": 1010.0,
            "forecast_humidity": 75.0,
            "forecast_wind_speed": wind_val,
            "init_month": 1,
            "init_day_of_year": 5,
            "init_day_sin": 0.08,
            "init_day_cos": 0.99,
            "lead_day_squared": lead_day * lead_day,
            "forecast_wind_direction": 45.0,
            "forecast_temp_humidity_interact": 26.0 * 75.0,
            "forecast_wind_pressure_interact": wind_val * 1010.0,
            "historical_error_lag1": 1.1
        }
        
        try:
            prob = float(model_service.predictor.predict_probability(pd.DataFrame([dummy_feat]))[0])
        except Exception:
            prob = min(0.9, 0.18 + (lead_day * 0.06))
            
        risk = "HIGH" if prob >= 0.65 else "MODERATE" if prob >= 0.35 else "LOW"
        
        stations_data.append({
            "name": st["name"],
            "region": st["region"],
            "latitude": lat,
            "longitude": lon,
            "bust_probability": round(prob, 3),
            "confidence": round(1.0 - prob, 3),
            "risk_category": risk,
            "color": "#ef4444" if risk == "HIGH" else "#f59e0b" if risk == "MODERATE" else "#10b981"
        })
        
    return SpatialGridResponse(
        data={
            "lead_day": lead_day,
            "total_stations": len(stations_data),
            "stations": stations_data
        },
        metadata={"data_status": settings.data_mode}
    )
