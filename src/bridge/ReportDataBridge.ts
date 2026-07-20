import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';

export class ReportDataBridge extends LiveDataBridge {
  public getReports(): BridgeResponse<any[]> {
    const list = [
      { id: 'rep-1', title: 'Intake Manifest Report', created: '2026-07-02' }
    ];
    return this.buildResponse(list, 'live');
  }
}

export const globalReportDataBridge = new ReportDataBridge();
