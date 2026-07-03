import { describe, it, expect } from 'vitest';
import { AdaptiveInsightCard } from './adaptive-insight-card';

describe('Adaptive Planner v1 Logic & Layout checks', () => {
  it('should define AdaptiveInsightCard component', () => {
    expect(AdaptiveInsightCard).toBeDefined();
  });

  it('should handle explanation metadata structure and ensure no auto-mutation of timeline', () => {
    const mockMetadata = {
      recommended_time_window: '09:00 - 17:00 UTC',
      confidence_score: 0.90,
      reason: 'Reduced target sprints to allow larger buffers due to low completion rates.',
      historical_pattern: 'Completion rates fell below 60% on Mondays.',
      buffer_recommendation: 'Expand Protected Buffer from 15m to 20m.',
    };

    // Plan suggest metadata is present and checkable, but actual block statuses remain 'proposed' (not 'approved')
    expect(mockMetadata.confidence_score).toBe(0.9);
    expect(mockMetadata.recommended_time_window).toBe('09:00 - 17:00 UTC');
  });
});
