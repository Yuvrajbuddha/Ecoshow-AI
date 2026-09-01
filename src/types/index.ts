export type WasteCategory =
  | 'recyclable'
  | 'organic'
  | 'ewaste'
  | 'hazardous'
  | 'general'
  | 'context_dependent';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface WasteAnalysisResult {
  id: string;
  detectedItem: string;
  material: string;
  category: WasteCategory;
  categoryLabel: string;
  confidence: number; // 0 to 100
  confidenceLevel: ConfidenceLevel;
  recommendedDisposal: string;
  whyThisResult: string;
  ecoTip: string;
  ecoActionScore: number; // 0 to 100
  specialHandlingRequired: boolean;
  specialHandlingNotes?: string;
  contaminationRisk?: 'none' | 'low' | 'moderate' | 'high';
  recyclingCode?: string; // e.g. "PET 1"
  alternativeUses?: string[];
  carbonSavedKg?: number;
  timestamp: string;
  imageUrl?: string;
  isMock?: boolean;
}

export interface DisposalCenter {
  id: string;
  name: string;
  category: WasteCategory;
  categoryLabel: string;
  address: string;
  distanceKm: number;
  status: 'Open' | 'Closed' | 'Closing Soon';
  openingHours: string;
  phone: string;
  acceptedMaterials: string[];
  latitude: number;
  longitude: number;
  rating: number;
  verified: boolean;
}

export interface ImpactMetrics {
  itemsScanned: number;
  correctlySorted: number;
  ecoScore: number;
  streakDays: number;
  ecoPoints: number;
  totalCarbonSavedKg: number;
  categoryBreakdown: {
    recyclable: number;
    organic: number;
    ewaste: number;
    hazardous: number;
    general: number;
    context_dependent: number;
  };
  weeklyActivity: {
    day: string;
    scans: number;
    sorted: number;
  }[];
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  maxProgress: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  imageAttachment?: string;
  analysisData?: Partial<WasteAnalysisResult>;
  ragSources?: string[];
  isThinking?: boolean;
}

export interface GuideItem {
  id: string;
  title: string;
  category: WasteCategory;
  categoryLabel: string;
  iconName: string;
  badgeColor: string;
  description: string;
  examples: string[];
  preparationSteps: string[];
  dos: string[];
  donts: string[];
  specialWarning?: string;
  recyclingCode?: string;
}

export type ActiveTab =
  | 'home'
  | 'scan'
  | 'chat'
  | 'impact'
  | 'centers'
  | 'guide'
  | 'responsible-ai'
  | 'settings';
