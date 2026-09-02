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
    const savedDemo = localStorage.getItem('ecosort_force_demo');
    if (savedDemo !== null) {
      this.isDemoModeForced = savedDemo === 'true';
    }
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
    localStorage.setItem('ecosort_force_demo', String(force));
  }

  public getForceDemoMode(): boolean {
    return this.isDemoModeForced;
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch('/api/health');
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
    console.group('🌿 [EcoSort AIService] Waste Analysis Request');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Sample ID hint:', sampleId || 'none');
    console.log('User text hint:', hint || 'none');
    console.log('Mime Type:', mimeType);
    console.log('Payload raw length:', imageBase64 ? `${imageBase64.length} chars` : '0 chars');

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

    console.log('Sanitized MimeType:', detectedMime);

    // If demo forced and we have a sampleId or mock match
    if (this.isDemoModeForced && sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
      console.log('Forced Demo Mode active. Returning predefined fixture:', sampleId);
      console.groupEnd();
      return {
        result: {
          ...SAMPLE_WASTE_ITEMS[sampleId],
          id: `scan-${Date.now()}`,
          timestamp: new Date().toISOString(),
          imageUrl: sanitizedBase64,
        },
        isDemoMode: true,
      };
    }

    // 1. Attempt primary backend endpoint /api/analyze-waste
    try {
      console.log('Sending payload to /api/analyze-waste...');
      const res = await fetch('/api/analyze-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: sanitizedBase64,
          mimeType: detectedMime,
          hint: hint?.trim() || undefined,
          sampleId: sampleId?.trim() || undefined,
          forceMock: this.isDemoModeForced,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          console.log('✅ Analysis successful from backend:');
          console.log('   - Detected Item:', data.result.detectedItem);
          console.log('   - Material:', data.result.material);
          console.log('   - Stream Category:', data.result.category, `(${data.result.categoryLabel})`);
          console.log('   - Where to Segregate:', data.result.whereToSegregate || data.result.binColor);
          console.log('   - Confidence:', `${data.result.confidence}% (${data.result.confidenceLevel})`);
          console.log('   - Is Live Gemini API:', !data.isDemoMode);
          console.groupEnd();

          return {
            result: {
              ...data.result,
              imageUrl: sanitizedBase64 || data.result.imageUrl,
            },
            isDemoMode: Boolean(data.isDemoMode),
          };
        }
      } else {
        console.warn(`Backend endpoint responded with HTTP ${res.status}. Falling back gracefully.`);
      }
    } catch (networkErr: any) {
      console.warn('Backend API unreachable (likely static host or offline):', networkErr);
    }

    // 2. If backend was not found (e.g. 404 on Vercel static) and client has VITE_GEMINI_API_KEY
    const clientAi = this.getClientGemini();
    if (clientAi && sanitizedBase64) {
      try {
        console.log('Attempting direct client-side Gemini multimodal query...');
        let cleanBase64 = sanitizedBase64;
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }
        cleanBase64 = cleanBase64.trim();

        const promptText = `Analyze this waste photo for EcoSort AI.
Respond in JSON with:
detectedItem (string), material (string), category ('recyclable'|'organic'|'ewaste'|'hazardous'|'general'|'context_dependent'), categoryLabel (string), binColor (string), whereToSegregate (string), segregationSteps (array of 3-4 strings), confidence (number 70-98), confidenceLevel ('high'|'medium'), recommendedDisposal (string), whyThisResult (string), ecoTip (string), ecoActionScore (number 70-95), specialHandlingRequired (boolean), contaminationRisk ('none'|'low'|'moderate'|'high'), recyclingCode (string or null), alternativeUses (array of 2 strings), carbonSavedKg (number).
${hint ? `Hint: ${hint}` : ''}`;

        const aiRes = await clientAi.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            { inlineData: { mimeType: detectedMime, data: cleanBase64 } },
            { text: promptText },
          ],
          config: { responseMimeType: 'application/json' },
        });

        const raw = (aiRes.text || '{}').replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
        const parsed = JSON.parse(raw);

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
      } catch (clientGeminiErr) {
        console.warn('Client-side Gemini failed, switching to local classifier:', clientGeminiErr);
      }
    }

    // 3. Guaranteed zero-error smart on-device classification fallback
    console.info('ℹ️ Executing intelligent on-device waste segregation engine.');
    console.groupEnd();
    const localResult = classifyWasteLocally(sanitizedBase64, hint, sampleId);
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
