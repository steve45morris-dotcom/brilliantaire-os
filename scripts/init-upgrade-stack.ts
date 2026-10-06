import { announceIntent, announceCompletion } from './vnp.js';
import { SkillRegistryManager } from '../src/agent-upgrade/registry.js';
import { WorkflowManager } from '../src/agent-upgrade/workflows.js';
import { SharedMemoryManager } from '../src/agent-upgrade/memory.js';
import { BackgroundQueueManager } from '../src/agent-upgrade/queue.js';
import { ParallelWorkspaceManager } from '../src/agent-upgrade/workspace.js';

async function main() {
  const intentMsg = 'Initializing One System Agent Upgrade Stack.';
  console.log(intentMsg);
  await announceIntent(intentMsg);

  try {
    console.log('[Init] Initializing registry...');
    new SkillRegistryManager();

    console.log('[Init] Initializing workflows templates...');
    new WorkflowManager();

    console.log('[Init] Initializing shared memory layer...');
    new SharedMemoryManager();

    console.log('[Init] Initializing background execution queue...');
    new BackgroundQueueManager();

    console.log('[Init] Initializing parallel workspaces manager...');
    new ParallelWorkspaceManager();

    const completionMsg = 'One System Agent Upgrade Stack initialized successfully. Ready for operations.';
    console.log(`✓ ${completionMsg}`);
    await announceCompletion(completionMsg, '10');
  } catch (err) {
    const errorMsg = `Agent Upgrade Stack initialization failed: ${(err as Error).message}`;
    console.error(`✗ ${errorMsg}`);
    await announceCompletion(errorMsg, '0');
    process.exit(1);
  }
}

main();
