import { LyricWorkspace } from '../src/workspaces/icyflamze/Lyrics.js';
import { SongManager } from '../src/workspaces/icyflamze/Music.js';
import { GoalManager } from '../src/executive/GoalManager.js';
import { GraphStore } from '../src/knowledge/GraphStore.js';
import { LiveOperationsStore } from '../src/kernel/live/LiveOperationsStore.js';
import { WorkspaceRegistry } from '../src/workspaces/WorkspaceRegistry.js';

const isVerifyMode = process.argv.includes('--verify');

async function runTest() {
  if (!isVerifyMode) {
    console.log('====================================================');
    console.log('🔄 STAGE 1: Writing Test Records to SQLite Database');
    console.log('====================================================');

    const lyrics = new LyricWorkspace();
    const songs = new SongManager();
    const goals = new GoalManager();
    const graph = new GraphStore();
    const liveOps = new LiveOperationsStore();
    const workspaces = new WorkspaceRegistry();

    const createdLyric = lyrics.addLyric({
      title: 'PERSISTENCE_TEST_LYRIC_1001',
      content: 'Testing process restart survival under SQLite WAL mode.',
      type: 'Punchline',
      status: 'Approved',
      theme: 'Persistence Test',
      version: 'v1.0.0',
      references: ['sqlite', 'wal']
    });
    console.log(`[Stage 1] Created Lyric: ${createdLyric.id} -> "${createdLyric.title}"`);

    const createdSong = songs.addSong({
      title: 'PERSISTENCE_TEST_SONG_2002',
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
    console.log(`[Stage 1] Created Song: ${createdSong.id} -> "${createdSong.title}"`);

    const createdGoal = goals.addGoal('PERSISTENCE_TEST_GOAL_3003', 'Persistence Verification');
    console.log(`[Stage 1] Created Goal: ${createdGoal.id} -> "${createdGoal.title}"`);

    graph.addNode('node-test-4004', 'Goal', { title: 'PERSISTENCE_TEST_NODE_4004' });
    console.log(`[Stage 1] Created Graph Node: "node-test-4004"`);

    liveOps.addTask({
      id: 'task-test-5005',
      sessionId: 'sess-restart-1',
      type: 'workflow_step',
      name: 'PERSISTENCE_TEST_TASK_5005',
      status: 'running',
      projectId: 'Supernova',
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationMs: 0,
      progress: 50,
      attentionRequired: false,
      lastEventId: 'evt-test'
    });
    console.log(`[Stage 1] Created Live Task: "task-test-5005"`);

    workspaces.registerWorkspace({
      id: 'ws-test-6006',
      name: 'PERSISTENCE_TEST_WORKSPACE_6006',
      description: 'Restart test workspace',
      tag: 'Test',
      overview: 'Overview text',
      goals: [],
      workflows: [],
      recommendedActions: [],
      knowledgeLinks: [],
      revenueStatus: '$0',
      recentActivity: [],
      reports: []
    });
    console.log(`[Stage 1] Registered Workspace: "ws-test-6006"`);

    console.log('\n✅ Stage 1 Complete. Terminating process completely...');
    process.exit(0);
  } else {
    console.log('====================================================');
    console.log('🔍 STAGE 2: Verifying Reload After Complete Process Restart');
    console.log('====================================================');

    // Instantiate fresh objects from scratch in a brand new Node process
    const lyrics = new LyricWorkspace();
    const songs = new SongManager();
    const goals = new GoalManager();
    const graph = new GraphStore();
    const liveOps = new LiveOperationsStore();
    const workspaces = new WorkspaceRegistry();

    const foundLyric = lyrics.getLyrics().find(l => l.title === 'PERSISTENCE_TEST_LYRIC_1001');
    const foundSong = songs.getSongs().find(s => s.title === 'PERSISTENCE_TEST_SONG_2002');
    const foundGoal = goals.getGoals().find(g => g.title === 'PERSISTENCE_TEST_GOAL_3003');
    const foundNode = graph.getNodeById('node-test-4004');
    const foundTask = liveOps.getTask('task-test-5005');
    const foundWorkspace = workspaces.getWorkspace('ws-test-6006');

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
