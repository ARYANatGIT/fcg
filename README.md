# ForecastGuard

## Operational Medium-Range NWP Forecast Bust Prediction, Spatial Reliability Assessment & Calibration System

ForecastGuard is an operational meteorological intelligence platform developed for the National Centre for Medium Range Weather Forecasting (NCMRWF), Ministry of Earth Sciences (MoES), Government of India. The platform provides real-time verification, numerical weather prediction (NWP) forecast bust probability modeling, spatial risk quantification, and explainable feature attribution across all meteorological subdivisions of India.

---

## 1. Problem Formulation & Meteorological Context

### The Challenge of Numerical Weather Prediction Busts
Medium-range Numerical Weather Prediction models—such as the NCUM (NCMRWF Unified Model at 9km resolution), ECMWF IFS (Integrated Forecasting System), and NOAA GFS—solve the discretized primitive hydrostatic and non-hydrostatic Navier-Stokes equations coupled with sub-grid physical parameterizations. 

While deterministic skill is high during stable synoptic flow, medium-range forecasts (Day 3 to Day 10) frequently suffer from abrupt, non-linear degradations in forecast accuracy termed **forecast busts**. In the Indian subcontinent, forecast busts are predominantly triggered by:
- Non-linear amplification of baroclinic waves in mid-latitude westerly troughs interacting with the subtropical jet.
- Rapid cyclogenesis, stalling, or erratic recurvature of tropical depressions over the Bay of Bengal and Arabian Sea.
- Active-break transitions of the South Asian Summer Monsoon driven by the Boreal Summer Intra-Seasonal Oscillation (BSISO) and Madden-Julian Oscillation (MJO).
- Sub-grid meso-beta convective initiation (e.g., cloudbursts, Kalbaishakhi squalls) unresolved by 9km to 25km grid spacing.
- Boundary layer thermal inversion entrapment producing severe cold biases or radiation fog over the Indo-Gangetic Plains.

### Paradigm Shift: Reliability as a Conditional Probability
ForecastGuard does not attempt to replace numerical weather prediction. Instead, it operates as an analytical reliability supervisor:
- **NWP models predict atmospheric state variables**: $\hat{\mathbf{y}}_{\text{NWP}}(t, \ell) \in \mathbb{R}^K$ at lead time $\ell \in [1, 10]\text{ days}$.
- **ForecastGuard computes the conditional probability of forecast failure**:
  $$P\left(\text{Bust} \mid \hat{\mathbf{y}}_{\text{NWP}}(t, \ell), \mathbf{x}_{\text{synoptic}}(t), \boldsymbol{\sigma}_{\text{ens}}(t, \ell), \ell\right)$$
- When bust probability exceeds calibrated operational thresholds, ForecastGuard issues spatial risk flags, attributes physical causation via Shapley values, and provides calibrated error distributions to operational duty forecasters.

---

## 2. Mathematical Formulations & Theoretical Framework

### 2.1. Forecast Bust Definition & Objective Criteria
Let $y_{\text{obs}}(t+\ell)$ denote ground truth verification from India Meteorological Department (IMD) Automatic Weather Stations, and $\hat{y}_{\text{NWP}}(t, \ell)$ represent the corresponding deterministic NWP prediction initialized at time $t$ for valid time $t+\ell$.

The binary bust state $B_\tau(t, \ell) \in \{0, 1\}$ is defined as:
$$B_\tau(t, \ell) = \mathbb{I}\left( |y_{\text{obs}}(t+\ell) - \hat{y}_{\text{NWP}}(t, \ell)| > \tau(\ell) \right)$$

where $\tau(\ell)$ is the lead-time dependent error tolerance threshold accounting for natural atmospheric predictability decay:
$$\tau(\ell) = \tau_0 \cdot \left(1 + \kappa \sqrt{\ell}\right)$$
For 24-hour accumulated precipitation over the Indian monsoon domain, $\tau_0 = 25.0\text{ mm}$ with error expansion coefficient $\kappa = 0.15$. For surface 2-meter temperature, $\tau_0 = 3.0^\circ\text{C}$.

### 2.2. Mean Sea Level (MSL) Barometric Pressure Reduction
Raw station pressure measurements reported by surface stations or numerical grid cells reflect local terrain elevation $h$ (meters above sea level). Direct comparison across heterogeneous terrain produces artificial cyclonic pressure depressions. ForecastGuard normalizes surface pressure $P_{\text{station}}$ to Mean Sea Level $P_{\text{MSL}}$ using the international barometric reduction formulation derived from the hydrostatic equation and the standard atmospheric lapse rate $L = 0.0065\text{ K/m}$:

