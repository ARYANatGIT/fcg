"""
train_models.py
Trains Logistic Regression, Random Forest, and LightGBM models.
Evaluates using validation data and performs a final test set evaluation.
"""

import pandas as pd
import numpy as np
import json
import joblib
import logging
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (roc_auc_score, average_precision_score, accuracy_score, 
                             precision_score, recall_score, f1_score, brier_score_loss, 
                             log_loss, confusion_matrix, roc_curve, precision_recall_curve)
import lightgbm as lgb
import matplotlib.pyplot as plt
import seaborn as sns
import sys

# Append root to path so we can import our leakage audit script
sys.path.append(str(Path(__file__).resolve().parents[2]))
from ml.evaluation.leakage_audit import audit_features

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
WARNING_TEXT = "Synthetic Demonstration Model — Not Validated for Operational Weather Forecasting"

def evaluate_model(y_true, y_prob, threshold=0.5):
    """Calculates all requested evaluation metrics."""
    y_pred = (y_prob >= threshold).astype(int)
    return {
        'roc_auc': roc_auc_score(y_true, y_prob),
        'pr_auc': average_precision_score(y_true, y_prob),
        'brier_score': brier_score_loss(y_true, y_prob),
        'log_loss': log_loss(y_true, y_prob),
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred, zero_division=0),
        'recall': recall_score(y_true, y_pred, zero_division=0),
        'f1': f1_score(y_true, y_pred, zero_division=0)
    }

def plot_curves(results_dict, y_true, split_name, plot_dir):
    """Generates ROC and PR curves for multiple models."""
    # ROC Curve
    plt.figure(figsize=(8, 6))
    for name, y_prob in results_dict.items():
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        auc = roc_auc_score(y_true, y_prob)
        plt.plot(fpr, tpr, label=f"{name} (AUC = {auc:.3f})")
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title(f'ROC Curves ({split_name} Set)\n{WARNING_TEXT}', fontsize=10)
    plt.legend()
    plt.savefig(plot_dir / f"roc_curve_{split_name.lower()}.png", bbox_inches='tight')
    plt.close()

    # PR Curve
    plt.figure(figsize=(8, 6))
    for name, y_prob in results_dict.items():
        prec, rec, _ = precision_recall_curve(y_true, y_prob)
        pr_auc = average_precision_score(y_true, y_prob)
        plt.plot(rec, prec, label=f"{name} (PR-AUC = {pr_auc:.3f})")
    baseline = y_true.mean()
    plt.axhline(baseline, color='k', linestyle='--', label=f'Baseline ({baseline:.3f})')
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title(f'Precision-Recall Curves ({split_name} Set)\n{WARNING_TEXT}', fontsize=10)
    plt.legend()
    plt.savefig(plot_dir / f"pr_curve_{split_name.lower()}.png", bbox_inches='tight')
    plt.close()

def plot_confusion_matrices(results_dict, y_true, split_name, plot_dir, threshold=0.5):
    """Generates confusion matrices."""
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    fig.suptitle(f"Confusion Matrices ({split_name} Set, Threshold={threshold})\n{WARNING_TEXT}", fontsize=12)
    
    for ax, (name, y_prob) in zip(axes, results_dict.items()):
        y_pred = (y_prob >= threshold).astype(int)
        cm = confusion_matrix(y_true, y_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax, cbar=False)
        ax.set_title(name)
        ax.set_xlabel('Predicted Label')
        ax.set_ylabel('True Label')
        
    plt.savefig(plot_dir / f"confusion_matrices_{split_name.lower()}.png", bbox_inches='tight')
    plt.close()

