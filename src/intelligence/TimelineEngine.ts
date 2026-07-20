import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';

export interface TimelineItem {
  timestamp: string;
  source: string;
  category: string;
  event: string;
  details?: Record<string, any>;
}

export class TimelineEngine {
  public getChronologicalFeed(timeframe: 'today' | 'week' | 'all' = 'all'): TimelineItem[] {
    const observations = globalIntelligenceRegistry.getObservations();
    const predictions = globalIntelligenceRegistry.getPredictions();
    const recommendations = globalIntelligenceRegistry.getRecommendations();
    const insights = globalIntelligenceRegistry.getInsights();
    const alerts = globalIntelligenceRegistry.getAlerts();

    const items: TimelineItem[] = [];

    // Map Observations
    observations.forEach(o => {
      items.push({
        timestamp: o.timestamp,
        source: o.source,
        category: 'observation',
        event: `Observation [${o.category}]: ${o.message}`,
        details: o.data
      });
    });

    // Map Predictions
    predictions.forEach(p => {
      items.push({
        timestamp: p.expectedDate,
        source: 'PredictionEngine',
        category: 'prediction',
        event: `Prediction [${p.riskLevel.toUpperCase()}]: ${p.title} - ${p.description}`,
        details: { confidence: p.confidence }
      });
    });

    // Map Recommendations
    recommendations.forEach(r => {
      items.push({
        timestamp: new Date().toISOString(), // Fallback to now
        source: 'RecommendationEngine',
        category: 'recommendation',
        event: `Recommendation [${r.priority.toUpperCase()}]: ${r.title} (Status: ${r.status})`,
        details: { reason: r.reason, impact: r.expectedImpact }
      });
    });

    // Map Insights
    insights.forEach(i => {
      items.push({
        timestamp: i.timestamp,
        source: 'InsightEngine',
        category: 'insight',
        event: `Insight [${i.category}]: ${i.title} - ${i.description}`
      });
    });

    // Map Alerts
    alerts.forEach(a => {
      items.push({
        timestamp: a.timestamp,
        source: 'AlertEngine',
        category: 'alert',
        event: `Alert [${a.severity.toUpperCase()}]: ${a.reason} (${a.status.toUpperCase()})`
      });
    });

    // Sort by timestamp
    const sorted = items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by timeframe
    const now = Date.now();
    if (timeframe === 'today') {
      const todayCutoff = now - (24 * 60 * 60 * 1000);
      return sorted.filter(item => new Date(item.timestamp).getTime() >= todayCutoff);
    } else if (timeframe === 'week') {
      const weekCutoff = now - (7 * 24 * 60 * 60 * 1000);
      return sorted.filter(item => new Date(item.timestamp).getTime() >= weekCutoff);
    }

    return sorted;
  }
}

export const globalTimelineEngine = new TimelineEngine();
export default globalTimelineEngine;
