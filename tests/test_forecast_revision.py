"""
test_forecast_revision.py
Validates the mathematical correctness and leakage prevention of forecast revisions.
"""

import pytest
import pandas as pd
import numpy as np
from ml.revisions.revision_analyzer import ForecastRevisionAnalyzer

@pytest.fixture
def mock_forecast_data():
    """Provides the explicit controlled synthetic fixture requested in instructions."""
    return pd.DataFrame({
        'latitude': [10.0, 10.0],
        'longitude': [80.0, 80.0],
        'forecast_valid_time': [pd.to_datetime('2026-01-05'), pd.to_datetime('2026-01-05')],
        # Run 1 is yesterday, Run 2 is today (Run 2 is the current forecast)
        'forecast_initialization_time': [pd.to_datetime('2026-01-03'), pd.to_datetime('2026-01-04')],
        'forecast_temperature': [30.0, 32.0],
        'forecast_rainfall': [50.0, 70.0],
        'forecast_wind_u': [3.0, 6.0],
        'forecast_wind_v': [4.0, 8.0],
        'forecast_pressure': [1010.0, 1010.0],
        'forecast_humidity': [50.0, 50.0]
    })

def test_math_unit_test(mock_forecast_data):
    """Verifies the mathematical unit test explicitly requested."""
    analyzer = ForecastRevisionAnalyzer()
    df_rev = analyzer.calculate_revisions(mock_forecast_data)
    
    # The first row should have no revision available
    assert df_rev.iloc[0]['revision_available'] == False
    
    # The second row represents the "Current Forecast" comparing to "Previous"
    current = df_rev.iloc[1]
    
    assert current['revision_available'] == True
    assert current['temperature_revision'] == 2.0
    assert current['rainfall_revision'] == 20.0
    
    # Wind vector: sqrt((6-3)^2 + (8-4)^2) = sqrt(9 + 16) = sqrt(25) = 5.0
    assert current['wind_vector_revision'] == 5.0

def test_temporal_leakage_prevention(mock_forecast_data):
    """Ensures a forecast only ever compares itself to a strictly EARLIER run."""
    analyzer = ForecastRevisionAnalyzer()
    df_rev = analyzer.calculate_revisions(mock_forecast_data)
    
    current = df_rev.iloc[1]
    # The prev_init_time MUST be strictly before the current init time
    assert current['prev_init_time'] < current['forecast_initialization_time']
    # And valid time must be exactly identical
    assert current['forecast_valid_time'] == pd.to_datetime('2026-01-05')

def test_rainfall_log_handling():
    """Ensures zeros are handled safely in log revision."""
    df = pd.DataFrame({
        'latitude': [10, 10], 'longitude': [80, 80], 
        'forecast_valid_time': [1, 1], 'forecast_initialization_time': [1, 2],
        'forecast_rainfall': [0.0, 0.0], # Both 0
        'forecast_temperature': [0, 0], 'forecast_wind_u': [0, 0], 'forecast_wind_v': [0, 0],
        'forecast_pressure': [0, 0], 'forecast_humidity': [0, 0]
    })
    analyzer = ForecastRevisionAnalyzer()
    df_rev = analyzer.calculate_revisions(df)
    assert df_rev.iloc[1]['rainfall_log_revision'] == 0.0