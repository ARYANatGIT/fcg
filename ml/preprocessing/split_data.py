"""
split_data.py
Performs a chronological 70/15/15 train/val/test split.
Safely isolates features (X) from targets (y) and exports metadata.
"""

import pandas as pd
import json
import logging
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[2]))
from ml.features.build_features import engineer_features
from scripts.config import SPLIT_RATIOS, RANDOM_SEED

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

def get_chronological_split_dates(df: pd.DataFrame):
    """Calculates split boundaries based on unique initialization dates."""
    dates = sorted(df['forecast_initialization_time'].unique())
    n_dates = len(dates)
    
    train_idx = max(1, int(n_dates * SPLIT_RATIOS['train']))
    val_idx = train_idx + max(1, int(n_dates * SPLIT_RATIOS['val']))
    
    # Boundaries
    train_end = dates[train_idx - 1]
    val_end = dates[val_idx - 1] if val_idx - 1 < n_dates else dates[-1]
    
    return train_end, val_end

def isolate_features_and_targets(df: pd.DataFrame):
    """Strips all observed/future/target data to create a leakage-free X matrix."""
    y = df['bust'].copy()
    
    # Identify forbidden columns
    forbidden_terms = ['observed', 'error', 'bias', 'bust', 'threshold', 'excess']
    forbidden_cols = [col for col in df.columns if any(term in col for term in forbidden_terms) 
                      and col != 'historical_error_lag1'] # Exception for explicitly safe historical lags
    
    # Drop forbidden cols and non-feature administrative cols
    admin_cols = ['forecast_initialization_time', 'forecast_valid_time']
    X = df.drop(columns=forbidden_cols + admin_cols)
    
    return X, y

if __name__ == "__main__":
    input_path = Path("data/processed/forecast_bust_labels.parquet")
    out_dir = Path("data/processed/ml")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_parquet(input_path)
    df = engineer_features(df)
    
    train_end, val_end = get_chronological_split_dates(df)
    
    # Split
    train_mask = df['forecast_initialization_time'] <= train_end
    val_mask = (df['forecast_initialization_time'] > train_end) & (df['forecast_initialization_time'] <= val_end)
    test_mask = df['forecast_initialization_time'] > val_end
    
    train_df = df[train_mask].copy()
    val_df = df[val_mask].copy()
    test_df = df[test_mask].copy()
    
    # Isolate
    X_train, y_train = isolate_features_and_targets(train_df)
    X_val, y_val = isolate_features_and_targets(val_df)
    X_test, y_test = isolate_features_and_targets(test_df)
    
    # Save Data
    datasets = {
        'X_train': X_train, 'y_train': pd.DataFrame(y_train),
        'X_val': X_val, 'y_val': pd.DataFrame(y_val),
        'X_test': X_test, 'y_test': pd.DataFrame(y_test)
    }
    
    for name, data in datasets.items():
        data.to_parquet(out_dir / f"{name}.parquet", index=False)
        
    # Save Metadata
    metadata = {
        'split_proportions': SPLIT_RATIOS,
        'random_seed': RANDOM_SEED,
        'split_dates': {
            'train_end': str(train_end),
            'val_end': str(val_end)
        },
        'row_counts': {
            'train': len(X_train), 'val': len(X_val), 'test': len(X_test)
        },
        'features': list(X_train.columns),
        'target': 'bust',
        'class_balance': {
            'train_bust_pct': round(y_train.mean() * 100, 2),
            'val_bust_pct': round(y_val.mean() * 100, 2),
            'test_bust_pct': round(y_test.mean() * 100, 2)
        }
    }
    
    with open(out_dir / "split_metadata.json", 'w') as f:
        json.dump(metadata, f, indent=4)
        
    logging.info(f"Pipeline complete. Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    logging.info(f"Saved matrices and metadata to {out_dir}")