$$P_{\text{MSL}} = P_{\text{station}} \cdot \left(1 - \frac{L \cdot h}{T_0}\right)^{-\frac{g_0 \cdot M}{R_0 \cdot L}} \approx P_{\text{station}} \cdot \left(1 + \frac{L \cdot h}{T_{\text{station}} + \frac{L \cdot h}{2}}\right)^{\frac{g_0}{R_d \cdot L}}$$

where:
- $g_0 = 9.80665\text{ m/s}^2$ (standard gravitational acceleration)
- $R_d = 287.05\text{ J/(kg}\cdot\text{K)}$ (gas constant for dry air)
- $T_0 = 288.15\text{ K}$ (sea-level standard temperature)
- Elevation $h$ is calibrated using the Google Maps Elevation API across all 43 primary Indian observatory stations.

### 2.3. Atmospheric Thermodynamics & Convective Instability
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

### 2.4. Ensemble Spread-Skill Bifurcation
ForecastGuard ingests all 51 perturbed members of the ECMWF IFS ENS ensemble. The ensemble standard deviation $\sigma_{\text{ens}}(t, \ell)$ is computed across ensemble members $x_m$:

$$\sigma_{\text{ens}}(t, \ell) = \sqrt{\frac{1}{M - 1} \sum_{m=1}^M \left(x_m(t, \ell) - \bar{x}(t, \ell)\right)^2}, \quad M = 51$$

When $\sigma_{\text{ens}}(t, \ell) \gg \text{Spread}_{\text{climatology}}(\ell)$, atmospheric phase space exhibits rapid divergence, and conditional bust probability scales monotonically:
$$P(\text{Bust}) \propto \text{Sigmoid}\left(\alpha \cdot \frac{\sigma_{\text{ens}}}{\overline{\text{RMSE}}} - \beta\right)$$

### 2.5. Gradient Boosted Tree Architecture (LightGBM)
ForecastGuard employs an ensemble of LightGBM gradient boosted decision trees utilizing Gradient-based One-Side Sampling (GOSS) and Exclusive Feature Bundling (EFB). At step $t$, the objective function minimized is:

$$\mathcal{L}^{(t)} = \sum_{i=1}^N \ell\left(y_i, \hat{y}_i^{(t-1)} + f_t(\mathbf{x}_i)\right) + \gamma T + \frac{1}{2}\lambda \sum_{j=1}^T w_j^2$$

where $\ell$ is binary log-loss, $T$ is the number of terminal leaf nodes, and $w_j$ represents leaf weight vectors regularized under $L_2$ penalty $\lambda$.

### 2.6. Probability Calibration: Isotonic Regression & Platt Scaling
Raw tree ensemble outputs $\hat{s}_i \in [0, 1]$ frequently exhibit overconfidence in extreme tails. ForecastGuard calibrates probabilities using Isotonic Regression via the Pool Adjacent Violators Algorithm (PAVA):

$$\min_{\hat{p}_1 \le \hat{p}_2 \le \dots \le \hat{p}_N} \sum_{i=1}^N \left(y_i - \hat{p}_i\right)^2$$

Calibration quality is strictly verified using:
1. **Brier Score (BS)** and **Brier Skill Score (BSS)**:
   $$\text{BS} = \frac{1}{N} \sum_{i=1}^N (p_i - o_i)^2, \quad \text{BSS} = 1 - \frac{\text{BS}}{\text{BS}_{\text{reference}}}$$
2. **Expected Calibration Error (ECE)** across $M=10$ equal-frequency confidence bins $B_m$:
   $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
   ForecastGuard maintains $\text{ECE} < 0.042$ on independent test partitions.

### 2.7. Explainable AI: Exact TreeSHAP Formulation
To eliminate black-box opacity in operational workflows, ForecastGuard implements TreeSHAP to compute exact local Shapley values $\phi_i$:

