import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';
import { globalModuleRegistry } from '../kernel/registry/ModuleRegistry.js';

export class AgentDataBridge extends LiveDataBridge {
  public getAgents(): BridgeResponse<any[]> {
    try {
      const liveModules = globalModuleRegistry.getModules();
      if (liveModules.length > 0) {
        return this.buildResponse(liveModules, 'live');
      }
    } catch (e: any) {
      return this.buildResponse([], 'fallback', 'error', [e.message]);
    }

    // Default mock list if registry empty
    const mockList = [
      { id: 'Planner', version: '1.0.0', status: 'ACTIVE' },
      { id: 'Executor', version: '1.0.0', status: 'ACTIVE' }
    ];
    return this.buildResponse(mockList, 'mock');
  }
}

export const globalAgentDataBridge = new AgentDataBridge();
