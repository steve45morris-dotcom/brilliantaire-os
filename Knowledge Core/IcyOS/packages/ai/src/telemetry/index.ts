export interface TelemetryRecord {
  request_id: string;
  provider: string;
  capability: string;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  retries: number;
  timeout_event: boolean;
  fallback_event: boolean;
  confidence_score: number;
  timestamp: string;
}

export class TelemetryTracker {
  private records: TelemetryRecord[] = [];

  record(record: TelemetryRecord) {
    this.records.push(record);
  }

  getRecords(): TelemetryRecord[] {
    return this.records;
  }

  estimateCost(provider: string, promptTokens: number, completionTokens: number): number {
    let promptRate = 0.0;
    let completionRate = 0.0;

    switch (provider) {
      case 'openai':
        promptRate = 2.5; 
        completionRate = 10.0; 
        break;
      case 'anthropic':
        promptRate = 3.0;
        completionRate = 15.0;
        break;
      case 'gemini':
        promptRate = 0.075;
        completionRate = 0.3;
        break;
      case 'ollama':
      default:
        promptRate = 0.0;
        completionRate = 0.0;
        break;
    }

    return ((promptTokens * promptRate) + (completionTokens * completionRate)) / 1000000;
  }
}
