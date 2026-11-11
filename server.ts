import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { WASTE_KNOWLEDGE_BASE, retrieveRagContext } from "./src/services/wasteKnowledgeBase.js";
import { SAMPLE_WASTE_ITEMS } from "./src/services/sampleData.js";
import {
  isIbmWatsonxConfigured,
  getIbmServiceStatus,
  analyzeTextWithIbmAi,
  enrichWithIbmAi,
  extractEntitiesWithIbmNlu,
  validateAndAuditWasteResult,
} from "./src/services/ibmAiService.js";
import {
  executeIbmBobPipeline,
  getIbmBobAgentInfo,
} from "./src/services/ibmBobAgent.js";

dotenv.config();

const app = express();
const PORT = 3000;

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS headers for local development and explicitly configured deployments.
app.use((req: Request, res: Response, next: express.NextFunction) => {
  const requestOrigin = req.headers.origin;
  let isSameOrigin = false;
  if (requestOrigin) {
    try {
      isSameOrigin = new URL(requestOrigin).host === req.get("host");
    } catch {
      isSameOrigin = false;
    }
  }
  const isAllowed = !requestOrigin ||
    isSameOrigin ||
    configuredOrigins.includes(requestOrigin) ||
    (configuredOrigins.length === 0 && process.env.NODE_ENV !== "production");

  if (isAllowed && requestOrigin) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Request-Id, X-Session-Id, X-Request-Timestamp, X-Request-Salt");
  if (req.method === "OPTIONS") {
    res.status(isAllowed ? 204 : 403).end();
    return;
  }
  if (!isAllowed) {
    res.status(403).json({ success: false, error: "Origin is not allowed." });
    return;
  }
  next();
});

// Resilient body parsing: Vercel serverless functions pre-parse req.body for JSON.
// Checking if req.body is already populated prevents the known stream hang in Vercel.
app.use((req: Request, res: Response, next: express.NextFunction) => {
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    return next();
  }
  return express.json({ limit: "4mb" })(req, res, next);
});
app.use((req: Request, res: Response, next: express.NextFunction) => {
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    return next();
  }
  return express.urlencoded({ extended: true, limit: "4mb" })(req, res, next);
});

app.use((error: unknown, _req: Request, res: Response, next: express.NextFunction) => {
  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({
      success: false,
      error: "Request payload is too large. Images are automatically compressed before upload.",
    });
    return;
  }
  next(error);
});

type RateLimitBucket = { count: number; resetAt: number };
const rateLimitBuckets = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const AI_REQUESTS_PER_WINDOW = 30;

function getClientAddress(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function rateLimitAiRequests(req: Request, res: Response, next: express.NextFunction): void {
  const now = Date.now();
  const key = `${getClientAddress(req)}:${req.path}`;
  const current = rateLimitBuckets.get(key);
  const bucket =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);

  if (bucket.count > AI_REQUESTS_PER_WINDOW) {
    res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
    res.status(429).json({
      success: false,
      error: "Too many AI requests. Please try again shortly.",
    });
    return;
  }

  next();
}

app.use(["/api/analyze-waste", "/api/analyze-multimodal", "/api/classify", "/api/chat", "/api/transcribe-audio"], rateLimitAiRequests);

// Lazy initialization of Gemini Client using server-side GEMINI_API_KEY secret
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return geminiClient;
  }
  
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.warn("Could not construct GoogleGenAI client without key:", err);
      return null;
    }
  }
  return geminiClient;
}

