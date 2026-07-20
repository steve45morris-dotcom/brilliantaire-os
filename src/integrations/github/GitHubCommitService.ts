import { globalGitHubClient, GitHubApiResponse } from './GitHubClient.js';
import { GitHubCommit } from './GitHubTypes.js';

export class GitHubCommitService {
  public async listRecentCommits(repo: string): Promise<GitHubApiResponse<GitHubCommit[]>> {
    const mockCommits: GitHubCommit[] = [
      {
        sha: 'a5c7e12d9f9fcb45b0a331111111111111111111',
        message: 'feat: Evolve OSK architecture with Supernova runtime',
        author: 'steve45morris',
        date: new Date().toISOString(),
        url: `https://github.com/steve45morris-dotcom/${repo}/commit/a5c7e12`,
        repository: repo
      }
    ];

    return globalGitHubClient.request<GitHubCommit[]>(`/repos/steve45morris-dotcom/${repo}/commits`, mockCommits);
  }
}

export const globalGitHubCommitService = new GitHubCommitService();
