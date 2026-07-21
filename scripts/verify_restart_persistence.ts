import { globalLyricWorkspace } from '../src/workspaces/icyflamze/Lyrics.js';
import { globalSongManager } from '../src/workspaces/icyflamze/Music.js';
import { globalGoalManager } from '../src/executive/GoalManager.js';
import { globalNodeRegistry } from '../src/knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../src/knowledge/EdgeRegistry.js';
import { globalGraphStore } from '../src/knowledge/GraphStore.js';
import { globalLiveOperationsStore } from '../src/kernel/live/LiveOperationsStore.js';
import { globalWorkspaceRegistry } from '../src/workspaces/WorkspaceRegistry.js';

const isVerifyMode = process.argv.includes('--verify');

async function runTest() {
  if (!isVerifyMode) {
    console.log('====================================================');
    console.log('🔄 STAGE 1: Writing Test Records via Production Singletons');
    console.log('====================================================');

    // 1. Call globalLyricWorkspace.addLyric()
    const createdLyric = globalLyricWorkspace.addLyric({
      title: 'PERSISTENCE_TEST_LYRIC_PROD_999',
      content: 'Testing process restart survival through globalLyricWorkspace production singleton.',
      type: 'Punchline',
      status: 'Approved',
      theme: 'Persistence Test',
      version: 'v1.0.0',
      references: ['production', 'singleton']
    });
    console.log(`[Stage 1] Created Lyric via globalLyricWorkspace: ${createdLyric.id} -> "${createdLyric.title}"`);

    // 2. Call globalSongManager.addSong()
    const createdSong = globalSongManager.addSong({
      title: 'PERSISTENCE_TEST_SONG_PROD_888',
      status: 'Recorded',
      genre: 'Tech Hip-Hop',
      bpm: 120,
      mood: 'Resilient',
      producer: 'Supernova',
      version: 'v1.0.0',
      lyrics: 'Data survives process termination.',
      recording: 'completed',
      mix: 'pending',
      master: 'pending',
      artwork: 'pending',
      releaseDate: '2026-10-10',
      publishingStatus: 'Unpublished'
    });
    console.log(`[Stage 1] Created Song via globalSongManager: ${createdSong.id} -> "${createdSong.title}"`);

    // 3. Call globalGoalManager.addGoal()
    const createdGoal = globalGoalManager.addGoal('PERSISTENCE_TEST_GOAL_PROD_777', 'Production Persistence Verification');
    console.log(`[Stage 1] Created Goal via globalGoalManager: ${createdGoal.id} -> "${createdGoal.title}"`);

    // 4. Call globalNodeRegistry.registerNode() and globalEdgeRegistry.registerEdge()
    globalNodeRegistry.registerNode('node-prod-666', 'Goal', { title: 'PERSISTENCE_TEST_NODE_PROD_666' });
    globalEdgeRegistry.registerEdge('node-prod-666', 'system-core', 'RELATED_TO');
    console.log(`[Stage 1] Created Node/Edge via globalNodeRegistry/globalEdgeRegistry: "node-prod-666"`);

    // 5. Call globalLiveOperationsStore.addTask()
    globalLiveOperationsStore.addTask({
      id: 'task-prod-555',
      sessionId: 'sess-prod-1',
      type: 'workflow_step',
      name: 'PERSISTENCE_TEST_TASK_PROD_555',
      status: 'running',
      projectId: 'Supernova',
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationMs: 2500,
      progress: 65,
      attentionRequired: true,
      lastEventId: 'evt-prod-555'
    });
    console.log(`[Stage 1] Created Live Task via globalLiveOperationsStore: "task-prod-555"`);

    // 6. Call globalWorkspaceRegistry.registerWorkspace()
    globalWorkspaceRegistry.registerWorkspace({
      id: 'ws-prod-444',
      name: 'PERSISTENCE_TEST_WORKSPACE_PROD_444',
      description: 'Restart test workspace',
      tag: 'Production',
      overview: 'Overview text',
      goals: [],
      workflows: [],
      recommendedActions: [],
      knowledgeLinks: [],
      revenueStatus: '$0',
      recentActivity: [],
      reports: []
    });
    console.log(`[Stage 1] Registered Workspace via globalWorkspaceRegistry: "ws-prod-444"`);

    console.log('\n✅ Stage 1 Complete. Terminating process completely...');
    process.exit(0);
  } else {
    console.log('====================================================');
    console.log('🔍 STAGE 2: Verifying Reload After Complete Process Restart');
    console.log('====================================================');

    const foundLyric = globalLyricWorkspace.getLyrics().find(l => l.title === 'PERSISTENCE_TEST_LYRIC_PROD_999');
    const foundSong = globalSongManager.getSongs().find(s => s.title === 'PERSISTENCE_TEST_SONG_PROD_888');
    const foundGoal = globalGoalManager.getGoals().find(g => g.title === 'PERSISTENCE_TEST_GOAL_PROD_777');
    const foundNode = globalGraphStore.getNodeById('node-prod-666');
    const foundTask = globalLiveOperationsStore.getTask('task-prod-555');
    const foundWorkspace = globalWorkspaceRegistry.getWorkspace('ws-prod-444');

    console.log('\n--- RAW RETRIEVED RECORDS FROM RESTARTED PROCESS ---');
    console.log('1. Lyric Record:', JSON.stringify(foundLyric, null, 2));
    console.log('2. Song Record:', JSON.stringify(foundSong, null, 2));
    console.log('3. Goal Record:', JSON.stringify(foundGoal, null, 2));
    console.log('4. Graph Node Record:', JSON.stringify(foundNode, null, 2));
    console.log('5. Task Record:', JSON.stringify(foundTask, null, 2));
    console.log('6. Workspace Record:', JSON.stringify(foundWorkspace, null, 2));

    if (!foundLyric || !foundSong || !foundGoal || !foundNode || !foundTask || !foundWorkspace) {
      console.error('\n❌ RESTART VERIFICATION FAILED: One or more records did not survive process restart!');
      process.exit(1);
    } else {
      console.log('\n🎉 RESTART VERIFICATION SUCCESSFUL: All 6 registries persisted and survived process restart!');
      process.exit(0);
    }
  }
}

runTest();
