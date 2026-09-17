"""
ForecastGuard AI — Synthetic Meteorological Data Generator (Phase 1)
Generates physical multi-level atmosphere & surface weather fields across the India domain.
Explicitly labels all generated datasets as SYNTHETIC DEMONSTRATION DATA.
"""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Union
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Constants
SYNTHETIC_LABEL = "SYNTHETIC DEMONSTRATION DATA — NOT REAL WEATHER DATA"
LAT_MIN, LAT_MAX = 8.0, 37.0
LON_MIN, LON_MAX = 68.0, 97.0
DEFAULT_RESOLUTION = 1.0  # Configurable: 0.5 or 1.0 degrees
DEFAULT_START_DATE = datetime(2026, 1, 1, 0, 0)
DEFAULT_NUM_CYCLES = 5
MAX_LEAD_DAYS = 10


def generate_grid(
    lat_min: float = LAT_MIN,
    lat_max: float = LAT_MAX,
    lon_min: float = LON_MIN,
    lon_max: float = LON_MAX,
    resolution: float = DEFAULT_RESOLUTION,
) -> pd.DataFrame:
    """
    Creates spatial coordinates spanning the Indian Meteorological Department (IMD) domain.
    """
    lats = np.arange(lat_min, lat_max + resolution * 0.5, resolution)
    lons = np.arange(lon_min, lon_max + resolution * 0.5, resolution)
    lat_mesh, lon_mesh = np.meshgrid(lats, lons, indexing="ij")

    return pd.DataFrame({
        "latitude": np.round(lat_mesh.flatten(), 2),
        "longitude": np.round(lon_mesh.flatten(), 2),
    })


