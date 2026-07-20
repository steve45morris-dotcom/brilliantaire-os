import { globalGitHubClient } from './GitHubClient.js';
import { GitHubApiResponse } from './GitHubClient.js';

export interface GitHubTag {
  name: string;
  sha: string;
  message: string;
  createdAt: string;
}

export class GitHubTagService {
  public async listTags(repoName: string): Promise<GitHubApiResponse<GitHubTag[]>> {
    const mockTags: GitHubTag[] = [
      { name: 'v1.0.0', sha: 'aaa111', message: 'Initial stable release', createdAt: '2026-01-01T00:00:00.000Z' },
      { name: 'v1.1.0', sha: 'bbb222', message: 'Feature update', createdAt: '2026-03-15T00:00:00.000Z' },
      { name: 'v1.2.0-beta', sha: 'ccc333', message: 'Beta release', createdAt: '2026-06-01T00:00:00.000Z' }
    ];
    return globalGitHubClient.request<GitHubTag[]>(
      `/repos/steve45morris-dotcom/${repoName}/tags`,
      mockTags
    );
  }
}

export const globalGitHubTagService = new GitHubTagService();
