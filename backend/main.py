from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.api_routes import router
from backend.services.model_service import model_service
from backend.config import settings
import logging
import asyncio
from api.main import (
    MODEL_PATH,
    reload_ml_model,
    continuous_learning_worker,
    get_monitored_stations,
    get_latest_prediction,
    get_prediction_history,
    get_air_quality,
    get_ensemble_spread,
    get_marine_flood,
    get_model_performance,
    trigger_retrain,
    reload_model_endpoint,
    get_weather_news,
    get_wind_field,
    get_live_station_weather,
    get_windy_config,
    get_windy_forecast,
    chat_endpoint,
    get_chat_session,
    save_chat_session_message,
    delete_chat_session,
    get_openweather_current,
    get_synoptic_regimes,
    get_historical_busts,
    get_whatif_scenarios,
    create_whatif_scenario,
    generate_api_key,
    export_dataset,
)

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safely initialize ForecastGuard bust detection ML artifacts
    try:
        model_service.load_models()
    except Exception as e:
        logging.warning(f"ForecastGuard model service startup warning (non-fatal): {e}")

    # Safely load Real-Time LightGBM regression model
    try:
        reload_ml_model()
    except Exception as e:
        logging.warning(f"LightGBM regression reload warning (non-fatal): {e}")

    # Launch 30-minute automated ingestion & LightGBM model retraining task
    retrain_task = asyncio.create_task(continuous_learning_worker())
    yield
    retrain_task.cancel()

app = FastAPI(
    title="ForecastGuard API",
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

# HTTP Basic Authentication & Cyber Security Defensive Headers Middleware
import base64
import secrets
import json
from fastapi import Request, Response

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "forecastguard_secure_2026")

@app.middleware("http")
async def security_and_auth_middleware(request: Request, call_next):
    # 1. Allow CORS preflight requests
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path
    # Intercept all API endpoints (/api or /api/v1)
    if path.startswith("/api"):
        auth_header = request.headers.get("Authorization")
        authenticated = False

        if auth_header and auth_header.startswith("Basic "):
            try:
                encoded = auth_header.split(" ", 1)[1].strip()
                decoded = base64.b64decode(encoded).decode("utf-8")
                if ":" in decoded:
                    user, pwd = decoded.split(":", 1)
                    if secrets.compare_digest(user.encode("utf-8"), ADMIN_USER.encode("utf-8")) and \
                       secrets.compare_digest(pwd.encode("utf-8"), ADMIN_PASS.encode("utf-8")):
                        authenticated = True
            except Exception:
                authenticated = False
        elif auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            if secrets.compare_digest(token.encode("utf-8"), ADMIN_PASS.encode("utf-8")):
                authenticated = True

        # Check if request is from the frontend web application (e.g. Next.js on port 3000)
        origin = request.headers.get("origin", "")
        referer = request.headers.get("referer", "")
        x_forwarded_host = request.headers.get("x-forwarded-host", "")
        sec_dest = request.headers.get("sec-fetch-dest", "")
        sec_mode = request.headers.get("sec-fetch-mode", "")
        accept_header = request.headers.get("accept", "")

        is_frontend_app = (
            "localhost:3000" in origin or
            "127.0.0.1:3000" in origin or
            "localhost:3000" in referer or
            "127.0.0.1:3000" in referer or
            "localhost:3000" in x_forwarded_host or
            "onrender.com" in origin or
            "onrender.com" in referer or
            "onrender.com" in x_forwarded_host or
            request.headers.get("x-frontend-client") == "forecastguard-web"
        )

        # Allow seamless communication for our frontend client
        if is_frontend_app:
            authenticated = True

        if not authenticated:
            # Only send WWW-Authenticate: Basic challenge when a human navigates directly to the endpoint in browser
            is_direct_browser_nav = (
                sec_dest == "document" or
                sec_mode == "navigate" or
                "text/html" in accept_header
            )
            response_headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*",
            }
            if is_direct_browser_nav:
                response_headers["WWW-Authenticate"] = 'Basic realm="ForecastGuard Secure Meteorological API", charset="UTF-8"'

            return Response(
                status_code=401,
                content=json.dumps({
                    "status": "error",
                    "error": "Unauthorized",
                    "detail": "ForecastGuard Protected API Endpoint. Please provide valid administrative credentials (username: admin)."
                }),
                media_type="application/json",
                headers=response_headers
            )

    response = await call_next(request)

    # 2. Attach Cyber Security Defensive Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "ForecastGuard Meteorological API & Real-Time Inference Engine",
        "version": "2.0.0",
        "endpoints": {
            "api_v1_health": "/api/v1/health",
            "api_health": "/api/health",
            "stations": "/api/stations",
            "latest_prediction": "/api/latest_prediction?station=New Delhi",
            "docs": "/docs"
        },
        "frontend": "http://localhost:3000"
    }

@app.get("/api/health")
def api_health():
    return {"status": "healthy", "service": "ForecastGuard API", "version": "2.0.0"}

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
app.add_api_route("/api/weather_news", get_weather_news, methods=["GET"])
app.add_api_route("/api/wind_field", get_wind_field, methods=["GET"])
app.add_api_route("/api/live_station_weather", get_live_station_weather, methods=["GET"])
app.add_api_route("/api/windy/config", get_windy_config, methods=["GET"])
app.add_api_route("/api/windy/forecast", get_windy_forecast, methods=["GET"])
app.add_api_route("/api/chat", chat_endpoint, methods=["POST"])
app.add_api_route("/api/chat/session", get_chat_session, methods=["GET"])
app.add_api_route("/api/chat/session/save", save_chat_session_message, methods=["POST"])
app.add_api_route("/api/chat/session/delete", delete_chat_session, methods=["POST", "DELETE"])
app.add_api_route("/api/openweather/current", get_openweather_current, methods=["GET"])
app.add_api_route("/api/synoptic_regimes", get_synoptic_regimes, methods=["GET"])
app.add_api_route("/api/historical_busts", get_historical_busts, methods=["GET"])
app.add_api_route("/api/whatif_scenarios", get_whatif_scenarios, methods=["GET"])
app.add_api_route("/api/whatif_scenarios", create_whatif_scenario, methods=["POST"])
app.add_api_route("/api/keys/generate", generate_api_key, methods=["POST"])
app.add_api_route("/api/export/dataset", export_dataset, methods=["GET"])