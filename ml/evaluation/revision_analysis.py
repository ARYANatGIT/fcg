"""
revision_analysis.py
Generates statistical plots and maps for forecast instability.
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(message)s")
WARNING_TEXT = "Synthetic Demonstration — Not Operational Forecast Risk"

def generate_revision_plots():
    data_path = Path("data/processed/forecast_revisions.parquet")
    if not data_path.exists():
        logging.error("Run revision_analyzer.py first.")
        return
        
    df = pd.read_parquet(data_path)
    df_rev = df[df['revision_available'] == True].copy()
    
    plot_dir = Path("data/processed/plots/revisions")
    plot_dir.mkdir(parents=True, exist_ok=True)
    
    plt.style.use('ggplot')
    
    # 1. Revision vs Lead Time
    plt.figure(figsize=(8, 5))
    sns.boxplot(data=df_rev, x='lead_day', y='combined_revision_score', palette='Blues')
    plt.title(f"Forecast Revision Magnitude by Lead Day\n{WARNING_TEXT}", fontsize=11)
    plt.xlabel("Lead Day of Current Forecast")
    plt.ylabel("Combined Revision Score")
    plt.savefig(plot_dir / "revision_by_lead_day.png", bbox_inches='tight')
    plt.close()
    
    # 2. Large Revision Frequency Map
    plt.figure(figsize=(8, 8))
    map_df = df_rev.groupby(['latitude', 'longitude'])['large_revision'].mean().reset_index()
    scatter = plt.scatter(map_df['longitude'], map_df['latitude'], 
                          c=map_df['large_revision'], cmap='Reds', s=60, alpha=0.9)
    plt.colorbar(scatter, label="Frequency of Large Revisions")
    plt.title(f"Spatial Map: Large Revision Frequency\n{WARNING_TEXT}", fontsize=11)
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.savefig(plot_dir / "large_revision_map.png", bbox_inches='tight')
    plt.close()
    
    # 3. Revision vs Historical Busts (Associative, not causal)
    plt.figure(figsize=(8, 5))
    sns.boxplot(data=df_rev, x='bust', y='combined_revision_score', palette='Set2')
    plt.title(f"Revision Magnitude vs Bust Outcome\n{WARNING_TEXT}", fontsize=11)
    plt.xlabel("Forecast Bust (0 = No, 1 = Yes)")
    plt.ylabel("Combined Revision Score")
    plt.savefig(plot_dir / "revision_vs_bust.png", bbox_inches='tight')
    plt.close()
    
    logging.info(f"Plots saved successfully to {plot_dir}")

if __name__ == "__main__":
    generate_revision_plots()