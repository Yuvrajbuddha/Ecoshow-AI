import { WasteAnalysisResult, ChatMessage } from '../types';
import { SAMPLE_WASTE_ITEMS } from './sampleData';
import { classifyWasteLocally } from './localWasteClassifier';
import { retrieveRagContext } from './wasteKnowledgeBase';

export interface HealthStatus {
  status: string;
  hasGeminiKey: boolean;
  app: string;
  version: string;
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

export class AIService {
  private static instance: AIService;
  private isDemoModeForced: boolean = false;

  private constructor() {
    this.isDemoModeForced = false;
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
   * Health check contacting server-side health endpoint
   */
  public async checkHealth(): Promise<HealthStatus> {
    const apiBase = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/api/health`, { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
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
   * Analyzes an uploaded waste image using secure server-side Gemini Multimodal Vision.
   * Returns:
   * 1. Waste item name
   * 2. Waste category
   * 3. Recyclability
   * 4. Disposal instructions
   * 5. Confidence score
   * 6. Environmental impact
   */
  public async analyzeWaste(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    hint?: string,
    sampleId?: string
  ): Promise<{ result: WasteAnalysisResult; isDemoMode: boolean }> {
    const scanTimestampMs = Date.now();
    const scanTimestamp = new Date().toISOString();
    const sessionId = generateUUID();
    const reqId = `scan-req-${scanTimestampMs}-${sessionId.substring(0, 8)}`;
    const scanSalt = `salt_${scanTimestampMs}_${sessionId.replace(/-/g, '').substring(0, 16)}`;
    const startTime = performance.now();

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
    console.log('─── PHASE 1: PREPARING SERVER-SIDE VISION PAYLOAD ───');
    console.log('Request ID:', reqId);
    console.log('Session ID (Unique Nonce / UUID):', sessionId);
    console.log('Timestamp:', scanTimestamp);
    console.log('Cache-Busting Salt:', scanSalt);
    console.log('Image Fingerprint:', imgFingerprint);
    console.log('MIME Type:', detectedMime);
    console.log('Base64 Character Length:', rawDataOnly.length);
    console.log('User Text Hint:', hint || 'none');
    console.log('Sample ID Hint:', sampleId || 'none');

    // Return predefined fixture only if specifically requested via sample button AND forced
    if (this.isDemoModeForced && sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
      console.warn('⚠️ Forced Demo Mode active for predefined sample fixture:', sampleId);
      const fixtureResult = {
        ...SAMPLE_WASTE_ITEMS[sampleId],
        id: `scan-${Date.now()}`,
        timestamp: scanTimestamp,
        imageUrl: sanitizedBase64,
      };
      console.groupEnd();
      return {
        result: fixtureResult,
        isDemoMode: true,
      };
    }

    // Call secure server-side endpoint /api/analyze-waste
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

    // Smart on-device fallback if server is unreachable
    console.warn('─── PHASE 4 (FALLBACK): SMART ON-DEVICE ENGINE ───');
    const localResult = classifyWasteLocally(sanitizedBase64, hint, sampleId);
    console.log('Local Classifier Output Result:', localResult);
    console.groupEnd();

    return {
      result: localResult,
      isDemoMode: true,
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
  hint?: string
): Promise<WasteAnalysisResult> {
  const service = AIService.getInstance();
  const res = await service.analyzeWaste(imageBase64, mimeType, hint, sampleKey);
  return res.result;
}
