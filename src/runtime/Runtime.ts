import { globalIntentParser } from './IntentParser.js';
import { globalPlanner, type ExecutionPlan } from './Planner.js';
import { globalApprovalEngine, type ApprovalRequest } from './ApprovalEngine.js';
import { globalConversationContext } from './ConversationContext.js';
import { globalPromptCompiler } from './PromptCompiler.js';
import { globalCommandDispatcher } from '../kernel/dispatcher/CommandDispatcher.js';
import { globalEventBus } from '../kernel/events/EventBus.js';
import { globalModelRouter } from '../integrations/core/ModelRouter.js';
import { SkillRegistryManager } from '../agent-upgrade/registry.js';
import {
  ProgressiveSkillLoader,
  type SkillDescriptor,
  type SkillRisk,
} from '../agent-upgrade/ProgressiveSkillLoader.js';
import {
  SkillCompositionPlanner,
  SkillCompositionExecutor,
  type SkillCompositionContract,
  type SkillCompositionStep,
  type SkillCompositionResult,
  type SkillStepExecutionInput,
  type CompositionExecutionRequest,
  type PayloadContract,
  type CompositionFailurePolicy,
} from '../agent-upgrade/SkillCompositionContracts.js';
import {
  CapabilityCompletionGuard,
  type GuardRequest,
  type GuardResult,
} from '../kernel/governance/CapabilityCompletionGuard.js';

export interface RuntimeExecutionOptions {
  guardEvidence?: GuardRequest['evidenceProvided'];
  availablePermissions?: string[];
  maxRisk?: SkillRisk;
  approvedStepIds?: string[];
  compositionContract?: SkillCompositionContract;
  failurePolicy?: CompositionFailurePolicy;
}

export interface RuntimeExecutionResult {
  status: 'completed' | 'pending_approval' | 'failed' | 'blocked';
  plan: ExecutionPlan;
  approvalRequest?: ApprovalRequest;
  message: string;
  guardResult?: GuardResult;
  compositionResult?: SkillCompositionResult;
}

export interface KernelRuntimeOptions {
  skillRegistry?: SkillRegistryManager;
  skillLoader?: ProgressiveSkillLoader;
  compositionPlanner?: SkillCompositionPlanner;
  completionGuard?: CapabilityCompletionGuard;
  executeStep?: (input: SkillStepExecutionInput) => Promise<Record<string, unknown>>;
}

export class KernelRuntime {
  private readonly skillRegistry: SkillRegistryManager;
  private readonly skillLoader: ProgressiveSkillLoader;
  private readonly compositionPlanner: SkillCompositionPlanner;
  private readonly completionGuard: CapabilityCompletionGuard;
  private readonly customExecuteStep?: (input: SkillStepExecutionInput) => Promise<Record<string, unknown>>;

  constructor(options?: KernelRuntimeOptions) {
    this.skillRegistry = options?.skillRegistry || new SkillRegistryManager();
    this.skillLoader = options?.skillLoader || options?.skillRegistry?.createProgressiveLoader() || this.skillRegistry.createProgressiveLoader();
    this.compositionPlanner = options?.compositionPlanner || new SkillCompositionPlanner(this.skillLoader);
    this.completionGuard = options?.completionGuard || new CapabilityCompletionGuard();
    this.customExecuteStep = options?.executeStep;

    try {
      globalCommandDispatcher.registerHandler('Generic Command', async (cmd) => {
        const query = cmd.payload.skillContext || cmd.payload.query;
        const result = await globalModelRouter.executeRoutedRequest({
          taskDescription: query,
          taskType: 'general',
          requiredCapability: 'text'
        }, {
          requestId: `req-${Date.now()}`,
          sessionId: 'supernova-session',
          workspaceId: 'default-workspace',
          userIntent: query,
          approvalStatus: 'none',
          allowedTools: []
        });

        if (result.status === 'approval-required') {
          return {
            success: true,
            message: `Execution halted. Approval is required before continuing.`
          };
        }

        return {
          success: result.success || false,
          message: result.output?.message || 'Handled by Model Router.',
          data: result
        };
      });
    } catch {
      // Catch already registered handler errors in reboot or hot-reload contexts
    }
  }

