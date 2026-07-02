import { ExecutionDayData } from '../metrics';

export interface PerformanceProfile {
  dailyCompletionRate: number;
  weeklyCompletionRate: number;
  focusScore: number;
  energyScore: number;
  bufferUsageTrend: 'increasing' | 'decreasing' | 'stable';
  averageOverrunSeconds: number;
  mostCommonBlockers: string[];
  mostSuccessfulModes: string[];
}

export function generatePerformanceProfile(days: ExecutionDayData[]): PerformanceProfile {
  if (days.length === 0) {
    return {
      dailyCompletionRate: 0,
      weeklyCompletionRate: 0,
      focusScore: 0,
      energyScore: 0,
      bufferUsageTrend: 'stable',
      averageOverrunSeconds: 0,
      mostCommonBlockers: [],
      mostSuccessfulModes: [],
    };
  }

  const lastDay = days[days.length - 1];
  const dailyCompletionRate = lastDay.totalCount > 0 
    ? lastDay.completedCount / lastDay.totalCount 
    : 0;

  const totalCompleted = days.reduce((sum, d) => sum + d.completedCount, 0);
  const totalCount = days.reduce((sum, d) => sum + d.totalCount, 0);
  const weeklyCompletionRate = totalCount > 0 ? totalCompleted / totalCount : 0;

  const focusScore = days.reduce((sum, d) => sum + d.reflectionScore, 0) / days.length;
  const energyScore = days.reduce((sum, d) => sum + d.energy, 0) / days.length;

  const averageOverrunSeconds = days.reduce((sum, d) => sum + d.bufferUsageSeconds, 0) / days.length;

  // Blockers calculation
  const blockersMap: Record<string, number> = {};
  days.forEach(d => {
    d.blockers.forEach(b => {
      blockersMap[b] = (blockersMap[b] || 0) + 1;
    });
  });
  const mostCommonBlockers = Object.keys(blockersMap).sort((a, b) => blockersMap[b] - blockersMap[a]);

  // Buffer trend
  let bufferUsageTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (days.length >= 2) {
    const firstHalf = days.slice(0, Math.floor(days.length / 2));
    const secondHalf = days.slice(Math.floor(days.length / 2));
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.bufferUsageSeconds, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.bufferUsageSeconds, 0) / secondHalf.length;
    if (secondAvg > firstAvg + 60) bufferUsageTrend = 'increasing';
    else if (secondAvg < firstAvg - 60) bufferUsageTrend = 'decreasing';
  }

  return {
    dailyCompletionRate,
    weeklyCompletionRate,
    focusScore,
    energyScore,
    bufferUsageTrend,
    averageOverrunSeconds,
    mostCommonBlockers,
    mostSuccessfulModes: ['focus'],
  };
}
