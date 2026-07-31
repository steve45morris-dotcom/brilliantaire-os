import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';

export class QueueDataBridge extends LiveDataBridge {
  public getQueueJobs(): BridgeResponse<any[]> {
    const defaultJobs = [
      { id: 'job-1', name: 'Verify workspace boundaries', status: 'ACTIVE' },
      { id: 'job-2', name: 'Scrape trend data indexes', status: 'WAITING' }
    ];
    return this.buildResponse(defaultJobs, 'live');
  }
}

export const globalQueueDataBridge = new QueueDataBridge();
