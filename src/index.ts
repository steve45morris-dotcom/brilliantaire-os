import process from "node:process";
import { globalLyricWorkspace } from './workspaces/icyflamze/Lyrics.js';
import { globalSongManager } from './workspaces/icyflamze/Music.js';
import { globalGoalManager } from './executive/GoalManager.js';
import { globalGraphStore } from './knowledge/GraphStore.js';
import { globalLiveOperationsStore } from './kernel/live/LiveOperationsStore.js';
import { globalWorkspaceRegistry } from './workspaces/WorkspaceRegistry.js';

export * from './study/index.js';

/**
 * Brilliantaire OS Core Entrypoint
 * "I build before burning."
 */

export function main() {
  const lyricCount = globalLyricWorkspace.getLyrics().length;
  const songCount = globalSongManager.getSongs().length;
  const goalCount = globalGoalManager.getGoals().length;
  const nodeCount = globalGraphStore.getNodes().length;
  const taskCount = globalLiveOperationsStore.getTasks().length;
  const wsCount = globalWorkspaceRegistry.listWorkspaces().length;

  console.log(`Brilliantaire OS operational. Persisted stores loaded: ${lyricCount} lyrics, ${songCount} songs, ${goalCount} goals, ${nodeCount} graph nodes, ${taskCount} live tasks, ${wsCount} workspaces.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
