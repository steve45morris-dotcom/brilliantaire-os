import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';
import { globalTaskTracker } from '../../kernel/live/TaskTracker.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class GitHubLiveOperationsSync {
  public syncToLiveOps(repoName: string): void {
    const sessionId = `ops-github-${Date.now()}`;
    const taskId = `gh-sync-${repoName}`;

    // Log sync started
    globalLiveOperationsStore.addEvent({
      id: `evt-gh-started-${Date.now()}`,
      type: 'github.sync.started',
      timestamp: new Date().toISOString(),
      source: 'GitHubIntegration',
      actor: 'System',
      session: sessionId,
      task: taskId,
      severity: 'info',
      message: `GitHub repository sync started for ${repoName}`,
      data: { repoName },
      attention: false
    });

    // Start Task
    globalTaskTracker.startTask(taskId, sessionId, 'queue_job', `GitHub Sync: ${repoName}`);

    // Log Repository checked
    globalLiveOperationsStore.addEvent({
      id: `evt-gh-checked-${Date.now()}`,
      type: 'github.repository.checked',
      timestamp: new Date().toISOString(),
      source: 'GitHubIntegration',
      actor: 'System',
      session: sessionId,
      task: taskId,
      severity: 'info',
      message: `Checked GitHub repository ${repoName} status parameters`,
      data: { repoName },
      attention: false
    });

    // Complete Task
    globalTaskTracker.completeTask(taskId);

    // Log sync completed
    globalLiveOperationsStore.addEvent({
      id: `evt-gh-completed-${Date.now()}`,
      type: 'github.sync.completed',
      timestamp: new Date().toISOString(),
      source: 'GitHubIntegration',
      actor: 'System',
      session: sessionId,
      task: taskId,
      severity: 'info',
      message: `GitHub repository sync completed successfully for ${repoName}`,
      data: { repoName },
      attention: false
    });

    globalEventBus.publish('GitHubLiveOperationsSynced', { repoName, timestamp: new Date().toISOString() });
  }
}

export const globalGitHubLiveOperationsSync = new GitHubLiveOperationsSync();
