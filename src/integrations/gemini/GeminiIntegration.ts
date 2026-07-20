import { globalServiceRegistry } from '../../kernel/registry/ServiceRegistry.js';
import { globalGeminiResponsesService } from './GeminiResponsesService.js';

export class GeminiIntegration {
  public registerService(): void {
    globalServiceRegistry.register('GeminiIntegration', {
      executeRequest: (payload: any) => globalGeminiResponsesService.executeRequest(payload),
      status: () => 'active'
    });
  }
}

export const globalGeminiIntegration = new GeminiIntegration();
export default globalGeminiIntegration;
