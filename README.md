# ForecastGuard AI

## Operational Medium-Range NWP Forecast Bust Prediction, Spatial Reliability Assessment & Calibration System

ForecastGuard is an operational meteorological intelligence platform developed for the **National Centre for Medium Range Weather Forecasting (NCMRWF)**, **Ministry of Earth Sciences (MoES)**, Government of India. The platform provides real-time verification, numerical weather prediction (NWP) forecast bust probability modeling, spatial risk quantification, and explainable feature attribution across all meteorological subdivisions of India.

---

## 1. Problem Formulation & Meteorological Context

### 1.1 The Challenge of Numerical Weather Prediction Busts
Medium-range Numerical Weather Prediction models—such as the **NCUM** (NCMRWF Unified Model at 12km/4km resolution), **ECMWF IFS** (Integrated Forecasting System at 9km resolution), and **NOAA GFS**—solve the discretized primitive hydrostatic and non-hydrostatic Navier-Stokes equations coupled with sub-grid physical parameterizations for radiative transfer, boundary layer turbulence, microphysics, and cumulus convection.

While deterministic skill is high during stable, quiescent synoptic flow, medium-range forecasts (**Day 3 to Day 10**) frequently suffer from abrupt, non-linear degradations in forecast accuracy termed **forecast busts**. In the Indian subcontinent, forecast busts are predominantly triggered by:
- **Baroclinic Wave Amplification**: Non-linear growth of mid-latitude westerly troughs interacting with the subtropical westerly jet, triggering unpredicted Western Disturbances across the Western Himalayas.
- **Tropical Cyclogenesis & Erratic Recurvature**: Rapid intensification, stalling, or track deviation of cyclonic vortices over the Bay of Bengal and Arabian Sea.
- **Active-Break Monsoon Transitions**: Sudden spatial shifts in the Monsoon Trough driven by the Boreal Summer Intra-Seasonal Oscillation (BSISO) and the Madden-Julian Oscillation (MJO).
- **Meso-Beta Convective Initiation**: Localized cloudbursts, Kalbaishakhi squall lines, and orographic precipitation along the Western Ghats and Northeast hills that fall below NWP resolved grid scales.
- **Boundary Layer Inversion Entrapment**: Radiation fog and severe thermal inversions across the Indo-Gangetic Plains that induce persistent 4°C–6°C cold biases in NWP 2-meter temperature forecasts.

### 1.2 Paradigm Shift: Reliability as a Conditional Probability
ForecastGuard does not attempt to replace deterministic or ensemble numerical weather prediction. Instead, it operates as an analytical reliability supervisor:
- **NWP models predict atmospheric state variables**: $\hat{\mathbf{y}}_{\text{NWP}}(t, \ell) \in \mathbb{R}^K$ at lead time $\ell \in [1, 10]\text{ days}$.
- **ForecastGuard computes the conditional probability of forecast failure**:
  $$P\left(\text{Bust} \mid \hat{\mathbf{y}}_{\text{NWP}}(t, \ell), \mathbf{x}_{\text{synoptic}}(t), \boldsymbol{\sigma}_{\text{ens}}(t, \ell), \ell\right)$$
- When bust probability exceeds calibrated operational thresholds, ForecastGuard issues spatial risk flags, attributes physical causation via Shapley values, and provides calibrated error distributions to operational duty forecasters.

---

## 2. Mathematical Formulations & Theoretical Framework

### 2.1 Forecast Bust Definition & Objective Criteria
Let $y_{\text{obs}}(t+\ell)$ denote ground truth verification from India Meteorological Department (IMD) Automatic Weather Stations (AWS), and $\hat{y}_{\text{NWP}}(t, \ell)$ represent the corresponding deterministic NWP prediction initialized at time $t$ for valid time $t+\ell$.

The binary bust state $B_\tau(t, \ell) \in \{0, 1\}$ is defined as:
$$B_\tau(t, \ell) = \mathbb{I}\left( |y_{\text{obs}}(t+\ell) - \hat{y}_{\text{NWP}}(t, \ell)| > \tau(\ell) \right)$$

