"""
global_shap.py
Generates global SHAP explanations and visualizations for the LightGBM model.
"""

import pandas as pd
import numpy as np
import shap
import joblib
import json
import logging
from pathlib import Path
import matplotlib.pyplot as plt
import sys

sys.path.append(str(Path(__file__).resolve().parents[2]))
from ml.evaluation.leakage_audit import audit_features

logging.basicConfig(level=logging.INFO, format="%(message)s")
WARNING_TEXT = "Synthetic Demonstration Model - SHAP explains ML logic, not atmospheric causality."
SHAP_SAMPLE_SIZE = 2000
RANDOM_SEED = 42

def run_global_shap():
    audit_features()
    
    # 1. Setup paths
    out_dir = Path("data/processed/model_outputs")
    plot_dir = Path("data/processed/plots/shap")
    plot_dir.mkdir(parents=True, exist_ok=True)
    
    # 2. Load Model and Data
    model = joblib.load("models/lightgbm_bust_model.pkl")
    X_val = pd.read_parquet("data/processed/ml/X_val.parquet")
    
    # 3. Sample Data (SHAP is expensive)
    if len(X_val) > SHAP_SAMPLE_SIZE:
        X_sample = X_val.sample(n=SHAP_SAMPLE_SIZE, random_state=RANDOM_SEED)
    else:
        X_sample = X_val
        
    # 4. Generate SHAP Values (TreeExplainer is highly optimized for LightGBM)
    logging.info(f"Generating SHAP values for {len(X_sample)} validation samples...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer(X_sample)
    
    # 5. Global Feature Importance
    mean_abs_shap = np.abs(shap_values.values).mean(axis=0)
    importance_df = pd.DataFrame({
        'feature': X_sample.columns,
        'mean_abs_shap': mean_abs_shap
    }).sort_values('mean_abs_shap', ascending=False)
    importance_df['rank'] = range(1, len(importance_df) + 1)
    
    importance_df.to_csv(out_dir / "shap_global_importance.csv", index=False)
    
    logging.info("\n--- TOP 15 FEATURES (Mean Absolute SHAP) ---")
    logging.info(importance_df.head(15).to_string(index=False))
    
    # 6. Global Plots
    plt.figure(figsize=(10, 6))
    shap.plots.bar(shap_values, max_display=15, show=False)
    plt.title(f"Global SHAP Feature Importance\n{WARNING_TEXT}", fontsize=10)
    plt.savefig(plot_dir / "shap_bar.png", bbox_inches='tight')
    plt.close()
    
    plt.figure(figsize=(10, 6))
    shap.plots.beeswarm(shap_values, max_display=15, show=False)
    plt.title(f"SHAP Beeswarm Plot (Validation Set)\n{WARNING_TEXT}", fontsize=10)
    plt.savefig(plot_dir / "shap_beeswarm.png", bbox_inches='tight')
    plt.close()

    # 7. Lead-Time SHAP Analysis
    logging.info("Generating Lead-Day SHAP analysis...")
    if 'lead_day' in X_sample.columns:
        X_sample_df = pd.DataFrame(X_sample, columns=X_sample.columns)
        lead_days = sorted(X_sample_df['lead_day'].unique())
        
        lead_day_importance = []
        for ld in lead_days:
            idx = X_sample_df['lead_day'] == ld
            if idx.sum() > 0:
                ld_shap = np.abs(shap_values.values[idx]).mean(axis=0)
                row = {'lead_day': ld}
                row.update({feat: val for feat, val in zip(X_sample.columns, ld_shap)})
                lead_day_importance.append(row)
                
        ld_df = pd.DataFrame(lead_day_importance)
        ld_df.to_csv(out_dir / "shap_by_lead_day.csv", index=False)
        
        # Plot top 5 features evolving over lead time
        top_5_feats = importance_df['feature'].head(5).tolist()
        plt.figure(figsize=(10, 6))
        for feat in top_5_feats:
            if feat != 'lead_day': # Exclude lead_day itself from the lines
                plt.plot(ld_df['lead_day'], ld_df[feat], marker='o', label=feat)
        plt.title(f"SHAP Importance by Lead Day\n{WARNING_TEXT}", fontsize=10)
        plt.xlabel("Lead Day")
        plt.ylabel("Mean Absolute SHAP Value")
        plt.legend()
        plt.savefig(plot_dir / "shap_by_lead_day.png", bbox_inches='tight')
        plt.close()

    logging.info(f"SHAP analysis complete. Plots saved to {plot_dir}")

if __name__ == "__main__":
    run_global_shap()