def simulate_atmospheric_state(
    grid_df: pd.DataFrame,
    lead_day: int,
    cycle_index: int = 0,
) -> pd.DataFrame:
    """
    Generates physically consistent surface, atmospheric, and derived meteorological variables.
    Simulates high-error forecast bust scenarios in synoptically active regimes:
    - Monsoon depression / cyclonic-like low pressure systems
    - High vertical wind shear and elevated CAPE / convection
    - Rapid spatial pressure and moisture gradients
    """
    df = grid_df.copy()
    n = len(df)
    lats = df["latitude"].values
    lons = df["longitude"].values

    # Base climatology modulated by latitude (cooler north, warmer south)
    base_temp_surface = 32.0 - 0.55 * (lats - 8.0) + np.random.normal(0, 1.5, n)
    base_pressure_surface = 1012.0 - 0.1 * (lats - 8.0) + np.random.normal(0, 2.0, n)
    base_rh_surface = np.clip(65.0 + 0.3 * (lons - 68.0) + np.random.uniform(-15, 20, n), 10.0, 100.0)

    # Synoptic injection: create a simulated cyclonic disturbance centered around Central/East India
    cyclone_center_lat = 19.5 + 1.2 * np.sin(cycle_index * 0.8)
    cyclone_center_lon = 82.0 + 1.5 * np.cos(cycle_index * 0.8)
    dist_from_cyclone = np.sqrt((lats - cyclone_center_lat) ** 2 + (lons - cyclone_center_lon) ** 2)

    # Intense low pressure and convective rainfall near the disturbance core
    cyclone_influence = np.exp(-0.5 * (dist_from_cyclone / 4.5) ** 2)
    base_pressure_surface -= 18.0 * cyclone_influence
    base_rh_surface = np.clip(base_rh_surface + 30.0 * cyclone_influence, 10.0, 100.0)

    # Rainfall (exponential background + severe cyclonic precipitation)
    background_rain = np.random.exponential(scale=3.5, size=n)
    convective_rain = 65.0 * cyclone_influence * np.random.uniform(0.6, 1.4, n)
    base_rain_surface = np.clip(background_rain + convective_rain, 0.0, None)

    # 10m Wind Fields (cyclonic circulation around core)
    angle_to_center = np.arctan2(lats - cyclone_center_lat, lons - cyclone_center_lon)
    tangential_speed = 22.0 * cyclone_influence + np.random.normal(4.0, 2.0, n)
    base_u_10m = -tangential_speed * np.sin(angle_to_center) + np.random.normal(0, 2.0, n)
    base_v_10m = tangential_speed * np.cos(angle_to_center) + np.random.normal(0, 2.0, n)

    # Atmospheric Levels
    # 850 hPa (~1.5 km)
    base_temp_850 = base_temp_surface - 9.8 * 1.5 + np.random.normal(0, 1.0, n)
    base_rh_850 = np.clip(base_rh_surface - 5.0 + np.random.normal(0, 5.0, n), 5.0, 100.0)
    base_u_850 = base_u_10m * 1.3 + np.random.normal(0, 2.0, n)
    base_v_850 = base_v_10m * 1.3 + np.random.normal(0, 2.0, n)

    # 500 hPa Geopotential Height (~5.8 km)
    base_z_500 = 5850.0 - 4.5 * (lats - 8.0) - 120.0 * cyclone_influence + np.random.normal(0, 15.0, n)

    # 200 hPa (~12 km) Tropical Easterly Jet / Upper Level Westerly
    base_u_200 = np.where(lats < 20.0, -22.0 + np.random.normal(0, 4.0, n), 28.0 + np.random.normal(0, 6.0, n))
    base_v_200 = np.random.normal(0, 4.0, n)

    # Derived Quantities
    # Vertical wind shear (vector difference between 200 hPa and 850 hPa)
    base_vertical_shear = np.sqrt((base_u_200 - base_u_850) ** 2 + (base_v_200 - base_v_850) ** 2)

    # Convective Available Potential Energy (CAPE in J/kg)
    moisture_term = (base_rh_surface / 100.0) * base_temp_surface
    base_cape = np.clip(moisture_term * 85.0 + 1200.0 * cyclone_influence + np.random.normal(0, 150.0, n), 0.0, 4500.0)

    # Precipitable water (mm)
    base_pw = np.clip(25.0 + 35.0 * cyclone_influence + 0.5 * (base_rh_surface - 50.0), 5.0, 75.0)

    # Vorticity and Divergence approximation (850 hPa)
    base_vorticity_850 = 4e-5 * cyclone_influence + np.random.normal(0, 1e-5, n)
    base_divergence_850 = -2e-5 * cyclone_influence + np.random.normal(0, 1e-5, n)

    # Spatial Gradients
    base_p_grad = np.abs(np.gradient(base_pressure_surface)) if len(base_pressure_surface) > 1 else np.zeros(n)
    base_t_grad = np.abs(np.gradient(base_temp_surface)) if len(base_temp_surface) > 1 else np.zeros(n)
    base_rh_grad = np.abs(np.gradient(base_rh_surface)) if len(base_rh_surface) > 1 else np.zeros(n)

    # =========================================================================
    # Error Growth Dynamics (Phase 2 & 3 Error/Bust Mechanics)
    # NWP models suffer larger errors with increasing lead time, especially during
    # rapid pressure drops, strong rainfall events, high shear, and convective CAPE.
    # =========================================================================
    lead_growth = 1.0 + (lead_day * 0.45) ** 1.25

    # Multipliers for synoptic challenge
    regime_multiplier = np.ones(n)
    regime_multiplier += 1.8 * cyclone_influence
    regime_multiplier += np.where(base_rain_surface > 35.0, 1.5, 0.0)
    regime_multiplier += np.where(base_vertical_shear > 25.0, 1.2, 0.0)
    regime_multiplier += np.where(base_cape > 2200.0, 1.2, 0.0)

    total_error_scale = lead_growth * regime_multiplier

    # Generate Forecast Values (Base + lead/regime dependent forecast bias & noise)
    fc_temp_2m = base_temp_surface + np.random.normal(0.4, 1.4 * total_error_scale, n)
    fc_rain = np.clip(base_rain_surface + np.random.normal(0, 2.5 * total_error_scale, n), 0.0, None)
    fc_p_sfc = np.clip(base_pressure_surface + np.random.normal(-0.3, 1.5 * total_error_scale, n), 920.0, 1040.0)
    fc_rh_2m = np.clip(base_rh_surface + np.random.normal(0, 4.0 * total_error_scale, n), 0.0, 100.0)
    fc_u_10m = base_u_10m + np.random.normal(0, 1.2 * total_error_scale, n)
    fc_v_10m = base_v_10m + np.random.normal(0, 1.2 * total_error_scale, n)

    fc_z_500 = base_z_500 + np.random.normal(0, 8.0 * total_error_scale, n)
    fc_t_850 = base_temp_850 + np.random.normal(0, 1.2 * total_error_scale, n)
    fc_rh_850 = np.clip(base_rh_850 + np.random.normal(0, 4.0 * total_error_scale, n), 0.0, 100.0)
    fc_u_850 = base_u_850 + np.random.normal(0, 1.5 * total_error_scale, n)
    fc_v_850 = base_v_850 + np.random.normal(0, 1.5 * total_error_scale, n)
    fc_u_200 = base_u_200 + np.random.normal(0, 2.2 * total_error_scale, n)
    fc_v_200 = base_v_200 + np.random.normal(0, 2.2 * total_error_scale, n)

    fc_cape = np.clip(base_cape + np.random.normal(0, 180.0 * total_error_scale, n), 0.0, 5000.0)
    fc_pw = np.clip(base_pw + np.random.normal(0, 3.0 * total_error_scale, n), 0.0, 85.0)
    fc_shear = np.clip(base_vertical_shear + np.random.normal(0, 2.0 * total_error_scale, n), 0.0, None)
    fc_vorticity = base_vorticity_850 + np.random.normal(0, 1e-5 * total_error_scale, n)
    fc_divergence = base_divergence_850 + np.random.normal(0, 1e-5 * total_error_scale, n)

    # Observations (Base + tiny sensor measurement noise)
    obs_temp_2m = base_temp_surface + np.random.normal(0, 0.25, n)
    obs_rain = np.clip(base_rain_surface + np.random.normal(0, 0.35, n), 0.0, None)
    obs_p_sfc = np.clip(base_pressure_surface + np.random.normal(0, 0.3, n), 920.0, 1040.0)
    obs_rh_2m = np.clip(base_rh_surface + np.random.normal(0, 1.0, n), 0.0, 100.0)
    obs_u_10m = base_u_10m + np.random.normal(0, 0.4, n)
    obs_v_10m = base_v_10m + np.random.normal(0, 0.4, n)

    obs_z_500 = base_z_500 + np.random.normal(0, 2.0, n)
    obs_t_850 = base_temp_850 + np.random.normal(0, 0.3, n)
    obs_rh_850 = np.clip(base_rh_850 + np.random.normal(0, 1.2, n), 0.0, 100.0)
    obs_u_850 = base_u_850 + np.random.normal(0, 0.5, n)
    obs_v_850 = base_v_850 + np.random.normal(0, 0.5, n)
    obs_u_200 = base_u_200 + np.random.normal(0, 0.8, n)
    obs_v_200 = base_v_200 + np.random.normal(0, 0.8, n)

    obs_cape = np.clip(base_cape + np.random.normal(0, 40.0, n), 0.0, 5000.0)
    obs_pw = np.clip(base_pw + np.random.normal(0, 0.8, n), 0.0, 85.0)
    obs_shear = np.clip(base_vertical_shear + np.random.normal(0, 0.6, n), 0.0, None)
    obs_vorticity = base_vorticity_850 + np.random.normal(0, 2e-6, n)
    obs_divergence = base_divergence_850 + np.random.normal(0, 2e-6, n)

    # Wind speed
    fc_wind_speed_10m = np.sqrt(fc_u_10m ** 2 + fc_v_10m ** 2)
    obs_wind_speed_10m = np.sqrt(obs_u_10m ** 2 + obs_v_10m ** 2)

    # Populate DataFrame with complete variable schema
    # 1. Surface Variables
    df["forecast_temperature_2m"] = np.round(fc_temp_2m, 2)
    df["observed_temperature_2m"] = np.round(obs_temp_2m, 2)
    df["forecast_relative_humidity_2m"] = np.round(fc_rh_2m, 2)
    df["observed_relative_humidity_2m"] = np.round(obs_rh_2m, 2)
    df["forecast_precipitation"] = np.round(fc_rain, 2)
    df["observed_precipitation"] = np.round(obs_rain, 2)
    df["forecast_surface_pressure"] = np.round(fc_p_sfc, 2)
    df["observed_surface_pressure"] = np.round(obs_p_sfc, 2)
    df["forecast_wind_u_10m"] = np.round(fc_u_10m, 2)
    df["observed_wind_u_10m"] = np.round(obs_u_10m, 2)
    df["forecast_wind_v_10m"] = np.round(fc_v_10m, 2)
    df["observed_wind_v_10m"] = np.round(obs_v_10m, 2)
    df["forecast_wind_speed_10m"] = np.round(fc_wind_speed_10m, 2)
    df["observed_wind_speed_10m"] = np.round(obs_wind_speed_10m, 2)

    # 2. Atmospheric Variables (500hPa, 850hPa, 200hPa)
    df["forecast_geopotential_height_500hpa"] = np.round(fc_z_500, 1)
    df["observed_geopotential_height_500hpa"] = np.round(obs_z_500, 1)
    df["forecast_temperature_850hpa"] = np.round(fc_t_850, 2)
    df["observed_temperature_850hpa"] = np.round(obs_t_850, 2)
    df["forecast_relative_humidity_850hpa"] = np.round(fc_rh_850, 2)
    df["observed_relative_humidity_850hpa"] = np.round(obs_rh_850, 2)
    df["forecast_wind_u_850hpa"] = np.round(fc_u_850, 2)
    df["observed_wind_u_850hpa"] = np.round(obs_u_850, 2)
    df["forecast_wind_v_850hpa"] = np.round(fc_v_850, 2)
    df["observed_wind_v_850hpa"] = np.round(obs_v_850, 2)
    df["forecast_wind_u_200hpa"] = np.round(fc_u_200, 2)
    df["observed_wind_u_200hpa"] = np.round(obs_u_200, 2)
    df["forecast_wind_v_200hpa"] = np.round(fc_v_200, 2)
    df["observed_wind_v_200hpa"] = np.round(obs_v_200, 2)

    # 3. Derived Variables
    df["forecast_cape"] = np.round(fc_cape, 1)
    df["observed_cape"] = np.round(obs_cape, 1)
    df["forecast_precipitable_water"] = np.round(fc_pw, 2)
    df["observed_precipitable_water"] = np.round(obs_pw, 2)
    df["forecast_vertical_wind_shear"] = np.round(fc_shear, 2)
    df["observed_vertical_wind_shear"] = np.round(obs_shear, 2)
    df["forecast_relative_vorticity_850hpa"] = fc_vorticity
    df["observed_relative_vorticity_850hpa"] = obs_vorticity
    df["forecast_divergence_850hpa"] = fc_divergence
    df["observed_divergence_850hpa"] = obs_divergence
    df["forecast_pressure_gradient"] = np.round(base_p_grad, 4)
    df["forecast_temperature_gradient"] = np.round(base_t_grad, 4)
    df["forecast_moisture_gradient"] = np.round(base_rh_grad, 4)

    # 4. Backward-compatibility aliases for existing pipeline tests
    df["forecast_temperature"] = df["forecast_temperature_2m"]
    df["observed_temperature"] = df["observed_temperature_2m"]
    df["forecast_rainfall"] = df["forecast_precipitation"]
    df["observed_rainfall"] = df["observed_precipitation"]
    df["forecast_pressure"] = df["forecast_surface_pressure"]
    df["observed_pressure"] = df["observed_surface_pressure"]
    df["forecast_humidity"] = df["forecast_relative_humidity_2m"]
    df["observed_humidity"] = df["observed_relative_humidity_2m"]
    df["forecast_wind_u"] = df["forecast_wind_u_10m"]
    df["observed_wind_u"] = df["observed_wind_u_10m"]
    df["forecast_wind_v"] = df["forecast_wind_v_10m"]
    df["observed_wind_v"] = df["observed_wind_v_10m"]

    # Explicit synthetic metadata label
    df["data_source"] = SYNTHETIC_LABEL
    return df


