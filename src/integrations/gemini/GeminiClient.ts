import { getGeminiConfig } from './GeminiConfig.js';

export interface GeminiResponseData {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export class GeminiClient {
  public async generateContent(
    model: string,
    prompt: string,
    generationConfig: Record<string, any> = {}
  ): Promise<GeminiResponseData> {
    const config = getGeminiConfig();
    if (!config.apiKey) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY.');
    }

    const cleanModel = model.replace('google/', ''); // strip namespace if present
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${config.apiKey}`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: generationConfig.temperature ?? 0.7,
        maxOutputTokens: generationConfig.maxOutputTokens ?? 2048,
        ...generationConfig
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (HTTP ${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    
    const meta = data.usageMetadata || {};
    const inputTokens = meta.promptTokenCount || 0;
    const outputTokens = meta.candidatesTokenCount || 0;
    const totalTokens = meta.totalTokenCount || 0;

    return {
      text,
      usage: { inputTokens, outputTokens, totalTokens }
    };
  }
}

export const globalGeminiClient = new GeminiClient();
export default globalGeminiClient;
