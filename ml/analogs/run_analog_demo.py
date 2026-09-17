"""
run_analog_demo.py
Demonstrates the Historical Analog Retrieval system.
Generates structured JSON, a comparative markdown table, and plots.
"""

import pandas as pd
import json
import logging
import sys
from pathlib import Path
import matplotlib.pyplot as plt

# Add root directory to path so Python can find the 'ml' module
sys.path.append(str(Path(__file__).resolve().parents[2]))
from ml.analogs.retriever import HistoricalAnalogRetriever

logging.basicConfig(level=logging.INFO, format="%(message)s")
WARNING_TEXT = "Synthetic Demonstration — Not Operational Forecast Risk"

def run_demo():
    retriever = HistoricalAnalogRetriever()
    
    # Pick a random sample from the Validation period (so history exists)
    val_start = retriever.train_end + pd.Timedelta(days=1)
    val_db = retriever.db[retriever.db['forecast_initialization_time'] >= val_start]
    
    if len(val_db) == 0:
        logging.error("No validation data found to test.")
        return
        
    query_row = val_db.sample(1, random_state=42).iloc[0]
    
    logging.info(f"--- ANALOG QUERY ---")
    logging.info(f"Target Init Date: {query_row['forecast_initialization_time']}")
    logging.info(f"Lead Day: {query_row['lead_day']} | Lat: {query_row['latitude']} | Lon: {query_row['longitude']}\n")
    
    results = retriever.retrieve(query_row, top_k=5)
    
    # Print JSON
    logging.info("--- JSON RESPONSE ---")
    logging.info(json.dumps(results, indent=2))
    
    # Print Markdown Table
    logging.info("\n--- CURRENT VS ANALOGS COMPARISON TABLE ---")
    
    analogs_df = pd.DataFrame(results['analogs'])
    table_data = {
        'Feature': ['Init Time', 'Latitude', 'Longitude', 'Lead Day', 'Similarity Distance', 'Outcome: BUST?']
    }
    
    table_data['Current Forecast'] = [
        str(query_row['forecast_initialization_time'].date()),
        query_row['latitude'], query_row['longitude'], query_row['lead_day'], "N/A (Query)", "N/A (Target)"
    ]
    
    for i, a in enumerate(results['analogs']):
        date_str = str(pd.to_datetime(a['initialization_time']).date())
        table_data[f'Analog {i+1}'] = [
            date_str, a['latitude'], a['longitude'], a['lead_day'], round(a['similarity_distance'], 2), "YES" if a['bust'] == 1 else "NO"
        ]
        
    comp_df = pd.DataFrame(table_data)
    logging.info("\n" + comp_df.to_markdown(index=False))
    
    # Visualizations
    plot_dir = Path("data/processed/plots/analogs")
    plot_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Analog Locations Map
    plt.figure(figsize=(8, 8))
    plt.scatter(analogs_df['longitude'], analogs_df['latitude'], c='blue', s=100, label='Analogs')
    plt.scatter(query_row['longitude'], query_row['latitude'], c='red', s=150, marker='*', label='Current Forecast')
    plt.title(f"Analog Locations vs Current Forecast\n{WARNING_TEXT}")
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.legend()
    plt.savefig(plot_dir / "analog_locations_map.png", bbox_inches='tight')
    plt.close()
    
    logging.info(f"\nDemo complete. Visualizations saved to {plot_dir}")

if __name__ == "__main__":
    run_demo()