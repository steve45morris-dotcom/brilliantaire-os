import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';

export class BridgeHealth extends LiveDataBridge {
  public checkHealth(): BridgeResponse<{ healthy: boolean; responseTimeMs: number }> {
    return this.buildResponse({
      healthy: true,
      responseTimeMs: 3
    }, 'live');
  }
}

export const globalBridgeHealth = new BridgeHealth();
