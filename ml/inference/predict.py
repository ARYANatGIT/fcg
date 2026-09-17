"""
predict.py
Provides the inference interface for the ForecastGuard AI system.
Returns both raw and calibrated probabilities.
"""

import pandas as pd
import numpy as np
import joblib
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(message)s")

class ForecastBustPredictor:
    def __init__(self, model_dir: Path = Path("models")):
        self.raw_model_path = model_dir / "lightgbm_bust_model.pkl"
        self.calibrator_path = model_dir / "calibrator.pkl"
        self.meta_path = model_dir / "model_metadata.json"
        
        if not (self.raw_model_path.exists() and self.calibrator_path.exists()):
            raise FileNotFoundError("Models not found. Run train_models.py then calibrate_models.py.")
            
        self.raw_model = joblib.load(self.raw_model_path)
        self.calibrator = joblib.load(self.calibrator_path)
        
        with open(self.meta_path, 'r') as f:
            self.metadata = json.load(f)
            
        self.expected_features = self.metadata['features']

    def _check_leakage(self, df: pd.DataFrame):
        forbidden = [c for c in df.columns if c.startswith("observed_") or c.startswith("error_") or c in ["bust", "combined_error_score"]]
        if forbidden:
            raise ValueError(f"Target leakage detected! Forbidden columns present: {forbidden}")

    def predict_probability(self, features_df: pd.DataFrame) -> np.ndarray:
        """
        Calculates calibrated bust probabilities for the input DataFrame.
        Enforces strict leakage check and expected feature presence.
        """
        self._check_leakage(features_df)
        missing_cols = [col for col in self.expected_features if col not in features_df.columns]
        if missing_cols:
            raise ValueError(f"Missing required features: {missing_cols}")
            
        X = features_df[self.expected_features]
        if type(self.calibrator) == type(self.raw_model):
            calibrated_prob = self.raw_model.predict_proba(X)[:, 1]
        else:
            calibrated_prob = self.calibrator.predict_proba(X)[:, 1]
        return np.clip(calibrated_prob, 0.0, 1.0)

    def predict(self, features_df: pd.DataFrame) -> dict:
        """
        Returns a dictionary containing raw probabilities, calibrated probabilities,
        risk category, and a prototype confidence score.
        """
        self._check_leakage(features_df)
        missing_cols = [col for col in self.expected_features if col not in features_df.columns]
        if missing_cols:
            raise ValueError(f"Missing required features: {missing_cols}")
            
        X = features_df[self.expected_features]
        
        # Calculate Probabilities
        raw_prob = self.raw_model.predict_proba(X)[:, 1]
        
        # If the selected calibrator was just the raw model (rare), handle it gracefully
        if type(self.calibrator) == type(self.raw_model):
            calibrated_prob = raw_prob
        else:
            calibrated_prob = self.calibrator.predict_proba(X)[:, 1]

        cal_val = float(np.clip(calibrated_prob[0], 0.0, 1.0))
        if cal_val >= 0.65:
            risk_category = "HIGH"
        elif cal_val >= 0.35:
            risk_category = "MODERATE"
        else:
            risk_category = "LOW"
            
        # Return structured output (returning the first row for single-prediction API compatibility)
        return {
            "raw_bust_probability": float(raw_prob[0]),
            "calibrated_bust_probability": cal_val,
            "forecast_confidence": float(1.0 - cal_val),
            "risk_category": risk_category,
            "risk_level": f"{risk_category} RISK"
        }

if __name__ == "__main__":
    try:
        predictor = ForecastBustPredictor()
        logging.info("Predictor loaded successfully.")
    except FileNotFoundError as e:
        logging.warning(e)