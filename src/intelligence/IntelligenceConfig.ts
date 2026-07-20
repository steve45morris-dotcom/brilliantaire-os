export interface IntelligenceConfig {
  scanIntervalMs: number;
  enablePredictions: boolean;
  minConfidenceThreshold: number;
}

export const globalIntelligenceConfig: IntelligenceConfig = {
  scanIntervalMs: 60000,
  enablePredictions: true,
  minConfidenceThreshold: 70
};
