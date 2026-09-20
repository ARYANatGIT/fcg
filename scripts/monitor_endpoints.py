"""
ForecastGuard API Endpoint Health Monitor
Periodically verifies that all operational API endpoints of the platform
are functional, responsive, and returning valid meteorological telemetry.
Default interval: 30 minutes (1800 seconds).

Usage:
  python scripts/monitor_endpoints.py          # Runs continuously every 30 minutes
  python scripts/monitor_endpoints.py --once   # Runs a single verification pass and exits
  python scripts/monitor_endpoints.py --local  # Checks http://localhost:8000
"""

import os
import sys
import time
import argparse
import base64
import json
import logging
from datetime import datetime, timezone
import urllib.request
import urllib.error

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger("endpoint_monitor")

DEFAULT_REMOTE_URL = os.getenv("MONITOR_TARGET_URL", "https://forecastguard-api.onrender.com")
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "forecastguard_secure_2026")
DEFAULT_INTERVAL_SECONDS = 1800  # 30 minutes

ENDPOINTS_TO_CHECK = [
    {
        "name": "Root Service Directory",
        "path": "/",
        "method": "GET",
        "expected_keys": ["status", "service", "version"],
    },
    {
        "name": "Operational Healthcheck (v1)",
        "path": "/api/v1/health",
        "method": "GET",
        "expected_keys": ["status"],
    },
    {
        "name": "Monitored Stations Registry",
        "path": "/api/stations",
        "method": "GET",
        "expected_keys": ["count", "stations"],
    },
    {
        "name": "Real-Time Prediction (New Delhi)",
        "path": "/api/latest_prediction?station=New%20Delhi",
        "method": "GET",
        "expected_keys": ["status", "prediction"],
    },
    {
        "name": "Historical Telemetry (New Delhi)",
        "path": "/api/prediction_history?station=New%20Delhi",
        "method": "GET",
        "expected_keys": ["station", "count"],
    },
    {
        "name": "Weather News & IMD Alerts (10-Day Window)",
        "path": "/api/weather_news",
        "method": "GET",
        "expected_keys": ["status", "count", "articles"],
    },
    {
        "name": "Wind Field Vectors Grid",
        "path": "/api/wind_field",
        "method": "GET",
        "expected_keys": ["status", "grid_resolution"],
    },
    {
        "name": "Ensemble Spread (ECMWF 51-Member)",
        "path": "/api/ensemble_spread?station=New%20Delhi",
        "method": "GET",
        "expected_keys": ["city", "model"],
    },
    {
        "name": "Air Quality Diagnostics",
        "path": "/api/air_quality?station=New%20Delhi",
        "method": "GET",
        "expected_keys": ["city", "european_aqi"],
    },
    {
        "name": "Marine & Coastal Flood Risk",
        "path": "/api/marine_flood?station=Mumbai",
        "method": "GET",
        "expected_keys": ["city", "is_coastal"],
    },
    {
        "name": "Model Performance & Calibration Metrics",
        "path": "/api/model_performance",
        "method": "GET",
        "expected_keys": ["current_model"],
    },
    {
        "name": "Synoptic Weather Regimes",
        "path": "/api/synoptic_regimes",
        "method": "GET",
        "expected_keys": ["status", "regimes"],
    },
    {
        "name": "Historical Bust Events Archive",
        "path": "/api/historical_busts",
        "method": "GET",
        "expected_keys": ["status", "cases"],
    },
]

def make_auth_header(user: str, pwd: str) -> str:
    raw = f"{user}:{pwd}".encode("utf-8")
    encoded = base64.b64encode(raw).decode("utf-8")
    return f"Basic {encoded}"

