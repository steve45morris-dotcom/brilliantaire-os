import { randomUUID } from 'node:crypto';
import {
  ProgressiveSkillLoader,
  type LoadedSkillContent,
  type SkillDescriptor,
  type SkillExecutionContext,
  type SkillMatchRequest,
  type SkillRisk,
} from './ProgressiveSkillLoader.js';
import {
  CapabilityCompletionGuard,
  type GuardRequest,
  type GuardResult,
} from '../kernel/governance/CapabilityCompletionGuard.js';
import { globalAgentExecutionTelemetry, type AgentExecutionEventType } from '../kernel/live/AgentExecutionTelemetry.js';
import { globalLiveOperationsStore } from '../kernel/live/LiveOperationsStore.js';

export type CompositionFailurePolicy = 'fail-fast' | 'continue-independent' | 'handoff-on-failure';
export type CompositionCompletionPolicy = 'all-required' | 'guard-authoritative';
export type ContractValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface PayloadContract {
  properties: Record<string, ContractValueType>;
  required: string[];
  additionalProperties: 'reject' | 'strip';
}

export interface SkillCompositionStep {
  stepId: string;
  skillId: string;
  capability: string;
  dependsOn: string[];
  inputContract?: PayloadContract;
  outputContract: PayloadContract;
  permissions: string[];
  risk: SkillRisk;
  requestedResources?: string[];
  handoff?: {
    allowedTargets: string[];
    fallbackStepId?: string;
    fallbackCapability?: string;
  };
  fallbackFor?: string;
}

export interface SkillCompositionContract {
  contractId: string;
  missionId: string;
  requiredCapabilities: string[];
  steps: SkillCompositionStep[];
  failurePolicy: CompositionFailurePolicy;
  completionPolicy: CompositionCompletionPolicy;
  createdAt: string;
}

export interface SkillHandoff {
  handoffId: string;
  missionId: string;
  sourceSkill: string;
  targetSkill: string;
  sourceStep: string;
  targetStep: string;
  requiredCapability: string;
  payload: Readonly<Record<string, unknown>>;
  timestamp: string;
}

export interface SkillCompositionEvent {
  type:
    | 'composition.planned' | 'composition.validated' | 'composition.started'
    | 'composition.step.ready' | 'composition.step.started' | 'composition.step.completed'
    | 'composition.step.failed' | 'composition.handoff.created' | 'composition.handoff.completed'
    | 'composition.blocked' | 'composition.completed';
  contractId: string;
  missionId: string;
  stepId?: string;
  skillId?: string;
  targetStepId?: string;
  queuedSteps?: string[];
  blockedDependency?: string;
  error?: string;
  guardStatus?: string;
}

export interface CompositionPlanningRequest {
  contractId: string;
  missionId: string;
  mission: string;
  requiredCapabilities: string[];
  failurePolicy: CompositionFailurePolicy;
  completionPolicy: CompositionCompletionPolicy;
  availablePermissions: string[];
  maxRisk: SkillRisk;
  contractsByCapability: Record<string, {
    inputContract?: PayloadContract;
    outputContract: PayloadContract;
    requestedResources?: string[];
  }>;
}

export interface CompositionPolicyContext {
  availablePermissions: string[];
  maxRisk: SkillRisk;
}

export interface SkillCompositionMetrics {
  totalRegistrySkills: number;
  candidateSkillsConsidered: number;
  selectedSkills: number;
  activatedSkills: number;
  maximumConcurrentActiveSkills: number;
  instructionBytesByStep: Record<string, number>;
  resourceBytesByStep: Record<string, number>;
  unrelatedInstructionBytesAvoided: number;
  handoffPayloadBytes: Record<string, number>;
  planningTimeMs: number | 'Unavailable';
  tokenCount: 'Unavailable';
}

interface SkillCompositionPlannerOptions {
  now?: () => string;
  maxSteps?: number;
  maxDepth?: number;
  emit?: (event: SkillCompositionEvent) => void;
}

const RISK_RANK: Record<SkillRisk, number> = { low: 0, medium: 1, high: 2 };

