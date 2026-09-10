#!/usr/bin/env python3
"""
EcoSort AI - Public Benchmark Waste Dataset Downloader
======================================================
Automates downloading, organizing, and validating real waste image datasets
for all 9 categories:
1. plastic     <- Stanford TrashNet (482 images)
2. paper       <- Stanford TrashNet (594 images)
3. cardboard   <- Stanford TrashNet (403 images)
4. glass       <- Stanford TrashNet (501 images)
5. metal       <- Stanford TrashNet (410 images)
6. organic     <- RealWaste Food Organics (411 images)
7. e_waste     <- TrashBox E-Waste (cables & chips)
8. hazardous   <- Singapore Battery Dataset / medical sharps
9. other       <- TrashNet Trash (137 images) + RealWaste Misc (250 images)

Usage:
    python download_real_datasets.py --help
    python download_real_datasets.py --trashnet
    python download_real_datasets.py --all
    python download_real_datasets.py --quick-sample
"""

import os
import sys
import shutil
import zipfile
import argparse
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
TMP_DIR = BASE_DIR / ".tmp_downloads"

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


def ensure_dirs():
    """Ensure all target class directories exist."""
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    for c in CLASSES:
        (DATASET_DIR / c).mkdir(parents=True, exist_ok=True)


def download_with_progress(url, dest_path, description="File"):
    """Download a file with user-friendly progress reporting."""
    print(f"⬇️  Downloading {description}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=60) as response, open(dest_path, "wb") as out_file:
            total_size = int(response.info().get("Content-Length", 0))
            downloaded = 0
            block_size = 1024 * 64

            while True:
                buffer = response.read(block_size)
                if not buffer:
                    break
                out_file.write(buffer)
                downloaded += len(buffer)
                if total_size > 0:
                    percent = downloaded * 100 / total_size
                    mb_down = downloaded / (1024 * 1024)
                    mb_total = total_size / (1024 * 1024)
                    sys.stdout.write(f"\r   [{percent:5.1f}%] {mb_down:6.1f} MB / {mb_total:6.1f} MB")
                    sys.stdout.flush()
            print("\n   ✅ Download complete!")
        return True
    except Exception as e:
        print(f"\n   ❌ Failed to download {url}: {e}")
        return False


def ingest_trashnet():
    """
    Ingests Stanford TrashNet dataset:
    - glass: ~501
    - paper: ~594
    - cardboard: ~403
    - plastic: ~482
    - metal: ~410
    - trash -> mapped to 'other': ~137
    """
    print("\n" + "=" * 60)
    print("📦 1. Stanford TrashNet Dataset (Plastic, Paper, Cardboard, Glass, Metal, Other)")
    print("=" * 60)

    zip_url = "https://raw.githubusercontent.com/garythung/trashnet/master/data/dataset-resized.zip"
    zip_dest = TMP_DIR / "trashnet.zip"

    if not zip_dest.exists() or zip_dest.stat().st_size < 1000000:
        success = download_with_progress(zip_url, zip_dest, "Stanford TrashNet Archive (approx 40 MB)")
        if not success:
            print("⚠️ TrashNet download failed. Check network connection.")
            return

    print("📂 Extracting Stanford TrashNet images into categorized folders...")
    mapping = {
        "glass": "glass",
        "paper": "paper",
        "cardboard": "cardboard",
        "plastic": "plastic",
        "metal": "metal",
        "trash": "other",
    }
    extracted_counts = {k: 0 for k in mapping.values()}

    try:
        with zipfile.ZipFile(zip_dest, "r") as z:
            for item in z.namelist():
                if item.startswith("dataset-resized/") and item.endswith(".jpg"):
                    parts = item.split("/")
                    if len(parts) >= 3:
                        source_cat = parts[1]
                        filename = parts[2]
                        if source_cat in mapping:
                            target_class = mapping[source_cat]
                            dest_file = DATASET_DIR / target_class / f"trashnet_{filename}"
                            if not dest_file.exists():
                                with z.open(item) as src, open(dest_file, "wb") as dst:
                                    dst.write(src.read())
                                extracted_counts[target_class] += 1
        
        print("✅ TrashNet Extracted:")
        for cls, count in extracted_counts.items():
            print(f"   • {cls.ljust(12)}: +{count} images")
    except Exception as e:
        print(f"❌ Error extracting TrashNet: {e}")


def ingest_realwaste_organics(max_count=411):
    """
    Ingests RealWaste food organic images:
    - 411 high quality images of food organics, peels, plate waste
    """
    print("\n" + "=" * 60)
    print("🍏 2. RealWaste Food Organics (Wet / Organic Waste)")
    print("=" * 60)
    dest_dir = DATASET_DIR / "organic"
    dest_dir.mkdir(parents=True, exist_ok=True)

    base_url = "https://raw.githubusercontent.com/sam-single/realwaste/main/RealWaste/Food%20Organics"
    count = 0
    for i in range(1, max_count + 1):
        filename = f"realwaste_food_organics_{i}.jpg"
        dest_file = dest_dir / filename
        if dest_file.exists():
            continue
        url = f"{base_url}/Food%20Organics_{i}.jpg"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "EcoSortAI/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp, open(dest_file, "wb") as f:
                f.write(resp.read())
            count += 1
            if count % 25 == 0:
                print(f"   • Ingested {count} organic images...")
        except Exception:
            pass
    print(f"✅ Organic: added {count} real food images.")


def ingest_trashbox_ewaste(max_count=200):
    """
    Ingests e-waste (cables, circuit boards, components) from TrashBox.
    """
    print("\n" + "=" * 60)
    print("⚡ 3. TrashBox E-Waste (Cables & Components)")
    print("=" * 60)
    dest_dir = DATASET_DIR / "e_waste"
    dest_dir.mkdir(parents=True, exist_ok=True)

    base_url = "https://raw.githubusercontent.com/nikhilvenkatkumsetty/TrashBox/main/TrashBox_train_dataset_subfolders/e-waste"
    count = 0
    for i in range(max_count):
        filename = f"trashbox_cable_{i}.jpg"
        dest_file = dest_dir / filename
        if dest_file.exists():
            continue
        url = f"{base_url}/electrical%20cables/electrical_cables%20{i}.jpg"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "EcoSortAI/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp, open(dest_file, "wb") as f:
                f.write(resp.read())
            count += 1
            if count % 25 == 0:
                print(f"   • Ingested {count} e-waste items...")
        except Exception:
            pass
    print(f"✅ E-Waste: added {count} electronic waste images.")


def ingest_singapore_batteries():
    """
    Clones or downloads Singapore Battery Dataset into 'hazardous'.
    """
    print("\n" + "=" * 60)
    print("🔋 4. Singapore Battery Dataset (Hazardous Waste)")
    print("=" * 60)
    dest_dir = DATASET_DIR / "hazardous"
    dest_dir.mkdir(parents=True, exist_ok=True)

    clone_dir = TMP_DIR / "singapore_battery"
    if not clone_dir.exists():
        print("📥 Cloning Singapore Battery Dataset repository...")
        ret = os.system(f"git clone --depth 1 https://github.com/FriedrichZhao/Singapore_Battery_Dataset.git {clone_dir}")
        if ret != 0:
            print("⚠️ Git clone failed. Check git installation or network.")
            return

    copied = 0
    for sub in clone_dir.iterdir():
        if sub.is_dir() and not sub.name.startswith("."):
            for img in sub.glob("*.*"):
                if img.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    dest = dest_dir / f"battery_{sub.name}_{img.name}"
                    if not dest.exists():
                        try:
                            shutil.copy2(img, dest)
                            copied += 1
                        except Exception:
                            pass
    print(f"✅ Hazardous: copied {copied} battery images into dataset/hazardous/.")


def print_summary():
    """Print current image counts per class."""
    print("\n" + "=" * 60)
    print("📊 CURRENT DATASET STATUS BY CATEGORY")
    print("=" * 60)
    total = 0
    for c in CLASSES:
        folder = DATASET_DIR / c
        if folder.exists():
            images = [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]
            total += len(images)
            print(f"   • {c.ljust(14)}: {len(images):5d} images")
    print("-" * 60)
    print(f"   TOTAL           : {total:5d} images")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Download real public benchmark waste datasets for EcoSort AI")
    parser.add_argument("--all", action="store_true", help="Download and ingest all benchmark datasets")
    parser.add_argument("--trashnet", action="store_true", help="Download Stanford TrashNet (Plastic, Paper, Cardboard, Glass, Metal, Trash)")
    parser.add_argument("--organics", action="store_true", help="Download RealWaste Organics (411 food items)")
    parser.add_argument("--ewaste", action="store_true", help="Download TrashBox E-Waste (cables & components)")
    parser.add_argument("--batteries", action="store_true", help="Download Singapore Battery Dataset (hazardous)")
    parser.add_argument("--summary", action="store_true", help="Display summary of current dataset files")

    args = parser.parse_args()

    ensure_dirs()

    # Default to running all if no specific flag provided
    if not (args.all or args.trashnet or args.organics or args.ewaste or args.batteries or args.summary):
        print("ℹ️ No specific flag specified. Ingesting Stanford TrashNet (most comprehensive foundation)...")
        ingest_trashnet()
        print("\nTip: Run `python download_real_datasets.py --all` to download all 4 public benchmarks.")
    else:
        if args.trashnet or args.all:
            ingest_trashnet()
        if args.organics or args.all:
            ingest_realwaste_organics()
        if args.ewaste or args.all:
            ingest_trashbox_ewaste()
        if args.batteries or args.all:
            ingest_singapore_batteries()

    print_summary()
    print("\n💡 Next step: Run `python prepare_dataset.py` to validate images, remove duplicates, and generate splits.")


if __name__ == "__main__":
    main()
