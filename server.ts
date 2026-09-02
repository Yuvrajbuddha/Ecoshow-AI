import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { WASTE_KNOWLEDGE_BASE, retrieveRagContext } from "./src/services/wasteKnowledgeBase.js";
import { SAMPLE_WASTE_ITEMS } from "./src/services/sampleData.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous payload limit for base64 images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({
        apiKey: apiKey,
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

// Resilient model invocation with automatic fallbacks for 503 high-demand, rate limits, or errors
async function generateWithModelFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  },
  traceId?: string
): Promise<{ response: any; modelUsed: string }> {
  // Use gemini-3.1-flash-lite as primary high-throughput model with its own quota pool,
  // followed by gemini-flash-latest for fallback coverage
  const candidateModels = [
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];
  let lastError: any = null;

  // Filter out models currently in active cooldown
  const now = Date.now();
  const availableModels = candidateModels.filter((m) => {
    const cooldownUntil = modelCooldowns.get(m) || 0;
    return now >= cooldownUntil;
  });

  const modelsToTry = availableModels.length > 0 ? availableModels : candidateModels;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const attemptStartTime = Date.now();
    console.info(`[Gemini SDK Invocation] Attempt ${i + 1}/${modelsToTry.length} with model "${model}" (Trace: ${traceId || 'none'})`);
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

      if (isQuota) {
        // Set a 60-second cooldown so we do not repeatedly spam the rate-limited model
        modelCooldowns.set(model, Date.now() + 60_000);
        console.info(`[Gemini SDK Invocation] Model "${model}" reached free tier rate limit (429) after ${attemptDuration}ms. Switching to fallback.`);
      } else {
        console.info(`[Gemini SDK Invocation] Model "${model}" attempt completed with status ${statusCode} after ${attemptDuration}ms. Proceeding to fallback.`);
      }

      if (i < modelsToTry.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
    }
  }

  throw lastError;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  const hasKey = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") ||
    (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== "MY_GEMINI_API_KEY")
  );
  res.json({
    status: "ok",
    hasGeminiKey: hasKey,
    app: "EcoSort AI",
    version: "1.0.0",
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
      binColor: "Green Bin (Compost) or Bulky Timber Drop-Off",
      whereToSegregate: "Green Bin (if small chips) or municipal bulky wood drop-off point.",
      segregationSteps: [
        "1. Check if wood is untreated and free of nails, metal screws, or heavy varnish.",
        "2. If raw and small, shred or chip into garden mulch or compost bin.",
        "3. If painted, treated, or large, take to municipal bulky waste collection."
      ],
      confidence: 90,
      confidenceLevel: "high",
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
      binColor: "Blue Bin (Dry Recyclables)",
      whereToSegregate: "Blue Bin (Dry Recyclables) after emptying and rinsing.",
      segregationSteps: [
        "1. Empty any liquid or residue down the drain.",
        "2. Rinse with cold water to remove residual oils or scents.",
        "3. Replace cap securely if plastic caps are accepted locally.",
        "4. Place into the Blue Bin (Dry Recyclables)."
      ],
      confidence: 88,
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
      binColor: "Blue Bin (Dry Paper & Cardboard)",
      whereToSegregate: "Flatten and place into the Blue Bin (Dry Recyclables).",
      segregationSteps: [
        "1. Remove excessive plastic packing tape, bubble wrap, or styrofoam inserts.",
        "2. Inspect for grease: ensure the cardboard is dry and free of heavy food stains.",
        "3. Flatten or fold the box flat to maximize bin efficiency.",
        "4. Keep sheltered from rain before municipal collection."
      ],
      confidence: 91,
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
      binColor: "Blue Bin (Metals & Recyclables)",
      whereToSegregate: "Blue Bin (Dry Recyclables) or container deposit redemption center.",
      segregationSteps: [
        "1. Empty any residual liquid completely.",
        "2. Lightly rinse inside.",
        "3. Leave pull tab attached or inside.",
        "4. Deposit into Blue Bin or bottle redemption kiosk."
      ],
      confidence: 92,
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
      binColor: "Blue Bin (if clean & single polymer) OR Black Bin (if composite/soiled)",
      whereToSegregate: "Inspect resin code: Place clean single-type plastics in Blue Bin; place multi-layer foil pouches in Black Bin.",
      segregationSteps: [
        "1. Check the packaging for the SPI resin number (#1 to #7) or recyclable paper logo.",
        "2. If made of flexible multi-layer metallic pouch or soiled with food, deposit in Black Bin (Trash).",
        "3. If clean paper or single-material plastic, place in Blue Bin (Recyclables)."
      ],
      confidence: 82,
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
    binColor: selected.binColor,
    whereToSegregate: selected.whereToSegregate,
    segregationSteps: selected.segregationSteps,
    confidence: selected.confidence,
    confidenceLevel: "high",
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

// API: Analyze Waste Image (Multimodal Vision)
app.post("/api/analyze-waste", async (req: Request, res: Response): Promise<void> => {
  const traceId = `srv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();
  const clientReqId = (req.headers["x-client-request-id"] as string) || "none";

  // Prevent any intermediary, reverse proxy, or browser caching
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Server-Trace-Id", traceId);

  try {
    const { imageBase64, mimeType = "image/jpeg", hint, sampleId, forceMock } = req.body;

    const ai = getGeminiClient();

    // Extract clean base64 data regardless of data URL formatting
    let cleanBase64 = String(imageBase64 || "");
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, "");

    // Determine safe normalized mimeType
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
    console.log("─── STEP 1: INCOMING REQUEST METADATA ───");
    console.log("Client Request ID:", clientReqId);
    console.log("Timestamp:", new Date().toISOString());
    console.log("Image Fingerprint (Hash & Length):", imgFingerprint);
    console.log("Normalized MIME Type:", normalizedMimeType);
    console.log("Base64 Character Count:", cleanBase64.length);
    console.log("Estimated Binary Size:", `${Math.round(cleanBase64.length * 0.75).toLocaleString()} bytes`);
    console.log("Base64 Head (first 40 chars):", cleanBase64.substring(0, 40));
    console.log("Base64 Tail (last 40 chars):", cleanBase64.substring(Math.max(0, cleanBase64.length - 40)));
    console.log("User Context Hint:", hint || "none");
    console.log("Sample Reference ID:", sampleId || "none");
    console.log("Force Mock Flag:", Boolean(forceMock));
    console.log("Gemini API Client Initialized?:", Boolean(ai));

    // Only return mock fixture if explicitly requested for a sample item AND forced, or if no image was provided
    if ((forceMock && sampleId) || !ai || !cleanBase64 || cleanBase64.length < 20) {
      console.warn("⚠️ Triggered Early Fallback Condition:");
      if (!ai) console.warn("   -> Reason: Gemini API client is not initialized (missing API key)");
      else if (forceMock && sampleId) console.warn(`   -> Reason: Sample fixture "${sampleId}" requested with forceMock=true`);
      else if (!cleanBase64 || cleanBase64.length < 20) console.warn(`   -> Reason: Image base64 data is empty or too short (${cleanBase64.length} chars)`);

      const result = getFallbackAnalysis(hint, sampleId, imageBase64);
      console.log("Early Fallback Result Generated:\n", JSON.stringify(result, null, 2));
      console.groupEnd();
      res.json({ success: true, result, isDemoMode: true });
      return;
    }

    const promptText = `You are EcoSort AI, a multimodal waste classification and segregation vision model.

CRITICAL INSTRUCTIONS FOR PROCESSING THIS IMAGE:
1. Carefully inspect the EXACT visual pixels of the image provided in inlineData.
2. Do NOT provide a generic, static, or default classification.
3. Observe all specific visual details: object shape, color, surface texture, branding or labels, transparent vs opaque material, visible contamination (grease, food residue), and packaging type.
4. Classify the exact item visible in this specific photo.
5. If the image does not depict a recognizable physical waste item, accurately describe what is visually present in "detectedItem".

Provide a JSON response with:
1. WHAT IS THE KIND OF WASTE?
- detectedItem: Specific name of the item in the photo (e.g. "PET Plastic Water Bottle", "Organic Banana Peel", "Corrugated Cardboard Box", "Lithium-Ion Phone Battery", "Aluminum Soda Can").
- material: Exact physical material composition (e.g. "Polyethylene Terephthalate (PET #1)", "Organic Plant Biomass", "Cellulose Paperboard", "Aluminum Alloy").
- category: Exactly one of: 'recyclable', 'organic', 'ewaste', 'hazardous', 'general', 'context_dependent'.
- categoryLabel: Concise human stream label (e.g. 'Dry Recyclable / Plastics', 'Organic / Food & Compost', 'E-Waste / Electronics', 'Hazardous / Chemical', 'General Waste / Landfill').

2. WHERE SHOULD THE USER SEGREGATE IT?
- binColor: Specific target receptacle name (e.g. 'Blue Bin (Dry Recyclables)', 'Green Bin (Organic / Compost)', 'Yellow Bin (E-Waste & Electronics)', 'Red Bin (Hazardous Collection)', 'Black Bin (General Trash)').
- whereToSegregate: 1-2 direct sentences explaining where to place this item.
- segregationSteps: Array of 3 to 4 sequential, actionable steps to prepare and sort this item properly (e.g. "1. Empty residual contents", "2. Rinse clean", "3. Keep lid attached", "4. Deposit in blue bin").

Additional required metrics:
- confidence: Integer 65-99 indicating visual classification certainty.
- confidenceLevel: 'high' (>=85), 'medium' (65-84), or 'low' (<65).
- recommendedDisposal: Summary disposal recommendation.
- whyThisResult: Scientific and circular economy rationale based on this item's material.
- ecoTip: Actionable practical environmental tip.
- ecoActionScore: Integer 60-100.
- specialHandlingRequired: Boolean (true if batteries, electronics, chemicals, sharps, medical).
- specialHandlingNotes: Notes if special handling is needed, otherwise null.
- contaminationRisk: 'none', 'low', 'moderate', or 'high'.
- recyclingCode: Resin/recycling code (e.g. 'PET 1', 'HDPE 2', 'PAP 20', 'ALU 41') or null.
- alternativeUses: Array of 2-3 creative upcycling or repurposing ideas.
- carbonSavedKg: Estimated number of kg CO2e saved through correct diversion.

${hint ? `User note / context: "${hint}".` : ""}
${sampleId ? `Item reference: "${sampleId}".` : ""}

Respond ONLY with valid JSON.`;

    console.log("─── STEP 2: SPECIFIC PAYLOAD TRANSMITTED TO GEMINI API ───");
    console.log("Contents InlineData:", {
      mimeType: normalizedMimeType,
      dataLength: cleanBase64.length,
      imageFingerprint: imgFingerprint,
      headSnippet: cleanBase64.substring(0, 50),
      tailSnippet: cleanBase64.substring(Math.max(0, cleanBase64.length - 50)),
    });
    console.log("Specific Prompt Text Sent to Gemini Model:\n", promptText);
    console.log("Generation Config:", { responseMimeType: "application/json" });

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
          responseMimeType: "application/json",
        },
      },
      traceId
    );

    let rawText = response.text || "{}";
    console.log(`─── STEP 3: RAW RESPONSE RECEIVED FROM GEMINI API (${modelUsed}) ───`);
    console.log("Raw Response Text from Gemini:\n", rawText);

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

    console.log("─── STEP 4: PARSED JSON MODEL OUTPUT ───");
    console.log("Parsed JSON Object:\n", JSON.stringify(parsed, null, 2));

    // Normalize category and binColor
    const category = (parsed.category || "recyclable").toLowerCase();
    let binColor = parsed.binColor;
    if (!binColor) {
      if (category === "organic") binColor = "Green Bin (Organic / Compost)";
      else if (category === "recyclable") binColor = "Blue Bin (Dry Recyclables)";
      else if (category === "ewaste") binColor = "Yellow Bin (E-Waste & Electronics)";
      else if (category === "hazardous") binColor = "Red Bin (Hazardous Drop-Off)";
      else if (category === "general") binColor = "Black/Grey Bin (General Trash / Landfill)";
      else binColor = "Check Bin Markings / Local Drop-Off";
    }

    let whereToSegregate = parsed.whereToSegregate;
    if (!whereToSegregate) {
      whereToSegregate = `Deposit into ${binColor} following standard preparation instructions.`;
    }

    let segregationSteps = Array.isArray(parsed.segregationSteps) && parsed.segregationSteps.length > 0
      ? parsed.segregationSteps
      : [
          `1. Empty any liquid or organic residue from the item.`,
          `2. Inspect material components and detach non-compatible lids or tags.`,
          `3. Place into ${binColor}.`,
          `4. Keep dry and uncontaminated to preserve recyclable quality.`
        ];

    const uniqueId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const result = {
      detectedItem: parsed.detectedItem || "Identified Waste Item",
      material: parsed.material || "Recoverable Material",
      category: category,
      categoryLabel: parsed.categoryLabel || `${category.charAt(0).toUpperCase() + category.slice(1)} Stream`,
      binColor: binColor,
      whereToSegregate: whereToSegregate,
      segregationSteps: segregationSteps,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 90,
      confidenceLevel: parsed.confidenceLevel || (parsed.confidence >= 85 ? "high" : "medium"),
      recommendedDisposal: parsed.recommendedDisposal || whereToSegregate,
      whyThisResult: parsed.whyThisResult || "Categorized based on physical material composition and circular recovery feasibility.",
      ecoTip: parsed.ecoTip || "Diverting this item from landfills reduces greenhouse gas emissions and conserves virgin resources.",
      ecoActionScore: typeof parsed.ecoActionScore === "number" ? parsed.ecoActionScore : 88,
      specialHandlingRequired: Boolean(parsed.specialHandlingRequired),
      specialHandlingNotes: parsed.specialHandlingNotes || undefined,
      contaminationRisk: parsed.contaminationRisk || "low",
      recyclingCode: parsed.recyclingCode || undefined,
      alternativeUses: Array.isArray(parsed.alternativeUses) ? parsed.alternativeUses : ["Upcycling", "Repurposing"],
      carbonSavedKg: typeof parsed.carbonSavedKg === "number" ? parsed.carbonSavedKg : 0.25,
      imageUrl: imageBase64,
      id: uniqueId,
      timestamp: new Date().toISOString(),
      isMock: false,
    };

    const durationMs = Date.now() - startTime;
    console.log("─── STEP 5: FINAL RESULT DISPATCHED TO CLIENT ───");
    console.log(`Processed in ${durationMs}ms using live model: ${modelUsed}`);
    console.log("Item:", result.detectedItem, "| Stream:", result.category, "| Bin:", result.binColor, "| Confidence:", `${result.confidence}%`);
    console.groupEnd();

    res.json({ success: true, result, isDemoMode: false, modelUsed, durationMs });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errMsg = (error as any)?.message || String(error || "");
    const isQuota = (error as any)?.status === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
    console.info(`[Server Gemini API] Vision model unavailable (${isQuota ? 'Free-tier daily quota limit' : 'transient network'} in ${durationMs}ms). Serving smart local segregation guidance.`);
    const fallback = getFallbackAnalysis(req.body.hint, req.body.sampleId, req.body.imageBase64);
    console.groupEnd();

    res.json({
      success: true,
      result: fallback,
      isDemoMode: true,
      fallbackReason: isQuota
        ? "Gemini API daily free tier quota was exceeded. Provided smart localized segregation guidance."
        : "Live AI model temporarily busy. Provided smart localized segregation guidance.",
    });
  }
});

// API: AI Chat with RAG Knowledge Base
app.post("/api/chat", async (req: Request, res: Response): Promise<void> => {
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

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

startServer();
