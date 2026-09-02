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

      if (!res.ok) {
        throw new Error(`Server returned HTTP status ${res.status}`);
      }

      const data = await res.json();
      if (data.result) {
        console.log('✅ Analysis successful from backend:');
        console.log('   - Detected Item:', data.result.detectedItem);
        console.log('   - Material:', data.result.material);
        console.log('   - Stream Category:', data.result.category, `(${data.result.categoryLabel})`);
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
      throw new Error('Invalid response structure received from analysis endpoint');
    } catch (err) {
      console.warn('⚠️ API endpoint error or offline fallback triggered:', err);
      
      let fallbackData = SAMPLE_WASTE_ITEMS.plastic_bottle;
      const query = (hint || '').toLowerCase();

      if (sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
        fallbackData = SAMPLE_WASTE_ITEMS[sampleId];
      } else if (query.includes('wood') || query.includes('timber') || query.includes('stick') || query.includes('plank')) {
        fallbackData = {
          id: `scan-${Date.now()}`,
          detectedItem: 'Wood / Timber Scrap',
          material: 'Untreated Wood / Plant Biomass',
          category: 'organic',
          categoryLabel: 'Organic / Bulky Wood',
          confidence: 88,
          confidenceLevel: 'high',
          recommendedDisposal: 'If clean and untreated, chip into garden mulch or compost. If painted or treated, take to municipal bulky waste collection.',
          whyThisResult: 'Wood is biodegradable organic biomass composed primarily of cellulose and lignin.',
          ecoTip: 'Repurpose wood offcuts for DIY repairs or garden borders before discarding.',
          ecoActionScore: 88,
          specialHandlingRequired: false,
          alternativeUses: ['Garden plant stakes', 'Craft carving', 'Compost brown matter'],
          carbonSavedKg: 0.32,
          timestamp: new Date().toISOString(),
          isMock: true,
        };
      } else {
        fallbackData = {
          id: `scan-${Date.now()}`,
          detectedItem: 'Visual Inspection Item',
          material: 'Composite / Mixed Material',
          category: 'context_dependent',
          categoryLabel: 'Context-Dependent / Mixed',
          confidence: 72,
          confidenceLevel: 'medium',
          recommendedDisposal: 'Inspect for material recycling symbols. If dry and clean, sort with appropriate recyclables; otherwise dispose in general waste.',
          whyThisResult: 'Live AI analysis fallback triggered. Check container markings for specific resin codes or disposal directions.',
          ecoTip: 'Always rinse items before tossing into dry recycling bins.',
          ecoActionScore: 75,
          specialHandlingRequired: false,
          timestamp: new Date().toISOString(),
          isMock: true,
        };
      }

      console.log('Using client fallback fixture:', fallbackData.detectedItem);
      console.groupEnd();

      return {
        result: {
          ...fallbackData,
          id: `scan-${Date.now()}`,
          timestamp: new Date().toISOString(),
          imageUrl: sanitizedBase64,
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
