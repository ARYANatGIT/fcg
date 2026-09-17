"""
revision_analyzer.py
Calculates run-to-run forecast revisions to detect model instability.
Strictly ensures only previous forecasts are used.
"""

import pandas as pd
import numpy as np
import logging
import json
from pathlib import Path
from sklearn.preprocessing import RobustScaler
import joblib
import sys

sys.path.append(str(Path(__file__).resolve().parents[2]))
from scripts.config import REVISION_WEIGHTS, LARGE_REVISION_PERCENTILE

logging.basicConfig(level=logging.INFO, format="%(message)s")

class ForecastRevisionAnalyzer:
    def __init__(self, data_dir: Path = Path("data/processed")):
        self.data_dir = data_dir
        self.scaler = RobustScaler() # RobustScaler is best to ignore outlier weather events
        self.threshold = None
        
    def _match_previous_forecasts(self, df: pd.DataFrame) -> pd.DataFrame:
        """Matches a forecast with the immediately preceding run for the SAME valid time."""
        # Sort chronologically by initialization time for each location + valid time
        df_sorted = df.sort_values(by=['latitude', 'longitude', 'forecast_valid_time', 'forecast_initialization_time'])
        
        # Group to find the previous run
        grouped = df_sorted.groupby(['latitude', 'longitude', 'forecast_valid_time'])
        
        # Shift to get the previous run's data
        df_sorted['prev_init_time'] = grouped['forecast_initialization_time'].shift(1)
        df_sorted['prev_temp'] = grouped['forecast_temperature'].shift(1)
        df_sorted['prev_rain'] = grouped['forecast_rainfall'].shift(1)
        df_sorted['prev_u'] = grouped['forecast_wind_u'].shift(1)
        df_sorted['prev_v'] = grouped['forecast_wind_v'].shift(1)
        df_sorted['prev_pressure'] = grouped['forecast_pressure'].shift(1)
        df_sorted['prev_humidity'] = grouped['forecast_humidity'].shift(1)
        
        # Feature availability
        df_sorted['revision_available'] = df_sorted['prev_init_time'].notna()
        
        return df_sorted

    def calculate_revisions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculates raw, directional, and vector revisions."""
        df = self._match_previous_forecasts(df.copy())
        
        # Directional Revisions
        df['temperature_revision'] = df['forecast_temperature'] - df['prev_temp']
        df['rainfall_revision'] = df['forecast_rainfall'] - df['prev_rain']
        df['pressure_revision'] = df['forecast_pressure'] - df['prev_pressure']
        df['humidity_revision'] = df['forecast_humidity'] - df['prev_humidity']
        
        # Absolute Revisions
        df['temperature_revision_abs'] = df['temperature_revision'].abs()
        df['pressure_revision_abs'] = df['pressure_revision'].abs()
        df['humidity_revision_abs'] = df['humidity_revision'].abs()
        
        # Specialized Revisions
        df['rainfall_log_revision'] = np.abs(np.log1p(df['forecast_rainfall']) - np.log1p(df['prev_rain']))
        df['wind_vector_revision'] = np.sqrt(
            (df['forecast_wind_u'] - df['prev_u'])**2 + 
            (df['forecast_wind_v'] - df['prev_v'])**2
        )
        
        return df

    def fit_transform(self, train_df: pd.DataFrame) -> pd.DataFrame:
        """Fits normalization and large-revision thresholds strictly on training data."""
        rev_cols = ['temperature_revision_abs', 'rainfall_log_revision', 
                    'wind_vector_revision', 'pressure_revision_abs', 'humidity_revision_abs']
                    
        train_df = self.calculate_revisions(train_df)
        
        # Isolate rows where revision exists to fit the scaler
        valid_train = train_df[train_df['revision_available']].copy()
        
        self.scaler.fit(valid_train[rev_cols])
        
        return self.transform(train_df)
        
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies fitted normalizer and calculates the combined score."""
        rev_cols = ['temperature_revision_abs', 'rainfall_log_revision', 
                    'wind_vector_revision', 'pressure_revision_abs', 'humidity_revision_abs']
        weights = [REVISION_WEIGHTS['temperature'], REVISION_WEIGHTS['rainfall'],
                   REVISION_WEIGHTS['wind'], REVISION_WEIGHTS['pressure'], REVISION_WEIGHTS['humidity']]
                   
        if 'temperature_revision_abs' not in df.columns:
            df = self.calculate_revisions(df)
            
        mask = df['revision_available']
        df['combined_revision_score'] = np.nan
        df['large_revision'] = 0
        
        if mask.sum() > 0:
            # Scale and clip negatives to 0
            scaled = np.maximum(0, self.scaler.transform(df.loc[mask, rev_cols]))
            
            # Combined score
            weighted_score = np.dot(scaled, weights)
            df.loc[mask, 'combined_revision_score'] = weighted_score
            
            # Define or apply threshold
            if self.threshold is None:
                self.threshold = df.loc[mask, 'combined_revision_score'].quantile(LARGE_REVISION_PERCENTILE)
                
            df.loc[mask, 'large_revision'] = (df.loc[mask, 'combined_revision_score'] >= self.threshold).astype(int)
            
        return df

    def get_dashboard_output(self, df: pd.DataFrame, lat: float, lon: float, valid_time: str) -> dict:
        """Simulates the API endpoint for the 'Forecast Evolution' case study panel."""
        subset = df[(df['latitude'] == lat) & (df['longitude'] == lon) & (df['forecast_valid_time'] == valid_time)]
        subset = subset.sort_values('forecast_initialization_time')
        
        if len(subset) < 2:
            return {"revision_available": False, "reason": "Insufficient forecast cycles for this target."}
            
        latest = subset.iloc[-1]
        
        return {
            "revision_available": True,
            "target": {"valid_time": str(valid_time), "lat": lat, "lon": lon},
            "current_forecast_time": str(latest['forecast_initialization_time']),
            "previous_forecast_time": str(latest['prev_init_time']),
            "forecast_changes": {
                "temperature": f"{latest['temperature_revision']:.2f} °C",
                "rainfall": f"{latest['rainfall_revision']:.2f} mm",
                "pressure": f"{latest['pressure_revision']:.2f} hPa",
                "wind_vector_magnitude": f"{latest['wind_vector_revision']:.2f} m/s"
            },
            "combined_revision_score": round(latest['combined_revision_score'], 3),
            "large_revision": bool(latest['large_revision'])
        }

