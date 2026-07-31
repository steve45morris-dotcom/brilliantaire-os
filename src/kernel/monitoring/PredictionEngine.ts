import { globalMetricsCollector } from '../metrics/MetricsCollector.js';
import { globalStorageAdapter } from '../metrics/StorageAdapter.js';

export interface ProductivityProjections {
  planningSuccessScore: number;
  completionProbability: number;
  burnoutRiskLevel: 'low' | 'medium' | 'high';
  aiUtilizationForecast: number;
}

export class PredictionEngine {
  public getProjections(): ProductivityProjections {
    const summary = globalMetricsCollector.getSummary();
    const records = globalStorageAdapter.read();

    // 1. Planning Success Score
    const planningSuccessScore = summary.planningAccuracy || 100;

    // 2. Completion Probability
    const completionProbability = summary.executionAccuracy || 100;

    // 3. Burnout Risk Level
    const today = new Date().toISOString().split('T')[0];
    const dailyRecords = records.filter(r => r.timestamp.startsWith(today));
    const focusMinutes = dailyRecords
      .filter(r => r.type === 'SessionCompleted')
      .reduce((sum, r) => sum + (r.payload.focusDurationMinutes || 0), 0);

    const lowSatisfaction = dailyRecords.some(r => r.type === 'ReflectionSubmitted' && r.payload.satisfactionScore < 6);

    let burnoutRiskLevel: 'low' | 'medium' | 'high' = 'low';
    if (focusMinutes > 480 || (focusMinutes > 360 && lowSatisfaction)) {
      burnoutRiskLevel = 'high';
    } else if (focusMinutes > 300 || lowSatisfaction) {
      burnoutRiskLevel = 'medium';
    }

    // 4. AI Utilization Forecast (estimated requests next hour/day)
    const aiRequestCount = records.filter(r => r.type === 'AIRequestCompleted').length;
    const aiUtilizationForecast = Math.round(aiRequestCount * 1.1);

    return {
      planningSuccessScore,
      completionProbability,
      burnoutRiskLevel,
      aiUtilizationForecast
    };
  }
}

export const globalPredictionEngine = new PredictionEngine();
