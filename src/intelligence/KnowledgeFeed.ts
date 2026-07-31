import { globalNodeRegistry } from '../knowledge/NodeRegistry.js';
import { globalGraphStore, NodeType, EdgeType } from '../knowledge/GraphStore.js';
import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';

export class KnowledgeFeed {
  public syncToGraph(): void {
    const observations = globalIntelligenceRegistry.getObservations();
    const predictions = globalIntelligenceRegistry.getPredictions();
    const recommendations = globalIntelligenceRegistry.getRecommendations();
    const insights = globalIntelligenceRegistry.getInsights();
    const alerts = globalIntelligenceRegistry.getAlerts();

    // 1. Sync Observations as 'Memory' nodes
    observations.forEach(o => {
      globalNodeRegistry.registerNode(o.id, 'Memory' as NodeType, {
        source: o.source,
        category: o.category,
        timestamp: o.timestamp,
        message: o.message
      });
    });

    // 2. Sync Predictions as 'Report' nodes
    predictions.forEach(p => {
      globalNodeRegistry.registerNode(p.id, 'Report' as NodeType, {
        title: p.title,
        description: p.description,
        confidence: p.confidence,
        expectedDate: p.expectedDate,
        riskLevel: p.riskLevel
      });
    });

    // 3. Sync Recommendations as 'Goal' nodes (or 'Decision')
    recommendations.forEach(r => {
      globalNodeRegistry.registerNode(r.id, 'Goal' as NodeType, {
        title: r.title,
        priority: r.priority,
        confidence: r.confidence,
        reason: r.reason,
        expectedImpact: r.expectedImpact,
        estimatedEffort: r.estimatedEffort,
        status: r.status
      });

      // Find if we can link it to a prediction it references
      predictions.forEach(p => {
        if (r.reason.toLowerCase().includes(p.title.toLowerCase()) || r.title.toLowerCase().includes(p.title.toLowerCase())) {
          globalGraphStore.addEdge(r.id, p.id, 'REFERENCES' as EdgeType, { timestamp: new Date().toISOString() });
        }
      });
    });

    // 4. Sync Insights as 'Report' nodes
    insights.forEach(i => {
      globalNodeRegistry.registerNode(i.id, 'Report' as NodeType, {
        category: i.category,
        title: i.title,
        description: i.description,
        timestamp: i.timestamp
      });
    });

    // 5. Sync Alerts as 'Memory' nodes
    alerts.forEach(a => {
      globalNodeRegistry.registerNode(a.id, 'Memory' as NodeType, {
        severity: a.severity,
        reason: a.reason,
        timestamp: a.timestamp,
        status: a.status
      });

      // Find if we can link it to an observation that triggered it
      observations.forEach(o => {
        if (a.reason.toLowerCase().includes(o.message.toLowerCase()) || o.message.toLowerCase().includes(a.reason.toLowerCase())) {
          globalGraphStore.addEdge(a.id, o.id, 'RELATED_TO' as EdgeType, { timestamp: new Date().toISOString() });
        }
      });
    });
  }
}

export const globalKnowledgeFeed = new KnowledgeFeed();
export default globalKnowledgeFeed;
