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

// Resilient model invocation with automatic fallbacks for 503 high-demand, rate limits, or errors
async function generateWithModelFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  }
): Promise<any> {
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const response = await ai.models.generateContent({
        ...options,
        model,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`Model ${model} encountered error: ${errMsg}`);
      if (i < candidateModels.length - 1) {
        console.warn(`Attempting fallback model: ${candidateModels[i + 1]}...`);
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

// Helper for simulated fallback analysis based on text hint or image analysis
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
      whyThisResult: "Natural solid wood is biodegradable cellulose biomass. Untreated wood breaks down naturally or can be re-milled, whereas pressure-treated or painted wood contains chemical preservatives.",
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
  if (query.includes("bottle") || query.includes("plastic") || query.includes("cup")) {
    return { ...SAMPLE_WASTE_ITEMS.plastic_bottle, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("banana") || query.includes("fruit") || query.includes("apple") || query.includes("food") || query.includes("peel") || query.includes("vegetable")) {
    return { ...SAMPLE_WASTE_ITEMS.banana_peel, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("charger") || query.includes("cable") || query.includes("phone") || query.includes("wire") || query.includes("electronic")) {
    return { ...SAMPLE_WASTE_ITEMS.mobile_charger, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("can") || query.includes("aluminum") || query.includes("tin") || query.includes("soda") || query.includes("metal")) {
    return { ...SAMPLE_WASTE_ITEMS.aluminum_can, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("battery") || query.includes("cell")) {
    return { ...SAMPLE_WASTE_ITEMS.used_battery, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("pizza") || query.includes("cardboard") || query.includes("grease") || query.includes("box")) {
    return { ...SAMPLE_WASTE_ITEMS.pizza_box, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }

  // Generic neutral fallback
  return {
    id: `scan-${Date.now()}`,
    detectedItem: "Waste Item Inspection",
    material: "Mixed / General Household Material",
    category: "context_dependent",
    categoryLabel: "Context-Dependent / Inspection Needed",
    binColor: "Blue Bin (if clean & dry) OR Black Bin (if soiled)",
    whereToSegregate: "Inspect cleanliness: Sort into Blue Bin if dry recyclable paper/plastic/metal; place into Black Bin if food-soiled or mixed composites.",
    segregationSteps: [
      "1. Check the item for recycling identification symbols (#1 to #7 for plastics, PAP for paper, ALU for aluminum).",
      "2. Empty and clean off all food crumbs, oils, or residues.",
      "3. If clean and made of single-type recyclable material, drop in Blue Bin (Dry Recyclables).",
      "4. If multi-material foil pouch, waxed, or contaminated, place in Black Bin (General Trash)."
    ],
    confidence: 75,
    confidenceLevel: "medium",
    recommendedDisposal: "Check for material markings (e.g. recycling triangle or SPI resin symbol). If clean, dry, and recyclable (plastics #1, #2, #5, metal, paper), sort into dry recycling. If food-soiled or mixed composite, place in general waste.",
    whyThisResult: "The item requires inspection of material codes or cleanliness to determine exact stream separation.",
    ecoTip: "Always rinse containers to prevent contamination of recyclable paper and plastic bales.",
    ecoActionScore: 78,
    specialHandlingRequired: false,
    timestamp: new Date().toISOString(),
    imageUrl: imageBase64,
    isMock: true,
  };
}

// API: Analyze Waste Image (Multimodal Vision)
app.post("/api/analyze-waste", async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = "image/jpeg", hint, sampleId, forceMock } = req.body;

    const ai = getGeminiClient();

    // If force mock requested or no API key, use rich mock/demo response
    if (forceMock || !ai || !imageBase64) {
      const result = getFallbackAnalysis(hint, sampleId, imageBase64);
      res.json({ success: true, result, isDemoMode: true });
      return;
    }

    // Extract clean base64 data regardless of data URL formatting
    let cleanBase64 = String(imageBase64);
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }
    cleanBase64 = cleanBase64.trim();

    // Determine safe mimeType
    let normalizedMimeType = mimeType;
    if (typeof imageBase64 === "string" && imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:([^;]+);base64,/);
      if (match && match[1]) {
        normalizedMimeType = match[1];
      }
    }
    if (!normalizedMimeType || normalizedMimeType === "application/octet-stream") {
      normalizedMimeType = "image/jpeg";
    }

    const promptText = `You are EcoSort AI, an expert multimodal waste classification and segregation engine.
Analyze this photo of a waste item. The user asks two primary questions:
1. WHAT IS THE KIND OF WASTE?
- Identify the specific item (detectedItem).
- Identify the exact material composition (material).
- Determine category: one of 'recyclable', 'organic', 'ewaste', 'hazardous', 'general', 'context_dependent'.
- Determine categoryLabel: human-readable name e.g. 'Dry Recyclable / Paper & Cardboard', 'Organic / Food & Compost', 'E-Waste / Electronics', 'Hazardous / Special Waste', 'General Waste / Landfill'.

2. WHERE SHOULD HAVE TO SEGREGATE IT?
- Determine binColor: explicit bin name, e.g. 'Blue Bin (Dry Recyclables)', 'Green Bin (Organic / Compost)', 'Yellow Bin (E-Waste)', 'Red Bin (Hazardous Drop-Off)', 'Black Bin (General Trash)'.
- whereToSegregate: direct, clear 1-2 sentence instruction explaining exactly where to deposit this item.
- segregationSteps: array of 3 to 5 actionable step-by-step instructions to segregate the item properly (e.g. 1. Empty & rinse, 2. Detach cap/liner, 3. Crush/flatten, 4. Deposit in bin).

Additional fields required:
- recommendedDisposal: summary of recommended disposal method.
- whyThisResult: scientific and circular economy rationale.
- ecoTip: actionable environmental advice.
- ecoActionScore: integer between 50 and 100.
- confidence: integer between 60 and 99.
- confidenceLevel: 'high' (85-99), 'medium' (65-84), or 'low' (<65).
- specialHandlingRequired: boolean (true if batteries, electronics, chemicals, sharps, or biohazards).
- specialHandlingNotes: string note if special handling is needed.
- contaminationRisk: 'none', 'low', 'moderate', or 'high'.
- recyclingCode: e.g. 'PET 1', 'PAP 20', 'ALU 41', or null.
- alternativeUses: array of 2-3 creative upcycling or repurposing ideas.
- carbonSavedKg: estimated number of kg CO2e saved by proper diversion.

${hint ? `User note / hint: "${hint}".` : ""}
${sampleId ? `Item reference: "${sampleId}".` : ""}

Respond ONLY with valid JSON. Do not include markdown code fence formatting if possible.`;

    const response = await generateWithModelFallback(ai, {
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
    });

    let rawText = response.text || "{}";
    rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
    
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("JSON parse error on model response:", parseErr);
      // Attempt regex extraction of json block
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Unable to parse model response into JSON");
      }
    }

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
      id: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isMock: false,
    };

    res.json({ success: true, result, isDemoMode: false });
  } catch (error) {
    console.warn("Gemini Vision analysis error (served safe fallback):", (error as any)?.message || error);
    const fallback = getFallbackAnalysis(req.body.hint, req.body.sampleId, req.body.imageBase64);
    res.json({
      success: true,
      result: fallback,
      isDemoMode: true,
      fallbackReason: "Live AI model was temporarily experiencing high demand, provided structured fallback assessment.",
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

    const chatResponse = await generateWithModelFallback(ai, {
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
    console.warn("Gemini Chat note (served fallback):", (error as any)?.message || error);
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
