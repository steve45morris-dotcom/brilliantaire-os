import { globalEventBus } from '../../kernel/events/EventBus.js';

export class GitHubEventMapper {
  public publishSyncEvent(repo: string): void {
    globalEventBus.publish('GitHubRepositorySynced', { repo, timestamp: new Date().toISOString() });
  }

  public publishHealthUpdatedEvent(repo: string, riskLevel: string): void {
    globalEventBus.publish('GitHubHealthUpdated', { repo, riskLevel, timestamp: new Date().toISOString() });
  }

  public publishWorkflowFailedEvent(repo: string, runId: number): void {
    globalEventBus.publish('GitHubWorkflowFailed', { repo, runId, timestamp: new Date().toISOString() });
  }
}

export const globalGitHubEventMapper = new GitHubEventMapper();
