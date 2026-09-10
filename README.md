# 🌍 EcoSort AI — Intelligent Waste Identification & Segregation Assistant

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fecosort-ai&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20Key%20from%20Google%20AI%20Studio&envLink=https%3A%2F%2Faistudio.google.com%2Fapp%2Fapikey)
![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css&logoColor=white)
![Vercel Ready](https://img.shields.io/badge/Vercel-Serverless%20Ready-000000?logo=vercel&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?logo=pytorch&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

EcoSort AI is an intelligent, multimodal waste classification web application and machine learning pipeline that empowers individuals, institutions, and municipalities to sort waste responsibly, divert recyclables from landfills, and reduce their carbon footprint.

---

## ✨ Key Features

- 📸 **Multimodal Vision Scanner**: Capture camera photos or upload images of waste items for instant categorization across **9 municipal waste streams** (Plastic, Paper, Cardboard, Glass, Metal, Organic/Food, E-Waste, Hazardous, and Other/Landfill).
- 🏷️ **Comprehensive Segregation Intelligence**: Step-by-step preparation guidelines (rinse, peel labels, tape battery terminals), container bin color mapping, confidence score, and estimated carbon emissions prevented ($kg\ \text{CO}_2\text{e}$).
- 💬 **RAG-Powered Eco Assistant**: Natural language chat interface grounded in a curated waste management knowledge base for complex questions (e.g. greasy pizza boxes, broken ceramics, aerosol cans).
- ⚡ **Dual-Engine Architecture**:
  - **Cloud AI Engine**: Server-side Google Gemini 3.1 Flash / Flash-Lite via `@google/genai` with rate-limit cooldowns and resilient fallback segregation.
  - **Local Machine Learning Engine**: Pre-trained PyTorch MobileNetV3 / EfficientNet deep learning models with FastAPI serving endpoints.
- 📱 **Mobile & Desktop First**: Responsive UI with dark/light themes, offline localStorage caching, confetti rewards for positive recycling habits, and audio disposal guidance cues.

---

## 🚀 Instant Deployment: Deploy to Vercel in 2 Minutes

This repository is **100% pre-configured for Vercel** out of the box with zero additional configuration needed.

### Option 1: One-Click Deploy Button
Click the **Deploy with Vercel** button above. Vercel will clone this repository to your GitHub account and prompt you for the `GEMINI_API_KEY`.

### Option 2: Deploy from your GitHub Repository
1. **Push this repo to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for EcoSort AI"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository.
   - Vercel automatically detects **Vite** framework settings:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`
3. **Add Environment Variable**:
   - In the Vercel project configuration screen, add:
     - **Name**: `GEMINI_API_KEY`
     - **Value**: Your Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)
4. **Click Deploy**:
   Vercel will compile the Vite frontend to global edge CDN and deploy serverless functions in `/api`.

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: v20 or higher
- **npm** or **bun** / **pnpm**
- (Optional for ML model): **Python**: 3.10+ with `pip`

### 2. Clone & Install
```bash
git clone https://github.com/<your-username>/ecosort-ai.git
cd ecosort-ai

# Install frontend and server dependencies
npm install
```

### 3. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at **`http://localhost:3000`**.

---

## 🛠️ Vercel Architecture Highlights

- **Catch-All & Specific Serverless Functions (`api/`)**:
  - `api/analyze-waste.ts`: Multimodal vision classification endpoint.
  - `api/chat.ts`: RAG-grounded conversational segregation advisor.
  - `api/health.ts`: Backend service health check.
  - `api/[...path].ts`: Serverless catch-all handler forwarding dynamic routes to the Express application.
- **`vercel.json` SPA Routing**:
  ```json
  {
    "version": 2,
    "framework": "vite",
    "cleanUrls": true,
    "rewrites": [
      { "source": "/api/(.*)", "destination": "/api/$1" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **Smartphone Photo Canvas Compression**: High-resolution smartphone camera pictures (5–12MB) are automatically resized client-side via HTML5 canvas downsampling to ~1024px JPEGs (~150KB), staying well below Vercel's 4.5MB Serverless Function payload limit.
- **Dual-Mode Startup**: Operates as a standalone Express server on port 3000 for local development and Cloud Run, while cleanly exporting the handler for Vercel Serverless Functions.

---

## 🧠 Machine Learning Model Pipeline (`ml-model/`)

The repository includes an end-to-end deep learning pipeline for on-device or microservice waste classification across 9 classes:

```
ml-model/
├── download_real_datasets.py   # Ingestion script for Stanford TrashNet, RealWaste & TrashBox
├── prepare_dataset.py          # Data validation, image integrity check & 70/15/15 stratified splits
├── train.py                    # Transfer learning training script (MobileNetV3 / EfficientNet)
├── evaluate.py                 # Generates confusion matrices, classification reports & charts
├── predict.py                  # CLI single/batch inference with 60% confidence thresholding
├── api.py                      # Production FastAPI inference microservice
├── class_names.json            # 9 classes with disposal rules & bin assignments
└── requirements.txt            # PyTorch, Torchvision, Albumentations, FastAPI
```

### 1. Download Public Benchmark Datasets
```bash
cd ml-model
pip install -r requirements.txt
python download_real_datasets.py --all
```

### 2. Validate & Split Dataset
```bash
python prepare_dataset.py
```

### 3. Train Model
```bash
python train.py --model mobilenet_v3 --epochs 15 --batch-size 32
```

### 4. Launch Local FastAPI ML Microservice
```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
Once running, EcoSort AI will automatically detect the local ML service at `http://127.0.0.1:8000` and allow side-by-side comparison with Gemini Vision.

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning backend status and API key availability |
| `POST` | `/api/analyze-waste` | Multimodal waste image analysis (Base64 JPEG/PNG input) |
| `POST` | `/api/chat` | RAG-grounded conversational waste segregation assistant |
| `GET` | `/api/ml/status` | Verifies connectivity with local Python FastAPI ML service |
| `POST` | `/api/ml/classify` | Performs classification directly through the local PyTorch model |

---

## 📂 Project Structure

```
├── .github/
│   ├── workflows/ci.yml         # Automated GitHub Actions test & build verification
│   ├── ISSUE_TEMPLATE/          # Structured bug report & feature request templates
│   └── PULL_REQUEST_TEMPLATE.md # Standard PR checklist
├── api/                         # Vercel Serverless Function entry points
│   ├── analyze-waste.ts
│   ├── chat.ts
│   ├── health.ts
│   ├── index.ts
│   └── [...path].ts
├── ml-model/                    # PyTorch machine learning pipeline & FastAPI service
├── src/
│   ├── components/              # React UI components (Scanner, History, Stats, Chat)
│   ├── services/                # Knowledge base, local storage & Gemini client integration
│   ├── types.ts                 # TypeScript data contracts & waste categories
│   ├── App.tsx                  # Main application orchestrator
│   └── main.tsx                 # React DOM mount point
├── .env.example                 # Environment variables specification
├── .gitignore                   # Git ignore for Node, Python, and Vercel artifacts
├── package.json                 # Scripts and dependencies
├── server.ts                    # Full-stack Express server with Vite middleware
├── tsconfig.json                # TypeScript compiler configuration
├── vercel.json                  # Vercel deployment configuration & routing rules
└── vite.config.ts               # Vite bundler configuration
```

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are warmly welcomed!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
