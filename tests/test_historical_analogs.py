"""
test_historical_analogs.py
Validates the Historical Analog Retrieval system for data leakage and logical correctness.
"""

import pytest
import pandas as pd
from ml.analogs.retriever import HistoricalAnalogRetriever

@pytest.fixture(scope="module")
def retriever():
    return HistoricalAnalogRetriever()

@pytest.fixture
def sample_query(retriever):
    # Pick a row from the middle of the dataset so history exists
    mid_idx = len(retriever.db) // 2
    return retriever.db.iloc[mid_idx]

def test_retriever_initialization(retriever):
    assert len(retriever.db) > 0
    assert retriever.scaler is not None

def test_strict_temporal_leakage_prevention(retriever, sample_query):
    """Proves no analog is from the future, and the current forecast is excluded."""
    results = retriever.retrieve(sample_query, top_k=5)
    
    query_time = pd.to_datetime(results['current_forecast']['initialization_time'])
    
    for analog in results['analogs']:
        analog_time = pd.to_datetime(analog['initialization_time'])
        # STRICTLY LESS THAN (Not <=). Current forecast cannot match itself.
        assert analog_time < query_time, "DATA LEAKAGE: Retrieved an analog from the future or the query itself!"

def test_same_lead_day_constraint(retriever, sample_query):
    """Ensures same_lead_day_only config is respected."""
    results = retriever.retrieve(sample_query)
    target_lead_day = results['current_forecast']['lead_day']
    
    for analog in results['analogs']:
        assert analog['lead_day'] == target_lead_day

def test_top_k_limits(retriever, sample_query):
    results = retriever.retrieve(sample_query, top_k=3)
    assert len(results['analogs']) <= 3

def test_sorting_by_distance(retriever, sample_query):
    results = retriever.retrieve(sample_query, top_k=5)
    distances = [a['similarity_distance'] for a in results['analogs']]
    
    # Ensure distances are strictly non-decreasing (sorted nearest to furthest)
    assert all(distances[i] <= distances[i+1] for i in range(len(distances)-1))

def test_target_leakage_in_features(retriever):
    """Ensures historical outcomes (bust, errors) are NOT used to calculate similarity."""
    forbidden = ['bust', 'combined_error_score', 'observed', 'error_excess']
    
    for feature in retriever.features:
        for term in forbidden:
            assert term not in feature, f"TARGET LEAKAGE: {feature} found in similarity vector!"