if __name__ == "__main__":
    analyzer = ForecastRevisionAnalyzer()
    
    # Load dataset
    df = pd.read_parquet(Path("data/processed/forecast_bust_labels.parquet"))
    with open("data/processed/ml/split_metadata.json", 'r') as f:
        meta = json.load(f)
        
    train_end = pd.to_datetime(meta['split_dates']['train_end'])
    train_df = df[df['forecast_initialization_time'] <= train_end].copy()
    val_test_df = df[df['forecast_initialization_time'] > train_end].copy()
    
    # Process
    train_df = analyzer.fit_transform(train_df)
    val_test_df = analyzer.transform(val_test_df)
    full_df = pd.concat([train_df, val_test_df])
    
    # Analyze a case
    case = full_df[full_df['revision_available']].iloc[-1]
    case_json = analyzer.get_dashboard_output(full_df, case['latitude'], case['longitude'], str(case['forecast_valid_time']))
    
    logging.info("--- DASHBOARD REVISION PAYLOAD ---")
    logging.info(json.dumps(case_json, indent=2))
    
    # Save artifacts and processed dataframe for visualizations
    Path("models").mkdir(exist_ok=True)
    joblib.dump(analyzer.scaler, "models/revision_scaler.pkl")
    full_df.to_parquet("data/processed/forecast_revisions.parquet", index=False)
    
    logging.info(f"\nStats:")
    logging.info(f"Total rows: {len(full_df)}")
    logging.info(f"Valid revisions found: {full_df['revision_available'].sum()}")
    logging.info(f"Large revisions flagged: {full_df['large_revision'].sum()}")
    logging.info(f"90th Percentile Threshold: {analyzer.threshold:.4f}")
    logging.info("\nNOTE: Revision features successfully built. Awaiting real NWP data before ML retraining.")