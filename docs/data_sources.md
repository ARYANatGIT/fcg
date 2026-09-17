# Data Sources & Provenance

## NCMRWF Target Application
**Note:** NCMRWF-specific historical forecast archives (NCUM/NEPS) require authorized MoES access and are not publicly available for automated anonymous download. The pipeline is designed to accept NCMRWF GRIB/NetCDF files once authorized access is granted.

## Prototype Validation Dataset (Open Source Alternative)
To build and validate the data pipeline without fabricating data, we target the following open datasets:

### 1. Historical Forecasts: NOAA GFS
*   **Provider:** NOAA (via AWS Registry of Open Data)
*   **Resolution:** 0.25 degree spatial, 3-hourly temporal
*   **Cycles:** 00Z, 06Z, 12Z, 18Z
*   **Max Lead Time:** 384 hours (16 days)
*   **License:** Open/Public Domain

### 2. Verification Data: Copernicus ERA5 Reanalysis
*   **Provider:** ECMWF / Copernicus Climate Change Service
*   **Resolution:** 0.25 degree spatial, hourly
*   **License:** Copernicus Open License
