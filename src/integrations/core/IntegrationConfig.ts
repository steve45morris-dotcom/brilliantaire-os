export function redactSecret(secret?: string): string {
  if (!secret) return 'MISSING';
  if (secret.length <= 8) return '********';
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

export interface UIFConfig {
  githubToken?: string;
  githubOwner?: string;
}

export function loadUIFConfig(): UIFConfig {
  return {
    githubToken: process.env.GITHUB_TOKEN,
    githubOwner: process.env.GITHUB_OWNER
  };
}