def generate_meteorological_dataset(
    start_date: datetime = DEFAULT_START_DATE,
    num_init_dates: int = DEFAULT_NUM_CYCLES,
    max_lead_days: int = MAX_LEAD_DAYS,
    resolution: float = DEFAULT_RESOLUTION,
    lat_min: float = LAT_MIN,
    lat_max: float = LAT_MAX,
    lon_min: float = LON_MIN,
    lon_max: float = LON_MAX,
) -> pd.DataFrame:
    """
    Orchestrates the generation of full spatiotemporal synthetic forecast cycles and observations.
    """
    logger.warning("==========================================================================")
    logger.warning("GENERATING SYNTHETIC DEMONSTRATION DATA — NOT REAL WEATHER DATA")
    logger.warning(f"Spatial Domain: Lat [{lat_min}N, {lat_max}N], Lon [{lon_min}E, {lon_max}E]")
    logger.warning(f"Resolution: {resolution}°, Lead Range: Day 1 to Day {max_lead_days}")
    logger.warning("==========================================================================")

    grid_df = generate_grid(lat_min, lat_max, lon_min, lon_max, resolution)
    cycle_frames = []

    for cycle_idx in range(num_init_dates):
        init_time = start_date + timedelta(days=cycle_idx)

        for lead_day in range(1, max_lead_days + 1):
            valid_time = init_time + timedelta(days=lead_day)
            lead_hour = lead_day * 24

            time_slice = grid_df.copy()
            time_slice["forecast_initialization_time"] = init_time
            time_slice["forecast_valid_time"] = valid_time
            time_slice["lead_day"] = lead_day
            time_slice["lead_hour"] = lead_hour

            # Generate surface, atmospheric and derived variables
            populated_slice = simulate_atmospheric_state(
                time_slice,
                lead_day=lead_day,
                cycle_index=cycle_idx,
            )
            cycle_frames.append(populated_slice)

    full_dataset = pd.concat(cycle_frames, ignore_index=True)
    full_dataset.attrs["data_source"] = SYNTHETIC_LABEL
    full_dataset.attrs["generation_timestamp"] = datetime.now(timezone.utc).isoformat()

    return full_dataset


