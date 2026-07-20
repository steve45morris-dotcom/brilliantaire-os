import { IntegrationContract } from './IntegrationTypes.js';
import { ModelProvider, ProviderHealth, ProviderUsage, ProviderCostControls } from './ModelProvider.js';

export class LocalIntegrationContract implements IntegrationContract, ModelProvider {
  public id = 'local';
  public name = 'Local Models Provider Layer';
  public provider = 'Local';
  public version = '1.0.0';
  public status: IntegrationContract['status'] = 'disabled';
  public type = 'model-provider' as const;
  public permissions = ['model:read'];
  public fallbackEligibility = false;

  public get authentication() {
    return {
      type: 'none' as const,
      authenticated: false,
      maskedToken: 'No active credentials'
    };
  }

  public get health(): any {
    return {
      status: this.status === 'active' ? 'operational' : 'disconnected',
      lastCheckedAt: new Date().toISOString(),
      latencyMs: 0,
      errors: this.status === 'active' ? [] : ['Not configured', 'Integration required']
    };
  }

  public capabilities = ['text'];
  public models: string[] = [];

  public get configuration(): Record<string, any> {
    return { status: 'Not configured' };
  }

  public get usage(): ProviderUsage {
    return { dailySpend: 0, monthlySpend: 0, totalRequests: 0, totalSuccess: 0, totalFailure: 0 };
  }

  public get costControls(): ProviderCostControls {
    return { dailyLimit: 0, monthlyLimit: 0 };
  }

  public supportedTaskTypes: string[] = [];

  public events = [];
  public commands = [];

  public async initialize(): Promise<void> {}
  public async healthCheck(): Promise<ProviderHealth> {
    return this.health;
  }
  public listModels(): string[] {
    return [];
  }
  public supportsCapability(capability: string): boolean {
    return false;
  }
  public async executeText(): Promise<any> {
    throw new Error('Local model provider is not configured.');
  }
  public async executeStructured(): Promise<any> {
    throw new Error('Local model provider is not configured.');
  }
  public async executeTools(): Promise<any> {
    throw new Error('Local model provider is not configured.');
  }
  public async executeStreaming(): Promise<any> {
    throw new Error('Local model provider is not configured.');
  }
  public async executeVoice(): Promise<any> {
    throw new Error('Local model provider is not configured.');
  }
  public async executeImage(): Promise<any> {
    throw new Error('Local model provider is not configured.');
  }
  public estimateCost(): number {
    return 0;
  }
  public async cancelRequest(): Promise<boolean> {
    return false;
  }

  public async sync(): Promise<void> {}
  public async bridge(): Promise<any> {
    return { data: 'Local models integration required.' };
  }
  public async knowledgeSync(): Promise<void> {}
  public async executiveSync(): Promise<void> {}
}

export const globalLocalIntegrationContract = new LocalIntegrationContract();
export default globalLocalIntegrationContract;
