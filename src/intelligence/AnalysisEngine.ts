import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalAlertEngine } from './AlertEngine.js';
import { globalRecommendationEngine } from './RecommendationEngine.js';

export class AnalysisEngine {
  public runAnalysis(): void {
    const observations = globalIntelligenceRegistry.getObservations();
    const now = Date.now();

    // 1. Detect repeated failures (more than 3 failures in observations)
    const failures = observations.filter(o => o.category === 'failure' || o.message.toLowerCase().includes('failed'));
    if (failures.length >= 3) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-anal-fail-${now}`,
        source: 'AnalysisEngine',
        category: 'pattern_detected',
        timestamp: new Date().toISOString(),
        message: `Repeated failures detected: ${failures.length} execution interruptions observed.`,
        data: { failureCount: failures.length }
      });

      globalIntelligenceRegistry.addAlert({
        id: `alert-fail-${now}`,
        severity: 'high',
        reason: 'Multiple system failures detected. Execution pipeline reliability compromised.',
        timestamp: new Date().toISOString(),
        status: 'active'
      });
    }

    // 2. Detect inactive projects (Mock checks based on observations timestamps)
    // If we have observations but no recent github syncs
    const lastGithubSync = observations
      .filter(o => o.source === 'GitHub' && o.category === 'sync')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const isStale = lastGithubSync 
      ? (now - new Date(lastGithubSync.timestamp).getTime()) > (14 * 24 * 60 * 60 * 1000)
      : true; // Default stale if never synced

    if (isStale) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-anal-stale-${now}`,
        source: 'AnalysisEngine',
        category: 'pattern_detected',
        timestamp: new Date().toISOString(),
        message: 'Inactive project state detected: No GitHub activity logged in the last 14 days.',
        data: { lastSyncAt: lastGithubSync?.timestamp || 'never' }
      });
    }

    // 3. Detect queue congestion
    const taskStarted = observations.filter(o => o.message.includes('started')).length;
    const taskCompleted = observations.filter(o => o.message.includes('completed')).length;
    const pendingTasks = taskStarted - taskCompleted;

    if (pendingTasks > 5) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-anal-queue-${now}`,
        source: 'AnalysisEngine',
        category: 'pattern_detected',
        timestamp: new Date().toISOString(),
        message: `Queue congestion pattern detected: ${pendingTasks} active tasks currently block pipeline threads.`,
        data: { pendingTasks }
      });
    }

    // 4. Skill duplication & memory inconsistencies
    const registerSkills = observations.filter(o => o.category === 'integration_registered');
    const duplicates = registerSkills.filter((item, index) => registerSkills.findIndex(s => s.message === item.message) !== index);
    if (duplicates.length > 0) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-anal-dup-${now}`,
        source: 'AnalysisEngine',
        category: 'pattern_detected',
        timestamp: new Date().toISOString(),
        message: `Skill duplication detected: Multiple registration requests for integration plugins.`,
        data: { duplicates: duplicates.map(d => d.message) }
      });
    }
  }
}

export const globalAnalysisEngine = new AnalysisEngine();
export default globalAnalysisEngine;
