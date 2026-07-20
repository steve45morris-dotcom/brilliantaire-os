import { globalGitHubClient } from './GitHubClient.js';
import { GitHubApiResponse } from './GitHubClient.js';

export interface GitHubContributor {
  login: string;
  id: number;
  contributions: number;
  avatarUrl: string;
  htmlUrl: string;
}

export class GitHubContributorService {
  public async listContributors(repoName: string): Promise<GitHubApiResponse<GitHubContributor[]>> {
    const mockContributors: GitHubContributor[] = [
      {
        login: 'steve45morris',
        id: 1001,
        contributions: 142,
        avatarUrl: 'https://avatars.githubusercontent.com/u/1001',
        htmlUrl: 'https://github.com/steve45morris'
      },
      {
        login: 'uif-bot',
        id: 2002,
        contributions: 87,
        avatarUrl: 'https://avatars.githubusercontent.com/u/2002',
        htmlUrl: 'https://github.com/uif-bot'
      },
      {
        login: 'kernel-agent',
        id: 3003,
        contributions: 34,
        avatarUrl: 'https://avatars.githubusercontent.com/u/3003',
        htmlUrl: 'https://github.com/kernel-agent'
      }
    ];
    return globalGitHubClient.request<GitHubContributor[]>(
      `/repos/steve45morris-dotcom/${repoName}/contributors`,
      mockContributors
    );
  }
}

export const globalGitHubContributorService = new GitHubContributorService();
