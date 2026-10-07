import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  PUBLIC_DASHBOARD_TOP_LEVEL_KEYS,
  projectPublicDashboardData,
  validatePublicDashboardData,
  writePublicDashboardArtifact,
} from './PublicDashboardProjection.js';

const execution = {
  agentId: 'agent-1',
  agentName: 'Builder',
  missionId: 'mission-1',
  missionName: 'Public mission',
  taskId: 'task-1',
  taskName: 'Validate export',
  skill: 'completion-verifier',
  tool: 'vitest',
  status: 'completed' as const,
  updatedAt: '2026-08-17T12:00:00.000Z',
  completionGuard: { status: 'VERIFIED', verified: true },
  composition: { contractId: 'contract-1', status: 'step_started', activeStep: 'step-1', queuedSteps: ['step-1', 'step-2'] },
};

function internalTelemetry() {
  return {
    currentPhase: 'Operational',
    activeProjects: ['Public project', 'Private project'],
    voiceSummary: { accepted: 2, pending: 1, rejected: 3, approvedConfirmations: 4, deniedConfirmations: 5 },
    governance: { score: 98, issuesCount: 1, issues: [{ details: 'private governance internals' }] },
    agentExecutions: [execution],
    sharedMemory: { privateMessage: 'raw memory content' },
    backgroundQueue: [{ payload: { token: 'queue-secret' } }],
    workspaces: [{ path: '/Users/private/workspace' }],
    skillsRegistry: { privateSkill: { prompt: 'private prompt' } },
    sessions: [{ rawUserMessage: 'private message' }],
    tasks: [{ internalTask: true }],
    events: [{ authorization: 'Bearer private' }],
    modelInformation: { reasoning: 'hidden reasoning' },
    environment: { DATABASE_URL: 'postgres://user:password@localhost/db' },
    futureInternalProperty: 'must never become public',
  };
}

