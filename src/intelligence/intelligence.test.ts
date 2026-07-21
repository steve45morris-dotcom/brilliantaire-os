import { describe, it, expect, beforeEach } from 'vitest';
import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalObservationEngine } from './ObservationEngine.js';
import { globalAnalysisEngine } from './AnalysisEngine.js';
import { globalCorrelationEngine } from './CorrelationEngine.js';
import { globalPredictionEngine } from './PredictionEngine.js';
import { globalRecommendationEngine } from './RecommendationEngine.js';
import { globalLearningEngine } from './LearningEngine.js';
import { globalBriefingEngine } from './BriefingEngine.js';
import { globalTimelineEngine } from './TimelineEngine.js';
import { globalAlertEngine } from './AlertEngine.js';
import { globalInsightEngine } from './InsightEngine.js';
import { globalTelemetryCollector } from './TelemetryCollector.js';
import { globalOperationsMonitor } from './OperationsMonitor.js';
import { globalExecutiveFeed } from './ExecutiveFeed.js';
import { globalRuntimeFeed } from './RuntimeFeed.js';
import { globalKnowledgeFeed } from './KnowledgeFeed.js';
import { globalKernelFeed } from './KernelFeed.js';
import { globalIntegrationFeed } from './IntegrationFeed.js';
import { globalMetricsFeed } from './MetricsFeed.js';
import { globalEventBus } from '../kernel/events/EventBus.js';
import { globalGoalManager } from '../executive/GoalManager.js';
import { globalGraphStore } from '../knowledge/GraphStore.js';

