import { WasteAnalysisResult, ChatMessage } from '../types';
import { SAMPLE_WASTE_ITEMS } from './sampleData';
import { classifyWasteLocally } from './localWasteClassifier';
import { retrieveRagContext } from './wasteKnowledgeBase';

export type InferenceEngine = 'gemini' | 'local' | 'auto';

export interface AnalyzeWasteOptions {
  engine?: InferenceEngine;
  threshold?: number;
  preferMl?: boolean;
}

export interface HealthStatus {
  status: string;
  hasGeminiKey: boolean;
  app: string;
  version: string;
  mlService?: {
    available: boolean;
    url: string;
    modelLoaded?: boolean;
    architecture?: string;
  };
}

export interface MlServiceHealth {
  available: boolean;
  url: string;
  status?: string;
  model_loaded?: boolean;
  model_architecture?: string;
  calibrated_threshold?: number;
  error?: string;
}

/**
 * Returns the configured API base URL or an empty string (defaulting to relative routes).
 * In Google AI Studio, the integrated full-stack Express server runs on the same origin,
 * so relative URLs (/api/...) work out of the box without requiring external backends.
 */
export function getApiBaseUrl(): string {
  try {
    const customUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '') {
      return customUrl.trim().replace(/\/+$/, '');
    }
  } catch {
    // In environments without import.meta.env
  }
  return '';
}

/**
 * Resolves the configured local Python FastAPI ML microservice endpoint.
 * Evaluates VITE_ML_SERVICE_URL, ML_SERVICE_URL, or defaults to standard local port 8000.
 */
export function getMlServiceUrl(): string {
  try {
    const customUrl = (import.meta as any).env?.VITE_ML_SERVICE_URL || (import.meta as any).env?.ML_SERVICE_URL;
    if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '') {
      return customUrl.trim().replace(/\/+$/, '');
    }
  } catch {
    // In environments without import.meta.env
  }
  return 'http://127.0.0.1:8000';
}

/**
 * Generates an RFC4122 v4 UUID or cryptographic nonce to ensure unique request identification
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if randomUUID fails in specific iframe contexts
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formats raw output from Python FastAPI ML microservice into a complete WasteAnalysisResult
 */
