from fastapi import HTTPException

# Terms that strictly cannot be passed as prediction features
FORBIDDEN_TERMS = ['observed', 'error', 'bias', 'bust', 'threshold', 'excess']
ALLOWED_EXCEPTIONS = ['historical_error_lag1']

def check_feature_leakage(features: dict):
    """Guarantees no future/target data leaks into the API request."""
    for key in features.keys():
        if key in ALLOWED_EXCEPTIONS:
            continue
        for term in FORBIDDEN_TERMS:
            if term in key:
                raise HTTPException(
                    status_code=422, 
                    detail=f"DATA LEAKAGE REJECTED: Feature '{key}' contains forbidden term '{term}'."
                )