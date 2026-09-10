@echo off
REM ===========================================================================
REM EcoSort AI - Windows Complete Automated Training & Evaluation Pipeline
REM ===========================================================================
REM Run this script directly in cmd.exe inside the ml-model folder:
REM cd ml-model
REM run_pipeline.bat
REM ===========================================================================

echo =========================================================================
echo  ECOSORT AI: 9-CLASS WASTE CLASSIFICATION OPTIMIZATION PIPELINE
echo =========================================================================

REM 1. Create and activate Python Virtual Environment
if not exist "venv" (
    echo [1/8] Creating Python virtual environment (venv)...
    python -m venv venv
)
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM 2. Install dependencies
echo [2/8] Installing production requirements...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM 3. Dataset Quality Inspection (generates dataset_report.json)
echo [3/8] Running Dataset Quality & Integrity Inspection...
python dataset_quality.py

REM 4. Leakage-Free Stratified Splitting (70%% Train / 15%% Val / 15%% Test)
echo [4/8] Running Stratified Leakage-Free Data Split...
python prepare_dataset.py

REM 5. Model Training & Comparison Experiments (MobileNetV3, EfficientNetB0, EfficientNetV2B0)
echo [5/8] Training Two-Stage Transfer Learning Models & Logging Experiments...
python train.py --compare-all

REM 6. Confidence Calibration & Temperature Scaling
echo [6/8] Performing Confidence Calibration on Validation Set...
python calibration.py

REM 7. Evaluation on Untouched Test Set
echo [7/8] Evaluating Best Model on Completely Untouched Test Split...
python evaluate.py

REM 8. Real-World Smartphone & OOD Evaluation
echo [8/8] Evaluating Real-World Smartphone Photos & OOD Object Rejection...
python test_real_world.py

echo =========================================================================
echo  PIPELINE COMPLETE! Artifacts generated:
echo   - dataset_report.json
echo   - training_experiments.csv
echo   - model/best_model.keras
echo   - model/calibration.json
echo   - evaluation_results/ (plots, confusion matrix, classification report)
echo =========================================================================
echo Starting FastAPI inference microservice at http://localhost:8000...
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
pause
