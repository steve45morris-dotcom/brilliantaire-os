import { OpenAI } from 'openai';
import { getOpenAIConfig, validateOpenAIKey } from './OpenAIConfig.js';

export class OpenAIClient {
  private client: OpenAI | null = null;

  constructor() {
    const config = getOpenAIConfig();
    const validation = validateOpenAIKey(config.apiKey);
    if (validation.valid) {
      try {
        this.client = new OpenAI({
          apiKey: config.apiKey,
          timeout: config.requestTimeoutMs
        });
      } catch (e) {
        console.warn('[OpenAIClient] Failed to initialize official SDK:', e);
      }
    }
  }

  public getRawClient(): OpenAI | null {
    return this.client;
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }
}

export const globalOpenAIClient = new OpenAIClient();
export default globalOpenAIClient;
