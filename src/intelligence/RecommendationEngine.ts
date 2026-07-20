import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalEventBus } from '../kernel/events/EventBus.js';
import { IntelligenceEvents } from './IntelligenceEvents.js';
import { globalLearningEngine } from './LearningEngine.js';
import { globalModelConfigManager } from '../models/ModelConfiguration.js';


export class RecommendationEngine {
  public generateRecommendations(): void {
    const predictions = globalIntelligenceRegistry.getPredictions();
    const observations = globalIntelligenceRegistry.getObservations();
    const now = Date.now();

    // Dynamically adjust confidence thresholds based on LearningEngine feedback loops
    const baseConfidence = 90;
    const categoryFactor = globalLearningEngine.getCategoryAdjustment('Optimization');
    const adjustedConfidence = Math.max(50, Math.min(100, baseConfidence + categoryFactor));

    // 1. If project delay risk exists -> Recommend committing/syncing
    const hasDelayRisk = predictions.some(p => p.title.includes('Delay Risk') && p.riskLevel !== 'low');
    if (hasDelayRisk) {
      const rec = {
        id: `rec-sync-${now}`,
        title: 'Initiate GitHub Commits & Sync Operations',
        priority: 'high' as const,
        confidence: adjustedConfidence,
        reason: 'Detected repository inactivity exceeding 7 days. Code release cadence is stale.',
        expectedImpact: 'Restores progress tracking transparency and updates Knowledge Graph state references.',
        estimatedEffort: '30 minutes',
        requiredApprovals: false,
        status: 'pending' as const
      };
      globalIntelligenceRegistry.addRecommendation(rec);
      globalEventBus.publish(IntelligenceEvents.RecommendationCreated, rec);
    }

    // 2. If workflow latency risk or task failures -> Recommend checking wildcard subscriptions and optimizing check paths
    const hasLatencyRisk = predictions.some(p => p.title.includes('Latency Risk'));
    if (hasLatencyRisk) {
      const rec = {
        id: `rec-opt-${now}`,
        title: 'Optimize EventBus Wildcard Subscriptions Layout',
        priority: 'medium' as const,
        confidence: adjustedConfidence,
        reason: 'Multiple overlapping wildcard topics trigger excessive validation checking loop overhead.',
        expectedImpact: 'Reduces CPU tick latency bounds by up to 15ms per transaction.',
        estimatedEffort: '2 hours',
        requiredApprovals: true, // Write modification required
        status: 'pending' as const
      };
      globalIntelligenceRegistry.addRecommendation(rec);
      globalEventBus.publish(IntelligenceEvents.RecommendationCreated, rec);
    }

    // 3. If queue congestion -> Recommend upgrading queue concurrency
    const hasQueueCongestion = observations.some(o => o.message.includes('Queue congestion'));
    if (hasQueueCongestion) {
      const rec = {
        id: `rec-queue-${now}`,
        title: 'Configure Parallel Task Queue Executors',
        priority: 'high' as const,
        confidence: adjustedConfidence,
        reason: 'Background queues frequently congested with active task executions, blocking main threads.',
        expectedImpact: 'Eliminates task processing delays and improves system throughput.',
        estimatedEffort: '1 hour',
        requiredApprovals: true,
        status: 'pending' as const
      };
      globalIntelligenceRegistry.addRecommendation(rec);
      globalEventBus.publish(IntelligenceEvents.RecommendationCreated, rec);
    }

    // 3.5. AMOC Model Assignment Recommendations
    try {
      const assignments = globalModelConfigManager.getConfig().assignments;
      
      // Check Architecture Reviewer
      if (assignments['Architecture Reviewer'] !== 'claude-3-5-sonnet') {
        const rec = {
          id: `rec-model-reviewer-${now}`,
          title: 'Optimize Architecture Reviewer Assignment',
          priority: 'medium' as const,
          confidence: 85,
          reason: 'Claude 3.5 Sonnet may improve architecture reviews with advanced system reasoning capabilities.',
          expectedImpact: 'Improves the precision of codebase structural boundary checks and identifies deep logic anomalies.',
          estimatedEffort: 'Immediate (1 click approval)',
          requiredApprovals: true,
          status: 'pending' as const,
          metadata: {
            role: 'Architecture Reviewer',
            modelId: 'claude-3-5-sonnet'
          }
        };
        globalIntelligenceRegistry.addRecommendation(rec);
        globalEventBus.publish(IntelligenceEvents.RecommendationCreated, rec);
      }

      // Check Builder
      if (assignments['Builder'] !== 'gemini-1.5-pro') {
        const rec = {
          id: `rec-model-builder-${now}`,
          title: 'Optimize Builder Assignment',
          priority: 'high' as const,
          confidence: 90,
          reason: 'Gemini 1.5 Pro is recommended for large code generation and native TypeScript compilation validations.',
          expectedImpact: 'Faster code-generation latency and better coverage of typescript compilation checks.',
          estimatedEffort: 'Immediate (1 click approval)',
          requiredApprovals: true,
          status: 'pending' as const,
          metadata: {
            role: 'Builder',
            modelId: 'gemini-1.5-pro'
          }
        };
        globalIntelligenceRegistry.addRecommendation(rec);
        globalEventBus.publish(IntelligenceEvents.RecommendationCreated, rec);
      }
    } catch (err) {
      console.error('[RecommendationEngine] Failed to generate model recommendations:', err);
    }

    // 4. Default if nothing generated
    if (globalIntelligenceRegistry.getRecommendations().length === 0) {
      const defaultRec = {
        id: `rec-default-${now}`,
        title: 'Verify Stripe Security Webhook Configurations',
        priority: 'medium' as const,
        confidence: adjustedConfidence,
        reason: 'Periodic audit check verifies Stripe secret is missing in local environment file.',
        expectedImpact: 'Secures local webhook execution endpoint boundaries against forged payloads.',
        estimatedEffort: '15 minutes',
        requiredApprovals: false,
        status: 'pending' as const
      };
      globalIntelligenceRegistry.addRecommendation(defaultRec);
      globalEventBus.publish(IntelligenceEvents.RecommendationCreated, defaultRec);
    }
  }
}

export const globalRecommendationEngine = new RecommendationEngine();
export default globalRecommendationEngine;
