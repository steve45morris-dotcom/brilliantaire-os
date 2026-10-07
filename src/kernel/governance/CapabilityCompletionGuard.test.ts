import { describe, it, expect, beforeEach } from 'vitest';
import { CapabilityCompletionGuard, GuardRequest } from './CapabilityCompletionGuard.js';
import { globalSharedMemoryManager } from '../../agent-upgrade/memory.js';
import { globalAgentExecutionTelemetry } from '../live/AgentExecutionTelemetry.js';

describe('CapabilityCompletionGuard Governance Unit Tests', () => {
  let guard: CapabilityCompletionGuard;

  beforeEach(() => {
    guard = new CapabilityCompletionGuard();
    globalAgentExecutionTelemetry.clear();
  });

  it('records authoritative verification state without changing guard semantics', () => {
    const result = guard.evaluateAndRecord({
      objective: 'Add registered live execution projection',
      target: 'src/kernel/live/AgentExecutionTelemetry.ts',
      requiredCapabilities: ['write'],
      availableCapabilities: ['write'],
      executionSurface: 'Local Terminal',
      evidenceProvided: { filesWritten: ['src/kernel/live/AgentExecutionTelemetry.ts'], testsPassed: true, registered: true }
    }, { agentId: 'verifier', taskId: 'hud', taskName: 'Verify HUD' });
    expect(result.status).toBe('VERIFIED_COMPLETE');
    expect(globalAgentExecutionTelemetry.getStates()[0]).toMatchObject({
      status: 'completed',
      completionGuard: { status: 'VERIFIED_COMPLETE', verified: true }
    });
  });

  it('CASE 1: Read-only repository connector + "update globally" -> BLOCKED_CAPABILITY', () => {
    const request: GuardRequest = {
      objective: 'Please update the core layout globally',
      target: 'src/kernel/layout.ts',
      requiredCapabilities: ['write', 'commit'],
      availableCapabilities: ['read'], // Read-only
      executionSurface: 'Read-only Repository Connector'
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('BLOCKED_CAPABILITY');
    expect(result.capabilityGap).toBe(true);
    expect(result.blockedCapability).toBe('write');
    expect(result.notification).toContain('RED FLAG:');
    expect(result.notification).toContain('missing execution capability');
    expect(result.handoff).toBeDefined();
    expect(result.handoff?.target).toBe('src/kernel/layout.ts');
  });

  it('CASE 2: Specification saved outside canonical runtime directory -> STAGED', () => {
    const request: GuardRequest = {
      objective: 'Update core settings spec',
      target: 'scratch/proposed_settings.json',
      requiredCapabilities: ['write'],
      availableCapabilities: ['write'],
      executionSurface: 'Local Terminal',
      evidenceProvided: {
        filesWritten: ['scratch/proposed_settings.json'],
        testsPassed: true,
        registered: true
      }
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('STAGED');
    expect(result.evidenceVerified).toBe(false);
  });

  it('CASE 3: Canonical repo file changed but tests not run -> IMPLEMENTED_UNVERIFIED', () => {
    const request: GuardRequest = {
      objective: 'Update the main command dispatcher file',
      target: 'src/kernel/dispatcher/CommandDispatcher.ts',
      requiredCapabilities: ['write'],
      availableCapabilities: ['write'],
      executionSurface: 'Local Terminal',
      evidenceProvided: {
        filesWritten: ['src/kernel/dispatcher/CommandDispatcher.ts'],
        testsPassed: false, // Not run or failed
        registered: true
      }
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('IMPLEMENTED_UNVERIFIED');
    expect(result.evidenceVerified).toBe(false);
  });

  it('CASE 4: Canonical repo changed, tests pass, registration verified -> VERIFIED_COMPLETE', () => {
    const request: GuardRequest = {
      objective: 'Update key config module',
      target: 'src/kernel/configuration/ConfigService.ts',
      requiredCapabilities: ['write'],
      availableCapabilities: ['write'],
      executionSurface: 'Local Terminal',
      evidenceProvided: {
        filesWritten: ['src/kernel/configuration/ConfigService.ts'],
        testsPassed: true,
        registered: true
      }
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('VERIFIED_COMPLETE');
    expect(result.evidenceVerified).toBe(true);
  });

  it('CASE 5: "Remember this globally" without authoritative memory write/readback -> BLOCKED_CAPABILITY or STAGED', () => {
    const request: GuardRequest = {
      objective: 'Remember this globally in our database',
      target: 'memory/outcomes.json',
      requiredCapabilities: ['write'],
      availableCapabilities: ['write'],
      executionSurface: 'Local Runtime',
      evidenceProvided: {
        filesWritten: ['memory/outcomes.json'],
        testsPassed: true,
        registered: true,
        globalReadbackVerified: false // Failed or missing readback
      }
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('BLOCKED_CAPABILITY');
    expect(result.capabilityGap).toBe(true);
    expect(result.notification).toContain('global memory readback verification failed');
  });

  it('CASE 6: Runtime skill file exists but registry/discovery does not load it -> IMPLEMENTED_UNVERIFIED', () => {
    const request: GuardRequest = {
      objective: 'Install new modular skill helper',
      target: 'skills/verification/capability-completion-guard/SKILL.md',
      requiredCapabilities: ['write'],
      availableCapabilities: ['write'],
      executionSurface: 'Local Terminal',
      evidenceProvided: {
        filesWritten: ['skills/verification/capability-completion-guard/SKILL.md'],
        testsPassed: true,
        registered: false // Discovery/registry registry.json not updated
      }
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('IMPLEMENTED_UNVERIFIED');
  });

  it('CASE 7: Global rule reaches only some consumers -> PARTIAL_PROPAGATION', () => {
    const request: GuardRequest = {
      objective: 'globally update routing rules from now on',
      target: 'src/integrations/core/ModelRouter.ts',
      requiredCapabilities: ['write'],
      availableCapabilities: ['write'],
      executionSurface: 'Local Runtime',
      evidenceProvided: {
        filesWritten: ['src/integrations/core/ModelRouter.ts'],
        testsPassed: true,
        registered: true,
        propagationTargetCount: 5,
        propagationVerifiedCount: 3 // Only 3/5 verified
      }
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('PARTIAL_PROPAGATION');
    expect(result.propagationGaps).toBeDefined();
    expect(result.propagationGaps?.[0]).toContain('3 out of 5');
  });

  it('CASE 8: Missing permission is discovered -> Proactive user notification', () => {
    const request: GuardRequest = {
      objective: 'Install a persistent service globally',
      target: 'system/daemon.service',
      requiredCapabilities: ['write', 'deploy'],
      availableCapabilities: ['write'], // Missing deploy
      executionSurface: 'User Terminal Connector'
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('BLOCKED_CAPABILITY');
    expect(result.notification).toBeDefined();
    expect(result.notification).toContain('RED FLAG:');
    expect(result.notification).toContain('Required next action:');
  });

  it('CASE 9: Icyflamze incident regression case', () => {
    const request: GuardRequest = {
      objective: 'Globally update the Icyflamze lyric-generation architecture using a canonical freestyle case study.',
      target: 'src/workspaces/icyflamze/LyricGeneration.ts',
      requiredCapabilities: ['write', 'commit', 'push'],
      availableCapabilities: ['read'], // Can inspect repo but has no write or push capability
      executionSurface: 'Read-Only Assistant Workspace'
    };

    const result = guard.evaluate(request);
    expect(result.status).toBe('BLOCKED_CAPABILITY');
    expect(result.capabilityGap).toBe(true);
    expect(result.blockedCapability).toBe('write');
    expect(result.notification).toContain('RED FLAG:');
    expect(result.handoff).toBeDefined();
    expect(result.handoff?.mutation).toContain('Authoritative update');
  });
});
