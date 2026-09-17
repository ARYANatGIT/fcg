"""
local_shap.py
Provides local explainability for individual predictions, generating reason codes
and structured JSON payloads for the dashboard.
"""

import pandas as pd
import numpy as np
import shap
import joblib
import json
import logging
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[2]))
from ml.inference.predict import ForecastBustPredictor

# Configurable Risk Thresholds (Prototype display only)
RISK_THRESHOLDS = {
    "LOW": 0.33,
    "MODERATE": 0.66
    # > 0.66 is HIGH
}

class LocalExplainer:
    def __init__(self, model_dir: Path = Path("models")):
        self.predictor = ForecastBustPredictor(model_dir)
        self.raw_model = self.predictor.raw_model
        
        # Initialize Explainer
        self.explainer = shap.TreeExplainer(self.raw_model)
        
        # Load Metadata
        with open(model_dir / "feature_metadata.json", 'r') as f:
            self.feature_meta = json.load(f)
            
    def _format_value(self, feature, value):
        meta = self.feature_meta.get(feature, {})
        unit = meta.get('unit', '')
        if isinstance(value, float):
            return f"{value:.2f}{unit}"
        return f"{value}{unit}"

    def explain_prediction(self, feature_row: pd.DataFrame, top_n: int = 5) -> dict:
        """Generates a structured, dashboard-ready explanation for a single prediction."""
        if len(feature_row) != 1:
            raise ValueError("Explain prediction only supports a single row.")
            
        # 1. Get Probabilities from Inference Pipeline
        probs = self.predictor.predict(feature_row)
        calibrated_prob = probs["calibrated_bust_probability"]
        
        # 2. Risk Level Assignment
        if calibrated_prob <= RISK_THRESHOLDS["LOW"]:
            risk_level = "LOW MODEL-ESTIMATED BUST PROBABILITY"
        elif calibrated_prob <= RISK_THRESHOLDS["MODERATE"]:
            risk_level = "MODERATE MODEL-ESTIMATED BUST PROBABILITY"
        else:
            risk_level = "HIGH MODEL-ESTIMATED BUST PROBABILITY"
            
        # 3. Calculate Local SHAP
        X = feature_row[self.predictor.expected_features]
        shap_values = self.explainer(X)
        
        contributions = []
        for i, feature in enumerate(X.columns):
            shap_val = float(shap_values.values[0][i])
            feat_val = X.iloc[0, i]
            
            meta = self.feature_meta.get(feature, {})
            
            contributions.append({
                "feature": feature,
                "display_name": meta.get("display_name", feature),
                "code": meta.get("reason_code", "UNKNOWN_SIGNAL"),
                "value": self._format_value(feature, feat_val),
                "shap_contribution": shap_val
            })
            
        # 4. Sort and Separate
        contributions.sort(key=lambda x: abs(x["shap_contribution"]), reverse=True)
        
        positive_contributors = [c for c in contributions if c["shap_contribution"] > 0][:top_n]
        negative_contributors = [c for c in contributions if c["shap_contribution"] <= 0][:top_n]
        
        # Format Top Reasons for immediate UI display
        top_reasons = []
        for c in positive_contributors:
            text = f"{c['display_name']} ({c['value']}) pushed the model output higher."
            top_reasons.append({
                "code": c['code'],
                "text": text,
                "contribution": round(c['shap_contribution'], 3)
            })

        return {
            "prediction_details": {
                "raw_bust_probability": probs["raw_bust_probability"],
                "calibrated_bust_probability": probs["calibrated_bust_probability"],
                "forecast_confidence": probs["forecast_confidence"],
                "risk_level": risk_level
            },
            "explanation_caveat": "Model explanation based on the underlying LightGBM log-odds prediction. SHAP describes algorithmic contribution, not physical causality.",
            "shap_base_value": float(shap_values.base_values[0]),
            "top_reasons": top_reasons,
            "top_supporting_features": positive_contributors,
            "top_reducing_features": negative_contributors
        }

if __name__ == "__main__":
    # Test on a single Validation row
    X_val = pd.read_parquet("data/processed/ml/X_val.parquet")
    sample_row = X_val.iloc[[0]]
    
    explainer = LocalExplainer()
    explanation = explainer.explain_prediction(sample_row)
    
    print(json.dumps(explanation, indent=2))