export class SkillCompositionPlanner {
  private readonly now: () => string;
  private readonly maxSteps: number;
  private readonly maxDepth: number;
  private readonly emit: (event: SkillCompositionEvent) => void;
  private lastPlanningMetrics = { registrySkills: 0, candidatesConsidered: 0, selectedSkills: 0 };

  constructor(private readonly loader: ProgressiveSkillLoader, options: SkillCompositionPlannerOptions = {}) {
    this.now = options.now || (() => new Date().toISOString());
    this.maxSteps = options.maxSteps ?? 16;
    this.maxDepth = options.maxDepth ?? 8;
    this.emit = options.emit || (() => undefined);
  }

  public plan(request: CompositionPlanningRequest): SkillCompositionContract {
    assertPlainData(request, 'composition planning request');
    const discovered = this.loader.discover().skills;
    const descriptors = new Map(discovered.map((descriptor) => [descriptor.id, descriptor]));
    const selected = new Map<string, { descriptor: SkillDescriptor; capability: string }>();
    let candidatesConsidered = 0;

    for (const capability of uniqueStrings(request.requiredCapabilities, 'required capability')) {
      const matchRequest: SkillMatchRequest = {
        mission: request.mission,
        intent: request.mission,
        requiredCapabilities: [capability],
        permissions: request.availablePermissions,
        maxRisk: request.maxRisk,
      };
      const candidates = this.loader.match(matchRequest).candidates.filter((candidate) => candidate.descriptor.capabilities.includes(capability));
      candidatesConsidered += candidates.length;
      const candidate = candidates[0]?.descriptor;
      if (!candidate) throw new Error(`Missing required capability: ${capability}`);
      this.addDescriptorWithDependencies(candidate, capability, descriptors, selected, new Set());
    }

    const ordered = this.orderSelected(selected, descriptors);
    const stepIdBySkill = new Map(ordered.map((entry, index) => [entry.descriptor.id, `step-${String(index + 1).padStart(2, '0')}-${entry.descriptor.id}`]));
    const steps = ordered.map(({ descriptor, capability }) => {
      const dataContract = request.contractsByCapability[capability];
      if (!dataContract?.outputContract) throw new Error(`Missing output contract for capability: ${capability}`);
      const dependsOn = (descriptor.dependencies || []).map((id) => stepIdBySkill.get(id)).filter(isDefined);
      const step: SkillCompositionStep = {
        stepId: stepIdBySkill.get(descriptor.id)!,
        skillId: descriptor.id,
        capability,
        dependsOn,
        inputContract: dataContract.inputContract,
        outputContract: dataContract.outputContract,
        permissions: [...(descriptor.permissions || [])],
        risk: descriptor.risk || 'low',
        requestedResources: [...(dataContract.requestedResources || [])],
      };
      return step;
    });
    const byId = new Map(steps.map((step) => [step.stepId, step]));
    for (const target of steps) {
      for (const dependencyId of target.dependsOn) {
        const source = byId.get(dependencyId)!;
        source.handoff ||= { allowedTargets: [] };
        if (!source.handoff.allowedTargets.includes(target.stepId)) source.handoff.allowedTargets.push(target.stepId);
      }
    }

    const contract: SkillCompositionContract = {
      contractId: requireIdentifier(request.contractId, 'contractId'),
      missionId: requireIdentifier(request.missionId, 'missionId'),
      requiredCapabilities: uniqueStrings(request.requiredCapabilities, 'required capability'),
      steps,
      failurePolicy: request.failurePolicy,
      completionPolicy: request.completionPolicy,
      createdAt: this.now(),
    };
    const validated = this.validateContract(contract, request);
    this.lastPlanningMetrics = { registrySkills: discovered.length, candidatesConsidered, selectedSkills: steps.length };
    this.emit({ type: 'composition.planned', contractId: validated.contractId, missionId: validated.missionId, queuedSteps: validated.steps.map((step) => step.stepId) });
    return validated;
  }

