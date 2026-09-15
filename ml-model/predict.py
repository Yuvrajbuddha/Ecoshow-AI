#!/usr/bin/env python3
"""
EcoSort AI - Command-Line Waste Prediction Tool
==============================================
Fulfills Requirements #13, #15, #16, and #17:
- Uses identical canonical preprocessing (`preprocess.py`)
- Loads trained model from `model/best_model.keras`
- Applies validation-calibrated temperature scaling and confidence thresholding
- Falls back safely to "Other/Unknown" if confidence is low
- Returns rich structured JSON with decoupled domain knowledge:
  {
    "detected_item": "Plastic bottle",
    "category": "Plastic",
    "confidence": 94.5,
    "bin": "Dry/Recyclable",
    "recyclable": true,
    "disposal_instruction": "...",
    "sustainability_tip": "..."
  }
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from preprocess import (
    CANONICAL_CLASSES,
    DEFAULT_TARGET_SIZE,
    load_and_preprocess_image,
)
from knowledge_base import get_waste_metadata

MODEL_PATH = BASE_DIR / "model" / "best_model.keras"
CALIBRATION_FILE = BASE_DIR / "model" / "calibration.json"


class WastePredictor:
    def __init__(self, model_path: Path = MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.conf_threshold = 60.0
        self.temperature = 1.0
        self._load_resources()

    def _load_resources(self):
        """Loads trained Keras model and calibration settings."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"[ML] ❌ Trained model not found at '{self.model_path}'.\n"
                f"     Please train the model first by running:\n"
                f"     python train.py"
            )

        try:
            import tensorflow as tf
            from tensorflow import keras
            print(f"[ML] Loading model from {self.model_path}...")
            self.model = keras.models.load_model(str(self.model_path))
            print("[ML] ✅ Model loaded successfully.")
        except Exception as e:
            raise RuntimeError(f"[ML] Failed to load Keras model: {e}")

        if CALIBRATION_FILE.exists():
            try:
                with open(CALIBRATION_FILE, "r", encoding="utf-8") as f:
                    calib = json.load(f)
                    self.conf_threshold = calib.get("confidence_threshold", 60.0)
                    self.temperature = calib.get("temperature", 1.0)
            except Exception:
                pass

    def predict(
        self,
        image_source: Any,
        custom_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes consistent inference on an image and enriches with domain knowledge.
        """
        threshold = custom_threshold if custom_threshold is not None else self.conf_threshold

        print(f"[ML] Image received: {image_source}")
        print(f"[ML] Preprocessing image to canonical {DEFAULT_TARGET_SIZE}...")
        # Canonical preprocessing
        img_arr = load_and_preprocess_image(
            image_source,
            target_size=DEFAULT_TARGET_SIZE,
            preserve_aspect_ratio=True
        )
        batch = np.expand_dims(img_arr, axis=0)

        # Raw model softmax prediction
        print("[ML] Running prediction...")
        raw_probs = self.model.predict(batch, verbose=0)[0]

        # Temperature scaling
        scaled_logits = np.log(np.clip(raw_probs, 1e-7, 1.0)) / self.temperature
        exp_logits = np.exp(scaled_logits - np.max(scaled_logits))
        calibrated_probs = exp_logits / np.sum(exp_logits)

        pred_idx = int(np.argmax(calibrated_probs))
        confidence = float(np.max(calibrated_probs) * 100.0)
        predicted_category = CANONICAL_CLASSES[pred_idx]

        print(f"[ML] Predicted class: {predicted_category.capitalize()}")
        print(f"[ML] Confidence: {confidence:.2f}%")

        # Confidence Threshold Fallback
        if confidence < threshold:
            category_key = "other"
            item_desc = f"Uncertain item (low confidence: {confidence:.1f}%)"
        else:
            category_key = predicted_category
            item_desc = None

        # Retrieve decoupled domain knowledge
        result = get_waste_metadata(
            category_key=category_key,
            confidence=confidence,
            item_description=item_desc
        )

        # Include detailed class probability breakdown
        result["probabilities"] = {
            cls_name: round(float(calibrated_probs[i] * 100.0), 2)
            for i, cls_name in enumerate(CANONICAL_CLASSES)
        }
        result["calibrated_threshold"] = threshold
        result["temperature_applied"] = self.temperature

        return result


def main():
    parser = argparse.ArgumentParser(description="EcoSort AI Single Image Waste Predictor")
    parser.add_argument("image_path", type=str, help="Path to waste photograph")
    parser.add_argument("--threshold", type=float, default=None, help="Confidence cutoff threshold (%)")
    parser.add_argument("--json", action="store_true", help="Print compact JSON only")

    args = parser.parse_args()

    predictor = WastePredictor()
    res = predictor.predict(args.image_path, custom_threshold=args.threshold)

    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print("\n" + "=" * 60)
        print("🌱 ECOSORT AI - DISPOSAL RECOMMENDATION")
        print("=" * 60)
        print(f"Detected Item       : {res['detected_item']}")
        print(f"Visual Category     : {res['category']}")
        print(f"Confidence Score    : {res['confidence']}%")
        print(f"Designated Bin      : {res['bin']}")
        print(f"Curbside Recyclable : {'Yes ✅' if res['recyclable'] else 'No ❌'}")
        print(f"Disposal Guideline  : {res['disposal_instruction']}")
        print(f"Sustainability Tip  : {res['sustainability_tip']}")
        print("=" * 60)


if __name__ == "__main__":
    main()
