import { getOpenAIConfig } from './OpenAIConfig.js';

export class OpenAIUsageTracker {
  private dailySpend = 0.0;
  private monthlySpend = 0.0;
  private currentConcurrency = 0;
  private totalRequests = 0;
  private totalSuccess = 0;
  private totalFailure = 0;

  public incrementConcurrency(): void {
    this.currentConcurrency++;
  }

  public decrementConcurrency(): void {
    if (this.currentConcurrency > 0) {
      this.currentConcurrency--;
    }
  }

  public recordRequest(success: boolean, cost = 0.0): void {
    this.totalRequests++;
    if (success) {
      this.totalSuccess++;
      this.dailySpend += cost;
      this.monthlySpend += cost;
    } else {
      this.totalFailure++;
    }
  }

  public checkBudgetExceeded(): { exceeded: boolean; reason?: string } {
    const config = getOpenAIConfig();
    if (this.dailySpend >= config.dailyBudgetLimit) {
      return { exceeded: true, reason: `Daily budget limit of $${config.dailyBudgetLimit} exceeded. Current: $${this.dailySpend.toFixed(4)}` };
    }
    if (this.monthlySpend >= config.monthlyBudgetLimit) {
      return { exceeded: true, reason: `Monthly budget limit of $${config.monthlyBudgetLimit} exceeded. Current: $${this.monthlySpend.toFixed(4)}` };
    }
    return { exceeded: false };
  }

  public getStats() {
    return {
      dailySpend: this.dailySpend,
      monthlySpend: this.monthlySpend,
      currentConcurrency: this.currentConcurrency,
      totalRequests: this.totalRequests,
      totalSuccess: this.totalSuccess,
      totalFailure: this.totalFailure
    };
  }

  public resetSpend(): void {
    this.dailySpend = 0.0;
    this.monthlySpend = 0.0;
  }
}

export const globalOpenAIUsageTracker = new OpenAIUsageTracker();
