export interface GeminiConfig {
  apiKey: string;
  defaultModel: string;
  fastModel: string;
  reasoningModel: string;
  dailyLimit: number;
}

export function validateGeminiKey(key?: string): { valid: boolean; message: string; warning?: boolean } {
  if (!key) {
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

  return {
    apiKey,
    defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash',
    fastModel: process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash',
    reasoningModel: process.env.GEMINI_REASONING_MODEL || 'gemini-2.5-pro',
    dailyLimit: parseFloat(process.env.GEMINI_DAILY_LIMIT || '10.00')
  };
}

import { maskAPIKey } from '../core/SecretMasker.js';

export function redactGeminiToken(token?: string): string {
  return maskAPIKey('GEMINI_API_KEY', token || null);
}

