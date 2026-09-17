import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")

def generate_feature_plots():
    df_X = pd.read_parquet("data/processed/ml/X_train.parquet")
    plot_dir = Path("data/processed/plots/features")
    plot_dir.mkdir(parents=True, exist_ok=True)
    
    plt.figure(figsize=(14, 10))
    corr = df_X.corr()
    sns.heatmap(corr, cmap='coolwarm', center=0, annot=False, fmt=".2f")
    plt.title("Feature Correlation Matrix (Train Set)\nSynthetic Demonstration Data")
    plt.savefig(plot_dir / "feature_correlation.png", bbox_inches='tight')
    plt.close()
    logging.info(f"Saved correlation heatmap to {plot_dir}")

if __name__ == "__main__":
    generate_feature_plots()