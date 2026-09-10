"""
EcoSort AI - Canonical Preprocessing Module
===========================================
Single source of truth for image preprocessing across all environments:
- Training pipeline
- Validation & Evaluation
- Testing
- CLI inference (predict.py)
- FastAPI production microservice (api.py)

Ensures zero distribution shift between training and real-world deployment.
Uses aspect-ratio preserving letterbox resizing so bottles, cans, and boxes
are never artificially squished or distorted.
"""

import io
from pathlib import Path
from typing import Tuple, Union, Optional
import numpy as np
from PIL import Image, ImageOps

DEFAULT_TARGET_SIZE = (224, 224)
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


def letterbox_image(
    image: Image.Image,
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
    bg_color: Tuple[int, int, int] = (128, 128, 128)
) -> Image.Image:
    """
    Resizes image to target_size while strictly preserving aspect ratio.
    Adds neutral gray letterbox padding on the shorter dimension to prevent
    geometric distortion (e.g., squishing tall bottles into wide cans).
    """
    target_w, target_h = target_size
    img_w, img_h = image.size

    if img_w <= 0 or img_h <= 0:
        raise ValueError(f"Invalid image dimensions: {image.size}")

    scale = min(target_w / img_w, target_h / img_h)
    new_w = max(1, int(img_w * scale))
    new_h = max(1, int(img_h * scale))

    # High-quality Lanczos/Bicubic resampling for real-world photo preservation
    resized_img = image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Place resized image in center of target canvas with neutral background
    new_image = Image.new("RGB", (target_w, target_h), bg_color)
    paste_x = (target_w - new_w) // 2
    paste_y = (target_h - new_h) // 2
    new_image.paste(resized_img, (paste_x, paste_y))

    return new_image


def preprocess_pil_image(
    image: Image.Image,
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
    preserve_aspect_ratio: bool = True
) -> np.ndarray:
    """
    Takes a PIL Image and converts it to a normalized NumPy float32 array
    suitable for model inference or training.
    
    Output shape: (target_h, target_w, 3)
    Output range: [0.0, 255.0] (matching Keras MobileNetV3 / EfficientNet internal preprocessing)
    """
    # 1. Correct EXIF camera orientation (crucial for smartphone portrait/landscape photos)
    image = ImageOps.exif_transpose(image)

    # 2. Ensure 3-channel RGB (handles RGBA, grayscale, CMYK)
    if image.mode != "RGB":
        image = image.convert("RGB")

    # 3. Resize with or without aspect ratio preservation
    if preserve_aspect_ratio:
        processed_img = letterbox_image(image, target_size=target_size)
    else:
        processed_img = image.resize(target_size, Image.Resampling.LANCZOS)

    # 4. Convert to float32 NumPy array [0.0, 255.0]
    img_array = np.array(processed_img, dtype=np.float32)
    return img_array


def load_and_preprocess_image(
    source: Union[str, Path, bytes, io.BytesIO],
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
    preserve_aspect_ratio: bool = True
) -> np.ndarray:
    """
    Loads an image from a filepath or in-memory byte buffer and applies
    the exact canonical preprocessing pipeline.
    """
    if isinstance(source, (str, Path)):
        file_path = Path(source)
        if not file_path.exists():
            raise FileNotFoundError(f"Image not found at path: {file_path}")
        with Image.open(file_path) as img:
            return preprocess_pil_image(img, target_size=target_size, preserve_aspect_ratio=preserve_aspect_ratio)
    elif isinstance(source, (bytes, bytearray)):
        with Image.open(io.BytesIO(source)) as img:
            return preprocess_pil_image(img, target_size=target_size, preserve_aspect_ratio=preserve_aspect_ratio)
    elif isinstance(source, io.BytesIO):
        with Image.open(source) as img:
            return preprocess_pil_image(img, target_size=target_size, preserve_aspect_ratio=preserve_aspect_ratio)
    else:
        raise TypeError(f"Unsupported image source type: {type(source)}")


def prepare_batch_input(img_array: np.ndarray) -> np.ndarray:
    """
    Expands a single (H, W, 3) image array to a batch tensor (1, H, W, 3).
    """
    if img_array.ndim == 3:
        return np.expand_dims(img_array, axis=0)
    elif img_array.ndim == 4:
        return img_array
    else:
        raise ValueError(f"Expected 3D or 4D array, got shape {img_array.shape}")