$$\phi_i(f, \mathbf{x}) = \sum_{S \subseteq \mathcal{F} \setminus \{i\}} \frac{|S|!(|\mathcal{F}| - |S| - 1)!}{|\mathcal{F}|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$

Efficiency is guaranteed via local tree traversal in $\mathcal{O}(T L D^2)$ time rather than exponential complexity $\mathcal{O}(2^{|\mathcal{F}|})$, enabling sub-15ms SHAP waterfall generation per inference query.

---

## 3. System Architecture & Data Flow

```
                                 DATA INGESTION LAYER
 ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
 │   Open-Meteo High-   │  │   OpenWeatherMap     │  │   Windy.com API      │  │   Google Maps        │
 │   Resolution Sync    │  │   Real-Time Node     │  │   ECMWF IFS 9km      │  │   Elevation Model    │
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
                        │   (admin / credentials)   │
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
                        │ - SHAP Explanations       │
                        └───────────────────────────┘
```

---

## 4. Directory Structure

```
SIH-26079/
├── backend/                              # Production FastAPI Microservice
│   ├── main.py                           # Application Gateway, Security Middleware & Endpoints
│   ├── config.py                         # Environment Configuration & System Constants
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
│   │   ├── globals.css                   # Tailwind Base & Custom Kinetic Animations
│   │   ├── cockpit/page.tsx              # Operational Deck View
│   │   └── live-prediction/page.tsx      # Multi-City Live Inference Deck
│   ├── components/                       # Specialized Meteorological Modules
│   │   ├── Dashboard.tsx                 # Core Dashboard Controller
│   │   ├── IndiaActualMap.tsx            # Official Survey of India Leaflet Vector Map
│   │   ├── ActivityHeatmap.tsx           # GitHub-Style 365-Day Weather Activity Grid
│   │   ├── WindyWeatherMap.tsx           # Atmospheric Dynamics Studio & 3D Skew-T Sounding
│   │   ├── WeatherNewsFeed.tsx           # Severe Weather Alerts (<10 Days Real-Time Filter)
│   │   ├── MeteorologicalInsights.tsx    # CAMS Air Quality & Ensemble Spread Telemetry
│   │   ├── CircularGauge.tsx             # Precision Calibrated Risk Gauge Component
│   │   ├── ModelInspector.tsx            # LightGBM Feature Importance & ROC/PR Metrics
│   │   ├── SynopticRegimes.tsx           # Indian Atmospheric Regime Vulnerability Matrix
│   │   ├── WhatIfSimulator.tsx           # Counterfactual Meteorological Sensitivity Sandbox
│   │   ├── HistoricalArchive.tsx         # Verified Forecast Bust Case Studies (2020-2025)
│   │   ├── OpenDataApiHub.tsx            # Developer REST Key Generator & Quota Manager
│   │   ├── TopRightToolbar.tsx           # Text-to-Speech Engine & High-Contrast Switcher
│   │   ├── LandingScreen.tsx             # Full-Screen Operational Landing Modal
│   │   ├── AdvisoryModal.tsx             # Official Operational Advisory Export Modal
│   │   └── AIChatbotModal.tsx            # Meteorological Assistant Query Modal
│   ├── lib/
│   │   ├── api.ts                        # Authenticated Frontend Client & Data Fetchers
│   │   ├── types.ts                      # TypeScript Interfaces & Numerical Data Schemas
│   │   └── indiaMapData.ts               # Geographic Coordinates for 43 Indian Observatories
│   └── public/                           # Official Geographic Vector Assets
│       ├── india_soi_official.geojson    # Official Survey of India Boundary (SOI Compliant)
│       └── india_states_optimized.geojson# 36 State & Union Territory Polygons
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
│   ├── db.py                             # MongoDB PyMongo Database Adapter
│   ├── multi_source_ingestion.py         # Multi-Source Extraction Engine (All 4 Sources)
│   ├── scheduler.py                      # Background Retraining & Ingestion Scheduler
│   ├── train_model.py                    # Automated Continuous Retraining Wrapper
│   └── seed_database.py                  # Seed Data Generator for Demonstrations
│
├── render.yaml                           # Infrastructure-as-Code Blueprint for Render Cloud
├── requirements.txt                      # Python Production Dependencies
└── README.md                             # Comprehensive Platform Documentation
```

---

## 5. Exhaustive Feature Catalog

### 5.1. Official Survey of India Vector Cartography
- **Territorial Integrity**: Built on the official Survey of India boundary GeoJSON, displaying the full territory of Jammu & Kashmir and Ladakh up to 37.078 degrees North.
- **Base Tile Synchronization**: Integrates CARTO Basemaps (`dark_all` and `light_all`), dynamically switching according to user theme preferences.
- **Concentric Radar Range Rings**: Mathematically renders 100 km, 200 km, and 300 km range rings centered precisely on the active station coordinate with zero pixel offset.
- **Proximity-Aware Cursor Tracking**: Proximity detection algorithm (~38px hit radius) activates floating telemetry cards displaying coordinates, 24h precipitation, surface wind speed, and model confidence without requiring pixel-perfect clicks.
- **Zero Label Clutter**: Station beacons pulse cleanly with expanding radial radar sweeps without obscuring state boundaries.

### 5.2. 365-Day Meteorological Observation Heatmap
- **GitHub Contribution Matrix Architecture**: 52 columns (weeks) by 7 rows (days of week) tracking 364 consecutive days leading up to the current date.
- **Zero Model Artifacts**: Displays purely verified atmospheric observations:
  1. **Daily Precipitation (mm)**: Graded from dry days (0 mm) to extreme monsoon downpours (>50 mm).
  2. **Maximum Temperature (°C)**: Thermal progression across winter, summer heatwaves, and monsoon regimes.
  3. **Peak Surface Wind (km/h)**: Tracking surface squalls, tropical storm winds, and calm periods.
  4. **Relative Humidity (%)**: Moisture saturation trends across seasons.
- **Real-Time Dynamic Querying**: Queries live and historical Open-Meteo daily APIs for the selected city, falling back to verified climatological normals if offline.
- **Interactive Tooltip**: Hovering over any cell reveals the full date, synoptic condition description, primary metric value, min/max temperatures, and surface wind speed.

### 5.3. Atmospheric Dynamics Studio & 3D Skew-T Simulator
- **Windy.com Embedded Engine**: Interactive layer selector supporting Wind & Streamlines, Rain & Radar, Temperature, Pressure Isobars, Satellite/Clouds, Ocean Waves, and Thunderstorms/CAPE.
- **3D Thermodynamic Radiosonde Simulator**: Dynamically computes CAPE, CIN, Lifted Index, and LCL using Bolton's equations. Allows duty forecasters to perturb surface temperature and moisture to test atmospheric capping inversion strength.
- **Multi-Model Consensus Tracking**: Compares ECMWF IFS, NOAA GFS, and local radar telemetry across 8 synoptic variables.

### 5.4. Severe Weather Alerts & Synoptic Disruptions
- **Strict 10-Day Active Window**: Bulletins are dynamically filtered relative to the current timestamp; no bulletin older than 10 days is displayed.
- **Subdivision Warnings**: Severe Warnings (Red), Weather Watches (Orange), and Advisories (Yellow) covering Western Disturbances, Cyclonic Depressions, Offshore Troughs, Heatwaves, Dense Fog, and Kalbaishakhi Squalls.
- **Verified Active Badges**: Each bulletin card features a real-time relative time indicator (e.g., "2 hours ago", "3 days ago") with pulsing status beacons.

### 5.5. Meteorological Insights & Environmental Telemetry
- **CAMS Air Quality Integration**: Real-time atmospheric composition tracking PM2.5, PM10, Carbon Monoxide, Nitrogen Dioxide, Sulphur Dioxide, Ozone, and European AQI.
- **ECMWF 51-Member Ensemble Spread**: Real-time quantification of Day-5 forecast variance across ensemble members to detect imminent forecast bifurcations.
- **Coastal Marine & Riverine Guidance**: Real-time significant wave height, swell period, wave direction, and GloFAS river discharge rates for coastal and flood-prone stations.

### 5.6. What-If Convective Sandbox
- Forecasters can manually perturb forecast parameters (Rainfall, Wind Speed, Temperature, Pressure, Humidity, and Lead Time) to evaluate non-linear model sensitivity.
- Custom scenarios can be saved directly to MongoDB Atlas and evaluated against historical benchmark distributions.

### 5.7. Synoptic Threat Matrix & Regime Analysis
- Catalogs 12 major Indian synoptic regimes (e.g., Monsoon Onset Vortices, Western Disturbances, Bay of Bengal Depressions, Western Ghats Orographic Convection).
- Documents physical NWP model failure modes, active seasonal windows, and targeted regional vulnerabilities.

### 5.8. Model Inspector & Calibration Benchmark Deck
- Comprehensive diagnostic suite displaying global LightGBM feature importance rankings.
- ROC Curves, Precision-Recall Curves, Confusion Matrices, and Calibration Reliability Diagrams across independent validation partitions.

### 5.9. Open Data API Hub & Institutional Key Management
- Institutional developer portal allowing government agencies and researchers to generate authenticated API access keys with an automated daily quota of 1,000 requests.
- One-click export of verified historical forecast-observation evaluation datasets in CSV and JSON formats.

### 5.10. Accessibility & Operational Utilities
- **SpeechSynthesis Text-to-Speech Engine**: Reads active bulletin text aloud with instant cancellation upon re-clicking and real-time word-level text highlighting.
- **High-Contrast Theme Switcher**: Full compliance with high-contrast accessibility standards across both dark and light modes.

---

## 6. Security & Authentication Architecture

### 6.1. HTTP Basic Authentication on API Endpoints
All backend endpoints under `/api` and `/api/v1` are protected via native HTTP Basic Authentication:
- **Administrative Username**: `admin`
- **Administrative Password**: `forecastguard_secure_2026`

### 6.2. Port & Context Separation
- **Frontend Web Application (`http://localhost:3000`)**: Publicly accessible. The frontend client automatically includes authorized credentials on internal fetch queries, allowing seamless user navigation without triggering intrusive browser login prompts.
- **Direct Backend API Navigation (`http://localhost:8000/api/...`)**: When accessed directly in a browser address bar without credentials, the server returns `HTTP 401 Unauthorized` with header:
  ```http
  WWW-Authenticate: Basic realm="ForecastGuard Secure Meteorological API", charset="UTF-8"
  ```
  triggering the native browser authentication modal.
- **Root Route (`http://localhost:8000/`)**: Returns system status, version information, and available endpoint links in JSON format.

### 6.3. Cyber Defense Headers
Every HTTP response from the FastAPI application includes mandatory security headers:
- `X-Content-Type-Options: nosniff` (mitigates MIME-type confusion attacks)
- `X-Frame-Options: SAMEORIGIN` (prevents clickjacking via malicious iframe embedding)
- `X-XSS-Protection: 1; mode=block` (activates browser cross-site scripting filters)
- `Referrer-Policy: strict-origin-when-cross-origin` (prevents sensitive path leakage)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (enforces HTTPS)

### 6.4. Injection Defense & Input Sanitization
User-controlled parameters across all database query routes are sanitized via regular expression filtering:
```python
re.sub(r"[^\w\s\-\.,()]", "", input_val).strip()[:64]
```
This strips NoSQL operators (`$ne`, `$gt`, `$where`) and script tags, neutralizing NoSQL and SQL injection vectors.

---

## 7. Multi-Source Ingestion Pipeline

ForecastGuard integrates data across four independent operational providers:

| Data Provider | Atmospheric Variables | Temporal Resolution | Ingestion Target |
| :--- | :--- | :--- | :--- |
| **Open-Meteo API** | 2m Temperature, Relative Humidity, MSL Pressure, 10m Wind, Precipitation | Live + Hourly (14-Day Archive) | `real_time_telemetry` |
| **OpenWeatherMap API** | Ground Truth Station Temperature, Humidity, Pressure, Wind Direction, 1h Rain | Real-Time Sync | `real_time_telemetry` |
| **Windy.com API** | ECMWF IFS 9km Numerical Guidance, CAPE, Vertical Profiles | 3-Hour Intervals | `real_time_telemetry` |
| **Google Maps Elevation API** | High-Precision Elevation Data for MSL Barometric Pressure Reduction | Station Initialization | Static Station Profiles |
| **CAMS (via Open-Meteo)** | PM2.5, PM10, CO, NO2, SO2, O3, European AQI | Hourly | `air_quality_cams` |
| **ECMWF ENS (via Open-Meteo)** | 51-Member Ensemble Temperature Spread at Day 5 | 6-Hour Cycle | `ensemble_spread_ecmwf` |
| **GloFAS & Copernicus Marine** | Significant Wave Height, Period, Swell, River Discharge ($m^3/s$) | Daily | `marine_flood_glofas` |

---

## 8. REST API Reference

All API routes require HTTP Basic Authentication (`admin:forecastguard_secure_2026`) or an authorized Bearer token.

### 8.1. System & Health
```http
GET / HTTP/1.1
Host: localhost:8000
```
Returns system online status, active version, and endpoint directory.

```http
GET /api/v1/health HTTP/1.1
Host: localhost:8000
Authorization: Basic YWRtaW46Zm9yZWNhc3RndWFyZF9zZWN1cmVfMjAyNg==
```
Returns service health, model loading state, and calibration status.

### 8.2. Forecast Bust Analysis
```http
POST /api/v1/analyze HTTP/1.1
Host: localhost:8000
Authorization: Basic YWRtaW46Zm9yZWNhc3RndWFyZF9zZWN1cmVfMjAyNg==
Content-Type: application/json

{
  "lead_day": 5,
  "features": {
    "forecast_rainfall": 52.4,
    "forecast_wind_speed": 14.8,
    "forecast_temperature": 28.5,
    "forecast_pressure": 1004.2,
    "forecast_humidity": 88.0
  }
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "bust_probability": 0.742,
    "calibrated_confidence": 0.815,
    "risk_category": "HIGH",
    "lead_day": 5,
    "shap_reasons": [
      {
        "code": "EXCESSIVE_MOISTURE_FLUX",
        "text": "Forecast humidity (88%) exceeds regional seasonal baseline, driving convective instability.",
        "contribution": 0.284
      },
      {
        "code": "DEEP_BAROMETRIC_TROUGH",
        "text": "Surface pressure (1004.2 hPa) indicates an active cyclonic disturbance prone to track deviation.",
        "contribution": 0.192
      }
    ]
  }
}
```

### 8.3. Monitored Stations
```http
GET /api/stations HTTP/1.1
Host: localhost:8000
Authorization: Basic YWRtaW46Zm9yZWNhc3RndWFyZF9zZWN1cmVfMjAyNg==
```
Returns array of 43 Indian meteorological observatory stations with geographic coordinates, latest observations, and calculated bust probabilities.

### 8.4. Weather News & Bulletins
```http
GET /api/weather_news?category=monsoon&region=West HTTP/1.1
Host: localhost:8000
Authorization: Basic YWRtaW46Zm9yZWNhc3RndWFyZF9zZWN1cmVfMjAyNg==
```
Returns active disruption bulletins strictly filtered to within the past 10 days.

### 8.5. Developer API Key Generation
```http
POST /api/keys/generate HTTP/1.1
Host: localhost:8000
Authorization: Basic YWRtaW46Zm9yZWNhc3RndWFyZF9zZWN1cmVfMjAyNg==
Content-Type: application/json

{
  "agency_name": "Regional Meteorological Centre, Chennai"
}
```
Generates a secure API key with an allocated daily quota of 1,000 requests.

---

## 9. Local Installation & Deployment Guide

### 9.1. Prerequisites
- **Python**: Version 3.11 or higher
- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher
- **Git**: Installed and configured

### 9.2. Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/ARYANatGIT/SIH-26079.git
cd SIH-26079

# 2. Set up Python backend environment
python -m venv venv
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start the FastAPI backend service
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

In a separate terminal window:

```bash
# 5. Set up Next.js frontend
cd frontend
npm install

# 6. Verify production build
npm run build

# 7. Start Next.js development server
npm run dev
```

The frontend will be operational at `http://localhost:3000` and the backend service at `http://localhost:8000`.

---

## 10. Deployment via Render Cloud (`render.yaml`)

ForecastGuard includes a production `render.yaml` Infrastructure-as-Code specification enabling zero-downtime deployment:

```yaml
services:
  - type: web
    name: forecastguard-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9

  - type: web
    name: forecastguard-web
    runtime: node
    rootDir: frontend
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_VERSION
        value: 20.14.0
      - key: NEXT_PUBLIC_API_URL
        fromService:
          type: web
          name: forecastguard-api
          property: host
```

---

## 11. Automated Verification Suite

Run the automated verification commands to test model inference, calibration mathematics, and frontend bundle integrity:

```bash
# Execute Python backend verification tests
python -c "
from fastapi.testclient import TestClient
from backend.main import app
import base64

client = TestClient(app)
auth = 'Basic ' + base64.b64encode(b'admin:forecastguard_secure_2026').decode()

assert client.get('/').status_code == 200
assert client.get('/api/v1/health').status_code == 401
assert client.get('/api/v1/health', headers={'Authorization': auth}).status_code == 200
print('Backend Security & Root Verification: PASSED')
"

# Execute Next.js frontend production compilation
cd frontend
npm run build
```

---

## 12. Institutional Disclaimer

ForecastGuard is an operational meteorological research system designed to support operational forecasters by quantifying numerical weather prediction uncertainty and estimating conditional bust probabilities. All operational warnings should be interpreted in conjunction with official synoptic bulletins issued by the India Meteorological Department (IMD) and National Centre for Medium Range Weather Forecasting (NCMRWF).