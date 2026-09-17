import pandas as pd
import numpy as np
import logging
from pathlib import Path
import sys

# Add root directory to path to import config
sys.path.append(str(Path(__file__).resolve().parents[2]))
from scripts.config import ERROR_WEIGHTS

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def validate_data(df: pd.DataFrame) -> pd.DataFrame:
    """Validates data for NaNs, infinites, and negative rainfall."""
    initial_len = len(df)
    
    # Check for Inf/NaN
    df = df.replace([np.inf, -np.inf], np.nan)
    nan_count = df.isna().sum().sum()
    if nan_count > 0:
        logging.warning(f"Found {nan_count} NaN/Inf values. Dropping affected rows.")
        df = df.dropna()
        
    # Check physical bounds (Negative rainfall)
    neg_rain = len(df[(df['forecast_rainfall'] < 0) | (df['observed_rainfall'] < 0)])
    if neg_rain > 0:
        logging.warning(f"Found {neg_rain} rows with negative rainfall. Dropping them.")
        df = df[(df['forecast_rainfall'] >= 0) & (df['observed_rainfall'] >= 0)]
        
    final_len = len(df)
    logging.info(f"Data validation complete. Original rows: {initial_len}, Valid rows: {final_len}")
    return df

def calculate_errors(df: pd.DataFrame) -> pd.DataFrame:
    """Calculates biases, absolute errors, and specialized errors (vector/log)."""
    # 1. Absolute Errors
    df['temperature_absolute_error'] = np.abs(df['forecast_temperature'] - df['observed_temperature'])
    df['pressure_absolute_error'] = np.abs(df['forecast_pressure'] - df['observed_pressure'])
    df['humidity_absolute_error'] = np.abs(df['forecast_humidity'] - df['observed_humidity'])
    
    # 2. Wind Errors (Vector and Speed)
    df['forecast_wind_speed'] = np.sqrt(df['forecast_wind_u']**2 + df['forecast_wind_v']**2)
    df['observed_wind_speed'] = np.sqrt(df['observed_wind_u']**2 + df['observed_wind_v']**2)
    
    df['wind_speed_error'] = np.abs(df['forecast_wind_speed'] - df['observed_wind_speed'])
    df['wind_vector_error'] = np.sqrt(
        (df['forecast_wind_u'] - df['observed_wind_u'])**2 + 
        (df['forecast_wind_v'] - df['observed_wind_v'])**2
    )
    
    # 3. Rainfall Error (Log-transformed to handle skewed distributions gracefully)
    df['rainfall_absolute_error'] = np.abs(df['forecast_rainfall'] - df['observed_rainfall'])
    df['rainfall_log_error'] = np.abs(np.log1p(df['forecast_rainfall']) - np.log1p(df['observed_rainfall']))
    
    # 4. Biases (Signed errors)
    df['temperature_bias'] = df['forecast_temperature'] - df['observed_temperature']
    df['pressure_bias'] = df['forecast_pressure'] - df['observed_pressure']
    df['rainfall_bias'] = df['forecast_rainfall'] - df['observed_rainfall']
    df['wind_u_bias'] = df['forecast_wind_u'] - df['observed_wind_u']
    df['wind_v_bias'] = df['forecast_wind_v'] - df['observed_wind_v']
    
    return df

def normalize_and_combine(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalizes errors using Robust Scaling (Median/IQR) and computes combined score.
    
    IMPORTANT ML LEAKAGE WARNING: 
    For Phase 2, we are scaling across the entire dataset for visualization. 
    In Phase 4/5, these normalization statistics (median/IQR) MUST BE FITTED ONLY ON 
    THE TRAINING SET to prevent data leakage into the test set.
    """
    # Errors to normalize
    error_cols = {
        'temperature': 'temperature_absolute_error',
        'rainfall': 'rainfall_log_error',
        'wind': 'wind_vector_error',
        'pressure': 'pressure_absolute_error',
        'humidity': 'humidity_absolute_error'
    }
    
    combined_score = np.zeros(len(df))
    
    for var, col_name in error_cols.items():
        median = df[col_name].median()
        q75, q25 = np.percentile(df[col_name], [75, 25])
        iqr = q75 - q25
        
        # Avoid division by zero if IQR is 0 (e.g., all 0 rain)
        if iqr == 0: iqr = 1.0 
            
        # Robust scaling: (x - median) / IQR. Clip negative normalized values to 0.
        normalized = np.maximum(0, (df[col_name] - median) / iqr)
        
        weight = ERROR_WEIGHTS.get(var, 1.0)
        combined_score += (normalized * weight)
        
    df['combined_error_score'] = combined_score
    return df

if __name__ == "__main__":
    input_path = Path("data/synthetic/weather_demo.parquet")
    output_dir = Path("data/processed")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logging.info(f"Loading data from {input_path}")
    df = pd.read_parquet(input_path)
    
    df = validate_data(df)
    df = calculate_errors(df)
    df = normalize_and_combine(df)
    
    output_path = output_dir / "forecast_errors.parquet"
    df.to_parquet(output_path, index=False)
    logging.info(f"Processed dataset saved to {output_path} with {len(df.columns)} columns.")