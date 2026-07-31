import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';
import { globalLiveOperationsStore } from '../kernel/live/LiveOperationsStore.js';
import { globalAttentionEngine } from '../kernel/live/AttentionEngine.js';

export class LiveOperationsDataBridge extends LiveDataBridge {
  public getSnapshot(): BridgeResponse<any> {
    try {
      const sessions = globalLiveOperationsStore.getSessions();
      const tasks = globalLiveOperationsStore.getTasks();
      const events = globalLiveOperationsStore.getEvents();
      const attentionItems = globalAttentionEngine.generateAttentionItems();

      return this.buildResponse({
        sessions,
        tasks,
        events,
        attentionItems
      }, 'live');
    } catch (e: any) {
      return this.buildResponse({}, 'fallback', 'error', [e.message]);
    }
  }
}

export const globalLiveOperationsDataBridge = new LiveOperationsDataBridge();