where $\tau(\ell)$ is the lead-time dependent error tolerance threshold accounting for natural atmospheric predictability decay:
$$\tau(\ell) = \tau_0 \cdot \left(1 + \kappa \sqrt{\ell}\right)$$

For 24-hour accumulated precipitation over the Indian monsoon domain, $\tau_0 = 25.0\text{ mm}$ with error expansion coefficient $\kappa = 0.15$. For surface 2-meter temperature, $\tau_0 = 3.0^\circ\text{C}$.

### 2.2 Mean Sea Level (MSL) Barometric Pressure Reduction
Raw station pressure measurements reported by surface stations or numerical grid cells reflect local terrain elevation $h$ (meters above sea level). Direct comparison across heterogeneous terrain produces artificial cyclonic pressure depressions. ForecastGuard normalizes surface pressure $P_{\text{station}}$ to Mean Sea Level $P_{\text{MSL}}$ using the international barometric reduction formulation derived from the hydrostatic equation and the standard atmospheric lapse rate $L = 0.0065\text{ K/m}$:

$$P_{\text{MSL}} = P_{\text{station}} \cdot \left(1 - \frac{L \cdot h}{T_0}\right)^{-\frac{g_0 \cdot M}{R_0 \cdot L}} \approx P_{\text{station}} \cdot \left(1 + \frac{L \cdot h}{T_{\text{station}} + \frac{L \cdot h}{2}}\right)^{\frac{g_0}{R_d \cdot L}}$$

where:
- $g_0 = 9.80665\text{ m/s}^2$ (standard gravitational acceleration)
- $R_d = 287.05\text{ J/(kg}\cdot\text{K)}$ (gas constant for dry air)
- $T_0 = 288.15\text{ K}$ (sea-level standard temperature)
- Elevation $h$ is calibrated across all 43 primary Indian observatory stations.

### 2.3 Atmospheric Thermodynamics & Convective Instability
ForecastGuard's thermodynamic diagnostic suite computes convective indices from vertical radiosonde profiles and numerical soundings:

1. **Convective Available Potential Energy (CAPE)**:
   $$\text{CAPE} = \int_{z_{\text{LFC}}}^{z_{\text{EL}}} g \left( \frac{T_{v, \text{parcel}}(z) - T_{v, \text{env}}(z)}{T_{v, \text{env}}(z)} \right) dz$$
   where $z_{\text{LFC}}$ is the Level of Free Convection, $z_{\text{EL}}$ is the Equilibrium Level, and $T_v$ is virtual temperature.

2. **Convective Inhibition (CIN)**:
   $$\text{CIN} = \int_{z_{\text{sfc}}}^{z_{\text{LFC}}} g \left( \frac{T_{v, \text{parcel}}(z) - T_{v, \text{env}}(z)}{T_{v, \text{env}}(z)} \right) dz$$

3. **Lifted Condensation Level (LCL)** via Bolton's approximation:
   $$T_{\text{LCL}} = \frac{1}{\frac{1}{T - 55} - \frac{\ln(\text{RH}/100)}{2840}} + 55 \quad [\text{K}]$$
   $$z_{\text{LCL}} \approx 125 \cdot (T - T_d) \quad [\text{meters}]$$

4. **Bulk Richardson Number (BRN)**:
   $$\text{BRN} = \frac{\text{CAPE}}{\frac{1}{2} \left(\bar{u}_{6\text{km}} - \bar{u}_{\text{sfc}}\right)^2}$$
   Values $\text{BRN} \in [10, 45]$ indicate high probability of organized supercell convection prone to localized precipitation busts.

### 2.4 Ensemble Spread-Skill Bifurcation
ForecastGuard ingests perturbed members of the ECMWF IFS ENS ensemble. The ensemble standard deviation $\sigma_{\text{ens}}(t, \ell)$ is computed across ensemble members $x_m$:

