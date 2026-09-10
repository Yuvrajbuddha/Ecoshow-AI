#!/usr/bin/env python3
"""
EcoSort AI - Waste Image Classification Model Training Pipeline
==============================================================
Transfer learning pipeline using MobileNetV3Large or EfficientNet-B0
with ImageNet pre-trained weights to classify 9 municipal waste categories:
1. Plastic
2. Paper
3. Cardboard
4. Glass
5. Metal
6. Organic/Wet Waste
7. E-Waste
8. Hazardous Waste
9. Other/Unknown

Pipeline Features:
- 70% Training / 15% Validation / 15% Testing split
- Real-time in-graph data augmentation (rotation, flip, zoom, translation, brightness)
- Class imbalance mitigation with automatic class weights
- Two-stage training: Transfer Learning (frozen base) + Fine-Tuning
- Callbacks: EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
- Loss & accuracy curves auto-generated and saved to disk
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

# Suppress TensorFlow verbose C++ warnings
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, regularizers
    from tensorflow.keras.callbacks import (
        EarlyStopping,
        ModelCheckpoint,
        ReduceLROnPlateau,
    )
except ImportError:
    print("❌ TensorFlow is not installed.")
    print("   Please run: pip install tensorflow")
    sys.exit(1)

# Default configuration constants
BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
MODEL_DIR = BASE_DIR / "model"
RESULTS_DIR = BASE_DIR / "evaluation_results"

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
RANDOM_SEED = 42
NUM_CLASSES = 9

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


def parse_arguments():
    """Parse command-line arguments for training customization."""
    parser = argparse.ArgumentParser(description="Train EcoSort AI Waste Classification Model")
    parser.add_argument(
        "--backbone",
        type=str,
        default="mobilenetv3",
        choices=["mobilenetv3", "efficientnet"],
        help="Base architecture for transfer learning (default: mobilenetv3)",
    )
    parser.add_argument(
        "--epochs-phase1",
        type=int,
        default=12,
        help="Epochs for Phase 1: Train top classification head with frozen backbone",
    )
    parser.add_argument(
        "--epochs-phase2",
        type=int,
        default=12,
        help="Epochs for Phase 2: Fine-tune top layers with lower learning rate",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Training batch size (default: 32)",
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=1e-3,
        help="Initial learning rate for Phase 1 (default: 0.001)",
    )
    parser.add_argument(
        "--fine-tune-lr",
        type=float,
        default=1e-5,
        help="Learning rate for Phase 2 fine-tuning (default: 0.00001)",
    )
    return parser.parse_args()


def load_and_split_datasets(dataset_path, batch_size=32):
    """
    Split the dataset into:
    - 70% Training
    - 15% Validation
    - 15% Testing
    using stratified directory ingestion with deterministic seed.
    """
    print(f"\n📂 Ingesting images from: {dataset_path}")

    # First load all images with a 70/30 train/(val+test) split
    full_train_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_path,
        validation_split=0.30,
        subset="training",
        seed=RANDOM_SEED,
        image_size=IMAGE_SIZE,
        batch_size=batch_size,
        label_mode="categorical",
        shuffle=True,
    )

    val_and_test_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_path,
        validation_split=0.30,
        subset="validation",
        seed=RANDOM_SEED,
        image_size=IMAGE_SIZE,
        batch_size=batch_size,
        label_mode="categorical",
        shuffle=True,
    )

    detected_classes = full_train_ds.class_names
    print(f"✅ Detected {len(detected_classes)} dataset classes: {detected_classes}")

    # Split the 30% holdout evenly into 15% Validation and 15% Testing
    total_val_test_batches = tf.data.experimental.cardinality(val_and_test_ds).numpy()
    val_batches = max(1, total_val_test_batches // 2)

    val_ds = val_and_test_ds.take(val_batches)
    test_ds = val_and_test_ds.skip(val_batches)

    # Save class indices for inference mapping
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    class_indices_path = MODEL_DIR / "class_indices.json"
    with open(class_indices_path, "w") as f:
        json.dump({cls: idx for idx, cls in enumerate(detected_classes)}, f, indent=2)
    print(f"💾 Saved class indices to: {class_indices_path}")

    return full_train_ds, val_ds, test_ds, detected_classes


def build_data_augmentation_layer():
    """
    Construct in-model data augmentation pipeline.
    Simulates real-world smartphone photos:
    - Orientation changes (random rotation & horizontal flips)
    - Camera zoom variations
    - Off-center object placement (translations)
    - Ambient lighting & contrast shifts
    """
    return keras.Sequential(
        [
            layers.RandomFlip("horizontal", name="aug_horizontal_flip"),
            layers.RandomRotation(0.12, fill_mode="nearest", name="aug_rotation"),
            layers.RandomZoom((-0.1, 0.15), fill_mode="nearest", name="aug_zoom"),
            layers.RandomTranslation(0.08, 0.08, fill_mode="nearest", name="aug_translation"),
            layers.RandomContrast(0.12, name="aug_contrast"),
        ],
        name="data_augmentation",
    )


def compute_dataset_class_weights(dataset_path, class_names):
    """
    Compute inverse frequency weights to counteract class imbalance.
    """
    class_counts = []
    for cls in class_names:
        folder = Path(dataset_path) / cls
        count = len([f for f in folder.iterdir() if f.is_file()]) if folder.exists() else 0
        class_counts.append(max(1, count))

    total = sum(class_counts)
    n_classes = len(class_names)
    weights = {}
    for idx, count in enumerate(class_counts):
        weights[idx] = float(round(total / (n_classes * count), 4))

    print("\n⚖️ Class Weight Balancing Factors:")
    for idx, cls in enumerate(class_names):
        print(f"   • {cls.ljust(15)}: count={class_counts[idx]:4d} | weight={weights[idx]:.2f}")

    return weights


def build_transfer_learning_model(backbone_type="mobilenetv3", num_classes=9):
    """
    Construct transfer learning model:
    Input (224, 224, 3)
      ↓
    Data Augmentation
      ↓
    Pre-trained Backbone (ImageNet weights, top removed)
      ↓
    GlobalAveragePooling2D
      ↓
    BatchNormalization
      ↓
    Dense(256, ReLU, L2 Regularization)
      ↓
    Dropout(0.4)
      ↓
    Dense(9, Softmax)
    """
    print(f"\n🏗️ Building Transfer Learning Architecture with '{backbone_type}' backbone...")
    inputs = keras.Input(shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3), name="input_image")

    # 1. In-graph augmentation (active during training only)
    augmentation = build_data_augmentation_layer()
    x = augmentation(inputs)

    # 2. Select pre-trained backbone & appropriate preprocessing
    if backbone_type == "efficientnet":
        x = tf.keras.applications.efficientnet.preprocess_input(x)
        base_model = tf.keras.applications.EfficientNetB0(
            input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3),
            include_top=False,
            weights="imagenet",
        )
    else:
        # Default: MobileNetV3Large (optimized for mobile/edge and low latency)
        x = tf.keras.applications.mobilenet_v3.preprocess_input(x)
        base_model = tf.keras.applications.MobileNetV3Large(
            input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3),
            include_top=False,
            weights="imagenet",
            minimalistic=False,
        )

    # Freeze base model weights for Phase 1
    base_model.trainable = False

    # Connect base model
    x = base_model(x, training=False)

    # 3. Custom classification head
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = layers.BatchNormalization(name="head_batch_norm")(x)
    x = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=regularizers.l2(1e-4),
        name="dense_feature_projection",
    )(x)
    x = layers.Dropout(0.4, name="dropout_regularization")(x)
    outputs = layers.Dense(
        num_classes,
        activation="softmax",
        name="waste_classification_output",
    )(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name=f"EcoSort_{backbone_type}")
    return model, base_model


def plot_and_save_training_curves(history_phase1, history_phase2=None):
    """Plot and save training and validation loss and accuracy curves."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Combine history metrics if Phase 2 was executed
    acc = history_phase1.history.get("accuracy", [])
    val_acc = history_phase1.history.get("val_accuracy", [])
    loss = history_phase1.history.get("loss", [])
    val_loss = history_phase1.history.get("val_loss", [])

    if history_phase2:
        acc = acc + history_phase2.history.get("accuracy", [])
        val_acc = val_acc + history_phase2.history.get("val_accuracy", [])
        loss = loss + history_phase2.history.get("loss", [])
        val_loss = val_loss + history_phase2.history.get("val_loss", [])

    epochs_range = range(1, len(acc) + 1)

    # Plot Accuracy
    plt.figure(figsize=(10, 5))
    plt.plot(epochs_range, acc, label="Training Accuracy", color="#10b981", linewidth=2.5)
    plt.plot(epochs_range, val_acc, label="Validation Accuracy", color="#3b82f6", linewidth=2.5, linestyle="--")
    if history_phase2:
        split_point = len(history_phase1.history.get("accuracy", []))
        plt.axvline(x=split_point, color="#ef4444", linestyle=":", label="Fine-Tuning Start")
    plt.title("EcoSort AI - Training vs. Validation Accuracy", fontsize=14, fontweight="bold")
    plt.xlabel("Epochs", fontsize=12)
    plt.ylabel("Accuracy", fontsize=12)
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend(loc="lower right")
    acc_path = RESULTS_DIR / "accuracy_curve.png"
    plt.tight_layout()
    plt.savefig(acc_path, dpi=200)
    plt.close()

    # Plot Loss
    plt.figure(figsize=(10, 5))
    plt.plot(epochs_range, loss, label="Training Loss", color="#f59e0b", linewidth=2.5)
    plt.plot(epochs_range, val_loss, label="Validation Loss", color="#ef4444", linewidth=2.5, linestyle="--")
    if history_phase2:
        split_point = len(history_phase1.history.get("loss", []))
        plt.axvline(x=split_point, color="#3b82f6", linestyle=":", label="Fine-Tuning Start")
    plt.title("EcoSort AI - Training vs. Validation Loss", fontsize=14, fontweight="bold")
    plt.xlabel("Epochs", fontsize=12)
    plt.ylabel("Cross-Entropy Loss", fontsize=12)
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend(loc="upper right")
    loss_path = RESULTS_DIR / "loss_curve.png"
    plt.tight_layout()
    plt.savefig(loss_path, dpi=200)
    plt.close()

    print(f"📊 Training curves saved to:\n   • {acc_path}\n   • {loss_path}")


