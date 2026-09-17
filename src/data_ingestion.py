"""
ForecastGuard AI — Real-Time Meteorological Data Ingestion Worker
Fetches live weather observations from the Open-Meteo public API
and streams the payload into MongoDB collection 'real_time_data'.
"""

import sys
import time
import argparse
import logging
import urllib.request
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.db import get_real_time_collection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("data_ingestion")

# Open-Meteo API endpoint (New Delhi India - 28.61°N, 77.21°E)
API_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=28.6139&longitude=77.2090"
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m"
    "&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m"
    "&past_days=7"
    "&timezone=auto"
)


def fetch_weather_payload() -> Dict[str, Any]:
    """Fetches real-time JSON payload from Open-Meteo public API."""
    req = urllib.request.Request(
        API_URL,
        headers={"User-Agent": "ForecastGuard-DataIngestion/1.0"},
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP request failed with status code {response.status}")
        raw_body = response.read().decode("utf-8")
        return json.loads(raw_body)


def ingest_real_time_record(collection, payload: Dict[str, Any]) -> str:
    """Extracts current weather and inserts a standardized record into real_time_data collection."""
    current = payload.get("current", {})
    ingestion_time = datetime.now(timezone.utc).isoformat()

    doc = {
        "source": "Open-Meteo Live API",
        "station": "New Delhi IMD/NCMRWF Corridor",
        "latitude": payload.get("latitude", 28.61),
        "longitude": payload.get("longitude", 77.21),
        "elevation": payload.get("elevation", 216.0),
        "timestamp": ingestion_time,
        "observed_time": current.get("time"),
        "temperature_2m": float(current.get("temperature_2m", 0.0)),
        "apparent_temperature": float(current.get("apparent_temperature", 0.0)),
        "relative_humidity_2m": float(current.get("relative_humidity_2m", 0.0)),
        "precipitation": float(current.get("precipitation", 0.0)),
        "surface_pressure": float(current.get("surface_pressure", 1010.0)),
        "wind_speed_10m": float(current.get("wind_speed_10m", 0.0)),
        "wind_direction_10m": float(current.get("wind_direction_10m", 0.0)),
        "raw_payload": current,
    }

    result = collection.insert_one(doc)
    doc_id = str(result.inserted_id) if hasattr(result, "inserted_id") else "ok"
    logger.info(
        f"Inserted live observation document {doc_id}: "
        f"T={doc['temperature_2m']}°C, RH={doc['relative_humidity_2m']}%, P={doc['surface_pressure']} hPa, Wind={doc['wind_speed_10m']} m/s"
    )
    return doc_id


def ingest_historical_seed(collection, payload: Dict[str, Any]) -> int:
    """
    Populates recent hourly history from Open-Meteo into collection if empty,
    providing immediate training data for ML models.
    """
    hourly = payload.get("hourly", {})
    times = hourly.get("time", [])
    if not times:
        return 0

    existing_count = collection.count_documents()
    if existing_count >= len(times):
        return 0

    logger.info(f"Seeding {len(times)} recent hourly observations for ML training...")
    docs = []
    temps = hourly.get("temperature_2m", [])
    rhs = hourly.get("relative_humidity_2m", [])
    pressures = hourly.get("surface_pressure", [])
    winds = hourly.get("wind_speed_10m", [])

    for i, t in enumerate(times):
        if i >= len(temps):
            break
        docs.append({
            "source": "Open-Meteo Hourly History",
            "station": "New Delhi IMD/NCMRWF Corridor",
            "latitude": payload.get("latitude", 28.61),
            "longitude": payload.get("longitude", 77.21),
            "timestamp": t + "Z" if not t.endswith("Z") else t,
            "observed_time": t,
            "temperature_2m": float(temps[i]) if temps[i] is not None else 25.0,
            "apparent_temperature": float(temps[i]) if temps[i] is not None else 25.0,
            "relative_humidity_2m": float(rhs[i]) if i < len(rhs) and rhs[i] is not None else 60.0,
            "precipitation": 0.0,
            "surface_pressure": float(pressures[i]) if i < len(pressures) and pressures[i] is not None else 1010.0,
            "wind_speed_10m": float(winds[i]) if i < len(winds) and winds[i] is not None else 5.0,
            "wind_direction_10m": 90.0,
        })

    collection.insert_many(docs)
    logger.info(f"Successfully seeded {len(docs)} historical records into MongoDB collection 'real_time_data'.")
    return len(docs)


def run_ingestion_cycle(collection) -> bool:
    """Executes a single ingestion cycle."""
    try:
        payload = fetch_weather_payload()
        # Seed history on initial run if needed
        ingest_historical_seed(collection, payload)
        # Ingest current live observation
        ingest_real_time_record(collection, payload)
        return True
    except Exception as e:
        logger.error(f"Error during ingestion cycle: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Real-time Meteorological Data Ingestion Worker")
    parser.add_argument("--once", action="store_true", help="Execute single fetch and exit immediately")
    parser.add_argument("--interval", type=int, default=600, help="Interval in seconds between fetches (default: 600s / 10m)")
    args = parser.parse_args()

    collection = get_real_time_collection()
    logger.info(f"Starting Data Ingestion Worker (interval: {args.interval}s, once: {args.once})")

    if args.once:
        success = run_ingestion_cycle(collection)
        logger.info("One-shot ingestion complete. Exiting.")
        sys.exit(0 if success else 1)

    while True:
        logger.info("Triggering scheduled 10-minute real-time data fetch...")
        run_ingestion_cycle(collection)
        logger.info(f"Cycle completed. Sleeping for {args.interval} seconds (10 minutes)...")
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