  private buildCompositionContractFromPlan(
    plan: ExecutionPlan,
    intentType: string,
    promptText: string,
    descriptors: SkillDescriptor[],
    policy: { availablePermissions: string[]; maxRisk: SkillRisk },
    failurePolicy: CompositionFailurePolicy,
  ): SkillCompositionContract {
    const activeDescriptors = descriptors.filter((d) => d.status === 'active');
    const usedCombinations = new Set<string>();
    const steps: SkillCompositionStep[] = [];

    const effectiveSteps = plan.steps.length > 0
      ? plan.steps
      : [{ index: 1, description: 'Execute generic prompt command' }];

    for (let i = 0; i < effectiveSteps.length; i++) {
      const planStep = effectiveSteps[i];
      const stepId = `step_${planStep.index}`;

      let chosenDescriptor: SkillDescriptor | undefined;
      let chosenCapability: string | undefined;

      // 1. Try matching planStep.skill
      if (planStep.skill) {
        const d = activeDescriptors.find((desc) => desc.id === planStep.skill);
        if (d) {
          const cap = d.capabilities.find((c) => !usedCombinations.has(`${d.id}:${c}`)) || d.capabilities[0];
          if (!usedCombinations.has(`${d.id}:${cap}`)) {
            chosenDescriptor = d;
            chosenCapability = cap;
          }
        }
      }

      // 2. Try matching planStep.agent or category or capability
      if (!chosenDescriptor && planStep.agent) {
        const agentLower = planStep.agent.toLowerCase();
        const d = activeDescriptors.find((desc) =>
          (desc.capabilities.some((c) => c.toLowerCase().includes(agentLower))
            || desc.category.toLowerCase().includes(agentLower)
            || (desc.owner || '').toLowerCase().includes(agentLower))
          && desc.capabilities.some((c) => !usedCombinations.has(`${desc.id}:${c}`))
        );
        if (d) {
          chosenDescriptor = d;
          chosenCapability = d.capabilities.find((c) => !usedCombinations.has(`${d.id}:${c}`)) || d.capabilities[0];
        }
      }

      // 3. Try matching by intent or keywords in description
      if (!chosenDescriptor) {
        for (const desc of activeDescriptors) {
          const unusedCap = desc.capabilities.find((c) => !usedCombinations.has(`${desc.id}:${c}`));
          if (unusedCap && (planStep.description.toLowerCase().includes(desc.category) || desc.capabilities.some((c) => planStep.description.toLowerCase().includes(c)))) {
            chosenDescriptor = desc;
            chosenCapability = unusedCap;
            break;
          }
        }
      }

      // 4. Fallback to any active descriptor with an unused combination
      if (!chosenDescriptor) {
        for (const desc of activeDescriptors) {
          const unusedCap = desc.capabilities.find((c) => !usedCombinations.has(`${desc.id}:${c}`));
          if (unusedCap) {
            chosenDescriptor = desc;
            chosenCapability = unusedCap;
            break;
          }
        }
      }

      // 5. Ultimate fallback if all combinations exhausted
      if (!chosenDescriptor) {
        chosenDescriptor = activeDescriptors[0] || {
          id: 'task-runner',
          name: 'task-runner',
          category: 'automation',
          owner: 'Automation Agent',
          version: '1.0.0',
          status: 'active',
          summary: 'Task runner',
          capabilities: ['automation'],
          triggerHints: [],
          dependencies: [],
          risk: 'low',
          permissions: [],
          instructionPath: 'task-runner/SKILL.md',
          resourcePaths: []
        };
        chosenCapability = chosenDescriptor.capabilities[0] || 'automation';
      }

      const resolvedCapability: string = chosenCapability || chosenDescriptor.capabilities[0] || 'automation';
      usedCombinations.add(`${chosenDescriptor.id}:${resolvedCapability}`);

      const risk: SkillRisk = (chosenDescriptor.risk === 'high' || chosenDescriptor.risk === 'medium')
        ? chosenDescriptor.risk
        : 'low';
      const permissions = chosenDescriptor.permissions || [];

      const outputContract: PayloadContract = {
        properties: { result: 'string', message: 'string' },
        required: ['result'],
        additionalProperties: 'strip',
      };

      const currentStep: SkillCompositionStep = {
        stepId,
        skillId: chosenDescriptor.id,
        capability: resolvedCapability,
        dependsOn: i > 0 ? [`step_${effectiveSteps[i - 1].index}`] : [],
        outputContract,
        permissions,
        risk,
      };

      if (i > 0) {
        currentStep.inputContract = {
          properties: { result: 'string', message: 'string' },
          required: [],
          additionalProperties: 'strip',
        };
      }

      if (i < effectiveSteps.length - 1) {
        const nextStepId = `step_${effectiveSteps[i + 1].index}`;
        currentStep.handoff = {
          allowedTargets: [nextStepId],
        };
      }

      steps.push(currentStep);
    }

    const sanitizedMission = intentType.replace(/[^a-zA-Z0-9_-]/g, '_') || 'mission';
    const contractId = `contract_${Date.now()}`;

    return {
      contractId,
      missionId: `${sanitizedMission}_${Date.now()}`,
      requiredCapabilities: [...new Set(steps.map((s) => s.capability))],
      steps,
      failurePolicy,
      completionPolicy: 'guard-authoritative',
      createdAt: new Date().toISOString(),
    };
  }

