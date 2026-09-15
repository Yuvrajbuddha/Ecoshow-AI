/**
 * Legacy export proxy forwarding to AIService
 */
export { AIService, aiService, generateUUID, getMlServiceUrl, formatPythonMlResponse, analyzeWasteImage } from './AIService';
export type { HealthStatus, InferenceEngine, AnalyzeWasteOptions, MlServiceHealth } from './AIService';