describe('public dashboard projection', () => {
  it('exports only approved public fields and preserves the HUD contract', () => {
    const projected = projectPublicDashboardData(internalTelemetry(), '2026-08-17T12:00:00.000Z');

    expect(Object.keys(projected)).toEqual(PUBLIC_DASHBOARD_TOP_LEVEL_KEYS);
    expect(projected.systemSummary).toEqual({ currentPhase: 'Operational', activeProjectCount: 2 });
    expect(projected.voiceSummary).toEqual({ accepted: 2, pending: 1, rejected: 3, approvedConfirmations: 4, deniedConfirmations: 5 });
    expect(projected.governanceSummary).toEqual({ score: 98, issuesCount: 1 });
    expect(projected.liveOperations.data.agentExecutions).toEqual([execution]);
    expect(validatePublicDashboardData(projected)).toEqual(projected);
  });

  it('does not expose memory, queues, governance internals, workspaces, secrets, or future fields', () => {
    const internal = internalTelemetry();
    const serialized = JSON.stringify(projectPublicDashboardData(internal, '2026-08-17T12:00:00.000Z'));

    for (const forbidden of [
      'sharedMemory', 'raw memory content', 'backgroundQueue', 'queue-secret',
      'private governance internals', 'workspaces', '/Users/', 'skillsRegistry',
      'private prompt', 'rawUserMessage', 'hidden reasoning', 'DATABASE_URL',
      'futureInternalProperty', 'must never become public',
    ]) expect(serialized).not.toContain(forbidden);

    expect(internal.sharedMemory.privateMessage).toBe('raw memory content');
    expect(internal.backgroundQueue[0].payload.token).toBe('queue-secret');
  });

  it('redacts secret signatures and filesystem paths inside approved text fields', () => {
    const internal = internalTelemetry();
    internal.currentPhase = 'Bearer abcdefghijkl /Users/private/.env password=hunter2';
    internal.agentExecutions[0] = {
      ...execution,
      taskName: 'Read /home/private/config with token=secret-value',
    };

    const serialized = JSON.stringify(projectPublicDashboardData(internal, '2026-08-17T12:00:00.000Z'));
    expect(serialized).not.toMatch(/Bearer\s+abcdefghijkl|\/Users\/|\/home\/|\.env|hunter2|secret-value/);
    expect(serialized).toContain('[REDACTED]');
  });

  it('fails closed on unexpected public keys and unsafe payloads', () => {
    const valid = projectPublicDashboardData(internalTelemetry(), '2026-08-17T12:00:00.000Z');
    expect(() => validatePublicDashboardData({ ...valid, sharedMemory: {} })).toThrow(/unexpected key/i);
    expect(() => validatePublicDashboardData({ ...valid, exportedAt: 'not-a-date' })).toThrow(/exportedAt/i);
    expect(() => validatePublicDashboardData({ ...valid, systemSummary: { ...valid.systemSummary, secret: 'x' } })).toThrow(/unexpected key/i);
    expect(() => validatePublicDashboardData({ ...valid, liveOperations: { ...valid.liveOperations, data: { agentExecutions: [{ ...execution, unknown: 'x' }] } } })).toThrow(/unexpected key/i);
  });

  it('writes an artifact only after safe-schema validation', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'public-dashboard-'));
    const artifact = path.join(dir, 'dashboard-data.json');
    const valid = projectPublicDashboardData(internalTelemetry(), '2026-08-17T12:00:00.000Z');

    writePublicDashboardArtifact(artifact, valid);
    expect(JSON.parse(fs.readFileSync(artifact, 'utf-8'))).toEqual(valid);
    expect(() => writePublicDashboardArtifact(artifact, { ...valid, backgroundQueue: [] })).toThrow(/unexpected key/i);
    expect(JSON.parse(fs.readFileSync(artifact, 'utf-8'))).toEqual(valid);
  });

  it('excludes shared memory contents', () => {
    expect(JSON.stringify(projectPublicDashboardData(internalTelemetry()))).not.toContain('raw memory content');
  });

  it('excludes raw background queue payloads', () => {
    expect(JSON.stringify(projectPublicDashboardData(internalTelemetry()))).not.toContain('queue-secret');
  });

  it('excludes unrestricted governance internals', () => {
    const projected = projectPublicDashboardData(internalTelemetry());
    expect(projected.governanceSummary).toEqual({ score: 98, issuesCount: 1 });
    expect(JSON.stringify(projected)).not.toContain('private governance internals');
  });

  it('excludes workspace-private metadata', () => {
    expect(JSON.stringify(projectPublicDashboardData(internalTelemetry()))).not.toContain('/Users/private/workspace');
  });

  it('does not propagate a newly added internal property', () => {
    const internal = { ...internalTelemetry(), newlyAddedInternalValue: 'future-private-value' };
    expect(JSON.stringify(projectPublicDashboardData(internal))).not.toContain('future-private-value');
  });

  it('leaves trusted internal telemetry available and unchanged', () => {
    const internal = internalTelemetry();
    const before = structuredClone(internal);
    projectPublicDashboardData(internal);
    expect(internal).toEqual(before);
  });

  it('retains the normalized agentExecutions fields consumed by the verified HUD', () => {
    const state = projectPublicDashboardData(internalTelemetry()).liveOperations.data.agentExecutions[0];
    expect(state).toMatchObject({
      agentId: 'agent-1', agentName: 'Builder', missionId: 'mission-1', taskId: 'task-1',
      skill: 'completion-verifier', tool: 'vitest', status: 'completed',
      completionGuard: { status: 'VERIFIED', verified: true },
      composition: { contractId: 'contract-1', activeStep: 'step-1' },
    });
  });

  it('keeps composition telemetry allowlisted without broadening the public DTO', () => {
    const projected = projectPublicDashboardData(internalTelemetry());
    expect(projected.liveOperations.data.agentExecutions[0].composition).toEqual(execution.composition);
    const unsafe = structuredClone(projected);
    (unsafe.liveOperations.data.agentExecutions[0].composition as Record<string, unknown>).privatePayload = { prompt: 'hidden' };
    expect(() => validatePublicDashboardData(unsafe)).toThrow(/unexpected key/i);
  });
});
