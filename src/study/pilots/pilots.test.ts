import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { globalGraphStore } from '../../knowledge/GraphStore.js';
import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';
import { createPilotRecord } from './PilotRecord.js';
import { PilotRegistry } from './PilotRegistry.js';
import { PilotRunner } from './PilotRunner.js';
import { scorePilot } from './PilotScoring.js';
import { verifyPilot } from './PilotVerification.js';
import { PilotKnowledgeSync } from './PilotKnowledgeSync.js';

const createReadyPilot = () => createPilotRecord({
  id: 'pilot-change-impact',
  skillId: 'engineering-change-impact-analysis',
  title: 'Change Impact Analysis: Icyflamze Song and Lyric Slice',
  workspace: 'icyflamze',
  realTask: 'Link a lyric draft to a song record.',
  objective: 'Keep implementation inside the predicted scope.',
  whyThisPilot: 'The task crosses workspace models, UI actions, tests, and documentation.',
  whenApplied: 'Before the first source change.',
  procedure: ['Capture baseline', 'Predict impact', 'Implement', 'Compare actual scope'],
  baseline: {
    commit: 'baseline-commit',
    buildStatus: 'passed',
    testStatus: 'passed',
    dirtyFiles: ['unrelated-user-file.txt']
  },
  expectedOutcome: 'Actual changes remain substantially inside the predicted scope.',
  successMetrics: [
    { name: 'impactPredictionAccuracy', target: 80, unit: 'percent', direction: 'at-least' }
  ],
  failureConditions: ['More than two unpredicted source files change'],
  rollbackPlan: ['Restore pilot-owned files from the captured patch', 'Run tests and build'],
  reviewer: 'OS Architect',
  relatedReports: ['docs/pilots/CHANGE_IMPACT_ANALYSIS_ICYFLAMZE_SONG_LYRIC.md'],
  relatedCommits: [],
  knowledgeNodeIds: ['skill:engineering-change-impact-analysis']
});

describe('engineering skill pilot framework', () => {
  beforeEach(() => {
    globalLiveOperationsStore.clear();
    globalGraphStore.clear();
  });

  it('validates required pilot record fields', () => {
    expect(() => createPilotRecord({ id: '', skillId: '', title: '' } as never)).toThrow(/id/i);
    expect(createReadyPilot()).toMatchObject({
      status: 'planned',
      evidence: [],
      maturityDecision: null,
      completedAt: null
    });
  });

  it('persists records and enforces valid status transitions', () => {
    const storagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-registry-')), 'pilots.json');
    const registry = new PilotRegistry(storagePath, []);
    registry.register(createReadyPilot());

    expect(registry.transition('pilot-change-impact', 'ready').status).toBe('ready');
    expect(registry.transition('pilot-change-impact', 'running').status).toBe('running');
    expect(() => registry.transition('pilot-change-impact', 'completed')).toThrow(/transition/i);

    const reloaded = new PilotRegistry(storagePath, []);
    expect(reloaded.get('pilot-change-impact')?.status).toBe('running');
  });

  it('requires evidence and verification before a pilot can be measured or completed', () => {
    const storagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-runner-')), 'pilots.json');
    const registry = new PilotRegistry(storagePath, [createReadyPilot()]);
    const runner = new PilotRunner(registry);

    runner.start('pilot-change-impact');
    expect(() => runner.beginVerification('pilot-change-impact')).toThrow(/evidence/i);

    runner.recordEvidence('pilot-change-impact', {
      id: 'evidence-impact-report',
      type: 'report',
      path: 'docs/pilots/CHANGE_IMPACT_ANALYSIS_ICYFLAMZE_SONG_LYRIC.md',
      summary: 'Predicted and actual scope comparison.',
      recordedAt: '2026-07-12T10:00:00.000Z',
      verified: true
    });
    runner.beginVerification('pilot-change-impact');
    runner.recordVerification('pilot-change-impact', {
      passed: true,
      checkedAt: '2026-07-12T10:05:00.000Z',
      checks: [{ name: 'impact report exists', passed: true, evidence: 'evidence-impact-report' }],
      reviewer: 'OS Architect',
      notes: []
    });
    runner.measure('pilot-change-impact', {
      metrics: [{ name: 'impactPredictionAccuracy', value: 90, unit: 'percent' }],
      summary: 'Prediction accuracy exceeded the target.',
      measuredAt: '2026-07-12T10:10:00.000Z'
    });
    const completed = runner.complete('pilot-change-impact', 'Continue Pilot', ['Repeat on another task.']);

    expect(completed.status).toBe('completed');
    expect(completed.maturityDecision).toBe('Continue Pilot');
    expect(globalLiveOperationsStore.getEvents().some((event) => event.type === 'PilotCompleted')).toBe(true);
  });

  it('blocks Operational promotion after a single successful pilot', () => {
    const pilot = createReadyPilot();
    pilot.status = 'measured';
    pilot.evidence = [{
      id: 'evidence-1',
      type: 'test',
      path: 'test-output.txt',
      summary: 'Tests passed.',
      recordedAt: '2026-07-12T10:00:00.000Z',
      verified: true
    }];
    pilot.verificationResult = {
      passed: true,
      checkedAt: '2026-07-12T10:05:00.000Z',
      checks: [{ name: 'tests', passed: true, evidence: 'evidence-1' }],
      reviewer: 'OS Architect',
      notes: []
    };
    pilot.measuredOutcome = {
      metrics: [{ name: 'impactPredictionAccuracy', value: 90, unit: 'percent' }],
      summary: 'Target met.',
      measuredAt: '2026-07-12T10:10:00.000Z'
    };

    expect(verifyPilot(pilot, 'Verified').passed).toBe(true);
    expect(verifyPilot(pilot, 'Operational')).toMatchObject({
      passed: false,
      blockers: expect.arrayContaining([expect.stringMatching(/repeated successful use/i)])
    });
  });

  it('scores measured value without mutating the pilot', () => {
    const pilot = createReadyPilot();
    pilot.measuredOutcome = {
      metrics: [{ name: 'impactPredictionAccuracy', value: 90, unit: 'percent' }],
      summary: 'Target met.',
      measuredAt: '2026-07-12T10:10:00.000Z'
    };

    expect(scorePilot(pilot)).toMatchObject({ score: 100, metMetrics: 1, totalMetrics: 1 });
    expect(pilot.status).toBe('planned');
  });

  it('syncs pilots through the existing knowledge graph implementation', () => {
    const sync = new PilotKnowledgeSync();
    const result = sync.sync(createReadyPilot());

    expect(result.pilotNodeId).toBe('pilot:pilot-change-impact');
    expect(globalGraphStore.getNodeById(result.pilotNodeId)?.type).toBe('Pilot');
    expect(globalGraphStore.getEdges().some((edge) => edge.type === 'SKILL_TESTED_BY')).toBe(true);
    expect(globalGraphStore.getEdges().map((edge) => edge.type)).toEqual(expect.arrayContaining([
      'PILOT_APPLIED_TO',
      'PILOT_PRODUCED',
      'PILOT_EXPOSED_RISK',
      'PILOT_VERIFIED_BY',
      'PILOT_IMPROVED'
    ]));
  });
});
