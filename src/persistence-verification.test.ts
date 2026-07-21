import { describe, it, expect, beforeEach } from 'vitest';
import { LyricWorkspace } from './workspaces/icyflamze/Lyrics.js';
import { SongManager } from './workspaces/icyflamze/Music.js';
import { GoalManager } from './executive/GoalManager.js';
import { GraphStore } from './knowledge/GraphStore.js';
import { LiveOperationsStore } from './kernel/live/LiveOperationsStore.js';
import { WorkspaceRegistry } from './workspaces/WorkspaceRegistry.js';
import { getDB } from './db.js';

describe('Persistence Layer Write-Then-Reload Unit Tests', () => {
  beforeEach(() => {
    // Clear test tables before each test
    const db = getDB();
    db.exec(`
      DELETE FROM icyflamze_lyrics;
      DELETE FROM icyflamze_songs;
      DELETE FROM executive_goals;
      DELETE FROM knowledge_nodes;
      DELETE FROM knowledge_edges;
      DELETE FROM live_sessions;
      DELETE FROM live_tasks;
      DELETE FROM custom_workspaces;
    `);
  });

  it('LyricWorkspace writes to SQLite and reloads correctly on new instance creation', () => {
    const writer = new LyricWorkspace();
    const created = writer.addLyric({
      title: 'PERSIST_VITEST_LYRIC',
      content: 'Testing write through vitest.',
      type: 'Notebook',
      status: 'Approved',
      theme: 'Testing',
      version: 'v1.0.0',
      references: ['vitest']
    });

    // Instantiate fresh reader object (simulates new process / restart)
    const reader = new LyricWorkspace();
    const found = reader.getLyrics().find(l => l.id === created.id);

    expect(found).not.toBeUndefined();
    expect(found?.title).toBe('PERSIST_VITEST_LYRIC');
  });

  it('SongManager writes to SQLite and reloads correctly on new instance creation', () => {
    const writer = new SongManager();
    const created = writer.addSong({
      title: 'PERSIST_VITEST_SONG',
      status: 'Mastered',
      genre: 'Test Genre',
      bpm: 128,
      mood: 'Focused',
      producer: 'Vitest Producer',
      version: 'v1.0.0',
      lyrics: 'Test lyrics',
      recording: 'completed',
      mix: 'completed',
      master: 'completed',
      artwork: 'completed',
      releaseDate: '2026-12-31',
      publishingStatus: 'Published'
    });

    const reader = new SongManager();
    const found = reader.getSong(created.id);

    expect(found).not.toBeNull();
    expect(found?.title).toBe('PERSIST_VITEST_SONG');
  });

  it('GoalManager writes to SQLite and reloads correctly on new instance creation', () => {
    const writer = new GoalManager();
    const created = writer.addGoal('PERSIST_VITEST_GOAL', 'Vitest Project');

    const reader = new GoalManager();
    const found = reader.getGoals().find(g => g.id === created.id);

    expect(found).not.toBeUndefined();
    expect(found?.title).toBe('PERSIST_VITEST_GOAL');
  });

  it('GraphStore writes nodes and edges to SQLite and reloads on new instance creation', () => {
    const writer = new GraphStore();
    writer.addNode('vitest-node-1', 'Project', { title: 'Vitest Project Node' });
    writer.addEdge('vitest-node-1', 'system-core', 'RELATED_TO');

    const reader = new GraphStore();
    const foundNode = reader.getNodeById('vitest-node-1');
    const foundEdges = reader.getEdges().filter(e => e.fromNodeId === 'vitest-node-1');

    expect(foundNode).not.toBeUndefined();
    expect(foundNode?.properties.title).toBe('Vitest Project Node');
    expect(foundEdges.length).toBeGreaterThan(0);
  });

  it('LiveOperationsStore persists task progress and attention required without loss', () => {
    const writer = new LiveOperationsStore();
    writer.addTask({
      id: 'vitest-task-1',
      sessionId: 'sess-v1',
      type: 'workflow',
      name: 'VITEST_PERSIST_TASK',
      status: 'running',
      projectId: 'TestProject',
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationMs: 1500,
      progress: 75,
      attentionRequired: true,
      lastEventId: 'evt-75'
    });

    const reader = new LiveOperationsStore();
    const foundTask = reader.getTask('vitest-task-1');

    expect(foundTask).not.toBeUndefined();
    expect(foundTask?.progress).toBe(75);
    expect(foundTask?.attentionRequired).toBe(true);
    expect(foundTask?.name).toBe('VITEST_PERSIST_TASK');
  });

  it('WorkspaceRegistry writes custom workspace records to SQLite and reloads', () => {
    const writer = new WorkspaceRegistry();
    writer.registerWorkspace({
      id: 'vitest-ws-1',
      name: 'VITEST_PERSIST_WORKSPACE',
      description: 'Test WS',
      tag: 'TestTag',
      overview: 'Test Overview',
      goals: [],
      workflows: [],
      recommendedActions: [],
      knowledgeLinks: [],
      revenueStatus: '$0',
      recentActivity: [],
      reports: []
    });

    const reader = new WorkspaceRegistry();
    const foundWS = reader.getWorkspace('vitest-ws-1');

    expect(foundWS).not.toBeNull();
    expect(foundWS?.name).toBe('VITEST_PERSIST_WORKSPACE');
  });
});
