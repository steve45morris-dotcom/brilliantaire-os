import { BootManager } from '../src/kernel/boot/BootManager.js';
import { globalServiceRegistry } from '../src/kernel/registry/ServiceRegistry.js';
import { getGitHubConfig, redactGitHubToken } from '../src/integrations/github/GitHubConfig.js';
import { withLiveSession } from './lib/withLiveSession.js';

const cmd = process.argv[2] || 'status';

async function main() {
  // Boot the OSK to register all services
  const bootManager = new BootManager();
  await bootManager.boot();

  const config = getGitHubConfig();
  console.log(`[GitHub CLI] Command: ${cmd}`);
  console.log(`[GitHub CLI] Owner: ${config.owner}`);
  console.log(`[GitHub CLI] Token Status: ${redactGitHubToken(config.token)}`);
  console.log(`[GitHub CLI] Mode: ${config.readOnly ? 'READ-ONLY' : 'READ-WRITE'}`);

  const gitHubService = globalServiceRegistry.getService('GitHubIntegration');
  if (!gitHubService) {
    throw new Error('GitHubIntegration service is not registered in the Kernel ServiceRegistry');
  }

  await withLiveSession(`github:${cmd}`, async () => {
    switch (cmd) {
      case 'status': {
        const res = await gitHubService.listRepositories();
        console.log(`Status payload (source: ${res.source}):`);
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }
      case 'sync': {
        console.log('Syncing repositories to mappings...');
        break;
      }
      case 'health': {
        const res = await gitHubService.getRepositoryHealth('brilliantaire-os');
        console.log(`Health payload (source: ${res.source}):`);
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }
      case 'issues': {
        const res = await gitHubService.listOpenIssues('brilliantaire-os');
        console.log(`Issues payload (source: ${res.source}):`);
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }
      case 'prs': {
        const res = await gitHubService.listPullRequests('brilliantaire-os');
        console.log(`PRs payload (source: ${res.source}):`);
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }
      case 'actions': {
        const res = await gitHubService.listWorkflowRuns('brilliantaire-os');
        console.log(`Actions payload (source: ${res.source}):`);
        console.log(JSON.stringify(res.data, null, 2));
        break;
      }
      case 'knowledge-sync': {
        await gitHubService.syncToKnowledgeGraph('brilliantaire-os');
        console.log('Synced GitHub nodes to Knowledge Graph.');
        break;
      }
      case 'executive-sync': {
        await gitHubService.syncToExecutiveLayer('brilliantaire-os', 3, 0.1);
        console.log('Synced GitHub metrics to Executive Layer.');
        break;
      }
      case 'ops-sync': {
        await gitHubService.syncToLiveOperations('brilliantaire-os');
        console.log('Synced GitHub sync jobs to Live Operations.');
        break;
      }
      default:
        console.log(`Unknown command: ${cmd}`);
    }
  });
}

main().catch(console.error);
