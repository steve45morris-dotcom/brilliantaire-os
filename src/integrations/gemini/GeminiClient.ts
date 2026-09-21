import { getGeminiConfig } from './GeminiConfig.js';

export interface GeminiResponseData {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  model: string;
  latencyMs: number;
}

export interface GeminiGenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: Record<string, any>;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface NormalizedGeminiError extends Error {
  code: string;
  statusCode: number;
  isTransient: boolean;
  details?: any;
}

export function normalizeGeminiError(error: any, statusCode: number = 500): NormalizedGeminiError {
  let code = 'GEMINI_UNKNOWN_ERROR';
  let message = error?.message || 'Unknown error during Gemini API request';
  let isTransient = false;

  if (statusCode === 400) {
    code = 'GEMINI_INVALID_ARGUMENT';
    message = `Invalid argument: ${message}`;
  } else if (statusCode === 401 || statusCode === 403) {
    code = 'GEMINI_AUTHENTICATION_ERROR';
    message = `Authentication failed: ${message}`;
  } else if (statusCode === 404) {
    code = 'GEMINI_MODEL_NOT_FOUND';
    message = `Requested model not found: ${message}`;
  } else if (statusCode === 429) {
    code = 'GEMINI_RATE_LIMITED';
    message = `Rate limit exceeded: ${message}`;
    isTransient = true;
  } else if (statusCode >= 500) {
    code = 'GEMINI_SERVER_ERROR';
    message = `Google Gemini server error (${statusCode}): ${message}`;
    isTransient = true;
  } else if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
    code = 'GEMINI_TIMEOUT';
    message = `Request timed out: ${message}`;
    isTransient = true;
  }

  const normalized = new Error(message) as NormalizedGeminiError;
  normalized.name = 'NormalizedGeminiError';
  normalized.code = code;
  normalized.statusCode = statusCode;
  normalized.isTransient = isTransient;
  normalized.details = error;
  return normalized;
}

export class GeminiClient {
  public async generateContent(
    model: string,
    prompt: string,
    options: GeminiGenerateOptions = {}
  ): Promise<GeminiResponseData> {
    const config = getGeminiConfig();
    if (!config.apiKey) {
      throw normalizeGeminiError(new Error('Gemini API key is not configured. Please set GEMINI_API_KEY.'), 401);
    }

    const cleanModel = model.replace('google/', '').replace('models/', '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${config.apiKey}`;

    const body: Record<string, any> = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: options.temperature ?? config.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? config.maxOutputTokens ?? 2048
      }
    };

    if (options.systemInstruction) {
      body.system_instruction = {
        parts: [{ text: options.systemInstruction }]
      };
    }

    if (options.responseMimeType) {
      body.generationConfig.responseMimeType = options.responseMimeType;
    } else if (options.responseSchema) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    if (options.responseSchema) {
      body.generationConfig.responseSchema = options.responseSchema;
    }

    const maxRetries = options.maxRetries ?? config.maxRetries ?? 3;
    const timeoutMs = options.timeoutMs ?? config.timeoutMs ?? 30000;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      const startTime = Date.now();
      attempt++;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs)
        });

        const latencyMs = Date.now() - startTime;

        if (!response.ok) {
          const errText = await response.text();
          let parsedError: any;
          try {
            parsedError = JSON.parse(errText);
          } catch {
            parsedError = { message: errText };
          }
          const normalized = normalizeGeminiError(
            new Error(parsedError?.error?.message || errText),
            response.status
          );

          if (normalized.isTransient && attempt <= maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }

          throw normalized;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || '';
        const finishReason = candidate?.finishReason;

        const meta = data.usageMetadata || {};
        const inputTokens = meta.promptTokenCount || 0;
        const outputTokens = meta.candidatesTokenCount || 0;
        const totalTokens = meta.totalTokenCount || (inputTokens + outputTokens);

        return {
          text,
          usage: { inputTokens, outputTokens, totalTokens },
          finishReason,
          model: cleanModel,
          latencyMs
        };
      } catch (err: any) {
        lastError = err;
        if (err.name === 'NormalizedGeminiError') {
          if (!err.isTransient || attempt > maxRetries) {
            throw err;
          }
        } else {
          const normalized = normalizeGeminiError(err, err.status || 500);
          if (!normalized.isTransient || attempt > maxRetries) {
            throw normalized;
          }
        }
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError || new Error('Gemini request failed after maximum retry attempts');
  }
}

export const globalGeminiClient = new GeminiClient();
export default globalGeminiClient;
