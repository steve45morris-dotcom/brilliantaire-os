export class OpenAICostEstimator {
  // Rates per 1,000,000 tokens
  private static rates: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 5.0, output: 15.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'o3-mini': { input: 1.1, output: 4.4 },
    'gpt-4o-realtime-preview': { input: 5.0, output: 20.0 },
    'text-embedding-3-small': { input: 0.02, output: 0.0 }
  };

  public static estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const rate = this.rates[model] || { input: 10.0, output: 30.0 };
    const inputCost = (inputTokens / 1_000_000) * rate.input;
    const outputCost = (outputTokens / 1_000_000) * rate.output;
    return parseFloat((inputCost + outputCost).toFixed(6));
  }
}
