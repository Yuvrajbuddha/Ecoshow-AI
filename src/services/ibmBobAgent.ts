/**
 * EcoSort AI - IBM Bob AI Agent & Pipeline Orchestrator
 * ====================================================
 * Implements the unified pipeline orchestrated by IBM Bob:
 *
 *   User Input (Image / Text / Document)
 *       ↓
 *   Primary Classifier (ML Model / Gemini Vision)
 *       ↓
 *   IBM AI (Entity Extraction & Waste Information Processing)
 *       ↓
 *   IBM Validation & Safety Audit
 *       ↓
 *   Final Unified Waste Result
 */

import { WasteAnalysisResult } from '../types/index.js';
import {
  extractEntitiesWithIbmNlu,
  validateAndAuditWasteResult,
  enrichWithIbmAi,
  isIbmWatsonxConfigured,
  queryIbmGraniteTextGeneration
} from './ibmAiService.js';

export interface IbmBobPipelineStep {
  stepNumber: number;
  name: string;
  executor: string;
  status: 'completed' | 'in_progress' | 'skipped';
  details: string;
  timestamp: string;
}

export interface IbmBobExecutionTrace {
  traceId: string;
  agent: string;
  version: string;
  inputModality: 'image' | 'text' | 'document';
  steps: IbmBobPipelineStep[];
  startedAt: string;
  completedAt?: string;
}

export function createExecutionTrace(
  inputModality: 'image' | 'text' | 'document',
  traceId: string
): IbmBobExecutionTrace {
  return {
    traceId,
    agent: 'IBM Bob (EcoSort AI Developer & Inference Agent)',
    version: '2.4.0',
    inputModality,
    steps: [],
    startedAt: new Date().toISOString(),
  };
}

export function recordPipelineStep(
  trace: IbmBobExecutionTrace,
  stepNumber: number,
  name: string,
  executor: string,
  details: string
): void {
  trace.steps.push({
    stepNumber,
    name,
    executor,
    status: 'completed',
    details,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Runs the full IBM Bob unified pipeline on a preliminary waste classification result.
 * Fulfills Requirements #1, #3, #6, #7, #8.
 */
export async function executeIbmBobPipeline(
  inputModality: 'image' | 'text' | 'document',
  preliminaryResult: WasteAnalysisResult,
  traceId: string,
  rawInputContext?: string
): Promise<{ result: WasteAnalysisResult; trace: IbmBobExecutionTrace }> {
  const trace = createExecutionTrace(inputModality, traceId);

  // Step 1: Input Ingestion & Primary Classification
  recordPipelineStep(
    trace,
    1,
    'Input Ingestion & Primary Inference',
    inputModality === 'image'
      ? (preliminaryResult.isMock ? 'Local ML Fallback' : 'Deep Learning MobileNetV3 / Vision')
      : 'Multimodal Parser',
    `Received ${inputModality} payload. Preliminary detection: "${preliminaryResult.detectedItem}"`
  );

  // Step 2: IBM AI NLU & Material Entity Extraction
  const textContext = `${rawInputContext || ''} ${preliminaryResult.detectedItem} ${preliminaryResult.material} ${preliminaryResult.whyThisResult || ''}`;
  const extracted = extractEntitiesWithIbmNlu(textContext);
  recordPipelineStep(
    trace,
    2,
    'IBM Entity Extraction',
    'IBM Granite NLU Parser',
    `Extracted material: "${extracted.material}", Condition: "${extracted.physicalCondition}", Hazards: [${extracted.hazardIndicators.join(', ') || 'None'}]`
  );

  // Step 3: Waste Information Extraction & Bin Mapping
  recordPipelineStep(
    trace,
    3,
    'Waste Information Extraction',
    'IBM EcoSort Domain Matrix',
    `Mapped to waste stream "${preliminaryResult.categoryLabel}" with target container "${preliminaryResult.binColor}"`
  );

  // Step 4: AI Response Validation & Cross-Category Safety Audit
  const audit = validateAndAuditWasteResult(preliminaryResult, extracted);
  recordPipelineStep(
    trace,
    4,
    'IBM Response Validation & Safety Audit',
    'IBM Granite Guardian & Validator',
    `Validation status: ${audit.validationStatus.toUpperCase()}. Notes: ${audit.validationNotes.join('; ')}`
  );

  // Step 5: Carbon Impact & EPA WARM Sustainability Quantification
  recordPipelineStep(
    trace,
    5,
    'Sustainability Impact Calculation',
    'EPA WARM & IBM Circular Economy Benchmark',
    `Calculated carbon avoidance: ~${audit.carbonSavedKg} kg CO₂e based on material recycling coefficient.`
  );

  // Assemble the enriched final result
  const enriched = enrichWithIbmAi({
    ...preliminaryResult,
    carbonSavedKg: audit.carbonSavedKg,
  });

  trace.completedAt = new Date().toISOString();

  return {
    result: enriched,
    trace,
  };
}

/**
 * Returns IBM Bob Agent metadata for system introspection and UI status banners.
 */
export function getIbmBobAgentInfo() {
  return {
    agentName: 'IBM Bob',
    role: 'AI Waste Segregation Assistant & Workflow Engineer',
    framework: 'IBM watsonx.ai & Granite Open Models',
    version: '2.4.0',
    capabilities: [
      'Multi-source waste entity extraction',
      'Cross-category safety auditing (Hazard/E-waste)',
      'Contamination risk inspection',
      'Circular economy carbon accounting',
      'Calibrated confidence scoring',
    ],
    supportedModals: ['image', 'text', 'document'],
    isWatsonxAvailable: isIbmWatsonxConfigured(),
  };
}
