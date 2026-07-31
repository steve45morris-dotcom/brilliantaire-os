import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { globalLiveOperationsStore } from '../../kernel/live/LiveOperationsStore.js';
import { ENGINEERING_PILOT_RECORDS } from './InitialPilotPack.js';
import { runPilotCommand } from './PilotCli.js';
import { PilotRegistry } from './PilotRegistry.js';

describe('engineering pilot records and CLI', () => {
  beforeEach(() => globalLiveOperationsStore.clear());

  it('seeds exactly the five selected measured pilots with explicit decisions', () => {
    expect(ENGINEERING_PILOT_RECORDS).toHaveLength(5);
    expect(new Set(ENGINEERING_PILOT_RECORDS.map((pilot) => pilot.skillId)).size).toBe(5);
    for (const pilot of ENGINEERING_PILOT_RECORDS) {
      expect(pilot.status).toBe('completed');
      expect(pilot.evidence.some((evidence) => evidence.verified)).toBe(true);
      expect(pilot.verificationResult?.passed).toBe(true);
      expect(pilot.measuredOutcome?.metrics.length).toBeGreaterThan(0);
      expect(pilot.maturityDecision).toMatch(/Promote|Continue Pilot|Revise|Suspend|Reject|Archive/);
    }
  });

  it('returns structured list and status output with evidence and maturity effects', () => {
    const storagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-cli-')), 'registry.json');
    const registry = new PilotRegistry(storagePath, ENGINEERING_PILOT_RECORDS);
    const list = runPilotCommand('pilots:list', [], registry);
    const status = runPilotCommand('pilots:status', [ENGINEERING_PILOT_RECORDS[0].id], registry);

    expect(list).toMatchObject({ status: 'ok', command: 'pilots:list', count: 5 });
    expect((list as any).pilots[0]).toHaveProperty('evidencePaths');
    expect(status).toMatchObject({
      status: 'ok',
      command: 'pilots:status',
      maturityEffect: expect.any(String)
    });
  });

  it('reports bounded evidence paths for pilot-specific commands', () => {
    const storagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-tools-')), 'registry.json');
    const registry = new PilotRegistry(storagePath, ENGINEERING_PILOT_RECORDS);
    for (const command of ['docs:drift', 'readiness:review', 'impact:analyze', 'troubleshoot:case', 'rollback:verify']) {
      const result = runPilotCommand(command, [], registry);
      expect(result).toMatchObject({ status: 'ok', command, evidencePaths: expect.any(Array) });
      expect((result as any).evidencePaths.length).toBeGreaterThan(0);
    }
  });

  it('logs every command to Live Operations', () => {
    const storagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-log-')), 'registry.json');
    const registry = new PilotRegistry(storagePath, ENGINEERING_PILOT_RECORDS);
    runPilotCommand('pilots:report', [], registry);

    expect(globalLiveOperationsStore.getEvents()).toContainEqual(expect.objectContaining({
      type: 'PilotCommandExecuted',
      source: 'PilotCli',
      data: expect.objectContaining({ command: 'pilots:report' })
    }));
  });

  it('records a maturity decision only on a verified measured pilot', () => {
    const storagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-decision-')), 'registry.json');
    const registry = new PilotRegistry(storagePath, ENGINEERING_PILOT_RECORDS);
    const pilotId = ENGINEERING_PILOT_RECORDS[0].id;
    const result = runPilotCommand('pilots:decision', [pilotId, 'Revise'], registry);

    expect(result).toMatchObject({ status: 'ok', decision: 'Revise' });
    expect(registry.get(pilotId)?.maturityDecision).toBe('Revise');
  });
});
