# ForecastGuard

## Operational Medium-Range NWP Forecast Bust Detection & Spatial Risk Intelligence

ForecastGuard is an operational meteorological artificial intelligence system developed for the National Centre for Medium Range Weather Forecasting (NCMRWF), Ministry of Earth Sciences (MoES), Government of India. The platform provides real-time verification, bust probability forecasting, and explainable feature attribution for numerical weather prediction (NWP) models across India.

---

## 1. System Overview

Medium-range numerical weather prediction models (such as NCUM 9km and global ensemble systems) generate forecasts from Day 1 to Day 10. While skillful during normal synoptic conditions, these forecasts are prone to large, sudden degradations in accuracy—termed **forecast busts**—during rapidly developing convective, cyclonic, or monsoon transition regimes:

- Monsoon depressions and low-pressure systems over the Bay of Bengal and Arabian Sea.
- Active-break monsoon transitions and intra-seasonal oscillations.
- Localized convective downpours, cloudbursts, and extreme precipitation events.
- Western disturbances affecting the Western Himalayas and northern plains.
- Pre-monsoon squall lines, heatwaves, and cyclonic storm tracks.

ForecastGuard provides an explainable reliability layer:
- **NWP models predict atmospheric state variables.**
- **ForecastGuard computes the conditional probability that an NWP forecast will fail (bust) at lead times from Day 1 to Day 10.**

---

## 2. System Architecture

```
[ In-Situ Observations ]   [ Global NWP Ensembles ]   [ Atmospheric Radar & Satellite ]
  (IMD AWS / OpenWeather)      (NCUM 9km / ECMWF / GFS)          (Windy API / INSAT-3D)
            │                            │                               │
            └────────────────────────────┼───────────────────────────────┘
                                         ▼
                 ┌──────────────────────────────────────────────┐
                 │          FastAPI Ingestion & ETL             │
                 │   Rate-Controlled Multi-Source Sync          │
                 └──────────────────────┬───────────────────────┘
                                        ▼
                 ┌──────────────────────────────────────────────┐
                 │       Inference & Calibration Engine         │
                 │   LightGBM + XGBoost Probability Models      │
                 │   Real-time SHAP Factor Attribution          │
                 │   Continuous Learning (30-Minute Cycle)      │
                 └──────────────────────┬───────────────────────┘
                                        ▼
                 ┌──────────────────────────────────────────────┐
                 │          Next.js Operational Deck            │
                 │   Survey of India Vector Cartography (Leaflet)│
                 │   Atmospheric Dynamics Studio (Windy Engine) │
                 │   3D Thermodynamic Radiosonde Simulator      │
                 │   Multi-Model Synoptic Discrepancy Heatmap   │
                 └──────────────────────────────────────────────┘
```

---

## 3. Directory Layout

```
SIH-26079/
├── backend/                      # Production FastAPI Backend Service
│   ├── main.py                   # FastAPI Application, Middleware, and Routes
│   ├── models/                   # LightGBM and Calibration Model Artifacts
│   ├── services/                 # Telemetry, OpenWeather, and Model Services
│   └── database/                 # Database Persistence and Cache Connectors
│
├── api/                          # Unified Real-Time Prediction & Ingestion API
│   └── main.py                   # High-performance Inference Router & Data Hub
│
├── frontend/                     # Next.js 16 + React 19 + Tailwind CSS Dashboard
│   ├── app/                      # App Router Pages (Landing, Cockpit, Live Prediction)
│   ├── components/               # Production Operational React Components
│   │   ├── Dashboard.tsx         # Main Operational Flight Deck & Tab Controller
│   │   ├── IndiaActualMap.tsx    # Survey of India Cartographic Vector Map (Leaflet)
│   │   ├── WindyWeatherMap.tsx   # Atmospheric Dynamics Studio & 3D Skew-T Simulator
│   │   ├── TopRightToolbar.tsx   # Read Aloud (TTS), Theme Switcher, and Global Search
│   │   ├── LandingScreen.tsx     # Full-Screen Operational Landing Page
│   │   ├── ModelInspector.tsx    # Calibrated LightGBM/XGBoost Benchmark Deck
│   │   ├── SynopticRegimes.tsx   # Indian Meteorological Threat Matrix
│   │   ├── WhatIfSimulator.tsx   # Counterfactual Sensitivity Sandbox
│   │   ├── HistoricalArchive.tsx # Past Forecast Bust Case Studies
│   │   ├── WeatherNewsFeed.tsx   # Real-Time Meteorological News & Advisories
│   │   ├── OpenDataApiHub.tsx    # Developer API Key & Dataset Export Center
│   │   ├── AdvisoryModal.tsx     # Official MoES/NCMRWF Operational Bulletin Generator
│   │   └── AIChatbotModal.tsx    # Natural Language Meteorological Copilot
│   ├── lib/                      # Type Definitions, API Fetchers, and Map Metadata
│   └── public/                   # Official SOI GeoJSON Boundaries and Static Assets
│
├── ml/                           # Core Machine Learning & Training Pipeline
│   ├── data/                     # Ingestion Providers and Feature Tables
│   ├── training/                 # Model Training and Probability Calibration
│   ├── evaluation/               # ROC-AUC, Brier Score, and Error Analysis
│   └── explainability/           # SHAP Factor Attribution and Local Explanation
│
├── tests/                        # Comprehensive Pytest Verification Suite
├── requirements.txt              # Backend Python Dependencies
├── render.yaml                   # Infrastructure-as-Code for Render Deployment
└── README.md                     # Platform Documentation
```

---

## 4. Key Functional Capabilities