def check_endpoint(base_url: str, endpoint: dict, auth_header: str) -> dict:
    url = f"{base_url.rstrip('/')}{endpoint['path']}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": auth_header,
            "Accept": "application/json",
            "User-Agent": "ForecastGuard-Endpoint-Monitor/2.0",
            "x-frontend-client": "forecastguard-web",
        }
    )

    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            latency_ms = round((time.perf_counter() - t0) * 1000, 1)
            status_code = response.status
            content = response.read().decode("utf-8", errors="ignore")
            
            try:
                data = json.loads(content)
            except Exception:
                return {
                    "name": endpoint["name"],
                    "path": endpoint["path"],
                    "status_code": status_code,
                    "latency_ms": latency_ms,
                    "passed": False,
                    "error": "Invalid JSON response"
                }

            missing = [k for k in endpoint.get("expected_keys", []) if k not in data]
            if missing:
                return {
                    "name": endpoint["name"],
                    "path": endpoint["path"],
                    "status_code": status_code,
                    "latency_ms": latency_ms,
                    "passed": False,
                    "error": f"Missing expected keys: {missing}"
                }

            return {
                "name": endpoint["name"],
                "path": endpoint["path"],
                "status_code": status_code,
                "latency_ms": latency_ms,
                "passed": True,
                "error": None
            }
    except urllib.error.HTTPError as e:
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {
            "name": endpoint["name"],
            "path": endpoint["path"],
            "status_code": e.code,
            "latency_ms": latency_ms,
            "passed": False,
            "error": f"HTTP Error {e.code}: {e.reason}"
        }
    except Exception as e:
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {
            "name": endpoint["name"],
            "path": endpoint["path"],
            "status_code": 0,
            "latency_ms": latency_ms,
            "passed": False,
            "error": str(e)
        }

def run_health_check_cycle(base_url: str) -> bool:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    auth_header = make_auth_header(ADMIN_USER, ADMIN_PASS)

    print("\n" + "=" * 80)
    print(f"FORECASTGUARD API HEALTH CHECK CYCLE -- {timestamp}")
    print(f"Target URL: {base_url}")
    print("=" * 80)

    results = []
    for ep in ENDPOINTS_TO_CHECK:
        res = check_endpoint(base_url, ep, auth_header)
        results.append(res)
        status_sym = "[ PASS ]" if res["passed"] else "[ FAIL ]"
        err_msg = f" -- {res['error']}" if res["error"] else ""
        print(f"{status_sym} {res['name']:<42} {res['path']:<38} {res['latency_ms']:>6.1f}ms (HTTP {res['status_code']}){err_msg}")

    total = len(results)
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = total - passed_count
    pass_rate = (passed_count / total) * 100

    print("-" * 80)
    print(f"SUMMARY: {passed_count}/{total} endpoints passing ({pass_rate:.1f}%) | Failures: {failed_count}")
    print("=" * 80 + "\n")

    return failed_count == 0

def main():
    parser = argparse.ArgumentParser(description="ForecastGuard 30-Minute Endpoint Health Monitor")
    parser.add_argument("--url", type=str, default=DEFAULT_REMOTE_URL, help="Base API URL")
    parser.add_argument("--local", action="store_true", help="Check http://localhost:8000 instead of remote")
    parser.add_argument("--once", action="store_true", help="Run once and exit with pass/fail exit code")
    parser.add_argument("--interval", type=int, default=DEFAULT_INTERVAL_SECONDS, help="Interval in seconds (default: 1800s / 30 mins)")
    args = parser.parse_args()

    target_url = "http://localhost:8000" if args.local else args.url

    if args.once:
        success = run_health_check_cycle(target_url)
        sys.exit(0 if success else 1)

    logger.info(f"Starting continuous endpoint health monitor for {target_url} (Interval: {args.interval}s / {args.interval // 60}m)...")
    while True:
        try:
            run_health_check_cycle(target_url)
        except Exception as e:
            logger.error(f"Unexpected monitor exception: {e}")
        
        logger.info(f"Cycle completed. Next health check scheduled in {args.interval // 60} minutes ({args.interval}s)...")
        time.sleep(args.interval)

if __name__ == "__main__":
    main()
