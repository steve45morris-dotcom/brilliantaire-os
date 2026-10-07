import { globalServiceRegistry } from '../../kernel/registry/ServiceRegistry.js';
import { globalGeminiResponsesService } from './GeminiResponsesService.js';
import { globalModelRouter } from '../core/ModelRouter.js';

export class GeminiIntegration {
  public registerService(): void {
    globalServiceRegistry.register('GeminiIntegration', {
      executeRequest: (payload: any) => {
        // Enforce ModelRouter routing policy: warn and route through central architecture
        console.warn('[GeminiIntegration] Direct execution via ServiceRegistry is discouraged. Routing through ModelRouter.');
        return globalModelRouter.executeRoutedRequest(
          {
            taskDescription: payload.prompt || payload.userIntent || 'Direct Gemini integration call',
            selectedProvider: 'gemini',
            selectedModel: payload.selectedModel,
            requiredCapability: payload.responseSchema ? 'structured-output' : 'text'
          },
          payload
        );
      },
      status: () => 'active'
    });
  }
}

export const globalGeminiIntegration = new GeminiIntegration();
export default globalGeminiIntegration;
