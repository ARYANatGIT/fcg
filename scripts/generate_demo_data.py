import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Tuple

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Configuration constants
LAT_MIN, LAT_MAX = 8.0, 37.0
LON_MIN, LON_MAX = 68.0, 97.0
RESOLUTION = 1.0
NUM_INIT_DATES = 5
LEAD_DAYS = 10
START_DATE = datetime(2026, 1, 1)

def generate_grid(lat_min: float, lat_max: float, lon_min: float, lon_max: float, res: float) -> pd.DataFrame:
    """Generates a geographical grid DataFrame."""
    lats = np.arange(lat_min, lat_max + res, res)
    lons = np.arange(lon_min, lon_max + res, res)
    
    # Create a meshgrid
    lat_grid, lon_grid = np.meshgrid(lats, lons)
    return pd.DataFrame({
        'latitude': lat_grid.flatten(),
        'longitude': lon_grid.flatten()
    })

def generate_synthetic_weather(df: pd.DataFrame, lead_day: int) -> pd.DataFrame:
    """
    Generates synthetic forecasts and observations. 
    Errors grow with lead_day and specific weather conditions.
    """
    n = len(df)
    
    # Base synthetic 'true' climate patterns (randomized for demonstration)
    base_temp = np.random.uniform(10, 40, n)
    base_rain = np.random.exponential(5, n) # Most days little rain, some days heavy
    base_wind_u = np.random.normal(0, 10, n)
    base_wind_v = np.random.normal(0, 10, n)
    base_pressure = np.random.normal(1010, 5, n)
    base_humidity = np.random.uniform(20, 100, n)
    
    # Base error grows with lead day
    error_scale = 1.0 + (lead_day * 0.5)
    
    # Create challenging scenarios: high rain or rapid pressure change increases error
    difficulty_multiplier = np.where(base_rain > 15, 2.0, 1.0)
    difficulty_multiplier = np.where(base_pressure < 1000, difficulty_multiplier * 1.5, difficulty_multiplier)
    
    total_error_scale = error_scale * difficulty_multiplier
    
    # Generate Forecasts (Base + some model bias/noise)
    df['forecast_temperature'] = base_temp + np.random.normal(0, 1.5 * total_error_scale, n)
    df['forecast_rainfall'] = np.clip(base_rain + np.random.normal(0, 2.0 * total_error_scale, n), 0, None)
    df['forecast_wind_u'] = base_wind_u + np.random.normal(0, 1.0 * total_error_scale, n)
    df['forecast_wind_v'] = base_wind_v + np.random.normal(0, 1.0 * total_error_scale, n)
    df['forecast_pressure'] = base_pressure + np.random.normal(0, 1.0 * total_error_scale, n)
    df['forecast_humidity'] = np.clip(base_humidity + np.random.normal(0, 3.0 * total_error_scale, n), 0, 100)

    # Generate Observations (Base + very small instrument noise)
    df['observed_temperature'] = base_temp + np.random.normal(0, 0.2, n)
    df['observed_rainfall'] = np.clip(base_rain + np.random.normal(0, 0.5, n), 0, None)
    df['observed_wind_u'] = base_wind_u + np.random.normal(0, 0.5, n)
    df['observed_wind_v'] = base_wind_v + np.random.normal(0, 0.5, n)
    df['observed_pressure'] = base_pressure + np.random.normal(0, 0.5, n)
    df['observed_humidity'] = np.clip(base_humidity + np.random.normal(0, 1.0, n), 0, 100)
    
    return df

def create_dataset() -> pd.DataFrame:
    """Orchestrates the generation of the full dataset."""
    logging.warning("GENERATING SYNTHETIC DEMONSTRATION DATA — NOT REAL WEATHER DATA")
    grid_df = generate_grid(LAT_MIN, LAT_MAX, LON_MIN, LON_MAX, RESOLUTION)
    
    all_data = []
    
    for day_offset in range(NUM_INIT_DATES):
        init_time = START_DATE + timedelta(days=day_offset)
        
        for lead_day in range(1, LEAD_DAYS + 1):
            valid_time = init_time + timedelta(days=lead_day)
            
            # Copy grid for this time slice
            slice_df = grid_df.copy()
            slice_df['forecast_initialization_time'] = init_time
            slice_df['forecast_valid_time'] = valid_time
            slice_df['lead_day'] = lead_day
            
            # Populate weather variables
            slice_df = generate_synthetic_weather(slice_df, lead_day)
            all_data.append(slice_df)
            
    final_df = pd.concat(all_data, ignore_index=True)
    return final_df

if __name__ == "__main__":
    output_dir = Path("data/synthetic")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    dataset = create_dataset()
    output_path = output_dir / "weather_demo.parquet"
    
    # Save as Parquet
    dataset.to_parquet(output_path, index=False)
    
    logging.info(f"Generated {len(dataset)} rows of synthetic data.")
    logging.info(f"Saved dataset to {output_path}")