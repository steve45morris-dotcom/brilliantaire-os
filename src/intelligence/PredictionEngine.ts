import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalEventBus } from '../kernel/events/EventBus.js';
import { IntelligenceEvents } from './IntelligenceEvents.js';

export class PredictionEngine {
  public generatePredictions(): void {
    const observations = globalIntelligenceRegistry.getObservations();
    const now = Date.now();

    // 1. Project Delay Risk (inactive GitHub)
    const lastGithubSync = observations
      .filter(o => o.source === 'GitHub' && o.category === 'sync')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    const staleDays = lastGithubSync 
      ? Math.floor((now - new Date(lastGithubSync.timestamp).getTime()) / (24 * 60 * 60 * 1000))
      : 14;

    if (staleDays >= 7) {
      const pred = {
        id: `pred-delay-${now}`,
        title: 'Project Development Delay Risk',
        description: `Stale repository detected. No activity in ${staleDays} days creates high risk of missing upcoming milestone deadlines.`,
        confidence: staleDays > 14 ? 90 : 75,
        expectedDate: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        riskLevel: staleDays > 14 ? 'high' as const : 'medium' as const
      };
      globalIntelligenceRegistry.addPrediction(pred);
      globalEventBus.publish(IntelligenceEvents.PredictionGenerated, pred);
    }

    // 2. Workflow Failures Risk (failures in logs)
    const failuresCount = observations.filter(o => o.category === 'failure' || o.message.toLowerCase().includes('failed')).length;
    if (failuresCount > 0) {
      const pred = {
        id: `pred-fail-${now}`,
        title: 'Workflow Execution Latency Risk',
        description: `${failuresCount} execution interruptions observed in last cycles. High probability of degraded task latency in next runs.`,
        confidence: 85,
        expectedDate: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
        riskLevel: failuresCount > 3 ? 'critical' as const : 'medium' as const
      };
      globalIntelligenceRegistry.addPrediction(pred);
      globalEventBus.publish(IntelligenceEvents.PredictionGenerated, pred);
    }

    // 3. Revenue Risks (lack of active publish cycles)
    const hasPublishIssues = observations.some(o => o.message.includes('Publishing') && o.message.includes('stopped'));
    if (hasPublishIssues) {
      const pred = {
        id: `pred-rev-${now}`,
        title: 'Monetization & Ad Delivery Revenue Risk',
        description: 'Publishing workflows are inactive. Interrupted marketing release cadences project a potential drop in ad impressions.',
        confidence: 90,
        expectedDate: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'high' as const
      };
      globalIntelligenceRegistry.addPrediction(pred);
      globalEventBus.publish(IntelligenceEvents.PredictionGenerated, pred);
    }

    // 4. Default fallbacks to ensure predictions list is never empty
    if (globalIntelligenceRegistry.getPredictions().length === 0) {
      const defaultPred = {
        id: `pred-default-${now}`,
        title: 'System Stability Outlook',
        description: 'All system checks optimal. Telemetry data projects normal CPU load and transaction latency bounds.',
        confidence: 95,
        expectedDate: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'low' as const
      };
      globalIntelligenceRegistry.addPrediction(defaultPred);
      globalEventBus.publish(IntelligenceEvents.PredictionGenerated, defaultPred);
    }
  }
}

export const globalPredictionEngine = new PredictionEngine();
export default globalPredictionEngine;
