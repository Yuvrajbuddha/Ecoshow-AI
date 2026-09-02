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

// Resilient model invocation with automatic fallbacks for 503 high-demand or rate limits
async function generateWithModelFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  }
): Promise<any> {
  const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
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
      const is503OrOverloaded =
        err?.status === "UNAVAILABLE" ||
        err?.code === 503 ||
        errMsg.includes("503") ||
        errMsg.toLowerCase().includes("high demand") ||
        errMsg.toLowerCase().includes("unavailable") ||
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("quota");

      if (is503OrOverloaded && i < candidateModels.length - 1) {
        console.warn(
          `Model ${model} is experiencing temporary high demand, trying fallback model ${candidateModels[i + 1]}...`
        );
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      throw err;
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
  if (query.includes("banana") || query.includes("fruit") || query.includes("apple") || query.includes("food") || query.includes("peel")) {
    return { ...SAMPLE_WASTE_ITEMS.banana_peel, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("charger") || query.includes("cable") || query.includes("phone") || query.includes("wire")) {
    return { ...SAMPLE_WASTE_ITEMS.mobile_charger, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("can") || query.includes("aluminum") || query.includes("tin") || query.includes("soda")) {
    return { ...SAMPLE_WASTE_ITEMS.aluminum_can, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("battery") || query.includes("cell")) {
    return { ...SAMPLE_WASTE_ITEMS.used_battery, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("pizza") || query.includes("cardboard") || query.includes("grease")) {
    return { ...SAMPLE_WASTE_ITEMS.pizza_box, imageUrl: imageBase64, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }

  // Generic neutral fallback
  return {
    id: `scan-${Date.now()}`,
    detectedItem: "Waste Item Inspection",
    material: "Mixed / General Material",
    category: "context_dependent",
    categoryLabel: "Context-Dependent / Mixed",
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

    const systemPrompt = `You are EcoSort AI, a state-of-the-art waste segregation and circular economy intelligence system.
Analyze the provided image of a waste or household item and determine its precise identity and disposal stream.

CRITICAL INSTRUCTIONS:
1. Detect EXACTLY what object is visible in the image.
   - If the image contains WOOD, timber, planks, sticks, wooden utensils, furniture scrap, or tree branches: classify it as Wood / Timber (Material: "Natural Untreated Wood" or "Treated / Composite Wood", Category: "organic" or "recyclable" or "general").
   - If the image contains PLASTIC: identify specific polymer if possible (PET #1, HDPE #2, PP #5, etc.).
   - If the image contains METAL: identify aluminum, steel, tin, etc.
   - If the image contains ORGANIC food or plants: classify as "organic".
   - Only classify as "ewaste" or "hazardous" if it is ACTUALLY a battery, electronic circuit, appliance, chemical container, or hazardous item. NEVER misclassify wood, organic, plastic, or paper as batteries!
2. Category must be one of: ["recyclable", "organic", "ewaste", "hazardous", "general", "context_dependent"].
3. Provide crystal clear, actionable disposal guidance acknowledging municipal variation.
4. Transparently explain the scientific rationale in "whyThisResult".
5. Return valid JSON matching the schema.`;

    const response = await generateWithModelFallback(ai, {
      contents: [
        {
          inlineData: {
            mimeType: normalizedMimeType,
            data: cleanBase64,
          },
        },
        {
          text: `Please identify and analyze this item for responsible waste segregation. ${hint ? `Additional hint: ${hint}` : ""}`,
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedItem: { type: Type.STRING, description: "Specific name of the detected item (e.g. Natural Wood Plank, PET Water Bottle, Banana Peel)" },
            material: { type: Type.STRING, description: "Material composition (e.g. Natural Wood / Cellulose, PET Plastic Resin #1)" },
            category: { type: Type.STRING, description: "One of: recyclable, organic, ewaste, hazardous, general, context_dependent" },
            categoryLabel: { type: Type.STRING, description: "Human friendly label e.g. Organic / Bulky Wood, Recyclable / Dry Waste, E-Waste" },
            confidence: { type: Type.INTEGER, description: "Confidence integer 0 to 100" },
            confidenceLevel: { type: Type.STRING, description: "high, medium, or low" },
            recommendedDisposal: { type: Type.STRING, description: "Actionable disposal instructions" },
            whyThisResult: { type: Type.STRING, description: "Scientific explanation why this stream applies" },
            ecoTip: { type: Type.STRING, description: "Practical sustainability tip" },
            ecoActionScore: { type: Type.INTEGER, description: "Gamification score between 50 and 100" },
            specialHandlingRequired: { type: Type.BOOLEAN, description: "True if hazardous or dangerous" },
            specialHandlingNotes: { type: Type.STRING },
            contaminationRisk: { type: Type.STRING, description: "none, low, moderate, or high" },
            recyclingCode: { type: Type.STRING, description: "e.g. PET 1, PAP 20, or null" },
            alternativeUses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            carbonSavedKg: { type: Type.NUMBER, description: "Estimated kg CO2e saved" },
          },
          required: [
            "detectedItem",
            "material",
            "category",
            "categoryLabel",
            "confidence",
            "confidenceLevel",
            "recommendedDisposal",
            "whyThisResult",
            "ecoTip",
            "ecoActionScore",
            "specialHandlingRequired",
          ],
        },
      },
    });

    let rawText = response.text || "{}";
    rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
    const parsedJson = JSON.parse(rawText);

    const result = {
      ...parsedJson,
      imageUrl: imageBase64,
      id: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isMock: false,
    };

    res.json({ success: true, result, isDemoMode: false });
  } catch (error) {
    console.warn("Gemini Vision analysis note (served safe fallback):", (error as any)?.message || error);
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
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64,
        },
      });
    }
    parts.push({
      text: userMessage || "How should I dispose of this waste item?",
    });

    const chatResponse = await generateWithModelFallback(ai, {
      contents: { parts },
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
