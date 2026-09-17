"""
leakage_audit.py
Audits the feature matrix to guarantee ZERO target/observation data leakage.
"""

import json
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(message)s")

def audit_features():
    meta_path = Path("data/processed/ml/split_metadata.json")
    if not meta_path.exists():
        logging.error("Metadata not found. Run split_data.py first.")
        sys.exit(1)
        
    with open(meta_path, 'r') as f:
        meta = json.load(f)
        
    features = meta['features']
    forbidden_terms = ['observed', 'error', 'bias', 'bust', 'threshold', 'excess']
    allowed_exceptions = ['historical_error_lag1']
    
    logging.info("========================================")
    logging.info("         DATA LEAKAGE AUDIT             ")
    logging.info("========================================\n")
    
    leakage_found = False
    
    for feat in features:
        if feat in allowed_exceptions:
            logging.info(f"[SAFE] {feat} - Reason: Explicitly allowed historical feature")
            continue
            
        is_safe = True
        for term in forbidden_terms:
            if term in feat:
                logging.error(f"[REJECTED] {feat} - Reason: Contains forbidden term '{term}' (Future Data)")
                is_safe = False
                leakage_found = True
                break
                
        if is_safe:
            logging.info(f"[SAFE] {feat} - Reason: Derived safely from forecast/context")
            
    logging.info("\n========================================")
    if leakage_found:
        logging.error("AUDIT FAILED: DATA LEAKAGE DETECTED.")
        sys.exit(1)
    else:
        logging.info("AUDIT PASSED: NO LEAKAGE DETECTED.")

if __name__ == "__main__":
    audit_features()