import { Provider } from '../';
import { RuntimeRequest, RuntimeResponse } from '../../capabilities';

export class OpenAIProvider implements Provider {
  id = 'openai';

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  getSupportedCapabilities(): string[] {
    return ['fast', 'heavy'];
  }

  async execute(request: RuntimeRequest): Promise<RuntimeResponse> {
    return {
      request_id: request.request_id,
      provider_id: this.id,
      text: `OpenAI response simulation for capability ${request.capability}`,
      usage: {
        prompt_tokens: 20,
        completion_tokens: 30,
        total_tokens: 50,
        estimated_cost_usd: 0.0002,
      },
      latency_ms: 120,
    };
  }
}
