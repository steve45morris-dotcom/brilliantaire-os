import { GitHubRepositoryHealth } from './GitHubTypes.js';
import { globalGitHubClient, GitHubApiResponse } from './GitHubClient.js';

export class GitHubHealthService {
  public async getRepositoryHealth(repo: string): Promise<GitHubApiResponse<GitHubRepositoryHealth>> {
    const mockHealth: GitHubRepositoryHealth = {
      repository: repo,
      buildStatus: 'passing',
      openIssueCount: 3,
      staleIssueCount: 1,
      openPRCount: 1,
      failedWorkflowCount: 0,
      lastCommitAgeDays: 0,
      riskLevel: 'low',
      recommendedAction: 'Keep up commits flow'
    };

    return globalGitHubClient.request<GitHubRepositoryHealth>(`/repos/steve45morris-dotcom/${repo}/health`, mockHealth);
  }
}

export const globalGitHubHealthService = new GitHubHealthService();