$$\sigma_{\text{ens}}(t, \ell) = \sqrt{\frac{1}{M - 1} \sum_{m=1}^M \left(x_m(t, \ell) - \bar{x}(t, \ell)\right)^2}, \quad M = 51$$

When $\sigma_{\text{ens}}(t, \ell) \gg \text{Spread}_{\text{climatology}}(\ell)$, atmospheric phase space exhibits rapid divergence, and conditional bust probability scales monotonically:
$$P(\text{Bust}) \propto \text{Sigmoid}\left(\alpha \cdot \frac{\sigma_{\text{ens}}}{\overline{\text{RMSE}}} - \beta\right)$$

### 2.5 Machine Learning Ensemble Architecture (LightGBM + XGBoost)
ForecastGuard employs an ensemble of LightGBM gradient boosted decision trees utilizing Gradient-based One-Side Sampling (GOSS) and Exclusive Feature Bundling (EFB). At step $t$, the objective function minimized is:

$$\mathcal{L}^{(t)} = \sum_{i=1}^N \ell\left(y_i, \hat{y}_i^{(t-1)} + f_t(\mathbf{x}_i)\right) + \gamma T + \frac{1}{2}\lambda \sum_{j=1}^T w_j^2$$

where $\ell$ is binary log-loss, $T$ is the number of terminal leaf nodes, and $w_j$ represents leaf weight vectors regularized under $L_2$ penalty $\lambda$.

### 2.6 Probability Calibration: Isotonic Regression & Reliability
Raw tree ensemble outputs $\hat{s}_i \in [0, 1]$ frequently exhibit overconfidence in extreme tails. ForecastGuard calibrates probabilities using Isotonic Regression via the Pool Adjacent Violators Algorithm (PAVA):

$$\min_{\hat{p}_1 \le \hat{p}_2 \le \dots \le \hat{p}_N} \sum_{i=1}^N \left(y_i - \hat{p}_i\right)^2$$

Calibration quality is strictly verified using:
1. **Brier Score (BS)** and **Brier Skill Score (BSS)**:
   $$\text{BS} = \frac{1}{N} \sum_{i=1}^N (p_i - o_i)^2, \quad \text{BSS} = 1 - \frac{\text{BS}}{\text{BS}_{\text{reference}}}$$
2. **Expected Calibration Error (ECE)** across $M=10$ equal-frequency confidence bins $B_m$:
   $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
   ForecastGuard maintains $\text{ECE} < 0.042$ on independent holdout validation partitions.

### 2.7 Explainable AI: Exact TreeSHAP Formulation
To eliminate black-box opacity in operational workflows, ForecastGuard implements TreeSHAP to compute exact local Shapley values $\phi_i$:

