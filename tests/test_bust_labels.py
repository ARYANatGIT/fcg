"""
test_bust_labels.py
Tests the BustThresholdEstimator logic and data leakage prevention.
"""

import pytest
import pandas as pd
import numpy as np
from ml.preprocessing.create_bust_labels import BustThresholdEstimator

@pytest.fixture
def dummy_train_data():
    """Mock training data to fit thresholds."""
    return pd.DataFrame({
        'lead_day': [1, 1, 1, 1, 2, 2, 2, 2],
        'combined_error_score': [1.0, 2.0, 3.0, 10.0, 2.0, 4.0, 6.0, 20.0], # 75th perc: Day1=4.75, Day2=9.5
        'temperature_absolute_error': [0]*8,
        'rainfall_log_error': [0]*8,
        'wind_vector_error': [0]*8,
        'pressure_absolute_error': [0]*8,
        'humidity_absolute_error': [0]*8
    })

@pytest.fixture
def dummy_test_data():
    """Mock future test data to apply thresholds to."""
    return pd.DataFrame({
        'lead_day': [1, 2],
        'combined_error_score': [5.0, 5.0],
        'temperature_absolute_error': [0]*2,
        'rainfall_log_error': [0]*2,
        'wind_vector_error': [0]*2,
        'pressure_absolute_error': [0]*2,
        'humidity_absolute_error': [0]*2
    })

def test_estimator_fit_transform(dummy_train_data):
    # Use 75th percentile for easier math in small sample
    estimator = BustThresholdEstimator(percentile=0.75)
    estimator.fit(dummy_train_data)
    
    # Check thresholds were generated
    assert estimator.thresholds_ is not None
    assert len(estimator.thresholds_) == 2  # Day 1 and Day 2
    
    labeled_data = estimator.transform(dummy_train_data)
    
    # 10.0 > 4.75 (Day 1 threshold) -> Bust = 1
    assert labeled_data.loc[3, 'bust'] == 1
    # 1.0 < 4.75 -> Bust = 0
    assert labeled_data.loc[0, 'bust'] == 0
    
    # Ensure binary target
    assert set(labeled_data['bust'].unique()).issubset({0, 1})
    
def test_no_data_leakage(dummy_train_data, dummy_test_data):
    """Applying to test data should NOT recalculate thresholds based on test data."""
    estimator = BustThresholdEstimator(percentile=0.75)
    estimator.fit(dummy_train_data)
    
    # Store train thresholds
    day_1_threshold = estimator.thresholds_[estimator.thresholds_['lead_day'] == 1]['bust_threshold'].values[0]
    
    # Transform test data
    labeled_test = estimator.transform(dummy_test_data)
    
    # Threshold applied to test data should exactly match the one fitted on train data
    applied_threshold = labeled_test[labeled_test['lead_day'] == 1]['bust_threshold'].values[0]
    assert applied_threshold == day_1_threshold

def test_error_excess_calculation(dummy_train_data):
    estimator = BustThresholdEstimator(percentile=0.75)
    labeled = estimator.fit(dummy_train_data).transform(dummy_train_data)
    
    # Error excess = combined_error - threshold
    expected_excess = labeled['combined_error_score'] - labeled['bust_threshold']
    pd.testing.assert_series_equal(labeled['error_excess'], expected_excess, check_names=False)