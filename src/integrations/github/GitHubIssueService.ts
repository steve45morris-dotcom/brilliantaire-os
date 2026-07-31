import { globalGitHubClient, GitHubApiResponse } from './GitHubClient.js';
import { GitHubIssue } from './GitHubTypes.js';

export class GitHubIssueService {
  public async listOpenIssues(repo: string): Promise<GitHubApiResponse<GitHubIssue[]>> {
    const mockIssues: GitHubIssue[] = [
      {
        id: 201,
        number: 42,
        title: 'Security boundary validation loops failing under high traffic',
        state: 'open',
        labels: ['bug', 'security'],
        author: 'steve45morris',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: `https://github.com/steve45morris-dotcom/${repo}/issues/42`,
        priority: 'P1'
      }
    ];

    return globalGitHubClient.request<GitHubIssue[]>(`/repos/steve45morris-dotcom/${repo}/issues`, mockIssues);
  }
}

export const globalGitHubIssueService = new GitHubIssueService();