$$\phi_i(f, \mathbf{x}) = \sum_{S \subseteq \mathcal{F} \setminus \{i\}} \frac{|S|!(|\mathcal{F}| - |S| - 1)!}{|\mathcal{F}|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$

Efficiency is guaranteed via local tree traversal in $\mathcal{O}(T L D^2)$ time rather than exponential complexity $\mathcal{O}(2^{|\mathcal{F}|})$, enabling sub-15ms SHAP waterfall generation per inference query.

---

## 3. System Architecture & Data Flow

```
                                 DATA INGESTION LAYER
 ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
 │   Open-Meteo High-   │  │   OpenWeatherMap     │  │   Windy.com API      │  │   Elevation Model    │
 │   Resolution Sync    │  │   Real-Time Node     │  │   ECMWF IFS 9km      │  │   & Climatology      │
 │ (Live/Hourly/Past14) │  │ (Temp/Press/Wind/Rain│  │ (CAPE/Soundings/Wave)│  │ (MSL Pressure Norm)  │
 └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
            │                         │                         │                         │
            └─────────────────────────┼─────────────────────────┴─────────────────────────┘
                                      ▼
                        ┌───────────────────────────┐
                        │   MongoDB Atlas Cluster   │
                        │ - real_time_telemetry     │
                        │ - air_quality_cams        │
                        │ - ensemble_spread_ecmwf   │
                        │ - marine_flood_glofas     │
                        │ - verified_evaluations    │
                        │ (Persistent File Fallback)│
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                           CONTINUOUS LEARNING CORE
                        ┌───────────────────────────┐
                        │ 30-Minute Worker Service  │
                        │ - Residual Calculation    │
                        │ - LightGBM Retraining     │
                        │ - PAVA Re-calibration     │
                        │ - Model Hot-Reloading     │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                          BACKEND REST API (FASTAPI)
                        ┌───────────────────────────┐
                        │ Port: 8000                │
                        │ - HTTP Basic Auth Guard   │
                        │ - NoSQL Injection Guard   │
                        │ - Defensive Headers       │
                        │ - Rate Quota (1000/day)   │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                           OPERATIONAL FRONTEND
                        ┌───────────────────────────┐
                        │ Next.js 16 (Port: 3000)   │
                        │ - Survey of India Leaflet │
                        │ - 365-Day Weather Heatmap │
                        │ - Atmospheric Dynamics    │
                        │ - Weather News (<10 Days) │
                        │ - Kinetic Nav Glider      │
                        │ - High-Contrast Modes     │
                        └───────────────────────────┘
```

---

## 4. Complete Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js** (App Router) | `16.3.5` | SSR/Static generation, Turbopack bundling, server actions |
| **UI Library** | **React** | `19.0.0` | Declarative reactive UI components, transition hooks |
| **Styling & Design** | **Tailwind CSS** | `v4` | Pure monochrome Noir tokens, kinetic physics, glassmorphism |
| **Geographic GIS** | **Leaflet** / **React-Leaflet** | `1.9.4` | Official Survey of India vector boundary cartography |
| **Data Visualization** | **Recharts** | `2.15.1` | Sounding diagrams, lead-decay curves, SHAP waterfalls |
| **Icons & Audio** | **Lucide React** + **Web Speech API** | `0.475.0` | Accessible vector iconography & hands-free read-aloud |
| **Backend Framework** | **FastAPI** | `0.115.6` | High-throughput asynchronous Python microservice |
| **ASGI Web Server** | **Uvicorn** | `0.34.0` | Non-blocking asynchronous HTTP server |
| **Configuration** | **Pydantic Settings** | `2.7.1` | Strictly typed environment configuration (`.env` validation) |
| **Machine Learning** | **LightGBM** | `4.5.0` | Gradient-boosted decision tree ensemble for bust probability |
| **Statistical ML** | **Scikit-learn** | `1.6.1` | Isotonic regression (PAVA), Brier score, ECE metrics |
| **Explainable AI** | **SHAP** | `0.46.0` | Exact TreeSHAP local attribution and feature ranking |
| **Model Persistence** | **Joblib** | `1.4.2` | Zero-copy model serialization and hot-reloading |
| **Database** | **MongoDB Atlas** / **PyMongo** | `4.10.1` | Ingested telemetry store with persistent JSON fallback |
| **Deployment Cloud** | **Render Cloud** | PaaS | Infrastructure-as-code deployment via `render.yaml` |

---

## 5. Directory Structure

```
SIH-26079/
├── backend/                              # Production FastAPI Microservice
│   ├── main.py                           # Application Gateway, Security Middleware & Endpoints
│   ├── config.py                         # Pydantic Settings & Environment Constants
│   ├── routes/
│   │   └── api_routes.py                 # Forecast Analysis & Prediction History Routers
│   ├── services/
│   │   ├── model_service.py              # LightGBM Inference & Calibration Service
│   │   ├── chat_service.py               # Meteorological Assistant Service
│   │   ├── openweather_service.py        # Live OpenWeatherMap Connector
│   │   └── windy_service.py              # ECMWF IFS 9km Numerical Guidance Connector
│   └── database/
│       └── connection.py                 # MongoDB Atlas Connection Pool
│
├── api/
│   └── main.py                           # Standalone High-Throughput REST API Hub
│
├── frontend/                             # Next.js 16 (React 19 + Tailwind CSS)
│   ├── app/                              # Next.js App Router Structure
│   │   ├── layout.tsx                    # Root Layout, Theme Providers, and Audio Hooks
│   │   ├── page.tsx                      # Root Entry Point
│   │   ├── globals.css                   # Noir Monochrome Theme, Range Sliders & Kinetic Glider
│   │   ├── cockpit/page.tsx              # Operational Deck View
│   │   └── live-prediction/page.tsx      # Multi-City Live Inference Deck
│   ├── components/                       # Specialized Meteorological Modules
│   │   ├── Dashboard.tsx                 # Core Operational Dashboard Controller & Gliding Rail
│   │   ├── IndiaActualMap.tsx            # Official Survey of India Leaflet Vector Map
│   │   ├── LeadDayScrubber.tsx           # Generous 10-Day Kinetic Glider Scrubber
│   │   ├── GliderTabs.tsx                # Universal Sliding Glider Pill Switcher
│   │   ├── ActivityHeatmap.tsx           # 365-Day Weather Activity Matrix
│   │   ├── WindyWeatherMap.tsx           # Atmospheric Dynamics Studio & 3D Skew-T Sounding
│   │   ├── WeatherNewsFeed.tsx           # Severe Weather Alerts (<10 Days Real-Time Filter)
│   │   ├── MeteorologicalInsights.tsx    # CAMS Air Quality & Ensemble Spread Telemetry
│   │   ├── CircularGauge.tsx             # Precision Calibrated Risk Gauge Component
│   │   ├── ModelInspector.tsx            # LightGBM Feature Importance & ROC/PR Metrics
│   │   ├── SynopticRegimes.tsx           # Indian Atmospheric Regime Vulnerability Matrix
│   │   ├── WhatIfSimulator.tsx           # Counterfactual Meteorological Sensitivity Sandbox
│   │   ├── HistoricalArchive.tsx         # Verified Forecast Bust Case Studies (2020-2025)
│   │   ├── OpenDataApiHub.tsx            # Developer REST Key Generator & Quota Manager
│   │   ├── TopRightToolbar.tsx           # Text-to-Speech Engine & Smooth Theme Switcher
│   │   ├── LandingScreen.tsx             # Full-Screen Operational Landing Modal
│   │   ├── AdvisoryModal.tsx             # Official Operational Advisory Export Modal
│   │   └── AIChatbotModal.tsx            # Meteorological Assistant Query Modal
│   ├── lib/
│   │   ├── api.ts                        # Authenticated Frontend Client & Data Fetchers
│   │   ├── types.ts                      # TypeScript Interfaces & Numerical Data Schemas
│   │   └── indiaMapData.ts               # Geographic Coordinates for 43 Indian Observatories
│   ├── public/                           # Official Geographic Vector Assets
│   │   ├── india_soi_official.geojson    # Official Survey of India Boundary (SOI Compliant)
│   │   └── india_states_optimized.geojson# 36 State & Union Territory Polygons
│   ├── package.json                      # Next.js Dependencies & Scripts
│   └── .env.local                        # Frontend Environment Configuration (Local)
│
├── ml/                                   # Machine Learning Pipeline
│   ├── training/
│   │   ├── train_models.py               # LightGBM / XGBoost Model Training Pipeline
│   │   └── calibrate_models.py           # Isotonic PAVA Probability Calibration
│   ├── evaluation/
│   │   └── evaluate.py                   # Brier Score, ECE, ROC-AUC, and PR-AUC Evaluation
│   └── explainability/
│       └── shap_explainer.py             # Exact TreeSHAP Value Calculation
│
├── models/                               # Serialized Model Artifacts
│   ├── lgbm_regression.joblib            # Trained LightGBM Model Bundle & Scaler
│   ├── model_metadata.json               # Feature Names, Training Metrics, and Hyperparameters
│   └── calibration_metadata.json         # Isotonic Calibration Mapping & ECE Curves
│
├── src/                                  # Multi-Source Ingestion & Automation Scripts
│   ├── db.py                             # MongoDB PyMongo Database Adapter with Disk Fallback
│   ├── multi_source_ingestion.py         # Multi-Source Extraction Engine (All 4 Sources)
│   ├── scheduler.py                      # Background Retraining & Ingestion Scheduler
│   ├── train_model.py                    # Automated Continuous Retraining Wrapper
│   └── seed_database.py                  # Seed Data Generator for Demonstrations
│
├── .env                                  # Root Backend Environment Configuration (Local)
├── render.yaml                           # Infrastructure-as-Code Blueprint for Render Cloud
├── requirements.txt                      # Python Production Dependencies
└── README.md                             # Comprehensive Platform Documentation
```

---

## 6. Operational Views & Feature Catalog

ForecastGuard organizes operational capabilities into 9 integrated operational decks accessible via the permanently docked, full-height navigation rail:

### 01 · Live Overview (Operational Cockpit)
- **Official Survey of India Cartography**: Strictly renders the official SOI boundary GeoJSON, preserving complete territorial depiction of Jammu & Kashmir and Ladakh.
- **Dynamic 10-Day Progression Scrubber**: High-visibility Day 1 to Day 10 kinetic glider scrubber with generous button margins and risk status dots (Emerald Low, Amber Moderate, Red High).
- **Calibrated Circular Risk Gauge**: High-contrast analog risk dial showing calibrated bust probability percentage and confidence intervals.
- **Station Telemetry & Nearest Historical Analogs**: Live surface observations cross-referenced against historical analog bust cases.

### 02 · Wind & Radar (Atmospheric Dynamics Studio)
- **Windy.com Multi-Layer Ingestion**: Real-time synoptic wind streamlines, radar reflectivity, pressure isobars, and CAPE overlays.
- **3D Thermodynamic Sounding Simulator**: Interactive Skew-T radiosonde simulator computing CAPE, CIN, LCL, and Lifted Index. Features real-time surface heating and boundary moisture perturbation sliders.
- **Multi-Model Consensus Decay Graph**: Comparative 10-day tracking of ECMWF IFS vs NOAA GFS spread and bust probability.
- **2D Regional Fast Switcher**: 2D kinetic glider capsule smoothly transitioning across major regional hubs (Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad).

### 03 · Weather Alerts (Severe Synoptic Bulletins)
- **Strict 10-Day Active Window**: Bulletins are dynamically filtered relative to the current timestamp; outdated bulletins are automatically purged.
- **Subdivision Classifications**: Severe Warnings (Red), Watches (Amber), and Advisories (Yellow) covering Western Disturbances, Cyclonic Vortices, Monsoon Surges, Heatwaves, Cloudbursts, and Radiation Fog.
- **Interactive Audio Reader**: SpeechSynthesis text-to-speech with live word-level highlighting and instant cancellation.

### 04 · Diagnostics & Deep Explainability
- **10-Day Bust Probability Progression Curve**: Visualizing lead-time dependent error propagation.
- **Multi-Model Discrepancy Matrix**: Quantitative spread analysis between NCUM, ECMWF IFS, and NOAA GFS.
- **Local SHAP Feature Attribution**: TreeSHAP waterfall attributing risk to physical features (e.g., moisture flux, barometric depression depth, vertical shear).

### 05 · Simulation Sandbox (NWP Sensitivity Perturbation)
- **Counterfactual Scenario Modeling**: Forecasters interactively perturb rainfall (0–200mm), wind speed (0–35 m/s), temperature (5–48°C), surface pressure (975–1025 hPa), humidity (15–100%), and lead time (D1–D10).
- **Instantaneous Re-Inference**: Re-evaluates bust probability in under 15ms. Scenarios can be saved directly to the database.

### 06 · Threat Matrix & Synoptic Regimes
- **12 Indian Meteorological Regimes**: Catalogs specific vulnerability profiles for Monsoon Lows, Western Disturbances, Tropical Cyclones, Heatwaves, and Orographic Convection.
- **Failure Mode Diagnostics**: Details model parameterization weaknesses and regional risk hotspots.

### 07 · Model Benchmarks & Governance
- **Chronological Validation Benchmark**: Rigorous evaluation comparing LightGBM, XGBoost, Random Forest, and baseline models across PR-AUC, ROC-AUC, Brier Score, and F1-Score.
- **Global SHAP Hierarchy**: Ranked feature importance across all validation cases.
- **Anti-Leakage Audit Certificate**: Strict automated segregation between pre-forecast information and ground-truth verification.

### 08 · Verified Forecast Bust Archive
- **Historical Bust Repository**: Searchable case studies of significant historical forecast busts (2020–2025) across India.
- **Non-Wrapping Filter Pills**: Filter cases by lead time categories (`All Days`, `D1–D3`, `D4–D6`, `D7–D10`) with zero scrollbar clipping.

### 09 · Developer Open Data Hub
- **Authenticated REST API Key Generator**: Issues institutional developer keys with automated daily rate quotas.
- **Dataset Export**: One-click download of verified forecast evaluation datasets in standard CSV and JSON formats.

---

## 7. Security, Privacy & Environment Governance

### 7.1 Zero Confidentiality in Source Control
ForecastGuard enforces strict credential hygiene:
- **No API keys, database connection strings, or passwords are hardcoded in source code.**
- All sensitive variables are loaded dynamically from environment files (`.env` for backend, `.env.local` for frontend) or container runtime settings.
- `.env` and `.env*.local` are strictly excluded from version control via `.gitignore`.
- Environment configurations are managed directly through `.env` (backend) and `frontend/.env.local` (frontend).

### 7.2 Defensive HTTP Headers
Every HTTP response from the FastAPI application includes mandatory security headers:
- `X-Content-Type-Options: nosniff` (mitigates MIME-type confusion attacks)
- `X-Frame-Options: SAMEORIGIN` (prevents clickjacking via malicious iframe embedding)
- `X-XSS-Protection: 1; mode=block` (activates browser cross-site scripting filters)
- `Referrer-Policy: strict-origin-when-cross-origin` (prevents sensitive path leakage)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (enforces HTTPS)

### 7.3 Injection Defense & Input Sanitization
User-controlled parameters across all database query routes are sanitized via regular expression filtering:
```python
re.sub(r"[^\w\s\-\.,()]", "", input_val).strip()[:64]
```
This strips NoSQL operators (`$ne`, `$gt`, `$where`) and script tags, neutralizing NoSQL and SQL injection vectors.

---

## 8. Environment Variables Reference

### 8.1 Backend Environment Variables (`.env`)

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `MONGO_URI` | Yes | `mongodb://localhost:27017/forecastguard` | MongoDB connection URI (Atlas cloud or local instance) |
| `MONGO_DB_NAME` | Yes | `forecastguard` | Target MongoDB database name |
| `APP_ENV` | No | `development` | Runtime environment (`development` or `production`) |
| `API_HOST` | No | `0.0.0.0` | Bind host for FastAPI server |
| `API_PORT` | No | `8000` | Port for FastAPI server |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000,http://localhost:5173` | Allowed CORS origins (comma-separated, or `*`) |
| `DATA_MODE` | No | `synthetic` | Operation mode (`synthetic` for offline simulation, `live` for MoES feeds) |
| `ADMIN_USER` | Yes | `admin` | Administrative Basic Auth username for protected API endpoints |
| `ADMIN_PASS` | Yes | *Configured in `.env`* | Administrative Basic Auth password for protected API endpoints |
| `WINDY_MAP_API_KEY` | Optional | `""` | Official Windy Map Forecast API key for model layers |
| `OPENWEATHER_API_KEY` | Optional | `""` | OpenWeatherMap API key for live ground-truth telemetry |
| `CARTO_BASEMAPS_API_KEY` | Optional | `""` | CARTO Basemaps API key for high-contrast vector cartography |

### 8.2 Frontend Environment Variables (`frontend/.env.local`)

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000` | Backend API URL (use Render backend URL in production) |
| `NEXT_PUBLIC_ADMIN_USER` | Yes | `admin` | Client username used for authenticating with backend API |
| `NEXT_PUBLIC_ADMIN_PASS` | Yes | *Configured in `.env.local`* | Client password used for authenticating with backend API |
| `NEXT_PUBLIC_WINDY_API_KEY` | Optional | `""` | Client-side Windy Map Forecast API key |
| `NEXT_PUBLIC_CARTO_API_KEY` | Optional | `""` | Client-side CARTO Basemaps key |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | Optional | `""` | Client-side OpenWeatherMap key |

---

## 9. Local Installation & Deployment Guide

### 9.1 Prerequisites
- **Python**: Version `3.11` or higher
- **Node.js**: Version `20.x` or higher
- **npm**: Version `10.x` or higher
- **Git**: Installed and configured

### 9.2 Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/ARYANatGIT/SIH-26079.git
cd SIH-26079

# 2. Configure Backend Environment
# Create/configure .env at the root with your credentials and keys (refer to Section 8.1)

# 3. Set up Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 4. Install Python dependencies
pip install -r requirements.txt

# 5. Start the FastAPI backend service
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

In a separate terminal window:

```bash
# 6. Configure Frontend Environment
cd frontend
# Create/configure .env.local with your backend API URL and keys (refer to Section 8.2)

# 7. Install Node.js dependencies
npm install

# 8. Start the Next.js development server
npm run dev
```

The frontend will be operational at `http://localhost:3000` and the backend service at `http://localhost:8000`.

---

## 10. Deployment via Render Cloud (`render.yaml`)

ForecastGuard includes a production [`render.yaml`](file:///c:/SIH-26079/render.yaml) blueprint enabling one-click deployment:

### 10.1 Steps to Deploy on Render
1. Push your repository to GitHub.
2. Log in to the [Render Cloud Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint** and connect your GitHub repository.
4. Render will read `render.yaml` and provision two services:
   - **`forecastguard-api`**: Python web service running Uvicorn.
   - **`forecastguard-web`**: Node.js web service running Next.js.
5. In the Render Dashboard, set the required environment variables marked with `sync: false`:
   - Under `forecastguard-api`: set `MONGO_URI`, `ADMIN_USER`, `ADMIN_PASS`, and any external API keys (`OPENWEATHER_API_KEY`, `WINDY_MAP_API_KEY`, `CARTO_BASEMAPS_API_KEY`).
   - Under `forecastguard-web`: set `NEXT_PUBLIC_ADMIN_USER`, `NEXT_PUBLIC_ADMIN_PASS`, and client API keys (`NEXT_PUBLIC_WINDY_API_KEY`, `NEXT_PUBLIC_CARTO_API_KEY`, `NEXT_PUBLIC_OPENWEATHER_API_KEY`).
6. Deploy! Render will build and deploy both services with automatic HTTPS certificates.

---

## 11. Automated Verification Suite

Execute the automated verification commands to test model inference, calibration mathematics, and frontend bundle integrity:

```bash
# 1. Execute Next.js frontend production compilation
cd frontend
npm run build

# 2. Execute Python backend health & model verification
python -c "
import os
from backend.services.model_service import model_service
model_service.load_models()
print('ForecastGuard ML Bundle & Calibration Mapping: VERIFIED')
"
```

---

## 12. Institutional Disclaimer

ForecastGuard is an operational meteorological research system designed to support operational forecasters by quantifying numerical weather prediction uncertainty and estimating conditional bust probabilities. All operational warnings should be interpreted in conjunction with official synoptic bulletins issued by the **India Meteorological Department (IMD)** and **National Centre for Medium Range Weather Forecasting (NCMRWF)**.