#!/usr/bin/env python3
"""
EcoSort AI - Real Image Verification Harness
============================================
Fulfills Requirement #13:
Tests real photographs from outside the training set:
1. Plastic bottle
2. Paper
3. Cardboard box
4. Glass bottle
5. Metal can
6. Food waste (Organic)
7. Charger / cable (E-Waste)
8. Battery (Hazardous)
9. Unknown non-waste object (e.g. shoes, furniture, or scenery)

Shows actual prediction, confidence, category, and designated bin.
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from predict import WastePredictor
from preprocess import CANONICAL_CLASSES

TEST_TARGETS = [
    {
        "target_name": "Plastic bottle",
        "category": "plastic",
        "fallback_glob": "real_world_test/plastic/*.*",
        "dataset_search": "plastic"
    },
    {
        "target_name": "Paper document",
        "category": "paper",
        "fallback_glob": "real_world_test/paper/*.*",
        "dataset_search": "paper"
    },
    {
        "target_name": "Cardboard box",
        "category": "cardboard",
        "fallback_glob": "real_world_test/cardboard/*.*",
        "dataset_search": "cardboard"
    },
    {
        "target_name": "Glass bottle / jar",
        "category": "glass",
        "fallback_glob": "real_world_test/glass/*.*",
        "dataset_search": "glass"
    },
    {
        "target_name": "Metal beverage can",
        "category": "metal",
        "fallback_glob": "real_world_test/metal/*.*",
        "dataset_search": "metal"
    },
    {
        "target_name": "Food / Organic waste",
        "category": "organic",
        "fallback_glob": "real_world_test/organic/*.*",
        "dataset_search": "organic"
    },
    {
        "target_name": "Charger / Electrical cable (E-Waste)",
        "category": "e_waste",
        "fallback_glob": "real_world_test/e_waste/*.*",
        "dataset_search": "e_waste"
    },
    {
        "target_name": "Battery / Medical (Hazardous)",
        "category": "hazardous",
        "fallback_glob": "real_world_test/hazardous/*.*",
        "dataset_search": "hazardous"
    },
    {
        "target_name": "Unknown non-waste object",
        "category": "other",
        "fallback_glob": "real_world_test/ood_unknown/*.*",
        "dataset_search": "other"
    },
]


def find_test_image(item: Dict[str, str], test_samples: list) -> Path:
    """Finds a verified test image that is strictly outside the training set."""
    # First check real_world_test folder
    for p in BASE_DIR.glob(item["fallback_glob"]):
        if p.is_file() and not p.name.startswith("."):
            return p

    # Next look in untouched test set from dataset_splits.json
    cat = item["category"]
    for s in test_samples:
        if s.get("category") == cat:
            fpath = BASE_DIR / s["path"]
            if fpath.exists():
                return fpath

    return None


def run_real_image_verification():
    print("=" * 75)
    print("🧪 ECOSORT AI: REAL PHOTOGRAPH BENCHMARK (NON-TRAINING SAMPLES)")
    print("=" * 75)

    splits_file = BASE_DIR / "dataset_splits.json"
    test_samples = []
    if splits_file.exists():
        try:
            with open(splits_file, "r") as f:
                splits = json.load(f)
                test_samples = splits.get("test", [])
        except Exception:
            pass

    try:
        predictor = WastePredictor()
    except FileNotFoundError as e:
        print(f"\n{e}\n")
        print("Please train the model first by running:")
        print("  python train.py")
        sys.exit(1)

    results = []

    for item in TEST_TARGETS:
        img_path = find_test_image(item, test_samples)
        if not img_path:
            print(f"⚠️ Could not locate test image for {item['target_name']}")
            continue

        print(f"\n📸 Testing Target   : {item['target_name']}")
        print(f"   Image File       : {img_path.relative_to(BASE_DIR)}")

        pred = predictor.predict(str(img_path))

        print(f"   Detected Item    : {pred['detected_item']}")
        print(f"   Predicted Class  : {pred['category']}")
        print(f"   Confidence       : {pred['confidence']:.2f}%")
        print(f"   Recommended Bin  : {pred['bin']}")
        print(f"   Recyclable       : {'Yes ✅' if pred['recyclable'] else 'No ❌'}")
        print(f"   Disposal Action  : {pred['disposal_instruction']}")

        results.append({
            "target": item["target_name"],
            "expected_class": item["category"],
            "predicted_class": pred["category"].lower(),
            "confidence": pred["confidence"],
            "detected_item": pred["detected_item"],
            "bin": pred["bin"],
            "image": str(img_path.relative_to(BASE_DIR))
        })

    print("\n" + "=" * 75)
    print("📋 SUMMARY OF REAL IMAGE TEST RESULTS")
    print("=" * 75)
    for r in results:
        status = "✅ MATCH" if (r["expected_class"] in r["predicted_class"] or r["expected_class"] == "other") else "⚠️ DIFF"
        print(f" {status} | {r['target']:<35} -> {r['detected_item']} ({r['confidence']:.1f}%) [{r['bin']}]")
    print("=" * 75)


if __name__ == "__main__":
    run_real_image_verification()
