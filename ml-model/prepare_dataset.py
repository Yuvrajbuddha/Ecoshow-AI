#!/usr/bin/env python3
"""
EcoSort AI - Dataset Preparation, Deduplication & Leakage-Free Splitting
======================================================================
Fulfills Requirements #1, #2, #3, and #4:
1. Audits dataset quality and creates `dataset_report.json`
2. Removes exact and near-duplicates BEFORE splitting to guarantee ZERO data leakage
3. Performs Stratified Split:
   - 70% Training
   - 15% Validation
   - 15% Testing (completely unseen during training)
4. Uses fixed random seed (42) for deterministic, reproducible splits
5. Computes class distribution and balancing weights (inverse class frequency)
6. Exports `dataset_splits.json` for consumption by train.py and evaluate.py
"""

import os
import sys
import json
import random
from pathlib import Path
from typing import Dict, List, Any, Tuple

try:
    import numpy as np
except ImportError:
    np = None

try:
    from PIL import Image
except ImportError:
    Image = None

# Import dataset quality inspector
try:
    from dataset_quality import inspect_dataset, CLASSES
except ImportError:
    from .dataset_quality import inspect_dataset, CLASSES

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
SPLITS_FILE = BASE_DIR / "dataset_splits.json"
REPORT_FILE = BASE_DIR / "dataset_report.json"
RANDOM_SEED = 42


def ensure_directories():
    """Ensure dataset directories for all 9 classes exist."""
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    for category in CLASSES:
        cat_folder = DATASET_DIR / category
        cat_folder.mkdir(parents=True, exist_ok=True)
        gitkeep = cat_folder / ".gitkeep"
        if not any(f.is_file() and not f.name.startswith(".") for f in cat_folder.iterdir()):
            gitkeep.touch(exist_ok=True)


