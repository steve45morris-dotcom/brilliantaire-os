import { globalStorageAdapter } from './StorageAdapter.js';
import { MetricsCalculators } from './MetricsCalculators.js';

export interface DailySummary {
  date: string;
  planningAccuracy: number;
  executionAccuracy: number;
  focusEfficiency: number;
  totalAICost: number;
  avgAILatencyMs: number;
  completedMissionsCount: number;
}

export class AggregationEngine {
  public static generateDailySummary(dateStr: string): DailySummary {
    const records = globalStorageAdapter.read();
    const dayRecords = records.filter(r => {
      const recordDate = r.timestamp.split('T')[0];
      return recordDate === dateStr;
    });

    const aiMetrics = MetricsCalculators.calculateAICostAndLatency(dayRecords);
    const completedMissions = dayRecords.filter(r => r.type === 'MissionCompleted').length;

    return {
      date: dateStr,
      planningAccuracy: MetricsCalculators.calculatePlanningAccuracy(dayRecords),
      executionAccuracy: MetricsCalculators.calculateExecutionAccuracy(dayRecords),
      focusEfficiency: MetricsCalculators.calculateFocusEfficiency(dayRecords),
      totalAICost: aiMetrics.totalCost,
      avgAILatencyMs: aiMetrics.avgLatencyMs,
      completedMissionsCount: completedMissions
    };
  }
}
