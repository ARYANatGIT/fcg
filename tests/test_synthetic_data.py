"""
ForecastGuard AI — Unit & Meteorological Validation Tests for Synthetic Data Mode
Problem Statement ID: 26079 | MoES / NCMRWF
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path
from ml.data.synthetic_generator import (
    generate_meteorological_dataset,
    generate_grid,
    SYNTHETIC_LABEL,
    LAT_MIN,
    LAT_MAX,
    LON_MIN,
    LON_MAX,
)
from ml.data.data_provider import SyntheticDataProvider


@pytest.fixture(scope="module")
def synthetic_df():
    """Generates a compact synthetic dataset for test validation."""
    return generate_meteorological_dataset(
        num_init_dates=2,
        max_lead_days=10,
        resolution=2.0,  # Fast grid for rapid unit testing
    )


def test_dataset_not_empty(synthetic_df):
    assert not synthetic_df.empty, "Synthetic dataset must not be empty."
    assert len(synthetic_df) > 0, "Synthetic dataset must contain rows."


def test_synthetic_disclaimer_label(synthetic_df):
    """Ensure dataset is transparently labeled as synthetic demonstration data."""
    assert "data_source" in synthetic_df.columns
    assert (synthetic_df["data_source"] == SYNTHETIC_LABEL).all()
    assert synthetic_df.attrs.get("data_source") == SYNTHETIC_LABEL


def test_spatial_bounding_box(synthetic_df):
    """Verify coordinates conform to the IMD/NCMRWF India domain."""
    assert synthetic_df["latitude"].min() >= LAT_MIN - 0.01
    assert synthetic_df["latitude"].max() <= LAT_MAX + 0.01
    assert synthetic_df["longitude"].min() >= LON_MIN - 0.01
    assert synthetic_df["longitude"].max() <= LON_MAX + 0.01


def test_lead_time_coverage(synthetic_df):
    """Verify Days 1 through 10 and 24-hour steps are fully covered."""
    unique_lead_days = sorted(synthetic_df["lead_day"].unique().tolist())
    assert unique_lead_days == list(range(1, 11)), "Must cover lead days 1 through 10."

    unique_lead_hours = sorted(synthetic_df["lead_hour"].unique().tolist())
    assert unique_lead_hours == [d * 24 for d in range(1, 11)], "Lead hours must match 24h intervals."


def test_surface_variables_presence(synthetic_df):
    """Verify all surface variables required by Phase 1."""
    surface_cols = [
        "forecast_temperature_2m",
        "observed_temperature_2m",
        "forecast_relative_humidity_2m",
        "observed_relative_humidity_2m",
        "forecast_precipitation",
        "observed_precipitation",
        "forecast_surface_pressure",
        "observed_surface_pressure",
        "forecast_wind_u_10m",
        "observed_wind_u_10m",
        "forecast_wind_v_10m",
        "observed_wind_v_10m",
        "forecast_wind_speed_10m",
        "observed_wind_speed_10m",
    ]
    for col in surface_cols:
        assert col in synthetic_df.columns, f"Missing surface variable: {col}"


def test_atmospheric_variables_presence(synthetic_df):
    """Verify 500hPa, 850hPa, and 200hPa levels."""
    atmos_cols = [
        "forecast_geopotential_height_500hpa",
        "observed_geopotential_height_500hpa",
        "forecast_temperature_850hpa",
        "observed_temperature_850hpa",
        "forecast_relative_humidity_850hpa",
        "observed_relative_humidity_850hpa",
        "forecast_wind_u_850hpa",
        "observed_wind_u_850hpa",
        "forecast_wind_v_850hpa",
        "observed_wind_v_850hpa",
        "forecast_wind_u_200hpa",
        "observed_wind_u_200hpa",
        "forecast_wind_v_200hpa",
        "observed_wind_v_200hpa",
    ]
    for col in atmos_cols:
        assert col in synthetic_df.columns, f"Missing atmospheric variable: {col}"


def test_derived_variables_presence(synthetic_df):
    """Verify derived meteorology: shear, CAPE, precipitable water, vorticity, divergence."""
    derived_cols = [
        "forecast_cape",
        "observed_cape",
        "forecast_precipitable_water",
        "observed_precipitable_water",
        "forecast_vertical_wind_shear",
        "observed_vertical_wind_shear",
        "forecast_relative_vorticity_850hpa",
        "observed_relative_vorticity_850hpa",
        "forecast_divergence_850hpa",
        "observed_divergence_850hpa",
        "forecast_pressure_gradient",
        "forecast_temperature_gradient",
        "forecast_moisture_gradient",
    ]
    for col in derived_cols:
        assert col in synthetic_df.columns, f"Missing derived variable: {col}"


def test_physical_boundaries(synthetic_df):
    """Verify no unphysical values (negative rainfall, negative RH, etc.)."""
    # Precipitation cannot be negative
    assert (synthetic_df["forecast_precipitation"] >= 0).all()
    assert (synthetic_df["observed_precipitation"] >= 0).all()

    # Relative humidity must be between 0% and 100%
    assert (synthetic_df["forecast_relative_humidity_2m"] >= 0).all()
    assert (synthetic_df["forecast_relative_humidity_2m"] <= 100).all()
    assert (synthetic_df["observed_relative_humidity_2m"] >= 0).all()
    assert (synthetic_df["observed_relative_humidity_2m"] <= 100).all()

    # Surface Pressure should be realistic meteorological range (~900 to 1050 hPa)
    assert (synthetic_df["forecast_surface_pressure"] >= 920).all()
    assert (synthetic_df["forecast_surface_pressure"] <= 1040).all()

    # CAPE must be non-negative
    assert (synthetic_df["forecast_cape"] >= 0).all()
    assert (synthetic_df["observed_cape"] >= 0).all()


def test_error_growth_dynamics(synthetic_df):
    """
    In NWP forecasting, error should on average grow with lead time.
    Day 10 errors must exceed Day 1 errors.
    """
    day1 = synthetic_df[synthetic_df["lead_day"] == 1]
    day10 = synthetic_df[synthetic_df["lead_day"] == 10]

    day1_temp_mae = np.abs(day1["forecast_temperature_2m"] - day1["observed_temperature_2m"]).mean()
    day10_temp_mae = np.abs(day10["forecast_temperature_2m"] - day10["observed_temperature_2m"]).mean()

    assert day10_temp_mae > day1_temp_mae, f"Day 10 MAE ({day10_temp_mae:.2f}) must exceed Day 1 MAE ({day1_temp_mae:.2f})"


def test_data_provider_contract():
    """Verify SyntheticDataProvider fulfills the DataProvider contract."""
    provider = SyntheticDataProvider()
    assert provider.is_synthetic() is True
    assert "SYNTHETIC" in provider.get_source_label()

    grid_spec = provider.get_grid_spec()
    assert grid_spec["lat_min"] == 8.0
    assert grid_spec["lat_max"] == 37.0
    assert grid_spec["lon_min"] == 68.0
    assert grid_spec["lon_max"] == 97.0