  public validateContract(contract: SkillCompositionContract, policy: CompositionPolicyContext): SkillCompositionContract {
    assertPlainData(contract, 'composition contract');
    requireIdentifier(contract.contractId, 'contractId');
    requireIdentifier(contract.missionId, 'missionId');
    if (!['fail-fast', 'continue-independent', 'handoff-on-failure'].includes(contract.failurePolicy)) throw new Error('Invalid composition failure policy');
    if (!['all-required', 'guard-authoritative'].includes(contract.completionPolicy)) throw new Error('Invalid composition completion policy');
    if (!Number.isFinite(Date.parse(contract.createdAt))) throw new Error('Composition createdAt must be a valid timestamp');
    if (contract.steps.length === 0 || contract.steps.length > this.maxSteps) throw new Error(`Composition step count must be between 1 and ${this.maxSteps}`);

    const descriptors = new Map(this.loader.discover().skills.map((descriptor) => [descriptor.id, descriptor]));
    const stepById = new Map<string, SkillCompositionStep>();
    const equivalent = new Set<string>();
    for (const current of contract.steps) {
      requireIdentifier(current.stepId, 'stepId');
      if (stepById.has(current.stepId)) throw new Error(`Duplicate step ID: ${current.stepId}`);
      const descriptor = descriptors.get(current.skillId);
      if (!descriptor) throw new Error(`Unknown skill in composition: ${current.skillId}`);
      if (descriptor.status === 'retired' || descriptor.status === 'deprecated') throw new Error(`Skill ${current.skillId} is ${descriptor.status}`);
      if (!descriptor.capabilities.includes(current.capability)) throw new Error(`Skill ${current.skillId} does not declare capability ${current.capability}`);
      const equivalentKey = `${current.skillId}:${current.capability}`;
      if (equivalent.has(equivalentKey)) throw new Error(`Duplicate equivalent step: ${equivalentKey}`);
      equivalent.add(equivalentKey);
      if (!(descriptor.permissions || []).every((permission) => current.permissions.includes(permission))) throw new Error(`Step ${current.stepId} omits required skill permission`);
      if (!current.permissions.every((permission) => policy.availablePermissions.includes(permission))) throw new Error(`Unavailable permission for step ${current.stepId}`);
      if (RISK_RANK[current.risk] < RISK_RANK[descriptor.risk || 'low'] || RISK_RANK[current.risk] > RISK_RANK[policy.maxRisk]) throw new Error(`Risk policy violation for step ${current.stepId}`);
      validatePayloadContract(current.outputContract, `${current.stepId}.outputContract`);
      if (current.inputContract) validatePayloadContract(current.inputContract, `${current.stepId}.inputContract`);
      stepById.set(current.stepId, current);
    }

    for (const capability of uniqueStrings(contract.requiredCapabilities, 'required capability')) {
      if (!contract.steps.some((step) => step.capability === capability)) throw new Error(`Missing required capability: ${capability}`);
    }
    this.assertAcyclicAndOrdered(contract.steps);
    for (const current of contract.steps) {
      const descriptor = descriptors.get(current.skillId)!;
      for (const requiredSkillId of descriptor.dependencies || []) {
        const dependencyStep = contract.steps.find((step) => step.skillId === requiredSkillId);
        if (!dependencyStep || !current.dependsOn.includes(dependencyStep.stepId)) {
          throw new Error(`Step ${current.stepId} is missing declared skill dependency ${requiredSkillId}`);
        }
      }
      for (const dependencyId of uniqueStrings(current.dependsOn, 'dependency')) {
        const source = stepById.get(dependencyId);
        if (!source) throw new Error(`Missing dependency step ${dependencyId}`);
        if (!source.handoff?.allowedTargets.includes(current.stepId)) throw new Error(`Invalid handoff target ${current.stepId} from ${source.stepId}`);
        if (!current.inputContract) throw new Error(`Dependent step ${current.stepId} requires an input contract`);
        for (const [key, type] of Object.entries(source.outputContract.properties)) {
          if (current.inputContract.properties[key] !== type) throw new Error(`Input contract for ${current.stepId} does not accept declared output ${key}`);
        }
      }
      if (current.fallbackFor) {
        const source = stepById.get(current.fallbackFor);
        if (!source || contract.failurePolicy !== 'handoff-on-failure') throw new Error(`Invalid fallback declaration for ${current.stepId}`);
        if (!current.inputContract) throw new Error(`Fallback ${current.stepId} requires an input contract`);
        if (source.handoff?.fallbackStepId !== current.stepId || source.handoff.fallbackCapability !== current.capability || !source.handoff.allowedTargets.includes(current.stepId)) {
          throw new Error(`Fallback ${current.stepId} is not explicitly authorized`);
        }
      }
      if (current.handoff?.fallbackStepId) {
        const fallback = stepById.get(current.handoff.fallbackStepId);
        if (!fallback || fallback.fallbackFor !== current.stepId || current.handoff.fallbackCapability !== fallback.capability) throw new Error(`Invalid fallback target from ${current.stepId}`);
      }
    }
    const snapshot = deepFreeze(structuredClone(contract));
    this.emit({ type: 'composition.validated', contractId: snapshot.contractId, missionId: snapshot.missionId, queuedSteps: snapshot.steps.map((step) => step.stepId) });
    return snapshot;
  }

