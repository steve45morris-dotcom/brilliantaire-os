import { globalEventBus, KernelEvent } from '../events/EventBus.js';
import { globalStorageAdapter, TelemetryRecord } from './StorageAdapter.js';
import { MetricsCalculators } from './MetricsCalculators.js';
import { AggregationEngine } from './AggregationEngine.js';

export interface MetricPoint {
  metricName: string;
  value: number;
  timestamp: string;
}

export class MetricsCollector {
  private metrics: Map<string, MetricPoint[]> = new Map();

  constructor() {
    // Automatically wire to global EventBus to log all runtime event streams into telemetry storage
    globalEventBus.subscribeAll((event: KernelEvent) => {
      this.recordEvent(event);
    });
  }

  private recordEvent(event: KernelEvent): void {
    const record: TelemetryRecord = {
      timestamp: event.timestamp || new Date().toISOString(),
      type: event.type,
      payload: event.payload
    };
    globalStorageAdapter.append(record);

    // Keep an in-memory representation for fast lookup
    const metricName = event.type;
    const points = this.metrics.get(metricName) || [];
    points.push({
      metricName,
      value: typeof event.payload.value === 'number' ? event.payload.value : 1,
      timestamp: record.timestamp
    });
    this.metrics.set(metricName, points);
  }

  public recordMetric(name: string, value: number): void {
    const points = this.metrics.get(name) || [];
    points.push({
      metricName: name,
      value,
      timestamp: new Date().toISOString()
    });
    this.metrics.set(name, points);

    // Also dispatch an event for metric recording
    globalEventBus.publish('MetricRecorded', { name, value });
  }

  public getMetricHistory(name: string): MetricPoint[] {
    return this.metrics.get(name) || [];
  }

  public getSummary(): Record<string, number> {
    const records = globalStorageAdapter.read();
    const costLatency = MetricsCalculators.calculateAICostAndLatency(records);

    return {
      planningAccuracy: MetricsCalculators.calculatePlanningAccuracy(records),
      executionAccuracy: MetricsCalculators.calculateExecutionAccuracy(records),
      focusEfficiency: MetricsCalculators.calculateFocusEfficiency(records),
      totalAICost: costLatency.totalCost,
      avgAILatencyMs: costLatency.avgLatencyMs,
      completedMissionsCount: records.filter(r => r.type === 'MissionCompleted').length,
      localOperationsPercent: MetricsCalculators.calculateLocalOperationsPercent(records),
      offlinePrivacyIndex: MetricsCalculators.calculateOfflinePrivacyIndex(records)
    };
  }
}


export const globalMetricsCollector = new MetricsCollector();
