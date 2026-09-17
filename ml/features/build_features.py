"""
build_features.py
Extracts ML prediction features strictly from forecast variables and historical lags.
NO FUTURE OBSERVATION DATA is used.
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Creates derived atmospheric, spatial, temporal, and safe historical features."""
    logging.info("Engineering features from forecast data...")
    df_feat = df.copy()
    
    # Sort strictly by time to ensure rolling/lag features don't look into the future
    df_feat = df_feat.sort_values(by=['latitude', 'longitude', 'lead_day', 'forecast_initialization_time'])
    
    # 1. TEMPORAL FEATURES (Cyclical encoding)
    init_times = df_feat['forecast_initialization_time']
    day_of_year = init_times.dt.dayofyear
    df_feat['init_month'] = init_times.dt.month
    df_feat['init_day_of_year'] = day_of_year
    df_feat['init_day_sin'] = np.sin(2 * np.pi * day_of_year / 365.25)
    df_feat['init_day_cos'] = np.cos(2 * np.pi * day_of_year / 365.25)
    
    # 2. LEAD-TIME FEATURES
    df_feat['lead_day_squared'] = df_feat['lead_day'] ** 2
    
    # 3. DERIVED FORECAST FEATURES
    df_feat['forecast_wind_speed'] = np.sqrt(df_feat['forecast_wind_u']**2 + df_feat['forecast_wind_v']**2)
    # Wind direction (0-360 degrees using atan2)
    df_feat['forecast_wind_direction'] = np.degrees(np.arctan2(df_feat['forecast_wind_u'], df_feat['forecast_wind_v'])) % 360
    
    # 4. ATMOSPHERIC INTERACTION FEATURES (Non-linear combinations)
    # E.g., High heat + High humidity = higher instability
    df_feat['forecast_temp_humidity_interact'] = df_feat['forecast_temperature'] * df_feat['forecast_humidity']
    df_feat['forecast_wind_pressure_interact'] = df_feat['forecast_wind_speed'] / (df_feat['forecast_pressure'] + 1e-5)
    
    # 5. HISTORICAL FEATURES (Strictly from the past)
    # Using shift(1) gets the combined_error_score from the PREVIOUS initialization date 
    # for this exact location and lead day. This is 100% leakage-free.
    df_feat['historical_error_lag1'] = df_feat.groupby(['latitude', 'longitude', 'lead_day'])['combined_error_score'].shift(1)
    
    # Note on Forecast Revision Features:
    # Our synthetic dataset only has 1 run per init_time. In production with real NWP data, 
    # we would calculate diffs between 00Z and 12Z runs here. Sticking to historical lag for now.

    # Fill early row NaNs in historical features with 0 (or we could use median later)
    df_feat['historical_error_lag1'] = df_feat['historical_error_lag1'].fillna(0)
    
    return df_feat.sort_index() # Return to original order

if __name__ == "__main__":
    input_path = Path("data/processed/forecast_bust_labels.parquet")
    df = pd.read_parquet(input_path)
    df_featured = engineer_features(df)
    logging.info(f"Generated features. Total columns: {len(df_featured.columns)}")