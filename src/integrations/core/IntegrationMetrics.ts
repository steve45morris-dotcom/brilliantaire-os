export interface IntegrationMetric {
  integrationId: string;
  operation: string;
  durationMs: number;
  success: boolean;
  timestamp: string;
}

export class IntegrationMetrics {
  private store: Map<string, IntegrationMetric[]> = new Map();

  public record(
    integrationId: string,
    operation: string,
    durationMs: number,
    success: boolean
  ): void {
    const metric: IntegrationMetric = {
      integrationId,
      operation,
      durationMs,
      success,
      timestamp: new Date().toISOString()
    };

    if (!this.store.has(integrationId)) {
      this.store.set(integrationId, []);
    }
    this.store.get(integrationId)!.push(metric);
  }

  public getMetrics(integrationId?: string): IntegrationMetric[] {
    if (integrationId) {
      return this.store.get(integrationId) ?? [];
    }
    const all: IntegrationMetric[] = [];
    for (const metrics of this.store.values()) {
      all.push(...metrics);
    }
    return all;
  }

  public getSummary(integrationId: string): {
    totalOps: number;
    successRate: number;
    avgLatencyMs: number;
  } {
    const metrics = this.store.get(integrationId) ?? [];
    const totalOps = metrics.length;

    if (totalOps === 0) {
      return { totalOps: 0, successRate: 0, avgLatencyMs: 0 };
    }

    const successCount = metrics.filter((m) => m.success).length;
    const successRate = (successCount / totalOps) * 100;
    const avgLatencyMs =
      metrics.reduce((sum, m) => sum + m.durationMs, 0) / totalOps;

    return { totalOps, successRate, avgLatencyMs };
  }
}

export const globalIntegrationMetrics = new IntegrationMetrics();
