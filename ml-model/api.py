#!/usr/bin/env python3
"""
EcoSort AI - Python FastAPI Machine Learning Microservice
=========================================================
Runs a high-performance REST API for waste classification using
the trained MobileNetV3/EfficientNet deep learning model.

Endpoints:
- GET  /health            -> System and model status
- POST /classify          -> Multipart file upload (image file)
- POST /classify-base64   -> JSON payload with base64 image data
- GET  /categories        -> List supported 9 waste categories

Connects seamlessly with the EcoSort AI Express/TypeScript backend.
"""

import os
import io
import json
import base64
from pathlib import Path
from typing import Optional
import numpy as np
from PIL import Image

# Suppress TensorFlow logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

try:
    from fastapi import FastAPI, File, UploadFile, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    import uvicorn
except ImportError:
    print("❌ FastAPI/uvicorn dependencies not installed.")
    print("   Please run: pip install fastapi uvicorn python-multipart pydantic")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "best_model.keras"
CLASS_METADATA_PATH = BASE_DIR / "class_names.json"
CLASS_INDICES_PATH = BASE_DIR / "model" / "class_indices.json"
IMAGE_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 60.0  # Safe threshold below which 'Other/Unknown' is returned

app = FastAPI(
    title="EcoSort AI - Waste Classification ML Service",
    description="Deep Learning API for classifying municipal waste images into 9 segregation streams.",
    version="1.0.0",
)

# Enable CORS for local and cross-service communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for loaded model and metadata
model = None
metadata = {}
class_list = []


class Base64ImageRequest(BaseModel):
    image: str = Field(..., description="Base64-encoded image string (with or without data URI prefix)")
    threshold: Optional[float] = Field(60.0, description="Confidence threshold percentage")


class ClassificationResponse(BaseModel):
    detected_item: str
    category: str
    confidence: float
    bin: str
    recyclable: bool
    disposal_instruction: str
    sustainability_tip: str


@app.on_event("startup")
def load_model_on_startup():
    """Load trained Keras model and metadata at API boot time."""
    global model, metadata, class_list
    print("⏳ Loading EcoSort AI classification model into memory...")

    # 1. Load metadata
    if CLASS_METADATA_PATH.exists():
        with open(CLASS_METADATA_PATH, "r", encoding="utf-8") as f:
            metadata = json.load(f)
    else:
        metadata = {"categories": {}}

    # 2. Determine class list order
    if CLASS_INDICES_PATH.exists():
        with open(CLASS_INDICES_PATH, "r", encoding="utf-8") as f:
            class_indices = json.load(f)
            class_list = [k for k, v in sorted(class_indices.items(), key=lambda item: item[1])]
    else:
        class_list = metadata.get("classes", [
            "plastic", "paper", "cardboard", "glass", "metal",
            "organic", "e_waste", "hazardous", "other"
        ])

    # 3. Load Keras model if present
    if MODEL_PATH.exists():
        try:
            import tensorflow as tf
            model = tf.keras.models.load_model(str(MODEL_PATH))
            print(f"✅ Loaded trained model from '{MODEL_PATH}' successfully.")
        except Exception as err:
            print(f"⚠️ Error loading model from '{MODEL_PATH}': {err}")
            model = None
    else:
        print(f"⚠️ Trained model not found at '{MODEL_PATH}'.")
        print("   Train the model using 'python train.py' to enable live inference.")


def preprocess_pil_image(pil_img: Image.Image) -> np.ndarray:
    """Resize, convert to RGB, and expand dimensions for batch inference."""
    rgb_img = pil_img.convert("RGB")
    resized_img = rgb_img.resize(IMAGE_SIZE, Image.Resampling.BILINEAR)
    img_array = np.array(resized_img, dtype=np.float32)
    return np.expand_dims(img_array, axis=0)


