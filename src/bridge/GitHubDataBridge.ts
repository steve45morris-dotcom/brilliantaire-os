import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';
import { globalGitHubRepositoryService } from '../integrations/github/GitHubRepositoryService.js';
import { globalGitHubHealthService } from '../integrations/github/GitHubHealthService.js';

export class GitHubDataBridge extends LiveDataBridge {
  public async getRepositories(): Promise<BridgeResponse<any[]>> {
    try {
      const res = await globalGitHubRepositoryService.listRepositories();
      return this.buildResponse(res.data, res.source, res.status, res.errors);
    } catch (e: any) {
      return this.buildResponse([], 'fallback', 'error', [e.message]);
    }
  }

  public async getHealthSummary(repo: string): Promise<BridgeResponse<any>> {
    try {
      const res = await globalGitHubHealthService.getRepositoryHealth(repo);
      return this.buildResponse(res.data, res.source, res.status, res.errors);
    } catch (e: any) {
      return this.buildResponse({}, 'fallback', 'error', [e.message]);
    }
  }
}

export const globalGitHubDataBridge = new GitHubDataBridge();
