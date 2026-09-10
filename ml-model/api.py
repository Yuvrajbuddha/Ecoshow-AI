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
    imageBase64: str = Field(..., description="Base64 encoded JPEG or PNG image data")
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

    if MODEL_PATH.exists():
        try:
            import tensorflow as tf
            from tensorflow import keras
            MODEL = keras.models.load_model(str(MODEL_PATH))
            print(f"✅ Loaded Keras model from {MODEL_PATH}")
        except Exception as e:
            print(f"⚠️ Warning: Could not load model: {e}")
            MODEL = None
    else:
        print(f"ℹ️ Model not yet generated at {MODEL_PATH}. Train using train.py.")
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
            detail="Model is not loaded. Train the model using train.py first."
        )

    threshold = custom_threshold if custom_threshold is not None else CALIBRATION.get("confidence_threshold", 60.0)
    temperature = CALIBRATION.get("temperature", 1.0)

    # 1. Canonical Preprocessing (Preserves Aspect Ratio)
    img_array = preprocess_pil_image(image, target_size=DEFAULT_TARGET_SIZE, preserve_aspect_ratio=True)
    batch = np.expand_dims(img_array, axis=0)

    # 2. Softmax & Temperature Scaling
    raw_probs = MODEL.predict(batch, verbose=0)[0]
    scaled_logits = np.log(np.clip(raw_probs, 1e-7, 1.0)) / temperature
    exp_l = np.exp(scaled_logits - np.max(scaled_logits))
    probs = exp_l / np.sum(exp_l)

    pred_idx = int(np.argmax(probs))
    confidence = float(np.max(probs) * 100.0)
    raw_category = CANONICAL_CLASSES[pred_idx]

    # 3. Confidence Threshold Fallback
    if confidence < threshold:
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
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        return run_inference(image, custom_threshold=threshold)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")


@app.post("/classify-base64", response_model=ClassificationResponse)
@app.post("/api/ml/classify")
@app.post("/ml/classify")
async def classify_base64(payload: Base64ClassificationRequest):
    """Classifies a Base64-encoded image string."""
    try:
        b64_str = payload.imageBase64
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]

        image_bytes = base64.b64decode(b64_str)
        image = Image.open(io.BytesIO(image_bytes))
        return run_inference(image, custom_threshold=payload.threshold)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Base64 decoding failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
