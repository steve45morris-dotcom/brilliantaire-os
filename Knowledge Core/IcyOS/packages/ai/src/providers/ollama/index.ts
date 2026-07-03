import { Provider } from '../';
import { RuntimeRequest, RuntimeResponse } from '../../capabilities';

export class OllamaProvider implements Provider {
  id = 'ollama';

  isAvailable(): boolean {
    return true;
  }

  getSupportedCapabilities(): string[] {
    return ['local'];
  }

  async execute(request: RuntimeRequest): Promise<RuntimeResponse> {
    return {
      request_id: request.request_id,
      provider_id: this.id,
      text: `Ollama response simulation for capability ${request.capability}`,
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
        estimated_cost_usd: 0.0,
      },
      latency_ms: 250,
    };
  }
}
