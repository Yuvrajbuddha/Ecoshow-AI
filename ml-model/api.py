#!/usr/bin/env python3
"""
EcoSort AI - Production FastAPI Inference Microservice
=====================================================
Fulfills Requirements #13, #15, #16, and #17:
- Serves the trained model (`model/best_model.keras`)
- Guarantees identical canonical preprocessing (`preprocess.py`)
- Employs calibrated confidence thresholding & temperature scaling
- Decouples domain knowledge into `knowledge_base.py`
- Endpoints:
    GET  /health          -> Microservice health & model readiness
    POST /classify        -> Multipart image file upload
    POST /classify-base64 -> Base64 encoded image string
"""

import io
import os
import sys
import json
import base64
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from preprocess import (
    CANONICAL_CLASSES,
    DEFAULT_TARGET_SIZE,
    load_and_preprocess_image,
    preprocess_pil_image,
)
from knowledge_base import get_waste_metadata

MODEL_PATH = BASE_DIR / "model" / "best_model.keras"
METADATA_PATH = BASE_DIR / "model" / "training_metadata.json"
CALIBRATION_FILE = BASE_DIR / "model" / "calibration.json"

app = FastAPI(
    title="EcoSort AI Classification Microservice",
    description="High-accuracy real-world waste identification and disposal guidance API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
MODEL = None
METADATA = {}
CALIBRATION = {"temperature": 1.0, "confidence_threshold": 60.0}


class Base64ClassificationRequest(BaseModel):
    imageBase64: Optional[str] = Field(default=None, description="Base64 encoded JPEG or PNG image data")
    image: Optional[str] = Field(default=None, description="Alternative field name for Base64 image data")
    threshold: Optional[float] = Field(default=None, description="Optional custom confidence threshold")


class ClassificationResponse(BaseModel):
    success: bool
    detected_item: str
    category: str
    confidence: float
    bin: str
    recyclable: bool
    disposal_instruction: str
    sustainability_tip: str
    carbon_saved_kg: float
    probabilities: Dict[str, float]
    model_architecture: Optional[str] = None


def load_model_and_metadata():
    """Initializes model and configuration on startup."""
    global MODEL, METADATA, CALIBRATION

    print("[ML] Initializing EcoSort AI model runtime...")
    if MODEL_PATH.exists():
        try:
            import tensorflow as tf
            from tensorflow import keras
            print(f"[ML] Loading trained model from {MODEL_PATH}...")
            MODEL = keras.models.load_model(str(MODEL_PATH))
            print(f"[ML] ✅ Loaded Keras model from {MODEL_PATH}")
        except Exception as e:
            print(f"[ML] ⚠️ Warning: Could not load model: {e}")
            MODEL = None
    else:
        print(f"[ML] ℹ️ Model not yet generated at {MODEL_PATH}. Run 'python train.py' first.")
        MODEL = None

    if METADATA_PATH.exists():
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                METADATA = json.load(f)
        except Exception:
            pass

    if CALIBRATION_FILE.exists():
        try:
            with open(CALIBRATION_FILE, "r", encoding="utf-8") as f:
                CALIBRATION = json.load(f)
        except Exception:
            pass


@app.on_event("startup")
async def startup_event():
    load_model_and_metadata()


@app.get("/health")
@app.get("/api/ml/status")
@app.get("/ml/status")
def health_check():
    """Returns microservice readiness and metadata."""
    return {
        "status": "ready" if MODEL is not None else "model_pending",
        "model_loaded": MODEL is not None,
        "model_architecture": METADATA.get("model_architecture", "MobileNetV3Large"),
        "calibrated_threshold": CALIBRATION.get("confidence_threshold", 60.0),
        "temperature": CALIBRATION.get("temperature", 1.0),
        "classes": CANONICAL_CLASSES,
        "input_resolution": list(DEFAULT_TARGET_SIZE)
    }


def run_inference(image: Image.Image, custom_threshold: Optional[float] = None) -> Dict[str, Any]:
    """Applies consistent preprocessing, model inference, and knowledge mapping."""
    if MODEL is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Train the model using 'python train.py' first."
        )

    threshold = custom_threshold if custom_threshold is not None else CALIBRATION.get("confidence_threshold", 60.0)
    temperature = CALIBRATION.get("temperature", 1.0)

    print(f"[ML] Image received | Dimensions: {image.size} | Mode: {image.mode}")
    print(f"[ML] Preprocessing image to canonical {DEFAULT_TARGET_SIZE} (preserving aspect ratio)...")

    # 1. Canonical Preprocessing (Preserves Aspect Ratio)
    img_array = preprocess_pil_image(image, target_size=DEFAULT_TARGET_SIZE, preserve_aspect_ratio=True)
    batch = np.expand_dims(img_array, axis=0)

    # 2. Softmax & Temperature Scaling
    print("[ML] Running prediction...")
    raw_probs = MODEL.predict(batch, verbose=0)[0]
    scaled_logits = np.log(np.clip(raw_probs, 1e-7, 1.0)) / temperature
    exp_l = np.exp(scaled_logits - np.max(scaled_logits))
    probs = exp_l / np.sum(exp_l)

    pred_idx = int(np.argmax(probs))
    confidence = float(np.max(probs) * 100.0)
    raw_category = CANONICAL_CLASSES[pred_idx]

    print(f"[ML] Predicted class: {raw_category.capitalize()} | Raw Confidence: {confidence:.2f}%")

    # 3. Confidence Threshold Fallback
    if confidence < threshold:
        print(f"[ML] ⚠️ Confidence {confidence:.1f}% below threshold {threshold:.1f}%. Falling back to 'Other/Unknown'.")
        category_key = "other"
        item_desc = f"Uncertain item (low confidence: {confidence:.1f}%)"
    else:
        category_key = raw_category
        item_desc = None

    # 4. Decoupled Knowledge Mapping
    meta = get_waste_metadata(category_key, confidence=confidence, item_description=item_desc)

    prob_dict = {
        cls_name: round(float(probs[i] * 100.0), 2)
        for i, cls_name in enumerate(CANONICAL_CLASSES)
    }

    print(f"[API] Model prediction completed | Category: {meta['category']} | Bin: {meta['bin']}")

    return {
        "success": True,
        "detected_item": meta["detected_item"],
        "category": meta["category"],
        "confidence": meta["confidence"],
        "bin": meta["bin"],
        "recyclable": meta["recyclable"],
        "disposal_instruction": meta["disposal_instruction"],
        "sustainability_tip": meta["sustainability_tip"],
        "carbon_saved_kg": meta["carbon_saved_kg"],
        "probabilities": prob_dict,
        "model_architecture": METADATA.get("model_architecture", "MobileNetV3Large")
    }


