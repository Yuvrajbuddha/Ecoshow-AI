#!/usr/bin/env python3
"""
EcoSort AI - Model Evaluation & Diagnostic Analysis
===================================================
Generates comprehensive performance metrics on the 15% holdout test dataset:
- Overall Test Accuracy & Loss
- Precision, Recall, and F1-Score per category
- Confusion Matrix Heatmap (True vs. Predicted)
- Per-Class Accuracy breakdown
- Generates publication-quality charts in 'evaluation_results/'
"""

import os
import sys
import json
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
MODEL_DIR = BASE_DIR / "model"
RESULTS_DIR = BASE_DIR / "evaluation_results"
MODEL_PATH = MODEL_DIR / "best_model.keras"
CLASS_INDICES_PATH = MODEL_DIR / "class_indices.json"
METADATA_PATH = MODEL_DIR / "training_metadata.json"

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
RANDOM_SEED = 42

CLASSES = [
    "plastic",
    "paper",
    "cardboard",
    "glass",
    "metal",
    "organic",
    "e_waste",
    "hazardous",
    "other",
]


def load_test_dataset(dataset_path):
    """Load the exact 15% test holdout using deterministic seeding."""
    import tensorflow as tf

    val_and_test_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_path,
        validation_split=0.30,
        subset="validation",
        seed=RANDOM_SEED,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        shuffle=False,
    )

    total_val_test_batches = tf.data.experimental.cardinality(val_and_test_ds).numpy()
    val_batches = max(1, total_val_test_batches // 2)
    test_ds = val_and_test_ds.skip(val_batches)

    return test_ds, val_and_test_ds.class_names


def plot_confusion_matrix(cm, class_names, output_path):
    """Plot high-contrast normalized confusion matrix heatmap."""
    # Normalize confusion matrix by true class count (recall per class)
    with np.errstate(divide="ignore", invalid="ignore"):
        cm_normalized = cm.astype("float") / cm.sum(axis=1)[:, np.newaxis]
        cm_normalized = np.nan_to_num(cm_normalized)

    fig, ax = plt.subplots(figsize=(10, 8))
    im = ax.imshow(cm_normalized, interpolation="nearest", cmap="Blues")
    cbar = ax.figure.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.set_ylabel("Normalized Proportion", rotation=-90, va="bottom", fontsize=11)

    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=class_names,
        yticklabels=class_names,
        title="EcoSort AI: Test Set Confusion Matrix (Normalized)",
        ylabel="True Ground Truth Category",
        xlabel="Predicted Classification",
    )
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    # Annotate with counts and percentages
    threshold = cm_normalized.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = cm_normalized[i, j]
            count = cm[i, j]
            color = "white" if val > threshold else "black"
            text = f"{count}\n({val*100:.0f}%)" if count > 0 else "0"
            ax.text(j, i, text, ha="center", va="center", color=color, fontsize=9, fontweight="bold")

    fig.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()
    print(f"📊 Confusion Matrix plot saved to: {output_path}")


def plot_per_class_accuracy(per_class_acc, class_names, output_path):
    """Plot per-class accuracy bar chart."""
    fig, ax = plt.subplots(figsize=(11, 5))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444", "#f97316", "#64748b"]

    bars = ax.bar(class_names, [acc * 100 for acc in per_class_acc], color=colors[: len(class_names)], edgecolor="#1e293b", linewidth=1.2)
    ax.set_ylabel("Test Accuracy (%)", fontsize=12, fontweight="bold")
    ax.set_title("EcoSort AI: Per-Class Accuracy on 15% Holdout Test Dataset", fontsize=14, fontweight="bold")
    ax.set_ylim(0, 105)
    ax.grid(axis="y", linestyle="--", alpha=0.7)
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")

    for bar in bars:
        height = bar.get_height()
        ax.annotate(
            f"{height:.1f}%",
            xy=(bar.get_x() + bar.get_width() / 2, height),
            xytext=(0, 4),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=10,
            fontweight="bold",
        )

    fig.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()
    print(f"📊 Per-Class Accuracy plot saved to: {output_path}")


