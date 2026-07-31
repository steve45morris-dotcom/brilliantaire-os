import { describe, it, expect } from 'vitest';
import { getGitHubConfig, redactGitHubToken } from './integrations/github/GitHubConfig.js';
import { globalGitHubRepositoryService } from './integrations/github/GitHubRepositoryService.js';
import { globalGitHubHealthService } from './integrations/github/GitHubHealthService.js';
import { globalGitHubKnowledgeSync } from './integrations/github/GitHubKnowledgeSync.js';
import { globalGitHubLiveOperationsSync } from './integrations/github/GitHubLiveOperationsSync.js';

describe('GitHub Integration Tests', () => {
  it('should load configuration and redact secrets cleanly', () => {
    const config = getGitHubConfig();
    expect(config.readOnly).toBe(true);

    const redacted = redactGitHubToken('ghp_testtoken1234567890');
    expect(redacted).toContain('••••••••');
    expect(redacted).not.toContain('testtoken');
  });

  it('should fallback to mock data when config is not configured', async () => {
    const res = await globalGitHubRepositoryService.listRepositories();
    expect(res.source).toBe('mock');
    expect(res.status).toBe('online');
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].name).toBe('brilliantaire-os');
  });

  it('should score repository health properties correctly', async () => {
    const res = await globalGitHubHealthService.getRepositoryHealth('brilliantaire-os');
    expect(res.data.riskLevel).toBe('low');
    expect(res.data.buildStatus).toBe('passing');
  });

  it('should trigger knowledge sync nodes registrations', () => {
    // Invoke sync operation
    expect(() => globalGitHubKnowledgeSync.syncRepoToGraph('brilliantaire-os')).not.toThrow();
  });

  it('should trigger live operations sync records logging', () => {
    expect(() => globalGitHubLiveOperationsSync.syncToLiveOps('brilliantaire-os')).not.toThrow();
  });
});
