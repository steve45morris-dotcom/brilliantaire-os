export interface GitHubConfig {
  token: string | null;
  owner: string;
  repos: string[];
  readOnly: boolean;
  useMockFallback: boolean;
}

export function getGitHubConfig(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN || null;
  const owner = process.env.GITHUB_OWNER || 'steve45morris-dotcom';
  const reposRaw = process.env.GITHUB_REPOS || 'brilliantaire-os';
  const repos = reposRaw.split(',').map(r => r.trim()).filter(Boolean);

  return {
    token,
    owner,
    repos,
    readOnly: true,
    useMockFallback: !token
  };
}

import { maskAPIKey } from '../core/SecretMasker.js';

export function redactGitHubToken(token: string | null): string {
  return maskAPIKey('GITHUB_TOKEN', token);
}
