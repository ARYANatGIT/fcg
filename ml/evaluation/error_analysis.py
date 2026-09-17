"""
error_analysis.py
Generates statistics and visualizations of forecast errors by lead time.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

def perform_lead_time_analysis(df: pd.DataFrame, output_dir: Path):
    """Calculates error statistics per lead day."""
    metrics = [
        'temperature_absolute_error', 'rainfall_absolute_error',
        'wind_vector_error', 'pressure_absolute_error',
        'humidity_absolute_error', 'combined_error_score'
    ]
    
    # Calculate aggregation stats
    stats_list = []
    for day in sorted(df['lead_day'].unique()):
        day_data = df[df['lead_day'] == day]
        row = {'lead_day': day}
        for m in metrics:
            row[f'{m}_mean'] = day_data[m].mean()
            row[f'{m}_median'] = day_data[m].median()
            row[f'{m}_std'] = day_data[m].std()
            row[f'{m}_75th'] = day_data[m].quantile(0.75)
            row[f'{m}_90th'] = day_data[m].quantile(0.90)
            row[f'{m}_95th'] = day_data[m].quantile(0.95)
            row[f'{m}_max'] = day_data[m].max()
        stats_list.append(row)
        
    stats_df = pd.DataFrame(stats_list)
    stats_path = output_dir / "lead_time_statistics.csv"
    stats_df.to_csv(stats_path, index=False)
    logging.info(f"Saved tabular lead-time statistics to {stats_path}")
    
def create_plots(df: pd.DataFrame, output_dir: Path):
    """Generates requested visualizations."""
    plt.style.use('ggplot')
    warning_text = "SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL WEATHER DATA"

    # 1. Boxplots of combined error for Day 1-10
    plt.figure(figsize=(10, 6))
    sns.boxplot(x='lead_day', y='combined_error_score', data=df)
    plt.title(f"Combined Error Score by Lead Day\n{warning_text}", fontsize=12)
    plt.ylabel("Combined Error Score")
    plt.xlabel("Forecast Lead Day")
    plt.savefig(output_dir / "combined_error_boxplot.png", bbox_inches='tight')
    plt.close()

    # 2. 90th Percentile Error vs Lead Day
    percentiles = df.groupby('lead_day')['combined_error_score'].quantile(0.90).reset_index()
    plt.figure(figsize=(8, 5))
    sns.lineplot(x='lead_day', y='combined_error_score', data=percentiles, marker='o', color='red')
    plt.title(f"90th Percentile Combined Error vs Lead Day\n{warning_text}", fontsize=12)
    plt.ylabel("90th Percentile Combined Error")
    plt.xlabel("Lead Day")
    plt.savefig(output_dir / "combined_error_90th_percentile.png", bbox_inches='tight')
    plt.close()

    # 3. Geographic Error Map (Day 5 Example)
    day5_df = df[df['lead_day'] == 5]
    # Average over initialization dates for a smooth map
    map_df = day5_df.groupby(['latitude', 'longitude'])['combined_error_score'].mean().reset_index()
    
    plt.figure(figsize=(8, 8))
    scatter = plt.scatter(map_df['longitude'], map_df['latitude'], 
                          c=map_df['combined_error_score'], cmap='inferno', s=50, alpha=0.8)
    plt.colorbar(scatter, label="Mean Combined Error Score")
    plt.title(f"Day 5 Geographic Error Map (Average)\n{warning_text}", fontsize=12)
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.savefig(output_dir / "geographic_error_map_day5.png", bbox_inches='tight')
    plt.close()
    
    logging.info("Saved visualizations to output directory.")

if __name__ == "__main__":
    input_path = Path("data/processed/forecast_errors.parquet")
    plot_dir = Path("data/processed/plots")
    plot_dir.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_parquet(input_path)
    perform_lead_time_analysis(df, plot_dir)
    create_plots(df, plot_dir)