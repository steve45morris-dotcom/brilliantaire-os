import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CapabilityCompletionGuard, type GuardRequest } from '../kernel/governance/CapabilityCompletionGuard.js';
import { Planner } from '../runtime/Planner.js';
import { ProgressiveSkillLoader, type SkillDescriptor } from './ProgressiveSkillLoader.js';
import {
  SkillCompositionExecutor,
  SkillCompositionPlanner,
  type SkillCompositionContract,
  type SkillCompositionEvent,
  type SkillCompositionStep,
  type SkillStepExecutionInput,
} from './SkillCompositionContracts.js';

let root = '';
let events: SkillCompositionEvent[] = [];

const descriptors: SkillDescriptor[] = [
  {
    id: 'researcher', name: 'Researcher', category: 'research', version: '1.0.0', status: 'active',
    summary: 'Collect facts.', capabilities: ['research'], dependencies: [], risk: 'low', permissions: ['network:read'],
    instructionPath: 'researcher/SKILL.md', resourcePaths: [],
  },
  {
    id: 'writer', name: 'Writer', category: 'content', version: '1.0.0', status: 'active',
    summary: 'Write from facts.', capabilities: ['writing'], dependencies: ['researcher'], risk: 'low', permissions: ['content:write'],
    instructionPath: 'writer/SKILL.md', resourcePaths: [],
  },
  {
    id: 'checker', name: 'Checker', category: 'verification', version: '1.0.0', status: 'active',
    summary: 'Check results.', capabilities: ['verification'], dependencies: [], risk: 'high', permissions: ['verify:read'],
    instructionPath: 'checker/SKILL.md', resourcePaths: [],
  },
  {
    id: 'fallback', name: 'Fallback', category: 'operations', version: '1.0.0', status: 'active',
    summary: 'Recover declared failures.', capabilities: ['recovery'], dependencies: [], risk: 'low', permissions: [],
    instructionPath: 'fallback/SKILL.md', resourcePaths: [],
  },
  {
    id: 'retired', name: 'Retired', category: 'legacy', version: '1.0.0', status: 'retired',
    summary: 'Unavailable.', capabilities: ['legacy'], dependencies: [], risk: 'low', permissions: [],
    instructionPath: 'retired/SKILL.md', resourcePaths: [],
  },
];

