from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.api_routes import router
from backend.services.model_service import model_service
from backend.config import settings
import logging
from api.main import (
    MODEL_PATH,
    reload_ml_model,
    get_monitored_stations,
    get_latest_prediction,
    get_prediction_history,
    get_air_quality,
    get_ensemble_spread,
    get_marine_flood,
    get_model_performance,
    trigger_retrain,
    reload_model_endpoint,
)

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ForecastGuard bust detection model
    model_service.load_models()
    
    # Load Real-Time LightGBM regression model
    reload_ml_model()
    yield

app = FastAPI(
    title="ForecastGuard AI API",
    description="AI-based forecast bust detection prototype and real-time inference engine.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Operational ForecastGuard routes
app.include_router(router, prefix="/api/v1")

# Multi-Source Real-Time Ingestion & Prediction routes
app.add_api_route("/api/stations", get_monitored_stations, methods=["GET"])
app.add_api_route("/api/latest_prediction", get_latest_prediction, methods=["GET"])
app.add_api_route("/api/prediction_history", get_prediction_history, methods=["GET"])
app.add_api_route("/api/air_quality", get_air_quality, methods=["GET"])
app.add_api_route("/api/ensemble_spread", get_ensemble_spread, methods=["GET"])
app.add_api_route("/api/marine_flood", get_marine_flood, methods=["GET"])
app.add_api_route("/api/model_performance", get_model_performance, methods=["GET"])
app.add_api_route("/api/admin/trigger_retrain", trigger_retrain, methods=["POST"])
app.add_api_route("/api/admin/reload_model", reload_model_endpoint, methods=["GET"])