### A. Official Survey of India Cartography
- Standardized to official Survey of India geographic boundaries, incorporating the complete territory of Jammu & Kashmir and Ladakh up to 37.078 degrees North.
- Powered by Leaflet and CARTO Basemaps (`rastertiles/dark_all` and `rastertiles/light_all`).
- 43 synoptic meteorological stations mapped across all climatic regimes.
- Dynamic concentric radar range rings (100 km, 200 km, 300 km) mathematically centered on station coordinates with zero offset.
- Real-time cursor-following telemetry tooltips and interactive state boundary hover highlights.
- Spatial gradient heatmap overlays for precipitation and forecast bust risk.

### B. Atmospheric Dynamics Studio & 3D Skew-T Simulator
- High-resolution streamline and atmospheric layer visualization powered by Windy.com.
- Full-width segmented controls for 7 atmospheric overlays: Wind, Rain/Radar, Temperature, Pressure, Satellite/Clouds, Waves, and Thunderstorms/CAPE.
- Multi-Model Discrepancy Heatmap Matrix comparing ECMWF IFS (9km), NOAA GFS (22km), and ground truth observations across 8 atmospheric variables.
- 3D-like Thermodynamic Radiosonde Simulator calculating CAPE, CIN, LCL, LFC, and Lifted Index in real time, with interactive sliders for surface heating and boundary moisture flux.
- 10-day multi-model consensus decay curves tracking divergence from Day 1 to Day 10.

### C. Calibrated Machine Learning Engine
- Ensemble architecture combining LightGBM, XGBoost, and Calibrated Logistic Classifiers.
- Predicts probability of forecast bust: $P(\text{Bust} \mid \mathbf{x}_{\text{init}}, \text{Lead Day})$.
- Real-time TreeSHAP attribution computing physical contribution of each feature (humidity anomalies, wind shear, pressure tendencies).
- Automated continuous learning worker retraining on newly matched forecast-observation pairs every 30 minutes.

### D. Accessibility & User Interface
- Full-screen landing page with animated atmospheric radar kinematics and one-click entrance to the operational deck.
- SpeechSynthesis Text-to-Speech (TTS) engine with instant cancellation and real-time word-by-word visual highlighting.
- High-contrast light and dark mode engine with automatic map tile synchronization.
- Institutional API key generation with automated rate limiting (1,000 requests/day).

---

## 5. Local Setup and Installation

### Prerequisites
- Python 3.11 or higher
- Node.js 20.x or higher
- npm 10.x or higher

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/forecastguard.git
cd forecastguard
```

### Step 2: Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend service
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Build production bundle to verify types and dependencies
npm run build

# Start local Next.js development server
npm run dev
```

The frontend will be accessible at `http://localhost:3000` and the API documentation at `http://localhost:8000/docs`.

---

## 6. Deployment on Render

This repository includes a production-ready `render.yaml` specification for deploying both the FastAPI backend and Next.js frontend on Render.

### Render Blueprint Configuration
1. Link your GitHub repository to Render.
2. In the Render Dashboard, select **New > Blueprint** and point to this repository.
3. Render will automatically provision:
   - **`forecastguard-api`**: Python Web Service running FastAPI (`uvicorn backend.main:app --host 0.0.0.0 --port $PORT`).
   - **`forecastguard-web`**: Node Web Service running Next.js (`npm run build && npm run start`).

### Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend REST API endpoint URL | `https://forecastguard-api.onrender.com` |
| `NEXT_PUBLIC_CARTO_API_KEY` | CARTO Basemaps Tile API Key | `cb1_3qnh_1_8e89ac90b8868a8c23bf7986` |
| `NEXT_PUBLIC_WINDY_API_KEY` | Windy.com Map Forecast API Key | `VrzEVkW0Mx3LAN3AJWNTS2zXOeTWlpkv` |
| `OPENWEATHER_API_KEY` | OpenWeather Live Observation Key | `bb7bff7cbcebf1e0990e0dcadaef7af1` |
| `MONGODB_URI` | MongoDB Connection String (Optional) | `mongodb+srv://...` |
| `PORT` | Service Port | Assigned dynamically by Render |

---

## 7. REST API Reference

### Core Endpoints

#### `POST /api/v1/analyze`
Executes bust probability inference for a given station and lead time.
- **Request Body**:
  ```json
  {
    "lead_day": 5,
    "features": {
      "forecast_rainfall": 42.5,
      "forecast_wind_speed": 11.2,
      "forecast_temperature": 27.8,
      "forecast_pressure": 1008.2,
      "forecast_humidity": 84.0
    }
  }
  ```
- **Response**: Bust probability, calibrated confidence, risk category, and SHAP feature contributions.

#### `GET /api/stations`
Returns monitored synoptic observation stations across India with real-time ground truth observations, current bust risk, and coordinates.

#### `POST /api/keys/generate`
Generates an institutional API access key with an allocated daily quota of 1,000 requests.
- **Request Body**:
  ```json
  {
    "agency_name": "State Meteorological Centre"
  }
  ```
- **Response**: API key, rate limits, quota allocation, and timestamp.

#### `GET /api/health`
Service health check and database connectivity verification.

---

## 8. Verification and Testing

Execute the test suite to verify model inference, calibration pipelines, and API endpoints:

```bash
# Run unit and integration tests
pytest tests/ -v

# Run frontend TypeScript typecheck and build
cd frontend
npm run build
```

---

## 9. Disclaimer

ForecastGuard is an operational research prototype designed to assist operational duty forecasters by quantifying numerical weather prediction uncertainty and identifying potential medium-range forecast busts. Output from this system should be used in conjunction with official India Meteorological Department (IMD) bulletins and synoptic guidance.