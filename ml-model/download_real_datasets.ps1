# EcoSort AI - Dataset Downloader & Ingestion Script (PowerShell for Windows)
# ==========================================================================
# Downloads and organizes real waste image files for EcoSort AI 9 classes.

$DatasetDir = Join-Path $PSScriptRoot "dataset"
$Classes = @("plastic", "paper", "cardboard", "glass", "metal", "organic", "e_waste", "hazardous", "other")

foreach ($c in $Classes) {
    $path = Join-Path $DatasetDir $c
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🚀 EcoSort AI: Automatic Real Waste Dataset Ingestion (PowerShell)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. TrashNet
Write-Host "📦 1/4: Ingesting Stanford TrashNet..." -ForegroundColor Yellow
$TrashNetZip = Join-Path $env:TEMP "trashnet.zip"
$TrashNetUrl = "https://raw.githubusercontent.com/garythung/trashnet/master/data/dataset-resized.zip"
if (-not (Test-Path $TrashNetZip)) {
    Invoke-WebRequest -Uri $TrashNetUrl -OutFile $TrashNetZip
}
$ExtractDir = Join-Path $env:TEMP "trashnet_extracted"
Expand-Archive -Path $TrashNetZip -DestinationPath $ExtractDir -Force
$SubFolders = @{ "glass"="glass"; "paper"="paper"; "cardboard"="cardboard"; "plastic"="plastic"; "metal"="metal"; "trash"="other" }
foreach ($k in $SubFolders.Keys) {
    $src = Join-Path $ExtractDir "dataset-resized" $k
    $dst = Join-Path $DatasetDir $SubFolders[$k]
    if (Test-Path $src) {
        Get-ChildItem -Path $src -Filter "*.jpg" | ForEach-Object {
            Copy-Item -Path $_.FullName -Destination (Join-Path $dst ("trashnet_" + $_.Name)) -Force
        }
    }
}
Write-Host "✅ TrashNet ingested." -ForegroundColor Green

# 2. RealWaste Food Organics & Miscellaneous Trash
Write-Host "🍏 2/4: Ingesting RealWaste Organics and Miscellaneous Trash..." -ForegroundColor Yellow
$OrgDir = Join-Path $DatasetDir "organic"
for ($i = 1; $i -le 411; $i++) {
    $url = "https://raw.githubusercontent.com/sam-single/realwaste/main/RealWaste/Food%20Organics/Food%20Organics_$i.jpg"
    $out = Join-Path $OrgDir "realwaste_food_organics_$i.jpg"
    if (-not (Test-Path $out)) {
        try { Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 10 -ErrorAction SilentlyContinue } catch {}
    }
}
$OtherDir = Join-Path $DatasetDir "other"
for ($i = 1; $i -le 250; $i++) {
    $url = "https://raw.githubusercontent.com/sam-single/realwaste/main/RealWaste/Miscellaneous%20Trash/Miscellaneous%20Trash_$i.jpg"
    $out = Join-Path $OtherDir "realwaste_misc_$i.jpg"
    if (-not (Test-Path $out)) {
        try { Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 10 -ErrorAction SilentlyContinue } catch {}
    }
}
Write-Host "✅ RealWaste ingested." -ForegroundColor Green

# 3. TrashBox E-Waste
Write-Host "⚡ 3/4: Ingesting TrashBox E-Waste (Cables & Chips)..." -ForegroundColor Yellow
$EwasteDir = Join-Path $DatasetDir "e_waste"
for ($i = 0; $i -lt 250; $i++) {
    $url = "https://raw.githubusercontent.com/nikhilvenkatkumsetty/TrashBox/main/TrashBox_train_dataset_subfolders/e-waste/electrical%20cables/electrical_cables%20$i.jpg"
    $out = Join-Path $EwasteDir "trashbox_cable_$i.jpg"
    if (-not (Test-Path $out)) {
        try { Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 10 -ErrorAction SilentlyContinue } catch {}
    }
}
Write-Host "✅ TrashBox E-Waste ingested." -ForegroundColor Green

# 4. Singapore Battery Dataset
Write-Host "🔋 4/4: Ingesting Singapore Battery Dataset into hazardous/..." -ForegroundColor Yellow
$HazDir = Join-Path $DatasetDir "hazardous"
$BatClone = Join-Path $env:TEMP "singapore_battery"
if (-not (Test-Path $BatClone)) {
    git clone --depth 1 https://github.com/FriedrichZhao/Singapore_Battery_Dataset.git $BatClone
}
if (Test-Path $BatClone) {
    Get-ChildItem -Path $BatClone -Recurse -Include *.jpg,*.jpeg,*.png | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination (Join-Path $HazDir ("battery_" + $_.Name)) -Force
    }
}
Write-Host "✅ Singapore Battery Dataset ingested." -ForegroundColor Green

Write-Host "`n📊 Ingestion Complete! Running Python verification..." -ForegroundColor Cyan
python (Join-Path $PSScriptRoot "prepare_dataset.py")