def export_dataset(
    df: pd.DataFrame,
    output_dir: Union[str, Path] = "data/synthetic",
    filename_prefix: str = "weather_demo",
    export_netcdf: bool = False,
) -> Tuple[Path, Optional[Path]]:
    """
    Exports synthetic meteorological dataset to Parquet and optional NetCDF4 format.
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    parquet_path = out_dir / f"{filename_prefix}.parquet"
    df.to_parquet(parquet_path, index=False)
    logger.info(f"Successfully saved {len(df):,} records to Parquet: {parquet_path}")

    netcdf_path = None
    if export_netcdf:
        try:
            import xarray as xr
            # Convert tabular dataset to xarray Dataset indexed by (initialization, lead_day, latitude, longitude)
            indexed_df = df.set_index([
                "forecast_initialization_time",
                "lead_day",
                "latitude",
                "longitude",
            ])
            # Drop object string columns for NetCDF conversion
            numeric_cols = indexed_df.select_dtypes(include=[np.number]).columns
            ds = xr.Dataset.from_dataframe(indexed_df[numeric_cols])
            ds.attrs["description"] = SYNTHETIC_LABEL
            ds.attrs["problem_statement"] = "SIH-26079 MoES/NCMRWF Forecast Bust Detection"
            netcdf_path = out_dir / f"{filename_prefix}.nc"
            ds.to_netcdf(netcdf_path)
            logger.info(f"Successfully exported NetCDF4 format to: {netcdf_path}")
        except Exception as e:
            logger.warning(f"NetCDF export skipped due to: {e}")

    return parquet_path, netcdf_path
