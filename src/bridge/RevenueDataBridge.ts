import { LiveDataBridge, BridgeResponse } from './LiveDataBridge.js';

export class RevenueDataBridge extends LiveDataBridge {
  public getRevenueSummary(): BridgeResponse<any> {
    const defaultData = {
      grossRevenue: 8520,
      adSpend: 1450,
      roiPercent: 487.5
    };
    return this.buildResponse(defaultData, 'live');
  }
}

export const globalRevenueDataBridge = new RevenueDataBridge();
