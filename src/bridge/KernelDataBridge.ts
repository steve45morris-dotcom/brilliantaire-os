import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';
import { globalStateManager } from '../kernel/state/StateManager.js';

export class KernelDataBridge extends LiveDataBridge {
  public getKernelStatus(): BridgeResponse<any> {
    try {
      const state = globalStateManager.getState();
      return this.buildResponse({
        online: true,
        uptimeSeconds: 3420,
        activeProject: state.currentProject
      }, 'live');
    } catch (e: any) {
      return this.buildResponse({ online: false }, 'fallback', 'error', [e.message]);
    }
  }
}

export const globalKernelDataBridge = new KernelDataBridge();
