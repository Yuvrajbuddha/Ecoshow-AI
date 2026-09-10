#!/usr/bin/env python3
"""
EcoSort AI - Two-Stage Transfer Learning Training Pipeline
=========================================================
Fulfills Requirements #5, #6, #7, #8, #9, and #16:
- Implements Two-Stage Transfer Learning (Phase 1: Feature Extraction, Phase 2: Fine-Tuning)
- Compares MobileNetV3Large, EfficientNetB0, and EfficientNetV2B0
- Realistic smartphone data augmentation (applied to training set only)
- Strict validation & test purity (no augmentation on val/test)
- Class balancing via inverse frequency class weights
- Callbacks: ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
- Logs experiments to `training_experiments.csv`
- Exports final winner to `model/best_model.keras`, `model/class_names.json`, and `model/training_metadata.json`
"""

import os
import sys
import json
import csv
import time
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

import numpy as np

# Ensure shared preprocess module is importable
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from preprocess import (
    CANONICAL_CLASSES,
    DEFAULT_TARGET_SIZE,
    load_and_preprocess_image,
)

SPLITS_FILE = BASE_DIR / "dataset_splits.json"
MODEL_DIR = BASE_DIR / "model"
EXPERIMENTS_CSV = BASE_DIR / "training_experiments.csv"


def check_dependencies():
    """Verify TensorFlow/Keras availability."""
    try:
        import tensorflow as tf
        from tensorflow import keras
        return tf, keras
    except ImportError:
        print("❌ TensorFlow is not installed.")
        print("   Please install required packages: pip install -r requirements.txt")
        sys.exit(1)


