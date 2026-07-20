import { globalTelemetryCollector } from './TelemetryCollector.js';
import { globalMetricsCollector } from '../kernel/metrics/MetricsCollector.js';

export class MetricsFeed {
  public syncMetrics(): void {
    const telemetry = globalTelemetryCollector.getTelemetry();

    globalMetricsCollector.recordMetric('OILUptimeSeconds', telemetry.uptimeSeconds);
    globalMetricsCollector.recordMetric('OILWorkflowExecutionCount', telemetry.workflowExecutionCount);
    globalMetricsCollector.recordMetric('OILQueueThroughput', telemetry.queueThroughput);
    globalMetricsCollector.recordMetric('OILRecommendationAcceptanceRate', telemetry.recommendationAcceptanceRate);
    globalMetricsCollector.recordMetric('OILPredictionAccuracy', telemetry.predictionAccuracy);
    globalMetricsCollector.recordMetric('OILLearningAccuracy', telemetry.learningAccuracy);
  }
}

export const globalMetricsFeed = new MetricsFeed();
export default globalMetricsFeed;
