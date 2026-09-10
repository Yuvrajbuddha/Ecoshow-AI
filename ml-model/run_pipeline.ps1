# ===========================================================================
# EcoSort AI - Windows PowerShell Training & Evaluation Pipeline
# ===========================================================================
# Usage in Windows PowerShell:
# cd ml-model
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# .\run_pipeline.ps1
# ===========================================================================

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host " ECOSORT AI: 9-CLASS WASTE CLASSIFICATION OPTIMIZATION PIPELINE" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan

# 1. Virtual environment setup
if (-not (Test-Path "venv")) {
    Write-Host "[1/8] Creating Python virtual environment (venv)..." -ForegroundColor Yellow
    python -m venv venv
}
Write-Host "Activating virtual environment..." -ForegroundColor Green
& .\venv\Scripts\Activate.ps1

# 2. Dependencies
Write-Host "[2/8] Installing / Upgrading dependencies from requirements.txt..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt

# 3. Quality audit
Write-Host "[3/8] Running Dataset Quality & Integrity Inspection..." -ForegroundColor Yellow
python dataset_quality.py

# 4. Stratified Split
Write-Host "[4/8] Running Stratified Leakage-Free Data Split (70/15/15)..." -ForegroundColor Yellow
python prepare_dataset.py

# 5. Training
Write-Host "[5/8] Training Two-Stage Transfer Learning Models & Logging Experiments..." -ForegroundColor Yellow
python train.py --compare-all

# 6. Calibration
Write-Host "[6/8] Performing Confidence Calibration on Validation Set..." -ForegroundColor Yellow
python calibration.py

# 7. Test evaluation
Write-Host "[7/8] Evaluating Best Model on Completely Untouched Test Split..." -ForegroundColor Yellow
python evaluate.py

# 8. Real-world evaluation
Write-Host "[8/8] Evaluating Real-World Smartphone Photos & OOD Object Rejection..." -ForegroundColor Yellow
python test_real_world.py

Write-Host "=========================================================================" -ForegroundColor Green
Write-Host " PIPELINE COMPLETE! All reports and model checkpoints generated." -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "Starting FastAPI microservice on http://localhost:8000..." -ForegroundColor Cyan
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
