#!/usr/bin/env python3
"""
EcoSort AI - Single Image Waste Classification Predictor
========================================================
Usage:
    python predict.py <path_to_image.jpg> [--threshold 60.0]

Returns structured waste segregation guidance:
- detected_item
- category
- confidence (percentage)
- bin
- recyclable (boolean)
- disposal_instruction
- sustainability_tip

Enforces strict confidence thresholding (default 60%):
If model confidence is under 60%, safely defaults to 'Other/Unknown'
to prevent dangerous contamination of recycling/compost streams.
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np

# Suppress TensorFlow verbose logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "best_model.keras"
CLASS_METADATA_PATH = BASE_DIR / "class_names.json"
CLASS_INDICES_PATH = BASE_DIR / "model" / "class_indices.json"
IMAGE_SIZE = (224, 224)
DEFAULT_CONFIDENCE_THRESHOLD = 60.0  # 60 percent threshold


def load_model_and_metadata():
    """Load trained Keras model and class metadata."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Trained model not found at '{MODEL_PATH}'.\n"
            "Please train the model first using:\n"
            "  python prepare_dataset.py --seed-demo-samples\n"
            "  python train.py"
        )

    import tensorflow as tf

    model = tf.keras.models.load_model(str(MODEL_PATH))

    # Load class display and segregation metadata
    if not CLASS_METADATA_PATH.exists():
        raise FileNotFoundError(f"Class metadata not found at '{CLASS_METADATA_PATH}'")

    with open(CLASS_METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    # Load class indices order
    if CLASS_INDICES_PATH.exists():
        with open(CLASS_INDICES_PATH, "r", encoding="utf-8") as f:
            class_indices = json.load(f)
            # Sort keys by index
            class_list = [k for k, v in sorted(class_indices.items(), key=lambda item: item[1])]
    else:
        class_list = metadata.get("classes", [
            "plastic", "paper", "cardboard", "glass", "metal",
            "organic", "e_waste", "hazardous", "other"
        ])

    return model, metadata, class_list


def preprocess_image(image_path):
    """Load and preprocess image to match model input dimensions."""
    from PIL import Image
    import tensorflow as tf

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file does not exist: {image_path}")

    # Open image, convert to RGB (removes alpha channel or grayscale)
    img = Image.open(image_path).convert("RGB")
    img = img.resize(IMAGE_SIZE, Image.Resampling.BILINEAR)

    # Convert to array (224, 224, 3)
    img_array = np.array(img, dtype=np.float32)

    # Add batch dimension: (1, 224, 224, 3)
    batch_array = np.expand_dims(img_array, axis=0)

    # Note: Preprocessing (e.g. mobilenet_v3.preprocess_input or rescaling)
    # is embedded in the Keras model architecture layer built in train.py.
    return batch_array, img


def predict_waste(image_path, confidence_threshold=60.0):
    """
    Classify the waste image and format the response according to EcoSort AI standards.
    """
    model, metadata, class_list = load_model_and_metadata()
    batch_array, _ = preprocess_image(image_path)

    # Run inference
    predictions = model.predict(batch_array, verbose=0)[0]

    top_idx = int(np.argmax(predictions))
    top_confidence = float(predictions[top_idx] * 100.0)
    raw_class_key = class_list[top_idx]

    category_info = metadata["categories"].get(raw_class_key, {})
    display_category = category_info.get("display_name", raw_class_key.title())

    # Confidence Threshold Rule:
    # If confidence is below threshold (e.g. 60%), safely fall back to 'Other/Unknown'
    if top_confidence < confidence_threshold:
        fallback_info = metadata["categories"].get("other", {})
        return {
            "detected_item": "Uncertain / Unidentified waste item",
            "category": "Other/Unknown",
            "confidence": round(top_confidence, 1),
            "bin": fallback_info.get("bin", "General Waste / Landfill Residual"),
            "recyclable": False,
            "disposal_instruction": (
                f"Confidence ({top_confidence:.1f}%) is below the {confidence_threshold:.0f}% certainty threshold. "
                "Visually verify the item markings or dispose of in general household waste to avoid stream contamination."
            ),
            "sustainability_tip": (
                "Ensure photos are well-lit, centered on the object, and free from heavy background clutter "
                "to improve classification accuracy."
            ),
            "low_confidence_fallback": True,
            "provisional_prediction": display_category,
        }

    # High Confidence Match
    return {
        "detected_item": category_info.get("detected_item_default", f"{display_category} waste item"),
        "category": display_category,
        "confidence": round(top_confidence, 1),
        "bin": category_info.get("bin", "Check Local Sorting Guidelines"),
        "recyclable": bool(category_info.get("recyclable", False)),
        "disposal_instruction": category_info.get(
            "disposal_instruction",
            "Deposit into designated recycling or waste bin after standard preparation."
        ),
        "sustainability_tip": category_info.get(
            "sustainability_tip",
            "Proper segregation prevents contamination and conserves finite circular resources."
        ),
    }


def main():
    parser = argparse.ArgumentParser(description="Classify waste image with EcoSort AI model")
    parser.add_argument("image_path", type=str, help="Path to waste image file (.jpg, .png, .webp)")
    parser.add_argument(
        "--threshold",
        type=float,
        default=DEFAULT_CONFIDENCE_THRESHOLD,
        help=f"Confidence threshold percentage (default: {DEFAULT_CONFIDENCE_THRESHOLD}%%)",
    )
    args = parser.parse_args()

    try:
        result = predict_waste(args.image_path, confidence_threshold=args.threshold)
        # Output clean JSON matching the user requirement
        print(json.dumps(result, indent=2))
    except Exception as err:
        print(json.dumps({"error": str(err)}, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
