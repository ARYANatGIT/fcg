"""
ForecastGuard AI — Meteorological Data Provider Interface
Supports seamless switching between Synthetic Demo Mode and Real Operational Providers
(IMD, NCMRWF, ERA5).
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, date
import pandas as pd
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class DataProvider(ABC):
    """
    Abstract Base Class for meteorological data ingestion.
    Enforces a common contract across synthetic demonstrations and operational government feeds.
    """

    @abstractmethod
    def get_source_label(self) -> str:
        """Returns the canonical label of this data source."""
        pass

    @abstractmethod
    def is_synthetic(self) -> bool:
        """Returns True if this provider emits synthetic demonstration data."""
        pass

    @abstractmethod
    def get_grid_spec(self) -> Dict[str, Any]:
        """Returns grid bounds: lat_min, lat_max, lon_min, lon_max, resolution."""
        pass

    @abstractmethod
    def load_forecast(
        self,
        init_date: datetime,
        lead_days: List[int],
    ) -> pd.DataFrame:
        """
        Loads NWP model forecast grid for the given initialization date across requested lead days.
        """
        pass

    @abstractmethod
    def load_observations(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> pd.DataFrame:
        """
        Loads ground truth / verification observations (gridded rainfall, station AWS, reanalysis).
        """
        pass


class SyntheticDataProvider(DataProvider):
    """
    Generates or loads synthetic meteorological fields for offline demonstrations,
    benchmarking, and integration testing without requiring paid external APIs.
    """

    def __init__(self, data_path: Optional[str] = "data/synthetic/weather_demo.parquet"):
        self.data_path = Path(data_path) if data_path else None
        self._cached_df: Optional[pd.DataFrame] = None

    def get_source_label(self) -> str:
        return "SYNTHETIC DEMONSTRATION DATA — NOT REAL WEATHER DATA"

    def is_synthetic(self) -> bool:
        return True

    def get_grid_spec(self) -> Dict[str, Any]:
        return {
            "lat_min": 8.0,
            "lat_max": 37.0,
            "lon_min": 68.0,
            "lon_max": 97.0,
            "resolution": 0.5,
            "region": "India Subcontinent Domain",
        }

    def load_forecast(
        self,
        init_date: datetime,
        lead_days: List[int],
    ) -> pd.DataFrame:
        df = self._load_data()
        mask = (df["forecast_initialization_time"].dt.date == init_date.date()) & (
            df["lead_day"].isin(lead_days)
        )
        subset = df[mask].copy()
        if subset.empty:
            logger.warning(
                f"No synthetic data found for init_date={init_date.date()} and lead_days={lead_days}. Returning all."
            )
            return df[df["lead_day"].isin(lead_days)].copy()
        return subset

    def load_observations(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> pd.DataFrame:
        df = self._load_data()
        mask = (df["forecast_valid_time"] >= start_date) & (
            df["forecast_valid_time"] <= end_date
        )
        return df[mask].copy()

    def _load_data(self) -> pd.DataFrame:
        if self._cached_df is not None:
            return self._cached_df

        if self.data_path and self.data_path.exists():
            self._cached_df = pd.read_parquet(self.data_path)
        else:
            from ml.data.synthetic_generator import generate_meteorological_dataset
            self._cached_df = generate_meteorological_dataset()
        return self._cached_df


class NCMRWFDataProvider(DataProvider):
    """
    Adapter interface for National Centre for Medium Range Weather Forecasting (NCMRWF) products:
    1. NCUM (NCMRWF Unified Model) Global (~12 km resolution)
    2. NCUM Regional (~4 km high-resolution domain over India)
    3. NEPS (NCMRWF Ensemble Prediction System, 23 ensemble members, 10-day lead)
    4. IMDAA (Indian Monsoon Data Assimilation and Analysis Reanalysis at 12 km)
    
    Open Access / Government Portal:
    https://www.ncmrwf.gov.in/
    https://nwp.ncmrwf.gov.in/
    """

    def __init__(self, data_dir: str = "data/raw/ncmrwf"):
        self.data_dir = Path(data_dir)

    def get_source_label(self) -> str:
        return "NCMRWF Operational Unified Model (NCUM/NEPS)"

    def is_synthetic(self) -> bool:
        return False

    def get_grid_spec(self) -> Dict[str, Any]:
        return {
            "lat_min": 8.0,
            "lat_max": 37.0,
            "lon_min": 68.0,
            "lon_max": 97.0,
            "resolution": 0.12,  # ~12km
            "region": "NCUM India Domain",
        }

    def load_forecast(
        self,
        init_date: datetime,
        lead_days: List[int],
    ) -> pd.DataFrame:
        # In operational mode, parse NetCDF4 / GRIB2 files from NCMRWF THREDDS / FTP
        expected_nc = self.data_dir / f"ncum_{init_date.strftime('%Y%m%d')}.nc"
        if not expected_nc.exists():
            raise FileNotFoundError(
                f"NCMRWF forecast file not found at {expected_nc}. "
                "Download operational NetCDF/GRIB2 files from https://www.ncmrwf.gov.in/ or run in synthetic mode."
            )
        import xarray as xr
        ds = xr.open_dataset(expected_nc)
        return ds.to_dataframe().reset_index()

    def load_observations(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> pd.DataFrame:
        raise NotImplementedError(
            "NCMRWF ground truth observation stream requires IMDAA reanalysis or verification portal access."
        )


class IMDDataProvider(DataProvider):
    """
    Adapter interface for India Meteorological Department (IMD) observation & forecast data:
    1. IMD High Resolution Gridded Daily Rainfall (0.25° x 0.25° Pai et al. 2014)
    2. IMD High Resolution Daily Gridded Temperature (1° x 1° / 0.5° x 0.5° Srivastava et al.)
    3. IMD Automated Weather Station (AWS) Network observations
    4. IMD Doppler Weather Radar (DWR) composite reflectivity
    
    Open Access / Government Portal:
    https://www.imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html
    https://mausam.imd.gov.in/
    """

    def __init__(self, data_dir: str = "data/raw/imd"):
        self.data_dir = Path(data_dir)

    def get_source_label(self) -> str:
        return "IMD Gridded Observations (0.25° Rainfall, 1° Temp)"

    def is_synthetic(self) -> bool:
        return False

    def get_grid_spec(self) -> Dict[str, Any]:
        return {
            "lat_min": 6.5,
            "lat_max": 38.5,
            "lon_min": 66.5,
            "lon_max": 100.0,
            "resolution": 0.25,
            "region": "IMD Standard National Meteorological Grid",
        }

    def load_forecast(
        self,
        init_date: datetime,
        lead_days: List[int],
    ) -> pd.DataFrame:
        raise NotImplementedError("IMD provides observational verification datasets rather than NWP forecast cycles.")

    def load_observations(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> pd.DataFrame:
        # Load IMD binary gridded files (.GRD) or converted NetCDF files
        rain_file = self.data_dir / f"rain_{start_date.year}.nc"
        if not rain_file.exists():
            raise FileNotFoundError(
                f"IMD gridded rainfall file not found at {rain_file}. "
                "Download from https://www.imdpune.gov.in/ or utilize SyntheticDataProvider."
            )
        import xarray as xr
        ds = xr.open_dataset(rain_file)
        return ds.to_dataframe().reset_index()


class ERA5DataProvider(DataProvider):
    """
    Adapter interface for ECMWF ERA5 Reanalysis (0.25° global reanalysis)
    Used as reference ground truth for atmospheric levels (500hPa, 850hPa, 200hPa).
    """

    def __init__(self, data_dir: str = "data/raw/era5"):
        self.data_dir = Path(data_dir)

    def get_source_label(self) -> str:
        return "ECMWF ERA5 Reanalysis"

    def is_synthetic(self) -> bool:
        return False

    def get_grid_spec(self) -> Dict[str, Any]:
        return {
            "lat_min": 8.0,
            "lat_max": 37.0,
            "lon_min": 68.0,
            "lon_max": 97.0,
            "resolution": 0.25,
            "region": "ERA5 South Asia Domain",
        }

    def load_forecast(
        self,
        init_date: datetime,
        lead_days: List[int],
    ) -> pd.DataFrame:
        raise NotImplementedError("ERA5 is an atmospheric reanalysis, not a predictive NWP model.")

    def load_observations(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> pd.DataFrame:
        era5_file = self.data_dir / f"era5_reanalysis_{start_date.strftime('%Y%m')}.nc"
        if not era5_file.exists():
            raise FileNotFoundError(f"ERA5 file not found at {era5_file}.")
        import xarray as xr
        ds = xr.open_dataset(era5_file)
        return ds.to_dataframe().reset_index()
