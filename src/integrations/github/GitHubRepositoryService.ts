import { globalGitHubClient, GitHubApiResponse } from './GitHubClient.js';
import { GitHubRepository } from './GitHubTypes.js';

export class GitHubRepositoryService {
  public async listRepositories(): Promise<GitHubApiResponse<GitHubRepository[]>> {
    const mockRepos: GitHubRepository[] = [
      {
        id: 101,
        name: 'brilliantaire-os',
        owner: 'steve45morris-dotcom',
        url: 'https://github.com/steve45morris-dotcom/brilliantaire-os',
        defaultBranch: 'main',
        description: 'The AI Orchestrator Core System Dashboard',
        visibility: 'private',
        language: 'TypeScript',
        stars: 1,
        forks: 0,
        openIssues: 3,
        lastPushedAt: new Date().toISOString(),
        healthStatus: 'healthy'
      }
    ];

    return globalGitHubClient.request<GitHubRepository[]>('/user/repos', mockRepos);
  }
}

export const globalGitHubRepositoryService = new GitHubRepositoryService();
