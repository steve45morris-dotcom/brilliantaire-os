import { beforeEach, describe, expect, it } from 'vitest';
import {
  AgentExecutionTelemetry,
  EXECUTION_TELEMETRY_UNAVAILABLE,
  sanitizeExecutionTelemetry
} from './AgentExecutionTelemetry.js';

describe('AgentExecutionTelemetry', () => {
  let telemetry: AgentExecutionTelemetry;

  beforeEach(() => {
    telemetry = new AgentExecutionTelemetry(() => '2026-08-17T12:00:00.000Z');
  });

  const emit = (type: Parameters<AgentExecutionTelemetry['record']>[0], data: Record<string, unknown> = {}) =>
    telemetry.record(type, { agentId: 'agent-1', agentName: 'Astra', missionId: 'mission-1', taskId: 'task-1', ...data });

  it('tracks an agent start', () => {
    emit('agent.started');
    expect(telemetry.getStates()[0]).toMatchObject({ agentId: 'agent-1', status: 'running' });
  });

  it('tracks skill activation', () => {
    emit('skill.activated', { skill: 'task-observer' });
    expect(telemetry.getStates()[0].skill).toBe('task-observer');
  });

  it('tracks tool execution', () => {
    emit('tool.started', { tool: 'codex-adapter' });
    expect(telemetry.getStates()[0].tool).toBe('codex-adapter');
  });

  it('tracks deterministic task progress', () => {
    emit('task.progress', { progress: 42 });
    expect(telemetry.getStates()[0].progress).toBe(42);
  });

  it('tracks an explicit blocked reason', () => {
    emit('task.blocked', { blockedReason: 'Dependency unavailable' });
    expect(telemetry.getStates()[0]).toMatchObject({ status: 'blocked', blockedReason: 'Dependency unavailable' });
  });

  it('tracks approval requests', () => {
    emit('approval.requested');
    expect(telemetry.getStates()[0]).toMatchObject({ status: 'waiting', waitingForApproval: true });
  });

  it('tracks completion verification start', () => {
    emit('capability.verification.started', { completionGuardStatus: 'IMPLEMENTED_UNVERIFIED' });
    expect(telemetry.getStates()[0]).toMatchObject({ status: 'verifying', completionGuard: { verified: false } });
  });

  it('tracks a passing CapabilityCompletionGuard result', () => {
    emit('capability.verification.completed', { completionGuardStatus: 'VERIFIED_COMPLETE', verified: true });
    expect(telemetry.getStates()[0].completionGuard).toEqual({ status: 'VERIFIED_COMPLETE', verified: true });
  });

  it('tracks completion', () => {
    emit('agent.completed');
    expect(telemetry.getStates()[0]).toMatchObject({ status: 'completed', progress: 100 });
  });

  it('tracks failure diagnostics', () => {
    emit('agent.failed', { error: 'Adapter exited 1' });
    expect(telemetry.getStates()[0]).toMatchObject({ status: 'failed', error: 'Adapter exited 1' });
  });

  it('sanitizes sensitive keys and embedded credentials', () => {
    const result = sanitizeExecutionTelemetry({ apiKey: 'secret', nested: { password: 'hidden' }, message: 'token=abc123 Bearer standalone-secret' });
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(JSON.stringify(result)).not.toContain('hidden');
    expect(JSON.stringify(result)).not.toContain('abc123');
    expect(JSON.stringify(result)).not.toContain('standalone-secret');
  });

  it('bounds cyclic telemetry payloads', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(sanitizeExecutionTelemetry(cyclic)).toEqual({ self: '[CIRCULAR]' });
  });

  it('does not fabricate unavailable progress or context usage', () => {
    emit('task.started');
    const state = telemetry.getStates()[0];
    expect(state.progress).toBeUndefined();
    expect(state.contextUsage).toBeUndefined();
    expect(EXECUTION_TELEMETRY_UNAVAILABLE).toBe('Unavailable');
  });

  it('isolates concurrent agents', () => {
    emit('task.progress', { progress: 25 });
    telemetry.record('task.progress', { agentId: 'agent-2', agentName: 'Warden', taskId: 'task-2', progress: 75 });
    expect(telemetry.getStates().map((state) => [state.agentId, state.progress])).toEqual([
      ['agent-1', 25],
      ['agent-2', 75]
    ]);
  });

  it('preserves mission and task lineage through handoffs', () => {
    emit('handoff.created', { handoffTarget: 'agent-2', handoffStatus: 'created' });
    const state = telemetry.getStates()[0];
    expect(state).toMatchObject({ missionId: 'mission-1', taskId: 'task-1', handoff: { target: 'agent-2', status: 'created' } });
  });

  it('ignores unsupported or malformed external events', () => {
    telemetry.ingest({
      id: 'bad', type: 'task.unknown', timestamp: 'not-a-date', source: 'external', actor: 'unknown',
      severity: 'info', message: 'ignored', data: {}, attention: false
    });
    expect(telemetry.getStates()).toEqual([]);
  });

  it('tracks the progressive skill loading boundary explicitly', () => {
    emit('skill.discovered');
    emit('skill.selected', { skill: 'task-observer' });
    emit('skill.activated', { skill: 'task-observer' });
    emit('skill.instructions.loaded', { skill: 'task-observer', resourcesLoaded: ['SKILL.md'] });
    emit('skill.resources.loaded', { skill: 'task-observer', resourcesLoaded: ['reference.md'] });
    expect(telemetry.getStates()[0].skillLifecycle).toEqual({
      matched: 'task-observer', resourcesLoaded: ['reference.md'], status: 'loaded'
    });

    emit('skill.released', { skill: 'task-observer' });
    expect(telemetry.getStates()[0].skillLifecycle?.status).toBe('released');
  });

  it('projects composition lifecycle state for the existing HUD', () => {
    emit('composition.planned', { compositionId: 'contract-1', queuedSteps: ['step-1', 'step-2'] });
    emit('composition.step.started', { compositionId: 'contract-1', compositionStep: 'step-1' });
    emit('composition.blocked', { compositionId: 'contract-1', compositionStep: 'step-2', blockedDependency: 'step-1' });
    expect(telemetry.getStates()[0]).toMatchObject({
      status: 'blocked',
      composition: {
        contractId: 'contract-1', status: 'blocked', activeStep: 'step-1',
        queuedSteps: ['step-1', 'step-2'], blockedDependency: 'step-1',
      },
    });
  });

  it('projects the authoritative guard result when a composition finishes', () => {
    emit('composition.completed', {
      compositionId: 'contract-1',
      completionGuardStatus: 'VERIFIED_COMPLETE',
      verified: true,
    });
    expect(telemetry.getStates()[0]).toMatchObject({
      status: 'completed',
      completionGuard: { status: 'VERIFIED_COMPLETE', verified: true },
      composition: { contractId: 'contract-1', status: 'completed' },
    });
  });
});
