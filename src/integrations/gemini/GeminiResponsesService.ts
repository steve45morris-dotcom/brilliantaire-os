import { globalGeminiClient } from './GeminiClient.js';
import { getGeminiConfig } from './GeminiConfig.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalEyeStateManager } from '../../ui/eye/EyeStateManager.js';
import { globalPresenceStateManager } from '../../ui/supernova/PresenceStateManager.js';

export interface GeminiRequestPayload {
  requestId?: string;
  selectedModel: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  workspaceId?: string;
}

export interface GeminiResponsePayload {
  success: boolean;
  requestId: string;
  provider: string;
  model: string;
  output: { message: string } | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  status: 'completed' | 'failed';
  error?: {
    code: string;
    message: string;
  };
}

export class GeminiResponsesService {
  public async executeRequest(payload: GeminiRequestPayload): Promise<GeminiResponsePayload> {
    const startTime = Date.now();
    const requestId = payload.requestId || `req-${Date.now()}`;
    const modelName = payload.selectedModel || 'gemini-1.5-pro';

    globalEyeStateManager.setState('observing');
    globalPresenceStateManager.setState('observing');
    globalEventBus.publish('GeminiRequestStarted', { requestId, model: modelName });

    try {
      // Transition UI to executing
      globalEyeStateManager.setState('thinking');
      globalPresenceStateManager.setState('executing');

      const response = await globalGeminiClient.generateContent(
        modelName,
        payload.prompt,
        {
          temperature: payload.temperature,
          maxOutputTokens: payload.maxOutputTokens
        }
      );

      const latencyMs = Date.now() - startTime;
      globalEventBus.publish('GeminiRequestCompleted', {
        requestId,
        model: modelName,
        latencyMs,
        usage: response.usage
      });

      globalEyeStateManager.setState('idle');
      globalPresenceStateManager.setState('idle');

      return {
        success: true,
        requestId,
        provider: 'gemini',
        model: modelName,
        output: { message: response.text },
        usage: response.usage,
        latencyMs,
        status: 'completed'
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const errMsg = (err as Error).message;

      globalEventBus.publish('GeminiRequestFailed', {
        requestId,
        model: modelName,
        error: errMsg
      });

      globalEyeStateManager.setState('error');
      globalPresenceStateManager.setState('error');

      return {
        success: false,
        requestId,
        provider: 'gemini',
        model: modelName,
        output: null,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        latencyMs,
        status: 'failed',
        error: {
          code: 'gemini_error',
          message: errMsg
        }
      };
    }
  }
}

export const globalGeminiResponsesService = new GeminiResponsesService();
export default globalGeminiResponsesService;
