from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.api_routes import router
from backend.services.model_service import model_service
from backend.config import settings
import logging
import joblib
from api.main import MODEL_PATH, ml_artifacts, get_latest_prediction, get_prediction_history

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ForecastGuard bust detection model
    model_service.load_models()
    
    # Load Real-Time LightGBM regression model for /api/latest_prediction
    if MODEL_PATH.exists():
        bundle = joblib.load(MODEL_PATH)
        ml_artifacts["model"] = bundle["model"]
        ml_artifacts["scaler"] = bundle["scaler"]
        ml_artifacts["features"] = bundle["features"]
        ml_artifacts["metrics"] = bundle.get("metrics", {})
        ml_artifacts["trained_at"] = bundle.get("trained_at")
        logging.info("Real-Time LightGBM regression model loaded successfully.")
    yield

app = FastAPI(
    title="ForecastGuard AI API",
    description="AI-based forecast bust detection prototype and real-time inference engine.",
    version="1.0.0",
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

# Real-Time MongoDB Ingestion & Prediction routes
app.add_api_route("/api/latest_prediction", get_latest_prediction, methods=["GET"])
app.add_api_route("/api/prediction_history", get_prediction_history, methods=["GET"])