  public getLastPlanningMetrics(): { registrySkills: number; candidatesConsidered: number; selectedSkills: number } {
    return { ...this.lastPlanningMetrics };
  }

  private addDescriptorWithDependencies(
    descriptor: SkillDescriptor,
    capability: string,
    descriptors: Map<string, SkillDescriptor>,
    selected: Map<string, { descriptor: SkillDescriptor; capability: string }>,
    visiting: Set<string>,
  ): void {
    if (selected.has(descriptor.id)) return;
    if (visiting.has(descriptor.id)) throw new Error(`Skill dependency cycle detected at ${descriptor.id}`);
    visiting.add(descriptor.id);
    for (const dependencyId of descriptor.dependencies || []) {
      const dependency = descriptors.get(dependencyId);
      if (!dependency) throw new Error(`Missing skill dependency ${dependencyId}`);
      this.addDescriptorWithDependencies(dependency, dependency.capabilities[0], descriptors, selected, visiting);
    }
    visiting.delete(descriptor.id);
    selected.set(descriptor.id, { descriptor, capability });
    if (selected.size > this.maxSteps) throw new Error(`Composition step count exceeds ${this.maxSteps}`);
  }

  private orderSelected(
    selected: Map<string, { descriptor: SkillDescriptor; capability: string }>,
    descriptors: Map<string, SkillDescriptor>,
  ): Array<{ descriptor: SkillDescriptor; capability: string }> {
    const result: Array<{ descriptor: SkillDescriptor; capability: string }> = [];
    const visited = new Set<string>();
    const visit = (entry: { descriptor: SkillDescriptor; capability: string }) => {
      if (visited.has(entry.descriptor.id)) return;
      for (const dependencyId of entry.descriptor.dependencies || []) {
        const dependency = selected.get(dependencyId);
        if (dependency) visit(dependency);
        else if (!descriptors.has(dependencyId)) throw new Error(`Missing skill dependency ${dependencyId}`);
      }
      visited.add(entry.descriptor.id);
      result.push(entry);
    };
    [...selected.values()].sort((a, b) => a.descriptor.id.localeCompare(b.descriptor.id)).forEach(visit);
    return result;
  }

  private assertAcyclicAndOrdered(steps: SkillCompositionStep[]): void {
    const byId = new Map(steps.map((step) => [step.stepId, step]));
    const visiting = new Set<string>();
    const depths = new Map<string, number>();
    const depthOf = (stepId: string): number => {
      if (visiting.has(stepId)) throw new Error(`Composition dependency cycle detected at ${stepId}`);
      const cached = depths.get(stepId);
      if (cached !== undefined) return cached;
      visiting.add(stepId);
      const current = byId.get(stepId)!;
      const depth = current.dependsOn.length ? 1 + Math.max(...current.dependsOn.map(depthOf)) : 0;
      visiting.delete(stepId);
      depths.set(stepId, depth);
      if (depth > this.maxDepth) throw new Error(`Composition depth exceeds ${this.maxDepth}`);
      return depth;
    };
    steps.forEach((step) => depthOf(step.stepId));
    const position = new Map(steps.map((step, index) => [step.stepId, index]));
    for (const current of steps) for (const dependency of current.dependsOn) {
      if ((position.get(dependency) ?? Number.MAX_SAFE_INTEGER) >= position.get(current.stepId)!) throw new Error(`Dependency ordering violation for ${current.stepId}`);
    }
  }
}

