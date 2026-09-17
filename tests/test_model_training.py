"""
test_model_training.py
Ensures model artifacts are successfully created and prediction interface works.
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
from ml.inference.predict import ForecastBustPredictor

@pytest.fixture
def predictor():
    return ForecastBustPredictor()

def test_model_artifacts_exist():
    model_dir = Path("models")
    assert (model_dir / "lightgbm_bust_model.pkl").exists()
    assert (model_dir / "model_metadata.json").exists()

def test_prediction_output(predictor):
    dummy_data = {feat: [0.0] for feat in predictor.expected_features}
    df = pd.DataFrame(dummy_data)
    
    prob = predictor.predict_probability(df)
    
    assert len(prob) == 1
    assert 0.0 <= prob[0] <= 1.0, "Probability must be bounded between 0 and 1"

def test_forbidden_features_rejected(predictor):
    dummy_data = {feat: [0.0] for feat in predictor.expected_features}
    df = pd.DataFrame(dummy_data)
    df['observed_temperature'] = [25.0]
    
    df_missing = df.drop(columns=[predictor.expected_features[0]])
    with pytest.raises(ValueError):
        predictor.predict_probability(df_missing)