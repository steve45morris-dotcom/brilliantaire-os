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

export type ErrorCategory =
  | 'authentication'
  | 'configuration'
  | 'rate-limit'
  | 'timeout'
  | 'network'
  | 'provider-unavailable'
  | 'streaming'
  | 'execution'
  | 'cancellation'
  | 'unknown';

export interface NormalizedGeminiError extends Error {
  code: string;
  statusCode: number;
  isTransient: boolean;
  category: ErrorCategory;
  details?: any;
  partialOutput?: string;
}

export function normalizeGeminiError(error: any, statusCode: number = 500): NormalizedGeminiError {
  let code = 'GEMINI_UNKNOWN_ERROR';
  let message = error?.message || 'Unknown error during Gemini API request';
  let isTransient = false;
  let category: ErrorCategory = 'unknown';

  if (error?.name === 'TimeoutError' || statusCode === 408 || message.toLowerCase().includes('timeout') || message.toLowerCase().includes('deadline')) {
    code = 'GEMINI_TIMEOUT';
    message = `Request timed out: ${message}`;
    category = 'timeout';
    isTransient = true;
  } else if (error?.name === 'AbortError' || message.toLowerCase().includes('abort') || message.toLowerCase().includes('cancel')) {
    code = 'GEMINI_CANCELLED';
    message = `Request cancelled: ${message}`;
    category = 'cancellation';
    isTransient = false;
  } else if (statusCode === 400) {
    code = 'GEMINI_INVALID_ARGUMENT';
    message = `Invalid argument: ${message}`;
    category = 'configuration';
    isTransient = false;
  } else if (statusCode === 401 || statusCode === 403) {
    code = 'GEMINI_AUTHENTICATION_ERROR';
    message = `Authentication failed: ${message}`;
    category = 'authentication';
    isTransient = false;
  } else if (statusCode === 404) {
    code = 'GEMINI_MODEL_NOT_FOUND';
    message = `Requested model not found: ${message}`;
    category = 'configuration';
    isTransient = false;
  } else if (statusCode === 429) {
    code = 'GEMINI_RATE_LIMITED';
    message = `Rate limit exceeded: ${message}`;
    category = 'rate-limit';
    isTransient = true;
  } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || message.toLowerCase().includes('enotfound') || message.toLowerCase().includes('fetch failed')) {
    code = 'GEMINI_NETWORK_ERROR';
    message = `Network connectivity failed: ${message}`;
    category = 'network';
    isTransient = true;
  } else if (/\bstream(ing)?\b/i.test(message) || /\bchunk(s)?\b/i.test(message)) {
    code = 'GEMINI_STREAMING_ERROR';
    category = 'streaming';
    isTransient = false;
  } else if (statusCode >= 500 && statusCode < 600) {
    code = 'GEMINI_SERVER_ERROR';
    message = `Google Gemini server error (${statusCode}): ${message}`;
    category = 'provider-unavailable';
    isTransient = true;
  } else {
    category = 'execution';
  }

  const normalized = new Error(message) as NormalizedGeminiError;
  normalized.name = 'NormalizedGeminiError';
  normalized.code = code;
  normalized.statusCode = statusCode;
  normalized.isTransient = isTransient;
  normalized.category = category;
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
            const baseBackoff = process.env.NODE_ENV === 'test' ? 10 : 1000;
            const backoffMs = Math.min(baseBackoff * Math.pow(2, attempt - 1), 8000);
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
        const baseBackoff = process.env.NODE_ENV === 'test' ? 10 : 1000;
        const backoffMs = Math.min(baseBackoff * Math.pow(2, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError || new Error('Gemini request failed after maximum retry attempts');
  }

  public async streamContent(
    model: string,
    prompt: string,
    options: GeminiStreamOptions = {}
  ): Promise<GeminiStreamResult> {
    const config = getGeminiConfig();
    if (!config.apiKey) {
      throw normalizeGeminiError(new Error('Gemini API key is not configured. Please set GEMINI_API_KEY.'), 401);
    }

    const cleanModel = model.replace('google/', '').replace('models/', '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

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

    const maxRetries = options.maxRetries ?? config.maxRetries ?? 3;
    const timeoutMs = options.timeoutMs ?? config.timeoutMs ?? 30000;
    let attempt = 0;
    let lastError: any = null;
    let chunksEmitted = 0;
    let accumulatedText = '';
    const collectedChunks: GeminiStreamChunk[] = [];

    while (attempt <= maxRetries) {
      const startTime = Date.now();
      attempt++;

      // Check cancellation upfront
      if (options.signal?.aborted) {
        const cancelErr = normalizeGeminiError(new Error('Stream aborted by caller'), 499);
        cancelErr.partialOutput = accumulatedText;
        throw cancelErr;
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: options.signal || AbortSignal.timeout(timeoutMs)
        });

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

          // Only retry if zero chunks have been emitted to the consumer
          if (normalized.isTransient && attempt <= maxRetries && chunksEmitted === 0) {
            const baseBackoff = process.env.NODE_ENV === 'test' ? 10 : 1000;
            const backoffMs = Math.min(baseBackoff * Math.pow(2, attempt - 1), 8000);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }

          normalized.partialOutput = accumulatedText;
          throw normalized;
        }

        let inputTokens = 0;
        let outputTokens = 0;
        let finishReason = 'STOP';

        const processRawJsonData = (data: any) => {
          if (!data) return;
          const candidate = data.candidates?.[0];
          const partText = candidate?.content?.parts?.[0]?.text ?? '';
          if (candidate?.finishReason) {
            finishReason = candidate.finishReason;
          }
          if (data.usageMetadata) {
            inputTokens = data.usageMetadata.promptTokenCount || inputTokens;
            outputTokens = data.usageMetadata.candidatesTokenCount || outputTokens;
          }

          const chunk: GeminiStreamChunk = {
            text: partText,
            index: chunksEmitted++,
            finishReason: candidate?.finishReason,
            isFinal: candidate?.finishReason === 'STOP'
          };
          accumulatedText += partText;
          collectedChunks.push(chunk);
          if (options.onChunk) {
            options.onChunk(chunk);
          }
        };

        // Handle streaming response body
        if (response.body && typeof (response.body as any).getReader === 'function') {
          const reader = (response.body as any).getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              if (options.signal?.aborted) {
                const cancelErr = normalizeGeminiError(new Error('Stream aborted by caller'), 499);
                cancelErr.partialOutput = accumulatedText;
                throw cancelErr;
              }

              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(':')) continue;
                if (trimmed.startsWith('data: ')) {
                  const jsonStr = trimmed.slice(6);
                  try {
                    const parsed = JSON.parse(jsonStr);
                    processRawJsonData(parsed);
                  } catch {
                    const stErr = normalizeGeminiError(new Error(`Failed to parse SSE data: ${jsonStr}`), 500);
                    stErr.partialOutput = accumulatedText;
                    throw stErr;
                  }
                }
              }
            }
          } catch (streamReadErr: any) {
            const normalizedStreamErr = streamReadErr.name === 'NormalizedGeminiError' 
              ? streamReadErr 
              : normalizeGeminiError(streamReadErr, 500);
            normalizedStreamErr.partialOutput = accumulatedText;
            throw normalizedStreamErr;
          }
        } else if (response.body && Symbol.asyncIterator in (response.body as any)) {
          const decoder = new TextDecoder();
          let buffer = '';
          try {
            for await (const rawChunk of (response.body as any)) {
              if (options.signal?.aborted) {
                const cancelErr = normalizeGeminiError(new Error('Stream aborted by caller'), 499);
                cancelErr.partialOutput = accumulatedText;
                throw cancelErr;
              }
              const chunkStr = typeof rawChunk === 'string' ? rawChunk : decoder.decode(rawChunk, { stream: true });
              buffer += chunkStr;
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                  const jsonStr = trimmed.slice(6);
                  processRawJsonData(JSON.parse(jsonStr));
                }
              }
            }
          } catch (iterErr: any) {
            const normalizedIterErr = iterErr.name === 'NormalizedGeminiError'
              ? iterErr
              : normalizeGeminiError(iterErr, 500);
            normalizedIterErr.partialOutput = accumulatedText;
            throw normalizedIterErr;
          }
        } else {
          const data = await response.json();
          if (Array.isArray(data)) {
            for (const item of data) {
              if (options.signal?.aborted) {
                const cancelErr = normalizeGeminiError(new Error('Stream aborted by caller'), 499);
                cancelErr.partialOutput = accumulatedText;
                throw cancelErr;
              }
              processRawJsonData(item);
            }
          } else {
            processRawJsonData(data);
          }
        }

        const latencyMs = Date.now() - startTime;
        const totalTokens = (inputTokens + outputTokens) || accumulatedText.length;

        return {
          text: accumulatedText,
          chunks: collectedChunks,
          usage: { inputTokens, outputTokens, totalTokens },
          finishReason,
          model: cleanModel,
          latencyMs,
          completed: true
        };
      } catch (err: any) {
        lastError = err;
        // Never retry if chunks have already been emitted to consumer (prevent token duplication)
        if (chunksEmitted > 0) {
          if (err.name === 'NormalizedGeminiError') {
            err.partialOutput = accumulatedText;
            throw err;
          }
          const normalized = normalizeGeminiError(err, err.status || 500);
          normalized.partialOutput = accumulatedText;
          throw normalized;
        }

        if (err.name === 'NormalizedGeminiError') {
          if (!err.isTransient || attempt > maxRetries) {
            err.partialOutput = accumulatedText;
            throw err;
          }
        } else {
          const normalized = normalizeGeminiError(err, err.status || 500);
          if (!normalized.isTransient || attempt > maxRetries) {
            normalized.partialOutput = accumulatedText;
            throw normalized;
          }
        }
        const baseBackoff = process.env.NODE_ENV === 'test' ? 10 : 1000;
        const backoffMs = Math.min(baseBackoff * Math.pow(2, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    const finalErr = lastError ? (lastError.name === 'NormalizedGeminiError' ? lastError : normalizeGeminiError(lastError, 500)) : normalizeGeminiError(new Error('Streaming failed after max retries'), 500);
    finalErr.partialOutput = accumulatedText;
    throw finalErr;
  }
}

export interface GeminiStreamChunk {
  text: string;
  index: number;
  finishReason?: string;
  isFinal?: boolean;
}

export interface GeminiStreamOptions extends GeminiGenerateOptions {
  onChunk?: (chunk: GeminiStreamChunk) => void;
  signal?: AbortSignal;
}

export interface GeminiStreamResult {
  text: string;
  chunks: GeminiStreamChunk[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  model: string;
  latencyMs: number;
  completed: boolean;
}

export const globalGeminiClient = new GeminiClient();
export default globalGeminiClient;
