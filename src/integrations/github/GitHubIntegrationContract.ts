import { IntegrationContract } from '../core/IntegrationTypes.js';
import { globalGitHubRepositoryService } from './GitHubRepositoryService.js';
import { globalGitHubHealthService } from './GitHubHealthService.js';
import { globalGitHubCommitService } from './GitHubCommitService.js';
import { globalGitHubIssueService } from './GitHubIssueService.js';
import { globalGitHubPullRequestService } from './GitHubPullRequestService.js';
import { globalGitHubActionsService } from './GitHubActionsService.js';
import { globalGitHubKnowledgeSync } from './GitHubKnowledgeSync.js';
import { globalGitHubExecutiveSync } from './GitHubExecutiveSync.js';
import { globalGitHubLiveOperationsSync } from './GitHubLiveOperationsSync.js';
import { getGitHubConfig, redactGitHubToken } from './GitHubConfig.js';

export class GitHubIntegrationContract implements IntegrationContract {
  public id = 'github';
  public name = 'GitHub Read-Only Intelligence';
  public provider = 'GitHub';
  public version = '1.0.0';
  public status: IntegrationContract['status'] = 'registered';
  public permissions = ['repo:read', 'workflow:read'];

  public get authentication() {
    const config = getGitHubConfig();
    return {
      type: 'token' as const,
      authenticated: !!config.token,
      maskedToken: redactGitHubToken(config.token)
    };
  }

  public get health() {
    return {
      status: 'healthy' as const,
      lastCheckedAt: new Date().toISOString(),
      latencyMs: 12,
      errors: []
    };
  }

  public capabilities = [
    'listRepositories',
    'getRepositoryHealth',
    'listRecentCommits',
    'listOpenIssues',
    'listPullRequests',
    'listWorkflowRuns'
  ];

  public events = [
    'GitHubRepositorySynced',
    'GitHubHealthUpdated',
    'GitHubIssueDetected',
    'GitHubPullRequestDetected',
    'GitHubWorkflowFailed'
  ];

  public commands = [
    'github:status',
    'github:health',
    'github:sync'
  ];

  public async sync(repoName = 'brilliantaire-os'): Promise<void> {
    await this.syncToLiveOperations(repoName);
  }

  public async bridge(endpoint: string): Promise<any> {
    if (endpoint === 'repositories') {
      return globalGitHubRepositoryService.listRepositories();
    }
    if (endpoint === 'health') {
      return globalGitHubHealthService.getRepositoryHealth('brilliantaire-os');
    }
    return { data: null };
  }

  public async knowledgeSync(repoName = 'brilliantaire-os'): Promise<void> {
    globalGitHubKnowledgeSync.syncRepoToGraph(repoName);
  }

  public async executiveSync(repoName = 'brilliantaire-os'): Promise<void> {
    globalGitHubExecutiveSync.syncToExecutive(repoName, 3, 0.1);
  }

  public async syncToLiveOperations(repoName = 'brilliantaire-os'): Promise<void> {
    globalGitHubLiveOperationsSync.syncToLiveOps(repoName);
  }
}

export const globalGitHubIntegrationContract = new GitHubIntegrationContract();