@app.post("/classify", response_model=ClassificationResponse)
async def classify_file(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(default=None)
):
    """Classifies an uploaded image file."""
    print("[API] Request received: POST /classify (Multipart File)")
    if not file or not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No image uploaded. Please provide a valid image file."
        )

    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(
                status_code=400,
                detail="No image uploaded. Uploaded file is empty (0 bytes)."
            )

        print(f"[API] Image received: yes | Filename: {file.filename} | Size: {len(contents)} bytes | Content-Type: {file.content_type}")
        image = Image.open(io.BytesIO(contents))
        return run_inference(image, custom_threshold=threshold)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")


@app.post("/classify-base64", response_model=ClassificationResponse)
@app.post("/api/ml/classify")
@app.post("/ml/classify")
async def classify_base64(payload: Base64ClassificationRequest):
    """Classifies a Base64-encoded image string."""
    print("[API] Request received: POST /classify-base64")
    b64_str = payload.imageBase64 or payload.image
    if not b64_str or len(b64_str.strip()) < 20:
        print("[API] ❌ Rejected: No image uploaded or string is too short.")
        raise HTTPException(
            status_code=400,
            detail="No image uploaded. Please provide a valid Base64 encoded image string."
        )

    try:
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        b64_str = b64_str.replace(" ", "").replace("\n", "").replace("\r", "")

        image_bytes = base64.b64decode(b64_str)
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="No image uploaded. Decoded Base64 byte array is empty (0 bytes)."
            )

        print(f"[API] Image received: yes | Decoded size: {len(image_bytes)} bytes")
        image = Image.open(io.BytesIO(image_bytes))
        return run_inference(image, custom_threshold=payload.threshold)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Base64 decoding failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