def create_stratified_splits(
    dataset_dir: Path,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = RANDOM_SEED
) -> Dict[str, Any]:
    """
    Splits validated, deduplicated images into train, val, and test partitions.
    Guarantees that exact duplicates and near-duplicates are purged prior to splitting,
    eliminating cross-set data leakage.
    """
    assert abs((train_ratio + val_ratio + test_ratio) - 1.0) < 1e-5, "Ratios must sum to 1.0"
    random.seed(seed)
    if np is not None:
        np.random.seed(seed)

    print("\n" + "=" * 75)
    print(f"🛡️ LEAKAGE-FREE STRATIFIED DATASET SPLIT ({int(train_ratio*100)}% Train / {int(val_ratio*100)}% Val / {int(test_ratio*100)}% Test)")
    print("=" * 75)

    # Step 1: Run thorough dataset quality inspection
    report = inspect_dataset(dataset_dir, report_output_path=REPORT_FILE)

    # Identify files to exclude (invalid, exact duplicates, and near-duplicate partners)
    exclude_paths = set()
    for item in report.get("invalid_images", []):
        exclude_paths.add(item["path"])
    for item in report.get("duplicates", []):
        exclude_paths.add(item["duplicate"])
    for item in report.get("near_duplicates", []):
        # Exclude image_b to prevent near-identical object from landing in test vs train
        exclude_paths.add(item["image_b"])

    print(f"Purging {len(exclude_paths)} duplicate/corrupted instances before partitioning...")

    splits_data: Dict[str, Any] = {
        "metadata": {
            "random_seed": seed,
            "train_ratio": train_ratio,
            "val_ratio": val_ratio,
            "test_ratio": test_ratio,
            "total_clean_samples": 0,
            "classes": CLASSES,
        },
        "class_distribution": {},
        "train": [],
        "val": [],
        "test": []
    }

    total_clean = 0

    for cat_idx, category in enumerate(CLASSES):
        cat_dir = dataset_dir / category
        if not cat_dir.exists():
            continue

        all_files = sorted([
            f for f in cat_dir.iterdir()
            if f.is_file() and not f.name.startswith(".") and f.name != ".gitkeep"
        ])

        # Filter out quarantined / duplicate files
        clean_files = []
        for f in all_files:
            rel = f"{category}/{f.name}"
            if rel not in exclude_paths:
                clean_files.append({
                    "path": str(f.relative_to(BASE_DIR)).replace("\\", "/"),
                    "filename": f.name,
                    "category": category,
                    "label": cat_idx
                })

        # Deterministic shuffle using fixed seed
        random.shuffle(clean_files)

        n = len(clean_files)
        total_clean += n

        if n == 0:
            print(f"⚠️ Class '{category}' has 0 clean images!")
            splits_data["class_distribution"][category] = {
                "total": 0, "train": 0, "val": 0, "test": 0, "class_weight": 1.0
            }
            continue

        n_train = max(1, int(n * train_ratio)) if n >= 3 else n
        n_val = max(1, int(n * val_ratio)) if n >= 3 else 0
        n_test = n - n_train - n_val

        if n_test < 1 and n >= 3:
            n_test = 1
            n_train -= 1

        train_set = clean_files[:n_train]
        val_set = clean_files[n_train:n_train + n_val]
        test_set = clean_files[n_train + n_val:]

        splits_data["train"].extend(train_set)
        splits_data["val"].extend(val_set)
        splits_data["test"].extend(test_set)

        splits_data["class_distribution"][category] = {
            "total": n,
            "train": len(train_set),
            "val": len(val_set),
            "test": len(test_set),
        }

    splits_data["metadata"]["total_clean_samples"] = total_clean

    # Calculate inverse class frequency weights for training
    train_counts = [splits_data["class_distribution"][c]["train"] for c in CLASSES]
    total_train = len(splits_data["train"])
    n_classes = len(CLASSES)

    for c in CLASSES:
        cnt = splits_data["class_distribution"][c]["train"]
        weight = (total_train / (n_classes * cnt)) if cnt > 0 else 1.0
        splits_data["class_distribution"][c]["class_weight"] = round(float(weight), 4)

    # Save to dataset_splits.json
    with open(SPLITS_FILE, "w", encoding="utf-8") as f:
        json.dump(splits_data, f, indent=2)

    train_pct = (len(splits_data['train'])/total_clean*100) if total_clean > 0 else 0.0
    val_pct = (len(splits_data['val'])/total_clean*100) if total_clean > 0 else 0.0
    test_pct = (len(splits_data['test'])/total_clean*100) if total_clean > 0 else 0.0

    print(f"\n✅ Clean Stratified Partitioning Complete!")
    print(f"   • Total Clean Images : {total_clean}")
    print(f"   • Training Samples   : {len(splits_data['train'])} ({train_pct:.1f}%)")
    print(f"   • Validation Samples : {len(splits_data['val'])} ({val_pct:.1f}%)")
    print(f"   • Testing Samples    : {len(splits_data['test'])} ({test_pct:.1f}%) (STRICTLY UNTOUCHED)")
    print(f"   • Split Metadata saved to: {SPLITS_FILE.resolve()}")

    return splits_data


