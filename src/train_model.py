"""
ForecastGuard AI — Machine Learning Training Pipeline (Phase 2)
Connects to MongoDB, queries 'real_time_data', preprocesses features with rolling statistics,
scales features, trains a LightGBM regressor, and serializes the pipeline using joblib.
"""

import sys
import logging
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import lightgbm as lgb

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.db import get_real_time_collection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("train_model")

MODEL_OUTPUT_DIR = ROOT_DIR / "models"
MODEL_OUTPUT_PATH = MODEL_OUTPUT_DIR / "lgbm_regression.joblib"


def load_data_from_mongodb() -> pd.DataFrame:
    """Queries the real_time_data MongoDB collection and returns a DataFrame."""
    collection = get_real_time_collection()
    records = collection.find()
    
    if not records:
        raise ValueError("No records found in MongoDB collection 'real_time_data'. Run src/data_ingestion.py first.")
    
    df = pd.DataFrame(records)
    logger.info(f"Loaded {len(df)} raw records from MongoDB collection 'real_time_data'.")
    return df


def preprocess_data(df: pd.DataFrame):
    """
    Handles missing values, creates rolling averages, and structures the regression dataset.
    Target: Temperature in the next period (1-step forward forecast).
    """
    # Sort chronologically
    time_col = "timestamp" if "timestamp" in df.columns else "observed_time"
    df[time_col] = pd.to_datetime(df[time_col], errors="coerce")
    df = df.sort_values(by=time_col).reset_index(drop=True)

    # Core base features
    base_features = [
        "temperature_2m",
        "relative_humidity_2m",
        "surface_pressure",
        "wind_speed_10m",
    ]
    for col in base_features:
        if col not in df.columns:
            df[col] = 0.0
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Handle missing values via forward/backward fill
    df[base_features] = df[base_features].ffill().bfill()

    # Feature Engineering: 3-point rolling averages and volatility
    df["rolling_temp_mean_3"] = df["temperature_2m"].rolling(window=3, min_periods=1).mean()
    df["rolling_temp_std_3"] = df["temperature_2m"].rolling(window=3, min_periods=1).std().fillna(0.0)
    df["rolling_pressure_mean_3"] = df["surface_pressure"].rolling(window=3, min_periods=1).mean()
    df["rolling_humidity_mean_3"] = df["relative_humidity_2m"].rolling(window=3, min_periods=1).mean()

    # Target variable: Next-hour/next-period temperature
    df["target_temp_next"] = df["temperature_2m"].shift(-1)

    # Drop the terminal record without future target
    clean_df = df.dropna(subset=["target_temp_next"]).copy()

    feature_cols = [
        "temperature_2m",
        "relative_humidity_2m",
        "surface_pressure",
        "wind_speed_10m",
        "rolling_temp_mean_3",
        "rolling_temp_std_3",
        "rolling_pressure_mean_3",
        "rolling_humidity_mean_3",
    ]

    X = clean_df[feature_cols].values
    y = clean_df["target_temp_next"].values

    return X, y, feature_cols, clean_df


def train_and_evaluate_model():
    """Executes the full ML training and serialization pipeline."""
    logger.info("Connecting to MongoDB and pulling real-time meteorological observations...")
    raw_df = load_data_from_mongodb()

    logger.info("Preprocessing data and computing rolling statistical features...")
    X, y, feature_cols, processed_df = preprocess_data(raw_df)
    logger.info(f"Processed dataset shape: {X.shape[0]} samples with {X.shape[1]} features.")

    # Chronological train/test split (80% train, 20% test)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    logger.info(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train LightGBM Regressor
    logger.info("Training LightGBM Regressor...")
    model = lgb.LGBMRegressor(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=5,
        num_leaves=31,
        random_state=42,
        verbosity=-1,
    )
    model.fit(X_train_scaled, y_train)

    # Predictions & Metrics
    preds = model.predict(X_test_scaled)
    mae = float(mean_absolute_error(y_test, preds))
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = float(r2_score(y_test, preds))

    logger.info("==================================================")
    logger.info("MODEL EVALUATION METRICS:")
    logger.info(f"  Mean Absolute Error (MAE):  {mae:.4f} °C")
    logger.info(f"  Root Mean Squared Error (RMSE): {rmse:.4f} °C")
    logger.info(f"  R² Score (Variance Explained):   {r2:.4f}")
    logger.info("==================================================")

    # Serialize trained pipeline bundle
    MODEL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model": model,
        "scaler": scaler,
        "features": feature_cols,
        "target": "target_temp_next",
        "metrics": {
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
    }

    joblib.dump(bundle, MODEL_OUTPUT_PATH)
    logger.info(f"Successfully saved trained model bundle to {MODEL_OUTPUT_PATH}")

    return bundle


if __name__ == "__main__":
    train_and_evaluate_model()

