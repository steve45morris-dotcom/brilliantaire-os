import { describe, it, expect } from 'vitest';
import { InboxCaptureBox } from './inbox-capture-box';
import { InboxResultCard } from './inbox-result-card';

describe('Inbox Capture Components UI', () => {
  it('should define InboxCaptureBox component', () => {
    expect(InboxCaptureBox).toBeDefined();
  });

  it('should define InboxResultCard component', () => {
    expect(InboxResultCard).toBeDefined();
  });
});
