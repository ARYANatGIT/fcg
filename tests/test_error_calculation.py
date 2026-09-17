import pytest
import pandas as pd
import numpy as np
from ml.preprocessing.calculate_errors import calculate_errors, normalize_and_combine, validate_data

@pytest.fixture
def mock_weather_data():
    """Provides specific known numbers to test math formulas."""
    return pd.DataFrame({
        'forecast_temperature': [30.0, 15.0],
        'observed_temperature': [27.0, 15.0],
        'forecast_pressure': [1010.0, 1000.0],
        'observed_pressure': [1012.0, 1000.0],
        'forecast_humidity': [50.0, 90.0],
        'observed_humidity': [60.0, 90.0],
        'forecast_wind_u': [3.0, 0.0],
        'observed_wind_u': [0.0, 0.0],
        'forecast_wind_v': [4.0, 0.0],
        'observed_wind_v': [0.0, 0.0],
        'forecast_rainfall': [0.0, 10.0],
        'observed_rainfall': [0.0, np.expm1(1.0) + 10.0] # Custom to test log1p logic
    })

def test_absolute_errors(mock_weather_data):
    df = calculate_errors(mock_weather_data)
    assert df['temperature_absolute_error'].iloc[0] == 3.0
    assert df['temperature_absolute_error'].iloc[1] == 0.0
    assert df['pressure_absolute_error'].iloc[0] == 2.0
    
def test_wind_calculations(mock_weather_data):
    df = calculate_errors(mock_weather_data)
    # 3-4-5 triangle: forecast speed is 5, observed is 0.
    assert df['forecast_wind_speed'].iloc[0] == 5.0
    assert df['observed_wind_speed'].iloc[0] == 0.0
    assert df['wind_speed_error'].iloc[0] == 5.0
    assert df['wind_vector_error'].iloc[0] == 5.0  # Vector distance between (3,4) and (0,0)

def test_rainfall_log_error(mock_weather_data):
    df = calculate_errors(mock_weather_data)
    # Log1p of 0 is 0. Diff should be 0.
    assert df['rainfall_log_error'].iloc[0] == 0.0

def test_biases(mock_weather_data):
    df = calculate_errors(mock_weather_data)
    assert df['temperature_bias'].iloc[0] == 3.0 # Forecast higher than observed
    assert df['pressure_bias'].iloc[0] == -2.0   # Forecast lower than observed

def test_normalization_and_combined_error(mock_weather_data):
    df = calculate_errors(mock_weather_data)
    df = normalize_and_combine(df)
    
    assert 'combined_error_score' in df.columns
    assert (df['combined_error_score'] >= 0).all(), "Combined error must be non-negative"
    assert np.isfinite(df['combined_error_score']).all(), "Combined error must be finite"

def test_data_validation():
    # Row 0 has negative rainfall. Row 1 has a NaN. Row 2 is perfectly valid.
    bad_df = pd.DataFrame({
        'forecast_rainfall': [-1.0, 5.0, 10.0],
        'observed_rainfall': [0.0, 5.0, 10.0],
        'forecast_temperature': [25.0, np.nan, 20.0]
    })
    
    clean_df = validate_data(bad_df)
    
    # The function should drop Row 0 and Row 1, leaving only Row 2.
    assert len(clean_df) == 1, "Validation should leave exactly 1 valid row"
    assert clean_df['forecast_rainfall'].iloc[0] == 10.0, "The valid row should be the one with 10.0 rainfall"