export interface SkillStepExecutionInput {
  step: SkillCompositionStep;
  instructions: LoadedSkillContent;
  resources: LoadedSkillContent[];
  input: Readonly<Record<string, unknown>>;
}

export interface CompositionExecutionRequest extends CompositionPolicyContext {
  mission: string;
  intent: string;
  approvedStepIds?: string[];
  guardEvidence?: GuardRequest['evidenceProvided'];
}

export interface SkillCompositionResult {
  contract: SkillCompositionContract;
  executedSteps: string[];
  skippedSteps: string[];
  failedSteps: string[];
  blockedSteps: string[];
  handoffs: SkillHandoff[];
  validatedOutputs: Record<string, Readonly<Record<string, unknown>>>;
  unresolvedRequiredCapabilities: string[];
  guardResult: GuardResult;
  missionComplete: boolean;
  metrics: SkillCompositionMetrics;
}

interface SkillCompositionExecutorOptions {
  loader: ProgressiveSkillLoader;
  planner: SkillCompositionPlanner;
  guard: CapabilityCompletionGuard;
  executeStep: (input: SkillStepExecutionInput) => Promise<Record<string, unknown>>;
  emit?: (event: SkillCompositionEvent) => void;
  now?: () => string;
}

export class SkillCompositionExecutor {
  private readonly emit: (event: SkillCompositionEvent) => void;
  private readonly now: () => string;

  constructor(private readonly options: SkillCompositionExecutorOptions) {
    this.emit = options.emit || emitCompositionToLiveOperations;
    this.now = options.now || (() => new Date().toISOString());
  }