def main():
    args = parse_arguments()
    print("=" * 70)
    print("🚀 ECOSORT AI: WASTE IMAGE CLASSIFICATION TRAINING PIPELINE")
    print(f"   • Backbone Architecture: {args.backbone.upper()}")
    print(f"   • Target Classes:        {NUM_CLASSES}")
    print(f"   • Input Dimensions:      {IMAGE_SIZE[0]}x{IMAGE_SIZE[1]} RGB")
    print(f"   • Phase 1 Epochs:        {args.epochs_phase1}")
    print(f"   • Phase 2 Epochs:        {args.epochs_phase2}")
    print("=" * 70)

    # Verify dataset existence
    if not DATASET_DIR.exists():
        print(f"❌ Dataset directory not found at: {DATASET_DIR}")
        print("   Please run 'python prepare_dataset.py --seed-demo-samples' first.")
        sys.exit(1)

    # 1. Ingest and split dataset (70% train / 15% val / 15% test)
    train_ds, val_ds, test_ds, detected_classes = load_and_split_datasets(
        DATASET_DIR, batch_size=args.batch_size
    )

    # 2. Performance optimization: prefetch & cache
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)
    test_ds = test_ds.prefetch(buffer_size=AUTOTUNE)

    # 3. Compute class weights to counteract imbalance
    class_weights = compute_dataset_class_weights(DATASET_DIR, detected_classes)

    # 4. Build Model
    model, base_model = build_transfer_learning_model(
        backbone_type=args.backbone, num_classes=len(detected_classes)
    )
    model.summary()

    # 5. Compile Model for Phase 1 (Frozen Backbone)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=args.learning_rate),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    # Configure Callbacks
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    best_model_path = MODEL_DIR / "best_model.keras"

    callbacks_phase1 = [
        EarlyStopping(
            monitor="val_loss",
            patience=5,
            restore_best_weights=True,
            verbose=1,
        ),
        ModelCheckpoint(
            filepath=str(best_model_path),
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=2,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    print("\n" + "=" * 70)
    print("🎯 PHASE 1: Training Top Classification Head (Backbone Frozen)...")
    print("=" * 70)
    history_phase1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs_phase1,
        class_weight=class_weights,
        callbacks=callbacks_phase1,
    )

    history_phase2 = None
    if args.epochs_phase2 > 0:
        print("\n" + "=" * 70)
        print("🎯 PHASE 2: Fine-Tuning Top Backbone Layers...")
        print("=" * 70)

        # Unfreeze the top layers of the backbone
        base_model.trainable = True
        # Fine-tune the last 35 layers (keeps lower visual primitives stable)
        fine_tune_at = max(0, len(base_model.layers) - 35)
        for layer in base_model.layers[:fine_tune_at]:
            layer.trainable = False

        print(f"🔓 Backbone unlocked from layer {fine_tune_at} to {len(base_model.layers)}")

        # Recompile with very low learning rate to prevent catastrophic forgetting
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=args.fine_tune_lr),
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )

        callbacks_phase2 = [
            EarlyStopping(
                monitor="val_loss",
                patience=5,
                restore_best_weights=True,
                verbose=1,
            ),
            ModelCheckpoint(
                filepath=str(best_model_path),
                monitor="val_accuracy",
                save_best_only=True,
                verbose=1,
            ),
            ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.5,
                patience=2,
                min_lr=1e-7,
                verbose=1,
            ),
        ]

        history_phase2 = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=args.epochs_phase2,
            class_weight=class_weights,
            callbacks=callbacks_phase2,
        )

    # 6. Evaluate on Unseen Holdout Test Dataset (15%)
    print("\n" + "=" * 70)
    print("🧪 EVALUATING ON 15% HOLDOUT TEST DATASET...")
    print("=" * 70)
    test_loss, test_acc = model.evaluate(test_ds, verbose=1)
    print(f"\n🏆 Final Test Results on Unseen Data:")
    print(f"   • Test Accuracy: {test_acc * 100:.2f}%")
    print(f"   • Test Loss:     {test_loss:.4f}")

    # 7. Generate & Save Loss/Accuracy Curve Visualizations
    plot_and_save_training_curves(history_phase1, history_phase2)

    # 8. Save Final Model metadata
    metadata = {
        "backbone": args.backbone,
        "test_accuracy": float(test_acc),
        "test_loss": float(test_loss),
        "classes": detected_classes,
        "image_size": list(IMAGE_SIZE),
        "model_file": str(best_model_path.name),
    }
    with open(MODEL_DIR / "training_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 70)
    print(f"✅ Training completed successfully!")
    print(f"   • Best Model Saved to:     {best_model_path}")
    print(f"   • Run Evaluation Script:   python evaluate.py")
    print(f"   • Run Sample Prediction:   python predict.py <image.jpg>")
    print("=" * 70)


if __name__ == "__main__":
    main()
