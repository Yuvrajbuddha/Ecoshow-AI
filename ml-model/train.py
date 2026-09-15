#!/usr/bin/env python3
"""
EcoSort AI - Transfer Learning Training Pipeline (MobileNetV3Large)
===================================================================
Implements the end-to-end model training pipeline:
1. Loads dataset from the `dataset/` folder (70% Train, 15% Val, 15% Test split).
2. Applies configured smartphone camera data augmentation (on training set ONLY).
3. Calculates class weights from `dataset_metadata.json` / inverse class frequencies.
4. Performs two-phase transfer learning with MobileNetV3Large:
   - Phase 1: Frozen backbone, feature extraction with custom classification head (Adam lr=1e-3).
   - Phase 2: Unfreezes top layers for fine-tuning with low learning rate (Adam lr=1e-5).
5. Uses EarlyStopping, ReduceLROnPlateau, and ModelCheckpoint callbacks.
6. Saves the winning model and comprehensive metadata to `model/`:
   - `model/best_model.keras`
   - `model/training_metadata.json`
   - `model/class_names.json`
   - `model/class_mapping.json`
"""

import os
import sys
import json
import csv
import time
import argparse
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Canonical class list
CANONICAL_CLASSES = [
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
DEFAULT_TARGET_SIZE = (224, 224)


def resolve_paths(
    dataset_arg: Optional[str] = None,
    metadata_arg: Optional[str] = None,
    model_arg: Optional[str] = None
) -> Tuple[Path, Path, Path]:
    """Resolves dataset, metadata, and model output paths gracefully."""
    # 1. Dataset Directory
    if dataset_arg:
        dataset_dir = Path(dataset_arg).resolve()
    elif (BASE_DIR / "dataset").exists():
        dataset_dir = BASE_DIR / "dataset"
    elif (BASE_DIR.parent / "dataset").exists():
        dataset_dir = BASE_DIR.parent / "dataset"
    else:
        dataset_dir = BASE_DIR / "dataset"

    # 2. Metadata Spec File
    if metadata_arg:
        metadata_file = Path(metadata_arg).resolve()
    elif (BASE_DIR / "dataset_metadata.json").exists():
        metadata_file = BASE_DIR / "dataset_metadata.json"
    elif (BASE_DIR.parent / "dataset_metadata.json").exists():
        metadata_file = BASE_DIR.parent / "dataset_metadata.json"
    else:
        metadata_file = BASE_DIR / "dataset_metadata.json"

    # 3. Model Output Directory
    if model_arg:
        model_dir = Path(model_arg).resolve()
    else:
        model_dir = BASE_DIR / "model"

    return dataset_dir, metadata_file, model_dir


def check_dependencies():
    """Verify TensorFlow, Keras, NumPy, and Pillow availability."""
    missing = []
    try:
        import numpy as np
    except ImportError:
        missing.append("numpy")
    try:
        from PIL import Image
    except ImportError:
        missing.append("pillow")
    try:
        import tensorflow as tf
        from tensorflow import keras
    except ImportError:
        missing.append("tensorflow")

    if missing:
        print(f"❌ Missing required machine learning packages: {', '.join(missing)}")
        print("   Please install requirements by running:")
        print("   pip install -r ml-model/requirements.txt")
        sys.exit(1)

    return tf, keras


def load_dataset_metadata_spec(metadata_path: Path) -> Dict[str, Any]:
    """Loads dataset specifications from dataset_metadata.json."""
    if metadata_path.exists():
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                spec = json.load(f)
                print(f"📋 Loaded dataset specifications from: {metadata_path.name}")
                return spec
        except Exception as e:
            print(f"⚠️ Warning loading {metadata_path}: {e}")

    # Canonical default specification
    return {
        "dataset_name": "EcoSort AI Real Waste Image Dataset",
        "random_seed": 42,
        "num_classes": len(CANONICAL_CLASSES),
        "classes": CANONICAL_CLASSES,
        "split_ratios": {
            "train": 0.70,
            "val": 0.15,
            "test": 0.15
        }
    }


def scan_and_split_dataset(
    dataset_dir: Path,
    metadata_spec: Dict[str, Any]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Scans the `dataset/` folder and creates a stratified 70/15/15 train/val/test split.
    Checks `dataset_splits.json` first for reproducibility.
    """
    import random
    import numpy as np

    splits_file = dataset_dir.parent / "dataset_splits.json"
    if not splits_file.exists():
        splits_file = BASE_DIR / "dataset_splits.json"

    if splits_file.exists():
        try:
            with open(splits_file, "r", encoding="utf-8") as f:
                splits = json.load(f)
                if "train" in splits and "val" in splits and "test" in splits:
                    print(f"✅ Loaded verified dataset splits from: {splits_file.name}")
                    print(f"   • Train: {len(splits['train'])} | Val: {len(splits['val'])} | Test: {len(splits['test'])}")
                    for split_key in ["train", "val", "test"]:
                        for item in splits[split_key]:
                            item_path = Path(item["path"])
                            if not item_path.is_absolute():
                                if (dataset_dir.parent / item_path).exists():
                                    item["path"] = str(dataset_dir.parent / item_path)
                                elif (BASE_DIR / item_path).exists():
                                    item["path"] = str(BASE_DIR / item_path)
                                elif (dataset_dir / item_path.name).exists():
                                    item["path"] = str(dataset_dir / item_path.name)
                    return splits
        except Exception as e:
            print(f"⚠️ Could not load splits file ({e}), scanning dataset directory directly...")

    print(f"\n📂 Scanning images in dataset directory: {dataset_dir.resolve()}...")
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found at: {dataset_dir}")

    seed = metadata_spec.get("random_seed", 42)
    random.seed(seed)
    np.random.seed(seed)

    ratios = metadata_spec.get("split_ratios", {"train": 0.70, "val": 0.15, "test": 0.15})
    train_ratio = ratios.get("train", 0.70)
    val_ratio = ratios.get("val", 0.15)

    valid_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    class_to_idx = {name: idx for idx, name in enumerate(CANONICAL_CLASSES)}

    splits: Dict[str, List[Dict[str, Any]]] = {"train": [], "val": [], "test": []}
    category_items: Dict[str, List[Dict[str, Any]]] = {cls_name: [] for cls_name in CANONICAL_CLASSES}

    for cat_dir in sorted(dataset_dir.iterdir()):
        if not cat_dir.is_dir() or cat_dir.name.startswith("_") or cat_dir.name.startswith("."):
            continue

        raw_name = cat_dir.name.lower().replace("-", "_").replace(" ", "_")
        canonical_cat = None
        for c in CANONICAL_CLASSES:
            if c == raw_name or c in raw_name or raw_name in c:
                canonical_cat = c
                break

        if not canonical_cat:
            canonical_cat = "other"

        cat_idx = class_to_idx[canonical_cat]

        for img_path in sorted(cat_dir.iterdir()):
            if img_path.suffix.lower() in valid_exts:
                category_items[canonical_cat].append({
                    "path": str(img_path.resolve()),
                    "filename": img_path.name,
                    "category": canonical_cat,
                    "label": cat_idx
                })

    for cat_name, items in category_items.items():
        random.shuffle(items)
        n = len(items)
        if n == 0:
            continue
        n_train = max(1, int(n * train_ratio))
        n_val = max(1, int(n * val_ratio))
        if n_train + n_val >= n and n > 2:
            n_train = n - 2
            n_val = 1

        train_part = items[:n_train]
        val_part = items[n_train:n_train + n_val]
        test_part = items[n_train + n_val:]

        splits["train"].extend(train_part)
        splits["val"].extend(val_part)
        splits["test"].extend(test_part)

    print(f"📊 Dataset Stratification Complete (Seed {seed}):")
    print(f"   • Train: {len(splits['train'])} samples ({train_ratio*100:.0f}%)")
    print(f"   • Val  : {len(splits['val'])} samples ({val_ratio*100:.0f}%)")
    print(f"   • Test : {len(splits['test'])} samples ({100 - (train_ratio+val_ratio)*100:.0f}%)")

    return splits


def compute_class_weights(
    train_samples: List[Dict[str, Any]],
    metadata_spec: Dict[str, Any]
) -> Dict[int, float]:
    """
    Calculates balanced class weights from `dataset_metadata.json` and training set frequencies:
    W_c = N_total / (N_classes * N_c)
    """
    counts = Counter(s.get("category", "") for s in train_samples)
    total_train = len(train_samples)
    num_classes = len(CANONICAL_CLASSES)
    spec_weights = metadata_spec.get("class_weights", {})

    class_weights: Dict[int, float] = {}
    print("\n⚖️ Class Weights (Balanced via dataset_metadata.json / Inverse Frequencies):")

    for idx, cls_name in enumerate(CANONICAL_CLASSES):
        cnt = counts.get(cls_name, 0)
        if cnt > 0:
            weight = total_train / (num_classes * cnt)
        elif cls_name in spec_weights:
            weight = float(spec_weights[cls_name])
        else:
            weight = 1.0

        weight = float(round(weight, 4))
        class_weights[idx] = weight
        print(f"   • [{idx}] {cls_name:<12}: count={cnt:>4} | weight={weight:.4f}")

    return class_weights


def build_augmentation_pipeline(augmentation_strength: float = 1.0):
    """
    Builds smartphone camera data augmentation layers.
    Applied exclusively during Phase 1 & 2 training (validation/test are untouched).
    """
    import tensorflow as tf
    from tensorflow.keras import layers

    rot_factor = 0.08 * augmentation_strength
    zoom_factor = 0.12 * augmentation_strength
    trans_factor = 0.08 * augmentation_strength

    aug_layers = [
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(rot_factor, fill_mode="constant", fill_value=128.0),
        layers.RandomZoom(zoom_factor, fill_mode="constant", fill_value=128.0),
        layers.RandomTranslation(trans_factor, trans_factor, fill_mode="constant", fill_value=128.0),
    ]

    if hasattr(layers, "RandomBrightness"):
        aug_layers.append(layers.RandomBrightness(0.12 * augmentation_strength, value_range=(0.0, 255.0)))
    if hasattr(layers, "RandomContrast"):
        aug_layers.append(layers.RandomContrast(0.12 * augmentation_strength))

    return tf.keras.Sequential(aug_layers, name="smartphone_camera_augmentation")


def load_image_with_letterbox(path_str: str, target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE):
    """Loads image and applies aspect-ratio preserving letterbox padding."""
    from PIL import Image
    try:
        with Image.open(path_str) as img:
            img = img.convert("RGB")
            target_w, target_h = target_size
            img_w, img_h = img.size
            if img_w <= 0 or img_h <= 0:
                raise ValueError("Zero dimension image")
            scale = min(target_w / img_w, target_h / img_h)
            new_w = max(1, int(img_w * scale))
            new_h = max(1, int(img_h * scale))
            resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (target_w, target_h), (128, 128, 128))
            paste_x = (target_w - new_w) // 2
            paste_y = (target_h - new_h) // 2
            canvas.paste(resized, (paste_x, paste_y))
            import numpy as np
            return np.array(canvas, dtype=np.float32)
    except Exception:
        import numpy as np
        return np.full((target_size[0], target_size[1], 3), 128.0, dtype=np.float32)


def create_tf_dataset(
    samples: List[Dict[str, Any]],
    batch_size: int,
    is_training: bool = False,
    augmentation_strength: float = 1.0,
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE
):
    """Creates a tf.data.Dataset pipeline."""
    import tensorflow as tf

    file_paths = [s["path"] for s in samples]
    labels = [s["label"] for s in samples]

    def _py_load(path_tensor, label_tensor):
        p_str = path_tensor.numpy().decode("utf-8")
        arr = load_image_with_letterbox(p_str, target_size=target_size)
        return arr, label_tensor

    def _tf_load(path_tensor, label_tensor):
        img_arr, lbl = tf.py_function(
            func=_py_load,
            inp=[path_tensor, label_tensor],
            Tout=[tf.float32, tf.int32]
        )
        img_arr.set_shape([target_size[0], target_size[1], 3])
        lbl.set_shape([])
        return img_arr, lbl

    ds = tf.data.Dataset.from_tensor_slices((file_paths, labels))

    if is_training:
        ds = ds.shuffle(buffer_size=min(len(samples), 1000), seed=42, reshuffle_each_iteration=True)

    ds = ds.map(_tf_load, num_parallel_calls=tf.data.AUTOTUNE)

    if is_training and augmentation_strength > 0.0:
        aug_pipeline = build_augmentation_pipeline(augmentation_strength)
        ds = ds.batch(batch_size)
        ds = ds.map(lambda x, y: (aug_pipeline(x, training=True), y), num_parallel_calls=tf.data.AUTOTUNE)
    else:
        ds = ds.batch(batch_size)

    ds = ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    return ds


def build_mobilenet_v3_large_model(
    num_classes: int = len(CANONICAL_CLASSES),
    dropout_rate: float = 0.4,
    input_shape: Tuple[int, int, int] = (224, 224, 3)
):
    """
    Builds the MobileNetV3Large model with custom classification head.
    Phase 1 initializes with the pre-trained ImageNet backbone frozen.
    """
    from tensorflow.keras import layers, models, regularizers
    from tensorflow.keras.applications import MobileNetV3Large
    from tensorflow.keras.applications.mobilenet_v3 import preprocess_input

    inputs = layers.Input(shape=input_shape, name="image_input")
    x = preprocess_input(inputs)

    backbone = MobileNetV3Large(
        include_top=False,
        weights="imagenet",
        input_tensor=x,
        pooling=None
    )

    # Freeze backbone initially for Phase 1
    backbone.trainable = False

    # Classification Head
    features = backbone.output
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(features)
    x = layers.BatchNormalization(name="head_batch_norm")(x)
    x = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=regularizers.l2(1e-4),
        name="head_dense_256"
    )(x)
    x = layers.Dropout(dropout_rate, name="head_dropout")(x)
    outputs = layers.Dense(
        num_classes,
        activation="softmax",
        dtype="float32",
        name="waste_probabilities"
    )(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="EcoSort_MobileNetV3Large")
    return model, backbone


def train_pipeline(
    dataset_dir: Path,
    metadata_file: Path,
    model_dir: Path,
    epochs_p1: int = 8,
    epochs_p2: int = 10,
    batch_size: int = 16,
    lr_p1: float = 1e-3,
    lr_p2: float = 1e-5,
    dropout: float = 0.4,
    fine_tune_layers: int = 30,
    augmentation_strength: float = 1.0,
) -> Dict[str, Any]:
    """
    Executes the two-phase transfer learning workflow:
    - Phase 1: Feature Extraction with frozen backbone (Adam lr=1e-3)
    - Phase 2: Fine-Tuning top layers (Adam lr=1e-5)
    - Callbacks: EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
    - Saves model and metadata to model_dir (`model/`)
    """
    tf, keras = check_dependencies()
    import numpy as np

    metadata_spec = load_dataset_metadata_spec(metadata_file)
    splits = scan_and_split_dataset(dataset_dir, metadata_spec)

    train_samples = splits["train"]
    val_samples = splits["val"]
    test_samples = splits["test"]

    if len(train_samples) == 0:
        raise ValueError(f"No training samples found in {dataset_dir}!")

    class_weights = compute_class_weights(train_samples, metadata_spec)

    print("\n" + "=" * 78)
    print("🚀 ECO-SORT AI: TWO-PHASE TRANSFER LEARNING (MobileNetV3Large)")
    print(f"   Dataset Dir   : {dataset_dir.resolve()}")
    print(f"   Output Dir    : {model_dir.resolve()}")
    print(f"   Train samples : {len(train_samples)} | Val: {len(val_samples)} | Test: {len(test_samples)}")
    print(f"   Batch Size    : {batch_size} | Head Dropout: {dropout}")
    print(f"   Phase 1 (Head): LR={lr_p1} | Max Epochs={epochs_p1}")
    print(f"   Phase 2 (Tune): LR={lr_p2} | Fine-tune Top {fine_tune_layers} layers | Max Epochs={epochs_p2}")
    print("=" * 78)

    train_ds = create_tf_dataset(train_samples, batch_size, is_training=True, augmentation_strength=augmentation_strength)
    val_ds = create_tf_dataset(val_samples, batch_size, is_training=False)
    test_ds = create_tf_dataset(test_samples, batch_size, is_training=False)

    model_dir.mkdir(parents=True, exist_ok=True)
    temp_ckpt_path = model_dir / "temp_best_checkpoint.keras"

    model, backbone = build_mobilenet_v3_large_model(
        num_classes=len(CANONICAL_CLASSES),
        dropout_rate=dropout
    )

    # -------------------------------------------------------------------------
    # PHASE 1: Feature Extraction (Backbone Frozen)
    # -------------------------------------------------------------------------
    print("\n🔹 [PHASE 1] Training classification head (Backbone Frozen)...")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=lr_p1),
        loss=keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"]
    )

    p1_early_stopping = keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=4,
        restore_best_weights=True,
        verbose=1
    )
    p1_lr_reducer = keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.2,
        patience=2,
        min_lr=1e-6,
        verbose=1
    )

    history_p1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_p1,
        class_weight=class_weights,
        callbacks=[p1_early_stopping, p1_lr_reducer],
        verbose=1
    )

    # -------------------------------------------------------------------------
    # PHASE 2: Fine-Tuning (Unfreeze Top Layers)
    # -------------------------------------------------------------------------
    print(f"\n🔹 [PHASE 2] Unfreezing top {fine_tune_layers} layers for Fine-Tuning...")
    backbone.trainable = True
    total_backbone_layers = len(backbone.layers)
    freeze_until = max(0, total_backbone_layers - fine_tune_layers)

    for layer in backbone.layers[:freeze_until]:
        layer.trainable = False
    for layer in backbone.layers[freeze_until:]:
        # Keep BatchNormalization layers frozen during fine-tuning
        if isinstance(layer, keras.layers.BatchNormalization):
            layer.trainable = False
        else:
            layer.trainable = True

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=lr_p2),
        loss=keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"]
    )

    # ModelCheckpoint to capture peak validation accuracy
    p2_model_checkpoint = keras.callbacks.ModelCheckpoint(
        filepath=str(temp_ckpt_path),
        monitor="val_accuracy",
        save_best_only=True,
        mode="max",
        verbose=1
    )

    # EarlyStopping on validation loss to prevent overfitting
    p2_early_stopping = keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True,
        verbose=1
    )

    p2_lr_reducer = keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.2,
        patience=2,
        min_lr=1e-7,
        verbose=1
    )

    history_p2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_p2,
        class_weight=class_weights,
        callbacks=[p2_model_checkpoint, p2_early_stopping, p2_lr_reducer],
        verbose=1
    )

    # Restore best checkpoint if saved
    if temp_ckpt_path.exists():
        try:
            model = keras.models.load_model(str(temp_ckpt_path))
            print(f"✅ Restored best checkpoint weights from: {temp_ckpt_path.name}")
        except Exception:
            pass

    # Evaluate on Validation and Untouched Test Set
    val_loss, val_acc = model.evaluate(val_ds, verbose=0)
    test_loss, test_acc = model.evaluate(test_ds, verbose=0)

    macro_f1 = 0.0
    try:
        from sklearn.metrics import f1_score
        y_true = []
        y_pred = []
        for x_batch, y_batch in test_ds:
            preds = model.predict(x_batch, verbose=0)
            y_pred.extend(np.argmax(preds, axis=-1).tolist())
            y_true.extend(y_batch.numpy().tolist())
        macro_f1 = float(f1_score(y_true, y_pred, average="macro"))
    except Exception:
        macro_f1 = float(test_acc)

    print("\n" + "=" * 78)
    print("🏁 TRAINING COMPLETED SUCCESSFULLY")
    print(f"   Validation Accuracy : {val_acc * 100:.2f}% | Loss: {val_loss:.4f}")
    print(f"   Test Accuracy       : {test_acc * 100:.2f}% | Loss: {test_loss:.4f}")
    print(f"   Test Macro F1-Score : {macro_f1:.4f}")
    print("=" * 78)

    # -------------------------------------------------------------------------
    # EXPORT WINNING MODEL & METADATA TO model/
    # -------------------------------------------------------------------------
    best_model_path = model_dir / "best_model.keras"
    metadata_path = model_dir / "training_metadata.json"
    class_names_path = model_dir / "class_names.json"
    class_mapping_path = model_dir / "class_mapping.json"

    model.save(str(best_model_path))
    print(f"\n💾 Saved trained model to: {best_model_path.resolve()}")

    with open(class_names_path, "w", encoding="utf-8") as f:
        json.dump(CANONICAL_CLASSES, f, indent=2)
    print(f"📋 Saved class names to: {class_names_path.resolve()}")

    mapping_data = {
        "classes": CANONICAL_CLASSES,
        "id_to_class": {str(i): cls_name for i, cls_name in enumerate(CANONICAL_CLASSES)},
        "class_to_id": {cls_name: i for i, cls_name in enumerate(CANONICAL_CLASSES)},
        "num_classes": len(CANONICAL_CLASSES)
    }
    with open(class_mapping_path, "w", encoding="utf-8") as f:
        json.dump(mapping_data, f, indent=2)
    print(f"📋 Saved class mapping to: {class_mapping_path.resolve()}")

    total_params = int(model.count_params())
    trainable_params = int(sum(np.prod(w.shape) for w in model.trainable_weights))
    non_trainable_params = total_params - trainable_params

    training_metadata = {
        "model_name": "EcoSort AI",
        "model_architecture": "MobileNetV3Large",
        "input_size": [DEFAULT_TARGET_SIZE[0], DEFAULT_TARGET_SIZE[1], 3],
        "total_parameters": total_params,
        "trainable_parameters": trainable_params,
        "non_trainable_parameters": non_trainable_params,
        "class_names": CANONICAL_CLASSES,
        "class_mapping": mapping_data["class_to_id"],
        "class_weights": {CANONICAL_CLASSES[k]: v for k, v in class_weights.items()},
        "dataset_split": {
            "ratios": metadata_spec.get("split_ratios", {"train": 0.70, "val": 0.15, "test": 0.15}),
            "random_seed": metadata_spec.get("random_seed", 42),
            "counts": {
                "train": len(train_samples),
                "val": len(val_samples),
                "test": len(test_samples)
            }
        },
        "training_epochs": {
            "phase1": len(history_p1.history.get("loss", [])),
            "phase2": len(history_p2.history.get("loss", []))
        },
        "learning_rates": {
            "phase1": lr_p1,
            "phase2": lr_p2
        },
        "batch_size": batch_size,
        "dropout": dropout,
        "validation_accuracy": float(val_acc),
        "validation_loss": float(val_loss),
        "test_accuracy": float(test_acc),
        "test_loss": float(test_loss),
        "macro_f1": float(macro_f1),
        "confidence_threshold": 60.0,
        "training_date": datetime.now().isoformat()
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(training_metadata, f, indent=2)
    print(f"📋 Saved training metadata to: {metadata_path.resolve()}")

    # Clean temporary checkpoint
    if temp_ckpt_path.exists():
        try:
            temp_ckpt_path.unlink()
        except Exception:
            pass

    # Also mirror artifacts to models/ directory for backwards-compatibility
    alt_dirs = [BASE_DIR / "models"]
    for alt_dir in alt_dirs:
        if alt_dir.resolve() != model_dir.resolve():
            alt_dir.mkdir(parents=True, exist_ok=True)
            for src in [best_model_path, metadata_path, class_names_path, class_mapping_path]:
                try:
                    shutil.copy2(src, alt_dir / src.name)
                except Exception:
                    pass

    return training_metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EcoSort AI Two-Phase Transfer Learning (MobileNetV3Large)")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Path to dataset/ directory")
    parser.add_argument("--metadata", type=str, default=None, help="Path to dataset_metadata.json")
    parser.add_argument("--model-dir", type=str, default=None, help="Directory to save final model/ (default: model/)")
    parser.add_argument("--epochs-p1", type=int, default=8, help="Phase 1 head epochs (default: 8)")
    parser.add_argument("--epochs-p2", type=int, default=10, help="Phase 2 fine-tuning epochs (default: 10)")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size (default: 16)")
    parser.add_argument("--lr-p1", type=float, default=1e-3, help="Phase 1 learning rate (default: 1e-3)")
    parser.add_argument("--lr-p2", type=float, default=1e-5, help="Phase 2 learning rate (default: 1e-5)")
    parser.add_argument("--dropout", type=float, default=0.4, help="Dropout rate (default: 0.4)")
    parser.add_argument("--fine-tune-layers", type=int, default=30, help="Number of top layers to unfreeze (default: 30)")
    parser.add_argument("--strength", type=float, default=1.0, help="Augmentation strength multiplier (default: 1.0)")

    args = parser.parse_args()

    ds_dir, meta_file, mdl_dir = resolve_paths(args.dataset_dir, args.metadata, args.model_dir)

    train_pipeline(
        dataset_dir=ds_dir,
        metadata_file=meta_file,
        model_dir=mdl_dir,
        epochs_p1=args.epochs_p1,
        epochs_p2=args.epochs_p2,
        batch_size=args.batch_size,
        lr_p1=args.lr_p1,
        lr_p2=args.lr_p2,
        dropout=args.dropout,
        fine_tune_layers=args.fine_tune_layers,
        augmentation_strength=args.strength
    )
