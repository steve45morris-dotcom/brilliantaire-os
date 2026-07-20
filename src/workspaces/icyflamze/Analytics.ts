import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';

export interface AnalyticMetric {
  name: string;
  value: string | number;
  changePercent: number; // positive or negative
  history: { label: string; value: number }[];
}

export class AnalyticsEngine {
  private metrics: Record<string, AnalyticMetric> = {
    contentPerformance: {
      name: 'Content Views Yield',
      value: '28.4K',
      changePercent: 12.5,
      history: [
        { label: 'May', value: 12000 },
        { label: 'Jun', value: 18000 },
        { label: 'Jul', value: 28400 }
      ]
    },
    publishingFrequency: {
      name: 'Weekly Post Frequency',
      value: '4.2 posts/week',
      changePercent: 5.0,
      history: [
        { label: 'Week 1', value: 3 },
        { label: 'Week 2', value: 4 },
        { label: 'Week 3', value: 4 },
        { label: 'Week 4', value: 5 }
      ]
    },
    songCompletionRate: {
      name: 'Song Completion Rate',
      value: '78%',
      changePercent: 8.0,
      history: [
        { label: 'May', value: 65 },
        { label: 'Jun', value: 70 },
        { label: 'Jul', value: 78 }
      ]
    },
    writingStreak: {
      name: 'Writing Daily Streak',
      value: '12 days',
      changePercent: 20.0,
      history: [
        { label: 'Week 1', value: 5 },
        { label: 'Week 2', value: 7 },
        { label: 'Week 3', value: 12 }
      ]
    },
    audienceGrowth: {
      name: 'Total Fans / Followers',
      value: '18.2K',
      changePercent: 18.3,
      history: [
        { label: 'May', value: 11000 },
        { label: 'Jun', value: 14500 },
        { label: 'Jul', value: 18200 }
      ]
    },
    revenueGrowth: {
      name: 'Monthly Net Earnings',
      value: '$4,280.00',
      changePercent: 24.1,
      history: [
        { label: 'May', value: 2100 },
        { label: 'Jun', value: 3450 },
        { label: 'Jul', value: 4280 }
      ]
    },
    workflowEfficiency: {
      name: 'VNP Loop Processing speed',
      value: '94%',
      changePercent: 2.1,
      history: [
        { label: 'May', value: 88 },
        { label: 'Jun', value: 92 },
        { label: 'Jul', value: 94 }
      ]
    },
    executiveScore: {
      name: 'Executive Score',
      value: '95/100',
      changePercent: 1.0,
      history: [
        { label: 'May', value: 92 },
        { label: 'Jun', value: 94 },
        { label: 'Jul', value: 95 }
      ]
    }
  };

  public getMetrics(): Record<string, AnalyticMetric> {
    return { ...this.metrics };
  }

  public refreshAnalytics(): void {
    // Simulate updating analytics values
    this.metrics.contentPerformance.value = '31.2K';
    this.metrics.contentPerformance.changePercent += 1.2;

    this.metrics.audienceGrowth.value = '19.4K';
    this.metrics.audienceGrowth.changePercent += 2.0;

    // Register node in Knowledge Graph
    globalNodeRegistry.registerNode('analytics-report', 'Report', {
      title: 'Monthly Performance Analytics',
      views: '31.2K',
      followers: '19.4K',
      score: '95/100'
    });
    globalEdgeRegistry.registerEdge('analytics-report', 'system-core', 'GENERATED');

    globalEventBus.publish('IcyflamzeAnalyticsRefreshed', { timestamp: new Date().toISOString() });
  }
}

export const globalAnalyticsEngine = new AnalyticsEngine();
