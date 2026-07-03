export interface ProviderHealth {
  provider_id: string;
  availability: boolean;
  average_latency: number;
  error_rate: number;
  last_success?: string;
  fallback_frequency: number;
  request_count: number;
  error_count: number;
}

export class HealthMonitor {
  private stats = new Map<string, ProviderHealth>();

  updateHealth(provider_id: string, success: boolean, latency_ms: number, fallback: boolean) {
    let current = this.stats.get(provider_id);
    if (!current) {
      current = {
        provider_id,
        availability: true,
        average_latency: 0,
        error_rate: 0,
        fallback_frequency: 0,
        request_count: 0,
        error_count: 0,
      };
    }

    current.request_count++;
    if (!success) {
      current.error_count++;
    } else {
      current.last_success = new Date().toISOString();
    }

    current.error_rate = current.error_count / current.request_count;
    current.availability = current.error_rate < 0.5;
    
    current.average_latency = success 
      ? (current.average_latency * (current.request_count - 1) + latency_ms) / current.request_count
      : current.average_latency;

    if (fallback) {
      current.fallback_frequency++;
    }

    this.stats.set(provider_id, current);
  }

  getHealthReport(): ProviderHealth[] {
    return Array.from(this.stats.values());
  }
}
