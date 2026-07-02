import { PerformanceProfile } from '../profile';

export interface Recommendation {
  id: string;
  category: 'timeline' | 'buffer' | 'focus';
  title: string;
  description: string;
  confidence: number;
}

export function generateRecommendations(profile: PerformanceProfile): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (profile.dailyCompletionRate < 0.6) {
    recommendations.push({
      id: 'REC-001',
      category: 'timeline',
      title: 'Reduce Target Sprints count',
      description: 'Your completion rate is below 60%. Restructuring timeline blocks to allow larger buffer windows will increase focus capacity.',
      confidence: 0.9,
    });
  }

  if (profile.averageOverrunSeconds > 900) {
    recommendations.push({
      id: 'REC-002',
      category: 'buffer',
      title: 'Expand Protected Buffer Duration',
      description: 'Missions routinely overrun by more than 15 minutes. Consider increasing protected buffer windows from 10m to 20m.',
      confidence: 0.85,
    });
  }

  return recommendations;
}
