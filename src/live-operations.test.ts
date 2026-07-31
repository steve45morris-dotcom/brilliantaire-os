import { describe, it, expect } from 'vitest';
import { globalLiveOperationsStore } from './kernel/live/LiveOperationsStore.js';
import { globalSessionTracker } from './kernel/live/SessionTracker.js';
import { globalTaskTracker } from './kernel/live/TaskTracker.js';
import { globalAttentionEngine } from './kernel/live/AttentionEngine.js';

describe('Live Operations Tests', () => {
  it('should initialize and track active CLI sessions', () => {
    globalLiveOperationsStore.clear();

    const session = globalSessionTracker.createSession('cli-test', 'cli');
    expect(session.status).toBe('active');

    globalSessionTracker.recordHeartbeat('cli-test');
    globalSessionTracker.closeSession('cli-test');

    const cached = globalLiveOperationsStore.getSession('cli-test');
    expect(cached?.status).toBe('completed');
  });

  it('should track active tasks and calculate execution durations', async () => {
    globalLiveOperationsStore.clear();
    globalSessionTracker.createSession('s-1', 'cli');

    const task = globalTaskTracker.startTask('t-1', 's-1', 'command', 'run-workflow');
    expect(task.status).toBe('running');

    globalTaskTracker.completeTask('t-1');
    const cached = globalLiveOperationsStore.getTask('t-1');
    expect(cached?.status).toBe('completed');
  });

  it('should flag attention items when tasks fail or block', () => {
    globalLiveOperationsStore.clear();
    globalSessionTracker.createSession('s-2', 'cli');

    globalTaskTracker.startTask('t-2', 's-2', 'command', 'audit-skills');
    globalTaskTracker.blockTask('t-2', 'Skills directory locked');

    const attention = globalAttentionEngine.generateAttentionItems();
    expect(attention.length).toBe(1);
    expect(attention[0].type).toBe('blocked_task');
  });
});
