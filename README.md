# FORECASTGUARD AI

> **"AI-powered forecast reliability and bust detection for medium-range weather forecasts."**

**Problem Statement ID:** 26079  
**Organization:** Ministry of Earth Sciences (MoES), Government of India  
**Department:** National Centre for Medium Range Weather Forecasting (NCMRWF)  
**Theme / Category:** Smart Automation / Software  

---

## 1. Executive Summary & Problem Context

Medium-range numerical weather prediction (NWP) models (such as NCMRWF's NCUM and global ensemble systems) provide forecasts from Day 1 through Day 10. While generally skillful, these forecasts can suffer large, sudden degradation in accuracy—termed **forecast busts**—during rapidly evolving, extreme, or convective meteorological regimes:
- Monsoon depressions and low-pressure systems over the Bay of Bengal / Arabian Sea
- Active-break monsoon transitions
- Localized heavy to extremely heavy rainfall events
- Western disturbances over Northern India
- Heatwaves, pre-monsoon squalls, and cyclonic tracks

**ForecastGuard AI** introduces a dedicated machine learning reliability layer on top of NWP pipelines:
- **NWP tells forecasters what the weather may be.**
- **ForecastGuard AI tells forecasters how much confidence they should place in that forecast.**

> [!IMPORTANT]
> **Scientific Integrity Guarantee:**
> ForecastGuard AI does **not** replace the NWP model, nor does it predict raw atmospheric variables. It predicts the conditional probability $P(\text{Bust} \mid \mathbf{x}_{\text{init}})$ that an operational NWP forecast will exceed a defined historical error threshold at a given lead day (Day 1–10).
> 
> When real government feeds are not connected, the system executes in a transparently labeled **`SYNTHETIC DEMONSTRATION DATA — NOT REAL WEATHER DATA`** mode. Model metrics are strictly derived from evaluated test sets.

---

## 2. Real Indian Government Weather Data Integration

ForecastGuard AI provides pluggable data adapters (`ml/data/data_provider.py`) engineered to ingest operational products from official Ministry of Earth Sciences (MoES) agencies:

### A. National Centre for Medium Range Weather Forecasting (NCMRWF)
- **Portal:** [https://www.ncmrwf.gov.in/](https://www.ncmrwf.gov.in/) | [https://nwp.ncmrwf.gov.in/](https://nwp.ncmrwf.gov.in/)
- **Target Products:**
  1. **NCUM Global (12 km):** Operational deterministic forecasts up to Day 10 in GRIB2/NetCDF4 format.
  2. **NCUM Regional (4 km):** High-resolution convective-scale forecasts covering the South Asia domain.
  3. **NEPS (NCMRWF Ensemble Prediction System):** 23 ensemble members providing ensemble mean, ensemble spread, and standard deviation fields up to Day 10.
  4. **IMDAA (Indian Monsoon Data Assimilation and Analysis):** High-resolution (12 km) regional atmospheric reanalysis spanning 1979–present, used as the historical error baseline.

### B. India Meteorological Department (IMD)
- **Portal:** [https://mausam.imd.gov.in/](https://mausam.imd.gov.in/) | [https://www.imdpune.gov.in/](https://www.imdpune.gov.in/)
- **Target Products:**
  1. **IMD Gridded Daily Rainfall (0.25° × 0.25°):** Pai et al. (2014) high-resolution gridded precipitation based on thousands of rain gauge stations.
  2. **IMD Gridded Daily Temperature (1.0° × 1.0° / 0.5° × 0.5°):** Srivastava et al. gridded maximum, minimum, and mean surface temperatures.
  3. **IMD Automated Weather Station (AWS) Network:** Real-time surface observations (pressure, 2m temperature, 10m wind, relative humidity).
  4. **IMD Doppler Weather Radar (DWR):** Network radar composite reflectivity across coastal and inland threat corridors.

---

## 3. Project Architecture & Directory Layout

```
forecastguard-ai/
├── frontend/                     # Next.js 16 + React 19 + Tailwind CSS v4 Dashboard
│   ├── app/                      # Next.js App Router (Landing + /cockpit dashboard)
│   ├── components/               # Geospatial India map, lead time charts, SHAP cards
│   ├── maps/                     # MapLibre GL and SVG geospatial vector components
│   ├── charts/                   # Recharts uncertainty timelines and reliability diagrams
│   ├── types/                    # Meteorological and bust prediction TypeScript interfaces
│   └── lib/                      # Client utilities and API fetchers
│
├── backend/                      # High-performance FastAPI ASGI REST Engine
│   ├── main.py                   # App entrypoint, middleware, and lifecycle handlers
│   ├── api/                      # Modular API route controllers
│   ├── services/                 # Prediction pipeline, analog retrieval, and revision engines
│   ├── models/                   # Domain schemas and persistence definitions
│   ├── database/                 # SQLite/PostgreSQL persistence connectors
│   ├── schemas/                  # Pydantic request/response validation schemas
│   └── utils/                    # Geospatial bounds, coordinates, and error formatting
│
├── ml/                           # Core Meteorological Machine Learning Engine
│   ├── data/                     # Data providers (Synthetic, IMD, NCMRWF, ERA5)
│   │   ├── data_provider.py      # Abstract DataProvider interface and adapters
│   │   └── synthetic_generator.py# Physical multi-level synthetic weather generator
│   ├── preprocessing/            # Error calculation, bust labeling, and temporal splitting
│   ├── features/                 # Non-leaking spatial/temporal feature engineering
│   ├── models/                   # Serialized LightGBM, Random Forest, and Calibrator pipelines
│   ├── training/                 # Model training and probability calibration scripts
│   ├── inference/                # Real-time lead-day inference engines
│   ├── explainability/           # SHAP model-associated factor importance
│   ├── evaluation/               # PR-AUC, Brier score, and reliability curve evaluation
│   ├── analogs/                  # Historical synoptic analog pattern matcher
│   └── revisions/                # Cycle-to-cycle forecast revision analyzer
│
├── notebooks/                    # Exploratory meteorological research notebooks
│   ├── 01_data_exploration.ipynb
│   ├── 02_forecast_error_analysis.ipynb
│   ├── 03_feature_engineering.ipynb
│   ├── 04_model_training.ipynb
│   └── 05_model_evaluation.ipynb
│
├── data/                         # Data persistence tiers
│   ├── raw/                      # Raw IMD/NCMRWF NetCDF and GRIB2 files
│   ├── processed/                # Tabular Parquet feature tables
│   └── synthetic/                # Generated synthetic benchmark datasets
│
├── tests/                        # Comprehensive automated test suite
│   ├── test_synthetic_data.py    # Multi-level variable & error dynamics tests
│   ├── test_error_calculation.py # Meteorological error formulation tests
│   ├── test_bust_labels.py       # 90th percentile threshold tests
│   ├── test_feature_engineering.py# Temporal leakage prevention audit
│   ├── test_model_training.py    # Temporal train/val/test split verification
│   ├── test_calibration.py       # Isotonic and Platt scaling tests
│   ├── test_shap_explainability.py# SHAP values and directional impact tests
│   ├── test_historical_analogs.py# Cosine similarity analog matcher tests
│   ├── test_forecast_revision.py # Cycle displacement and pattern correlation tests
│   └── api/                      # FastAPI endpoint integration tests
│
├── scripts/                      # Operational automation CLI scripts
│   └── generate_demo_data.py     # Synthetic data generation CLI
│
├── docker/                       # Production container specifications
│   ├── Dockerfile.backend        # Python 3.11-slim FastAPI container
│   └── Dockerfile.frontend       # Node 20-alpine Next.js container
│
├── requirements.txt              # Pinned Python dependencies
├── .env.example                  # Environment configuration template
├── docker-compose.yml            # Multi-container orchestration specification
└── README.md                     # System documentation
```

---

## 4. Phase 1 — Synthetic Meteorological Data Mode

When real NCMRWF/IMD feeds are not connected, the system generates physically realistic, multi-level atmospheric datasets spanning the Indian subcontinent:
- **Spatial Grid:** Latitude 8.0°N to 37.0°N, Longitude 68.0°E to 97.0°E at configurable resolution (default `1.0°`, high-res `0.5°`).
- **Surface Variables:** 2m temperature (°C), relative humidity (%), precipitation (mm), surface pressure (hPa), 10m U/V wind components (m/s), 10m wind speed.
- **Atmospheric Levels:** 500 hPa geopotential height (gpm), 850 hPa temperature, relative humidity, and U/V winds; 200 hPa upper-level jet U/V winds.
- **Derived Variables:** Vertical wind shear (200–850 hPa vector difference), CAPE (J/kg), precipitable water (mm), 850 hPa relative vorticity, horizontal divergence, and spatial pressure/moisture gradients.
- **Bust Challenge Dynamics:** Errors expand with lead time (Day 1 to 10) and magnify in simulated synoptic low-pressure disturbances, intense convective precipitation cores, and high-shear zones.

### Running Synthetic Data Generation
```powershell
# Generate standard demonstration dataset (45,000 grid points, 10 lead days)
python scripts/generate_demo_data.py

# Generate high-resolution grid (0.5 degree) with optional NetCDF export
python scripts/generate_demo_data.py --resolution 0.5 --num-cycles 5 --export-netcdf
```

---

## 5. Local Quickstart & Development

### Prerequisites
- Python 3.11+
- Node.js 20+ & npm
- Docker & Docker Compose (optional for containerized deployment)

### 1. Environment Setup
```powershell
# Copy environment file
Copy-Item .env.example .env

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Generate Synthetic Data
```powershell
python scripts/generate_demo_data.py
```

### 3. Run Automated Tests
```powershell
# Run synthetic data generator tests
pytest tests/test_synthetic_data.py -v

# Run entire 58-test verification suite
pytest -v
```

### 4. Launch Backend API
```powershell
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 5. Launch Frontend Dashboard
```powershell
cd frontend
npm install
npm run dev
```
Operational Cockpit accessible at: `http://localhost:3000/cockpit`  
Landing Page accessible at: `http://localhost:3000/`

---

## 6. Docker Container Orchestration

Run the complete multi-tier application with a single command:
```powershell
docker-compose up --build
```
- **Backend API:** `http://localhost:8000` (Healthcheck: `/api/v1/health`)
- **Frontend Dashboard:** `http://localhost:3000`

---

## 7. Status & Phase Progress

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase A** | Project Architecture, Folder Structure, Requirements, Docker, Synthetic Generator, Adapters, README, Tests | **COMPLETE** |
| **Phase B** | Forecast Error Calculation Engine (MAE, RMSE, Pythagorean wind vectors, log1p rainfall, normalized score) | Complete (Existing module in `ml/preprocessing/`) |
| **Phase C** | Configurable Bust Definition Engine (90th percentile thresholding, lead-time grouping) | Complete (Existing module in `ml/preprocessing/`) |
| **Phase D** | Non-Leaking Feature Engineering (Initialization-time state, temporal diffs, spatial gradients, stability) | Complete (Existing module in `ml/features/`) |
| **Phase E** | ML Models (Logistic Regression, Random Forest, LightGBM with strict temporal splitting) | Complete (Existing module in `ml/training/`) |
| **Phase F** | Probability Calibration (Isotonic Regression, Brier score, Expected Calibration Error) | Complete (Existing module in `ml/training/`) |
| **Phase G** | Explainable AI (TreeSHAP model-associated factor importance, positive/negative drivers) | Complete (Existing module in `ml/explainability/`) |
| **Phase H** | Historical Analog Engine (Standardized feature vectors, Cosine similarity, Top-K analogs) | Complete (Existing module in `ml/analogs/`) |
| **Phase I** | Forecast Revision Analyzer (Cycle displacement, RMSE revision, pattern correlation shift) | Complete (Existing module in `ml/revisions/`) |
| **Phase J** | FastAPI Operational Endpoints (Health, Forecast, Bust Probability, Confidence, Analogs, SHAP, Replay) | Complete (Existing routes in `backend/routes/`) |
| **Phase K** | Operational Frontend Cockpit (MapLibre vector India grid, Day 1–10 slider, drilldown, replay, evaluation) | Complete (Operational dashboard at `/cockpit`) |