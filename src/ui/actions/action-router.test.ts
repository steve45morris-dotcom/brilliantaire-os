import { beforeEach, describe, expect, it } from 'vitest';
import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';
import { ActionRouter } from './ActionRouter.js';

describe('ActionRouter Live Operations logging', () => {
  beforeEach(() => globalLiveOperationsStore.clear());

  it('logs a structured event for a routed workspace action', () => {
    const router = new ActionRouter();
    router.routeAction('icyflamze:save-linked-lyric', { title: 'Lagos Pressure Hook', songId: 'song-pressure-cooker' });

    expect(globalLiveOperationsStore.getEvents()).toContainEqual(expect.objectContaining({
      type: 'UIAction',
      source: 'DashboardUI',
      data: expect.objectContaining({ actionId: 'icyflamze:save-linked-lyric', type: 'success' })
    }));
  });
});