def main():
    print("=" * 75)
    print("🔬 ECOSORT AI: MODEL EVALUATION & METRICS GENERATOR")
    print("=" * 75)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Check if trained model exists
    if not MODEL_PATH.exists():
        print(f"⚠️ No trained model found at: {MODEL_PATH}")
        print("   To train a real model first:")
        print("   1. python prepare_dataset.py --seed-demo-samples")
        print("   2. python train.py --epochs-phase1 5 --epochs-phase2 5")
        sys.exit(1)

    import tensorflow as tf
    from sklearn.metrics import classification_report, confusion_matrix

    print(f"📦 Loading best model from: {MODEL_PATH}")
    model = tf.keras.models.load_model(str(MODEL_PATH))

    # Load class names
    if CLASS_INDICES_PATH.exists():
        with open(CLASS_INDICES_PATH) as f:
            class_indices = json.load(f)
            class_names = list(class_indices.keys())
    else:
        class_names = CLASSES

    print(f"🔍 Classes in model: {class_names}")

    # Load test dataset
    print(f"📂 Evaluating on test dataset in: {DATASET_DIR}")
    test_ds, _ = load_test_dataset(DATASET_DIR)

    # Accumulate ground truth and predictions
    y_true_indices = []
    y_pred_indices = []
    y_pred_probs = []

    print("⏳ Running inference over test batches...")
    for images, labels in test_ds:
        preds = model.predict(images, verbose=0)
        y_true_indices.extend(np.argmax(labels.numpy(), axis=1))
        y_pred_indices.extend(np.argmax(preds, axis=1))
        y_pred_probs.extend(preds)

    y_true = np.array(y_true_indices)
    y_pred = np.array(y_pred_indices)

    if len(y_true) == 0:
        print("❌ Test dataset contains 0 images.")
        return

    # Overall Test Accuracy
    overall_acc = float(np.mean(y_true == y_pred))
    print("\n" + "=" * 75)
    print(f"🏆 OVERALL TEST ACCURACY: {overall_acc * 100:.2f}% ({np.sum(y_true == y_pred)} / {len(y_true)} correct)")
    print("=" * 75)

    # Classification Report (Precision, Recall, F1)
    report_dict = classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )
    report_text = classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        zero_division=0,
    )

    print("\n📋 DETAILED CLASSIFICATION REPORT:")
    print(report_text)

    # Save classification report
    with open(RESULTS_DIR / "classification_report.txt", "w") as f:
        f.write(report_text)
    with open(RESULTS_DIR / "classification_report.json", "w") as f:
        json.dump(report_dict, f, indent=2)

    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=range(len(class_names)))
    cm_path = RESULTS_DIR / "confusion_matrix.png"
    plot_confusion_matrix(cm, class_names, cm_path)

    # Per-Class Accuracy
    per_class_acc = []
    print("\n🎯 PER-CLASS ACCURACY BREAKDOWN:")
    for idx, cls in enumerate(class_names):
        cls_mask = y_true == idx
        total_in_class = np.sum(cls_mask)
        if total_in_class > 0:
            correct_in_class = np.sum((y_pred == idx) & cls_mask)
            acc = correct_in_class / total_in_class
        else:
            acc = 0.0
        per_class_acc.append(acc)
        print(f"   • {cls.ljust(15)}: {acc * 100:6.2f}% ({np.sum((y_pred == idx) & cls_mask)}/{total_in_class})")

    per_class_path = RESULTS_DIR / "per_class_accuracy.png"
    plot_per_class_accuracy(per_class_acc, class_names, per_class_path)

    # Final summary payload
    summary = {
        "overall_test_accuracy": round(overall_acc * 100, 2),
        "total_test_samples": len(y_true),
        "per_class_accuracy": {class_names[i]: round(per_class_acc[i] * 100, 2) for i in range(len(class_names))},
        "classification_metrics": report_dict,
    }
    with open(RESULTS_DIR / "evaluation_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 75)
    print("✅ All evaluation artifacts generated:")
    print(f"   • Summary JSON:          {RESULTS_DIR / 'evaluation_summary.json'}")
    print(f"   • Classification Report: {RESULTS_DIR / 'classification_report.txt'}")
    print(f"   • Confusion Matrix:      {cm_path}")
    print(f"   • Per-Class Accuracy:    {per_class_path}")
    print("=" * 75)


if __name__ == "__main__":
    main()
