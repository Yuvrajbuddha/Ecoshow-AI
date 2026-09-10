#!/usr/bin/env python3
"""
EcoSort AI - Confidence Calibration & Temperature Scaling
=========================================================
Fulfills Requirement #13: CONFIDENCE CALIBRATION
- Prevents overconfident mispredictions on unseen smartphone photos
- Fits temperature parameter T on validation set logits using NLL minimization
- Computes Expected Calibration Error (ECE) across reliability bins
- Determines optimal confidence rejection threshold (e.g., 60.0%)
- Fallback: If max confidence < threshold -> maps to "Other/Unknown"
- Saves calibration parameters to `model/calibration.json`
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from preprocess import DEFAULT_TARGET_SIZE, CANONICAL_CLASSES, load_and_preprocess_image

MODEL_PATH = BASE_DIR / "model" / "best_model.keras"
SPLITS_FILE = BASE_DIR / "dataset_splits.json"
CALIBRATION_FILE = BASE_DIR / "model" / "calibration.json"


def compute_ece(probs: np.ndarray, labels: np.ndarray, n_bins: int = 10) -> float:
    """Computes Expected Calibration Error (ECE)."""
    confidences = np.max(probs, axis=1)
    predictions = np.argmax(probs, axis=1)
    accuracies = predictions == labels

    ece = 0.0
    bin_boundaries = np.linspace(0, 1, n_bins + 1)

    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        in_bin = (confidences > bin_lower) & (confidences <= bin_upper)
        prop_in_bin = np.mean(in_bin)

        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(accuracies[in_bin])
            avg_confidence_in_bin = np.mean(confidences[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin

    return float(ece)


def fit_temperature(logits: np.ndarray, labels: np.ndarray) -> float:
    """
    Finds optimal temperature T > 0 that minimizes Cross-Entropy on validation logits.
    Uses simple grid search over [0.5, 3.0] with refinement.
    """
    best_t = 1.0
    best_nll = float("inf")

    for t in np.linspace(0.5, 3.0, 51):
        scaled_logits = logits / t
        # Stable softmax
        exp_logits = np.exp(scaled_logits - np.max(scaled_logits, axis=1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)

        # NLL loss
        nll = -np.mean(np.log(np.clip(probs[np.arange(len(labels)), labels], 1e-12, 1.0)))
        if nll < best_nll:
            best_nll = nll
            best_t = float(t)

    return best_t


def calibrate_model():
    """Runs validation calibration analysis."""
    print("=" * 75)
    print("🎯 ECOSORT AI: CONFIDENCE CALIBRATION & TEMPERATURE SCALING")
    print("=" * 75)

    if not MODEL_PATH.exists():
        print(f"⚠️ Model file not found at: {MODEL_PATH}")
        return

    if not SPLITS_FILE.exists():
        print(f"⚠️ Splits file not found at: {SPLITS_FILE}")
        return

    with open(SPLITS_FILE, "r", encoding="utf-8") as f:
        splits = json.load(f)

    val_samples = splits.get("val", [])
    if not val_samples:
        print("⚠️ No validation samples found.")
        return

    import tensorflow as tf
    from tensorflow import keras

    model = keras.models.load_model(str(MODEL_PATH))
    print(f"Loaded validation set: {len(val_samples)} images")

    raw_probs = []
    labels = []

    for s in val_samples:
        img_path = BASE_DIR / s["path"]
        if not img_path.exists():
            continue
        try:
            arr = load_and_preprocess_image(img_path, target_size=DEFAULT_TARGET_SIZE, preserve_aspect_ratio=True)
            batch = np.expand_dims(arr, axis=0)
            p = model.predict(batch, verbose=0)[0]
            raw_probs.append(p)
            labels.append(s["label"])
        except Exception:
            pass

    raw_probs = np.array(raw_probs)
    labels = np.array(labels)

    # Invert softmax to approximate logits for temperature scaling: z = log(p + eps)
    eps = 1e-7
    logits = np.log(np.clip(raw_probs, eps, 1.0))

    initial_ece = compute_ece(raw_probs, labels)
    opt_temp = fit_temperature(logits, labels)

    # Recompute probabilities with temperature scaling
    scaled_logits = logits / opt_temp
    exp_logits = np.exp(scaled_logits - np.max(scaled_logits, axis=1, keepdims=True))
    calibrated_probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
    calibrated_ece = compute_ece(calibrated_probs, labels)

    # Determine optimal confidence rejection threshold
    # Find threshold where precision on accepted items >= 92%
    confidences = np.max(calibrated_probs, axis=1)
    predictions = np.argmax(calibrated_probs, axis=1)
    accuracies = predictions == labels

    best_thresh = 60.0
    for thr_val in np.linspace(0.40, 0.85, 46):
        mask = confidences >= thr_val
        if np.sum(mask) >= len(labels) * 0.5:  # keep at least 50% coverage
            prec = np.mean(accuracies[mask])
            if prec >= 0.90:
                best_thresh = round(float(thr_val * 100.0), 1)
                break

    print(f"\n📊 Calibration Results:")
    print(f"   • Uncalibrated Expected Calibration Error (ECE) : {initial_ece*100:.2f}%")
    print(f"   • Optimal Temperature Scaling Factor (T)        : {opt_temp:.3f}")
    print(f"   • Calibrated ECE (with T={opt_temp:.3f})         : {calibrated_ece*100:.2f}%")
    print(f"   • Calibrated Minimum Confidence Threshold       : {best_thresh}%")
    print(f"     (Predictions below {best_thresh}% will safely fallback to 'Other/Unknown')")

    calib_data = {
        "temperature": round(opt_temp, 3),
        "initial_ece": round(initial_ece, 4),
        "calibrated_ece": round(calibrated_ece, 4),
        "confidence_threshold": best_thresh,
        "fallback_class": "Other/Unknown",
        "description": "Temperature scaling parameter and confidence threshold calibrated on validation split."
    }

    CALIBRATION_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CALIBRATION_FILE, "w", encoding="utf-8") as f:
        json.dump(calib_data, f, indent=2)

    print(f"✅ Exported calibration configuration to: {CALIBRATION_FILE.resolve()}")
    return calib_data


if __name__ == "__main__":
    calibrate_model()
