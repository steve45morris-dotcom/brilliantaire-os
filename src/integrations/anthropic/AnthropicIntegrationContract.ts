import { IntegrationContract } from '../core/IntegrationTypes.js';
import { ModelProvider, ProviderHealth, ProviderUsage, ProviderCostControls } from '../core/ModelProvider.js';
import { maskAPIKey } from '../core/SecretMasker.js';

export class AnthropicIntegrationContract implements IntegrationContract, ModelProvider {
  public id = 'anthropic';
  public name = 'Anthropic Claude Provider Layer';
  public provider = 'Anthropic';
  public version = '1.0.0';
  
  private _statusOverride: IntegrationContract['status'] | null = null;
  public get status(): IntegrationContract['status'] {
    if (this._statusOverride) return this._statusOverride;
    return process.env.ANTHROPIC_API_KEY ? 'active' : 'disabled';
  }
  public set status(val: IntegrationContract['status']) {
    this._statusOverride = val;
  }
  public type = 'model-provider' as const;
  public permissions = ['model:read'];
  public fallbackEligibility = false;

  public get authentication() {
    const key = process.env.ANTHROPIC_API_KEY || '';
    const hasKey = !!key && key !== 'unconfigured';
    return {
      type: 'apiKey' as const,
      authenticated: hasKey,
      maskedToken: maskAPIKey('ANTHROPIC_API_KEY', key)
    };
  }

  public get health(): any {
    const active = this.status === 'active';
    return {
      status: active ? 'healthy' : 'disconnected',
      lastCheckedAt: new Date().toISOString(),
      latencyMs: 0,
      errors: active ? [] : ['Not configured', 'Integration required']
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
    throw new Error('Anthropic Claude is not configured.');
  }
  public async executeStructured(): Promise<any> {
    throw new Error('Anthropic Claude is not configured.');
  }
  public async executeTools(): Promise<any> {
    throw new Error('Anthropic Claude is not configured.');
  }
  public async executeStreaming(): Promise<any> {
    throw new Error('Anthropic Claude is not configured.');
  }
  public async executeVoice(): Promise<any> {
    throw new Error('Anthropic Claude is not configured.');
  }
  public async executeImage(): Promise<any> {
    throw new Error('Anthropic Claude is not configured.');
  }
  public estimateCost(): number {
    return 0;
  }
  public async cancelRequest(): Promise<boolean> {
    return false;
  }

  public async sync(): Promise<void> {}
  public async bridge(): Promise<any> {
    return { data: 'Anthropic Claude integration required.' };
  }
  public async knowledgeSync(): Promise<void> {}
  public async executiveSync(): Promise<void> {}
}

export const globalAnthropicIntegrationContract = new AnthropicIntegrationContract();
export default globalAnthropicIntegrationContract;
