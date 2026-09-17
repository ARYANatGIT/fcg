"""
ForecastGuard AI — CLI Entrypoint for Synthetic Meteorological Data Generation
Problem Statement ID: 26079 | Ministry of Earth Sciences (MoES) / NCMRWF
"""

import argparse
import logging
import sys
from pathlib import Path
from datetime import datetime
import pandas as pd

# Ensure root directory is on Python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ml.data.synthetic_generator import (
    generate_meteorological_dataset,
    export_dataset,
    SYNTHETIC_LABEL,
    DEFAULT_RESOLUTION,
    DEFAULT_NUM_CYCLES,
    MAX_LEAD_DAYS,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("generate_demo_data")


def create_dataset() -> pd.DataFrame:
    """
    Backwards-compatible interface for pytest fixtures and legacy invocations.
    Generates standard demonstration dataset across India domain (Lat 8-37N, Lon 68-97E).
    """
    return generate_meteorological_dataset(
        resolution=DEFAULT_RESOLUTION,
        num_init_dates=DEFAULT_NUM_CYCLES,
        max_lead_days=MAX_LEAD_DAYS,
    )


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic meteorological demonstration dataset for ForecastGuard AI."
    )
    parser.add_argument(
        "--resolution",
        type=float,
        default=DEFAULT_RESOLUTION,
        help="Spatial grid resolution in degrees (default: 1.0; operational: 0.5)",
    )
    parser.add_argument(
        "--num-cycles",
        type=int,
        default=DEFAULT_NUM_CYCLES,
        help="Number of forecast initialization cycles (default: 5)",
    )
    parser.add_argument(
        "--max-lead-days",
        type=int,
        default=MAX_LEAD_DAYS,
        help="Forecast lead day horizon (default: 10)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/synthetic",
        help="Output directory for generated datasets",
    )
    parser.add_argument(
        "--export-netcdf",
        action="store_true",
        help="Also export dataset as NetCDF4 (.nc) format",
    )
    args = parser.parse_args()

    logger.info("Starting ForecastGuard AI synthetic weather data generation...")
    dataset = generate_meteorological_dataset(
        resolution=args.resolution,
        num_init_dates=args.num_cycles,
        max_lead_days=args.max_lead_days,
    )

    parquet_path, nc_path = export_dataset(
        df=dataset,
        output_dir=args.output_dir,
        filename_prefix="weather_demo",
        export_netcdf=args.export_netcdf,
    )

    print("\n" + "=" * 70)
    print("FORECASTGUARD AI — DATA GENERATION COMPLETE")
    print(f"Data Label: {SYNTHETIC_LABEL}")
    print(f"Total Grid Cells Generated: {len(dataset):,}")
    print(f"Lead Days Covered: 1 to {args.max_lead_days}")
    print(f"Parquet Artifact: {parquet_path}")
    if nc_path:
        print(f"NetCDF4 Artifact: {nc_path}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()