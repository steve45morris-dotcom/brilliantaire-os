import { describe, it, expect } from 'vitest';
import { GeneratePlanButton } from './generate-plan-button';
import { TimelineBlock } from './timeline-block';
import { formatTimeRange } from '../../lib/timeline/format';

describe('Timeline Daily Plan Generation Components', () => {
  it('should format simple time ranges', () => {
    const range = formatTimeRange('2026-07-02T09:00:00.000Z', '2026-07-02T10:00:00.000Z');
    expect(range).toContain('09:00');
    expect(range).toContain('10:00');
  });

  it('should define GeneratePlanButton component', () => {
    expect(GeneratePlanButton).toBeDefined();
  });

  it('should define TimelineBlock component', () => {
    expect(TimelineBlock).toBeDefined();
  });
});
