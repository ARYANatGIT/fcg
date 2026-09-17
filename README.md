# ForecastGuard AI
### AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts
**Problem Statement ID:** 26079  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** National Centre for Medium Range Weather Forecasting (NCMRWF)  
**Theme:** Smart Automation / Software  

---

## Executive Summary
Medium-range numerical weather prediction (NWP) models (such as NCMRWF NCUM/NEPS or NOAA GFS) occasionally experience severe forecast failures or **"forecast busts"** during rapidly evolving weather regimes—including monsoon depressions, intense convective precipitation, western disturbances, tropical cyclones, heat waves, and break/active monsoon phases. 

**ForecastGuard AI** is an AI/ML decision-support system that:
1. Identifies regions and lead times (Day 1 to Day 10) prone to large forecast errors.
2. Generates calibrated **Forecast Bust Probabilities** and a complementary **Forecast Confidence Indicator** ($1 - P(\text{bust})$).
3. Provides an interactive **Forecast Confidence Map** across Indian subregions and stations.
4. Delivers **Explainable AI (XAI)** via SHAP to identify key meteorological drivers of forecast uncertainty.
5. Employs a **Historical Analog Engine** to locate similar past forecast setups without time-travel leakage.
6. Detects **Run-to-Run Forecast Revisions** across consecutive initialization runs as instability signals.
7. Exposes all analytical modules via a production-ready **FastAPI** backend and an interactive **Next.js** dashboard.

---

## 13-Phase Implementation Matrix

| Phase | Description | Key Technologies | Status |
|---|---|---|:---:|
| **1. Foundation** | Repository structure, environments, Git, configuration, tests | Python, Git, Pytest | ✅ Complete |
| **2. Preprocessing** | Standardized weather data pipeline (UTC, °C, mm, m/s, hPa) | Pandas, NumPy, Parquet | ✅ Complete |
| **3. EDA** | Distribution analysis, error growth by lead day, spatial patterns | Jupyter, Seaborn | ✅ Complete |
| **4. Target Definition** | 90th percentile lead-day bust threshold & strict anti-leakage | NumPy, SciPy | ✅ Complete |
| **5. ML Training** | Chronological 70/15/15 split, LightGBM with `scale_pos_weight` | LightGBM, Scikit-learn | ✅ Complete |
| **6. Inference** | Calibrated probability engine, confidence, risk classification | Isotonic Calibration | ✅ Complete |
| **7. Explainable AI** | SHAP waterfall/attributions, meteorological reason codes | SHAP, Python | ✅ Complete |
| **8. Historical Analogs**| Weighted Euclidean distance search on strictly historical cases | Scikit-learn | ✅ Complete |
| **9. Forecast Revisions**| Multi-cycle run-to-run instability detection ($T_{-24h} \rightarrow T_{-12h} \rightarrow T_0$) | Pandas, RobustScaler | ✅ Complete |
| **10. FastAPI Backend** | High-performance REST API with comprehensive endpoint suite | FastAPI, Pydantic | ✅ Complete |
| **11. Dashboard** | Interactive operational UI with India map & Recharts analytics | Next.js, MapLibre, Recharts | ✅ Complete |
| **12. Real NWP Pipeline**| NetCDF/GRIB matching architecture for GFS/ERA5/NCUM | Xarray, NetCDF/GRIB | ✅ Complete |
| **13. Final Integration**| Docker containerization, comprehensive testing, documentation | Docker, Pytest, Docs | ✅ Complete |

---

## System Architecture

```
                 NWP Forecast (Lead Days 1-10)
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       Spatial Coordinates            Weather Features
     (Lat: 8-38°N, Lon: 68-98°E)    (Temp, Rain, Wind, Press)
               │                               │
               └───────────────┬───────────────┘
                               ▼
                    Feature Engineering Engine
                 (Cyclic Time, Lags, Interactions)
                               │
                [STRICT ANTI-LEAKAGE GATEKEEPER]
                               │
                               ▼
                     LightGBM Model Core
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     Probability           SHAP Local       Historical Analogs
     Calibration           Explainer        (Prior Time Only)
   (Isotonic Regr.)     (Attributions)      (Top-5 Cases)
            │                  │                  │
            └──────────────────┼──────────────────┘
                               ▼
                    Multi-Cycle Revision
                 (Run 1 → Run 2 → Current)
                               │
                               ▼
                     FastAPI REST Backend
                         (Port 8000)
                               │
                               ▼
                   Next.js Operational UI
                         (Port 3000)
```

---

## Quick Start & Local Execution

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker and Docker Compose

### 1. Backend Setup & Startup
```powershell
# Install dependencies
pip install -r requirements.txt

# Run all unit and integration tests (48 passing tests)
pytest -v

# Start FastAPI backend server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 2. Frontend Setup & Startup
```powershell
cd frontend
npm install
npm run dev
```
Dashboard will be accessible at: `http://localhost:3000`

### 3. Docker Compose (One-Click Production Launch)
```powershell
docker-compose up --build
```

---

## API Endpoints Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health, model status, and module availability |
| `GET` | `/api/v1/model` | Model hyperparameters, feature list, and validation metrics |
| `GET` | `/api/v1/features` | Feature catalog with units and forbidden leakage definitions |
| `POST` | `/api/v1/predict` | Standalone calibrated bust probability, confidence, and risk |
| `POST` | `/api/v1/explain` | Standalone SHAP feature attributions and reason codes |
| `POST` | `/api/v1/analogs` | Top-5 historical similar cases and analog bust frequency |
| `POST` | `/api/v1/revisions` | Multi-cycle run-to-run parameter evolution and instability score |
| `POST` | `/api/v1/analyze` | Consolidated decision-support payload (All modules combined) |
| `GET` | `/api/v1/spatial-grid` | India station confidence and bust probabilities for Day 1 to 10 |

---

## Anti-Leakage & Meteorological Integrity
1. **Strict Target Isolation:** Observation variables (`observed_*`), error metrics (`error_*`), and target labels (`bust`) are strictly forbidden from the input feature set $X$. Any request or dataset attempting to pass these is rejected immediately.
2. **Chronological Time Splitting:** Data is strictly partitioned into 70% Train, 15% Validation, and 15% Test chronologically. Random splitting is strictly forbidden.
3. **No Time-Travel in Analogs:** The historical analog retriever strictly filters cases initialized prior to the query forecast ($t_{init} < T_{query}$).
4. **Research Prototype Notice:** Model-estimated bust probabilities do not replace official statutory weather warnings issued by IMD/MoES.

---

## Verification & Test Results
- **Pytest Suite:** 48 passed, 0 failed (100% pass rate).
- **TypeScript / Next.js:** Zero build errors, zero type errors.
- **Smoke Test:** Verified across health, prediction, SHAP, analogs, and revisions.