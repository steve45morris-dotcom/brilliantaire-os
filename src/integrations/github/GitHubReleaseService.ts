import { globalGitHubClient } from './GitHubClient.js';
import { GitHubApiResponse } from './GitHubClient.js';

export interface GitHubRelease {
  id: number;
  name: string;
  tagName: string;
  draft: boolean;
  prerelease: boolean;
  publishedAt: string;
  body: string;
}

export class GitHubReleaseService {
  public async listReleases(repoName: string): Promise<GitHubApiResponse<GitHubRelease[]>> {
    const mockReleases: GitHubRelease[] = [
      {
        id: 1,
        name: 'v1.0.0 — Stable Release',
        tagName: 'v1.0.0',
        draft: false,
        prerelease: false,
        publishedAt: '2026-01-01T00:00:00.000Z',
        body: 'Initial stable release of The One System OS integrations.'
      },
      {
        id: 2,
        name: 'v0.9.0-beta — Pre-release',
        tagName: 'v0.9.0-beta',
        draft: false,
        prerelease: true,
        publishedAt: '2025-11-15T00:00:00.000Z',
        body: 'Beta pre-release for early testing.'
      }
    ];
    return globalGitHubClient.request<GitHubRelease[]>(
      `/repos/steve45morris-dotcom/${repoName}/releases`,
      mockReleases
    );
  }
}

export const globalGitHubReleaseService = new GitHubReleaseService();
