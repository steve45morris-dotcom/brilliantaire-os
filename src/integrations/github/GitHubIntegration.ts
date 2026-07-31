import { globalServiceRegistry } from '../../kernel/registry/ServiceRegistry.js';
import { globalGitHubRepositoryService } from './GitHubRepositoryService.js';
import { globalGitHubHealthService } from './GitHubHealthService.js';
import { globalGitHubCommitService } from './GitHubCommitService.js';
import { globalGitHubIssueService } from './GitHubIssueService.js';
import { globalGitHubPullRequestService } from './GitHubPullRequestService.js';
import { globalGitHubActionsService } from './GitHubActionsService.js';
import { globalGitHubKnowledgeSync } from './GitHubKnowledgeSync.js';
import { globalGitHubExecutiveSync } from './GitHubExecutiveSync.js';
import { globalGitHubLiveOperationsSync } from './GitHubLiveOperationsSync.js';

export class GitHubIntegration {
  public registerService(): void {
    globalServiceRegistry.register('GitHubIntegration', {
      listRepositories: () => globalGitHubRepositoryService.listRepositories(),
      getRepositoryHealth: (repo: string) => globalGitHubHealthService.getRepositoryHealth(repo),
      listRecentCommits: (repo: string) => globalGitHubCommitService.listRecentCommits(repo),
      listOpenIssues: (repo: string) => globalGitHubIssueService.listOpenIssues(repo),
      listPullRequests: (repo: string) => globalGitHubPullRequestService.listPullRequests(repo),
      listWorkflowRuns: (repo: string) => globalGitHubActionsService.listWorkflowRuns(repo),
      syncToKnowledgeGraph: (repo: string) => globalGitHubKnowledgeSync.syncRepoToGraph(repo),
      syncToExecutiveLayer: (repo: string, issues: number, failureRate: number) => 
        globalGitHubExecutiveSync.syncToExecutive(repo, issues, failureRate),
      syncToLiveOperations: (repo: string) => globalGitHubLiveOperationsSync.syncToLiveOps(repo)
    });
  }
}

export const globalGitHubIntegration = new GitHubIntegration();
export default globalGitHubIntegration;