  public async handlePrompt(
    promptText: string,
    options?: RuntimeExecutionOptions
  ): Promise<RuntimeExecutionResult> {
    globalConversationContext.addMessage('user', promptText);
    globalEventBus.publish('KernelPromptReceived', { promptText });

    // 1. Intent Parsing
    const intent = globalIntentParser.parse(promptText);

    // 2. Planning
    const plan = globalPlanner.generatePlan(intent);

    // 3. Approval Check
    if (plan.approvalRequired && !(options?.approvedStepIds && options.approvedStepIds.length > 0)) {
      const approvalRequest = globalApprovalEngine.requestApproval(plan);
      globalConversationContext.addMessage(
        'assistant',
        `The requested action "${promptText}" requires authorization before proceeding.`
      );
      return {
        status: 'pending_approval',
        plan,
        approvalRequest,
        message: 'Action queued pending operational approval.',
      };
    }

    // 4. Execution setup
    const execution = {
      executionId: `runtime-${Date.now()}`,
      agentId: 'kernel-runtime',
      agentName: 'Kernel Runtime',
      missionId: intent.intentType,
      missionName: `Runtime mission: ${intent.intentType}`,
    };

    const discoveredSkills = this.skillLoader.discover(execution).skills;
    const failurePolicy = options?.failurePolicy || 'fail-fast';
    const maxRisk: SkillRisk = options?.maxRisk || 'high';

    // 5. Build or resolve SkillCompositionContract
    const contract = options?.compositionContract
      || this.buildCompositionContractFromPlan(
        plan,
        intent.intentType,
        promptText,
        discoveredSkills,
        {
          availablePermissions: options?.availablePermissions || ['filesystem:read', 'network:read', 'content:write', 'verify:read'],
          maxRisk
        },
        failurePolicy
      );

    const stepPermissions = [...new Set(contract.steps.flatMap((s) => s.permissions))];
    const availablePermissions = options?.availablePermissions || [
      ...new Set([
        'filesystem:read',
        'network:read',
        'content:write',
        'verify:read',
        ...stepPermissions,
      ]),
    ];

    // 6. Instantiate SkillCompositionExecutor
    const executor = new SkillCompositionExecutor({
      loader: this.skillLoader,
      planner: this.compositionPlanner,
      guard: this.completionGuard,
      executeStep: async (stepInput) => {
        if (this.customExecuteStep) {
          return this.customExecuteStep(stepInput);
        }

        const contextDetails = globalConversationContext.getContextDetails();
        const stepQuery = `${promptText} - Step ${stepInput.step.stepId} [${stepInput.step.capability}]`;
        const commandPayload = globalPromptCompiler.compile(
          {
            intentType: intent.intentType,
            payload: {
              ...intent.payload,
              query: stepQuery,
              stepId: stepInput.step.stepId,
              stepInput: stepInput.input,
            },
            rawQuery: stepQuery,
          },
          contextDetails
        );

        const descriptor = discoveredSkills.find((d) => d.id === stepInput.step.skillId);
        commandPayload.payload.skillContext = globalPromptCompiler.assembleContext(
          'THE ONE SYSTEM RUNTIME',
          promptText,
          descriptor ? [descriptor] : [],
          [stepInput.instructions],
          [],
        );

        const dispatchResult = await globalCommandDispatcher.dispatch(
          commandPayload.commandName,
          'KernelRuntime',
          commandPayload.payload
        );

        if (!dispatchResult.success) {
          throw new Error(dispatchResult.error || dispatchResult.message || `Dispatch failed for ${stepInput.step.stepId}`);
        }

        return {
          result: dispatchResult.message || `Step ${stepInput.step.stepId} completed`,
          message: dispatchResult.message || `Step ${stepInput.step.stepId} executed`,
        };
      },
    });

    const executionRequest: CompositionExecutionRequest = {
      mission: promptText,
      intent: intent.intentType,
      availablePermissions,
      maxRisk,
      approvedStepIds: options?.approvedStepIds,
      guardEvidence: options?.guardEvidence,
    };

    // 7. Execute composition governed by CapabilityCompletionGuard
    const compositionResult = await executor.execute(contract, executionRequest);
    const { guardResult, missionComplete } = compositionResult;

    if (missionComplete) {
      const msg = `Plan completed successfully. ${guardResult.notification || 'All required capabilities and steps verified.'}`;
      globalConversationContext.addMessage('assistant', msg);
      return {
        status: 'completed',
        plan,
        message: msg,
        guardResult,
        compositionResult,
      };
    } else {
      const hasFailures = compositionResult.failedSteps.length > 0 || guardResult.status === 'FAILED';
      const isBlocked = !hasFailures && (guardResult.status === 'BLOCKED_CAPABILITY' || compositionResult.blockedSteps.length > 0);
      const status: 'blocked' | 'failed' = isBlocked ? 'blocked' : 'failed';
      const failedDetail = compositionResult.failedSteps.length > 0 ? `Step ${compositionResult.failedSteps.join(', ')} failed. ` : '';
      const reason = `${failedDetail}${guardResult.notification || (isBlocked ? `Step blocked or capability unverified (${guardResult.status}).` : `Completion guard unverified (${guardResult.status}).`)}`.trim();
      const msg = `Plan execution unverified. Status: ${guardResult.status}. ${reason}`.trim();
      globalConversationContext.addMessage('assistant', msg);
      return {
        status,
        plan,
        message: msg,
        guardResult,
        compositionResult,
      };
    }
  }
}

export const globalKernelRuntime = new KernelRuntime();
export default globalKernelRuntime;
