import { describe, it, expect } from 'vitest';
import { TimelineStatusPill } from './timeline-status-pill';
import { ApprovalPanel } from './approval-panel';
import { ApproveButton } from './approve-button';
import { RejectButton } from './reject-button';
import { RegenerateButton } from './regenerate-button';

describe('Timeline Approval Components & States UI', () => {
  it('should define TimelineStatusPill component interface', () => {
    expect(TimelineStatusPill).toBeDefined();
  });

  it('should define ApprovalPanel and its sub-buttons', () => {
    expect(ApprovalPanel).toBeDefined();
    expect(ApproveButton).toBeDefined();
    expect(RejectButton).toBeDefined();
    expect(RegenerateButton).toBeDefined();
  });
});
