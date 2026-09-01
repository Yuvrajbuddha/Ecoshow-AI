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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
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

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  res.json({
    status: "ok",
    hasGeminiKey: hasKey,
    app: "EcoSort AI",
    version: "1.0.0",
  });
});

// Helper for simulated fallback analysis based on text hint or image analysis
function getFallbackAnalysis(hint?: string, sampleId?: string) {
  if (sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
    return { ...SAMPLE_WASTE_ITEMS[sampleId], id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }

  const query = (hint || "").toLowerCase();
  if (query.includes("bottle") || query.includes("plastic") || query.includes("cup")) {
    return { ...SAMPLE_WASTE_ITEMS.plastic_bottle, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("banana") || query.includes("fruit") || query.includes("apple") || query.includes("food") || query.includes("peel")) {
    return { ...SAMPLE_WASTE_ITEMS.banana_peel, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("charger") || query.includes("cable") || query.includes("phone") || query.includes("wire")) {
    return { ...SAMPLE_WASTE_ITEMS.mobile_charger, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("can") || query.includes("aluminum") || query.includes("tin") || query.includes("soda")) {
    return { ...SAMPLE_WASTE_ITEMS.aluminum_can, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("battery") || query.includes("cell")) {
    return { ...SAMPLE_WASTE_ITEMS.used_battery, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }
  if (query.includes("pizza") || query.includes("cardboard") || query.includes("grease")) {
    return { ...SAMPLE_WASTE_ITEMS.pizza_box, id: `scan-${Date.now()}`, timestamp: new Date().toISOString() };
  }

  // Default intelligent fallback
  return {
    ...SAMPLE_WASTE_ITEMS.plastic_bottle,
    id: `scan-${Date.now()}`,
    timestamp: new Date().toISOString(),
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
      const result = getFallbackAnalysis(hint, sampleId);
      res.json({ success: true, result, isDemoMode: true });
      return;
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const systemPrompt = `You are EcoSort AI, a world-class waste segregation and responsible disposal intelligence system.
Analyze the provided image of a waste item. Identify:
1. Exact detected item name (e.g. "PET Beverage Bottle", "Aluminum Beverage Can", "Banana Peel", "Lithium-ion AA Battery", "Food-Soiled Pizza Box").
2. Core material composition (e.g. "PET Plastic (Resin #1)", "Anodized Aluminum", "Organic Biomass", "Zinc-Manganese Heavy Metals").
3. Category: one of ["recyclable", "organic", "ewaste", "hazardous", "general", "context_dependent"].
4. categoryLabel: A user friendly label like "Recyclable / Dry Waste", "Organic / Wet Waste", "E-Waste / Specialty", "Hazardous Waste", "General Trash", or "Context-Dependent / Mixed".
5. confidence: An integer between 0 and 100 representing your identification certainty.
6. confidenceLevel: "high" if confidence >= 85, "medium" if confidence >= 65 and < 85, or "low" if confidence < 65.
7. recommendedDisposal: Precise, actionable guidance on how to rinse, clean, separate, or deposit the item. Clearly state that municipal disposal rules can vary by location and never claim universal city authority.
8. whyThisResult: Transparent, scientific explanation of why the item belongs to this stream.
9. ecoTip: A concise, practical sustainability recommendation to reduce waste or reuse.
10. ecoActionScore: An integer between 50 and 100 for gamification/sustainability engagement (not a scientific metric).
11. specialHandlingRequired: Boolean, true if batteries, e-waste, toxic chemicals, biohazard, or dangerous sharp items.
12. specialHandlingNotes: Notes if special handling is required.
13. contaminationRisk: "none", "low", "moderate", or "high" (e.g. food grease, chemical residue).
14. alternativeUses: Array of 1-2 creative upcycling or repurposing ideas.
15. carbonSavedKg: Estimated kg CO2e emissions avoided when recycled/composted properly vs landfilling (e.g. 0.12).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this waste item for responsible sorting and disposal. ${hint ? `Context hint: ${hint}` : ""}`,
          },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedItem: { type: Type.STRING },
            material: { type: Type.STRING },
            category: { type: Type.STRING },
            categoryLabel: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            confidenceLevel: { type: Type.STRING },
            recommendedDisposal: { type: Type.STRING },
            whyThisResult: { type: Type.STRING },
            ecoTip: { type: Type.STRING },
            ecoActionScore: { type: Type.INTEGER },
            specialHandlingRequired: { type: Type.BOOLEAN },
            specialHandlingNotes: { type: Type.STRING },
            contaminationRisk: { type: Type.STRING },
            recyclingCode: { type: Type.STRING },
            alternativeUses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            carbonSavedKg: { type: Type.NUMBER },
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

    const parsedJson = JSON.parse(response.text || "{}");

    const result = {
      ...parsedJson,
      id: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isMock: false,
    };

    res.json({ success: true, result, isDemoMode: false });
  } catch (error) {
    console.error("Gemini Vision analysis error:", error);
    // Graceful fallback to simulated result so UI doesn't crash
    const fallback = getFallbackAnalysis(req.body.hint, req.body.sampleId);
    res.json({
      success: true,
      result: fallback,
      isDemoMode: true,
      fallbackReason: "Live AI model encountered a temporary glitch, providing simulated assessment.",
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

    const chatResponse = await ai.models.generateContent({
      model: "gemini-3.7-flash",
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
    console.error("Gemini Chat error:", error);
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
