import { globalGitHubClient } from './GitHubClient.js';
import { GitHubApiResponse } from './GitHubClient.js';

export interface GitHubBranch {
  name: string;
  sha: string;
  protected: boolean;
  default: boolean;
}

export class GitHubBranchService {
  public async listBranches(repoName: string): Promise<GitHubApiResponse<GitHubBranch[]>> {
    const mockBranches: GitHubBranch[] = [
      { name: 'main', sha: 'abc123', protected: true, default: true },
      { name: 'develop', sha: 'def456', protected: false, default: false },
      { name: 'feature/uif-integration', sha: 'ghi789', protected: false, default: false }
    ];
    return globalGitHubClient.request<GitHubBranch[]>(
      `/repos/steve45morris-dotcom/${repoName}/branches`,
      mockBranches
    );
  }
}

export const globalGitHubBranchService = new GitHubBranchService();
