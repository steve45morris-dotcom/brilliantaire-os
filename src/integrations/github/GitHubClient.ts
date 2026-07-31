import { getGitHubConfig } from './GitHubConfig.js';

export interface GitHubApiResponse<T> {
  data: T;
  source: 'live' | 'mock' | 'fallback';
  status: 'online' | 'offline' | 'error';
  errors: string[];
  lastUpdated: string;
}

export class GitHubClient {
  public async request<T>(endpoint: string, mockValue: T): Promise<GitHubApiResponse<T>> {
    const config = getGitHubConfig();

    if (config.useMockFallback || !config.token) {
      return {
        data: mockValue,
        source: 'mock',
        status: 'online',
        errors: [],
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      const url = `https://api.github.com${endpoint}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'TheOneSystemOS'
        }
      });

      if (!res.ok) {
        throw new Error(`GitHub API returned status ${res.status}`);
      }

      const json = await res.json();
      return {
        data: json as T,
        source: 'live',
        status: 'online',
        errors: [],
        lastUpdated: new Date().toISOString()
      };
    } catch (e: any) {
      return {
        data: mockValue,
        source: 'fallback',
        status: 'error',
        errors: [e.message],
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

export const globalGitHubClient = new GitHubClient();
