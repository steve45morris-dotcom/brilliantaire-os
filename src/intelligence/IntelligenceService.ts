import { globalServiceRegistry } from '../kernel/registry/ServiceRegistry.js';
import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalObservationEngine } from './ObservationEngine.js';
import { globalAnalysisEngine } from './AnalysisEngine.js';
import { globalCorrelationEngine } from './CorrelationEngine.js';
import { globalPredictionEngine } from './PredictionEngine.js';
import { globalRecommendationEngine } from './RecommendationEngine.js';
import { globalInsightEngine } from './InsightEngine.js';
import { globalBriefingEngine } from './BriefingEngine.js';
import { globalTimelineEngine } from './TimelineEngine.js';
import { globalAlertEngine } from './AlertEngine.js';
import { globalOperationsMonitor } from './OperationsMonitor.js';
import { globalExecutiveFeed } from './ExecutiveFeed.js';
import { globalKnowledgeFeed } from './KnowledgeFeed.js';
import { globalIntegrationFeed } from './IntegrationFeed.js';
import { globalMetricsFeed } from './MetricsFeed.js';

export class IntelligenceService {
  public registerService(): void {
    globalServiceRegistry.register('OperationsIntelligenceLayer', {
      getObservations: () => globalIntelligenceRegistry.getObservations(),
      getPredictions: () => globalIntelligenceRegistry.getPredictions(),
      getRecommendations: () => globalIntelligenceRegistry.getRecommendations(),
      getInsights: () => globalIntelligenceRegistry.getInsights(),
      getAlerts: () => globalIntelligenceRegistry.getAlerts(),
      getBriefing: (type: any) => globalBriefingEngine.generateBriefing(type),
      getTimeline: (timeframe?: 'today' | 'week' | 'all') => globalTimelineEngine.getChronologicalFeed(timeframe),
      checkSystemHealth: () => globalOperationsMonitor.checkSystemHealth(),
      runObservations: () => {
        // 1. Sync integration status
        globalIntegrationFeed.syncIntegrationsHealth();

        // 2. Record scanning step observation
        globalObservationEngine.record('System', 'scan', 'System intelligence scanning step triggered');
        
        // 3. Run Analysis and Correlation
        globalAnalysisEngine.runAnalysis();
        globalCorrelationEngine.findCorrelations();

        // 4. Populate reasoning engines
        globalPredictionEngine.generatePredictions();
        globalRecommendationEngine.generateRecommendations();
        globalInsightEngine.generateInsights();
        
        // 5. Evaluate and check Alerts
        globalAlertEngine.checkAlerts();

        // 6. Sync to core structures
        globalExecutiveFeed.syncToExecutive();
        globalKnowledgeFeed.syncToGraph();
        globalMetricsFeed.syncMetrics();
      }
    });
  }
}

export const globalIntelligenceService = new IntelligenceService();
export default globalIntelligenceService;
