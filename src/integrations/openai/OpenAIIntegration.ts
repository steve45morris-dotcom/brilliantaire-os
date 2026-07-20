import { globalServiceRegistry } from '../../kernel/registry/ServiceRegistry.js';
import { globalOpenAIResponsesService } from './OpenAIResponsesService.js';
import { globalOpenAIAgentAdapter } from './OpenAIAgentAdapter.js';
import { globalOpenAIRealtimeService } from './OpenAIRealtimeService.js';
import { globalOpenAIHealthService } from './OpenAIHealthService.js';
import { globalOpenAIUsageTracker } from './OpenAIUsageTracker.js';

export class OpenAIIntegration {
  public registerService(): void {
    globalServiceRegistry.register('OpenAIIntegration', {
      executeRequest: (payload: any) => globalOpenAIResponsesService.executeRequest(payload),
      delegateTask: (role: any, desc: string, ws: string, turns: number, timeout: number) => 
        globalOpenAIAgentAdapter.delegateTask(role, desc, ws, turns, timeout),
      createEphemeralSession: (tone?: string) => globalOpenAIRealtimeService.createEphemeralSession(tone),
      getHealth: () => globalOpenAIHealthService.getHealth(),
      getStats: () => globalOpenAIUsageTracker.getStats()
    });
  }
}

export const globalOpenAIIntegration = new OpenAIIntegration();
export default globalOpenAIIntegration;
