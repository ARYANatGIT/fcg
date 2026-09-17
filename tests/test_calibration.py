"""
test_calibration.py
Validates the probability calibration logic and inference updates.
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path
from ml.training.calibrate_models import expected_calibration_error
from ml.inference.predict import ForecastBustPredictor

def test_expected_calibration_error():
    """Tests the math of our custom ECE function."""
    y_true = np.array([0, 0, 1, 1])
    # Perfect calibration (0% true in bin 0, 100% true in bin 1)
    y_prob_perfect = np.array([0.1, 0.1, 0.9, 0.9])
    assert expected_calibration_error(y_true, y_prob_perfect, n_bins=10) < 0.15
    
    # Terrible calibration
    y_prob_bad = np.array([0.9, 0.9, 0.1, 0.1])
    assert expected_calibration_error(y_true, y_prob_bad, n_bins=10) > 0.7

def test_inference_returns_dict():
    """Ensures predict.py returns the correct dictionary structure."""
    predictor = ForecastBustPredictor()
    dummy_data = {feat: [0.0] for feat in predictor.expected_features}
    df = pd.DataFrame(dummy_data)
    
    result = predictor.predict(df)
    
    assert "raw_bust_probability" in result
    assert "calibrated_bust_probability" in result
    assert "forecast_confidence" in result
    
    # Probabilities must be valid
    assert 0.0 <= result["raw_bust_probability"] <= 1.0
    assert 0.0 <= result["calibrated_bust_probability"] <= 1.0
    assert result["forecast_confidence"] == 1.0 - result["calibrated_bust_probability"]

def test_artifacts_exist():
    model_dir = Path("models")
    assert (model_dir / "calibrator.pkl").exists()
    assert (model_dir / "calibration_metadata.json").exists()