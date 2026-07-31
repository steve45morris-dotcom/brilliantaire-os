import { globalGitHubClient, GitHubApiResponse } from './GitHubClient.js';
import { GitHubActionRun } from './GitHubTypes.js';

export class GitHubActionsService {
  public async listWorkflowRuns(repo: string): Promise<GitHubApiResponse<GitHubActionRun[]>> {
    const mockRuns: GitHubActionRun[] = [
      {
        id: 401,
        workflowName: 'Test & Lint pipeline',
        status: 'completed',
        conclusion: 'success',
        branch: 'main',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        url: `https://github.com/steve45morris-dotcom/${repo}/actions/runs/401`
      }
    ];

    return globalGitHubClient.request<GitHubActionRun[]>(`/repos/steve45morris-dotcom/${repo}/actions/runs`, mockRuns);
  }
}

export const globalGitHubActionsService = new GitHubActionsService();
