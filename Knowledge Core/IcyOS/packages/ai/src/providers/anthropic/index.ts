import { Provider } from '../';
import { RuntimeRequest, RuntimeResponse } from '../../capabilities';

export class AnthropicProvider implements Provider {
  id = 'anthropic';

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  getSupportedCapabilities(): string[] {
    return ['reasoning', 'heavy'];
  }

  async execute(request: RuntimeRequest): Promise<RuntimeResponse> {
    return {
      request_id: request.request_id,
      provider_id: this.id,
      text: `Anthropic response simulation for capability ${request.capability}`,
      usage: {
        prompt_tokens: 25,
        completion_tokens: 35,
        total_tokens: 60,
        estimated_cost_usd: 0.0003,
      },
      latency_ms: 180,
    };
  }
}
