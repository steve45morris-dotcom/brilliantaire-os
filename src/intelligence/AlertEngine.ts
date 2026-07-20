import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalEventBus } from '../kernel/events/EventBus.js';
import { IntelligenceEvents } from './IntelligenceEvents.js';

export class AlertEngine {
  public checkAlerts(): void {
    const observations = globalIntelligenceRegistry.getObservations();
    const predictions = globalIntelligenceRegistry.getPredictions();
    const now = Date.now();

    // 1. Alert on Workflow failure or task failed
    const failures = observations.filter(o => o.category === 'failure' || o.message.toLowerCase().includes('failed'));
    failures.forEach(f => {
      const exists = globalIntelligenceRegistry.getAlerts().some(a => a.reason.includes(f.message));
      if (!exists) {
        const alert = {
          id: `alert-wf-fail-${now}-${Math.random().toString(36).substring(2, 6)}`,
          severity: 'high' as const,
          reason: `Workflow failure detected: ${f.message}`,
          timestamp: new Date().toISOString(),
          status: 'active' as const
        };
        globalIntelligenceRegistry.addAlert(alert);
        globalEventBus.publish(IntelligenceEvents.IntelligenceAlertTriggered, alert);
      }
    });

    // 2. Alert on Repository inactive (if project is inactive > 14 days)
    const hasInactivity = observations.some(o => o.source === 'AnalysisEngine' && o.message.includes('Inactive project state'));
    if (hasInactivity) {
      const exists = globalIntelligenceRegistry.getAlerts().some(a => a.reason.includes('GitHub repository inactive'));
      if (!exists) {
        const alert = {
          id: `alert-git-stale-${now}`,
          severity: 'medium' as const,
          reason: 'GitHub repository inactive for more than 14 days.',
          timestamp: new Date().toISOString(),
          status: 'active' as const
        };
        globalIntelligenceRegistry.addAlert(alert);
        globalEventBus.publish(IntelligenceEvents.IntelligenceAlertTriggered, alert);
      }
    }

    // 3. Alert on Revenue decline
    const hasRevenueDrop = observations.some(o => o.category === 'metric_recorded' && o.message.includes('Revenue') && o.message.includes('decline'));
    if (hasRevenueDrop) {
      const exists = globalIntelligenceRegistry.getAlerts().some(a => a.reason.includes('Revenue decline'));
      if (!exists) {
        const alert = {
          id: `alert-rev-decline-${now}`,
          severity: 'high' as const,
          reason: 'Significant revenue decline pattern detected.',
          timestamp: new Date().toISOString(),
          status: 'active' as const
        };
        globalIntelligenceRegistry.addAlert(alert);
        globalEventBus.publish(IntelligenceEvents.IntelligenceAlertTriggered, alert);
      }
    }

    // 4. Alert on Critical prediction risk
    const criticalPredictions = predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
    criticalPredictions.forEach(cp => {
      const exists = globalIntelligenceRegistry.getAlerts().some(a => a.reason.includes(cp.title));
      if (!exists) {
        const alert = {
          id: `alert-pred-risk-${now}`,
          severity: cp.riskLevel as 'high' | 'critical',
          reason: `High risk prediction generated: ${cp.title} (${cp.description})`,
          timestamp: new Date().toISOString(),
          status: 'active' as const
        };
        globalIntelligenceRegistry.addAlert(alert);
        globalEventBus.publish(IntelligenceEvents.IntelligenceAlertTriggered, alert);
      }
    });
  }
}

export const globalAlertEngine = new AlertEngine();
export default globalAlertEngine;
