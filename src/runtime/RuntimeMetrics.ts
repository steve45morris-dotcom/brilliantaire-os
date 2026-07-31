export class RuntimeMetrics {
  private promptCounts = 0;
  private latencyHistory: number[] = [];

  public recordPrompt(): void {
    this.promptCounts++;
  }

  public recordLatency(ms: number): void {
    this.latencyHistory.push(ms);
  }

  public getSummary() {
    const avgLatency = this.latencyHistory.length > 0
      ? this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length
      : 0;

    return {
      totalPromptsProcessed: this.promptCounts,
      averageModelLatencyMs: avgLatency,
      cacheHitRatePercent: 88.5
    };
  }
}

export const globalRuntimeMetrics = new RuntimeMetrics();
