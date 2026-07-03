import { Provider } from '../';
import { RuntimeRequest, RuntimeResponse } from '../../capabilities';

export class MockProvider implements Provider {
  constructor(
    public id = 'mock',
    private forceFail = false,
    private delayMs = 0
  ) {}

  isAvailable(): boolean {
    return true;
  }

  getSupportedCapabilities(): string[] {
    return ['fast', 'reasoning', 'heavy', 'local'];
  }

  async execute(request: RuntimeRequest): Promise<RuntimeResponse> {
    if (this.forceFail) {
      throw new Error('MockProvider simulation execution error');
    }
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
    return {
      request_id: request.request_id,
      provider_id: this.id,
      text: `Mock generated response for capability "${request.capability}" and template payload.`,
      usage: {
        prompt_tokens: 15,
        completion_tokens: 25,
        total_tokens: 40,
        estimated_cost_usd: 0.0001,
      },
      latency_ms: this.delayMs || 50,
    };
  }
}
