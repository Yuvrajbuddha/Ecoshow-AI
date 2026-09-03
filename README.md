# EcoSort AI — Waste Identification & Segregation Assistant

EcoSort AI is an intelligent, multimodal waste classification application that helps people sort waste responsibly, divert recyclable and compostable materials from landfills, and reduce their carbon footprint.

---

## 🚀 Deploying to GitHub & Vercel

This repository is pre-configured to be **100% Vercel-ready** with a dual-execution architecture:
1. **Frontend**: Vite + React 19 SPA built into `dist/` and served via Vercel's global Edge CDN.
2. **Backend API**: Node.js Serverless Functions in the `api/` directory (`api/index.ts`, `api/analyze-waste.ts`, `api/chat.ts`, `api/health.ts`) utilizing the official `@google/genai` SDK.

### Step 1: Push to GitHub
1. Initialize or push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "feat: complete EcoSort AI with Vercel serverless support"
   git push origin main
   ```

### Step 2: Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your imported GitHub repository.
3. Vercel will automatically detect **Vite** as the framework preset:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables
In the Vercel project import screen (or under **Settings > Environment Variables**), add:
- **Key**: `GEMINI_API_KEY`
- **Value**: Your Google Gemini API Key (get one from [Google AI Studio](https://aistudio.google.com/))

*(Note: The server also recognizes `GOOGLE_API_KEY` or `VITE_GEMINI_API_KEY` if you already use those names).*

### Step 4: Click Deploy
Vercel will build the frontend assets, deploy the serverless functions in `/api`, and provide your live production URL (e.g. `https://your-app.vercel.app`).

---

## 🛠️ Architecture Highlights for Vercel

- **Zero-Config Routing (`vercel.json`)**: Configured with single-page application fallback so browser refreshes on subroutes work without 404s, while `/api/*` is routed to the serverless function handler.
- **Resilient Request Body Handling**: Express body parsing is safeguarded against pre-parsed request streams, preventing standard Vercel serverless gateway timeouts.
- **Smartphone Photo Optimization**: Automatic client-side canvas downsampling via `imageOptimizer.ts` scales photos to ~1024px JPEGs (80–180KB), safely below Vercel's 4.5MB serverless payload limit.
- **Dual-Mode Startup**: Operates as a standalone HTTP server on port 3000 during local development and Cloud Run containers, and seamlessly exports as serverless functions when deployed on Vercel.