describe('Operations Intelligence Layer (OIL) Tests', () => {
  beforeEach(() => {
    globalIntelligenceRegistry.clear();
    globalGraphStore.clear();
  });

  it('should store and manage observations, predictions, recommendations, insights, and alerts in the registry', () => {
    // 1. Observations
    globalIntelligenceRegistry.addObservation({
      id: 'obs-1',
      source: 'Kernel',
      category: 'boot',
      timestamp: new Date().toISOString(),
      message: 'Kernel initialized',
      data: {}
    });
    expect(globalIntelligenceRegistry.getObservations().length).toBe(1);

    // Max limit observations constraint (200)
    for (let i = 0; i < 250; i++) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-limit-${i}`,
        source: 'Kernel',
        category: 'test',
        timestamp: new Date().toISOString(),
        message: `Observation ${i}`,
        data: {}
      });
    }
    expect(globalIntelligenceRegistry.getObservations().length).toBe(200);

    // 2. Predictions
    globalIntelligenceRegistry.addPrediction({
      id: 'pred-1',
      title: 'Workflow Failure Risk',
      description: 'Repeated task failures detected',
      confidence: 85,
      expectedDate: new Date().toISOString(),
      riskLevel: 'high'
    });
    expect(globalIntelligenceRegistry.getPredictions().length).toBe(1);

    // 3. Recommendations
    globalIntelligenceRegistry.addRecommendation({
      id: 'rec-1',
      title: 'Optimize Queue',
      priority: 'high',
      confidence: 90,
      reason: 'Congestion',
      expectedImpact: 'Reduce latency',
      estimatedEffort: '1 hour',
      requiredApprovals: true,
      status: 'pending'
    });
    expect(globalIntelligenceRegistry.getRecommendations().length).toBe(1);

    // Update status
    globalIntelligenceRegistry.logFeedback('rec-1', 'accepted');
    expect(globalIntelligenceRegistry.getRecommendations()[0].status).toBe('accepted');

    // 4. Insights
    globalIntelligenceRegistry.addInsight({
      id: 'ins-1',
      category: 'System',
      title: 'High Stability',
      description: 'No errors',
      timestamp: new Date().toISOString()
    });
    expect(globalIntelligenceRegistry.getInsights().length).toBe(1);

    // 5. Alerts
    globalIntelligenceRegistry.addAlert({
      id: 'alert-1',
      severity: 'critical',
      reason: 'Memory leak',
      timestamp: new Date().toISOString(),
      status: 'active'
    });
    expect(globalIntelligenceRegistry.getAlerts().length).toBe(1);
    globalIntelligenceRegistry.resolveAlert('alert-1');
    expect(globalIntelligenceRegistry.getAlerts()[0].status).toBe('resolved');

    // 6. Feedback Logs
    globalIntelligenceRegistry.logFeedback('rec-1', 'accepted');
    expect(globalIntelligenceRegistry.getFeedbackLogs().length).toBe(2); // Since logFeedback adds to logs and we called it twice
  });

  it('should capture and record events using ObservationEngine', () => {
    globalObservationEngine.startObserving();

    globalEventBus.publish('SystemBooting', { phase: 'alpha' });
    globalEventBus.publish('LiveOperationsTaskFailed', { taskId: 'task-fail-1', error: 'Timeout' });
    globalEventBus.publish('WorkflowCompleted', { workflowName: 'Research Workflow', workflowId: 'wf-99' });

    const observations = globalIntelligenceRegistry.getObservations();
    expect(observations.length).toBeGreaterThan(0);
    expect(observations.some(o => o.category === 'boot')).toBe(true);
    expect(observations.some(o => o.category === 'failure')).toBe(true);
    expect(observations.some(o => o.category === 'workflow_completed')).toBe(true);
  });

  it('should run pattern checks in AnalysisEngine', () => {
    // Inject failures
    for (let i = 0; i < 4; i++) {
      globalIntelligenceRegistry.addObservation({
        id: `obs-f-${i}`,
        source: 'Runtime',
        category: 'failure',
        timestamp: new Date().toISOString(),
        message: 'Task failed timeout',
        data: {}
      });
    }

    globalAnalysisEngine.runAnalysis();
    const observations = globalIntelligenceRegistry.getObservations();
    const alerts = globalIntelligenceRegistry.getAlerts();

    expect(observations.some(o => o.category === 'pattern_detected')).toBe(true);
    expect(alerts.some(a => a.severity === 'high')).toBe(true);
  });

  it('should check correlation rules in CorrelationEngine', () => {
    // Inject correlated observations
    globalIntelligenceRegistry.addObservation({
      id: 'obs-git-fail',
      source: 'GitHub',
      category: 'failure',
      timestamp: new Date().toISOString(),
      message: 'GitHub API offline',
      data: {}
    });

    globalIntelligenceRegistry.addObservation({
      id: 'obs-wf-fail',
      source: 'Runtime',
      category: 'failure',
      timestamp: new Date().toISOString(),
      message: 'Task build failed',
      data: {}
    });

    globalCorrelationEngine.findCorrelations();
    const observations = globalIntelligenceRegistry.getObservations();
    const insights = globalIntelligenceRegistry.getInsights();

    expect(observations.some(o => o.category === 'correlation_detected')).toBe(true);
    expect(insights.some(i => i.category === 'Engineering Quality')).toBe(true);
  });

  it('should generate predictions in PredictionEngine', () => {
    globalIntelligenceRegistry.addObservation({
      id: 'obs-git-inactive',
      source: 'AnalysisEngine',
      category: 'pattern_detected',
      timestamp: new Date().toISOString(),
      message: 'Inactive project state detected',
      data: {}
    });

    globalPredictionEngine.generatePredictions();
    const predictions = globalIntelligenceRegistry.getPredictions();

    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions.some(p => p.riskLevel === 'medium' || p.riskLevel === 'high')).toBe(true);
  });

  it('should generate recommendations in RecommendationEngine and log learning feedback', () => {
    globalIntelligenceRegistry.addPrediction({
      id: 'pred-sync',
      title: 'Project Development Delay Risk',
      description: 'Stale repository detected',
      confidence: 85,
      expectedDate: new Date().toISOString(),
      riskLevel: 'high'
    });

    globalRecommendationEngine.generateRecommendations();
    const recs = globalIntelligenceRegistry.getRecommendations();

    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some(r => r.priority === 'high')).toBe(true);

    // LearningEngine test
    globalLearningEngine.adjustConfidence(recs[0].id, 'accepted');
    expect(globalLearningEngine.getAcceptanceRate()).toBe(100);
    expect(globalLearningEngine.getLearningAccuracy()).toBeGreaterThan(95);
  });

  it('should filter chronological feed in TimelineEngine', () => {
    const nowStr = new Date().toISOString();
    globalIntelligenceRegistry.addObservation({
      id: 't-obs-1',
      source: 'Kernel',
      category: 'boot',
      timestamp: nowStr,
      message: 'Timeline boot test',
      data: {}
    });

    const feed = globalTimelineEngine.getChronologicalFeed('today');
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].event).toContain('Timeline boot test');
  });

  it('should generate briefings in BriefingEngine', () => {
    const brief = globalBriefingEngine.generateBriefing('morning');
    expect(brief).toContain('Morning Intelligence Briefing');
    expect(brief).toContain('🎯 Strategic Focus');
  });

  it('should generate health status in OperationsMonitor and TelemetryCollector', () => {
    const health = globalOperationsMonitor.checkSystemHealth();
    expect(health.status).toBe('optimal');

    const telemetry = globalTelemetryCollector.getTelemetry();
    expect(telemetry.cpuUsagePercent).toBeTypeOf('number');
    expect(telemetry.memoryUsagePercent).toBeTypeOf('number');
  });

  it('should verify feeds sync correctly', () => {
    // 1. Executive Feed
    globalIntelligenceRegistry.addRecommendation({
      id: 'rec-exec-test',
      title: 'Optimize Stripe Secret Config',
      priority: 'critical',
      confidence: 95,
      reason: 'Missing env variables',
      expectedImpact: 'Secures webhooks',
      estimatedEffort: '15m',
      requiredApprovals: false,
      status: 'pending'
    });

    globalExecutiveFeed.syncToExecutive();
    const goals = globalGoalManager.getGoals();
    expect(goals.some(g => g.title === 'Optimize Stripe Secret Config')).toBe(true);

    // 2. Knowledge Feed
    expect(() => globalKnowledgeFeed.syncToGraph()).not.toThrow();

    // 3. Metrics Feed
    expect(() => globalMetricsFeed.syncMetrics()).not.toThrow();
  });
});
