import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalEventBus } from '../kernel/events/EventBus.js';
import { IntelligenceEvents } from './IntelligenceEvents.js';

export class InsightEngine {
  public generateInsights(): void {
    const observations = globalIntelligenceRegistry.getObservations();
    const now = Date.now();

    // 1. Success rate insight
    const taskCompleted = observations.filter(o => o.category === 'workflow_completed').length;
    const taskFailed = observations.filter(o => o.category === 'failure').length;
    const totalTasks = taskCompleted + taskFailed;

    if (totalTasks > 0) {
      const successRate = (taskCompleted / totalTasks) * 100;
      if (successRate > 90) {
        const ins = {
          id: `ins-success-${now}`,
          category: 'Operations Productivity',
          title: 'Workflow execution stability is high',
          description: `Analysis of the last ${totalTasks} workflows indicates a successful completion rate of ${successRate.toFixed(1)}%.`,
          timestamp: new Date().toISOString()
        };
        globalIntelligenceRegistry.addInsight(ins);
        globalEventBus.publish(IntelligenceEvents.InsightEngineSynced, ins);
      }
    }

    // 2. Telemetry and verification benefit insight
    const hasVerificationLog = observations.some(o => o.message.includes('compiler') || o.message.includes('typecheck'));
    if (hasVerificationLog) {
      const ins = {
        id: `ins-verif-${now}`,
        category: 'Quality Assurance',
        title: 'Verification Engine reduces deployment risks',
        description: 'Introducing verification gates has prevented type-safety regressions across recent sync iterations.',
        timestamp: new Date().toISOString()
      };
      globalIntelligenceRegistry.addInsight(ins);
      globalEventBus.publish(IntelligenceEvents.InsightEngineSynced, ins);
    }

    // Default insight fallback
    if (globalIntelligenceRegistry.getInsights().length === 0) {
      const defaultIns = {
        id: `ins-default-${now}`,
        category: 'System Performance',
        title: 'Operations Intelligence Layer is active',
        description: 'OIL continuously monitors transaction queues and feeds priority goals to the Executive Layer.',
        timestamp: new Date().toISOString()
      };
      globalIntelligenceRegistry.addInsight(defaultIns);
      globalEventBus.publish(IntelligenceEvents.InsightEngineSynced, defaultIns);
    }
  }
}

export const globalInsightEngine = new InsightEngine();
export default globalInsightEngine;
