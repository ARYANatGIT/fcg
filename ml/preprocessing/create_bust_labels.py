"""
create_bust_labels.py
Defines and applies the Forecast Bust thresholds without data leakage.
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[2]))
from scripts.config import BUST_PERCENTILE

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class BustThresholdEstimator:
    """
    Estimator for determining forecast bust thresholds.
    Designed with fit/transform paradigm to prevent data leakage between train/test splits.
    """
    def __init__(self, percentile: float = BUST_PERCENTILE):
        self.percentile = percentile
        self.thresholds_ = None
        self.var_thresholds_ = {}
        
        # We will also calculate exploratory thresholds for individual variables
        self.error_vars = [
            'temperature_absolute_error', 'rainfall_log_error', 
            'wind_vector_error', 'pressure_absolute_error', 'humidity_absolute_error'
        ]

    def fit(self, df: pd.DataFrame):
        """Calculates historical thresholds based on the provided (training) dataset."""
        logging.info(f"Fitting BustThresholdEstimator at {self.percentile * 100}th percentile...")
        
        # Main target threshold
        self.thresholds_ = df.groupby('lead_day')['combined_error_score'].quantile(self.percentile).reset_index()
        self.thresholds_.rename(columns={'combined_error_score': 'bust_threshold'}, inplace=True)
        
        # Variable-specific exploratory thresholds
        for var in self.error_vars:
            thresh_df = df.groupby('lead_day')[var].quantile(self.percentile).reset_index()
            thresh_df.rename(columns={var: f"{var.split('_')[0]}_threshold"}, inplace=True)
            self.var_thresholds_[var] = thresh_df
            
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies fitted thresholds to create binary bust labels."""
        if self.thresholds_ is None:
            raise ValueError("Estimator must be fitted before calling transform.")
        
        logging.info("Applying thresholds to dataset...")
        df_out = df.copy()
        
        # Merge primary threshold
        df_out = df_out.merge(self.thresholds_, on='lead_day', how='left')
        
        # Create Primary Target Labels
        df_out['bust'] = (df_out['combined_error_score'] >= df_out['bust_threshold']).astype(int)
        df_out['error_excess'] = df_out['combined_error_score'] - df_out['bust_threshold']
        
        # Create Exploratory Variable Labels
        for var in self.error_vars:
            prefix = var.split('_')[0]
            thresh_df = self.var_thresholds_[var]
            df_out = df_out.merge(thresh_df, on='lead_day', how='left')
            df_out[f'{prefix}_bust'] = (df_out[var] >= df_out[f'{prefix}_threshold']).astype(int)
            # Drop the var threshold column to keep df clean
            df_out.drop(columns=[f'{prefix}_threshold'], inplace=True)
            
        return df_out

if __name__ == "__main__":
    input_path = Path("data/processed/forecast_errors.parquet")
    output_dir = Path("data/processed")
    
    logging.info(f"Loading error data from {input_path}")
    df = pd.read_parquet(input_path)
    
    # Initialize and fit/transform
    # Note: In Phase 4, fit() will ONLY receive training data. For Phase 3, we process the whole set.
    estimator = BustThresholdEstimator()
    estimator.fit(df)
    labeled_df = estimator.transform(df)
    
    # Save the Threshold Table
    threshold_path = output_dir / "bust_thresholds.csv"
    estimator.thresholds_.to_csv(threshold_path, index=False)
    logging.info(f"Saved Bust Thresholds to {threshold_path}")
    
    # Save the labeled dataset
    output_path = output_dir / "forecast_bust_labels.parquet"
    labeled_df.to_parquet(output_path, index=False)
    logging.info(f"Saved Labeled Dataset to {output_path} with {len(labeled_df)} rows and {len(labeled_df.columns)} columns.")