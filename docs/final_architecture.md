# ForecastGuard AI: Final System Architecture

**Problem Statement ID:** 26079  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** National Centre for Medium Range Weather Forecasting (NCMRWF)  
**Application:** AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts  

---

## 1. End-to-End Architecture Diagram

```mermaid
flowchart TD
    subgraph DataIngestion["1. Data Ingestion & Matching Layer"]
        NWP["Historical NWP Forecasts (NCUM / GFS)"]
        OBS["Verification / Reanalysis (ERA5 / Observations)"]
        MATCH["Strict Spatial-Temporal Matcher (Valid Time, Lat, Lon)"]
        ERR["Forecast Error Engine (Temp, Rain Log1p, Wind Vector, Pressure)"]
        NWP --> MATCH
        OBS --> MATCH
        MATCH --> ERR
    end

    subgraph TargetAndFeatures["2. Bust Target & Anti-Leakage Feature Engine"]
        ERR --> BUST["Phase 4 Bust Labeler (90th Percentile per Lead Day)"]
        NWP --> FE["Feature Engineering (Cyclic Time, Coordinates, Interactions, Lags)"]
        LEAK["Strict Anti-Leakage Gate (Blocks observed_*, error_*, bust)"]
        FE --> LEAK
    end

    subgraph MLInference["3. ML & Decision-Support Core"]
        SPLIT["Chronological Split (70% Train, 15% Val, 15% Test)"]
        LGBM["LightGBM Classifier (scale_pos_weight = 9.1)"]
        CALIB["Isotonic Probability Calibrator (Fitted strictly on Val)"]
        SHAP["Local & Global SHAP Engine (Attribution & Reason Codes)"]
        ANALOG["Historical Analog Search (Euclidean, Prior History Only)"]
        REV["Run-to-Run Revision Analyzer (Consecutive Initialization Cycles)"]

        LEAK --> SPLIT
        SPLIT --> LGBM
        LGBM --> CALIB
        CALIB --> SHAP
        FE --> ANALOG
        NWP --> REV
    end

    subgraph ServiceLayer["4. FastAPI REST Backend (:8000)"]
        API["FastAPI App with Lifespan Loader"]
        END_PRED["/api/v1/predict"]
        END_SHAP["/api/v1/explain"]
        END_ANALOG["/api/v1/analogs"]
        END_REV["/api/v1/revisions"]
        END_GRID["/api/v1/spatial-grid"]
        END_ALL["/api/v1/analyze"]

        CALIB --> API
        SHAP --> API
        ANALOG --> API
        REV --> API
        API --> END_PRED
        API --> END_SHAP
        API --> END_ANALOG
        API --> END_REV
        API --> END_GRID
        API --> END_ALL
    end

    subgraph PresentationLayer["5. Operational Next.js Dashboard (:3000)"]
        UI["Next.js + TypeScript + Tailwind UI"]
        MAP["MapLibre GL India Risk Map (🟢/🟡/🔴)"]
        METRIC["Bust Probability Hero & Confidence Indicator"]
        RECHART1["Bust Probability by Lead Day (Recharts Area)"]
        RECHART2["Model Feature Contributions (Recharts Bar)"]
        ANALOG_UI["Top-5 Historical Cases Table"]
        REV_UI["Run-to-Run Parameter Evolution Timeline"]

        END_ALL --> UI
        END_GRID --> MAP
        UI --> MAP
        UI --> METRIC
        UI --> RECHART1
        UI --> RECHART2
        UI --> ANALOG_UI
        UI --> REV_UI
    end
```

---

## 2. Layer Specifications

### Layer 1: Data Ingestion & Forecast-Observation Matching
- **Input Sources:** Medium-range numerical weather prediction (NWP) forecasts (e.g. NCMRWF NCUM or NOAA GFS) paired with verification data (e.g. IMD ground stations or ECMWF ERA5 reanalysis).
- **Matching Criteria:** Inner join strictly on exact `valid_time`, `latitude`, and `longitude`.
- **Error Calculations:**
  - Temperature: $T_{error} = T_{nwp} - T_{obs}$
  - Rainfall: Log1p absolute deviation $|\log(1 + R_{nwp}) - \log(1 + R_{obs})|$
  - Wind Vector: Pythagorean Euclidean error $\sqrt{(u_{nwp} - u_{obs})^2 + (v_{nwp} - v_{obs})^2}$
  - Combined Normalized Error Score with configurable meteorological weights.

### Layer 2: Target Formulation & Strict Anti-Leakage Gate
- **Forecast Bust Definition:** A binary target where `bust = 1` if `combined_error_score >= P90(lead_day)`.
- **Target Leakage Prevention:** Input feature matrix $X$ strictly forbids any observation variable (`observed_*`), error metric (`error_*`), or target label (`bust`). Any attempt to pass these raises an immediate exception.

### Layer 3: ML Training, Calibration & Interpretability
- **Classifier:** LightGBM Gradient Boosted Decision Trees trained with `scale_pos_weight` to address the ~10% positive class imbalance.
- **Probability Calibration:** Isotonic regression fitted on chronological validation data to guarantee reliable posterior probabilities and minimize Brier score.
- **Explainability:** SHAP (SHapley Additive exPlanations) decomposes single-forecast predictions into positive (risk-increasing) and negative (risk-reducing) forces, mapped to meteorological reason codes.
- **Historical Analogs:** Nearest-neighbor similarity search constrained strictly to past dates ($t_{init} < T_{query}$) to prevent future leakage.
- **Forecast Revision:** Multi-run analysis calculating run-to-run parameter deltas ($T_{-24h} \rightarrow T_{-12h} \rightarrow T_{current}$) to detect numerical forecast instability.

### Layer 4: FastAPI REST API
- Endpoints provide standalone and consolidated access:
  - `GET /api/v1/health`: Service & model status.
  - `GET /api/v1/model`: Hyperparameters, validation, and test metrics.
  - `GET /api/v1/features`: Feature catalog with units and descriptions.
  - `POST /api/v1/predict`: Standalone bust probability and confidence.
  - `POST /api/v1/explain`: Standalone SHAP feature attributions.
  - `POST /api/v1/analogs`: Standalone historical analog retrieval.
  - `POST /api/v1/revisions`: Standalone run-to-run forecast revision tracking.
  - `POST /api/v1/analyze`: Unified decision-support payload.
  - `GET /api/v1/spatial-grid`: Region-wise station bust probabilities for Day 1 to 10 across India.

### Layer 5: Operational Decision-Support Dashboard
- **Tech Stack:** Next.js 16 (Turbopack), TypeScript, Tailwind CSS, MapLibre GL JS, Recharts, Lucide React.
- **Map:** Dynamic dark-matter base map with colored station markers representing model-estimated bust risk.
- **Charts:** Interactive Lead Day uncertainty curve (Day 1 to 10) and SHAP feature attributions.
- **Demonstration Preset:** One-click Waranga Day 5 case loader for operational evaluation.

