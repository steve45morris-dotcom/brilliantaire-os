export interface OpenAIConfig {
  apiKey: string;
  defaultModel: string;
  reasoningModel: string;
  fastModel: string;
  realtimeModel: string;
  embeddingModel: string;
  maxOutputTokens: number;
  requestTimeoutMs: number;
  monthlyBudgetLimit: number;
  dailyBudgetLimit: number;
  enableWebSearch: boolean;
  enableFileSearch: boolean;
  enableImageGeneration: boolean;
  enableRealtime: boolean;
  enableAgentsSdk: boolean;
  enableMcp: boolean;
}

export function getOpenAIConfig(): OpenAIConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
    reasoningModel: process.env.OPENAI_REASONING_MODEL || 'o3-mini',
    fastModel: process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini',
    realtimeModel: process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    maxOutputTokens: parseInt(process.env.OPENAI_MAX_OUTPUT_TOKENS || '4096', 10),
    requestTimeoutMs: parseInt(process.env.OPENAI_REQUEST_TIMEOUT_MS || '30000', 10),
    monthlyBudgetLimit: parseFloat(process.env.OPENAI_MONTHLY_BUDGET_LIMIT || '50.0'),
    dailyBudgetLimit: parseFloat(process.env.OPENAI_DAILY_BUDGET_LIMIT || '5.0'),
    enableWebSearch: process.env.OPENAI_ENABLE_WEB_SEARCH === 'true',
    enableFileSearch: process.env.OPENAI_ENABLE_FILE_SEARCH === 'true',
    enableImageGeneration: process.env.OPENAI_ENABLE_IMAGE_GENERATION === 'true',
    enableRealtime: process.env.OPENAI_ENABLE_REALTIME === 'true',
    enableAgentsSdk: process.env.OPENAI_ENABLE_AGENTS_SDK === 'true',
    enableMcp: process.env.OPENAI_ENABLE_MCP === 'true'
  };
}

export function validateOpenAIKey(key?: string): { valid: boolean; message: string; warning?: boolean } {
  if (!key || key === 'unconfigured') {
    return { valid: false, message: 'No API key provided.' };
  }
  if (key.startsWith('AIza')) {
    return { valid: false, message: 'Gemini/Google API key detected in OpenAI configuration. Provider isolation violation.' };
  }
  if (!key.startsWith('sk-')) {
    return { 
      valid: true, 
      message: 'Key prefix does not match expected sk- prefix.', 
      warning: true 
    };
  }
  if (key.length < 20) {
    return { valid: false, message: 'Key is too short to be a valid OpenAI API key.' };
  }
  return { valid: true, message: 'OpenAI API key structure is valid.' };
}

import { maskAPIKey } from '../core/SecretMasker.js';

export function redactOpenAIToken(token?: string): string {
  return maskAPIKey('OPENAI_API_KEY', token || null);
}