  public async execute(contractInput: SkillCompositionContract, request: CompositionExecutionRequest): Promise<SkillCompositionResult> {
    const contract = this.options.planner.validateContract(contractInput, request);
    const executedSteps: string[] = [];
    const skippedSteps: string[] = [];
    const failedSteps: string[] = [];
    const blockedSteps: string[] = [];
    const handoffs: SkillHandoff[] = [];
    const outputs: Record<string, Readonly<Record<string, unknown>>> = {};
    const failed = new Set<string>();
    const blocked = new Set<string>();
    const triggeredFallbacks = new Set<string>();
    let stop = false;
    let activeCount = 0;
    let maximumConcurrentActiveSkills = 0;
    const instructionBytesByStep: Record<string, number> = {};
    const resourceBytesByStep: Record<string, number> = {};
    const handoffPayloadBytes: Record<string, number> = {};

    this.emit({ type: 'composition.validated', contractId: contract.contractId, missionId: contract.missionId, queuedSteps: contract.steps.map((step) => step.stepId) });
    this.emit({ type: 'composition.started', contractId: contract.contractId, missionId: contract.missionId, queuedSteps: contract.steps.map((step) => step.stepId) });

    for (const current of contract.steps) {
      if (stop) {
        blocked.add(current.stepId); blockedSteps.push(current.stepId);
        this.emit({ type: 'composition.blocked', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId, blockedDependency: failedSteps.at(-1) });
        continue;
      }
      if (current.fallbackFor && !triggeredFallbacks.has(current.stepId)) { skippedSteps.push(current.stepId); continue; }
      const failedDependency = current.dependsOn.find((dependency) => failed.has(dependency) || blocked.has(dependency));
      if (failedDependency && current.fallbackFor !== failedDependency) {
        blocked.add(current.stepId); blockedSteps.push(current.stepId);
        this.emit({ type: 'composition.blocked', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId, blockedDependency: failedDependency });
        continue;
      }
      if (current.risk === 'high' && !(request.approvedStepIds || []).includes(current.stepId)) {
        blocked.add(current.stepId); blockedSteps.push(current.stepId);
        this.emit({ type: 'composition.blocked', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId, error: 'High-risk step requires approval' });
        if (contract.failurePolicy === 'fail-fast') stop = true;
        continue;
      }

      this.emit({ type: 'composition.step.ready', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId });
      const input = this.buildInputAndHandoffs(contract, current, outputs, handoffs, handoffPayloadBytes);
      const validatedInput = current.inputContract ? validatePayload(input, current.inputContract, `${current.stepId} input`) : deepFreeze({});
      const execution = executionContext(contract, current);
      const loaderRequest: SkillMatchRequest = {
        mission: request.mission,
        intent: request.intent,
        requiredCapabilities: [current.capability],
        permissions: request.availablePermissions,
        maxRisk: request.maxRisk,
      };
      try {
        await this.options.loader.runActivated(current.skillId, execution, loaderRequest, async () => {
          activeCount += 1;
          maximumConcurrentActiveSkills = Math.max(maximumConcurrentActiveSkills, activeCount);
          this.emit({ type: 'composition.step.started', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId });
          try {
            const instructions = this.options.loader.loadInstructions(current.skillId, execution);
            const resources = this.options.loader.loadResources(current.skillId, current.requestedResources || [], execution);
            instructionBytesByStep[current.stepId] = instructions.bytes;
            resourceBytesByStep[current.stepId] = resources.reduce((total, resource) => total + resource.bytes, 0);
            const unsafeOutput = await this.options.executeStep({ step: current, instructions, resources, input: validatedInput });
            outputs[current.stepId] = validatePayload(unsafeOutput, current.outputContract, `${current.stepId} output`);
            executedSteps.push(current.stepId);
            this.emit({ type: 'composition.step.completed', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId });
          } finally {
            activeCount -= 1;
          }
        });
      } catch (error) {
        failed.add(current.stepId); failedSteps.push(current.stepId);
        const message = error instanceof Error ? error.message : 'Unknown composition step failure';
        this.emit({ type: 'composition.step.failed', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId, error: message });
        if (contract.failurePolicy === 'fail-fast') stop = true;
        if (contract.failurePolicy === 'handoff-on-failure') {
          const fallbackId = current.handoff?.fallbackStepId;
          if (!fallbackId) stop = true;
          else {
            triggeredFallbacks.add(fallbackId);
            const fallback = contract.steps.find((step) => step.stepId === fallbackId)!;
            const handoff = this.createHandoff(contract, current, fallback, { failure: message });
            handoffs.push(handoff);
            handoffPayloadBytes[handoff.handoffId] = Buffer.byteLength(JSON.stringify(handoff.payload));
            this.emit({ type: 'composition.handoff.created', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId, targetStepId: fallback.stepId });
            this.emit({ type: 'composition.handoff.completed', contractId: contract.contractId, missionId: contract.missionId, stepId: current.stepId, skillId: current.skillId, targetStepId: fallback.stepId });
          }
        }
      }
    }

    for (const current of contract.steps) {
      if (!executedSteps.includes(current.stepId) && !failedSteps.includes(current.stepId) && !blockedSteps.includes(current.stepId) && !skippedSteps.includes(current.stepId)) {
        blockedSteps.push(current.stepId);
      }
    }
    const completedCapabilities = new Set(contract.steps.filter((step) => executedSteps.includes(step.stepId)).map((step) => step.capability));
    const unresolvedRequiredCapabilities = contract.requiredCapabilities.filter((capability) => !completedCapabilities.has(capability));
    const compositionEvidence = {
      plannedRequiredCapabilities: [...contract.requiredCapabilities], executedSteps: [...executedSteps], skippedSteps: [...skippedSteps],
      failedSteps: [...failedSteps], blockedSteps: [...blockedSteps], handoffs: handoffs.map(({ handoffId, sourceStep, targetStep }) => ({ handoffId, sourceStep, targetStep })),
      validatedOutputSteps: Object.keys(outputs), unresolvedRequiredCapabilities: [...unresolvedRequiredCapabilities],
    };
    const guardResult = this.options.guard.evaluate({
      objective: `Validate composed mission ${contract.missionId}`,
      target: contract.contractId,
      requiredCapabilities: contract.requiredCapabilities,
      availableCapabilities: [...completedCapabilities],
      executionSurface: 'skill-composition',
      evidenceProvided: { ...(request.guardEvidence || {}), composition: compositionEvidence },
    });
    this.emit({ type: 'composition.completed', contractId: contract.contractId, missionId: contract.missionId, guardStatus: guardResult.status });
    const planning = this.options.planner.getLastPlanningMetrics();
    const loaderAccounting = this.options.loader.getAccounting();
    return {
      contract, executedSteps, skippedSteps, failedSteps, blockedSteps, handoffs,
      validatedOutputs: outputs, unresolvedRequiredCapabilities, guardResult,
      missionComplete: guardResult.status === 'VERIFIED_COMPLETE' && guardResult.evidenceVerified,
      metrics: {
        totalRegistrySkills: planning.registrySkills || this.options.loader.discover().skills.length,
        candidateSkillsConsidered: planning.candidatesConsidered,
        selectedSkills: contract.steps.length,
        activatedSkills: loaderAccounting.skillsActivated,
        maximumConcurrentActiveSkills,
        instructionBytesByStep,
        resourceBytesByStep,
        unrelatedInstructionBytesAvoided: loaderAccounting.unrelatedInstructionBytesAvoided,
        handoffPayloadBytes,
        planningTimeMs: 'Unavailable',
        tokenCount: 'Unavailable',
      },
    };
  }

