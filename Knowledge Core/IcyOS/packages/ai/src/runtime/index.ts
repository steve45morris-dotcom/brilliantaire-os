import { Provider } from '../providers';
import { RuntimeRequest, RuntimeResponse } from '../capabilities';

export class AiRuntime {
  private providers = new Map<string, Provider>();

  registerProvider(provider: Provider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  resolveProviderForCapability(capability: string): Provider[] {
    const list: Provider[] = [];
    for (const provider of this.providers.values()) {
      if (provider.isAvailable() && provider.getSupportedCapabilities().includes(capability)) {
        list.push(provider);
      }
    }
    return list;
  }

  async execute(request: RuntimeRequest): Promise<RuntimeResponse> {
    const candidates = this.resolveProviderForCapability(request.capability);
    if (candidates.length === 0) {
      throw new Error(`No available providers for capability profile "${request.capability}"`);
    }

    let lastError: Error | null = null;

    for (const provider of candidates) {
      try {
        const promise = provider.execute(request);
        if (request.latency_target > 0) {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('API request timeout limit reached')), request.latency_target)
          );
          return await Promise.race([promise, timeoutPromise]);
        }
        return await promise;
      } catch (err: any) {
        lastError = err;
        if (request.fallback_policy === 'failover') {
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('Request execution failed across all candidate providers');
  }
}
