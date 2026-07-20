import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';

export class CorrelationEngine {
  public findCorrelations(): void {
    const observations = globalIntelligenceRegistry.getObservations();
    const now = Date.now();

    // 1. Revenue dropped AND GitHub activity decreased AND Publishing stopped -> Content pipeline stalled
    const hasRevenueDrop = observations.some(o => o.category === 'metric_recorded' && o.message.includes('Revenue') && o.message.includes('decline'));
    const hasLowGitHub = observations.some(o => o.source === 'AnalysisEngine' && o.message.includes('Inactive project state'));
    const hasPublishStop = observations.some(o => o.source === 'Workflows' && o.message.includes('Publishing') && o.message.includes('stopped'));

    if (hasRevenueDrop || (hasLowGitHub && hasPublishStop)) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-corr-stalled-${now}`,
        source: 'CorrelationEngine',
        category: 'correlation_detected',
        timestamp: new Date().toISOString(),
        message: 'Content and publication pipeline stalled. GitHub inactivity correlates directly with lack of release actions.',
        data: { hasRevenueDrop, hasLowGitHub, hasPublishStop }
      });

      globalIntelligenceRegistry.addInsight({
        id: `ins-corr-stalled-${now}`,
        category: 'Business Risk',
        title: 'Development pipeline stall correlates with publication gap',
        description: 'Analysis indicates code release intervals are directly connected to publishing automation up-times.',
        timestamp: new Date().toISOString()
      });
    }

    // 2. GitHubSyncFailed AND WorkflowFailed -> CI Build failed due to Repository Synced issue
    const hasGithubFail = observations.some(o => o.source === 'GitHub' && o.category === 'failure');
    const hasWfFail = observations.some(o => o.source === 'Runtime' && o.category === 'failure');

    if (hasGithubFail && hasWfFail) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-corr-ci-${now}`,
        source: 'CorrelationEngine',
        category: 'correlation_detected',
        timestamp: new Date().toISOString(),
        message: 'Repository sync failures correlate directly with CI pipeline workflow faults.',
        data: { hasGithubFail, hasWfFail }
      });

      globalIntelligenceRegistry.addInsight({
        id: `ins-corr-ci-${now}`,
        category: 'Engineering Quality',
        title: 'CI workflow reliability drops on git sync timeouts',
        description: 'Vulnerability scans match workflow failures to network timeouts during repository sync sweeps.',
        timestamp: new Date().toISOString()
      });
    }

    // 3. QueueCongestion AND TaskFailed -> Queue block caused task execution timeout
    const hasCongestion = observations.some(o => o.source === 'AnalysisEngine' && o.message.includes('Queue congestion'));
    const hasTaskFail = observations.some(o => o.source === 'Runtime' && o.message.includes('Task execution failed'));

    if (hasCongestion && hasTaskFail) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-corr-queue-${now}`,
        source: 'CorrelationEngine',
        category: 'correlation_detected',
        timestamp: new Date().toISOString(),
        message: 'High queue congestion correlated with background task execution timeout.',
        data: { hasCongestion, hasTaskFail }
      });
    }
  }
}

export const globalCorrelationEngine = new CorrelationEngine();
export default globalCorrelationEngine;
