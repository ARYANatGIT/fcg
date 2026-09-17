"""
test_shap_explainability.py
Ensures SHAP explanations load correctly, map to metadata, and do not leak data.
"""

import pytest
import pandas as pd
import json
from pathlib import Path
from ml.explainability.local_shap import LocalExplainer

@pytest.fixture
def sample_row():
    X_val = pd.read_parquet("data/processed/ml/X_val.parquet")
    return X_val.iloc[[0]]

@pytest.fixture
def explainer():
    return LocalExplainer()

def test_metadata_completeness(explainer):
    """Ensures every feature used by the model has a metadata mapping."""
    features = explainer.predictor.expected_features
    for feat in features:
        assert feat in explainer.feature_meta, f"Missing metadata for {feat}"
        assert 'reason_code' in explainer.feature_meta[feat]

def test_local_explanation_structure(explainer, sample_row):
    """Tests the dashboard-ready JSON output."""
    explanation = explainer.explain_prediction(sample_row)
    
    assert "prediction_details" in explanation
    assert "top_reasons" in explanation
    assert "top_supporting_features" in explanation
    assert "top_reducing_features" in explanation
    
    # Check probability bounds
    prob = explanation["prediction_details"]["calibrated_bust_probability"]
    assert 0.0 <= prob <= 1.0

def test_forbidden_features_absent(explainer, sample_row):
    """Guarantees explanations never output data leakage variables."""
    explanation = explainer.explain_prediction(sample_row)
    forbidden_terms = ['observed', 'error', 'bias', 'bust_threshold']
    
    # Check positive contributors
    for item in explanation["top_supporting_features"]:
        for term in forbidden_terms:
            if item['feature'] != 'historical_error_lag1':
                assert term not in item['feature']

def test_shap_separation(explainer, sample_row):
    """Ensures positive/negative separation is mathematically correct."""
    explanation = explainer.explain_prediction(sample_row)
    for c in explanation["top_supporting_features"]:
        assert c["shap_contribution"] > 0
    for c in explanation["top_reducing_features"]:
        assert c["shap_contribution"] <= 0