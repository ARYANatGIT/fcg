import pytest
import pandas as pd
from pathlib import Path
from scripts.generate_demo_data import create_dataset

@pytest.fixture(scope="module")
def sample_data():
    """Generates a small dataset for testing."""
    return create_dataset()

def test_dataset_not_empty(sample_data):
    assert not sample_data.empty, "Dataset should not be empty."

def test_required_columns(sample_data):
    required_cols = [
        'latitude', 'longitude', 'forecast_initialization_time', 'forecast_valid_time', 'lead_day',
        'forecast_temperature', 'observed_temperature', 
        'forecast_rainfall', 'observed_rainfall'
    ]
    for col in required_cols:
        assert col in sample_data.columns, f"Missing required column: {col}"

def test_geographic_bounds(sample_data):
    assert sample_data['latitude'].min() >= 8.0, "Latitude below minimum bound."
    assert sample_data['latitude'].max() <= 37.0, "Latitude above maximum bound."
    assert sample_data['longitude'].min() >= 68.0, "Longitude below minimum bound."
    assert sample_data['longitude'].max() <= 97.0, "Longitude above maximum bound."

def test_lead_day_bounds(sample_data):
    assert sample_data['lead_day'].min() >= 1, "Lead day < 1 found."
    assert sample_data['lead_day'].max() <= 10, "Lead day > 10 found."

def test_forecast_observation_mismatch(sample_data):
    """Ensures that forecasts and observations aren't identical (errors exist)."""
    temp_diff = sample_data['forecast_temperature'] - sample_data['observed_temperature']
    assert not (temp_diff == 0).all(), "Forecast and Observations are identical everywhere!"

def test_variable_bounds(sample_data):
    """Humidity and rainfall should not be negative."""
    assert sample_data['forecast_rainfall'].min() >= 0
    assert sample_data['observed_rainfall'].min() >= 0
    assert sample_data['forecast_humidity'].min() >= 0
    assert sample_data['forecast_humidity'].max() <= 100