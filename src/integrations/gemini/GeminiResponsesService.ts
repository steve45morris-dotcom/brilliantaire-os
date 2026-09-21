import { globalGeminiClient, NormalizedGeminiError } from './GeminiClient.js';
import { getGeminiConfig } from './GeminiConfig.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalEyeStateManager } from '../../ui/eye/EyeStateManager.js';
import { globalPresenceStateManager } from '../../ui/supernova/PresenceStateManager.js';

export interface GeminiRequestPayload {
  requestId?: string;
  selectedModel: string;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, any>;
  timeoutMs?: number;
  maxRetries?: number;
  workspaceId?: string;
}

export interface GeminiResponsePayload {
  success: boolean;
  requestId: string;
  provider: string;
  model: string;
  output: { message: string; data?: any } | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  finishReason?: string;
  status: 'completed' | 'failed';
  error?: {
    code: string;
    message: string;
    statusCode?: number;
    isTransient?: boolean;
  };
}

export class GeminiResponsesService {
  public async executeRequest(payload: GeminiRequestPayload): Promise<GeminiResponsePayload> {
    const startTime = Date.now();
    const requestId = payload.requestId || `req-${Date.now()}`;
    const config = getGeminiConfig();
    const modelName = payload.selectedModel || config.defaultModel || 'gemini-2.5-flash';

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
          maxOutputTokens: payload.maxOutputTokens,
          systemInstruction: payload.systemInstruction,
          responseMimeType: payload.responseMimeType,
          responseSchema: payload.responseSchema,
          timeoutMs: payload.timeoutMs,
          maxRetries: payload.maxRetries
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

      let parsedData: any = undefined;
      if (payload.responseMimeType === 'application/json' || payload.responseSchema) {
        try {
          parsedData = JSON.parse(response.text);
        } catch {
          // If JSON parse fails, preserve text output without hard crash
        }
      }

      return {
        success: true,
        requestId,
        provider: 'gemini',
        model: modelName,
        output: { message: response.text, data: parsedData },
        usage: response.usage,
        finishReason: response.finishReason,
        latencyMs,
        status: 'completed'
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const errMsg = err?.message || 'Unknown Gemini error';
      const errCode = (err as NormalizedGeminiError)?.code || 'GEMINI_EXECUTION_FAILED';
      const statusCode = (err as NormalizedGeminiError)?.statusCode || 500;
      const isTransient = (err as NormalizedGeminiError)?.isTransient ?? false;

      globalEventBus.publish('GeminiRequestFailed', {
        requestId,
        model: modelName,
        error: errMsg,
        code: errCode
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
          code: errCode,
          message: errMsg,
          statusCode,
          isTransient
        }
      };
    }
  }
}

export const globalGeminiResponsesService = new GeminiResponsesService();
export default globalGeminiResponsesService;
