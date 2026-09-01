import { WasteAnalysisResult, ChatMessage } from '../types';
import { SAMPLE_WASTE_ITEMS } from './sampleData';

export interface HealthStatus {
  status: string;
  hasGeminiKey: boolean;
  app: string;
  version: string;
}

export class AIService {
  private static instance: AIService;
  private isDemoModeForced: boolean = false;

  private constructor() {
    const savedDemo = localStorage.getItem('ecosort_force_demo');
    if (savedDemo !== null) {
      this.isDemoModeForced = savedDemo === 'true';
    }
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
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (e) {
      return {
        status: 'offline_fallback',
        hasGeminiKey: false,
        app: 'EcoSort AI',
        version: '1.0.0',
      };
    }
  }

  public async analyzeWaste(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    hint?: string,
    sampleId?: string
  ): Promise<{ result: WasteAnalysisResult; isDemoMode: boolean }> {
    // If demo forced and we have a sampleId or mock match
    if (this.isDemoModeForced && sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
      return {
        result: {
          ...SAMPLE_WASTE_ITEMS[sampleId],
          id: `scan-${Date.now()}`,
          timestamp: new Date().toISOString(),
          imageUrl: imageBase64,
        },
        isDemoMode: true,
      };
    }

    try {
      const res = await fetch('/api/analyze-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          hint,
          sampleId,
          forceMock: this.isDemoModeForced,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.result) {
        return {
          result: {
            ...data.result,
            imageUrl: imageBase64 || data.result.imageUrl,
          },
          isDemoMode: Boolean(data.isDemoMode),
        };
      }
      throw new Error('Invalid response structure');
    } catch (err) {
      console.warn('API error, falling back to client-side smart mock:', err);
      // Fallback
      const sampleKeys = Object.keys(SAMPLE_WASTE_ITEMS);
      const chosenSample = sampleId
        ? SAMPLE_WASTE_ITEMS[sampleId]
        : SAMPLE_WASTE_ITEMS[sampleKeys[Math.floor(Math.random() * sampleKeys.length)]];

      return {
        result: {
          ...chosenSample,
          id: `scan-${Date.now()}`,
          timestamp: new Date().toISOString(),
          imageUrl: imageBase64,
          isMock: true,
        },
        isDemoMode: true,
      };
    }
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

      if (!res.ok) throw new Error('Chat failed');
      return await res.json();
    } catch (e) {
      console.warn('Chat API error, using offline response', e);
      return {
        answer:
          '🌱 **EcoSort Waste Guide**: For the most responsible disposal, always separate recyclables from food waste, rinse plastic bottles, and take electronics or batteries to dedicated drop-off facilities. Municipal rules may vary by city.',
        ragSources: ['EcoSort Essential Segregation Guide'],
        isDemoMode: true,
      };
    }
  }
}

export const aiService = AIService.getInstance();
