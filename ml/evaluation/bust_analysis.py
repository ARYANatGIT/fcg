"""
bust_analysis.py
Analyzes bust frequency spatially and chronologically.
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

def perform_bust_analysis(df: pd.DataFrame, output_dir: Path):
    """Calculates bust frequencies per lead day and spatially."""
    
    # 1. Lead Day Analysis
    lead_stats = df.groupby('lead_day').agg(
        total_forecasts=('bust', 'count'),
        total_busts=('bust', 'sum'),
        bust_threshold=('bust_threshold', 'first'),
        mean_combined_error=('combined_error_score', 'mean'),
        median_combined_error=('combined_error_score', 'median')
    ).reset_index()
    
    lead_stats['bust_percentage'] = (lead_stats['total_busts'] / lead_stats['total_forecasts']) * 100
    
    # Print overall stats
    total_f = len(df)
    total_b = df['bust'].sum()
    logging.info(f"--- OVERALL STATS ---")
    logging.info(f"Total Forecasts: {total_f}")
    logging.info(f"Total Busts: {total_b}")
    logging.info(f"Overall Bust Percentage: {(total_b / total_f) * 100:.2f}%")
    
    # 2. Spatial Analysis
    spatial_stats = df.groupby(['latitude', 'longitude']).agg(
        total_forecasts=('bust', 'count'),
        total_busts=('bust', 'sum')
    ).reset_index()
    spatial_stats['bust_frequency'] = spatial_stats['total_busts'] / spatial_stats['total_forecasts']
    
    spatial_path = output_dir / "spatial_bust_frequency.csv"
    spatial_stats.to_csv(spatial_path, index=False)
    logging.info(f"Saved spatial analysis to {spatial_path}")
    
    return lead_stats, spatial_stats

def plot_bust_analysis(lead_stats: pd.DataFrame, spatial_stats: pd.DataFrame, plot_dir: Path):
    """Generates charts for lead day and spatial bust analysis."""
    plt.style.use('ggplot')
    warning_text = "Synthetic Demonstration Data — Not Operational Weather Data"
    
    # 1. Bust Threshold by Lead Day
    plt.figure(figsize=(8, 5))
    sns.lineplot(data=lead_stats, x='lead_day', y='bust_threshold', marker='o', color='purple')
    plt.title(f"Bust Threshold by Lead Day (90th Percentile)\n{warning_text}", fontsize=11)
    plt.ylabel("Combined Error Score Threshold")
    plt.xlabel("Lead Day")
    plt.savefig(plot_dir / "bust_threshold_by_leadday.png", bbox_inches='tight')
    plt.close()

    # 2. Bust Percentage by Lead Day
    plt.figure(figsize=(8, 5))
    sns.barplot(data=lead_stats, x='lead_day', y='bust_percentage', color='salmon')
    plt.title(f"Bust Percentage by Lead Day\n{warning_text}", fontsize=11)
    plt.ylabel("Bust Percentage (%)")
    plt.xlabel("Lead Day")
    # Add a horizontal line at 10% to show expected distribution
    plt.axhline(10, color='black', linestyle='--', alpha=0.7)
    plt.savefig(plot_dir / "bust_percentage_by_leadday.png", bbox_inches='tight')
    plt.close()
    
    # 3. Spatial Historical Bust Frequency Map
    plt.figure(figsize=(8, 8))
    scatter = plt.scatter(spatial_stats['longitude'], spatial_stats['latitude'], 
                          c=spatial_stats['bust_frequency'], cmap='Reds', s=50, alpha=0.9, vmin=0, vmax=0.2)
    plt.colorbar(scatter, label="Bust Frequency (Fraction)")
    plt.title(f"Spatial Historical Bust Frequency\n{warning_text}", fontsize=11)
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.savefig(plot_dir / "spatial_bust_frequency_map.png", bbox_inches='tight')
    plt.close()
    
    logging.info(f"Plots saved to {plot_dir}")

if __name__ == "__main__":
    input_path = Path("data/processed/forecast_bust_labels.parquet")
    output_dir = Path("data/processed")
    plot_dir = Path("data/processed/plots/bust")
    plot_dir.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_parquet(input_path)
    lead_stats, spatial_stats = perform_bust_analysis(df, output_dir)
    plot_bust_analysis(lead_stats, spatial_stats, plot_dir)