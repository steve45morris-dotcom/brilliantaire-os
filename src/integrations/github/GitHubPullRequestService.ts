import { globalGitHubClient, GitHubApiResponse } from './GitHubClient.js';
import { GitHubPullRequest } from './GitHubTypes.js';

export class GitHubPullRequestService {
  public async listPullRequests(repo: string): Promise<GitHubApiResponse<GitHubPullRequest[]>> {
    const mockPRs: GitHubPullRequest[] = [
      {
        id: 301,
        number: 88,
        title: 'Merge Executive priority calculations interface',
        state: 'open',
        author: 'steve45morris',
        branch: 'feat/executive-layer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checksStatus: 'success',
        reviewStatus: 'approved',
        url: `https://github.com/steve45morris-dotcom/${repo}/pull/88`
      }
    ];

    return globalGitHubClient.request<GitHubPullRequest[]>(`/repos/steve45morris-dotcom/${repo}/pulls`, mockPRs);
  }
}

export const globalGitHubPullRequestService = new GitHubPullRequestService();
