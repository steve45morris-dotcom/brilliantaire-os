export interface GeminiConfig {
  apiKey: string;
  defaultModel: string;
  fastModel: string;
  reasoningModel: string;
  dailyLimit: number;
  monthlyLimit: number;
  timeoutMs: number;
  maxRetries: number;
  maxOutputTokens: number;
  temperature: number;
  allowGoogleAlias: boolean;
}

export interface KeyValidationResult {
  valid: boolean;
  message: string;
  warning?: boolean;
}

export function validateGeminiKey(key?: string): KeyValidationResult {
  if (!key || key === 'unconfigured') {
    return { valid: false, message: 'No API key provided.' };
  }
  if (key.startsWith('sk-')) {
    return { valid: false, message: 'OpenAI API key detected in Gemini configuration. Provider isolation violation.' };
  }
  if (!key.startsWith('AIza')) {
    return { 
      valid: true, 
      message: 'Key prefix does not match expected AIza prefix.', 
      warning: true 
    };
  }
  if (key.length < 30) {
    return { valid: false, message: 'Key is too short to be a valid Gemini API key.' };
  }
  return { valid: true, message: 'Gemini API key structure is valid.' };
}

export function getGeminiConfig(): GeminiConfig {
  const allowGoogleAlias = process.env.ALLOW_GOOGLE_API_KEY_FOR_GEMINI === 'true';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const googleKey = allowGoogleAlias ? (process.env.GOOGLE_API_KEY || '') : '';
  const apiKey = geminiKey || googleKey;

  const parsedTimeout = parseInt(process.env.GEMINI_TIMEOUT_MS || '30000', 10);
  const timeoutMs = isNaN(parsedTimeout) || parsedTimeout <= 0 ? 30000 : parsedTimeout;

  const parsedRetries = parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10);
  const maxRetries = isNaN(parsedRetries) || parsedRetries < 0 ? 3 : parsedRetries;

  const parsedDaily = parseFloat(process.env.GEMINI_DAILY_LIMIT || '10.00');
  const dailyLimit = isNaN(parsedDaily) || parsedDaily < 0 ? 10.00 : parsedDaily;

  const parsedMonthly = parseFloat(process.env.GEMINI_MONTHLY_LIMIT || '');
  const monthlyLimit = isNaN(parsedMonthly) || parsedMonthly < 0 ? dailyLimit * 30 : parsedMonthly;

  const parsedTokens = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '2048', 10);
  const maxOutputTokens = isNaN(parsedTokens) || parsedTokens <= 0 ? 2048 : parsedTokens;

  const parsedTemp = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
  const temperature = isNaN(parsedTemp) || parsedTemp < 0 || parsedTemp > 2.0 ? 0.7 : parsedTemp;

  return {
    apiKey,
    defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash',
    fastModel: process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash',
    reasoningModel: process.env.GEMINI_REASONING_MODEL || 'gemini-2.5-pro',
    dailyLimit,
    monthlyLimit,
    timeoutMs,
    maxRetries,
    maxOutputTokens,
    temperature,
    allowGoogleAlias
  };
}

import { maskAPIKey } from '../core/SecretMasker.js';

export function redactGeminiToken(token?: string): string {
  return maskAPIKey('GEMINI_API_KEY', token || null);
}

export interface GeminiEnvironmentDiagnostics {
  configured: boolean;
  apiKeyPresent: boolean;
  maskedKey: string;
  defaultModel: string;
  fastModel: string;
  reasoningModel: string;
  dailyLimit: number;
  monthlyLimit: number;
  timeoutMs: number;
  maxRetries: number;
  maxOutputTokens: number;
  temperature: number;
  allowGoogleAlias: boolean;
  validation: KeyValidationResult;
}

export function getGeminiDiagnostics(): GeminiEnvironmentDiagnostics {
  const config = getGeminiConfig();
  const validation = validateGeminiKey(config.apiKey);
  return {
    configured: validation.valid && !!config.apiKey,
    apiKeyPresent: !!config.apiKey && config.apiKey !== 'unconfigured',
    maskedKey: redactGeminiToken(config.apiKey),
    defaultModel: config.defaultModel,
    fastModel: config.fastModel,
    reasoningModel: config.reasoningModel,
    dailyLimit: config.dailyLimit,
    monthlyLimit: config.monthlyLimit,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    maxOutputTokens: config.maxOutputTokens,
    temperature: config.temperature,
    allowGoogleAlias: config.allowGoogleAlias,
    validation
  };
}

