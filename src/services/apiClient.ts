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

export class AIService {
  private static instance: AIService;
  private isDemoModeForced: boolean = false;
  private clientGemini: GoogleGenAI | null = null;

  private constructor() {
    // By default, demo mode is disabled so real user scans always use live AI models
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
    const reqId = `client-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const startTime = performance.now();

    // Robust image serialization: validate and sanitize data URL formatting
    let sanitizedBase64 = imageBase64;
    let detectedMime = mimeType;

    if (sanitizedBase64.startsWith('data:')) {
      const mimeMatch = sanitizedBase64.match(/^data:([^;]+);base64,/);
      if (mimeMatch && mimeMatch[1]) {
        detectedMime = mimeMatch[1];
      }
    } else if (sanitizedBase64.length > 0 && !sanitizedBase64.includes(',')) {
      // If raw base64 without prefix, format standard data URL
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

    console.group(`🔬 [EcoSort AIService Lifecycle] Request ID: ${reqId}`);
    console.log('─── PHASE 1: PREPARING OUTGOING PAYLOAD ───');
    console.log('Timestamp:', new Date().toISOString());
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
        timestamp: new Date().toISOString(),
        imageUrl: sanitizedBase64,
      };
      console.log('Returning predefined fixture result:', fixtureResult);
      console.groupEnd();
      return {
        result: fixtureResult,
        isDemoMode: true,
      };
    }

    // 1. Primary backend endpoint /api/analyze-waste with anti-caching
    const backendPayload = {
      imageBase64: sanitizedBase64,
      mimeType: detectedMime,
      hint: hint?.trim() || undefined,
      sampleId: sampleId?.trim() || undefined,
      forceMock: Boolean(sampleId && this.isDemoModeForced),
    };

    console.log('─── PHASE 2: DISPATCHING POST TO /api/analyze-waste ───');
    console.log('Outgoing Payload Object (without full base64):', {
      mimeType: backendPayload.mimeType,
      hint: backendPayload.hint,
      sampleId: backendPayload.sampleId,
      forceMock: backendPayload.forceMock,
      base64Length: backendPayload.imageBase64.length,
      imageFingerprint: imgFingerprint,
    });
    console.log('Full Raw Payload Sent to /api/analyze-waste:\n', JSON.stringify({
      ...backendPayload,
      imageBase64: `${sanitizedBase64.substring(0, 80)}... [${sanitizedBase64.length} chars total]`,
    }, null, 2));

    try {
      const res = await fetch('/api/analyze-waste', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Client-Request-Id': reqId,
        },
        body: JSON.stringify(backendPayload),
      });

      const elapsedMs = (performance.now() - startTime).toFixed(1);
      console.log(`─── PHASE 3: RECEIVED HTTP ${res.status} FROM /api/analyze-waste (${elapsedMs}ms) ───`);

      if (res.ok) {
        const rawJsonText = await res.text();
        console.log('Raw JSON String Received from Backend API:\n', rawJsonText);

        let data: any;
        try {
          data = JSON.parse(rawJsonText);
        } catch (jsonErr) {
          console.error('Failed to parse backend JSON response:', jsonErr, rawJsonText);
          throw jsonErr;
        }

        console.log('Parsed Backend JSON Response Object:', data);

        if (data.result) {
          console.log('✅ Analysis Result Classification Breakdown:');
          console.log('   • Detected Item:', data.result.detectedItem);
          console.log('   • Material Composition:', data.result.material);
          console.log('   • Category & Stream:', data.result.category, `(${data.result.categoryLabel})`);
          console.log('   • Bin Color Target:', data.result.binColor);
          console.log('   • Where to Segregate:', data.result.whereToSegregate);
          console.log('   • Segregation Steps:', data.result.segregationSteps);
          console.log('   • Confidence Level:', `${data.result.confidence}% (${data.result.confidenceLevel})`);
          console.log('   • Is Mock/Fallback Result?:', data.result.isMock);
          console.log('   • Is Demo Mode?:', data.isDemoMode);
          console.log('   • Fallback Reason:', data.fallbackReason || 'None (Live Gemini Multimodal Classification)');
          console.log('   • Scan Unique ID:', data.result.id);
          console.log(`Total Request-Response Duration: ${elapsedMs}ms`);
          console.groupEnd();

          return {
            result: {
              ...data.result,
              imageUrl: sanitizedBase64 || data.result.imageUrl,
            },
            isDemoMode: Boolean(data.isDemoMode),
          };
        } else {
          console.warn('Backend response was HTTP OK but lacked "result" field:', data);
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
        console.log('─── PHASE 4 (FALLBACK): CLIENT-SIDE GEMINI DIRECT QUERY ───');
        let cleanBase64 = sanitizedBase64;
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }
        cleanBase64 = cleanBase64.replace(/\s+/g, '');

        const promptText = `Analyze this waste photo for EcoSort AI.
Examine the unique visual pixels of this specific photo.
Respond in JSON with:
detectedItem (string), material (string), category ('recyclable'|'organic'|'ewaste'|'hazardous'|'general'|'context_dependent'), categoryLabel (string), binColor (string), whereToSegregate (string), segregationSteps (array of 3-4 strings), confidence (number 70-98), confidenceLevel ('high'|'medium'), recommendedDisposal (string), whyThisResult (string), ecoTip (string), ecoActionScore (number 70-95), specialHandlingRequired (boolean), contaminationRisk ('none'|'low'|'moderate'|'high'), recyclingCode (string or null), alternativeUses (array of 2 strings), carbonSavedKg (number).
${hint ? `User note: ${hint}` : ''}`;

        console.log('Client-Side Gemini Prompt Sent:\n', promptText);
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
              config: { responseMimeType: 'application/json' },
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

    // Local RAG fallback
    const matchedDocs = retrieveRagContext(userMessage);
    if (matchedDocs.length > 0) {
      const top = matchedDocs[0];
      return {
        answer: `**${top.topic}** (${top.category.toUpperCase()} STREAM)\n\n${top.summary}\n\n**Disposal Guidance:** ${top.detailedGuidance}\n\n**Precautions:** ${top.precautions}\n\n*Local Municipal Note:* ${top.municipalVariationNote}`,
        ragSources: [top.topic],
        isDemoMode: true,
      };
    }

    return {
      answer:
        '🌱 **EcoSort Waste Guide**: For the most responsible disposal, always separate recyclables from food waste, rinse plastic containers, and take electronics or batteries to dedicated collection kiosks. Municipal rules may vary by city.',
      ragSources: ['EcoSort Essential Segregation Guide'],
      isDemoMode: true,
    };
  }
}

export const aiService = AIService.getInstance();
