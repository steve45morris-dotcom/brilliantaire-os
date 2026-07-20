import { getOpenAIConfig } from './OpenAIConfig.js';

export type OpenAIModelRole =
  | 'default'
  | 'fast'
  | 'reasoning'
  | 'coding'
  | 'research'
  | 'verification'
  | 'structured-output'
  | 'voice'
  | 'image';

export class OpenAIModelRegistry {
  public static getModelForRole(role: OpenAIModelRole): string {
    const config = getOpenAIConfig();
    switch (role) {
      case 'fast':
        return config.fastModel;
      case 'reasoning':
        return config.reasoningModel;
      case 'coding':
        return config.reasoningModel; // Reasoning or default can code
      case 'verification':
        return config.defaultModel;
      case 'voice':
        return config.realtimeModel;
      case 'image':
        return 'dall-e-3';
      case 'research':
        return config.defaultModel;
      case 'structured-output':
        return config.defaultModel;
      default:
        return config.defaultModel;
    }
  }

  public static routeTask(taskDescription: string): OpenAIModelRole {
    const desc = taskDescription.toLowerCase();
    if (desc.includes('ui assistance') || desc.includes('simple') || desc.includes('chat')) {
      return 'fast';
    }
    if (desc.includes('plan') || desc.includes('reason') || desc.includes('complex')) {
      return 'reasoning';
    }
    if (desc.includes('code') || desc.includes('program') || desc.includes('compile')) {
      return 'coding';
    }
    if (desc.includes('verify') || desc.includes('test') || desc.includes('lint') || desc.includes('check')) {
      return 'verification';
    }
    if (desc.includes('voice') || desc.includes('speak') || desc.includes('audio')) {
      return 'voice';
    }
    return 'default';
  }
}
export default OpenAIModelRegistry;
