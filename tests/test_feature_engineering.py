import pytest
import pandas as pd
import json
from pathlib import Path

@pytest.fixture(scope="module")
def ml_data():
    dir_path = Path("data/processed/ml")
    return {
        'X_train': pd.read_parquet(dir_path / "X_train.parquet"),
        'y_train': pd.read_parquet(dir_path / "y_train.parquet"),
        'X_val': pd.read_parquet(dir_path / "X_val.parquet"),
        'y_val': pd.read_parquet(dir_path / "y_val.parquet"),
        'X_test': pd.read_parquet(dir_path / "X_test.parquet"),
        'y_test': pd.read_parquet(dir_path / "y_test.parquet"),
        'meta': json.load(open(dir_path / "split_metadata.json"))
    }

def test_no_leakage_in_features(ml_data):
    forbidden = ['observed', 'error', 'bias', 'bust', 'threshold']
    for col in ml_data['X_train'].columns:
        if col == 'historical_error_lag1': continue
        for term in forbidden:
            assert term not in col, f"Leakage found: {col}"

def test_target_is_clean(ml_data):
    for split in ['y_train', 'y_val', 'y_test']:
        y = ml_data[split]['bust']
        assert set(y.unique()).issubset({0, 1}), "Target must be strictly binary 0/1"
        assert y.isna().sum() == 0, "No NaNs allowed in target"

def test_column_parity(ml_data):
    assert list(ml_data['X_train'].columns) == list(ml_data['X_val'].columns)
    assert list(ml_data['X_train'].columns) == list(ml_data['X_test'].columns)

def test_shapes_match(ml_data):
    assert len(ml_data['X_train']) == len(ml_data['y_train'])
    assert len(ml_data['X_val']) == len(ml_data['y_val'])
    assert len(ml_data['X_test']) == len(ml_data['y_test'])