const outputContracts = {
  research: schema({ facts: 'array' }, ['facts']),
  writing: schema({ draft: 'string' }, ['draft']),
  verification: schema({ valid: 'boolean' }, ['valid']),
  recovery: schema({ recovered: 'boolean' }, ['recovered']),
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-composition-'));
  events = [];
  for (const descriptor of descriptors) {
    fs.mkdirSync(path.join(root, descriptor.id), { recursive: true });
    fs.writeFileSync(path.join(root, descriptor.id, 'SKILL.md'), `# ${descriptor.name}\n${descriptor.summary}`);
  }
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function makeLoader(source = descriptors) {
  return new ProgressiveSkillLoader({ approvedRoots: [root], descriptors: source, emit: () => undefined });
}

function makePlanner(source = descriptors, limits = {}) {
  return new SkillCompositionPlanner(makeLoader(source), {
    now: () => '2026-08-18T12:00:00.000Z', maxSteps: 8, maxDepth: 4, ...limits,
  });
}

function planFor(requiredCapabilities: string[], source = descriptors) {
  return new Planner().generateSkillComposition(makePlanner(source), {
    contractId: 'contract-1', missionId: 'mission-1', mission: 'Compose a governed result', requiredCapabilities,
    failurePolicy: 'fail-fast', completionPolicy: 'guard-authoritative',
    availablePermissions: ['network:read', 'content:write', 'verify:read'], maxRisk: 'high',
    contractsByCapability: Object.fromEntries(Object.entries(outputContracts).map(([capability, outputContract]) => [capability, {
      outputContract,
      inputContract: capability === 'writing' ? schema({ facts: 'array' }, ['facts']) : undefined,
    }])),
  });
}

function step(
  stepId: string,
  skillId: string,
  capability: string,
  options: Partial<SkillCompositionStep> = {},
): SkillCompositionStep {
  return {
    stepId, skillId, capability, dependsOn: [], permissions: [], risk: 'low',
    outputContract: outputContracts[capability as keyof typeof outputContracts] || schema({ result: 'string' }, ['result']),
    ...options,
  };
}

function contract(steps: SkillCompositionStep[], failurePolicy: SkillCompositionContract['failurePolicy'] = 'fail-fast'): SkillCompositionContract {
  return {
    contractId: 'manual-contract', missionId: 'mission-1', requiredCapabilities: [...new Set(steps.map((item) => item.capability))],
    steps, failurePolicy, completionPolicy: 'guard-authoritative', createdAt: '2026-08-18T12:00:00.000Z',
  };
}

function executor(
  composition: SkillCompositionContract,
  executeStep: (input: SkillStepExecutionInput) => Promise<Record<string, unknown>>,
  source = descriptors,
  guard: CapabilityCompletionGuard = new CapabilityCompletionGuard(),
) {
  const loader = makeLoader(source);
  return {
    loader,
    instance: new SkillCompositionExecutor({
      loader, planner: makePlanner(source), guard, executeStep,
      emit: (event) => events.push(event), now: () => '2026-08-18T12:00:00.000Z',
    }),
    request: {
      mission: 'Compose a governed result', intent: 'compose', availablePermissions: ['network:read', 'content:write', 'verify:read'],
      maxRisk: 'high' as const, approvedStepIds: composition.steps.filter((item) => item.risk === 'high').map((item) => item.stepId),
    },
  };
}

describe('Skill Composition Contracts', () => {
  it('executes a single-skill composition', async () => {
    const composition = planFor(['research']);
    const run = executor(composition, async () => ({ facts: ['verified'] }));
    const result = await run.instance.execute(composition, run.request);
    expect(result.executedSteps).toEqual([composition.steps[0].stepId]);
  });

  it('executes two dependent skills in DAG order', async () => {
    const composition = planFor(['writing']);
    const order: string[] = [];
    const run = executor(composition, async ({ step: current }) => {
      order.push(current.skillId);
      return current.skillId === 'researcher' ? { facts: ['one'] } : { draft: 'done' };
    });
    await run.instance.execute(composition, run.request);
    expect(order).toEqual(['researcher', 'writer']);
  });

  it('allows independent skills to coexist', async () => {
    const composition = contract([step('research', 'researcher', 'research', { permissions: ['network:read'] }), step('recovery', 'fallback', 'recovery')]);
    makePlanner().validateContract(composition, { availablePermissions: ['network:read'], maxRisk: 'low' });
    const run = executor(composition, async ({ step: current }) => current.capability === 'research' ? { facts: [] } : { recovered: true });
    expect((await run.instance.execute(composition, run.request)).executedSteps).toHaveLength(2);
  });

  it('rejects circular dependencies', () => {
    const composition = contract([
      step('a', 'researcher', 'research', { dependsOn: ['b'], permissions: ['network:read'] }),
      step('b', 'fallback', 'recovery', { dependsOn: ['a'] }),
    ]);
    expect(() => makePlanner().validateContract(composition, { availablePermissions: ['network:read'], maxRisk: 'low' })).toThrow(/cycle/i);
  });

  it('rejects executable values in composition contract data', () => {
    const composition = contract([step('research', 'researcher', 'research', { permissions: ['network:read'] })]);
    (composition.steps[0] as SkillCompositionStep & { execute?: () => void }).execute = () => undefined;
    expect(() => makePlanner().validateContract(composition, { availablePermissions: ['network:read'], maxRisk: 'low' })).toThrow(/executable/i);
  });

  it('rejects a missing required capability', () => {
    expect(() => planFor(['nonexistent'])).toThrow(/missing required capability/i);
  });

  it('rejects retired skills', () => {
    expect(() => makePlanner().validateContract(contract([step('legacy', 'retired', 'legacy')]), { availablePermissions: [], maxRisk: 'low' })).toThrow(/retired/i);
  });

  it('prevents duplicate equivalent steps', () => {
    const composition = contract([step('one', 'researcher', 'research', { permissions: ['network:read'] }), step('two', 'researcher', 'research', { permissions: ['network:read'] })]);
    expect(() => makePlanner().validateContract(composition, { availablePermissions: ['network:read'], maxRisk: 'low' })).toThrow(/duplicate equivalent/i);
  });

  it('never runs a downstream skill before its dependencies', async () => {
    const composition = planFor(['writing']);
    let researchFinished = false;
    const run = executor(composition, async ({ step: current }) => {
      if (current.skillId === 'researcher') { researchFinished = true; return { facts: [] }; }
      expect(researchFinished).toBe(true);
      return { draft: 'ordered' };
    });
    await run.instance.execute(composition, run.request);
  });

  it('accepts an output matching its declared contract', async () => {
    const composition = planFor(['research']);
    const run = executor(composition, async () => ({ facts: ['one'] }));
    expect((await run.instance.execute(composition, run.request)).validatedOutputs[composition.steps[0].stepId]).toEqual({ facts: ['one'] });
  });

  it('fails closed on unexpected output fields', async () => {
    const composition = planFor(['research']);
    const run = executor(composition, async () => ({ facts: [], privateState: 'leak' }));
    const result = await run.instance.execute(composition, run.request);
    expect(result.failedSteps).toEqual([composition.steps[0].stepId]);
    expect(JSON.stringify(result.validatedOutputs)).not.toContain('privateState');
  });

  it('rejects an invalid handoff target', () => {
    const composition = contract([
      step('source', 'researcher', 'research', { permissions: ['network:read'], handoff: { allowedTargets: ['someone-else'] } }),
      step('target', 'writer', 'writing', { dependsOn: ['source'], permissions: ['content:write'] }),
    ]);
    expect(() => makePlanner().validateContract(composition, { availablePermissions: ['network:read', 'content:write'], maxRisk: 'low' })).toThrow(/handoff target/i);
  });

  it('assigns handoff provenance and ignores payload identity claims', async () => {
    const composition = contract([
      step('source', 'researcher', 'research', { permissions: ['network:read'], outputContract: schema({ facts: 'array', sourceSkill: 'string' }, ['facts', 'sourceSkill']), handoff: { allowedTargets: ['target'] } }),
      step('target', 'writer', 'writing', { dependsOn: ['source'], permissions: ['content:write'], inputContract: schema({ facts: 'array', sourceSkill: 'string' }, ['facts', 'sourceSkill']) }),
    ]);
    const run = executor(composition, async ({ step: current }) => current.stepId === 'source' ? { facts: [], sourceSkill: 'forged' } : { draft: 'done' });
    const result = await run.instance.execute(composition, run.request);
    expect(result.handoffs[0]).toMatchObject({ sourceSkill: 'researcher', targetSkill: 'writer', sourceStep: 'source', targetStep: 'target' });
  });

  it('rejects permission escalation', () => {
    const composition = planFor(['writing']);
    expect(() => makePlanner().validateContract(composition, { availablePermissions: ['network:read'], maxRisk: 'low' })).toThrow(/permission/i);
  });

  it('blocks a high-risk step without existing approval evidence', async () => {
    const composition = planFor(['verification']);
    let called = false;
    const run = executor(composition, async () => { called = true; return { valid: true }; });
    const result = await run.instance.execute(composition, { ...run.request, approvedStepIds: [] });
    expect(called).toBe(false);
    expect(result.blockedSteps).toEqual([composition.steps[0].stepId]);
  });

  it('fail-fast stops dependent execution', async () => {
    const composition = planFor(['writing']);
    const called: string[] = [];
    const run = executor(composition, async ({ step: current }) => { called.push(current.stepId); throw new Error('stop'); });
    const result = await run.instance.execute(composition, run.request);
    expect(called).toHaveLength(1);
    expect(result.blockedSteps).toContain(composition.steps[1].stepId);
  });

  it('continue-independent preserves independent branches', async () => {
    const composition = contract([step('fails', 'researcher', 'research', { permissions: ['network:read'] }), step('independent', 'fallback', 'recovery')], 'continue-independent');
    const run = executor(composition, async ({ step: current }) => {
      if (current.stepId === 'fails') throw new Error('branch failure');
      return { recovered: true };
    });
    const result = await run.instance.execute(composition, run.request);
    expect(result.executedSteps).toContain('independent');
  });

  it('runs a fallback only when explicitly declared', async () => {
    const composition = contract([
      step('primary', 'researcher', 'research', { permissions: ['network:read'], handoff: { allowedTargets: ['fallback-step'], fallbackStepId: 'fallback-step', fallbackCapability: 'recovery' } }),
      step('fallback-step', 'fallback', 'recovery', { fallbackFor: 'primary', inputContract: schema({ failure: 'string' }, ['failure']) }),
    ], 'handoff-on-failure');
    const run = executor(composition, async ({ step: current }) => {
      if (current.stepId === 'primary') throw new Error('use declared fallback');
      expect(current.inputContract).toBeDefined();
      return { recovered: true };
    });
    expect((await run.instance.execute(composition, run.request)).executedSteps).toContain('fallback-step');
    expect(() => makePlanner().validateContract(contract([step('orphan', 'fallback', 'recovery', { fallbackFor: 'missing' })], 'handoff-on-failure'), { availablePermissions: [], maxRisk: 'low' })).toThrow(/fallback/i);
  });

  it('keeps ProgressiveSkillLoader activation step-scoped', async () => {
    const composition = planFor(['writing']);
    const run = executor(composition, async ({ step: current }) => {
      const active = composition.steps.filter((item) => run.loader.isActive(item.skillId, `composition:${composition.contractId}:${item.stepId}`));
      expect(active.map((item) => item.skillId)).toEqual([current.skillId]);
      return current.capability === 'research' ? { facts: [] } : { draft: 'done' };
    });
    await run.instance.execute(composition, run.request);
    expect(composition.steps.every((item) => !run.loader.isActive(item.skillId, `composition:${composition.contractId}:${item.stepId}`))).toBe(true);
  });

  it('does not pre-load unrelated composition skills', async () => {
    const composition = planFor(['writing']);
    const run = executor(composition, async ({ step: current }) => current.capability === 'research' ? { facts: [] } : { draft: 'done' });
    await run.instance.execute(composition, run.request);
    expect(run.loader.getAccounting().skillsActivated).toBe(2);
    expect(run.loader.getAccounting().instructionResourcesLoaded).toBe(2);
  });

  it('leaves mission completion authoritative to CapabilityCompletionGuard', async () => {
    const composition = planFor(['research']);
    class CapturingGuard extends CapabilityCompletionGuard {
      public request?: GuardRequest;
      public override evaluate(request: GuardRequest) { this.request = request; return super.evaluate(request); }
    }
    const guard = new CapturingGuard();
    const run = executor(composition, async () => ({ facts: [] }), descriptors, guard);
    const result = await run.instance.execute(composition, run.request);
    expect(result.guardResult.status).toBe('PLAN_ONLY');
    expect(result.missionComplete).toBe(false);
    expect(guard.request?.evidenceProvided?.composition).toMatchObject({
      plannedRequiredCapabilities: ['research'], executedSteps: [composition.steps[0].stepId],
      failedSteps: [], blockedSteps: [], unresolvedRequiredCapabilities: [],
    });
  });

  it('emits composition lifecycle telemetry for the existing HUD pipeline', async () => {
    const composition = planFor(['writing']);
    const run = executor(composition, async ({ step: current }) => current.capability === 'research' ? { facts: [] } : { draft: 'done' });
    await run.instance.execute(composition, run.request);
    expect(events.map((event) => event.type)).toEqual(expect.arrayContaining([
      'composition.validated', 'composition.started', 'composition.step.ready', 'composition.step.started',
      'composition.step.completed', 'composition.handoff.created', 'composition.handoff.completed', 'composition.completed',
    ]));
  });

  it('enforces maximum DAG depth', () => {
    const composition = contract([
      step('a', 'researcher', 'research', { permissions: ['network:read'] }),
      step('b', 'fallback', 'recovery', { dependsOn: ['a'], handoff: { allowedTargets: ['c'] } }),
      step('c', 'checker', 'verification', { dependsOn: ['b'], permissions: ['verify:read'], risk: 'high' }),
    ]);
    expect(() => makePlanner(descriptors, { maxDepth: 1 }).validateContract(composition, { availablePermissions: ['network:read', 'verify:read'], maxRisk: 'high' })).toThrow(/depth/i);
  });

  it('enforces maximum step count', () => {
    const composition = contract([step('a', 'researcher', 'research'), step('b', 'fallback', 'recovery')]);
    expect(() => makePlanner(descriptors, { maxSteps: 1 }).validateContract(composition, { availablePermissions: ['network:read'], maxRisk: 'low' })).toThrow(/step count/i);
  });

  it('prevents shared mutable-state leakage', async () => {
    const composition = contract([
      step('source', 'researcher', 'research', { permissions: ['network:read'], handoff: { allowedTargets: ['target'] } }),
      step('target', 'writer', 'writing', { dependsOn: ['source'], permissions: ['content:write'], inputContract: schema({ facts: 'array' }, ['facts']) }),
    ]);
    const sourceOutput = { facts: ['original'] };
    const run = executor(composition, async ({ step: current, input }) => {
      if (current.stepId === 'source') return sourceOutput;
      expect(Object.isFrozen(input)).toBe(true);
      sourceOutput.facts.push('mutated');
      expect(input).toEqual({ facts: ['original'] });
      return { draft: 'safe' };
    });
    const result = await run.instance.execute(composition, run.request);
    expect(result.handoffs[0].payload).toEqual({ facts: ['original'] });
  });

  it('does not let a new registry skill mutate an already validated plan', () => {
    const original = planFor(['research']);
    const added = { ...descriptors[0], id: 'aaa-new-researcher', name: 'New Researcher', instructionPath: 'aaa-new-researcher/SKILL.md' };
    fs.mkdirSync(path.join(root, added.id));
    fs.writeFileSync(path.join(root, added.id, 'SKILL.md'), '# New');
    const replanner = makePlanner([...descriptors, added]);
    replanner.validateContract(original, { availablePermissions: ['network:read'], maxRisk: 'low' });
    expect(original.steps.map((item) => item.skillId)).toEqual(['researcher']);
    expect(replanner.plan({
      contractId: 'replanned', missionId: 'mission-1', mission: 'research', requiredCapabilities: ['research'],
      failurePolicy: 'fail-fast', completionPolicy: 'guard-authoritative', availablePermissions: ['network:read'], maxRisk: 'low',
      contractsByCapability: { research: { outputContract: outputContracts.research } },
    }).steps[0].skillId).toBe('aaa-new-researcher');
  });
});

function schema(properties: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'>, required: string[]) {
  return { properties, required, additionalProperties: 'reject' as const };
}