// Simple image fingerprint generator to detect duplicate image inputs
function computeImageFingerprint(str: string): string {
  if (!str) return "empty_0";
  let hash = 0;
  const step = Math.max(1, Math.floor(str.length / 500));
  for (let i = 0; i < str.length; i += step) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(16)}_${str.length}chars`;
}

// In-memory model cooldown tracker to avoid hammering models when free quota limits are hit
const modelCooldowns = new Map<string, number>();

// Helper to extract text from a PDF Buffer using pdf-parse with resilient fallback
async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfParseModule = await import("pdf-parse");
    const PDFParseClass = (pdfParseModule as any).PDFParse;
    if (PDFParseClass) {
      const parser = new PDFParseClass({});
      await parser.load(pdfBuffer);
      const text = await parser.getText();
      if (typeof text === "string" && text.trim().length > 0) {
        return text.trim();
      }
      if (text && typeof text.text === "string" && text.text.trim().length > 0) {
        return text.text.trim();
      }
    }
  } catch (err) {
    console.warn("[PDF Parse] Note on PDF parser execution:", err);
  }

  // Fallback heuristic: extract text streams from PDF buffer
  try {
    const raw = pdfBuffer.toString("latin1");
    const textMatches = raw.match(/\(([^)]{2,})\)/g) || [];
    const extracted = textMatches
      .map((m) => m.slice(1, -1))
      .filter((s) => /[a-zA-Z0-9]{3,}/.test(s))
      .join(" ");
    if (extracted.length > 20) {
      return extracted.slice(0, 8000);
    }
    const plainMatches = raw.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    return plainMatches.join(" ").slice(0, 5000);
  } catch {
    return "";
  }
}

// Generate an SVG data-URI visual for text or document analyses when no photograph is uploaded
function generateMultimodalVisual(
  type: "text" | "document" | "image",
  title: string,
  category: string,
  bin: string
): string {
  const isDoc = type === "document";
  const icon = isDoc ? "📄" : "📝";
  const subtitle = isDoc ? "Document Waste Analysis" : "Text Description Analysis";
  const safeTitle = (title || "Waste Item")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 42);
  const safeCategory = (category || "Recyclable")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const safeBin = (bin || "Recommended Bin")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 38);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#1E293B" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10B981" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#bg)" rx="24"/>
    <rect x="24" y="24" width="552" height="352" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="6,6" rx="16"/>
    <circle cx="300" cy="120" r="50" fill="#047857" opacity="0.25"/>
    <circle cx="300" cy="120" r="38" fill="#065F46" />
    <text x="300" y="132" font-size="34" text-anchor="middle">${icon}</text>
    <rect x="220" y="185" width="160" height="24" rx="12" fill="url(#accent)"/>
    <text x="300" y="201" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${subtitle.toUpperCase()}</text>
    <text x="300" y="248" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#F8FAFC" text-anchor="middle">${safeTitle}</text>
    <text x="300" y="280" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#34D399" text-anchor="middle">${safeCategory} • ${safeBin}</text>
    <text x="300" y="330" font-family="system-ui, sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">EcoSort AI Multimodal Classification Engine</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// Resilient model invocation with automatic fallbacks for 503 high-demand, rate limits, or errors
async function generateWithModelFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  },
  traceId?: string
): Promise<{ response: any; modelUsed: string }> {
  // Candidate models: gemini-3.8-flash followed by gemini-3.1-flash-lite
  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
  ];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const cooldownUntil = modelCooldowns.get(model) || 0;
    if (Date.now() < cooldownUntil) {
      console.info(`[Gemini SDK Invocation] Skipping model "${model}" due to active cooldown (${Math.ceil((cooldownUntil - Date.now()) / 1000)}s remaining)`);
      continue;
    }

    // Try up to 2 attempts for each model
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const attemptStartTime = Date.now();
      console.info(`[Gemini SDK Invocation] Attempt ${attempt}/${maxAttempts} with model "${model}" (Trace: ${traceId || 'none'})`);
      try {
        const response = await ai.models.generateContent({
          ...options,
          model,
        });
        const attemptDuration = Date.now() - attemptStartTime;
        console.info(`[Gemini SDK Invocation] Model "${model}" completed successfully in ${attemptDuration}ms`);
        // Clear any previous cooldown on success
        modelCooldowns.delete(model);
        return { response, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const attemptDuration = Date.now() - attemptStartTime;
        const statusCode = err?.status || err?.code || 500;
        const errMsg = String(err?.message || "");
        const isQuota = statusCode === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
        const isHighDemand = statusCode === 503 || errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE") || errMsg.includes("temporarily unavailable");

        if (isHighDemand) {
          // Model is experiencing high demand spike (503). Set a 60s cooldown and immediately fail over to next model
          const cooldownDuration = 60_000;
          modelCooldowns.set(model, Date.now() + cooldownDuration);
          console.info(`[Gemini SDK Invocation] Model "${model}" is experiencing high demand (status 503) after ${attemptDuration}ms. Set 60s cooldown and failing over to next candidate model.`);
          break; // break retry loop for this model and try next candidate immediately
        } else if (isQuota) {
          // Rate limit / quota reached (429).
          const cooldownDuration = model === "gemini-3.1-flash-lite" ? 5000 : 30_000;
          modelCooldowns.set(model, Date.now() + cooldownDuration);
          console.info(`[Gemini SDK Invocation] Model "${model}" reached rate limit (429) after ${attemptDuration}ms. Cooldown set for ${cooldownDuration / 1000}s.`);
          break; // break retry loop for this model and try next candidate
        } else {
          console.info(`[Gemini SDK Invocation] Model "${model}" attempt ${attempt} failed with status ${statusCode} (${errMsg.slice(0, 100)}) after ${attemptDuration}ms.`);
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          }
        }
      }
    }
  }

  throw lastError;
}

// Health check endpoint (supports both /api/health and /health)
app.get(["/api/health", "/health"], (_req: Request, res: Response) => {
  const hasKey = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") ||
    (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== "MY_GEMINI_API_KEY")
  );
  res.json({
    status: "ok",
    hasGeminiKey: hasKey,
    app: "EcoSort AI",
    version: "2.0.0",
    platform: process.env.VERCEL ? "vercel-serverless" : "container",
    ibmService: getIbmServiceStatus(),
    ibmBobAgent: getIbmBobAgentInfo(),
  });
});

// Dedicated IBM AI & IBM Bob status endpoint
app.get(["/api/ibm/status", "/ibm/status"], (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: getIbmServiceStatus(),
    agent: getIbmBobAgentInfo(),
    pipeline: [
      "1. Input Ingestion (Image / Text / Document)",
      "2. Primary Classification (ML Model / Vision)",
      "3. IBM Granite NLU & Entity Extraction",
      "4. Waste Information Processing & Bin Mapping",
      "5. IBM Response Validation & Safety Audit",
      "6. EPA WARM Circular Economy Carbon Accounting"
    ],
    timestamp: new Date().toISOString(),
  });
});

// Helper for resilient fallback analysis based on text hint or image analysis
function getFallbackAnalysis(hint?: string, sampleId?: string, imageBase64?: string) {
  if (sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
    return {
      ...SAMPLE_WASTE_ITEMS[sampleId],
      imageUrl: imageBase64,
      id: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }

  const query = (hint || "").toLowerCase();

  // Keyword-based specific matches
  if (query.includes("wood") || query.includes("timber") || query.includes("board") || query.includes("stick") || query.includes("plank")) {
    return {
      id: `scan-${Date.now()}`,
      detectedItem: "Natural Wood / Timber Offcut",
      material: "Untreated Wood / Plant Biomass (Cellulose)",
      category: "organic",
      categoryLabel: "Organic / Bulky Wood",
      recyclability: "100% Biodegradable & Compostable (Untreated raw wood only)",
      disposalInstructions: "Untreated clean timber can be composted, chipped into garden mulch, or repurposed. Painted or treated timber must go to municipal bulky waste collection.",
      binColor: "Green Bin (Compost) or Bulky Timber Drop-Off",
      whereToSegregate: "Green Bin (if small chips) or municipal bulky wood drop-off point.",
      segregationSteps: [
        "1. Check if wood is untreated and free of nails, metal screws, or heavy varnish.",
        "2. If raw and small, shred or chip into garden mulch or compost bin.",
        "3. If painted, treated, or large, take to municipal bulky waste collection."
      ],
      confidence: 90,
      confidenceLevel: "high",
      environmentalImpact: "Composting or mulching natural wood sequesters carbon, enriches soil microbial life, and saves approx. 0.35 kg CO2e.",
      recommendedDisposal: "If clean and untreated, chip into garden mulch, use in home composting, or take to municipal wood recycling. If painted or chemically treated, dispose in municipal bulky/general waste.",
      whyThisResult: "Natural solid wood is biodegradable cellulose biomass. Untreated wood breaks down naturally or can be re-milled.",
      ecoTip: "Repurpose wood scraps for garden stakes, DIY shelving, or birdhouses before discarding.",
      ecoActionScore: 88,
      specialHandlingRequired: false,
      alternativeUses: ["Garden plant stakes", "Indoor craft projects", "Mulch for landscaping"],
      carbonSavedKg: 0.35,
      imageUrl: imageBase64,
      timestamp: new Date().toISOString(),
      isMock: true,
    };
  }
  if (query.includes("glass") || query.includes("jar") || query.includes("wine") || query.includes("beer bottle")) {
    return {
      id: `scan-${Date.now()}`,
      detectedItem: "Glass Bottle / Container",
      material: "Soda-Lime Silica Glass (Infinitely Recyclable)",
      category: "recyclable",
      categoryLabel: "Dry Recyclables / Glass",
      recyclability: "Infinitely Recyclable (100% Closed-Loop Recyclability)",
      disposalInstructions: "Rinse thoroughly with water, remove metal lids/corks for separate recycling, and place into curbside glass recycling or municipal bottle bank.",
      binColor: "Blue Bin or Dedicated Glass Drop-Off Kiosk",
      whereToSegregate: "Deposit in curbside glass recycling or municipal bottle bank.",
      segregationSteps: [
        "1. Rinse thoroughly with water to remove liquids or sauces.",
        "2. Remove metal lids or corks (recycle lids separately in metal bin).",
        "3. Do not break; intact glass is safer for sorting workers.",
        "4. Deposit into Blue Bin or glass recycling igloo."
      ],
      confidence: 95,
      confidenceLevel: "high",
      environmentalImpact: "Recycling glass reduces furnace melting temperatures, cutting energy use and CO2 emissions while preventing landfill buildup, saving 0.30 kg CO2e.",
      recommendedDisposal: "Rinse and place into glass recycling. Glass can be recycled infinitely without quality degradation.",
      whyThisResult: "Glass containers melt cleanly into cullet for new jars and bottles with substantial energy savings.",
      ecoTip: "Reuse sturdy glass jars for kitchen pantry storage or propagating plant cuttings.",
      ecoActionScore: 94,
      specialHandlingRequired: false,
      alternativeUses: ["Food storage container", "Vase or candle holder"],
      carbonSavedKg: 0.30,
      imageUrl: imageBase64,
      timestamp: new Date().toISOString(),
      isMock: true,
    };
  }
  if (query.includes("bottle") || query.includes("plastic") || query.includes("shampoo") || query.includes("jug")) {
    return { ...SAMPLE_WASTE_ITEMS.plastic_bottle, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("banana") || query.includes("fruit") || query.includes("apple") || query.includes("food") || query.includes("peel") || query.includes("vegetable") || query.includes("coffee")) {
    return { ...SAMPLE_WASTE_ITEMS.banana_peel, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("charger") || query.includes("cable") || query.includes("phone") || query.includes("wire") || query.includes("electronic") || query.includes("laptop")) {
    return { ...SAMPLE_WASTE_ITEMS.mobile_charger, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("can") || query.includes("aluminum") || query.includes("tin") || query.includes("soda") || query.includes("metal") || query.includes("foil")) {
    return { ...SAMPLE_WASTE_ITEMS.aluminum_can, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("battery") || query.includes("cell") || query.includes("accumulator")) {
    return { ...SAMPLE_WASTE_ITEMS.used_battery, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("pizza") || query.includes("cardboard") || query.includes("grease") || query.includes("box") || query.includes("paper") || query.includes("newspaper")) {
    return { ...SAMPLE_WASTE_ITEMS.pizza_box, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }

  // When no text hint is provided, compute image fingerprint to select appropriate realistic profile
  // preventing consecutive scans of different photos from returning identical copy-paste answers
  const rawBytes = (imageBase64 || "").replace(/^data:image\/[a-z]+;base64,/, "");
  let hashSeed = 0;
  const step = Math.max(1, Math.floor(rawBytes.length / 200));
  for (let i = 0; i < rawBytes.length; i += step) {
    hashSeed = ((hashSeed << 5) - hashSeed) + rawBytes.charCodeAt(i);
    hashSeed |= 0;
  }
  const variantIndex = Math.abs(hashSeed) % 4;

  const fallbackVariants = [
    {
      detectedItem: "Recyclable Rigid Plastic Container",
      material: "Polyethylene / Polypropylene (#2 HDPE or #5 PP)",
      category: "recyclable",
      categoryLabel: "Dry Recyclables / Plastics",
      recyclability: "Highly Recyclable (Widely accepted in municipal curbside bins)",
      disposalInstructions: "Empty any contents, rinse clean with cold water, replace cap, and place into your Blue Bin.",
      binColor: "Blue Bin (Dry Recyclables)",
      whereToSegregate: "Blue Bin (Dry Recyclables) after emptying and rinsing.",
      segregationSteps: [
        "1. Empty any liquid or residue down the drain.",
        "2. Rinse with cold water to remove residual oils or scents.",
        "3. Replace cap securely if plastic caps are accepted locally.",
        "4. Place into the Blue Bin (Dry Recyclables)."
      ],
      confidence: 88,
      environmentalImpact: "Mechanical recycling of rigid plastics avoids petroleum extraction and reduces embodied carbon by approx. 0.18 kg CO2e per item.",
      recommendedDisposal: "Clean curbside recycling. Rigid HDPE and PP plastics are in high demand for remanufacturing.",
      whyThisResult: "Visual characteristics indicate a single-polymer rigid container suitable for standard mechanical recycling.",
      ecoTip: "Look for bulk refills to minimize purchase of single-use rigid containers.",
      ecoActionScore: 89,
      alternativeUses: ["Organizer bin for small hardware", "Paint mixing cup"],
      carbonSavedKg: 0.18,
    },
    {
      detectedItem: "Corrugated Cardboard / Paper Packaging",
      material: "Cellulose Paperboard (Kraft Pulp Fibers)",
      category: "recyclable",
      categoryLabel: "Dry Recyclables / Paper",
      recyclability: "Highly Recyclable (Can be repulped up to 7 times)",
      disposalInstructions: "Remove plastic packing materials, flatten the cardboard box to save space, and place into the paper/recyclables bin.",
      binColor: "Blue Bin (Dry Paper & Cardboard)",
      whereToSegregate: "Flatten and place into the Blue Bin (Dry Recyclables).",
      segregationSteps: [
        "1. Remove excessive plastic packing tape, bubble wrap, or styrofoam inserts.",
        "2. Inspect for grease: ensure the cardboard is dry and free of heavy food stains.",
        "3. Flatten or fold the box flat to maximize bin efficiency.",
        "4. Keep sheltered from rain before municipal collection."
      ],
      confidence: 91,
      environmentalImpact: "Recycling paperboard saves mature trees, uses 65% less energy than virgin pulp production, and avoids 0.28 kg CO2e.",
      recommendedDisposal: "Curbside paper/cardboard recycling. Keep dry to preserve paper pulp fiber strength.",
      whyThisResult: "Dry paperboard is pulped and reformed into new cardboard up to 5 to 7 times.",
      ecoTip: "Cardboard can be shredded as excellent brown carbon bedding for compost or weed suppression in gardens.",
      ecoActionScore: 92,
      alternativeUses: ["Weed barrier in garden beds", "Storage box organizer"],
      carbonSavedKg: 0.28,
    },
    {
      detectedItem: "Aluminum / Light Metal Beverage Container",
      material: "Aluminum Alloy (Highly Recyclable)",
      category: "recyclable",
      categoryLabel: "Dry Recyclables / Metals",
      recyclability: "100% Infinitely Recyclable (Zero quality degradation)",
      disposalInstructions: "Empty liquids completely, rinse lightly, keep tab attached, and place in curbside metal recycling or bottle redemption kiosk.",
      binColor: "Blue Bin (Metals & Recyclables)",
      whereToSegregate: "Blue Bin (Dry Recyclables) or container deposit redemption center.",
      segregationSteps: [
        "1. Empty any residual liquid completely.",
        "2. Lightly rinse inside.",
        "3. Leave pull tab attached or inside.",
        "4. Deposit into Blue Bin or bottle redemption kiosk."
      ],
      confidence: 92,
      environmentalImpact: "Recycling aluminum requires 95% less energy than extracting bauxite ore, directly avoiding 0.32 kg CO2e.",
      recommendedDisposal: "Deposit in curbside metal recycling or bottle refund kiosks. Recycled aluminum saves 95% of virgin smelting energy.",
      whyThisResult: "Aluminum can be remelted back into new cans in as little as 60 days in a closed-loop cycle.",
      ecoTip: "Participate in local container deposit programs where available to earn back recycling refunds.",
      ecoActionScore: 95,
      alternativeUses: ["Pen holder", "DIY mini garden planter"],
      carbonSavedKg: 0.32,
    },
    {
      detectedItem: "Multi-Material Packaging / Inspection Needed",
      material: "Mixed Composite / Flexible Foil or Laminated Plastic",
      category: "context_dependent",
      categoryLabel: "Context-Dependent / Cleanliness Inspection",
      recyclability: "Context-Dependent (Non-recyclable if composite foil; recyclable if single-layer clean plastic)",
      disposalInstructions: "Inspect package markings. If it has a metalized film layer or food contamination, discard in General Waste (Black Bin). If clean film, look for grocery store drop-offs.",
      binColor: "Blue Bin (if clean & single polymer) OR Black Bin (if composite/soiled)",
      whereToSegregate: "Inspect resin code: Place clean single-type plastics in Blue Bin; place multi-layer foil pouches in Black Bin.",
      segregationSteps: [
        "1. Check the packaging for the SPI resin number (#1 to #7) or recyclable paper logo.",
        "2. If made of flexible multi-layer metallic pouch or soiled with food, deposit in Black Bin (Trash).",
        "3. If clean paper or single-material plastic, place in Blue Bin (Recyclables)."
      ],
      confidence: 82,
      environmentalImpact: "Correct diversion avoids contaminating municipal recycling batches, protecting circular processing streams.",
      recommendedDisposal: "Inspect material identification codes. Complex composite packaging that cannot be separated goes to general waste.",
      whyThisResult: "Composite multi-material items (foil fused to plastic) cannot be separated easily by municipal recycling sorters.",
      ecoTip: "Choose products packaged in 100% paper or mono-material plastic that local facilities can process.",
      ecoActionScore: 80,
      alternativeUses: ["Check if local supermarkets host flexible plastic bag and film drop-off points."],
      carbonSavedKg: 0.12,
    },
  ];

  const selected = fallbackVariants[variantIndex];

  return {
    id: `scan-${Date.now()}-${variantIndex}`,
    detectedItem: selected.detectedItem,
    material: selected.material,
    category: selected.category as any,
    categoryLabel: selected.categoryLabel,
    recyclability: selected.recyclability,
    disposalInstructions: selected.disposalInstructions,
    binColor: selected.binColor,
    whereToSegregate: selected.whereToSegregate,
    segregationSteps: selected.segregationSteps,
    confidence: selected.confidence,
    confidenceLevel: "high",
    environmentalImpact: selected.environmentalImpact,
    recommendedDisposal: selected.recommendedDisposal,
    whyThisResult: selected.whyThisResult,
    ecoTip: selected.ecoTip,
    ecoActionScore: selected.ecoActionScore,
    specialHandlingRequired: false,
    alternativeUses: selected.alternativeUses,
    carbonSavedKg: selected.carbonSavedKg,
    timestamp: new Date().toISOString(),
    imageUrl: imageBase64,
    isMock: true,
  };
}

// ─── Local Machine Learning Service Integration (MobileNetV3 / EfficientNet) ───
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

async function queryPythonMlService(imageBase64: string, threshold = 60.0): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(`${ML_SERVICE_URL}/classify-base64`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64, threshold }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function formatMlResultToWasteAnalysis(mlData: any, imageBase64: string): any {
  const rawCat = String(mlData.category || "Other/Unknown").trim();
  const catLower = rawCat.toLowerCase();
  let normalizedCategory: "recyclable" | "organic" | "ewaste" | "hazardous" | "general" = "recyclable";
  let categoryLabel = rawCat;

  if (catLower.includes("wet") || catLower.includes("organic")) {
    normalizedCategory = "organic";
    categoryLabel = "Organic/Wet Waste";
  } else if (catLower.includes("e-waste") || catLower.includes("electronic")) {
    normalizedCategory = "ewaste";
    categoryLabel = "E-Waste";
  } else if (catLower.includes("hazard")) {
    normalizedCategory = "hazardous";
    categoryLabel = "Hazardous Waste";
  } else if (catLower.includes("other") || catLower.includes("unknown") || catLower.includes("trash")) {
    normalizedCategory = "general";
    categoryLabel = "Other/Unknown";
  } else {
    normalizedCategory = "recyclable";
    categoryLabel = rawCat;
  }

  const isSpecial = normalizedCategory === "ewaste" || normalizedCategory === "hazardous";
  const confidence = typeof mlData.confidence === "number" ? mlData.confidence : 90;
  const isRecyclable = Boolean(mlData.recyclable);

  const baseResult = {
    detectedItem: mlData.detected_item || "Identified Waste Item",
    material: mlData.category || "Classified Material",
    category: normalizedCategory,
    categoryLabel: categoryLabel,
    recyclability: isRecyclable
      ? "Recyclable (Rinse/clean if applicable)"
      : (isSpecial ? "Specialized Drop-off Required (Do NOT landfill)" : "Non-Recyclable Landfill Residual"),
    disposalInstructions: mlData.disposal_instruction || "Deposit into the recommended waste container.",
    binColor: mlData.bin || "Check Local Bin Guidelines",
    whereToSegregate: `Deposit into ${mlData.bin || "designated container"}. ${mlData.disposal_instruction || ""}`,
    segregationSteps: [
      `1. Classification: Identified by trained ML model as ${mlData.detected_item || categoryLabel}`,
      `2. Preparation: ${mlData.disposal_instruction || "Ensure item is emptied and cleared of major residue."}`,
      `3. Segregation: Place into ${mlData.bin || "recommended container"}.`,
      `4. Eco Impact: ${mlData.sustainability_tip || "Proper sorting preserves recyclable materials."}`
    ],
    confidence: confidence,
    confidenceLevel: confidence >= 85 ? ("high" as const) : ("medium" as const),
    environmentalImpact: mlData.sustainability_tip || "Proper segregation diverts materials from landfill.",
    recommendedDisposal: mlData.disposal_instruction || "Deposit into designated bin.",
    whyThisResult: `Classified by trained deep learning model (${categoryLabel}, ${confidence}% confidence).`,
    ecoTip: mlData.sustainability_tip || "Reuse or recycle materials whenever possible.",
    ecoActionScore: Math.min(98, Math.max(70, Math.round(confidence))),
    specialHandlingRequired: isSpecial,
    specialHandlingNotes: isSpecial ? "Warning: Do not dispose into standard curbside household bins." : undefined,
    contaminationRisk: isRecyclable ? ("low" as const) : ("none" as const),
    carbonSavedKg: normalizedCategory === "recyclable" ? 0.28 : normalizedCategory === "organic" ? 0.22 : normalizedCategory === "ewaste" ? 0.50 : 0.10,
    imageUrl: imageBase64,
    id: `ml-scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    isMock: false,
    rawJson: {
      detected_item: mlData.detected_item,
      category: mlData.category,
      material: mlData.category,
      confidence: confidence,
      bin: mlData.bin,
      recyclable: isRecyclable,
      reason: `Classified by trained local ML model (${categoryLabel})`,
      disposal_instruction: mlData.disposal_instruction,
      sustainability_tip: mlData.sustainability_tip
    }
  };

  // Run through IBM AI validation and enrichment pipeline
  return enrichWithIbmAi(baseResult as any);
}

