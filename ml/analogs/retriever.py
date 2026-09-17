"""
retriever.py
Information retrieval system for finding similar historical forecast situations.
Strictly prohibits looking into the future.
"""

import pandas as pd
import numpy as np
import json
import logging
from pathlib import Path
from sklearn.preprocessing import StandardScaler
import joblib
import sys

sys.path.append(str(Path(__file__).resolve().parents[2]))
from ml.features.build_features import engineer_features
from scripts.config import ANALOG_CONFIG

logging.basicConfig(level=logging.INFO, format="%(message)s")

class HistoricalAnalogRetriever:
    def __init__(self, data_dir: Path = Path("data/processed"), model_dir: Path = Path("models")):
        self.data_dir = data_dir
        self.model_dir = model_dir
        
        # Load raw Phase 3 data, then engineer features, but KEEP the dates and targets
        raw_df = pd.read_parquet(self.data_dir / "forecast_bust_labels.parquet")
        self.db = engineer_features(raw_df)
        
        # Ensure it's sorted by time
        self.db = self.db.sort_values(by='forecast_initialization_time').reset_index(drop=True)
        
        with open(self.data_dir / "ml/split_metadata.json", 'r') as f:
            self.split_meta = json.load(f)
            
        self.train_end = pd.to_datetime(self.split_meta['split_dates']['train_end'])
        
        self.features = list(ANALOG_CONFIG['feature_weights'].keys())
        self.weights = np.array([ANALOG_CONFIG['feature_weights'][f] for f in self.features])
        
        self.scaler = StandardScaler()
        self._fit_scaler()

    def _fit_scaler(self):
        """Fits the scaler strictly on the training period to prevent target leakage."""
        train_db = self.db[self.db['forecast_initialization_time'] <= self.train_end]
        self.scaler.fit(train_db[self.features])
        
        self.model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.scaler, self.model_dir / "analog_scaler.pkl")
        logging.debug("Analog scaler fitted and saved.")

    def retrieve(self, query_row: pd.Series, top_k: int = ANALOG_CONFIG['top_k']) -> dict:
        """Retrieves top-k historical analogs that occurred strictly before the query."""
        query_init_time = query_row['forecast_initialization_time']
        
        # 1. STRICT LEAKAGE FILTER: History must be BEFORE current forecast initialization
        mask = self.db['forecast_initialization_time'] < query_init_time
        
        # 2. LEAD DAY FILTER
        if ANALOG_CONFIG['same_lead_day_only']:
            mask &= (self.db['lead_day'] == query_row['lead_day'])
            
        valid_history = self.db[mask].copy()
        
        if len(valid_history) == 0:
            return self._empty_result(query_row, query_init_time)
            
        # 3. Calculate Similarity (Euclidean Distance on Weighted, Scaled Features)
        query_df = pd.DataFrame([query_row[self.features]])
        q_scaled = self.scaler.transform(query_df)[0]
        h_scaled = self.scaler.transform(valid_history[self.features])
        
        # Apply weights
        q_weighted = q_scaled * self.weights
        h_weighted = h_scaled * self.weights
        
        # Euclidean distances (lower is better/more similar)
        distances = np.linalg.norm(h_weighted - q_weighted, axis=1)
        valid_history['similarity_distance'] = distances
        
        # Sort and get Top K
        top_analogs = valid_history.sort_values('similarity_distance').head(top_k)
        
        return self._format_output(query_row, top_analogs, len(valid_history))

    def _format_output(self, query_row, analogs_df, total_search_space) -> dict:
        analogs_list = []
        for _, row in analogs_df.iterrows():
            analogs_list.append({
                "initialization_time": str(row['forecast_initialization_time']),
                "valid_time": str(row['forecast_valid_time']),
                "lead_day": int(row['lead_day']),
                "latitude": float(row['latitude']),
                "longitude": float(row['longitude']),
                "similarity_distance": round(float(row['similarity_distance']), 4),
                "bust": int(row['bust']),
                "combined_error_score": round(float(row['combined_error_score']), 4),
                "bust_threshold": round(float(row['bust_threshold']), 4)
            })
            
        bust_rate = analogs_df['bust'].mean()
        mean_error = analogs_df['combined_error_score'].mean()
        median_error = analogs_df['combined_error_score'].median()
        
        return {
            "current_forecast": {
                "initialization_time": str(query_row['forecast_initialization_time']),
                "lead_day": int(query_row['lead_day']),
                "latitude": float(query_row['latitude']),
                "longitude": float(query_row['longitude'])
            },
            "summary": {
                "number_of_analogs_retrieved": len(analogs_list),
                "search_space_size": total_search_space,
                "historical_analog_bust_rate": round(float(bust_rate), 4) if not np.isnan(bust_rate) else 0.0,
                "mean_error": round(float(mean_error), 4) if not np.isnan(mean_error) else 0.0,
                "median_error": round(float(median_error), 4) if not np.isnan(median_error) else 0.0,
                "best_distance": analogs_list[0]['similarity_distance'] if analogs_list else None
            },
            "analogs": analogs_list
        }
        
    def _empty_result(self, query_row, init_time):
        return {
            "current_forecast": {"initialization_time": str(init_time)},
            "summary": {"number_of_analogs_retrieved": 0, "search_space_size": 0, "note": "No historical cases exist prior to this date for this lead time."},
            "analogs": []
        }