def generate_starter_photographs(samples_per_class: int = 25):
    """
    Generates realistic, varied seed photographs simulating smartphone waste captures
    with varied lighting, angles, aspect ratios, and simulated textures so that
    the full training, evaluation, and test pipeline can run out of the box.
    """
    print(f"\n📸 Generating {samples_per_class} varied starter photographs per class...")
    from PIL import ImageDraw, ImageFilter

    np.random.seed(RANDOM_SEED)
    random.seed(RANDOM_SEED)

    category_palettes = {
        "plastic": [(65, 135, 215), (230, 240, 255), (100, 180, 240), (220, 220, 225)],
        "paper": [(245, 242, 235), (230, 228, 220), (220, 215, 205), (180, 175, 165)],
        "cardboard": [(185, 145, 95), (160, 120, 75), (205, 170, 125), (140, 100, 60)],
        "glass": [(140, 200, 185), (220, 240, 235), (85, 140, 110), (180, 210, 195)],
        "metal": [(180, 185, 190), (215, 220, 225), (130, 135, 140), (240, 240, 245)],
        "organic": [(90, 150, 60), (220, 140, 45), (140, 80, 35), (180, 60, 50)],
        "e_waste": [(40, 45, 50), (30, 80, 60), (70, 75, 80), (190, 170, 80)],
        "hazardous": [(225, 45, 45), (235, 180, 30), (50, 50, 55), (210, 120, 20)],
        "other": [(130, 115, 110), (95, 90, 85), (160, 150, 145), (75, 70, 65)],
    }

    for cat in CLASSES:
        cat_dir = DATASET_DIR / cat
        cat_dir.mkdir(parents=True, exist_ok=True)
        colors = category_palettes[cat]

        for i in range(samples_per_class):
            # Varied smartphone image dimensions
            width = random.choice([480, 512, 640])
            height = random.choice([480, 512, 640])

            # Diverse background lighting (indoor wood table, white tile, outdoor grass/concrete)
            bg_type = random.choice(["table", "concrete", "tile", "dark"])
            if bg_type == "table":
                base_col = (random.randint(180, 210), random.randint(140, 170), random.randint(100, 130))
            elif bg_type == "concrete":
                g = random.randint(150, 190)
                base_col = (g, g, g)
            elif bg_type == "tile":
                g = random.randint(220, 245)
                base_col = (g, g, g)
            else:
                g = random.randint(45, 75)
                base_col = (g, g, g)

            img = Image.new("RGB", (width, height), base_col)
            draw = ImageDraw.Draw(img)

            # Draw background shadows / gradients
            for _ in range(5):
                sx = random.randint(0, width)
                sy = random.randint(0, height)
                sr = random.randint(50, 180)
                draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(base_col[0] - 15, base_col[1] - 15, base_col[2] - 15))

            # Foreground item geometry
            fg_color = random.choice(colors)
            cx, cy = width // 2 + random.randint(-40, 40), height // 2 + random.randint(-40, 40)
            rw, rh = random.randint(80, 160), random.randint(100, 200)

            # Object shadow
            draw.ellipse([cx - rw, cy + rh - 20, cx + rw, cy + rh + 30], fill=(base_col[0] // 2, base_col[1] // 2, base_col[2] // 2))

            # Object shape per category
            if cat in ["plastic", "glass"]:
                # Bottle or jar
                draw.rectangle([cx - rw // 4, cy - rh, cx + rw // 4, cy - rh + 40], fill=fg_color)
                draw.rounded_rectangle([cx - rw // 2, cy - rh + 35, cx + rw // 2, cy + rh], radius=20, fill=fg_color)
            elif cat in ["metal"]:
                # Can
                draw.rectangle([cx - rw // 2, cy - rh, cx + rw // 2, cy + rh], fill=fg_color)
                draw.ellipse([cx - rw // 2, cy - rh - 15, cx + rw // 2, cy - rh + 15], fill=(fg_color[0] + 20, fg_color[1] + 20, fg_color[2] + 20))
            elif cat in ["cardboard", "paper"]:
                # Box or sheet
                draw.rectangle([cx - rw, cy - rh // 2, cx + rw, cy + rh // 2], fill=fg_color)
            elif cat in ["e_waste"]:
                # Board or cable
                draw.rectangle([cx - rw, cy - rh, cx + rw, cy + rh], fill=fg_color)
                for _ in range(6):
                    draw.line([random.randint(cx - rw, cx + rw), cy - rh, random.randint(cx - rw, cx + rw), cy + rh], fill=(210, 190, 70), width=3)
            elif cat in ["hazardous"]:
                # Battery cylinder
                draw.rectangle([cx - rw // 3, cy - rh, cx + rw // 3, cy + rh], fill=fg_color)
                draw.rectangle([cx - rw // 6, cy - rh - 15, cx + rw // 6, cy - rh], fill=(200, 200, 200))
            else:
                # Organic / Other
                draw.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill=fg_color)

            # Subtle sensor noise
            img = img.filter(ImageFilter.SMOOTH_MORE)
            arr = np.array(img, dtype=np.int16)
            noise = np.random.randint(-8, 8, arr.shape)
            arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
            img = Image.fromarray(arr)

            out_name = f"photo_{cat}_{i+1:03d}.jpg"
            img.save(cat_dir / out_name, "JPEG", quality=90)

    print("✅ Starter smartphone photos generated across all 9 classes.")


if __name__ == "__main__":
    ensure_directories()

    # If dataset has no real images, generate seed samples
    has_images = any(
        f.is_file() and not f.name.startswith(".") and f.name != ".gitkeep"
        for cat in CLASSES
        for f in (DATASET_DIR / cat).iterdir()
        if (DATASET_DIR / cat).exists()
    )

    if (not has_images and Image is not None) or ("--seed-samples" in sys.argv and Image is not None):
        generate_starter_photographs(samples_per_class=25)

    create_stratified_splits(DATASET_DIR)
