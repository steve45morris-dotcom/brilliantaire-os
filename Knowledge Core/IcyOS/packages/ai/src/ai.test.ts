import { describe, it, expect } from 'vitest';
import { AiRuntime } from './runtime';
import { MockProvider } from './providers/mock';
import { SecurityGuard } from './safety';

describe('AI Runtime & Operations Suite', () => {
  it('should register and render prompt templates', () => {
    const runtime = new AiRuntime();
    const template = runtime.prompts.getTemplate('TEMPLATE-INBOX_PARSING');
    expect(template).toBeDefined();
    expect(template?.version).toBe('1.0.0');

    const rendered = runtime.prompts.render('TEMPLATE-INBOX_PARSING', { input: 'hello' });
    expect(rendered).toContain('hello');
  });

  it('should estimate cost and record telemetry', async () => {
    const runtime = new AiRuntime();
    const mock = new MockProvider('mock');
    runtime.registerProvider(mock);

    const result = await runtime.execute({
      request_id: 'test-telemetry',
      capability: 'fast',
      confidence_required: 0.9,
      latency_target: 0,
      cost_target: 10,
      fallback_policy: 'none',
      payload: {}
    });

    expect(result.usage.estimated_cost_usd).toBeGreaterThanOrEqual(0);
    const records = runtime.telemetry.getRecords();
    expect(records.length).toBe(1);
    expect(records[0].request_id).toBe('test-telemetry');
  });

  it('should sanitize security sensitive keys', () => {
    const sanitized = SecurityGuard.sanitizeOutput('my key sk-1234567890123456789012345678901234567890');
    expect(sanitized).toContain('[REDACTED_OPENAI_KEY]');
  });

  it('should monitor provider health', async () => {
    const runtime = new AiRuntime();
    const mock = new MockProvider('mock');
    runtime.registerProvider(mock);

    await runtime.execute({
      request_id: 'test-health',
      capability: 'fast',
      confidence_required: 0.9,
      latency_target: 0,
      cost_target: 10,
      fallback_policy: 'none',
      payload: {}
    });

    const report = runtime.health.getHealthReport();
    expect(report.length).toBe(1);
    expect(report[0].provider_id).toBe('mock');
    expect(report[0].availability).toBe(true);
  });
});
