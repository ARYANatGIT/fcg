"""
ForecastGuard AI — Dual Autonomous Operational Daemon Scheduler
Executes:
1. Every 10 minutes: Multi-source data extraction across 25 Indian cities (Open-Meteo & Google Maps).
2. Every 12 hours: Continuous ML model retraining on newly accumulated observations, tracking R² drift,
   and triggering zero-downtime hot reload in the FastAPI service.
"""

import os
import sys
import time
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.multi_source_ingestion import run_full_extraction_cycle, INDIAN_CITIES
from src.train_model import train_and_evaluate_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scheduler")

# Default intervals: 10 minutes for data extraction, 12 hours for ML retraining
INGEST_INTERVAL_SECONDS = int(os.getenv("INGESTION_INTERVAL_MINUTES", "10")) * 60
RETRAIN_INTERVAL_SECONDS = int(os.getenv("RETRAINING_INTERVAL_HOURS", "12")) * 3600


def run_scheduler_loop(
    ingest_interval: int = INGEST_INTERVAL_SECONDS,
    retrain_interval: int = RETRAIN_INTERVAL_SECONDS,
    run_once: bool = False,
):
    """
    Main background daemon managing automated data ingestion and 12-hour ML retraining.
    """
    logger.info("==========================================================")
    logger.info("FORECASTGUARD AI — AUTONOMOUS OPERATIONAL SCHEDULER LAUNCHED")
    logger.info(f"Ingestion Schedule: Every {ingest_interval // 60} minutes")
    logger.info(f"ML Retraining Schedule: Every {retrain_interval // 3600} hours")
    logger.info("==========================================================")

    last_ingest_time = 0.0
    last_retrain_time = 0.0

    while True:
        now = time.time()

        # 1. Trigger Data Ingestion if interval elapsed
        if now - last_ingest_time >= ingest_interval:
            logger.info("Triggering 10-minute multi-source data ingestion pass...")
            try:
                counts = run_full_extraction_cycle(INDIAN_CITIES)
                logger.info(f"Ingestion pass succeeded: {counts}")
                last_ingest_time = time.time()
            except Exception as e:
                logger.error(f"Error during ingestion pass: {e}")

        # 2. Trigger Continuous 12-Hour ML Retraining if interval elapsed
        if now - last_retrain_time >= retrain_interval:
            logger.info("Triggering 12-hour continuous ML retraining pipeline...")
            try:
                bundle = train_and_evaluate_model()
                logger.info(
                    f"Model retraining complete: R² = {bundle['metrics']['r2']:.4f}, "
                    f"MAE = {bundle['metrics']['mae']:.4f} °C, Samples = {bundle['train_samples'] + bundle['test_samples']}"
                )
                last_retrain_time = time.time()

                # Hot-reload in memory model if FastAPI is running locally
                try:
                    import urllib.request
                    reload_req = urllib.request.Request(
                        "http://localhost:8000/api/admin/reload_model",
                        headers={"User-Agent": "ForecastGuard-Scheduler/1.0"},
                    )
                    with urllib.request.urlopen(reload_req, timeout=3) as resp:
                        logger.info(f"FastAPI hot-reload signal sent. HTTP {resp.status}")
                except Exception:
                    pass
            except Exception as e:
                logger.error(f"Error during ML model retraining: {e}")

        if run_once:
            logger.info("Single scheduled pass complete (--once). Exiting daemon.")
            break

        # Sleep in 10-second heartbeat slices to remain responsive
        time.sleep(10)


def main():
    parser = argparse.ArgumentParser(description="ForecastGuard AI Dual Daemon Scheduler")
    parser.add_argument("--once", action="store_true", help="Execute single ingestion + retraining cycle and exit")
    parser.add_argument("--ingest-interval-mins", type=int, default=10, help="Ingestion interval in minutes")
    parser.add_argument("--retrain-interval-hours", type=int, default=12, help="Retraining interval in hours")
    args = parser.parse_args()

    run_scheduler_loop(
        ingest_interval=args.ingest_interval_mins * 60,
        retrain_interval=args.retrain_interval_hours * 3600,
        run_once=args.once,
    )


if __name__ == "__main__":
    main()

