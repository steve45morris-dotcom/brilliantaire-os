import { Provider } from '../providers';
import { RuntimeRequest, RuntimeResponse } from '../capabilities';
import { PromptLibrary } from '../prompts';
import { TelemetryTracker } from '../telemetry';
import { HealthMonitor } from '../evaluation';
import { SecurityGuard } from '../safety';

export class AiRuntime {
  private providers = new Map<string, Provider>();
  public prompts = new PromptLibrary();
  public telemetry = new TelemetryTracker();
  public health = new HealthMonitor();

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
    let fallbackCount = 0;

    for (const provider of candidates) {
      const startTime = Date.now();
      try {
        const promise = provider.execute(request);
        
        let response: RuntimeResponse;
        if (request.latency_target > 0) {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('API request timeout limit reached')), request.latency_target)
          );
          response = await Promise.race([promise, timeoutPromise]);
        } else {
          response = await promise;
        }

        const latency = Date.now() - startTime;
        
        this.health.updateHealth(provider.id, true, latency, fallbackCount > 0);

        response.text = SecurityGuard.sanitizeOutput(response.text);

        const estimatedCost = this.telemetry.estimateCost(
          provider.id,
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );
        response.usage.estimated_cost_usd = estimatedCost;

        this.telemetry.record({
          request_id: request.request_id,
          provider: provider.id,
          capability: request.capability,
          latency_ms: latency,
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          estimated_cost_usd: estimatedCost,
          retries: 0,
          timeout_event: false,
          fallback_event: fallbackCount > 0,
          confidence_score: request.confidence_required,
          timestamp: new Date().toISOString()
        });

        return response;
      } catch (err: any) {
        lastError = err;
        fallbackCount++;
        const latency = Date.now() - startTime;
        this.health.updateHealth(provider.id, false, latency, true);
        
        if (request.fallback_policy === 'failover') {
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('Request execution failed across all candidate providers');
  }
}
