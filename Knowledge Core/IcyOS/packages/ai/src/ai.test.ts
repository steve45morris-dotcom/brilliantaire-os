import { describe, it, expect } from 'vitest';
import { AiRuntime } from './runtime';
import { MockProvider } from './providers/mock';

describe('AI Runtime & Capabilities Selector', () => {
  it('should register providers and resolve capabilities successfully', () => {
    const runtime = new AiRuntime();
    const mock = new MockProvider();
    runtime.registerProvider(mock);

    const match = runtime.resolveProviderForCapability('reasoning');
    expect(match.length).toBe(1);
    expect(match[0].id).toBe('mock');
  });

  it('should perform provider failover fallback', async () => {
    const runtime = new AiRuntime();
    const faultyMock = new MockProvider('mock-faulty', true); // forceFail=true
    const healthyMock = new MockProvider('mock-healthy', false);

    runtime.registerProvider(faultyMock);
    runtime.registerProvider(healthyMock);

    // Verify both are registered
    const list = runtime.resolveProviderForCapability('fast');
    expect(list.length).toBe(2);

    const result = await runtime.execute({
      request_id: 'test-req',
      capability: 'fast',
      confidence_required: 0.8,
      latency_target: 0,
      cost_target: 10,
      fallback_policy: 'failover',
      payload: {}
    });

    expect(result.provider_id).toBe('mock-healthy');
  });

  it('should trigger timeout limit rejects', async () => {
    const runtime = new AiRuntime();
    // Register mock provider with 50ms delay
    const mock = new MockProvider('mock', false, 50);
    runtime.registerProvider(mock);

    await expect(
      runtime.execute({
        request_id: 'test-timeout',
        capability: 'fast',
        confidence_required: 0.8,
        latency_target: 5, // 5ms target
        cost_target: 10,
        fallback_policy: 'none',
        payload: {}
      })
    ).rejects.toThrow('API request timeout limit reached');
  });
});
