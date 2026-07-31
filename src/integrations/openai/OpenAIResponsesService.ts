import { OpenAIRequestPayload, OpenAIResponsePayload } from './OpenAITypes.js';
import { globalOpenAIClient } from './OpenAIClient.js';
import { OpenAICostEstimator } from './OpenAICostEstimator.js';
import { globalOpenAIUsageTracker } from './OpenAIUsageTracker.js';
import { OpenAIErrorMapper } from './OpenAIErrorMapper.js';
import { OpenAIEventMapper } from './OpenAIEventMapper.js';
import { OpenAIKnowledgeSync } from './OpenAIKnowledgeSync.js';
import { OpenAIRedaction } from './OpenAIRedaction.js';
import { OpenAIToolRegistry } from './OpenAIToolRegistry.js';
import { globalApprovalEngine } from '../../runtime/ApprovalEngine.js';
import { globalEyeStateManager } from '../../ui/eye/EyeStateManager.js';
import { globalPresenceStateManager } from '../../ui/supernova/PresenceStateManager.js';
import { getOpenAIConfig } from './OpenAIConfig.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class OpenAIResponsesService {
  public async executeRequest(payload: OpenAIRequestPayload): Promise<OpenAIResponsePayload> {
    const startTime = Date.now();
    const requestId = payload.requestId || `req-${Date.now()}`;
    const workspaceId = payload.workspaceId || 'default-workspace';

    // 1. Request received -> observing
    globalEyeStateManager.setState('observing');
    globalPresenceStateManager.setState('observing');

    // Check Budget limits
    const budgetCheck = globalOpenAIUsageTracker.checkBudgetExceeded();
    if (budgetCheck.exceeded) {
      const errReason = budgetCheck.reason || 'Spend limit exceeded.';
      OpenAIEventMapper.publishRequestFailed(requestId, payload.selectedModel, errReason);
      
      // 6. Failure -> error
      globalEyeStateManager.setState('error');
      globalPresenceStateManager.setState('error');

      return {
        success: false,
        requestId,
        provider: 'openai',
        model: payload.selectedModel,
        output: null,
        toolCalls: [],
        citations: [],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        latencyMs: Date.now() - startTime,
        status: 'failed',
        error: { code: 'budget_exceeded', message: errReason, retryable: false }
      };
    }

    // Check key configuration and run mock fallback if unconfigured
    if (!globalOpenAIClient.isConfigured()) {
      return this.runMockFallback(payload, requestId, startTime);
    }

    const openai = globalOpenAIClient.getRawClient()!;
    globalOpenAIUsageTracker.incrementConcurrency();

    let currentModel = payload.selectedModel;
    let attempts = 0;
    const maxAttempts = 2;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        // 2. Planning -> thinking
        globalEyeStateManager.setState('thinking');
        globalPresenceStateManager.setState('thinking');

        // Redact prompt for safety
        const safePrompt = OpenAIRedaction.redactText(payload.userIntent);

        const requestOptions: any = {
          model: currentModel,
          messages: [{ role: 'user', content: safePrompt }],
          max_tokens: payload.tokenLimit || 4096
        };

        // Add tool schemas if allowed
        if (payload.allowedTools && payload.allowedTools.length > 0) {
          requestOptions.tools = OpenAIToolRegistry.getToolsSchema().filter(t => 
            payload.allowedTools.includes(t.function.name)
          );
        }

        // Add structured schema if requested
        if (payload.outputSchema) {
          requestOptions.response_format = {
            type: 'json_object'
          };
        }

        const completion = await openai.chat.completions.create(requestOptions);
        
        // 5. Streaming response -> reporting
        globalEyeStateManager.setState('reporting');
        globalPresenceStateManager.setState('reporting');

        const choice = completion.choices[0];
        const text = choice.message.content || '';
        let structuredOutput: any = null;

        if (payload.outputSchema && text) {
          try {
            structuredOutput = JSON.parse(text);
          } catch (e) {
            console.warn('[OpenAIResponsesService] Failed to parse structured JSON output:', e);
          }
        }

        // Check tool calls
        const toolCalls: any[] = [];
        if (choice.message.tool_calls) {
          // 3. Tool execution -> executing
          globalEyeStateManager.setState('executing');
          globalPresenceStateManager.setState('executing');

          for (const tc of choice.message.tool_calls) {
            const tcAny = tc as any;
            const tool = OpenAIToolRegistry.getTool(tcAny.function.name);
            if (tool) {
              // Check if tool requires approval
              if (tool.requiresApproval && payload.approvalStatus !== 'approved') {
                globalOpenAIUsageTracker.decrementConcurrency();
                
                // 4. Approval needed -> waiting
                globalEyeStateManager.setState('waiting');
                globalPresenceStateManager.setState('waiting');

                // Trigger approval engine request
                globalApprovalEngine.requestApproval({
                  steps: [{ index: 1, description: `Execute OpenAI tool: ${tool.name}`, skill: tool.name }],
                  estimatedDurationSeconds: 10,
                  approvalRequired: true,
                  retryPolicy: { retries: 1, backoffMs: 1000 },
                  intentType: 'unknown'
                });

                return {
                  success: true,
                  requestId,
                  provider: 'openai',
                  model: currentModel,
                  output: { message: `Execution halted. Approval is required before continuing tool run: ${tool.name}` },
                  toolCalls: [{ id: tcAny.id, name: tcAny.function.name, arguments: tcAny.function.arguments }],
                  citations: [],
                  usage: {
                    inputTokens: completion.usage?.prompt_tokens,
                    outputTokens: completion.usage?.completion_tokens,
                    totalTokens: completion.usage?.total_tokens
                  },
                  latencyMs: Date.now() - startTime,
                  status: 'approval-required'
                };
              }

              // Execute safe or approved tool
              const result = await OpenAIToolRegistry.executeTool(tcAny.function.name, JSON.parse(tcAny.function.arguments));
              toolCalls.push({
                toolName: tcAny.function.name,
                arguments: tcAny.function.arguments,
                result
              });

              // Log tool usage in graph
              OpenAIKnowledgeSync.syncToolAccessToGraph(requestId, tcAny.function.name, `resource-${tcAny.function.name}`);
            }
          }
        }

        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;
        const cost = OpenAICostEstimator.estimateCost(currentModel, inputTokens, outputTokens);

        globalOpenAIUsageTracker.recordRequest(true, cost);
        globalOpenAIUsageTracker.decrementConcurrency();

        // Publish success
        OpenAIEventMapper.publishRequestCompleted(requestId, currentModel, inputTokens + outputTokens, cost);

        // Sync trace to Knowledge Graph
        OpenAIKnowledgeSync.syncRequestToGraph(requestId, currentModel, 'project-openai', workspaceId);

        // 7. Completed -> idle
        globalEyeStateManager.setState('idle');
        globalPresenceStateManager.setState('idle');

        return {
          success: true,
          requestId,
          provider: 'openai',
          model: currentModel,
          output: choice.message,
          text,
          structuredOutput,
          toolCalls,
          citations: [],
          usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
          latencyMs: Date.now() - startTime,
          estimatedCost: cost,
          status: 'completed'
        };

      } catch (e) {
        lastError = e;
        console.warn(`[OpenAIResponsesService] Attempt ${attempts} failed for model ${currentModel}. Error: ${(e as Error).message}`);

        if (attempts < maxAttempts) {
          const config = getOpenAIConfig();
          const fallbackModel = currentModel === config.reasoningModel ? config.defaultModel : config.fastModel;
          console.warn(`[OpenAIResponsesService] Falling back from ${currentModel} to ${fallbackModel}.`);
          globalEventBus.publish('ModelFallbackActive', { originalModel: currentModel, fallbackModel });
          currentModel = fallbackModel;
        }
      }
    }

    globalOpenAIUsageTracker.recordRequest(false, 0.0);
    globalOpenAIUsageTracker.decrementConcurrency();

    // 6. Failure -> error
    globalEyeStateManager.setState('error');
    globalPresenceStateManager.setState('error');

    const safeErr = OpenAIErrorMapper.mapError(lastError);
    OpenAIEventMapper.publishRequestFailed(requestId, currentModel, safeErr.message);

    return {
      success: false,
      requestId,
      provider: 'openai',
      model: payload.selectedModel,
      output: null,
      toolCalls: [],
      citations: [],
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      latencyMs: Date.now() - startTime,
      status: 'failed',
      error: safeErr
    };
  }

  private runMockFallback(payload: OpenAIRequestPayload, requestId: string, startTime: number): OpenAIResponsePayload {
    const text = `[Mock Fallback Output] Received intent: "${payload.userIntent}". openai API key is absent. Operating in disconnected fallback mode.`;
    let structuredOutput: any = null;

    if (payload.outputSchema) {
      structuredOutput = {
        message: 'Mock Structured Output',
        intentParsed: payload.userIntent,
        status: 'disconnected'
      };
    }

    const inputTokens = 120;
    const outputTokens = 85;
    const cost = OpenAICostEstimator.estimateCost(payload.selectedModel, inputTokens, outputTokens);

    globalOpenAIUsageTracker.recordRequest(true, cost);

    // Sync trace to Knowledge Graph
    OpenAIKnowledgeSync.syncRequestToGraph(requestId, payload.selectedModel, 'project-openai', payload.workspaceId || 'default-workspace');
    OpenAIEventMapper.publishRequestCompleted(requestId, payload.selectedModel, inputTokens + outputTokens, cost);

    // Settle eye back to idle
    globalEyeStateManager.setState('idle');
    globalPresenceStateManager.setState('idle');

    return {
      success: true,
      requestId,
      provider: 'openai',
      model: payload.selectedModel,
      output: { role: 'assistant', content: text },
      text,
      structuredOutput,
      toolCalls: [],
      citations: [],
      usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
      latencyMs: Date.now() - startTime,
      estimatedCost: cost,
      status: 'completed'
    };
  }
}

export const globalOpenAIResponsesService = new OpenAIResponsesService();
export default globalOpenAIResponsesService;