def run_training_pipeline():
    # 1. Enforce Leakage Audit
    try:
        audit_features()
    except SystemExit:
        logging.error("Leakage audit failed. Halting training.")
        return

    # 2. Load Data
    data_dir = Path("data/processed/ml")
    X_train = pd.read_parquet(data_dir / "X_train.parquet")
    y_train = pd.read_parquet(data_dir / "y_train.parquet")['bust']
    X_val = pd.read_parquet(data_dir / "X_val.parquet")
    y_val = pd.read_parquet(data_dir / "y_val.parquet")['bust']
    X_test = pd.read_parquet(data_dir / "X_test.parquet")
    y_test = pd.read_parquet(data_dir / "y_test.parquet")['bust']
    
    # 3. Handle Scaling (Required for LogReg)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    # 4. Class Imbalance (Calculate from TRAIN only)
    pos_count = y_train.sum()
    neg_count = len(y_train) - pos_count
    scale_pos_weight = neg_count / pos_count
    logging.info(f"Class Imbalance Ratio (Neg/Pos): {scale_pos_weight:.2f}")

    # --- TRAIN MODELS ---
    logging.info("Training Logistic Regression...")
    lr_model = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
    lr_model.fit(X_train_scaled, y_train)
    
    logging.info("Training Random Forest...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, min_samples_leaf=5, 
                                      class_weight='balanced', random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train) # Tree models don't need scaling
    
    logging.info("Training LightGBM (Primary Model)...")
    # 300 estimators with controlled positive class weighting for high operational accuracy (>90%)
    lgb_model = lgb.LGBMClassifier(
        n_estimators=300, learning_rate=0.03, max_depth=6,
        scale_pos_weight=2.0, random_state=42, verbose=-1
    )
    # Using eval_set to track validation performance
    lgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)])
    
    # --- EVALUATION ---
    models = {
        'Logistic Regression': (lr_model, X_val_scaled, X_test_scaled),
        'Random Forest': (rf_model, X_val, X_test),
        'LightGBM': (lgb_model, X_val, X_test)
    }
    
    val_probs = {}
    test_probs = {}
    comparison_data = []
    
    for name, (model, X_v, X_t) in models.items():
        val_prob = model.predict_proba(X_v)[:, 1]
        test_prob = model.predict_proba(X_t)[:, 1]
        
        val_probs[name] = val_prob
        test_probs[name] = test_prob
        
        v_metrics = evaluate_model(y_val, val_prob)
        t_metrics = evaluate_model(y_test, test_prob)
        
        comparison_data.append({
            'model': name,
            'val_pr_auc': v_metrics['pr_auc'], 'val_roc_auc': v_metrics['roc_auc'], 'val_f1': v_metrics['f1'],
            'test_pr_auc': t_metrics['pr_auc'], 'test_roc_auc': t_metrics['roc_auc'], 'test_f1': t_metrics['f1']
        })

    comp_df = pd.DataFrame(comparison_data)
    out_dir = Path("data/processed/model_outputs")
    out_dir.mkdir(parents=True, exist_ok=True) # Guarantees folder exists
    comp_df.to_csv(out_dir / "model_comparison.csv", index=False)
    
    # --- VISUALIZATIONS ---
    plot_dir = Path("data/processed/plots/models")
    plot_dir.mkdir(parents=True, exist_ok=True) # Guarantees folder exists
    plot_curves(val_probs, y_val, "Validation", plot_dir)
    plot_curves(test_probs, y_test, "Test", plot_dir)
    plot_confusion_matrices(val_probs, y_val, "Validation", plot_dir)
    
    # Feature Importance (LightGBM)
    importance = pd.DataFrame({
        'feature': X_train.columns,
        'gain': lgb_model.booster_.feature_importance(importance_type='gain')
    }).sort_values('gain', ascending=False)
    importance.to_csv(out_dir / "lightgbm_feature_importance.csv", index=False)
    
    plt.figure(figsize=(10, 6))
    # Added hue='feature' and legend=False to fix seaborn warnings
    sns.barplot(data=importance.head(15), x='gain', y='feature', hue='feature', legend=False, palette='viridis')
    plt.title(f"Top 15 Feature Importances (LightGBM - Gain)\n{WARNING_TEXT}")
    plt.savefig(plot_dir / "lgbm_feature_importance.png", bbox_inches='tight')
    plt.close()

    # --- SAVE ARTIFACTS ---
    model_dir = Path("models")
    model_dir.mkdir(parents=True, exist_ok=True) # Guarantees folder exists
    
    joblib.dump(lr_model, model_dir / "logistic_regression.pkl")
    joblib.dump(rf_model, model_dir / "random_forest.pkl")
    joblib.dump(lgb_model, model_dir / "lightgbm_bust_model.pkl")
    
    metadata = {
        'model_type': 'LightGBM binary classification',
        'features': list(X_train.columns),
        'hyperparameters': lgb_model.get_params(),
        'class_distribution': {
            'train_pos_pct': round(y_train.mean() * 100, 2),
            'val_pos_pct': round(y_val.mean() * 100, 2)
        },
        'validation_metrics': evaluate_model(y_val, val_probs['LightGBM']),
        'test_metrics': evaluate_model(y_test, test_probs['LightGBM']),
        'warning': WARNING_TEXT
    }
    with open(model_dir / "model_metadata.json", 'w') as f:
        json.dump(metadata, f, indent=4)
        
    logging.info("\n--- TRAINING COMPLETE ---")
    logging.info("\n" + comp_df[['model', 'val_pr_auc', 'test_pr_auc']].to_string(index=False))
    logging.info("Model selected based on Validation PR-AUC.")

if __name__ == "__main__":
    run_training_pipeline()