  private buildInputAndHandoffs(
    contract: SkillCompositionContract,
    target: SkillCompositionStep,
    outputs: Record<string, Readonly<Record<string, unknown>>>,
    handoffs: SkillHandoff[],
    handoffPayloadBytes: Record<string, number>,
  ): Readonly<Record<string, unknown>> {
    const input: Record<string, unknown> = {};
    for (const existing of handoffs.filter((handoff) => handoff.targetStep === target.stepId)) {
      mergePayload(input, existing.payload);
    }
    for (const dependencyId of target.dependsOn) {
      const source = contract.steps.find((step) => step.stepId === dependencyId)!;
      const payload = outputs[dependencyId];
      if (!payload) continue;
      mergePayload(input, payload);
      const handoff = this.createHandoff(contract, source, target, payload);
      handoffs.push(handoff);
      handoffPayloadBytes[handoff.handoffId] = Buffer.byteLength(JSON.stringify(handoff.payload));
      this.emit({ type: 'composition.handoff.created', contractId: contract.contractId, missionId: contract.missionId, stepId: source.stepId, skillId: source.skillId, targetStepId: target.stepId });
      this.emit({ type: 'composition.handoff.completed', contractId: contract.contractId, missionId: contract.missionId, stepId: source.stepId, skillId: source.skillId, targetStepId: target.stepId });
    }
    return deepFreeze(input);
  }

  private createHandoff(
    contract: SkillCompositionContract,
    source: SkillCompositionStep,
    target: SkillCompositionStep,
    payload: Record<string, unknown>,
  ): SkillHandoff {
    if (!source.handoff?.allowedTargets.includes(target.stepId)) throw new Error(`Invalid handoff target ${target.stepId}`);
    return deepFreeze({
      handoffId: `handoff-${randomUUID()}`,
      missionId: contract.missionId,
      sourceSkill: source.skillId,
      targetSkill: target.skillId,
      sourceStep: source.stepId,
      targetStep: target.stepId,
      requiredCapability: target.capability,
      payload: structuredClone(payload),
      timestamp: this.now(),
    });
  }
}

function validatePayload(value: unknown, contract: PayloadContract, label: string): Readonly<Record<string, unknown>> {
  assertSafeJson(value, label);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const record = value as Record<string, unknown>;
  for (const required of contract.required) if (!(required in record)) throw new Error(`${label} missing required field ${required}`);
  const unexpected = Object.keys(record).filter((key) => !(key in contract.properties));
  if (unexpected.length && contract.additionalProperties === 'reject') throw new Error(`${label} contains unexpected field ${unexpected[0]}`);
  const result: Record<string, unknown> = {};
  for (const [key, expected] of Object.entries(contract.properties)) {
    if (!(key in record)) continue;
    if (!matchesType(record[key], expected)) throw new Error(`${label}.${key} must be ${expected}`);
    result[key] = structuredClone(record[key]);
  }
  return deepFreeze(result);
}

