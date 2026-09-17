# PROTOTYPE WEIGHTS: These are unvalidated placeholder weights for the combined error score.
# In a real operational setting, these must be determined by meteorological experts.
ERROR_WEIGHTS = {
    'temperature': 1.0,
    'rainfall': 1.5,      # Rainfall errors are highly penalizing
    'wind': 1.0,
    'pressure': 0.8,
    'humidity': 0.5,
}
BUST_PERCENTILE = 0.90
# scripts/config.py (Append this)

# PHASE 4: Data Splitting Proportions
SPLIT_RATIOS = {
    'train': 0.70,
    'val': 0.15,
    'test': 0.15
}

# PHASE 4: Feature settings
RANDOM_SEED = 42
# scripts/config.py (Append this)

# PHASE 8: Historical Analog Retrieval Configuration
ANALOG_CONFIG = {
    'top_k': 5,
    'similarity_method': 'euclidean',
    'same_lead_day_only': True,
    # Prototype weights: Prioritizing spatial proximity and major weather signals.
    'feature_weights': {
        'latitude': 2.0,
        'longitude': 2.0,
        'forecast_rainfall': 1.5,
        'forecast_temperature': 1.0,
        'forecast_wind_speed': 1.0,
        'forecast_pressure': 1.0,
        'forecast_humidity': 1.0,
        'init_day_sin': 0.5,
        'init_day_cos': 0.5
    }
}
# scripts/config.py (Append this)

# PHASE 9: Forecast Revision Configuration
REVISION_WEIGHTS = {
    'temperature': 1.0,
    'rainfall': 1.5,
    'wind': 1.0,
    'pressure': 0.8,
    'humidity': 0.5
}
LARGE_REVISION_PERCENTILE = 0.90