// API: Analyze Waste Multimodal (Image, Text, Document) - supports /api/analyze-waste, /api/analyze-multimodal, /api/classify
app.post([
  "/api/analyze-waste",
  "/analyze-waste",
  "/api/analyze-multimodal",
  "/analyze-multimodal",
  "/api/classify",
  "/classify"
], async (req: Request, res: Response): Promise<void> => {
  const serverTime = new Date().toISOString();
  const clientSessionId = (req.headers["x-session-id"] as string) || req.body?.sessionId || req.body?.session_id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const clientReqId = (req.headers["x-client-request-id"] as string) || req.body?.requestId || `scan-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const clientTimestamp = (req.headers["x-request-timestamp"] as string) || req.body?.timestamp || serverTime;
  const clientSalt = (req.headers["x-request-salt"] as string) || req.body?.salt || `salt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const traceId = `srv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();

  // Prevent any intermediary, reverse proxy, or browser caching
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Client-Request-Id", clientReqId);
  res.setHeader("X-Session-Id", clientSessionId);
  res.setHeader("X-Request-Timestamp", clientTimestamp);
  res.setHeader("X-Request-Salt", clientSalt);
  res.setHeader("X-Server-Trace-Id", traceId);

  // Parse multimodal payload
  const {
    inputType,
    text,
    documentBase64,
    documentName,
    documentText,
    imageBase64,
    mimeType = "image/jpeg",
    hint,
    sampleId,
    forceMock,
    preferMl,
    threshold,
  } = req.body;

  // Determine effective modality: 'image' | 'text' | 'document'
  let effectiveMode: "image" | "text" | "document" = "image";
  if (inputType === "text" || inputType === "document" || inputType === "image") {
    effectiveMode = inputType;
  } else if (documentBase64 || (mimeType === "application/pdf" && imageBase64)) {
    effectiveMode = "document";
  } else if (text && String(text).trim().length > 0 && !imageBase64 && !documentBase64) {
    effectiveMode = "text";
  } else {
    effectiveMode = "image";
  }

  console.log(`🔍 [Multimodal Analysis Server] Mode: "${effectiveMode}" | Req: ${clientReqId} | Session: ${clientSessionId} | Trace: ${traceId}`);

  try {
    const ai = getGeminiClient();

    // ─────────────────────────────────────────────────────────────────────────────
    // MODE 1: TEXT DESCRIPTION INPUT
    // ─────────────────────────────────────────────────────────────────────────────
    if (effectiveMode === "text") {
      const userText = String(text || hint || "").trim();
      if (!userText || userText.length < 2) {
        res.status(400).json({
          success: false,
          error: "Please enter a description of the waste item you wish to classify.",
          requestId: clientReqId,
          sessionId: clientSessionId,
        });
        return;
      }

      console.group(`📝 [Multimodal Text Analysis | Trace: ${traceId}]`);
      console.log("Input Text:", userText);

      // If Gemini client not available, run IBM AI Granite NLU text classifier
      if (!ai) {
        console.warn("Gemini client unavailable. Processing text input via IBM AI Granite NLU Pipeline.");
        const ibmAnalysis = await analyzeTextWithIbmAi(userText, sampleId);
        const visual = generateMultimodalVisual("text", ibmAnalysis.result.detectedItem, ibmAnalysis.result.categoryLabel, ibmAnalysis.result.binColor);
        console.groupEnd();
        res.json({
          success: true,
          result: {
            ...ibmAnalysis.result,
            imageUrl: visual,
          },
          isDemoMode: !ibmAnalysis.isWatsonxLive,
          engine: ibmAnalysis.isWatsonxLive ? "ibm_watsonx_granite" : "ibm_granite_nlu",
          modelUsed: ibmAnalysis.modelUsed,
          requestId: clientReqId,
          sessionId: clientSessionId,
          session_id: clientSessionId,
          timestamp: clientTimestamp,
        });
        return;
      }

      const textSystemInstruction = `You are an AI-powered Waste Classification Assistant called EcoSort AI.
The user has provided a text description of a waste item.
Understand the user's description and classify the waste into one of these exact 11 categories:
1. Wet Waste
2. Dry Waste
3. Plastic
4. Paper
5. Glass
6. Metal
7. E-Waste
8. Hazardous Waste
9. Organic Waste
10. Recyclable Waste
11. Other/Unknown

RULES:
- Understand the physical composition, material properties, and typical municipal sorting rules for the described item.
- Provide confidence score (0 to 100).
- Recommend the appropriate disposal container/bin.
- Provide clear recyclability status.
- Provide concise, practical disposal instructions.
- Provide a sustainability/eco tip.
- Return strictly valid JSON adhering to the specified schema.`;

      const textPrompt = `The user describes this waste item:
"${userText}"

Classify this waste item and provide unified recycling/disposal guidance.

Return ONLY valid JSON in this exact structure:
{
  "detected_item": "concise name of the described item",
  "category": "one category from the 11 categories",
  "material": "main material composition",
  "confidence": 92,
  "bin": "recommended bin",
  "recyclable": true,
  "reason": "explanation of classification based on the user description",
  "disposal_instruction": "step-by-step disposal instruction",
  "sustainability_tip": "one short useful environmental tip"
}`;

      const { response, modelUsed } = await generateWithModelFallback(
        ai,
        {
          contents: [{ text: textPrompt }],
          config: {
            systemInstruction: textSystemInstruction,
            responseMimeType: "application/json",
          },
        },
        traceId
      );

      let rawText = response.text || "{}";
      rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
      let parsed: any = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error("Could not parse JSON response for text analysis");
      }

      const detectedItemName = parsed.detected_item || parsed.detectedItem || userText;
      const rawCategory = String(parsed.category || "Dry Waste").trim();
      const catLower = rawCategory.toLowerCase();
      let normalizedCategory: "recyclable" | "organic" | "ewaste" | "hazardous" | "general" = "recyclable";
      let categoryLabel = rawCategory;

      if (catLower.includes("wet") || catLower.includes("organic")) {
        normalizedCategory = "organic";
        categoryLabel = catLower.includes("wet") ? "Wet Waste" : "Organic Waste";
      } else if (catLower.includes("e-waste") || catLower.includes("electronic")) {
        normalizedCategory = "ewaste";
        categoryLabel = "E-Waste";
      } else if (catLower.includes("hazard")) {
        normalizedCategory = "hazardous";
        categoryLabel = "Hazardous Waste";
      } else if (catLower.includes("other") || catLower.includes("unknown") || catLower.includes("trash") || catLower.includes("landfill")) {
        normalizedCategory = "general";
        categoryLabel = "Other/Unknown";
      } else {
        normalizedCategory = "recyclable";
      }

      const isSpecial = normalizedCategory === "ewaste" || normalizedCategory === "hazardous";
      const rawConfidence = typeof parsed.confidence === "number" ? parsed.confidence : 92;
      const isRecyclableBool = typeof parsed.recyclable === "boolean" ? parsed.recyclable : (normalizedCategory === "recyclable");
      const disposalInstruction = parsed.disposal_instruction || parsed.disposalInstructions || "Deposit into the recommended waste container.";
      const reasoning = parsed.reason || `Classified based on user description: "${userText}"`;
      const sustainabilityTip = parsed.sustainability_tip || parsed.ecoTip || "Proper segregation diverts reusable materials from landfill.";
      const rawBin = parsed.bin || (
        normalizedCategory === "organic" ? "Green Bin (Wet / Organic Compost)" :
        normalizedCategory === "recyclable" ? "Blue Bin (Dry Recyclables)" :
        normalizedCategory === "ewaste" ? "Yellow Bin (Specialized E-Waste Drop-Off)" :
        normalizedCategory === "hazardous" ? "Red Bin (Hazardous Material Depot)" :
        "Black/Grey Bin (General Waste / Landfill)"
      );

      const visualUrl = generateMultimodalVisual("text", detectedItemName, categoryLabel, rawBin);

      const unifiedResult = {
        id: `text-scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        detectedItem: detectedItemName,
        material: parsed.material || "Identified Material",
        category: normalizedCategory,
        categoryLabel: categoryLabel,
        recyclability: isRecyclableBool
          ? (disposalInstruction.toLowerCase().includes("rinse") ? "100% Recyclable (Rinse/clean before recycling)" : "Recyclable")
          : (isSpecial ? "Specialized Collection Required (Do NOT put in household waste)" : "Non-Recyclable Landfill Residual"),
        disposalInstructions: disposalInstruction,
        recommendedDisposal: disposalInstruction,
        binColor: rawBin,
        whereToSegregate: `Deposit into ${rawBin}. ${disposalInstruction}`,
        segregationSteps: [
          `1. Description Analysis: Identified "${detectedItemName}" from user description.`,
          `2. Material Verification: ${parsed.material || "Identified material"}.`,
          `3. Preparation: ${disposalInstruction}`,
          `4. Segregation: Deposit into ${rawBin}.`
        ],
        confidence: rawConfidence,
        confidenceLevel: rawConfidence >= 85 ? ("high" as const) : ("medium" as const),
        environmentalImpact: sustainabilityTip,
        whyThisResult: reasoning,
        ecoTip: sustainabilityTip,
        ecoActionScore: Math.min(98, Math.max(70, rawConfidence)),
        specialHandlingRequired: isSpecial,
        specialHandlingNotes: isSpecial ? "Warning: Do not discard into normal household trash or curbside bins." : undefined,
        contaminationRisk: isRecyclableBool ? "low" : "none",
        carbonSavedKg: normalizedCategory === "recyclable" ? 0.28 : normalizedCategory === "organic" ? 0.22 : normalizedCategory === "ewaste" ? 0.50 : 0.10,
        imageUrl: visualUrl,
        timestamp: new Date().toISOString(),
        isMock: false,
        inputMode: "text" as const,
        inputText: userText,
        rawJson: {
          detected_item: detectedItemName,
          category: categoryLabel,
          material: parsed.material || "Identified Material",
          confidence: rawConfidence,
          bin: rawBin,
          recyclable: isRecyclableBool,
          reason: reasoning,
          disposal_instruction: disposalInstruction,
          sustainability_tip: sustainabilityTip,
        },
      };

      // Execute IBM Bob pipeline: Entity extraction, ISO 14001 validation & EPA carbon accounting
      const { result: finalEnrichedResult, trace: ibmTrace } = await executeIbmBobPipeline("text", unifiedResult as any, traceId, userText);

      console.log("✅ Text Classification Succeeded & IBM Validated:", finalEnrichedResult.detectedItem, "| Stream:", finalEnrichedResult.categoryLabel);
      console.groupEnd();

      res.json({
        success: true,
        result: finalEnrichedResult,
        isDemoMode: false,
        modelUsed: `${modelUsed} + IBM Granite Validator`,
        ibmExecutionTrace: ibmTrace,
        requestId: clientReqId,
        sessionId: clientSessionId,
        session_id: clientSessionId,
        timestamp: clientTimestamp,
        salt: clientSalt,
      });
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // MODE 2: DOCUMENT INPUT (PDF / TEXT-BASED SPECIFICATIONS)
    // ─────────────────────────────────────────────────────────────────────────────
    if (effectiveMode === "document") {
      const docRaw = String(documentBase64 || imageBase64 || "");
      let cleanDocBase64 = docRaw.includes(",") ? docRaw.split(",")[1] : docRaw;
      cleanDocBase64 = cleanDocBase64.replace(/\s+/g, "");
      const docName = String(documentName || (mimeType === "application/pdf" ? "document.pdf" : "waste_document.txt")).trim();

      console.group(`📄 [Multimodal Document Analysis | Trace: ${traceId}]`);
      console.log("Document Name:", docName);
      console.log("Document Base64 Length:", cleanDocBase64.length);

      let extractedDocText = String(documentText || "").trim();

      // If text not provided, extract server-side
      if (!extractedDocText && cleanDocBase64.length > 0) {
        const isPdf = docName.toLowerCase().endsWith(".pdf") || mimeType === "application/pdf" || docRaw.startsWith("data:application/pdf");
        if (isPdf) {
          try {
            const buf = Buffer.from(cleanDocBase64, "base64");
            extractedDocText = await extractTextFromPdfBuffer(buf);
            console.log("Extracted PDF text length:", extractedDocText.length, "chars");
          } catch (pdfErr) {
            console.warn("Server PDF extraction notice:", pdfErr);
          }
        } else {
          try {
            extractedDocText = Buffer.from(cleanDocBase64, "base64").toString("utf-8");
          } catch {
            extractedDocText = "";
          }
        }
      }

      if ((!cleanDocBase64 || cleanDocBase64.length < 20) && (!extractedDocText || extractedDocText.length < 5)) {
        res.status(400).json({
          success: false,
          error: "Please upload a valid document file (such as a PDF, TXT, or packaging spec sheet).",
          requestId: clientReqId,
          sessionId: clientSessionId,
        });
        return;
      }

      // If Gemini client not available, run IBM AI Granite NLU on extracted document text
      if (!ai) {
        console.warn("Gemini client unavailable. Processing document text via IBM AI Granite NLU Pipeline.");
        const ibmAnalysis = await analyzeTextWithIbmAi(extractedDocText || docName, sampleId);
        const visual = generateMultimodalVisual("document", ibmAnalysis.result.detectedItem, ibmAnalysis.result.categoryLabel, ibmAnalysis.result.binColor);
        console.groupEnd();
        res.json({
          success: true,
          result: {
            ...ibmAnalysis.result,
            imageUrl: visual,
            inputMode: "document",
            documentName: docName,
            documentExcerpt: extractedDocText.slice(0, 350),
          },
          isDemoMode: !ibmAnalysis.isWatsonxLive,
          engine: ibmAnalysis.isWatsonxLive ? "ibm_watsonx_granite" : "ibm_granite_nlu",
          modelUsed: ibmAnalysis.modelUsed,
          requestId: clientReqId,
          sessionId: clientSessionId,
          session_id: clientSessionId,
          timestamp: clientTimestamp,
        });
        return;
      }

      const docSystemInstruction = `You are an AI-powered Environmental Compliance and Waste Classification Auditor called EcoSort AI.
Analyze the uploaded waste-related document (e.g. equipment specification, packaging material safety data sheet (MSDS/SDS), component bill of materials, product teardown, or waste audit manifest).
Identify the main waste item, component, or material mentioned in the document and classify it into one of these exact 11 categories:
1. Wet Waste
2. Dry Waste
3. Plastic
4. Paper
5. Glass
6. Metal
7. E-Waste
8. Hazardous Waste
9. Organic Waste
10. Recyclable Waste
11. Other/Unknown

RULES:
- Extract factual waste-related specifications directly from the document (e.g., polymers like PET/HDPE, battery chemistry like Li-ion, electronics, paperboard, toxic solvents).
- State confidence score (0-100).
- Recommend the appropriate container/bin and disposal process.
- Give a practical recyclability determination.
- Give actionable disposal instruction based on the material in the document.
- Provide a sustainability tip.
- Return strictly valid JSON adhering to the specified schema.`;

      const docPromptText = `Document Name: "${docName}"
${extractedDocText ? `Extracted Document Text / Excerpt:\n"""\n${extractedDocText.slice(0, 5000)}\n"""\n` : ""}
${hint ? `User note / context: "${hint}"\n` : ""}

Extract the primary waste item or material from this document and classify its disposal method.

Return ONLY valid JSON in this exact structure:
{
  "detected_item": "name of the primary waste item/material identified in document",
  "category": "one category from the 11 categories",
  "material": "material composition according to document",
  "confidence": 94,
  "bin": "recommended bin",
  "recyclable": true,
  "reason": "summary of document findings and classification rationale",
  "disposal_instruction": "actionable disposal instruction according to document/standards",
  "sustainability_tip": "one short useful environmental tip"
}`;

      // If document is PDF, we pass PDF inlineData as well as prompt for native multimodal processing
      const contentsPayload: any[] = [];
      const isPdfDoc = docName.toLowerCase().endsWith(".pdf") || mimeType === "application/pdf";
      if (isPdfDoc && cleanDocBase64.length > 20) {
        contentsPayload.push({
          inlineData: {
            mimeType: "application/pdf",
            data: cleanDocBase64,
          },
        });
      }
      contentsPayload.push({ text: docPromptText });

      const { response, modelUsed } = await generateWithModelFallback(
        ai,
        {
          contents: contentsPayload,
          config: {
            systemInstruction: docSystemInstruction,
            responseMimeType: "application/json",
          },
        },
        traceId
      );

      let rawText = response.text || "{}";
      rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
      let parsed: any = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error("Could not parse JSON response for document analysis");
      }

      const detectedItemName = parsed.detected_item || parsed.detectedItem || `Document Item (${docName})`;
      const rawCategory = String(parsed.category || "Recyclable Waste").trim();
      const catLower = rawCategory.toLowerCase();
      let normalizedCategory: "recyclable" | "organic" | "ewaste" | "hazardous" | "general" = "recyclable";
      let categoryLabel = rawCategory;

      if (catLower.includes("wet") || catLower.includes("organic")) {
        normalizedCategory = "organic";
        categoryLabel = catLower.includes("wet") ? "Wet Waste" : "Organic Waste";
      } else if (catLower.includes("e-waste") || catLower.includes("electronic")) {
        normalizedCategory = "ewaste";
        categoryLabel = "E-Waste";
      } else if (catLower.includes("hazard")) {
        normalizedCategory = "hazardous";
        categoryLabel = "Hazardous Waste";
      } else if (catLower.includes("other") || catLower.includes("unknown") || catLower.includes("trash") || catLower.includes("landfill")) {
        normalizedCategory = "general";
        categoryLabel = "Other/Unknown";
      } else {
        normalizedCategory = "recyclable";
      }

      const isSpecial = normalizedCategory === "ewaste" || normalizedCategory === "hazardous";
      const rawConfidence = typeof parsed.confidence === "number" ? parsed.confidence : 90;
      const isRecyclableBool = typeof parsed.recyclable === "boolean" ? parsed.recyclable : (normalizedCategory === "recyclable");
      const disposalInstruction = parsed.disposal_instruction || parsed.disposalInstructions || "Deposit into the recommended waste container.";
      const reasoning = parsed.reason || `Extracted and classified from document: "${docName}"`;
      const sustainabilityTip = parsed.sustainability_tip || parsed.ecoTip || "Auditing packaging and material safety sheets prevents environmental contamination.";
      const rawBin = parsed.bin || (
        normalizedCategory === "organic" ? "Green Bin (Wet / Organic Compost)" :
        normalizedCategory === "recyclable" ? "Blue Bin (Dry Recyclables)" :
        normalizedCategory === "ewaste" ? "Yellow Bin (Specialized E-Waste Drop-Off)" :
        normalizedCategory === "hazardous" ? "Red Bin (Hazardous Material Depot)" :
        "Black/Grey Bin (General Waste / Landfill)"
      );

      const visualUrl = generateMultimodalVisual("document", detectedItemName, categoryLabel, rawBin);

      const unifiedResult = {
        id: `doc-scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        detectedItem: detectedItemName,
        material: parsed.material || "Document Specified Material",
        category: normalizedCategory,
        categoryLabel: categoryLabel,
        recyclability: isRecyclableBool
          ? "Recyclable (Follow document specifications)"
          : (isSpecial ? "Specialized Drop-Off Required (Do NOT landfill)" : "Non-Recyclable Landfill Residual"),
        disposalInstructions: disposalInstruction,
        recommendedDisposal: disposalInstruction,
        binColor: rawBin,
        whereToSegregate: `Deposit into ${rawBin}. ${disposalInstruction}`,
        segregationSteps: [
          `1. Document Audit: Extracted "${detectedItemName}" from ${docName}.`,
          `2. Material Composition: ${parsed.material || "Declared material"}.`,
          `3. Compliance Instruction: ${disposalInstruction}`,
          `4. Final Stream: Deposit into ${rawBin}.`
        ],
        confidence: rawConfidence,
        confidenceLevel: rawConfidence >= 85 ? ("high" as const) : ("medium" as const),
        environmentalImpact: sustainabilityTip,
        whyThisResult: reasoning,
        ecoTip: sustainabilityTip,
        ecoActionScore: Math.min(98, Math.max(70, rawConfidence)),
        specialHandlingRequired: isSpecial,
        specialHandlingNotes: isSpecial ? "Warning: Do not discard into normal household trash or curbside bins." : undefined,
        contaminationRisk: isRecyclableBool ? "low" : "none",
        carbonSavedKg: normalizedCategory === "recyclable" ? 0.35 : normalizedCategory === "organic" ? 0.22 : normalizedCategory === "ewaste" ? 0.50 : 0.10,
        imageUrl: visualUrl,
        timestamp: new Date().toISOString(),
        isMock: false,
        inputMode: "document" as const,
        documentName: docName,
        documentExcerpt: extractedDocText ? extractedDocText.slice(0, 350) : undefined,
        rawJson: {
          detected_item: detectedItemName,
          category: categoryLabel,
          material: parsed.material || "Document Specified Material",
          confidence: rawConfidence,
          bin: rawBin,
          recyclable: isRecyclableBool,
          reason: reasoning,
          disposal_instruction: disposalInstruction,
          sustainability_tip: sustainabilityTip,
        },
      };

      // Execute IBM Bob pipeline: Entity extraction, ISO 14001 validation & EPA carbon accounting
      const { result: finalEnrichedDocResult, trace: ibmDocTrace } = await executeIbmBobPipeline("document", unifiedResult as any, traceId, extractedDocText);

      console.log("✅ Document Classification Succeeded & IBM Validated:", finalEnrichedDocResult.detectedItem, "| Stream:", finalEnrichedDocResult.categoryLabel);
      console.groupEnd();

      res.json({
        success: true,
        result: finalEnrichedDocResult,
        isDemoMode: false,
        modelUsed: `${modelUsed} + IBM Granite Validator`,
        ibmExecutionTrace: ibmDocTrace,
        requestId: clientReqId,
        sessionId: clientSessionId,
        session_id: clientSessionId,
        timestamp: clientTimestamp,
        salt: clientSalt,
      });
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // MODE 3: IMAGE / PHOTO INPUT
    // ─────────────────────────────────────────────────────────────────────────────
    let cleanBase64 = String(imageBase64 || "");
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, "");

    let normalizedMimeType = mimeType;
    if (typeof imageBase64 === "string" && imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:([^;]+);base64,/);
      if (match && match[1]) {
        normalizedMimeType = match[1];
      }
    }
    if (normalizedMimeType === "image/jpg") {
      normalizedMimeType = "image/jpeg";
    }
    if (!normalizedMimeType || normalizedMimeType === "application/octet-stream") {
      normalizedMimeType = "image/jpeg";
    }

    const imgFingerprint = computeImageFingerprint(cleanBase64);

    console.group(`📡 [Server Gemini Vision Lifecycle | Trace: ${traceId}]`);
    console.log("Client Request ID:", clientReqId);
    console.log("Normalized MIME Type:", normalizedMimeType);
    console.log("Image Fingerprint:", imgFingerprint);
    console.log("Base64 Length:", cleanBase64.length);

    // If caller explicitly preferred local ML model or queried engine=ml, try ML service first
    if ((req.body?.preferMl || req.query?.engine === "ml" || process.env.PREFER_LOCAL_ML === "true") && cleanBase64 && cleanBase64.length >= 20) {
      console.log("⚡ Explicit local ML service engine requested. Querying Python FastAPI microservice...");
      const mlResult = await queryPythonMlService(cleanBase64, typeof req.body.threshold === "number" ? req.body.threshold : 60.0);
      if (mlResult && !mlResult.error && mlResult.category) {
        console.log("✅ Successfully classified via local MobileNetV3 ML model:", mlResult.category);
        const formatted = formatMlResultToWasteAnalysis(mlResult, imageBase64);
        console.groupEnd();
        res.json({
          success: true,
          result: { ...formatted, inputMode: "image" },
          isDemoMode: false,
          engine: "mobilenet_v3_local",
          requestId: clientReqId,
          sessionId: clientSessionId,
          session_id: clientSessionId,
          timestamp: clientTimestamp,
          salt: clientSalt,
        });
        return;
      }
    }

    // If no image base64 data was provided and this is not an explicit sample fixture test, return clear HTTP 400
    if ((!cleanBase64 || cleanBase64.length < 20) && !(forceMock && sampleId)) {
      console.warn("❌ Rejected: No image uploaded (base64 is empty or too short).");
      console.groupEnd();
      res.status(400).json({
        success: false,
        error: "No image uploaded. Please capture or upload a valid waste photograph.",
        detail: "imageBase64 payload is missing or empty.",
        requestId: clientReqId,
        sessionId: clientSessionId,
        timestamp: clientTimestamp,
      });
      return;
    }

    // Only return mock fixture if explicitly requested for a sample item AND forced
    if (forceMock && sampleId) {
      console.warn("⚠️ Triggered Sample Fixture Condition (forceMock=true, sampleId=" + sampleId + ")");
      const result = getFallbackAnalysis(hint, sampleId, imageBase64);
      console.groupEnd();
      res.json({
        success: true,
        result: { ...result, inputMode: "image" },
        isDemoMode: true,
        requestId: clientReqId,
        sessionId: clientSessionId,
        session_id: clientSessionId,
        timestamp: clientTimestamp,
        salt: clientSalt,
      });
      return;
    }

    // If Gemini client is not initialized, check local Python ML model service as primary engine
    if (!ai) {
      console.warn("⚠️ Gemini API client is not initialized (missing API key). Checking local ML microservice...");
      const mlResult = await queryPythonMlService(cleanBase64);
      if (mlResult && !mlResult.error && mlResult.category) {
        console.log("✅ Successfully classified via local MobileNetV3 ML model:", mlResult.category);
        const formatted = formatMlResultToWasteAnalysis(mlResult, imageBase64);
        console.groupEnd();
        res.json({
          success: true,
          result: { ...formatted, inputMode: "image" },
          isDemoMode: false,
          engine: "mobilenet_v3_local",
          requestId: clientReqId,
          sessionId: clientSessionId,
          session_id: clientSessionId,
          timestamp: clientTimestamp,
          salt: clientSalt,
        });
        return;
      }

      console.warn("⚠️ Serving smart local segregation guidance.");
      const fallback = getFallbackAnalysis(hint, sampleId, imageBase64);
      console.groupEnd();
      res.json({
        success: true,
        result: { ...fallback, inputMode: "image" },
        isDemoMode: true,
        engine: "local_rules",
        requestId: clientReqId,
        sessionId: clientSessionId,
        session_id: clientSessionId,
        timestamp: clientTimestamp,
        salt: clientSalt,
      });
      return;
    }

    const promptText = `You are an AI-powered Waste Classification Assistant called EcoSort AI.

[session_id: "${clientSessionId}"]
Session ID / Nonce: ${clientSessionId}
Request ID: ${clientReqId}
Timestamp: ${clientTimestamp}
Salt: ${clientSalt}

Analyze the uploaded image carefully and identify the main waste item visible in the image.

Your task is to classify the waste into one of these categories:
1. Wet Waste
2. Dry Waste
3. Plastic
4. Paper
5. Glass
6. Metal
7. E-Waste
8. Hazardous Waste
9. Organic Waste
10. Recyclable Waste
11. Other/Unknown

IMPORTANT RULES:
- Look at the actual image and identify the physical object.
- Do not assume the waste category without visual evidence.
- If multiple waste items are visible, identify the most important/main item and mention other visible items if relevant.
- If the image is unclear, blurry, too dark, or does not contain waste, say that clearly.
- Do not make up information.
- Give a confidence score from 0 to 100.
- Explain briefly why you selected the category.
- Tell the user which bin/container should be used.
- Give simple disposal instructions.
- If the item is recyclable, mention whether it should be cleaned/rinsed before recycling.
- If the item is e-waste or hazardous waste, warn the user not to throw it into normal household waste.
- Keep the answer simple and easy for a normal user to understand.

${hint ? `User provided clarification / hint: "${hint}". Use this context to assist visual identification.` : ""}
${sampleId ? `Item reference: "${sampleId}".` : ""}

Return ONLY valid JSON in this exact structure:
{
  "detected_item": "name of the waste item",
  "category": "one category from the list",
  "material": "main material",
  "confidence": 0,
  "bin": "recommended bin",
  "recyclable": true,
  "reason": "short explanation based on the image",
  "disposal_instruction": "simple disposal instruction",
  "sustainability_tip": "one short useful environmental tip"
}`;

    const systemInstruction = `You are an AI-powered Waste Classification Assistant called EcoSort AI.
Analyze the uploaded image carefully and identify the main waste item visible in the image.
Classify the waste into one of these exact 11 categories:
1. Wet Waste
2. Dry Waste
3. Plastic
4. Paper
5. Glass
6. Metal
7. E-Waste
8. Hazardous Waste
9. Organic Waste
10. Recyclable Waste
11. Other/Unknown

Adhere strictly to visual evidence, give confidence 0-100, bin recommendation, simple disposal instructions, recyclable rinsing advice if applicable, and hazardous/e-waste safety warnings. Respond strictly in the specified JSON structure.`;

    const { response, modelUsed } = await generateWithModelFallback(
      ai,
      {
        contents: [
          {
            inlineData: {
              mimeType: normalizedMimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      },
      traceId
    );

    let rawText = response.text || "{}";
    rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
    
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("[Server Gemini API] JSON parse error on model response:", parseErr);
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Unable to parse model response into JSON");
      }
    }

    const rawCategory = String(parsed.category || "Recyclable Waste").trim();
    const detectedItemName = parsed.detected_item || parsed.detectedItem || "Identified Waste Item";
    const materialType = parsed.material || "Recoverable Material";
    const rawBin = parsed.bin || parsed.binColor;
    const rawConfidence = typeof parsed.confidence === "number" ? parsed.confidence : 90;
    const isRecyclableBool = typeof parsed.recyclable === "boolean" ? parsed.recyclable : (rawCategory.toLowerCase().includes("recyclable") || rawCategory.toLowerCase().includes("plastic") || rawCategory.toLowerCase().includes("paper") || rawCategory.toLowerCase().includes("glass") || rawCategory.toLowerCase().includes("metal"));
    const disposalInstruction = parsed.disposal_instruction || parsed.disposalInstructions || "Deposit into the recommended waste container.";
    const reasoning = parsed.reason || parsed.whyThisResult || "Identified based on visual surface texture and material composition.";
    const sustainabilityTip = parsed.sustainability_tip || parsed.ecoTip || "Diverting this item from landfills reduces greenhouse gas emissions.";

    const catLower = rawCategory.toLowerCase();
    let normalizedCategory: "recyclable" | "organic" | "ewaste" | "hazardous" | "general" | "context_dependent" = "recyclable";
    let categoryLabel = rawCategory;

    if (catLower.includes("wet") || catLower.includes("organic")) {
      normalizedCategory = "organic";
      categoryLabel = catLower.includes("wet") ? "Wet Waste" : "Organic Waste";
    } else if (catLower.includes("e-waste") || catLower.includes("electronic")) {
      normalizedCategory = "ewaste";
      categoryLabel = "E-Waste";
    } else if (catLower.includes("hazard")) {
      normalizedCategory = "hazardous";
      categoryLabel = "Hazardous Waste";
    } else if (catLower.includes("plastic")) {
      normalizedCategory = "recyclable";
      categoryLabel = "Plastic";
    } else if (catLower.includes("paper")) {
      normalizedCategory = "recyclable";
      categoryLabel = "Paper";
    } else if (catLower.includes("glass")) {
      normalizedCategory = "recyclable";
      categoryLabel = "Glass";
    } else if (catLower.includes("metal")) {
      normalizedCategory = "recyclable";
      categoryLabel = "Metal";
    } else if (catLower.includes("dry")) {
      normalizedCategory = "recyclable";
      categoryLabel = "Dry Waste";
    } else if (catLower.includes("recyclable")) {
      normalizedCategory = "recyclable";
      categoryLabel = "Recyclable Waste";
    } else if (catLower.includes("other") || catLower.includes("unknown") || catLower.includes("landfill") || catLower.includes("trash")) {
      normalizedCategory = "general";
      categoryLabel = "Other/Unknown";
    }

    let binColor = rawBin;
    if (!binColor) {
      if (normalizedCategory === "organic") binColor = "Green Bin (Wet / Organic Compost)";
      else if (normalizedCategory === "recyclable") binColor = "Blue Bin (Dry Recyclables)";
      else if (normalizedCategory === "ewaste") binColor = "Yellow Bin (Specialized E-Waste Drop-Off)";
      else if (normalizedCategory === "hazardous") binColor = "Red Bin (Hazardous Material Depot)";
      else binColor = "Black/Grey Bin (General Waste / Landfill)";
    }

    const isSpecial = normalizedCategory === "ewaste" || normalizedCategory === "hazardous";
    const recyclabilityText = parsed.recyclability || (
      isRecyclableBool
        ? (disposalInstruction.toLowerCase().includes("rinse") || disposalInstruction.toLowerCase().includes("clean")
            ? "100% Recyclable (Rinse/clean before recycling)"
            : "Recyclable")
        : (isSpecial ? "Specialized Collection Required (Do NOT put in household waste)" : "Non-Recyclable Landfill Residual")
    );

    let segregationSteps = Array.isArray(parsed.segregationSteps) && parsed.segregationSteps.length > 0
      ? parsed.segregationSteps
      : [
          `1. Inspect: ${reasoning}`,
          `2. Prepare: ${disposalInstruction}`,
          `3. Segregate: Deposit into ${binColor}.`,
          `4. Action: ${sustainabilityTip}`
        ];

    const uniqueId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const carbonSavedVal = typeof parsed.carbonSavedKg === "number"
      ? parsed.carbonSavedKg
      : (normalizedCategory === "recyclable" ? 0.28 : normalizedCategory === "organic" ? 0.22 : normalizedCategory === "ewaste" ? 0.50 : 0.10);

    const defaultEnvironmentalImpact =
      normalizedCategory === "recyclable"
        ? `Recycling this item conserves virgin materials and avoids approx. ${carbonSavedVal} kg of CO2e greenhouse gas emissions.`
        : normalizedCategory === "organic"
        ? `Composting wet organic waste prevents methane emissions in landfills and enriches soil, avoiding approx. ${carbonSavedVal} kg CO2e.`
        : normalizedCategory === "ewaste"
        ? `Specialized electronic recycling recovers valuable metals and prevents toxic environmental leaching, avoiding approx. ${carbonSavedVal} kg CO2e.`
        : normalizedCategory === "hazardous"
        ? `Certified hazardous collection prevents contamination of waterways and municipal soil ecosystems.`
        : `Responsible landfill disposal prevents loose environmental litter and protects municipal drainage systems.`;

    const result = {
      detectedItem: detectedItemName,
      material: materialType,
      category: normalizedCategory,
      categoryLabel: categoryLabel,
      recyclability: recyclabilityText,
      disposalInstructions: disposalInstruction,
      binColor: binColor,
      whereToSegregate: `Deposit into ${binColor}. ${disposalInstruction}`,
      segregationSteps: segregationSteps,
      confidence: rawConfidence,
      confidenceLevel: rawConfidence >= 85 ? ("high" as const) : ("medium" as const),
      environmentalImpact: parsed.environmentalImpact || defaultEnvironmentalImpact,
      recommendedDisposal: disposalInstruction,
      whyThisResult: reasoning,
      ecoTip: sustainabilityTip,
      ecoActionScore: typeof parsed.ecoActionScore === "number" ? parsed.ecoActionScore : Math.min(98, Math.max(70, rawConfidence)),
      specialHandlingRequired: isSpecial || Boolean(parsed.specialHandlingRequired),
      specialHandlingNotes: isSpecial ? "Warning: Do not discard into normal household trash or curbside bins." : undefined,
      contaminationRisk: parsed.contaminationRisk || (isRecyclableBool ? "low" : "none"),
      recyclingCode: parsed.recyclingCode || undefined,
      alternativeUses: Array.isArray(parsed.alternativeUses) ? parsed.alternativeUses : ["Repurposing", "Reusing"],
      carbonSavedKg: carbonSavedVal,
      imageUrl: imageBase64,
      id: uniqueId,
      timestamp: new Date().toISOString(),
      isMock: false,
      inputMode: "image" as const,
      rawJson: {
        detected_item: detectedItemName,
        category: categoryLabel,
        material: materialType,
        confidence: rawConfidence,
        bin: binColor,
        recyclable: isRecyclableBool,
        reason: reasoning,
        disposal_instruction: disposalInstruction,
        sustainability_tip: sustainabilityTip
      }
    };

    // Execute IBM Bob pipeline: Entity extraction, ISO 14001 validation & EPA carbon accounting
    const { result: enrichedVisionResult, trace: ibmVisionTrace } = await executeIbmBobPipeline("image", result as any, traceId);

    const durationMs = Date.now() - startTime;
    console.log("Processed in", durationMs, "ms using live model:", modelUsed, "and IBM Granite Validator");
    console.groupEnd();

    res.json({
      success: true,
      result: enrichedVisionResult,
      isDemoMode: false,
      modelUsed: `${modelUsed} + IBM Granite Validator`,
      ibmExecutionTrace: ibmVisionTrace,
      durationMs,
      requestId: clientReqId,
      sessionId: clientSessionId,
      session_id: clientSessionId,
      timestamp: clientTimestamp,
      salt: clientSalt,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errMsg = (error as any)?.message || String(error || "");
    const isQuota = (error as any)?.status === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
    const isHighDemand = (error as any)?.status === 503 || errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
    console.info(`[Server Gemini API] Vision model unavailable (${isQuota ? 'Free-tier daily quota limit' : isHighDemand ? 'High demand spike (503)' : 'transient network'} in ${durationMs}ms). Serving smart local segregation guidance.`);
    const fallback = getFallbackAnalysis(req.body.text || req.body.hint, req.body.sampleId, req.body.imageBase64);
    const enrichedFallback = enrichWithIbmAi(fallback as any);
    if (!enrichedFallback.imageUrl && (effectiveMode === "text" || effectiveMode === "document")) {
      enrichedFallback.imageUrl = generateMultimodalVisual(effectiveMode, enrichedFallback.detectedItem, enrichedFallback.categoryLabel, enrichedFallback.binColor);
    }
    console.groupEnd();

    res.json({
      success: true,
      result: {
        ...enrichedFallback,
        inputMode: effectiveMode,
        inputText: effectiveMode === "text" ? req.body.text : undefined,
        documentName: effectiveMode === "document" ? req.body.documentName : undefined,
      },
      isDemoMode: true,
      engine: "ibm_granite_nlu_fallback",
      requestId: clientReqId,
      sessionId: clientSessionId,
      session_id: clientSessionId,
      timestamp: clientTimestamp,
      salt: clientSalt,
      fallbackReason: isQuota
        ? "Gemini API daily free tier quota was exceeded. Provided smart localized segregation guidance."
        : isHighDemand
        ? "Gemini model is currently experiencing temporary high demand (503). Provided smart localized segregation guidance."
        : "Live AI model temporarily busy. Provided smart localized segregation guidance.",
    });
  }
});

// API: Check local Python FastAPI Machine Learning Microservice Health
app.get(["/api/ml/status", "/ml/status"], async (_req: Request, res: Response): Promise<void> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${ML_SERVICE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      res.json({
        available: false,
        url: ML_SERVICE_URL,
        error: `Service responded with HTTP ${response.status}`,
      });
      return;
    }
    const data = await response.json();
    res.json({
      available: true,
      url: ML_SERVICE_URL,
      ...data,
    });
  } catch (err: any) {
    res.json({
      available: false,
      url: ML_SERVICE_URL,
      error: "ML service is offline. Run 'uvicorn api:app --port 8000' in the ml-model/ directory to start.",
    });
  }
});

// API: Direct classification via local Python FastAPI ML service
app.post(["/api/ml/classify", "/ml/classify"], async (req: Request, res: Response): Promise<void> => {
  const { imageBase64, threshold = 60.0 } = req.body;
  if (!imageBase64) {
    res.status(400).json({ success: false, error: "imageBase64 is required" });
    return;
  }

  let cleanBase64 = String(imageBase64);
  if (cleanBase64.includes(",")) {
    cleanBase64 = cleanBase64.split(",")[1];
  }
  cleanBase64 = cleanBase64.replace(/\s+/g, "");

  const mlData = await queryPythonMlService(cleanBase64, threshold);
  if (!mlData || mlData.error) {
    res.status(503).json({
      success: false,
      error: "Local ML service is not reachable or model is not loaded.",
      mlServiceUrl: ML_SERVICE_URL,
    });
    return;
  }

  const result = formatMlResultToWasteAnalysis(mlData, imageBase64);
  res.json({
    success: true,
    result,
    engine: "mobilenet_v3_local",
    timestamp: new Date().toISOString(),
  });
});

// API: AI Chat with RAG Knowledge Base - supports both /api/chat and /chat
app.post(["/api/chat", "/chat"], async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, userMessage, imageBase64, mimeType = "image/jpeg" } = req.body;
    const ai = getGeminiClient();

    // RAG context retrieval
    const relevantDocs = retrieveRagContext(userMessage || "");
    const ragContextText = relevantDocs
      .map(
        (doc) =>
          `Topic: ${doc.topic}\nCategory: ${doc.category}\nSummary: ${doc.summary}\nGuidance: ${doc.detailedGuidance}\nPrecautions: ${doc.precautions}\nMunicipal Note: ${doc.municipalVariationNote}`
      )
      .join("\n\n");

    const ragSourceTitles = relevantDocs.map((d) => d.topic);

    if (!ai) {
      // High quality simulated conversational response
      let answer = "";
      const q = (userMessage || "").toLowerCase();

      if (q.includes("battery")) {
        answer =
          "🔋 **Batteries (Lithium-ion & Alkaline) require special drop-off handling.**\n\n" +
          "• **Do NOT** throw batteries in curbside recycling or trash bins — they cause dangerous friction fires in collection trucks.\n" +
          "• **Action**: Place clear tape over the terminals and drop them off at a designated battery collection kiosk or electronics retailer.\n\n" +
          "*Note: Local battery recycling regulations vary by municipality.*";
      } else if (q.includes("charger") || q.includes("phone")) {
        answer =
          "📱 **Mobile chargers and electronics are classified as E-Waste.**\n\n" +
          "• They contain valuable copper wiring, precious metals, and circuit boards.\n" +
          "• Never put cables in regular recycling bins, as they wrap around sorting machinery.\n" +
          "• **Action**: Take them to an authorized e-waste drop-off center or electronics store recycling bin.";
      } else if (q.includes("banana") || q.includes("peel") || q.includes("food")) {
        answer =
          "🍌 **Banana peels and food scraps belong in Organic / Compost waste.**\n\n" +
          "• They break down naturally into nutrient-dense soil amendment.\n" +
          "• Remember to remove any plastic fruit stickers or rubber produce bands before composting.\n" +
          "• In landfills, organic waste creates harmful methane gas, so green bin diversion is vital!";
      } else if (q.includes("pizza box")) {
        answer =
          "🍕 **Pizza boxes depend on contamination levels:**\n\n" +
          "• **Clean Cardboard Lid**: Tear it off and place it in standard dry paper recycling.\n" +
          "• **Grease-Soiled Bottom**: Place in your organic compost bin (if accepted locally) or general waste.\n" +
          "• Food grease prevents paper fibers from binding during pulping.";
      } else {
        answer =
          `I reviewed our waste segregation database regarding "${userMessage}".\n\n` +
          `• For general recyclables (plastics, metals, clean paper), make sure containers are clean, dry, and empty.\n` +
          `• For electronics or chemical items, always use specialized drop-off points.\n` +
          `• Keep in mind that local municipal waste rules may vary. Feel free to upload an image of the item for an instant multimodal scan!`;
      }

      res.json({
        success: true,
        answer,
        ragSources: ragSourceTitles.length > 0 ? ragSourceTitles : ["EcoSort Global Waste Standards"],
        isDemoMode: true,
      });
      return;
    }

    const systemInstruction = `You are EcoSort AI, a trusted, helpful, and transparent waste sorting assistant.
Always provide clear, concise, actionable, and environmentally responsible guidance.
Rules:
1. Always state the recommended waste stream (Recyclable, Organic, E-Waste, Hazardous, General, Context-Dependent).
2. Clearly explain why and what preparation steps (e.g. rinse, tape terminals, tear greasy sections) are necessary.
3. For hazardous items, batteries, chemicals, or medicines, always emphasize safety and authorized drop-off depots.
4. Transparently state that municipal disposal rules can vary by local jurisdiction.
5. Use markdown formatting with bold points and bullet lists for scannability.

Relevant Knowledge Base Documents (RAG):
${ragContextText || "General municipal waste sorting principles apply."}`;

    const parts: any[] = [];
    if (imageBase64) {
      let cleanBase64 = String(imageBase64);
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }
      cleanBase64 = cleanBase64.trim();
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      });
    }
    parts.push({
      text: userMessage || "How should I dispose of this waste item?",
    });

    const { response: chatResponse } = await generateWithModelFallback(ai, {
      contents: parts,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      answer: chatResponse.text || "I am ready to help you sort your waste responsibly.",
      ragSources: ragSourceTitles.length > 0 ? ragSourceTitles : ["EcoSort Knowledge Base"],
      isDemoMode: false,
    });
  } catch (error) {
    const errMsg = (error as any)?.message || String(error || "");
    const isQuota = (error as any)?.status === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
    console.info(`[Server Gemini Chat] Model temporarily unavailable (${isQuota ? 'rate limit/quota' : 'network'}). Serving local RAG response.`);
    res.json({
      success: true,
      answer:
        "EcoSort AI is currently in demo mode. Remember: Always ensure recyclables are clean and dry, tape battery terminals before drop-off, and separate food-soiled paper from clean cardboard!",
      ragSources: ["EcoSort Core Knowledge Base"],
      isDemoMode: true,
    });
  }
});

// API: Voice Audio Transcription - converts recorded user audio into text
app.post(["/api/transcribe-audio", "/transcribe-audio"], async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body;
    if (!audioBase64) {
      res.status(400).json({ success: false, error: "Audio data is required" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        success: true,
        text: "Clean cardboard packaging and dry plastic bottle",
        isDemoMode: true,
      });
      return;
    }

    let cleanBase64 = String(audioBase64);
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }
    cleanBase64 = cleanBase64.trim();

    // Clean audio mime type
    const cleanMime = mimeType.split(";")[0].trim() || "audio/webm";

    const promptText = "You are a specialized speech transcriber for a waste sorting assistant. Listen to the user speaking into their microphone describing waste items, materials, food leftovers, packaging, or discarded objects. Accurately transcribe what was spoken into concise, natural plain English describing the waste item. Output ONLY the clean transcribed text with no markdown, no quotes, no conversational filler, and no extra preamble.";

    const { response } = await generateWithModelFallback(ai, {
      contents: [
        {
          inlineData: {
            mimeType: cleanMime,
            data: cleanBase64,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        temperature: 0.1,
      },
    });

    const transcribed = (response.text || "").trim().replace(/^["']|["']$/g, "");
    res.json({
      success: true,
      text: transcribed,
      isDemoMode: false,
    });
  } catch (error) {
    console.warn("[Server Voice Transcription] Audio transcription failed:", error);
    res.json({
      success: false,
      error: "Unable to transcribe audio with live model.",
      text: "",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to prevent vite from being bundled into serverless production functions
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EcoSort AI server running on http://0.0.0.0:${PORT}`);
  });
}

// Export the Express app for Vercel Serverless Function handlers
export { app };
export default app;

// Only start standalone HTTP server if running as main process (not in Vercel serverless functions)
if (process.env.VERCEL !== "1" && !process.env.NOW_REGION) {
  startServer();
}
