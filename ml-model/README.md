# EcoSort AI – Machine Learning Waste Classification Pipeline

Complete, production-ready machine learning pipeline to train, evaluate, and serve a custom **MobileNetV3 / EfficientNet-B0** image classification model for the **EcoSort AI** waste segregation assistant.

---

## 📑 Table of Contents
1. [Waste Categories](#1-waste-categories)
2. [Project Directory Structure](#2-project-directory-structure)
3. [Windows Setup & Installation Commands](#3-windows-setup--installation-commands)
4. [Dataset Acquisition & Preparation](#4-dataset-acquisition--preparation)
5. [Data Preprocessing & Augmentation](#5-data-preprocessing--augmentation)
6. [Model Architecture & Transfer Learning](#6-model-architecture--transfer-learning)
7. [Training the Model](#7-training-the-model)
8. [Evaluation & Diagnostic Metrics](#8-evaluation--diagnostic-metrics)
9. [CLI Prediction Script](#9-cli-prediction-script)
10. [Confidence Handling (< 60% Threshold)](#10-confidence-handling--60-threshold)
11. [FastAPI ML Microservice](#11-fastapi-ml-microservice)
12. [Integration with EcoSort AI Express/Vite Frontend](#12-integration-with-ecosort-ai-expressvite-frontend)
13. [Recommendations for Real-World Smartphone Camera Photos](#13-recommendations-for-real-world-smartphone-camera-photos)

---

## 1. Waste Categories

The model classifies waste into 9 distinct municipal streams:

| # | Category | Target Bin | Recyclable? | Example Items |
|---|---|---|---|---|
| 1 | **Plastic** | Dry / Recyclables (Blue) | Yes | PET bottles, HDPE jugs, PP food containers |
| 2 | **Paper** | Dry / Paper Bin | Yes | Office paper, flyers, newspaper, clean mail |
| 3 | **Cardboard** | Dry / Cardboard Bin | Yes | Corrugated shipping boxes, cereal boxes |
| 4 | **Glass** | Glass / Recyclable Bin | Yes | Beverage bottles, food jars (clear, brown, green) |
| 5 | **Metal** | Dry / Metal Bin | Yes | Aluminum soda cans, tin food cans, metal lids |
| 6 | **Organic/Wet Waste**| Wet / Compost (Green) | No (Compostable)| Fruit peels, food leftovers, vegetable trimmings |
| 7 | **E-Waste** | Specialized E-Waste Center | Yes (Specialized)| USB cables, phone chargers, circuit boards, headphones |
| 8 | **Hazardous Waste** | Hazardous Material Depot | No (Toxic) | Lithium batteries, aerosol cans, paint tins, chemicals |
| 9 | **Other/Unknown** | General Trash / Landfill | No | Multi-layer composites, heavily soiled items, unknown objects |

---

## 2. Project Directory Structure

```text
ml-model/
├── dataset/
│   ├── plastic/
│   ├── paper/
│   ├── cardboard/
│   ├── glass/
│   ├── metal/
│   ├── organic/
│   ├── e_waste/
│   ├── hazardous/
│   └── other/
├── model/
│   ├── best_model.keras          # Saved best weights (generated after training)
│   ├── class_indices.json        # Class-to-index mapping
│   └── training_metadata.json    # Architecture & accuracy records
├── evaluation_results/
│   ├── accuracy_curve.png        # Training vs. Validation Accuracy
│   ├── loss_curve.png            # Training vs. Validation Loss
│   ├── confusion_matrix.png      # 9x9 Normalized Confusion Matrix Heatmap
│   ├── per_class_accuracy.png    # Bar chart of test accuracy per class
│   ├── classification_report.txt # Text format Precision/Recall/F1
│   └── evaluation_summary.json   # Machine-readable evaluation report
├── class_names.json              # Segregation metadata, bins & eco-tips
├── prepare_dataset.py            # Dataset validator, duplicate cleaner & sampler
├── train.py                      # Two-stage Transfer Learning & Fine-Tuning pipeline
├── evaluate.py                   # Comprehensive 15% holdout evaluation script
├── predict.py                    # Single image CLI inference script
├── api.py                        # FastAPI microservice for EcoSort integration
├── requirements.txt              # Python library dependencies
└── README.md                     # Complete documentation & tutorial
```

---

## 3. Windows Setup & Installation Commands

Follow these exact steps in **Windows PowerShell** or **Command Prompt (cmd)**:

### Step 1: Open Terminal in the `ml-model` folder
```powershell
cd C:\path\to\EcoSortAI\ml-model
```

### Step 2: Create a Dedicated Python Virtual Environment
```powershell
python -m venv venv
```

### Step 3: Activate the Virtual Environment
- **In PowerShell:**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
  *(If PowerShell gives a script execution policy warning, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*
- **In Command Prompt (CMD):**
  ```cmd
  venv\Scripts\activate.bat
  ```

### Step 4: Upgrade pip & Install Dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5: Verify GPU Support (Optional)
If your computer has an NVIDIA GPU with CUDA:
```powershell
python -c "import tensorflow as tf; print('Num GPUs Available:', len(tf.config.list_physical_devices('GPU')))"
```
*(If no GPU is available, TensorFlow will automatically utilize multi-threaded CPU execution).*

---

## 4. Dataset Acquisition & Preparation

### A. Recommended Public Benchmark Datasets
1. **TrashNet (Stanford - Gary Thung & Mindy Yang)**:
   - Contains 2,527 images of Paper, Glass, Plastic, Metal, Cardboard, and Trash.
   - Download: `https://github.com/garythung/trashnet`
2. **TACO (Trash Annotations in Context)**:
   - High-resolution real-world photos taken with smartphones in parks, streets, and beaches.
   - Download: `http://tacodataset.org` or `https://github.com/pedropro/TACO`
3. **Kaggle Garbage Classification Dataset (12 Classes)**:
   - High quality real-world images mapping cleanly to batteries (hazardous), biological (organic), and dry recyclables.
   - Download: `https://www.kaggle.com/datasets/mostafaabla/garbage-classification`
4. **RealWaste Dataset (Australia - Mendeley Data)**:
   - Over 4,700 real photos collected from municipal transfer stations.
   - Download: `https://data.mendeley.com/datasets/nyyvdv3st5/1`
5. **E-Waste Image Dataset**:
   - Electronic waste: cables, motherboards, batteries, cellphones.
   - Download: `https://www.kaggle.com/datasets/shreyasvedpathak/e-waste-dataset`

### B. Organizing Images into Folders
Place your image files (`.jpg`, `.png`, `.webp`) into the respective subfolder under `dataset/`:
```text
ml-model/dataset/plastic/    -> plastic bottles, cups, containers
ml-model/dataset/paper/      -> paper sheets, envelopes, newspaper
ml-model/dataset/cardboard/  -> delivery cartons, cereal boxes
ml-model/dataset/glass/      -> beverage bottles, jars
ml-model/dataset/metal/      -> soda cans, food cans, foil
ml-model/dataset/organic/    -> banana peels, apple cores, food leftovers
ml-model/dataset/e_waste/    -> chargers, wires, circuits, keyboards
ml-model/dataset/hazardous/  -> alkaline/lithium batteries, spray cans, chemical bottles
ml-model/dataset/other/      -> multi-material laminates, unclassified debris
```

### C. Run Dataset Validation, De-duplication & Balancing
Run the automatic inspection script:
```powershell
python prepare_dataset.py
```
This will:
- Check every image file to verify it is uncorrupted and readable.
- Calculate SHA-256 hashes to detect and remove identical duplicates.
- Display a distribution bar chart across all 9 classes.
- Calculate inverse-frequency **class weights** to prevent majority classes (e.g. plastic) from dominating minority classes (e.g. hazardous).

*(Quick-start tip: If you want to test the pipeline before downloading full gigabyte datasets, run `python prepare_dataset.py --seed-demo-samples` to generate starter verification samples!)*

---

## 5. Data Preprocessing & Augmentation

All images undergo a robust pipeline before entering the neural network:
1. **Input Resizing**: Fixed resolution of **224 × 224 × 3 RGB**.
2. **Channel Normalization**: Scaled via architecture-specific scaling (`mobilenet_v3.preprocess_input` mapping [-1, 1]).
3. **Deterministic Partitioning**:
   - **70% Training Set**: Used for parameter optimization.
   - **15% Validation Set**: Used for early stopping and hyperparameter monitoring.
   - **15% Holdout Test Set**: Strictly sequestered, evaluated only once after training finishes.
4. **In-Graph Data Augmentation**:
   To ensure resilience against real-world smartphone photos:
   - `RandomFlip("horizontal")`
   - `RandomRotation(0.12)` (±15% rotational tolerance)
   - `RandomZoom((-0.1, 0.15))`
   - `RandomTranslation(0.08, 0.08)`
   - `RandomContrast(0.12)`

---

## 6. Model Architecture & Transfer Learning

We employ **Transfer Learning** using pre-trained **MobileNetV3Large** (or **EfficientNet-B0**) with ImageNet weights:

```text
Input Image (224 x 224 x 3)
      │
[Data Augmentation Layers]
      │
[MobileNetV3Large Pre-trained Backbone (ImageNet weights)]
      │
[Global Average Pooling 2D]
      │
[Batch Normalization]
      │
[Dense Layer: 256 units, ReLU, L2 Regularizer (1e-4)]
      │
[Dropout Layer: rate = 0.40]
      │
[Final Output Dense: 9 units, Softmax Activation]
```

### Why MobileNetV3Large?
- Extreme inference speed (< 25ms per image on CPU, < 5ms on GPU).
- Ultra-compact model size (~18 MB).
- High top-1 ImageNet accuracy through Hardware-Aware Neural Architecture Search (NAS).

---

## 7. Training the Model

Training runs in **two strategic stages**:

1. **Phase 1 (Feature Extraction)**:
   The pre-trained backbone is frozen. Only the custom classification head is trained with an initial learning rate of `1e-3`. This prevents corrupting pre-trained visual feature weights.
2. **Phase 2 (Fine-Tuning)**:
   The top 35 layers of MobileNetV3 are unfrozen and trained with a micro-learning rate of `1e-5` to tailor high-level feature filters specifically to waste textures.

### Execute Training:
```powershell
python train.py --backbone mobilenetv3 --epochs-phase1 12 --epochs-phase2 12 --batch-size 32
```

*(To train with EfficientNet-B0 instead, pass `--backbone efficientnet`).*

### Automated Callbacks:
- `EarlyStopping`: Halts training if validation loss fails to improve for 5 consecutive epochs, restoring the best weight checkpoint.
- `ModelCheckpoint`: Automatically saves the highest-scoring model to `model/best_model.keras`.
- `ReduceLROnPlateau`: Halves the learning rate when validation loss stagnates for 2 epochs.

---

## 8. Evaluation & Diagnostic Metrics

Evaluate the saved `best_model.keras` on the unseen **15% holdout test dataset**:

```powershell
python evaluate.py
```

### Metrics Output:
1. **Overall Test Accuracy & Test Loss**.
2. **Classification Report**:
   - Precision (Purity of predicted items)
   - Recall (Completeness of detection per category)
   - F1-Score (Harmonic balance)
3. **Artifacts Saved in `evaluation_results/`**:
   - `confusion_matrix.png`: Color-coded 9x9 matrix showing where items might be confused (e.g. transparent plastic vs. clear glass).
   - `accuracy_curve.png`: Training vs. Validation accuracy trajectory across epochs.
   - `loss_curve.png`: Training vs. Validation cross-entropy loss trajectory.
   - `per_class_accuracy.png`: Bar graph highlighting performance on every individual waste stream.
   - `evaluation_summary.json`: Complete numerical data for reporting.

---

## 9. CLI Prediction Script

Test any individual image from your computer using the command line:

```powershell
python predict.py "C:\Users\username\Pictures\sample_bottle.jpg"
```

### Example Terminal Output:
```json
{
  "detected_item": "Plastic bottle or container",
  "category": "Plastic",
  "confidence": 94.8,
  "bin": "Dry/Recyclable Waste",
  "recyclable": true,
  "disposal_instruction": "Empty and rinse the container to remove food or liquid residue before depositing into the recyclable waste bin.",
  "sustainability_tip": "Plastic recycling saves up to 70% of energy compared to producing virgin plastic from petrochemicals."
}
```

---

## 10. Confidence Handling (< 60% Threshold)

To prevent dangerous municipal contamination (such as mistaking a volatile lithium-ion battery for a recyclable aluminum can), the system enforces an **automated confidence safety gate**:

- **If Model Confidence ≥ 60.0%**: Returns the predicted category and specific recycling bin.
- **If Model Confidence < 60.0%**: Automatically falls back to:
  ```json
  {
    "detected_item": "Uncertain / Unidentified waste item",
    "category": "Other/Unknown",
    "confidence": 48.2,
    "bin": "General Waste / Landfill Residual",
    "recyclable": false,
    "disposal_instruction": "Confidence (48.2%) is below the 60% certainty threshold. Visually verify the item markings or dispose of in general household waste to avoid stream contamination.",
    "sustainability_tip": "Ensure photos are well-lit, centered on the object, and free from heavy background clutter to improve classification accuracy."
  }
  ```

---

## 11. FastAPI ML Microservice

Serve the trained model as a REST API accessible by web applications and mobile clients:

### Start the Microservice:
```powershell
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

### Interactive API Documentation:
Open your browser to:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

### Test Endpoints:
- **Health Check**:
  ```powershell
  curl http://127.0.0.1:8000/health
  ```
- **Classify Image File (Multipart)**:
  ```powershell
  curl -X POST "http://127.0.0.1:8000/classify" -F "file=@test_bottle.jpg"
  ```
- **Classify Base64 Image**:
  `POST http://127.0.0.1:8000/classify-base64` with JSON body:
  ```json
  {
    "image": "data:image/jpeg;base64,...",
    "threshold": 60.0
  }
  ```

---

## 12. Integration with EcoSort AI Express/Vite Frontend

The **EcoSort AI TypeScript / Express backend** is configured to communicate with your local Python ML API:

### Architecture Flow:
```text
User snaps / uploads photo
           │
   [EcoSort React UI]
           │  (POST /api/analyze-waste)
   [Express / Vite Backend (server.ts)]
           │  (Proxies to ML_SERVICE_URL: http://127.0.0.1:8000/classify-base64)
   [FastAPI ML Microservice (api.py)]
           │
   [MobileNetV3 best_model.keras]
           │
   [Exact JSON Classification Output]
           │
   [EcoSort Frontend Dashboard Update]
```

### How to Enable in the Web App:
1. In your project root, add or update `.env`:
   ```env
   ML_SERVICE_URL=http://127.0.0.1:8000
   ```
2. Start the Python ML API:
   ```powershell
   cd ml-model
   uvicorn api:app --port 8000 --reload
   ```
3. Start the EcoSort AI web app:
   ```powershell
   npm run dev
   ```
4. Check connection status in browser at `http://localhost:3000/api/ml/status`. The Express server will route classification through your trained machine learning model!

---

## 13. Recommendations for Real-World Smartphone Camera Photos

When deploying an image classification model to real users with phone cameras, clean lab photos often fail if the model isn't properly trained for real conditions. Follow these tips to reach **90%+ real-world accuracy**:

1. **Diverse Lighting Conditions**:
   - Collect training photos under incandescent indoor lamps, fluorescent office tubes, direct midday sunlight, and dim evening light.
2. **Varied Backgrounds**:
   - Avoid training only on white studio paper. Include wooden kitchen counters, granite tabletops, carpets, concrete driveways, and grass.
3. **Object Deformations**:
   - Train on crushed aluminum cans, crumpled paper receipts, ripped cardboard boxes, and scratched plastics.
4. **Distance & Aspect Ratio Invariance**:
   - Capture items close-up (showing resin codes/labels) as well as whole-object shots from 0.5 to 1.5 meters away.
5. **Multi-Item Ambiguity**:
   - For composite items (e.g. plastic bottle with metal cap or paper label), train with both assembled and separated components.
6. **In-App Framing Reticle**:
   - In the camera viewfinder UI, prompt the user with: *"Center one item within the box and avoid holding it in dark shadows"*.
