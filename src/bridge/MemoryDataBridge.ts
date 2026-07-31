import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';
import { globalStateManager } from '../kernel/state/StateManager.js';

export class MemoryDataBridge extends LiveDataBridge {
  public getMemories(): BridgeResponse<any[]> {
    try {
      const activeState = globalStateManager.getState();
      return this.buildResponse([{ id: 'mem-1', content: 'Obsidian notes scanned successfully.', project: activeState.currentProject }], 'live');
    } catch (e: any) {
      return this.buildResponse([], 'fallback', 'error', [e.message]);
    }
  }
}

export const globalMemoryDataBridge = new MemoryDataBridge();
