import { globalIntentParser } from './IntentParser.js';
import { globalPlanner, ExecutionPlan } from './Planner.js';
import { globalApprovalEngine, ApprovalRequest } from './ApprovalEngine.js';
import { globalConversationContext } from './ConversationContext.js';
import { globalPromptCompiler } from './PromptCompiler.js';
import { globalCommandDispatcher } from '../kernel/dispatcher/CommandDispatcher.js';
import { globalEventBus } from '../kernel/events/EventBus.js';
import { globalModelRouter } from '../integrations/core/ModelRouter.js';

export interface RuntimeExecutionResult {
  status: 'completed' | 'pending_approval' | 'failed';
  plan: ExecutionPlan;
  approvalRequest?: ApprovalRequest;
  message: string;
}

export class SupernovaRuntime {
  constructor() {
    try {
      globalCommandDispatcher.registerHandler('Generic Command', async (cmd) => {
        const query = cmd.payload.query;
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
    } catch (e) {
      // Catch already registered handler errors in reboot or hot-reload contexts
    }
  }

  public async handlePrompt(promptText: string): Promise<RuntimeExecutionResult> {
    globalConversationContext.addMessage('user', promptText);
    globalEventBus.publish('SupernovaPromptReceived', { promptText });

    // 1. Intent Parsing
    const intent = globalIntentParser.parse(promptText);

    // 2. Planning
    const plan = globalPlanner.generatePlan(intent);

    // 3. Approval Check
    if (plan.approvalRequired) {
      const approvalRequest = globalApprovalEngine.requestApproval(plan);
      globalConversationContext.addMessage('assistant', `The requested action "${promptText}" requires authorization before proceeding.`);
      return {
        status: 'pending_approval',
        plan,
        approvalRequest,
        message: 'Action queued pending operational approval.'
      };
    }

    // 4. Prompt Compilation to Kernel Command
    const contextDetails = globalConversationContext.getContextDetails();
    const commandPayload = globalPromptCompiler.compile(intent, contextDetails);

    // 5. Dispatch via Kernel
    const dispatchResult = await globalCommandDispatcher.dispatch(
      commandPayload.commandName,
      'SupernovaRuntime',
      commandPayload.payload
    );

    if (dispatchResult.success) {
      const msg = `Plan completed successfully. ${dispatchResult.message}`;
      globalConversationContext.addMessage('assistant', msg);
      return { status: 'completed', plan, message: msg };
    } else {
      const msg = `Plan execution failed. Error: ${dispatchResult.error}`;
      globalConversationContext.addMessage('assistant', msg);
      return { status: 'failed', plan, message: msg };
    }
  }
}

export const globalSupernovaRuntime = new SupernovaRuntime();
export default globalSupernovaRuntime;
