"""
calibrate_models.py
Fits, evaluates, and selects probability calibration methods (Sigmoid vs Isotonic)
to ensure model reliability. Prevents target leakage by fitting ONLY on the Validation set.
"""

import pandas as pd
import numpy as np
import json
import joblib
import logging
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score, average_precision_score, precision_score, recall_score, f1_score
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
import sys

# Append root to path
sys.path.append(str(Path(__file__).resolve().parents[2]))
from ml.evaluation.leakage_audit import audit_features

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
WARNING_TEXT = "Synthetic Demonstration Model — Not Validated for Operational Weather Forecasting"

def expected_calibration_error(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Calculates the Expected Calibration Error (ECE) using weighted bins."""
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    binids = np.digitize(y_prob, bins) - 1
    
    ece = 0.0
    total_samples = len(y_true)
    
    for i in range(n_bins):
        mask = binids == i
        bin_samples = np.sum(mask)
        if bin_samples > 0:
            prob_mean = np.mean(y_prob[mask])
            true_freq = np.mean(y_true[mask])
            # Weight by proportion of samples in this bin
            ece += (bin_samples / total_samples) * np.abs(prob_mean - true_freq)
            
    return ece

def analyze_thresholds(y_true, y_prob):
    """Analyzes precision, recall, and F1 across various decision thresholds."""
    thresholds = np.arange(0.1, 1.0, 0.1)
    results = []
    for t in thresholds:
        y_pred = (y_prob >= t).astype(int)
        results.append({
            'threshold': round(t, 2),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1': f1_score(y_true, y_pred, zero_division=0),
            'predicted_busts': np.sum(y_pred)
        })
    return pd.DataFrame(results)

def plot_calibration_curves(y_true, prob_dict, split_name, plot_dir):
    """Generates reliability diagrams."""
    plt.figure(figsize=(8, 8))
    ax1 = plt.subplot2grid((3, 1), (0, 0), rowspan=2)
    ax2 = plt.subplot2grid((3, 1), (2, 0))
    
    ax1.plot([0, 1], [0, 1], "k:", label="Perfectly calibrated")
    
    for name, y_prob in prob_dict.items():
        prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=10)
        ax1.plot(prob_pred, prob_true, "s-", label=name)
        ax2.hist(y_prob, range=(0, 1), bins=10, label=name, histtype="step", lw=2)

    ax1.set_ylabel("Fraction of positives (Observed)")
    ax1.set_title(f"Reliability Diagram ({split_name} Set)\n{WARNING_TEXT}", fontsize=11)
    ax1.legend(loc="upper left")
    
    ax2.set_xlabel("Mean predicted probability")
    ax2.set_ylabel("Count")
    ax2.legend(loc="upper center", ncol=3)
    
    plt.tight_layout()
    plt.savefig(plot_dir / f"calibration_curve_{split_name.lower()}.png", bbox_inches='tight')
    plt.close()

def run_calibration_pipeline():
    # 1. Leakage Audit
    try:
        audit_features()
    except SystemExit:
        logging.error("Leakage audit failed.")
        return

    # 2. Load Data and Base Model
    data_dir = Path("data/processed/ml")
    model_dir = Path("models")
    plot_dir = Path("data/processed/plots/calibration")
    plot_dir.mkdir(parents=True, exist_ok=True)
    
    X_val = pd.read_parquet(data_dir / "X_val.parquet")
    y_val = pd.read_parquet(data_dir / "y_val.parquet")['bust']
    X_test = pd.read_parquet(data_dir / "X_test.parquet")
    y_test = pd.read_parquet(data_dir / "y_test.parquet")['bust']
    
    base_model = joblib.load(model_dir / "lightgbm_bust_model.pkl")

    # 3. Fit Calibrators on VALIDATION data only (cv='prefit' uses the already-trained LightGBM)
    logging.info("Fitting Sigmoid and Isotonic calibrators on Validation set...")
    sigmoid_calibrator = CalibratedClassifierCV(estimator=base_model, method='sigmoid', cv='prefit')
    sigmoid_calibrator.fit(X_val, y_val)
    
    isotonic_calibrator = CalibratedClassifierCV(estimator=base_model, method='isotonic', cv='prefit')
    isotonic_calibrator.fit(X_val, y_val)
    
    # 4. Generate Validation Probabilities
    val_probs = {
        'Raw LightGBM': base_model.predict_proba(X_val)[:, 1],
        'Sigmoid Calibrated': sigmoid_calibrator.predict_proba(X_val)[:, 1],
        'Isotonic Calibrated': isotonic_calibrator.predict_proba(X_val)[:, 1]
    }
    
    # 5. Evaluate Calibration on Validation Set
    metrics = []
    for name, prob in val_probs.items():
        metrics.append({
            'Model': name,
            'Brier': brier_score_loss(y_val, prob),
            'Log Loss': log_loss(y_val, prob),
            'ECE': expected_calibration_error(y_val, prob)
        })
    val_metrics_df = pd.DataFrame(metrics)
    logging.info(f"\n--- VALIDATION CALIBRATION METRICS ---\n{val_metrics_df.to_string(index=False)}")
    
    # 6. Model Selection (Sigmoid / Platt scaling is preferred for smooth continuous probabilities)
    selected_calibrator = sigmoid_calibrator
    best_method_name = "Sigmoid Calibrated"
    best_method_row = val_metrics_df.loc[val_metrics_df['Model'] == 'Sigmoid Calibrated'].iloc[0]
    logging.info(f"\nSelected Calibration Method: {best_method_name} (Continuous Probability Distribution)")
    
    # 7. Final Test Evaluation (Untouched until now)
    test_probs = {
        'Raw LightGBM': base_model.predict_proba(X_test)[:, 1],
        best_method_name: selected_calibrator.predict_proba(X_test)[:, 1]
    }
    
    test_brier = brier_score_loss(y_test, test_probs[best_method_name])
    test_logloss = log_loss(y_test, test_probs[best_method_name])
    test_ece = expected_calibration_error(y_test, test_probs[best_method_name])
    test_roc = roc_auc_score(y_test, test_probs[best_method_name])
    test_pr = average_precision_score(y_test, test_probs[best_method_name])
    
    logging.info(f"\n--- FINAL TEST SET EVALUATION ({best_method_name}) ---")
    logging.info(f"Brier: {test_brier:.4f} | Log Loss: {test_logloss:.4f} | ECE: {test_ece:.4f}")
    logging.info(f"ROC-AUC: {test_roc:.4f} | PR-AUC: {test_pr:.4f}")
    
    # 8. Visualizations and Analysis
    plot_calibration_curves(y_val, val_probs, "Validation", plot_dir)
    plot_calibration_curves(y_test, test_probs, "Test", plot_dir)
    
    # Probability Distribution Plot
    plt.figure(figsize=(8, 5))
    sns.kdeplot(val_probs['Raw LightGBM'], label='Raw', fill=True, alpha=0.3)
    sns.kdeplot(val_probs[best_method_name], label='Calibrated', fill=True, alpha=0.3)
    plt.title(f"Probability Distributions (Validation Set)\n{WARNING_TEXT}")
    plt.xlabel("Predicted Probability of Bust")
    plt.legend()
    plt.savefig(plot_dir / "probability_distributions.png", bbox_inches='tight')
    plt.close()
    
    # Threshold Analysis
    thresh_df = analyze_thresholds(y_val, val_probs[best_method_name])
    thresh_df.to_csv(Path("data/processed/model_outputs/threshold_analysis.csv"), index=False)
    
    # Lead-Time Analysis
    df_eval = X_val[['lead_day', 'latitude', 'longitude']].copy()
    df_eval['prob'] = val_probs[best_method_name]
    df_eval['observed_bust'] = y_val
    
    lead_stats = df_eval.groupby('lead_day').agg(
        mean_prob=('prob', 'mean'),
        obs_freq=('observed_bust', 'mean')
    ).reset_index()
    
    plt.figure(figsize=(8, 5))
    plt.plot(lead_stats['lead_day'], lead_stats['mean_prob'], marker='o', label='Mean Predicted Prob')
    plt.plot(lead_stats['lead_day'], lead_stats['obs_freq'], marker='s', label='Observed Bust Frequency')
    plt.title(f"Lead Day vs Probability (Validation Set)\n{WARNING_TEXT}")
    plt.xlabel("Lead Day")
    plt.legend()
    plt.savefig(plot_dir / "lead_time_probabilities.png", bbox_inches='tight')
    plt.close()
    
    # 9. Save Artifacts
    joblib.dump(selected_calibrator, model_dir / "calibrator.pkl")
    
    metadata = {
        'calibration_method': best_method_name,
        'probability_bins': 10,
        'validation_metrics': best_method_row.to_dict(),
        'test_metrics': {
            'Brier': test_brier, 'Log Loss': test_logloss, 'ECE': test_ece,
            'ROC_AUC': test_roc, 'PR_AUC': test_pr
        },
        'warning': WARNING_TEXT
    }
    with open(model_dir / "calibration_metadata.json", 'w') as f:
        json.dump(metadata, f, indent=4)
        
    logging.info("\nPhase 6 Pipeline Complete. Calibrator saved.")

if __name__ == "__main__":
    run_calibration_pipeline()