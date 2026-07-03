import { Provider } from '../';
import { RuntimeRequest, RuntimeResponse } from '../../capabilities';

export class GeminiProvider implements Provider {
  id = 'gemini';

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  getSupportedCapabilities(): string[] {
    return ['fast', 'reasoning'];
  }

  async execute(request: RuntimeRequest): Promise<RuntimeResponse> {
    return {
      request_id: request.request_id,
      provider_id: this.id,
      text: `Gemini response simulation for capability ${request.capability}`,
      usage: {
        prompt_tokens: 15,
        completion_tokens: 20,
        total_tokens: 35,
        estimated_cost_usd: 0.00005,
      },
      latency_ms: 90,
    };
  }
}