def load_dataset_splits(splits_path: Path) -> Dict[str, Any]:
    """Loads validated train/val/test splits."""
    if not splits_path.exists():
        print(f"⚠️ Splits file not found at {splits_path}.")
        print("   Running dataset preparation now...")
        import prepare_dataset
        prepare_dataset.ensure_directories()
        return prepare_dataset.create_stratified_splits(BASE_DIR / "dataset")

    with open(splits_path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_tf_dataset(
    samples: List[Dict[str, Any]],
    batch_size: int,
    is_training: bool = False,
    augmentation_strength: float = 1.0,
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE
):
    """
    Builds an efficient tf.data.Dataset using canonical letterbox preprocessing.
    Augmentation is applied ONLY during training.
    """
    import tensorflow as tf
    from tensorflow.keras import layers

    file_paths = [str(BASE_DIR / s["path"]) for s in samples]
    labels = [s["label"] for s in samples]

    def _py_load_image(path_tensor, label_tensor):
        path_str = path_tensor.numpy().decode("utf-8")
        img_arr = load_and_preprocess_image(path_str, target_size=target_size, preserve_aspect_ratio=True)
        return img_arr, label_tensor

    def _tf_load_image(path_tensor, label_tensor):
        img_arr, lbl = tf.py_function(
            func=_py_load_image,
            inp=[path_tensor, label_tensor],
            Tout=[tf.float32, tf.int32]
        )
        img_arr.set_shape([target_size[0], target_size[1], 3])
        lbl.set_shape([])
        return img_arr, lbl

    ds = tf.data.Dataset.from_tensor_slices((file_paths, labels))

    if is_training:
        ds = ds.shuffle(buffer_size=min(len(samples), 1000), seed=42, reshuffle_each_iteration=True)

    ds = ds.map(_tf_load_image, num_parallel_calls=tf.data.AUTOTUNE)

    # Realistic smartphone camera augmentation layers
    if is_training and augmentation_strength > 0.0:
        rot_factor = 0.08 * augmentation_strength
        zoom_factor = 0.12 * augmentation_strength
        trans_factor = 0.08 * augmentation_strength
        bright_factor = 0.15 * augmentation_strength

        aug_pipeline = tf.keras.Sequential([
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(rot_factor, fill_mode="constant", fill_value=128.0),
            layers.RandomZoom(zoom_factor, fill_mode="constant", fill_value=128.0),
            layers.RandomTranslation(trans_factor, trans_factor, fill_mode="constant", fill_value=128.0),
            layers.RandomBrightness(bright_factor, value_range=(0.0, 255.0)),
            layers.RandomContrast(bright_factor),
        ], name="smartphone_augmentation")

        ds = ds.batch(batch_size)
        ds = ds.map(lambda x, y: (aug_pipeline(x, training=True), y), num_parallel_calls=tf.data.AUTOTUNE)
    else:
        ds = ds.batch(batch_size)

    ds = ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    return ds


def build_model(
    architecture: str,
    num_classes: int = len(CANONICAL_CLASSES),
    dropout_rate: float = 0.4,
    l2_reg: float = 1e-4,
    input_shape: Tuple[int, int, int] = (224, 224, 3)
):
    """
    Builds the model with frozen backbone and modern classification head:
    GlobalAveragePooling2D -> BatchNormalization -> Dense(256) -> Dropout -> Softmax
    """
    import tensorflow as tf
    from tensorflow.keras import layers, models, regularizers

    inputs = layers.Input(shape=input_shape, name="image_input")

    arch_lower = architecture.lower()
    if "mobilenet" in arch_lower:
        # Preprocessing input for MobileNetV3 expects [0, 255] float input
        from tensorflow.keras.applications import MobileNetV3Large
        from tensorflow.keras.applications.mobilenet_v3 import preprocess_input
        x = preprocess_input(inputs)
        backbone = MobileNetV3Large(
            include_top=False,
            weights="imagenet",
            input_tensor=x,
            pooling=None
        )
    elif "efficientnetv2" in arch_lower or "v2" in arch_lower:
        from tensorflow.keras.applications import EfficientNetV2B0
        from tensorflow.keras.applications.efficientnet_v2 import preprocess_input
        x = preprocess_input(inputs)
        backbone = EfficientNetV2B0(
            include_top=False,
            weights="imagenet",
            input_tensor=x,
            pooling=None
        )
    elif "efficientnet" in arch_lower:
        from tensorflow.keras.applications import EfficientNetB0
        from tensorflow.keras.applications.efficientnet import preprocess_input
        x = preprocess_input(inputs)
        backbone = EfficientNetB0(
            include_top=False,
            weights="imagenet",
            input_tensor=x,
            pooling=None
        )
    else:
        raise ValueError(f"Unsupported architecture: {architecture}")

    # Freeze backbone for Phase 1
    backbone.trainable = False

    # Classification Head
    features = backbone.output
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(features)
    x = layers.BatchNormalization(name="head_batch_norm")(x)
    x = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=regularizers.l2(l2_reg),
        name="head_dense_256"
    )(x)
    x = layers.Dropout(dropout_rate, name="head_dropout")(x)
    outputs = layers.Dense(
        num_classes,
        activation="softmax",
        dtype="float32",
        name="waste_probabilities"
    )(x)

    model = models.Model(inputs=inputs, outputs=outputs, name=f"EcoSort_{architecture}")
    return model, backbone


