import { WasteAnalysisResult, ChatMessage } from '../types';
import { SAMPLE_WASTE_ITEMS } from './sampleData';
import { classifyWasteLocally } from './localWasteClassifier';
import { retrieveRagContext } from './wasteKnowledgeBase';
import { GoogleGenAI } from '@google/genai';

export interface HealthStatus {
  status: string;
  hasGeminiKey: boolean;
  app: string;
  version: string;
}

/**
 * Generates an RFC4122 v4 UUID or cryptographic nonce to ensure unique session identification
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if randomUUID fails in specific iframe context
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class AIService {
  private static instance: AIService;
  private isDemoModeForced: boolean = false;
  private clientGemini: GoogleGenAI | null = null;

  private constructor() {
    this.isDemoModeForced = false;
  }

  private getClientGemini(): GoogleGenAI | null {
    const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_GOOGLE_API_KEY;
    if (clientKey && clientKey.trim() !== '' && clientKey !== 'MY_GEMINI_API_KEY') {
      if (!this.clientGemini) {
        try {
          this.clientGemini = new GoogleGenAI({
            apiKey: clientKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });
        } catch (e) {
          console.warn('Failed to construct client Gemini SDK:', e);
        }
      }
      return this.clientGemini;
    }
    return null;
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public setForceDemoMode(force: boolean) {
    this.isDemoModeForced = force;
  }

  public getForceDemoMode(): boolean {
    return this.isDemoModeForced;
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    const hasClientKey = Boolean((import.meta as any).env?.VITE_GEMINI_API_KEY);
    return {
      status: 'ok',
      hasGeminiKey: hasClientKey,
      app: 'EcoSort AI',
      version: '1.0.0',
    };
  }

  public async analyzeWaste(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    hint?: string,
    sampleId?: string
  ): Promise<{ result: WasteAnalysisResult; isDemoMode: boolean }> {
    const scanTimestampMs = Date.now();
    const scanTimestamp = new Date().toISOString();
    // Generate unique random UUID as session_id / nonce
    const sessionId = generateUUID();
    const reqId = `scan-req-${scanTimestampMs}-${sessionId.substring(0, 8)}`;
    const scanSalt = `salt_${scanTimestampMs}_${sessionId.replace(/-/g, '').substring(0, 16)}`;
    const startTime = performance.now();

    // Log the request ID, session ID, and timestamp for every scan
    console.log(`📡 [EcoSort AIService] Scan initiated | Request ID: ${reqId} | Session ID: ${sessionId} | Timestamp: ${scanTimestamp}`);

    // Robust image serialization: validate and sanitize data URL formatting
    let sanitizedBase64 = imageBase64;
    let detectedMime = mimeType;

    if (sanitizedBase64.startsWith('data:')) {
      const mimeMatch = sanitizedBase64.match(/^data:([^;]+);base64,/);
      if (mimeMatch && mimeMatch[1]) {
        detectedMime = mimeMatch[1];
      }
    } else if (sanitizedBase64.length > 0 && !sanitizedBase64.includes(',')) {
      sanitizedBase64 = `data:${detectedMime};base64,${sanitizedBase64}`;
    }

    if (detectedMime === 'image/jpg') {
      detectedMime = 'image/jpeg';
    }

    const rawDataOnly = (sanitizedBase64.includes(',') ? sanitizedBase64.split(',')[1] : sanitizedBase64).replace(/\s+/g, '');
    let hashVal = 0;
    const step = Math.max(1, Math.floor(rawDataOnly.length / 500));
    for (let i = 0; i < rawDataOnly.length; i += step) {
      hashVal = ((hashVal << 5) - hashVal) + rawDataOnly.charCodeAt(i);
      hashVal |= 0;
    }
    const imgFingerprint = `fp_${Math.abs(hashVal).toString(16)}_${rawDataOnly.length}chars`;

    console.group(`🔬 [EcoSort AIService Lifecycle] Request ID: ${reqId} | Session ID: ${sessionId}`);
    console.log('─── PHASE 1: PREPARING OUTGOING PAYLOAD ───');
    console.log('Request ID:', reqId);
    console.log('Session ID (Unique Nonce / UUID):', sessionId);
    console.log('Timestamp:', scanTimestamp);
    console.log('Cache-Busting Salt:', scanSalt);
    console.log('Image Fingerprint (Hash & Length):', imgFingerprint);
    console.log('MIME Type:', detectedMime);
    console.log('Base64 Character Length:', rawDataOnly.length);
    console.log('Estimated Byte Size:', `${Math.round(rawDataOnly.length * 0.75).toLocaleString()} bytes`);
    console.log('Base64 Head (first 50 chars):', rawDataOnly.substring(0, 50));
    console.log('Base64 Tail (last 50 chars):', rawDataOnly.substring(Math.max(0, rawDataOnly.length - 50)));
    console.log('Sample ID Hint:', sampleId || 'none (custom user upload/capture)');
    console.log('User Text Hint:', hint || 'none');
    console.log('Forced Demo Mode Flag:', this.isDemoModeForced);

    // Only return predefined fixture if specifically requested via sample button AND forced
    if (this.isDemoModeForced && sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
      console.warn('⚠️ Forced Demo Mode active for predefined sample fixture:', sampleId);
      const fixtureResult = {
        ...SAMPLE_WASTE_ITEMS[sampleId],
        id: `scan-${Date.now()}`,
        timestamp: scanTimestamp,
        imageUrl: sanitizedBase64,
      };
      console.log('Returning predefined fixture result:', fixtureResult);
      console.groupEnd();
      return {
        result: fixtureResult,
        isDemoMode: true,
      };
    }

    // 1. Primary backend endpoint /api/analyze-waste with anti-caching headers and unique body parameters
    const backendPayload = {
      requestId: reqId,
      sessionId: sessionId,
      session_id: sessionId,
      timestamp: scanTimestamp,
      clientTimestampMs: scanTimestampMs,
      salt: scanSalt,
      imageBase64: sanitizedBase64,
      mimeType: detectedMime,
      hint: hint?.trim() || undefined,
      sampleId: sampleId || undefined,
    };

    console.log('─── PHASE 2: DISPATCHING POST TO /api/analyze-waste ───');
    console.log('Outgoing Payload Object (without full base64):', {
      requestId: backendPayload.requestId,
      sessionId: backendPayload.sessionId,
      session_id: backendPayload.session_id,
      timestamp: backendPayload.timestamp,
      salt: backendPayload.salt,
      mimeType: backendPayload.mimeType,
      hint: backendPayload.hint,
      sampleId: backendPayload.sampleId,
    });

    try {
      const res = await fetch('/api/analyze-waste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Client-Request-Id': reqId,
          'X-Session-Id': sessionId,
          'X-Request-Timestamp': scanTimestamp,
          'X-Request-Salt': scanSalt,
        },
        body: JSON.stringify(backendPayload),
      });

      const elapsedMs = (performance.now() - startTime).toFixed(1);
      console.log(`─── PHASE 3: RECEIVED HTTP ${res.status} FROM /api/analyze-waste (${elapsedMs}ms) ───`);
      console.log(`Server Echoed Trace - Request ID: ${res.headers.get('X-Client-Request-Id') || reqId} | Session ID: ${res.headers.get('X-Session-Id') || sessionId} | Timestamp: ${res.headers.get('X-Request-Timestamp') || scanTimestamp}`);

      if (res.ok) {
        const rawJsonText = await res.text();
        console.log('Raw HTTP Response Body Text:\n', rawJsonText);

        const data = JSON.parse(rawJsonText);
        console.log('Parsed API JSON Body:', data);

        if (data.success && data.result) {
          console.log('✅ Waste analysis successfully retrieved from server.');
          console.log(`Model Used: ${data.modelUsed || 'default'} | Is Demo Mode: ${data.isDemoMode}`);
          console.groupEnd();
          return {
            result: {
              ...data.result,
              imageUrl: sanitizedBase64,
            },
            isDemoMode: Boolean(data.isDemoMode),
          };
        }
      } else {
        const errBody = await res.text();
        console.warn(`Backend endpoint responded with HTTP ${res.status}:`, errBody);
      }
    } catch (networkErr: any) {
      console.warn('Backend API unreachable or threw network error:', networkErr);
    }

    // 2. Direct client-side Gemini fallback if client key configured
    const clientAi = this.getClientGemini();
    if (clientAi && sanitizedBase64) {
      try {
        console.log(`─── PHASE 4 (FALLBACK): CLIENT-SIDE GEMINI DIRECT QUERY [Req: ${reqId} | Session: ${sessionId}] ───`);
        let cleanBase64 = sanitizedBase64;
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }
        cleanBase64 = cleanBase64.replace(/\s+/g, '');

        // Prompt with appended session_id nonce / random UUID and explicit freshness instructions
        const promptText = `Analyze this waste photo for EcoSort AI.
[session_id: "${sessionId}"]
Session ID / Nonce: ${sessionId}
Request ID: ${reqId}
Timestamp: ${scanTimestamp}

CRITICAL: Analyze the current image pixel content uniquely for session_id: "${sessionId}". Force a fresh analysis and ignore all potential cache matches, previous responses, or historical visual patterns.
Classify the exact item visible in the pixel data.
Respond in JSON with:
detectedItem (string), material (string), category ('recyclable'|'organic'|'ewaste'|'hazardous'|'general'|'context_dependent'), categoryLabel (string), binColor (string), whereToSegregate (string), segregationSteps (array of 3-4 strings), confidence (number 70-98), confidenceLevel ('high'|'medium'), recommendedDisposal (string), whyThisResult (string), ecoTip (string), ecoActionScore (number 70-95), specialHandlingRequired (boolean), contaminationRisk ('none'|'low'|'moderate'|'high'), recyclingCode (string or null), alternativeUses (array of 2 strings), carbonSavedKg (number).
${hint ? `User note: ${hint}` : ''}`;

        // Explicit system instruction instructing the model to analyze pixel content uniquely and ignore cache matches
        const systemInstruction = `You are EcoSort AI, an expert computer vision and waste segregation assistant.
CRITICAL DIRECTIVE: You must analyze the current image pixel content uniquely and independently from scratch. Force a fresh evaluation and ignore all potential cache matches, previous model generations, or historical image shortcuts. Base your assessment exclusively on the raw pixel details of the image submitted in this specific session.`;

        console.log('Client-Side Gemini Prompt Sent:\n', promptText);
        console.log('Client-Side System Instruction:\n', systemInstruction);
        console.log('Client-Side InlineData Length:', cleanBase64.length, 'Mime:', detectedMime);

        const fallbackModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];
        let aiRes = null;
        let successfulModel = '';
        for (const model of fallbackModels) {
          try {
            console.info(`Attempting client Gemini model: ${model}...`);
            aiRes = await clientAi.models.generateContent({
              model,
              contents: [
                { inlineData: { mimeType: detectedMime, data: cleanBase64 } },
                { text: promptText },
              ],
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
              },
            });
            if (aiRes) {
              successfulModel = model;
              break;
            }
          } catch (modelErr: any) {
            const statusCode = modelErr?.status || modelErr?.code || 500;
            console.info(`Client model ${model} temporarily unavailable (${statusCode}). Trying next model.`);
          }
        }

        if (aiRes) {
          const rawResponseText = aiRes.text || '{}';
          console.log(`Client-Side Gemini [${successfulModel}] Raw Text Response:\n`, rawResponseText);

          const cleanedJson = rawResponseText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
          const parsed = JSON.parse(cleanedJson);
          console.log('Client-Side Gemini Parsed JSON:', parsed);

          console.log('✅ Client-side Gemini vision completed successfully.');
          console.groupEnd();
          return {
            result: {
              ...parsed,
              id: `client-scan-${Date.now()}`,
              timestamp: new Date().toISOString(),
              imageUrl: sanitizedBase64,
              isMock: false,
            },
            isDemoMode: false,
          };
        }
      } catch (clientGeminiErr) {
        console.warn('Client-side Gemini failed, switching to local classifier:', clientGeminiErr);
      }
    }

    // 3. Guaranteed zero-error smart on-device classification fallback
    console.warn('─── PHASE 5 (EMERGENCY MOCK FALLBACK): SMART ON-DEVICE ENGINE ───');
    console.warn('Trigger reason: Both backend API and client-side Gemini were unavailable.');
    const localResult = classifyWasteLocally(sanitizedBase64, hint, sampleId);
    console.log('Local Classifier Output Result:', localResult);
    console.groupEnd();

    return {
      result: localResult,
      isDemoMode: true,
    };
  }

  public async sendChatMessage(
    userMessage: string,
    imageBase64?: string,
    mimeType?: string
  ): Promise<{ answer: string; ragSources: string[]; isDemoMode: boolean }> {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          imageBase64,
          mimeType,
        }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback handled below
    }

    // Check client Gemini if available
    const clientAi = this.getClientGemini();
    if (clientAi) {
      try {
        const contents: any[] = [];
        if (imageBase64) {
          let clean = imageBase64;
          if (clean.includes(',')) clean = clean.split(',')[1];
          contents.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: clean.trim() } });
        }
        contents.push({ text: `You are EcoSort AI, an expert sustainable waste segregation assistant. Answer clearly: ${userMessage}` });

        const aiRes = await clientAi.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: 'You are EcoSort AI, a knowledgeable and friendly recycling expert assistant.',
          },
        });

        return {
          answer: aiRes.text || 'I can help you sort your waste items into the right bins.',
          ragSources: ['EcoSort AI Client Engine'],
          isDemoMode: false,
        };
      } catch (err) {
        console.warn('Client Gemini chat failed, using local RAG:', err);
      }
    }

    // Offline RAG fallback
    const ragDocs = retrieveRagContext(userMessage);
    const ragSources = ragDocs.map((doc) => doc.topic);
    const contextSnippet = ragSources.length > 0 ? `\n\n(Local Segregation Rules: ${ragSources.join(', ')})` : '';

    return {
      answer: `To properly sort this item, check whether it is clean and dry. Recyclable materials (paper, cardboard, plastics #1, #2, #5, aluminum) go into the Blue Bin. Food scraps and organic waste belong in the Green Bin. Soiled containers or items with hazardous chemicals must be handled according to local municipal guidelines.${contextSnippet}`,
      ragSources: ragSources.length > 0 ? ragSources : ['General Waste Hierarchy'],
      isDemoMode: true,
    };
  }
}

export const aiService = AIService.getInstance();

export async function analyzeWasteImage(
  imageBase64: string,
  mimeType = 'image/jpeg',
  sampleKey?: string,
  hint?: string
): Promise<WasteAnalysisResult> {
  const service = AIService.getInstance();
  const res = await service.analyzeWaste(imageBase64, mimeType, hint, sampleKey);
  return res.result;
}
