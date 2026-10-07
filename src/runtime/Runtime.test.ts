import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  KernelRuntime,
  globalKernelRuntime,
  type RuntimeExecutionResult,
} from './Runtime.js';
import {
  SkillCompositionPlanner,
  type SkillCompositionContract,
  type SkillCompositionStep,
  type SkillStepExecutionInput,
} from '../agent-upgrade/SkillCompositionContracts.js';
import { CapabilityCompletionGuard } from '../kernel/governance/CapabilityCompletionGuard.js';
import { ProgressiveSkillLoader, type SkillDescriptor } from '../agent-upgrade/ProgressiveSkillLoader.js';
import { globalApprovalEngine } from './ApprovalEngine.js';
import { globalModelRoutingPolicy } from '../integrations/core/ModelRoutingPolicy.js';

let tmpRoot = '';

const testDescriptors: SkillDescriptor[] = [
  {
    id: 'researcher',
    name: 'Researcher',
    category: 'research',
    version: '1.0.0',
    status: 'active',
    summary: 'Research capability',
    capabilities: ['research'],
    dependencies: [],
    risk: 'low',
    permissions: ['network:read'],
    instructionPath: 'researcher/SKILL.md',
    resourcePaths: [],
  },
  {
    id: 'writer',
    name: 'Writer',
    category: 'content',
    version: '1.0.0',
    status: 'active',
    summary: 'Content writer',
    capabilities: ['writing'],
    dependencies: ['researcher'],
    risk: 'low',
    permissions: ['content:write'],
    instructionPath: 'writer/SKILL.md',
    resourcePaths: [],
  },
  {
    id: 'verifier',
    name: 'Verifier',
    category: 'verification',
    version: '1.0.0',
    status: 'active',
    summary: 'Validation and checks',
    capabilities: ['verification'],
    dependencies: [],
    risk: 'low',
    permissions: ['verify:read'],
    instructionPath: 'verifier/SKILL.md',
    resourcePaths: [],
  },
  {
    id: 'high-risk-verifier',
    name: 'High Risk Verifier',
    category: 'verification',
    version: '1.0.0',
    status: 'active',
    summary: 'High risk privileged operations',
    capabilities: ['admin-verify'],
    dependencies: [],
    risk: 'high',
    permissions: ['admin:write'],
    instructionPath: 'high-risk-verifier/SKILL.md',
    resourcePaths: [],
  },
];

