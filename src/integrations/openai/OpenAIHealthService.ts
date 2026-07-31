import { getOpenAIConfig } from './OpenAIConfig.js';
import { globalOpenAIUsageTracker } from './OpenAIUsageTracker.js';

export class OpenAIHealthService {
  private lastChecked = new Date().toISOString();
  private healthErrors: string[] = [];

  public getHealth() {
    const config = getOpenAIConfig();
    const stats = globalOpenAIUsageTracker.getStats();
    this.lastChecked = new Date().toISOString();

    let status: 'healthy' | 'degraded' | 'critical' | 'unknown' = 'healthy';
    this.healthErrors = [];

    if (!config.apiKey) {
      status = 'degraded';
      this.healthErrors.push('Missing OPENAI_API_KEY environment credentials. Fallback mock state active.');
    }

    const budgetCheck = globalOpenAIUsageTracker.checkBudgetExceeded();
    if (budgetCheck.exceeded) {
      status = 'critical';
      this.healthErrors.push(budgetCheck.reason || 'Spend budget exceeded.');
    }

    if (stats.totalFailure > 0 && stats.totalSuccess === 0) {
      status = 'critical';
      this.healthErrors.push('All recent API requests are failing.');
    } else if (stats.totalFailure > 2) {
      status = 'degraded';
      this.healthErrors.push('Multiple recent request failures detected.');
    }

    return {
      status,
      lastCheckedAt: this.lastChecked,
      latencyMs: status === 'healthy' ? 45 : 0,
      errors: this.healthErrors
    };
  }
}

export const globalOpenAIHealthService = new OpenAIHealthService();
export default globalOpenAIHealthService;
