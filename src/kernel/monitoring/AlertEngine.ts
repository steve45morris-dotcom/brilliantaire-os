import { globalEventBus, KernelEvent } from '../events/EventBus.js';
import { globalMetricsCollector } from '../metrics/MetricsCollector.js';

export interface AlertRule {
  name: string;
  metricKey: string;
  operator: 'gt' | 'lt';
  threshold: number;
  alertEventName: string;
}

export class AlertEngine {
  private rules: AlertRule[] = [
    { name: 'Performance Regression', metricKey: 'avgAILatencyMs', operator: 'gt', threshold: 5000, alertEventName: 'PerformanceRegressionAlert' },
    { name: 'Low Completion', metricKey: 'executionAccuracy', operator: 'lt', threshold: 50, alertEventName: 'LowCompletionAlert' },
    { name: 'Cost Overrun', metricKey: 'totalAICost', operator: 'gt', threshold: 5.0, alertEventName: 'CostOverrunAlert' }
  ];

  constructor() {
    // Listen for new telemetry events and re-evaluate
    globalEventBus.subscribeAll((event: KernelEvent) => {
      if (event.type === 'AIRequestCompleted' || event.type === 'MissionCompleted') {
        this.evaluateRules();
      }
    });
  }

  public evaluateRules(): void {
    const summary = globalMetricsCollector.getSummary();
    this.rules.forEach(rule => {
      const val = summary[rule.metricKey];
      if (val !== undefined) {
        let triggered = false;
        if (rule.operator === 'gt' && val > rule.threshold) triggered = true;
        if (rule.operator === 'lt' && val < rule.threshold) triggered = true;

        if (triggered) {
          globalEventBus.publish(rule.alertEventName, {
            ruleName: rule.name,
            currentValue: val,
            threshold: rule.threshold,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }
}

export const globalAlertEngine = new AlertEngine();