function matchesType(value: unknown, expected: ContractValueType): boolean {
  if (expected === 'null') return value === null;
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  return typeof value === expected;
}

function validatePayloadContract(contract: PayloadContract, label: string): void {
  assertPlainData(contract, label);
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) throw new Error(`${label} must be data`);
  if (!['reject', 'strip'].includes(contract.additionalProperties)) throw new Error(`${label} has invalid additionalProperties policy`);
  for (const required of contract.required) if (!(required in contract.properties)) throw new Error(`${label} requires undeclared property ${required}`);
  for (const type of Object.values(contract.properties)) if (!['string', 'number', 'boolean', 'object', 'array', 'null'].includes(type)) throw new Error(`${label} has unsupported type ${type}`);
}

function assertPlainData(value: unknown, label: string, seen = new WeakSet<object>()): void {
  if (typeof value === 'function' || typeof value === 'symbol') throw new Error(`${label} must not contain executable values`);
  if (!value || typeof value !== 'object') return;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`${label} must contain plain data objects`);
  }
  if (seen.has(value)) throw new Error(`${label} must not be cyclic`);
  seen.add(value);
  for (const entry of Object.values(value)) assertPlainData(entry, label, seen);
  seen.delete(value);
}

function assertSafeJson(value: unknown, label: string, depth = 0, state = { keys: 0 }): void {
  if (depth > 6) throw new Error(`${label} exceeds maximum payload depth`);
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${label} contains a non-finite number`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) throw new Error(`${label} exceeds maximum array length`);
    value.forEach((entry) => assertSafeJson(entry, label, depth + 1, state));
    return;
  }
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must contain plain JSON data`);
  const entries = Object.entries(value);
  state.keys += entries.length;
  if (state.keys > 100) throw new Error(`${label} exceeds maximum key count`);
  entries.forEach(([, entry]) => assertSafeJson(entry, label, depth + 1, state));
  if (depth === 0 && Buffer.byteLength(JSON.stringify(value)) > 64 * 1024) throw new Error(`${label} exceeds maximum payload size`);
}

function mergePayload(target: Record<string, unknown>, source: Readonly<Record<string, unknown>>): void {
  for (const [key, value] of Object.entries(source)) {
    if (key in target) throw new Error(`Handoff input collision on ${key}`);
    target[key] = structuredClone(value);
  }
}

function requireIdentifier(value: string, label: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)) throw new Error(`Invalid ${label}`);
  return value;
}

function uniqueStrings(values: string[], label: string): string[] {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || !value.trim())) throw new Error(`Invalid ${label} list`);
  return [...new Set(values)];
}

function executionContext(contract: SkillCompositionContract, step: SkillCompositionStep): SkillExecutionContext {
  return {
    executionId: `composition:${contract.contractId}:${step.stepId}`,
    agentId: 'skill-composition-runtime',
    agentName: 'Skill Composition Runtime',
    missionId: contract.missionId,
    missionName: `Composed mission ${contract.missionId}`,
    taskId: step.stepId,
    taskName: `Composition step ${step.stepId}`,
  };
}

function emitCompositionToLiveOperations(event: SkillCompositionEvent): void {
  const operation = globalAgentExecutionTelemetry.record(event.type as AgentExecutionEventType, {
    agentId: 'skill-composition-runtime',
    agentName: 'Skill Composition Runtime',
    missionId: event.missionId,
    taskId: event.stepId,
    skill: event.skillId,
    compositionId: event.contractId,
    compositionStep: event.stepId,
    queuedSteps: event.queuedSteps,
    blockedDependency: event.blockedDependency,
    handoffTarget: event.targetStepId,
    completionGuardStatus: event.guardStatus,
    verified: event.guardStatus === 'VERIFIED_COMPLETE',
    error: event.error,
  });
  globalLiveOperationsStore.addEvent(operation);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
}

function isDefined<T>(value: T | undefined): value is T { return value !== undefined; }
