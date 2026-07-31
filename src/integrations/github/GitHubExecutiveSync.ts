import { globalPriorityEngine } from '../../executive/PriorityEngine.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class GitHubExecutiveSync {
  public syncToExecutive(repoName: string, openIssues: number, failureRate: number): void {
    // Rank priorities
    globalPriorityEngine.rankItems([
      { id: `github-${repoName}`, name: repoName, revenuePotential: 5, daysStale: 1, failureRate }
    ]);

    // Publish Event
    globalEventBus.publish('GitHubExecutiveSynced', { repoName, timestamp: new Date().toISOString() });
  }
}

export const globalGitHubExecutiveSync = new GitHubExecutiveSync();
