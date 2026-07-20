import { getOpenAIConfig } from './OpenAIConfig.js';
import { globalOpenAIClient } from './OpenAIClient.js';
import { OpenAIEventMapper } from './OpenAIEventMapper.js';

export interface EphemeralSessionTokenResponse {
  success: boolean;
  token?: string;
  url?: string;
  error?: string;
}

export class OpenAIRealtimeService {
  public async createEphemeralSession(voiceTone = 'alloy'): Promise<EphemeralSessionTokenResponse> {
    const config = getOpenAIConfig();

    if (!config.enableRealtime) {
      return { success: false, error: 'OpenAI Realtime feature flag is currently disabled.' };
    }

    if (!globalOpenAIClient.isConfigured()) {
      return { success: false, error: 'OpenAI API key is unconfigured. Ephemeral session unavailable.' };
    }

    try {
      // Ephemeral token creation call as defined by OpenAI Realtime WebAPI
      // POST https://api.openai.com/v1/realtime/sessions
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.realtimeModel,
          voice: voiceTone,
          instructions: 'You are the voice of The One System OS. Keep responses concise and structured.'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI Realtime Session creation failed: ${errorText}`);
      }

      const data = await response.json();
      
      // Publish event
      OpenAIEventMapper.publishRealtimeSessionStarted(data.client_secret?.value || 'unknown');

      return {
        success: true,
        token: data.client_secret?.value,
        url: 'wss://api.openai.com/v1/realtime'
      };
    } catch (e) {
      const err = e as Error;
      return {
        success: false,
        error: `Failed to create ephemeral credentials: ${err.message}`
      };
    }
  }
}

export const globalOpenAIRealtimeService = new OpenAIRealtimeService();
export default globalOpenAIRealtimeService;