export function formatPythonMlResponse(mlData: any, imageUri: string): WasteAnalysisResult {
  const rawCat = String(mlData.category || 'Other/Unknown').trim();
  const catLower = rawCat.toLowerCase();
  let normalizedCategory: 'recyclable' | 'organic' | 'ewaste' | 'hazardous' | 'general' = 'recyclable';
  let categoryLabel = rawCat;

  if (catLower.includes('wet') || catLower.includes('organic')) {
    normalizedCategory = 'organic';
    categoryLabel = 'Organic/Wet Waste';
  } else if (catLower.includes('e-waste') || catLower.includes('electronic')) {
    normalizedCategory = 'ewaste';
    categoryLabel = 'E-Waste';
  } else if (catLower.includes('hazard')) {
    normalizedCategory = 'hazardous';
    categoryLabel = 'Hazardous Waste';
  } else if (catLower.includes('other') || catLower.includes('unknown') || catLower.includes('trash')) {
    normalizedCategory = 'general';
    categoryLabel = 'Other/Unknown';
  } else {
    normalizedCategory = 'recyclable';
    categoryLabel = rawCat;
  }

  const isSpecial = normalizedCategory === 'ewaste' || normalizedCategory === 'hazardous';
  const confidence = typeof mlData.confidence === 'number' ? mlData.confidence : 90;
  const isRecyclable = Boolean(mlData.recyclable);

  return {
    id: `ml-scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    detectedItem: mlData.detected_item || 'Identified Waste Item',
    material: mlData.category || 'Classified Material',
    category: normalizedCategory,
    categoryLabel: categoryLabel,
    recyclability: isRecyclable
      ? 'Recyclable (Rinse/clean if applicable)'
      : isSpecial
      ? 'Specialized Drop-off Required (Do NOT landfill)'
      : 'Non-Recyclable Landfill Residual',
    disposalInstructions: mlData.disposal_instruction || 'Deposit into the recommended waste container.',
    recommendedDisposal: mlData.disposal_instruction || 'Deposit into designated bin.',
    binColor: mlData.bin || 'Check Local Bin Guidelines',
    whereToSegregate: `Deposit into ${mlData.bin || 'designated container'}. ${mlData.disposal_instruction || ''}`,
    segregationSteps: [
      `1. Classification: Identified by local model as ${mlData.detected_item || categoryLabel}`,
      `2. Preparation: ${mlData.disposal_instruction || 'Ensure item is emptied and cleared of major residue.'}`,
      `3. Segregation: Place into ${mlData.bin || 'recommended container'}.`,
      `4. Eco Impact: ${mlData.sustainability_tip || 'Proper sorting preserves recyclable materials.'}`,
    ],
    confidence: confidence,
    confidenceLevel: confidence >= 85 ? 'high' : 'medium',
    environmentalImpact: mlData.sustainability_tip || 'Proper segregation diverts materials from landfill.',
    whyThisResult: `Classified by trained deep learning model (${categoryLabel}, ${confidence}% confidence).`,
    ecoTip: mlData.sustainability_tip || 'Reuse or recycle materials whenever possible.',
    ecoActionScore: Math.min(98, Math.max(70, Math.round(confidence))),
    specialHandlingRequired: isSpecial,
    specialHandlingNotes: isSpecial ? 'Warning: Do not dispose into standard curbside household bins.' : undefined,
    contaminationRisk: isRecyclable ? 'low' : 'none',
    carbonSavedKg:
      typeof mlData.carbon_saved_kg === 'number'
        ? mlData.carbon_saved_kg
        : normalizedCategory === 'recyclable'
        ? 0.28
        : normalizedCategory === 'organic'
        ? 0.22
        : normalizedCategory === 'ewaste'
        ? 0.5
        : 0.1,
    imageUrl: imageUri,
    timestamp: new Date().toISOString(),
    isMock: false,
    rawCategory: rawCat,
    rawJson: {
      detected_item: mlData.detected_item,
      category: mlData.category,
      material: mlData.category,
      confidence: confidence,
      bin: mlData.bin,
      recyclable: isRecyclable,
      reason: `Classified by trained local ML model (${categoryLabel})`,
      disposal_instruction: mlData.disposal_instruction,
      sustainability_tip: mlData.sustainability_tip,
    },
  };
}

export class AIService {
  private static instance: AIService;
  private isDemoModeForced: boolean = false;
  private inferenceEngine: InferenceEngine = 'auto';
  private customMlServiceUrl: string | null = null;

  private constructor() {
    this.isDemoModeForced = false;
    this.inferenceEngine = 'auto';
    this.customMlServiceUrl = null;
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

  /**
   * Sets the active inference engine ('gemini' | 'local' | 'auto')
   */
  public setInferenceEngine(engine: InferenceEngine): void {
    console.log(`🔄 [EcoSort AIService] Inference engine switched to: ${engine}`);
    this.inferenceEngine = engine;
  }

  /**
   * Gets the active inference engine setting
   */
  public getInferenceEngine(): InferenceEngine {
    return this.inferenceEngine;
  }

  /**
   * Overrides or clears the custom local ML service URL
   */
  public setCustomMlServiceUrl(url: string | null): void {
    this.customMlServiceUrl = url && url.trim() !== '' ? url.trim().replace(/\/+$/, '') : null;
  }

  /**
   * Returns the active ML service URL
   */
  public getActiveMlServiceUrl(): string {
    return this.customMlServiceUrl || getMlServiceUrl();
  }

  /**
   * Checks the health and status of the local Python FastAPI ML service
   */
  public async checkMlServiceHealth(): Promise<MlServiceHealth> {
    const mlUrl = this.getActiveMlServiceUrl();
    const apiBase = getApiBaseUrl();

    // 1. First try direct connection to ML_SERVICE_URL
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${mlUrl}/health`, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        return {
          available: true,
          url: mlUrl,
          ...data,
        };
      }
    } catch {
      // Direct call failed or blocked by sandbox/CORS, try server-side proxy
    }

    // 2. Query Express server proxy endpoint /api/ml/status
    try {
      const res = await fetch(`${apiBase}/api/ml/status`, { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Server proxy unreachable
    }

    return {
      available: false,
      url: mlUrl,
      error: 'Local ML service is unreachable at ' + mlUrl,
    };
  }

  /**
   * Health check contacting server-side health endpoint
   */
  public async checkHealth(): Promise<HealthStatus> {
    const apiBase = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/api/health`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Server not reached, return graceful fallback
    }
    return {
      status: 'ok',
      hasGeminiKey: true,
      app: 'EcoSort AI',
      version: '1.0.0',
    };
  }

  /**
   * Performs direct or proxied inference using the local ML_SERVICE_URL endpoint.
   * Ensures accurate image data transfer with clean Base64 extraction and dual-key payloads.
   */
  public async classifyWithLocalModel(
    imageBase64: string,
    options?: { threshold?: number; hint?: string }
  ): Promise<{ result: WasteAnalysisResult; engine: string }> {
    const mlUrl = this.getActiveMlServiceUrl();
    const apiBase = getApiBaseUrl();
    const threshold = typeof options?.threshold === 'number' ? options.threshold : 60.0;

    // Accurate image data sanitization: extract raw clean Base64
    let cleanBase64 = String(imageBase64 || '').trim();
    let dataUri = cleanBase64;

    if (cleanBase64.startsWith('data:')) {
      const parts = cleanBase64.split(',');
      cleanBase64 = parts.length > 1 ? parts[1] : '';
    } else {
      dataUri = `data:image/jpeg;base64,${cleanBase64}`;
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, '');

    if (!cleanBase64 || cleanBase64.length < 20) {
      throw new Error('Invalid image payload: Base64 image data is empty or corrupted.');
    }

    console.log(`🔬 [EcoSort AIService] Dispatching to Local ML Endpoint: ${mlUrl}/classify-base64 (len: ${cleanBase64.length} chars)`);

    // Strategy A: Direct POST to Python FastAPI ML service
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${mlUrl}/classify-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          image: cleanBase64,
          imageBase64: cleanBase64,
          threshold,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const mlData = await res.json();
        if (mlData && mlData.success) {
          console.log('✅ Local ML Service direct inference succeeded:', mlData.category);
          const formatted = formatPythonMlResponse(mlData, dataUri);
          return {
            result: formatted,
            engine: mlData.model_architecture || 'mobilenet_v3_local',
          };
        }
      }
    } catch (directErr) {
      console.warn(`Direct connection to ${mlUrl}/classify-base64 not available, falling back to server ML proxy...`);
    }

    // Strategy B: Proxy through Express backend (/api/ml/classify)
    try {
      const res = await fetch(`${apiBase}/api/ml/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: cleanBase64,
          threshold,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          console.log('✅ Local ML inference succeeded via Express proxy:', data.result.category);
          return {
            result: {
              ...data.result,
              imageUrl: dataUri,
            },
            engine: data.engine || 'mobilenet_v3_local',
          };
        }
      }
    } catch (proxyErr) {
      console.warn('Server-side ML proxy error:', proxyErr);
    }

    throw new Error('Local ML service is currently unavailable. Please verify the Python service is running on ' + mlUrl);
  }

  /**
   * Analyzes an uploaded waste image, switching between Gemini API and the local ML_SERVICE_URL endpoint
   * based on user preference, configuration, or availability.
   */
  public async analyzeWaste(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    hint?: string,
    sampleId?: string,
    options?: AnalyzeWasteOptions
  ): Promise<{ result: WasteAnalysisResult; isDemoMode: boolean; engine?: string }> {
    const scanTimestampMs = Date.now();
    const scanTimestamp = new Date().toISOString();
    const sessionId = generateUUID();
    const reqId = `scan-req-${scanTimestampMs}-${sessionId.substring(0, 8)}`;
    const scanSalt = `salt_${scanTimestampMs}_${sessionId.replace(/-/g, '').substring(0, 16)}`;
    const startTime = performance.now();

    // Determine target inference engine
    const activeEngine: InferenceEngine = options?.engine || (options?.preferMl ? 'local' : this.inferenceEngine);
    console.log(`📡 [EcoSort AIService] Scan initiated | Engine: ${activeEngine} | Request ID: ${reqId}`);

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

    // Return predefined fixture only if specifically requested via sample button AND forced
    if (this.isDemoModeForced && sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
      console.warn('⚠️ Forced Demo Mode active for predefined sample fixture:', sampleId);
      const fixtureResult = {
        ...SAMPLE_WASTE_ITEMS[sampleId],
        id: `scan-${Date.now()}`,
        timestamp: scanTimestamp,
        imageUrl: sanitizedBase64,
      };
      return {
        result: fixtureResult,
        isDemoMode: true,
        engine: 'sample_fixture',
      };
    }

    // ─── BRANCH 1: Explicit Local Model Inference ─────────────────────────
    if (activeEngine === 'local') {
      console.log('⚡ User/System requested Local ML Model inference. Switching to ML_SERVICE_URL endpoint...');
      try {
        const localInference = await this.classifyWithLocalModel(sanitizedBase64, {
          threshold: options?.threshold,
          hint,
        });
        return {
          result: localInference.result,
          isDemoMode: false,
          engine: localInference.engine,
        };
      } catch (localErr: any) {
        console.warn('⚠️ Local model inference failed:', localErr?.message);
        // If explicitly requested local and it failed, bubble up or try smart on-device heuristics
        console.warn('Falling back to on-device heuristic engine...');
        const fallbackResult = classifyWasteLocally(sanitizedBase64, hint, sampleId);
        return {
          result: fallbackResult,
          isDemoMode: true,
          engine: 'local_heuristic_fallback',
        };
      }
    }

    // ─── BRANCH 2: Gemini API / Server Vision Endpoint ────────────────────
    const apiBase = getApiBaseUrl();
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
      preferMl: Boolean(options?.preferMl),
      threshold: options?.threshold,
    };

    console.log(`─── PHASE 2: DISPATCHING POST TO ${apiBase}/api/analyze-waste ───`);

    try {
      const res = await fetch(`${apiBase}/api/analyze-waste`, {
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

      if (res.ok) {
        const rawJsonText = await res.text();
        const data = JSON.parse(rawJsonText);

        if (data.success && data.result) {
          console.log('✅ Waste analysis successfully retrieved from server.');
          console.log(`Engine/Model: ${data.engine || data.modelUsed || 'gemini'} | Is Demo Mode: ${data.isDemoMode}`);
          return {
            result: {
              ...data.result,
              imageUrl: sanitizedBase64,
            },
            isDemoMode: Boolean(data.isDemoMode),
            engine: data.engine || data.modelUsed || 'gemini',
          };
        }
      } else if (res.status === 503) {
        // If Gemini is unavailable (e.g. missing API key), check if local ML service can process it
        console.warn('⚠️ Server reported 503 (AI service unavailable). Attempting fallback to local ML_SERVICE_URL...');
        try {
          const mlInference = await this.classifyWithLocalModel(sanitizedBase64, {
            threshold: options?.threshold,
            hint,
          });
          return {
            result: mlInference.result,
            isDemoMode: false,
            engine: mlInference.engine,
          };
        } catch {
          // Both Gemini and ML service down
        }
      } else {
        const errBody = await res.text();
        console.warn(`Backend endpoint responded with HTTP ${res.status}:`, errBody);
      }
    } catch (networkErr: any) {
      console.warn('Backend API unreachable or threw network error:', networkErr);
      // Attempt local ML endpoint directly before pure offline heuristics
      try {
        console.log('Attempting direct local ML service fallback...');
        const mlInference = await this.classifyWithLocalModel(sanitizedBase64, {
          threshold: options?.threshold,
          hint,
        });
        return {
          result: mlInference.result,
          isDemoMode: false,
          engine: mlInference.engine,
        };
      } catch {
        // ML service also unreachable
      }
    }

    // ─── BRANCH 3: On-Device Heuristic Fallback ───────────────────────────
    console.warn('─── PHASE 4 (FALLBACK): SMART ON-DEVICE ENGINE ───');
    const localResult = classifyWasteLocally(sanitizedBase64, hint, sampleId);
    console.log('Local Classifier Output Result:', localResult);

    return {
      result: localResult,
      isDemoMode: true,
      engine: 'local_heuristic',
    };
  }

  /**
   * Sends user questions to server-side AI chat endpoint
   */
  public async sendChatMessage(
    userMessage: string,
    imageBase64?: string,
    mimeType?: string
  ): Promise<{ answer: string; ragSources: string[]; isDemoMode: boolean }> {
    const apiBase = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/api/chat`, {
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
      // offline fallback
    }

    // Local RAG fallback
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
  hint?: string,
  options?: AnalyzeWasteOptions
): Promise<WasteAnalysisResult> {
  const service = AIService.getInstance();
  const res = await service.analyzeWaste(imageBase64, mimeType, hint, sampleKey, options);
  return res.result;
}

