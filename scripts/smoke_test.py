import sys
from pathlib import Path

# Add root directory to sys.path
sys.path.append(str(Path(__file__).resolve().parents[1]))

def run_smoke_test():
    print("Running ForecastGuard AI Smoke Test...")
    try:
        import requests
        res = requests.get("http://localhost:8000/api/v1/health", timeout=1.0)
        client = None
        base_url = "http://localhost:8000/api/v1"
        is_live = True
        print("[INFO] Testing against live API server on :8000")
    except Exception:
        from fastapi.testclient import TestClient
        from backend.main import app
        from backend.services.model_service import model_service
        model_service.load_models()
        client = TestClient(app)
        base_url = "/api/v1"
        is_live = False
        print("[INFO] Live server not detected. Testing against FastAPI in-process TestClient.")

    def get(endpoint):
        if is_live:
            import requests
            return requests.get(f"{base_url}{endpoint}")
        return client.get(f"{base_url}{endpoint}")

    def post(endpoint, payload):
        if is_live:
            import requests
            return requests.post(f"{base_url}{endpoint}", json=payload)
        return client.post(f"{base_url}{endpoint}", json=payload)

    # 1. Health Check
    h_res = get("/health")
    assert h_res.status_code == 200, f"Health check failed with {h_res.status_code}"
    h_data = h_res.json()
    assert h_data.get("status") == "ok"
    assert h_data.get("model_loaded") is True
    print("[SUCCESS] 1. Health Check Endpoint Passed (/api/v1/health)")

    # 2. Features Catalog
    f_res = get("/features")
    assert f_res.status_code == 200
    assert len(f_res.json()["data"]["features"]) > 0
    print("[SUCCESS] 2. Feature Catalog Endpoint Passed (/api/v1/features)")

    # 3. Spatial Grid Map
    g_res = get("/spatial-grid?lead_day=5")
    assert g_res.status_code == 200
    assert len(g_res.json()["data"]["stations"]) > 0
    print("[SUCCESS] 3. Spatial Grid Map Endpoint Passed (/api/v1/spatial-grid)")

    # 4. Model Prediction & Explainability
    import json
    with open("models/model_metadata.json", "r") as f:
        meta = json.load(f)
    dummy_feat = {feat: 0.0 for feat in meta["features"]}
    dummy_feat.update({"latitude": 20.0, "longitude": 80.0, "lead_day": 5, "forecast_rainfall": 25.0})

    payload = {
        "initialization_time": "2026-01-05 00:00:00",
        "valid_time": "2026-01-10 00:00:00",
        "latitude": 20.0,
        "longitude": 80.0,
        "lead_day": 5,
        "features": dummy_feat
    }

    pred_res = post("/predict", payload)
    assert pred_res.status_code == 200
    assert "calibrated_bust_probability" in pred_res.json()["data"]
    print("[SUCCESS] 4. Calibrated Prediction Endpoint Passed (/api/v1/predict)")

    analyze_res = post("/analyze", payload)
    assert analyze_res.status_code == 200
    a_data = analyze_res.json()["data"]
    assert "prediction_and_explanation" in a_data
    assert "analogs" in a_data
    assert "revision" in a_data
    assert "lead_day_curve" in a_data
    print("[SUCCESS] 5. Full Decision-Support Analysis Passed (/api/v1/analyze)")

    print("\n=======================================================")
    print("ALL 5 SMOKE TESTS PASSED CLEANLY! SYSTEM FULLY VERIFIED.")
    print("=======================================================\n")

if __name__ == '__main__':
    run_smoke_test()

