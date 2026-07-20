import { describe, it, expect } from 'vitest';
import { AgentDataBridge } from './bridge/AgentDataBridge.js';
import { KernelDataBridge } from './bridge/KernelDataBridge.js';

describe('Live Data Bridge Fallbacks Tests', () => {
  it('should return mock lists gracefully if registry yields empty values', () => {
    const bridge = new AgentDataBridge();
    const result = bridge.getAgents();

    expect(result.source).toBe('mock');
    expect(result.status).toBe('online');
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('should fetch online status envelopes for OSK kernels', () => {
    const bridge = new KernelDataBridge();
    const result = bridge.getKernelStatus();

    expect(result.source).toBe('live');
    expect(result.data.online).toBe(true);
  });
});