function createTestCompositionContract(steps: SkillCompositionStep[]): SkillCompositionContract {
  return {
    contractId: `contract_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    missionId: `mission_${Date.now()}`,
    requiredCapabilities: [...new Set(steps.map((s) => s.capability))],
    steps,
    failurePolicy: 'fail-fast',
    completionPolicy: 'guard-authoritative',
    createdAt: new Date().toISOString(),
  };
}

describe('P.J.K. Phase 8B: KernelRuntime Convergence & Governance', () => {
  let loader: ProgressiveSkillLoader;
  let planner: SkillCompositionPlanner;
  let guard: CapabilityCompletionGuard;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-convergence-'));
    for (const desc of testDescriptors) {
      const skillDir = path.join(tmpRoot, desc.id);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `# ${desc.name}\n${desc.summary}`);
    }

    loader = new ProgressiveSkillLoader({
      approvedRoots: [tmpRoot],
      descriptors: testDescriptors,
      emit: () => undefined,
    });
    planner = new SkillCompositionPlanner(loader, {
      now: () => '2026-08-18T12:00:00.000Z',
      maxSteps: 8,
      maxDepth: 4,
    });
    guard = new CapabilityCompletionGuard();
  });

  afterEach(() => {
    if (tmpRoot && fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  // Test A: Single-step command remains functional and completes when verified
  it('Test A: Single-step command remains functional and completes when evidence is verified', async () => {
    const executed: string[] = [];
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async (input: SkillStepExecutionInput) => {
        executed.push(input.step.stepId);
        return { result: 'Single step executed' };
      },
    });

    const step1: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'researcher',
      capability: 'research',
      dependsOn: [],
      permissions: ['network:read'],
      risk: 'low',
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([step1]);
    const result: RuntimeExecutionResult = await runtime.handlePrompt('research intelligence', {
      compositionContract: contract,
      guardEvidence: {
        filesWritten: ['src/research/output.ts'],
        testsPassed: true,
        registered: true,
      },
    });

    expect(executed).toEqual(['step_1']);
    expect(result.status).toBe('completed');
    expect(result.message).toContain('Plan completed successfully');
    expect(result.guardResult?.status).toBe('VERIFIED_COMPLETE');
    expect(result.guardResult?.evidenceVerified).toBe(true);
  });

  // Test B: Multi-step plan executes through existing composition engine
  it('Test B: Multi-step plan executes sequentially through composition engine', async () => {
    const executed: string[] = [];
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async (input: SkillStepExecutionInput) => {
        executed.push(input.step.stepId);
        return { result: `Output of ${input.step.stepId}`, draft: 'content-ready' };
      },
    });

    const step1: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'researcher',
      capability: 'research',
      dependsOn: [],
      permissions: ['network:read'],
      risk: 'low',
      outputContract: {
        properties: { result: 'string', draft: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
      handoff: { allowedTargets: ['step_2'] },
    };

    const step2: SkillCompositionStep = {
      stepId: 'step_2',
      skillId: 'writer',
      capability: 'writing',
      dependsOn: ['step_1'],
      permissions: ['content:write'],
      risk: 'low',
      inputContract: {
        properties: { result: 'string', draft: 'string' },
        required: [],
        additionalProperties: 'strip',
      },
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([step1, step2]);
    const result = await runtime.handlePrompt('generate research article', {
      compositionContract: contract,
      guardEvidence: {
        filesWritten: ['src/articles/ai-trends.ts'],
        testsPassed: true,
        registered: true,
      },
    });

    expect(executed).toEqual(['step_1', 'step_2']);
    expect(result.compositionResult?.executedSteps).toEqual(['step_1', 'step_2']);
    expect(result.status).toBe('completed');
  });

  // Test C: Dependencies execute in correct order with handoff payloads
  it('Test C: Dependencies execute in DAG order and downstream receives upstream handoff', async () => {
    const receivedInputs: Array<Record<string, unknown>> = [];
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async (input: SkillStepExecutionInput) => {
        receivedInputs.push(input.input ? { ...input.input } : {});
        return { result: `Success from ${input.step.stepId}` };
      },
    });

    const step1: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'researcher',
      capability: 'research',
      dependsOn: [],
      permissions: ['network:read'],
      risk: 'low',
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
      handoff: { allowedTargets: ['step_2'] },
    };

    const step2: SkillCompositionStep = {
      stepId: 'step_2',
      skillId: 'writer',
      capability: 'writing',
      dependsOn: ['step_1'],
      permissions: ['content:write'],
      risk: 'low',
      inputContract: {
        properties: { result: 'string' },
        required: [],
        additionalProperties: 'strip',
      },
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([step1, step2]);
    await runtime.handlePrompt('compose workflow', {
      compositionContract: contract,
    });

    // First step has empty input; second step receives handoff payload from step 1
    expect(receivedInputs[0]).toEqual({});
    expect(receivedInputs[1]).toEqual({ result: 'Success from step_1' });
  });

  // Test D: False-completion test: Successful underlying dispatch without sufficient evidence does NOT produce verified completion
  it('Test D: Successful underlying dispatch without verified evidence reports unverified, NOT completed', async () => {
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async () => {
        // Underlying execution succeeds
        return { result: 'All tools executed perfectly' };
      },
    });

    const step1: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'researcher',
      capability: 'research',
      dependsOn: [],
      permissions: ['network:read'],
      risk: 'low',
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
      handoff: { allowedTargets: ['step_2'] },
    };

    const step2: SkillCompositionStep = {
      stepId: 'step_2',
      skillId: 'writer',
      capability: 'writing',
      dependsOn: ['step_1'],
      permissions: ['content:write'],
      risk: 'low',
      inputContract: {
        properties: { result: 'string' },
        required: [],
        additionalProperties: 'strip',
      },
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([step1, step2]);

    // Omit guardEvidence entirely
    const result = await runtime.handlePrompt('multi step prompt without evidence', {
      compositionContract: contract,
    });

    expect(result.status).toBe('failed');
    expect(result.status).not.toBe('completed');
    expect(result.message).toContain('Plan execution unverified');
    expect(result.message).not.toContain('Plan completed successfully');
    expect(result.guardResult?.status).toBe('PLAN_ONLY');
    expect(result.guardResult?.evidenceVerified).toBe(false);
  });

  // Test E: All required steps plus evidence produce verified completion
  it('Test E: Multi-step plan with all steps executed and verified evidence produces verified completion', async () => {
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async (input: SkillStepExecutionInput) => {
        return { result: `Completed ${input.step.stepId}` };
      },
    });

    const step1: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'researcher',
      capability: 'research',
      dependsOn: [],
      permissions: ['network:read'],
      risk: 'low',
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
      handoff: { allowedTargets: ['step_2'] },
    };

    const step2: SkillCompositionStep = {
      stepId: 'step_2',
      skillId: 'writer',
      capability: 'writing',
      dependsOn: ['step_1'],
      permissions: ['content:write'],
      risk: 'low',
      inputContract: {
        properties: { result: 'string' },
        required: [],
        additionalProperties: 'strip',
      },
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([step1, step2]);
    const result = await runtime.handlePrompt('full verified build', {
      compositionContract: contract,
      guardEvidence: {
        filesWritten: ['src/output/final.ts'],
        testsPassed: true,
        registered: true,
      },
    });

    expect(result.status).toBe('completed');
    expect(result.message).toContain('Plan completed successfully');
    expect(result.guardResult?.status).toBe('VERIFIED_COMPLETE');
    expect(result.guardResult?.evidenceVerified).toBe(true);
    expect(result.compositionResult?.executedSteps).toEqual(['step_1', 'step_2']);
  });

  // Test F: Intermediate failure propagates correctly
  it('Test F: Intermediate step failure stops execution and marks overall plan failed', async () => {
    const executed: string[] = [];
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async (input: SkillStepExecutionInput) => {
        executed.push(input.step.stepId);
        if (input.step.stepId === 'step_2') {
          throw new Error('Step 2 network timeout');
        }
        return { result: 'OK' };
      },
    });

    const step1: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'researcher',
      capability: 'research',
      dependsOn: [],
      permissions: ['network:read'],
      risk: 'low',
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
      handoff: { allowedTargets: ['step_2'] },
    };

    const step2: SkillCompositionStep = {
      stepId: 'step_2',
      skillId: 'writer',
      capability: 'writing',
      dependsOn: ['step_1'],
      permissions: ['content:write'],
      risk: 'low',
      inputContract: {
        properties: { result: 'string' },
        required: [],
        additionalProperties: 'strip',
      },
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
      handoff: { allowedTargets: ['step_3'] },
    };

    const step3: SkillCompositionStep = {
      stepId: 'step_3',
      skillId: 'verifier',
      capability: 'verification',
      dependsOn: ['step_2'],
      permissions: ['verify:read'],
      risk: 'low',
      inputContract: {
        properties: { result: 'string' },
        required: [],
        additionalProperties: 'strip',
      },
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([step1, step2, step3]);
    const result = await runtime.handlePrompt('failing workflow', {
      compositionContract: contract,
    });

    expect(result.status).toBe('failed');
    expect(result.message).toContain('Step step_2 failed');
    expect(result.compositionResult?.failedSteps).toEqual(['step_2']);
  });

  // Test G: Downstream dependent step does not incorrectly execute after failure
  it('Test G: Downstream dependent step does NOT execute after upstream failure', async () => {
    const executed: string[] = [];
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async (input: SkillStepExecutionInput) => {
        executed.push(input.step.stepId);
        if (input.step.stepId === 'step_2') {
          throw new Error('Critical crash in step 2');
        }
        return { result: 'OK' };
      },
    });

    const step1: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'researcher',
      capability: 'research',
      dependsOn: [],
      permissions: ['network:read'],
      risk: 'low',
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
      handoff: { allowedTargets: ['step_2'] },
    };

    const step2: SkillCompositionStep = {
      stepId: 'step_2',
      skillId: 'writer',
      capability: 'writing',
      dependsOn: ['step_1'],
      permissions: ['content:write'],
      risk: 'low',
      inputContract: {
        properties: { result: 'string' },
        required: [],
        additionalProperties: 'strip',
      },
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
      handoff: { allowedTargets: ['step_3'] },
    };

    const step3: SkillCompositionStep = {
      stepId: 'step_3',
      skillId: 'verifier',
      capability: 'verification',
      dependsOn: ['step_2'],
      permissions: ['verify:read'],
      risk: 'low',
      inputContract: {
        properties: { result: 'string' },
        required: [],
        additionalProperties: 'strip',
      },
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([step1, step2, step3]);
    const result = await runtime.handlePrompt('workflow test G', {
      compositionContract: contract,
    });

    // step_3 must NOT be executed
    expect(executed).toEqual(['step_1', 'step_2']);
    expect(result.compositionResult?.blockedSteps).toContain('step_3');
    expect(result.status).toBe('failed');
  });

  // Test H: Blocked state remains blocked
  it('Test H: Blocked capability or unapproved high-risk step reports status: blocked', async () => {
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async () => ({ result: 'OK' }),
    });

    const highRiskStep: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'high-risk-verifier',
      capability: 'admin-verify',
      dependsOn: [],
      permissions: ['admin:write'],
      risk: 'high',
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([highRiskStep]);
    // High-risk step without approvedStepIds
    const result = await runtime.handlePrompt('run verifier without approval', {
      compositionContract: contract,
      availablePermissions: ['admin:write'],
      maxRisk: 'high',
    });

    expect(result.status).toBe('blocked');
    expect(result.compositionResult?.blockedSteps).toContain('step_1');
  });

  // Test I: Existing approval behavior remains intact
  it('Test I: Intents requiring approval return pending_approval status and queue approval request', async () => {
    const runtime = new KernelRuntime();
    // 'research_ai' requires approval by default in Planner.ts
    const result = await runtime.handlePrompt('research ai trends in robotics');

    expect(result.status).toBe('pending_approval');
    expect(result.approvalRequest).toBeDefined();
    expect(result.message).toContain('Action queued pending operational approval');

    const pending = globalApprovalEngine.getPendingRequests();
    expect(pending.some((req) => req.id === result.approvalRequest?.id)).toBe(true);
  });

  // Test J: Provider fallback governance remains intact
  it('Test J: Provider policy preferredProvider remains openai and untouched', () => {
    expect(globalModelRoutingPolicy.getSettings().preferredProvider).toBe('openai');
    expect(globalModelRoutingPolicy.getSettings().allowProviderFallback).toBe(true);
  });

  // Test K: Existing receipt/evidence behavior remains intact
  it('Test K: Execution results preserve full telemetry metrics and guard evaluation details', async () => {
    const runtime = new KernelRuntime({
      skillLoader: loader,
      compositionPlanner: planner,
      completionGuard: guard,
      executeStep: async () => ({ result: 'Telemetry step done' }),
    });

    const step1: SkillCompositionStep = {
      stepId: 'step_1',
      skillId: 'researcher',
      capability: 'research',
      dependsOn: [],
      permissions: ['network:read'],
      risk: 'low',
      outputContract: {
        properties: { result: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      },
    };

    const contract = createTestCompositionContract([step1]);
    const result = await runtime.handlePrompt('test receipts', {
      compositionContract: contract,
      guardEvidence: {
        filesWritten: ['src/telemetry/receipt.ts'],
        testsPassed: true,
        registered: true,
      },
    });

    expect(result.compositionResult?.metrics).toBeDefined();
    expect(result.compositionResult?.metrics.selectedSkills).toBe(1);
    expect(result.guardResult).toBeDefined();
    expect(result.guardResult?.status).toBe('VERIFIED_COMPLETE');
  });

  // Test L: Default global instance executes plan via composition
  it('Test L: Default globalKernelRuntime instance maps generic intent through composition and guard', async () => {
    const result = await globalKernelRuntime.handlePrompt('generic system prompt');
    // Without file/test evidence, CapabilityCompletionGuard prevents false completion
    expect(result.status).not.toBe('completed');
    expect(result.message).not.toContain('Plan completed successfully');
    expect(result.compositionResult).toBeDefined();
    expect(result.guardResult).toBeDefined();
  });
});