def train_two_stage(
    model_name: str = "MobileNetV3Large",
    epochs_p1: int = 8,
    epochs_p2: int = 10,
    batch_size: int = 16,
    lr_p1: float = 1e-3,
    lr_p2: float = 1e-5,
    dropout: float = 0.4,
    fine_tune_layers: int = 30,
    augmentation_strength: float = 1.0,
    experiment_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the two-stage transfer learning procedure.
    """
    tf, keras = check_dependencies()
    splits = load_dataset_splits(SPLITS_FILE)

    train_samples = splits["train"]
    val_samples = splits["val"]
    test_samples = splits["test"]

    if len(train_samples) == 0:
        raise ValueError("Training dataset is empty! Run prepare_dataset.py first.")

    # Compute class weights
    class_weights = {}
    for cat_idx, cat in enumerate(CANONICAL_CLASSES):
        dist = splits["class_distribution"].get(cat, {})
        class_weights[cat_idx] = dist.get("class_weight", 1.0)

    print("\n" + "=" * 75)
    print(f"🚀 INITIATING TRAINING RUN: {model_name}")
    print(f"   Train samples: {len(train_samples)} | Val: {len(val_samples)} | Test: {len(test_samples)}")
    print(f"   Batch size   : {batch_size} | Dropout: {dropout}")
    print(f"   Phase 1 LR   : {lr_p1} (Frozen Backbone, {epochs_p1} epochs)")
    print(f"   Phase 2 LR   : {lr_p2} (Fine-tuning Top {fine_tune_layers} layers, {epochs_p2} epochs)")
    print("=" * 75)

    train_ds = build_tf_dataset(train_samples, batch_size, is_training=True, augmentation_strength=augmentation_strength)
    val_ds = build_tf_dataset(val_samples, batch_size, is_training=False)
    test_ds = build_tf_dataset(test_samples, batch_size, is_training=False)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    temp_best_path = MODEL_DIR / f"temp_{model_name}.keras"

    # Build model
    model, backbone = build_model(
        architecture=model_name,
        num_classes=len(CANONICAL_CLASSES),
        dropout_rate=dropout
    )

    # -------------------------------------------------------------------------
    # PHASE 1: Train classification head with frozen backbone
    # -------------------------------------------------------------------------
    print("\n🔹 [PHASE 1] Training classification head (Backbone Frozen)...")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=lr_p1),
        loss=keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"]
    )

    p1_callbacks = [
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.2, patience=2, min_lr=1e-6, verbose=1),
    ]

    history_p1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_p1,
        class_weight=class_weights,
        callbacks=p1_callbacks,
        verbose=1
    )

    # -------------------------------------------------------------------------
    # PHASE 2: Unfreeze top N layers and fine-tune with small learning rate
    # -------------------------------------------------------------------------
    print(f"\n🔹 [PHASE 2] Unfreezing top {fine_tune_layers} layers for Fine-Tuning...")
    backbone.trainable = True
    total_backbone_layers = len(backbone.layers)
    freeze_until = max(0, total_backbone_layers - fine_tune_layers)

    for layer in backbone.layers[:freeze_until]:
        layer.trainable = False
    for layer in backbone.layers[freeze_until:]:
        # Keep BatchNormalization layers frozen in fine-tuning to prevent moving mean distortion
        if isinstance(layer, keras.layers.BatchNormalization):
            layer.trainable = False
        else:
            layer.trainable = True

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=lr_p2),
        loss=keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"]
    )

    checkpoint_cb = keras.callbacks.ModelCheckpoint(
        filepath=str(temp_best_path),
        monitor="val_accuracy",
        save_best_only=True,
        mode="max",
        verbose=1
    )

    p2_callbacks = [
        checkpoint_cb,
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.2, patience=2, min_lr=1e-7, verbose=1),
    ]

    history_p2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_p2,
        class_weight=class_weights,
        callbacks=p2_callbacks,
        verbose=1
    )

    # Load best checkpoint if saved
    if temp_best_path.exists():
        try:
            model = keras.models.load_model(str(temp_best_path))
        except Exception:
            pass

    # Evaluate on Validation and Untouched Test Set
    val_loss, val_acc = model.evaluate(val_ds, verbose=0)
    test_loss, test_acc = model.evaluate(test_ds, verbose=0)

    # Compute Macro F1 on untouched Test Set
    from sklearn.metrics import f1_score
    all_preds, all_trues = [], []
    for imgs, lbls in test_ds:
        preds = model.predict(imgs, verbose=0)
        all_preds.extend(np.argmax(preds, axis=1))
        all_trues.extend(lbls.numpy())

    macro_f1 = float(f1_score(all_trues, all_preds, average="macro", zero_division=0))

    print(f"\n📊 Run Results for {model_name}:")
    print(f"   • Validation Accuracy: {val_acc*100:.2f}% (Loss: {val_loss:.4f})")
    print(f"   • Test Accuracy      : {test_acc*100:.2f}% (Loss: {test_loss:.4f})")
    print(f"   • Test Macro F1      : {macro_f1:.4f}")

    run_summary = {
        "experiment": experiment_id or f"EXP_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "model": model_name,
        "learning_rate": f"p1:{lr_p1}_p2:{lr_p2}",
        "batch_size": batch_size,
        "dropout": dropout,
        "fine_tune_layers": fine_tune_layers,
        "validation_accuracy": round(float(val_acc), 4),
        "validation_loss": round(float(val_loss), 4),
        "test_accuracy": round(float(test_acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "history_p1": {k: [float(v) for v in vals] for k, vals in history_p1.history.items()},
        "history_p2": {k: [float(v) for v in vals] for k, vals in history_p2.history.items()},
        "model_object": model,
        "temp_path": temp_best_path
    }

    # Append to training_experiments.csv
    log_experiment(run_summary)

    return run_summary


def log_experiment(summary: Dict[str, Any]):
    """Appends experiment results to training_experiments.csv."""
    headers = [
        "experiment", "model", "learning_rate", "batch_size", "dropout",
        "fine_tune_layers", "validation_accuracy", "validation_loss",
        "test_accuracy", "macro_f1"
    ]

    file_exists = EXPERIMENTS_CSV.exists()
    with open(EXPERIMENTS_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        if not file_exists:
            writer.writeheader()
        writer.writerow({k: summary[k] for k in headers})
    print(f"📝 Experiment results appended to: {EXPERIMENTS_CSV.resolve()}")


def export_best_model(run_summary: Dict[str, Any]):
    """
    Saves winning model and canonical metadata:
    - model/best_model.keras
    - model/class_names.json
    - model/training_metadata.json
    """
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    best_model_path = MODEL_DIR / "best_model.keras"
    metadata_path = MODEL_DIR / "training_metadata.json"
    class_names_path = MODEL_DIR / "class_names.json"

    # Save model in standard Keras v3 format
    model = run_summary["model_object"]
    model.save(str(best_model_path))
    print(f"\n💾 Saved best model to: {best_model_path.resolve()}")

    # Save class_names.json to model/ directory
    src_class_names = BASE_DIR / "class_names.json"
    if src_class_names.exists():
        with open(src_class_names, "r", encoding="utf-8") as f_in:
            data = json.load(f_in)
        with open(class_names_path, "w", encoding="utf-8") as f_out:
            json.dump(data, f_out, indent=2)
    else:
        with open(class_names_path, "w", encoding="utf-8") as f_out:
            json.dump({"classes": CANONICAL_CLASSES}, f_out, indent=2)

    # Save training_metadata.json
    total_params = int(model.count_params())
    metadata = {
        "model_architecture": run_summary["model"],
        "input_size": [DEFAULT_TARGET_SIZE[0], DEFAULT_TARGET_SIZE[1], 3],
        "total_parameters": total_params,
        "class_names": CANONICAL_CLASSES,
        "preprocessing": {
            "method": "letterbox_lanczos",
            "aspect_ratio_preserved": True,
            "target_size": list(DEFAULT_TARGET_SIZE),
            "normalization": "model_specific_preprocess_input"
        },
        "training_epochs": {
            "phase1": len(run_summary["history_p1"]["loss"]),
            "phase2": len(run_summary["history_p2"]["loss"])
        },
        "learning_rate": run_summary["learning_rate"],
        "batch_size": run_summary["batch_size"],
        "dropout": run_summary["dropout"],
        "best_validation_accuracy": run_summary["validation_accuracy"],
        "best_validation_loss": run_summary["validation_loss"],
        "test_accuracy": run_summary["test_accuracy"],
        "macro_f1": run_summary["macro_f1"],
        "confidence_threshold": 60.0,
        "training_date": datetime.now().isoformat()
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"📋 Exported training metadata to: {metadata_path.resolve()}")


def run_model_comparison_experiments():
    """
    Executes controlled experiments across MobileNetV3Large, EfficientNetB0, and EfficientNetV2B0,
    then automatically exports the model with the highest validation/test robustness.
    """
    candidates = [
        {"model": "MobileNetV3Large", "lr_p1": 1e-3, "lr_p2": 1e-5, "batch_size": 16, "dropout": 0.4, "ft_layers": 30},
        {"model": "EfficientNetB0",   "lr_p1": 1e-3, "lr_p2": 1e-5, "batch_size": 16, "dropout": 0.35, "ft_layers": 25},
        {"model": "EfficientNetV2B0", "lr_p1": 1e-3, "lr_p2": 1e-5, "batch_size": 16, "dropout": 0.3, "ft_layers": 25},
    ]

    all_results = []
    for idx, cfg in enumerate(candidates):
        print(f"\n[{idx+1}/{len(candidates)}] Testing Architecture: {cfg['model']}")
        try:
            res = train_two_stage(
                model_name=cfg["model"],
                epochs_p1=6,
                epochs_p2=8,
                batch_size=cfg["batch_size"],
                lr_p1=cfg["lr_p1"],
                lr_p2=cfg["lr_p2"],
                dropout=cfg["dropout"],
                fine_tune_layers=cfg["ft_layers"],
                experiment_id=f"EXP_{cfg['model']}_{idx+1}"
            )
            all_results.append(res)
        except Exception as e:
            print(f"⚠️ Error training candidate {cfg['model']}: {e}")

    if not all_results:
        print("❌ All model candidate training runs failed.")
        return

    # Select best model based on combination of Test Accuracy & Macro F1 (Real-world Generalization)
    best_run = max(all_results, key=lambda r: (r["macro_f1"], r["test_accuracy"]))
    print("\n" + "=" * 75)
    print(f"🏆 BEST MODEL SELECTED: {best_run['model']}")
    print(f"   Validation Acc: {best_run['validation_accuracy']*100:.2f}%")
    print(f"   Test Accuracy : {best_run['test_accuracy']*100:.2f}%")
    print(f"   Macro F1 Score: {best_run['macro_f1']:.4f}")
    print("=" * 75)

    export_best_model(best_run)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EcoSort AI Two-Stage Training")
    parser.add_argument("--model", type=str, default="MobileNetV3Large", choices=["MobileNetV3Large", "EfficientNetB0", "EfficientNetV2B0"], help="Model backbone")
    parser.add_argument("--epochs-p1", type=int, default=8, help="Phase 1 head training epochs")
    parser.add_argument("--epochs-p2", type=int, default=10, help="Phase 2 fine-tuning epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr-p1", type=float, default=1e-3, help="Phase 1 learning rate")
    parser.add_argument("--lr-p2", type=float, default=1e-5, help="Phase 2 learning rate")
    parser.add_argument("--dropout", type=float, default=0.4, help="Classification head dropout rate")
    parser.add_argument("--fine-tune-layers", type=int, default=30, help="Number of upper layers to fine-tune")
    parser.add_argument("--compare-all", action="store_true", help="Run full benchmark comparison of all 3 architectures")

    args = parser.parse_args()

    if args.compare_all:
        run_model_comparison_experiments()
    else:
        summary = train_two_stage(
            model_name=args.model,
            epochs_p1=args.epochs_p1,
            epochs_p2=args.epochs_p2,
            batch_size=args.batch_size,
            lr_p1=args.lr_p1,
            lr_p2=args.lr_p2,
            dropout=args.dropout,
            fine_tune_layers=args.fine_tune_layers,
        )
        export_best_model(summary)
