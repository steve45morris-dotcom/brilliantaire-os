import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class GitHubKnowledgeSync {
  public syncRepoToGraph(repoName: string): void {
    // 1. Create Repository node
    globalNodeRegistry.registerNode(`github-repo-${repoName}`, 'Project', {
      name: repoName,
      url: `https://github.com/steve45morris-dotcom/${repoName}`
    });

    // 2. Link Repository to core System Project node
    globalEdgeRegistry.registerEdge(`github-repo-${repoName}`, 'system-core', 'DEPENDS_ON');

    // 3. Publish Event
    globalEventBus.publish('GitHubKnowledgeSynced', { repoName, timestamp: new Date().toISOString() });
  }
}

export const globalGitHubKnowledgeSync = new GitHubKnowledgeSync();