def classify_tensor(img_tensor: np.ndarray, threshold: float = 60.0) -> dict:
    """Run model inference and format response with confidence thresholding."""
    global model, metadata, class_list

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Train the model using 'python train.py' first.",
        )

    # Run inference
    predictions = model.predict(img_tensor, verbose=0)[0]
    top_idx = int(np.argmax(predictions))
    top_confidence = float(predictions[top_idx] * 100.0)
    raw_class_key = class_list[top_idx] if top_idx < len(class_list) else "other"

    category_info = metadata.get("categories", {}).get(raw_class_key, {})
    display_category = category_info.get("display_name", raw_class_key.title())

    # Confidence Threshold Rule:
    # If confidence is below threshold (e.g. 60%), safely default to 'Other/Unknown'
    if top_confidence < threshold:
        fallback_info = metadata.get("categories", {}).get("other", {})
        return {
            "detected_item": "Unidentified waste item",
            "category": "Other/Unknown",
            "confidence": round(top_confidence, 1),
            "bin": fallback_info.get("bin", "General Waste / Landfill"),
            "recyclable": False,
            "disposal_instruction": (
                f"Confidence is {top_confidence:.1f}% (below safe {threshold:.0f}% threshold). "
                "Check municipal labels or deposit into general waste to avoid stream contamination."
            ),
            "sustainability_tip": (
                "Capture a well-lit, centered photo on a clean surface to improve classification accuracy."
            ),
        }

    return {
        "detected_item": category_info.get("detected_item_default", f"{display_category} item"),
        "category": display_category,
        "confidence": round(top_confidence, 1),
        "bin": category_info.get("bin", "Dry/Recyclable"),
        "recyclable": bool(category_info.get("recyclable", True)),
        "disposal_instruction": category_info.get(
            "disposal_instruction",
            "Deposit into designated container after standard preparation."
        ),
        "sustainability_tip": category_info.get(
            "sustainability_tip",
            "Proper segregation diverts materials from landfill and saves energy."
        ),
    }


@app.get("/")
def root():
    return {
        "service": "EcoSort AI Waste Classification ML API",
        "status": "online",
        "model_loaded": model is not None,
        "endpoints": {
            "health": "/health",
            "categories": "/categories",
            "classify_file": "POST /classify",
            "classify_base64": "POST /classify-base64",
        },
    }


@app.get("/health")
def health_check():
    """Health check endpoint used by Express backend to verify ML service."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "classes": class_list,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    }


@app.get("/categories")
def get_categories():
    """Return dictionary of supported 9 waste categories and rules."""
    return metadata.get("categories", {})


@app.post("/classify", response_model=ClassificationResponse)
async def classify_file(
    file: UploadFile = File(...),
    threshold: float = Query(60.0, ge=0.0, le=100.0, description="Confidence threshold"),
):
    """
    Accepts multipart/form-data image file upload (PNG, JPG, WEBP).
    """
    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents))
        img_tensor = preprocess_pil_image(pil_image)
        result = classify_tensor(img_tensor, threshold=threshold)
        return result
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Image processing error: {str(err)}")


@app.post("/classify-base64", response_model=ClassificationResponse)
async def classify_base64(payload: Base64ImageRequest):
    """
    Accepts JSON with base64 encoded image string.
    Seamlessly integrates with TypeScript/Express backend.
    """
    try:
        image_str = payload.image
        # Strip data URL header if present (e.g. data:image/jpeg;base64,...)
        if "," in image_str:
            image_str = image_str.split(",")[1]

        image_bytes = base64.b64decode(image_str)
        pil_image = Image.open(io.BytesIO(image_bytes))
        img_tensor = preprocess_pil_image(pil_image)

        threshold = payload.threshold if payload.threshold is not None else CONFIDENCE_THRESHOLD
        result = classify_tensor(img_tensor, threshold=threshold)
        return result
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Base64 image classification error: {str(err)}")


if __name__ == "__main__":
    print("🚀 Starting EcoSort AI ML Service on http://127.0.0.1:8000 ...")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
