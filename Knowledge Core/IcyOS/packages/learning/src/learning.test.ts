import { describe, it, expect } from 'vitest';
import { generatePerformanceProfile } from './profile';
import { generateRecommendations } from './recommendations';
import { ExecutionDayData } from './metrics';

const mockDays: ExecutionDayData[] = [
  {
    timelineEvents: [],
    focusSessionEvents: [],
    bufferUsageSeconds: 1200,
    sessionDurationSeconds: 3600,
    completedCount: 3,
    totalCount: 6,
    reflectionScore: 4,
    mood: 'focused',
    energy: 4,
    wins: ['completed route schemas'],
    blockers: ['timezone format offset'],
    lessons: ['use UTC timezone options']
  }
];

describe('Learning Engine v1 Logic & Trends', () => {
  it('should compile and generate performance profile data', () => {
    const profile = generatePerformanceProfile(mockDays);
    expect(profile.dailyCompletionRate).toBe(0.5);
    expect(profile.focusScore).toBe(4);
    expect(profile.mostCommonBlockers).toContain('timezone format offset');
  });

  it('should generate structured recommendations when completion is low', () => {
    const profile = generatePerformanceProfile(mockDays);
    const recs = generateRecommendations(profile);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].id).toBe('REC-001');
    expect(recs[0].confidence).toBe(0.9);
  });
});
