import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';

export class ProjectDataBridge extends LiveDataBridge {
  public getProjects(): BridgeResponse<any[]> {
    const list = [
      { id: '1', name: 'The One System', status: 'ACTIVE' },
      { id: '2', name: 'TreeGroove Records', status: 'ACTIVE' },
      { id: '3', name: 'ProfBetGeng', status: 'ACTIVE' }
    ];
    return this.buildResponse(list, 'live');
  }
}

export const globalProjectDataBridge = new ProjectDataBridge();
