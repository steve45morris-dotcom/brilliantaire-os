export interface ProviderUsage {
  dailySpend: number;
  monthlySpend: number;
  totalRequests: number;
  totalSuccess: number;
  totalFailure: number;
}

export interface ProviderCostControls {
  dailyLimit: number;
  monthlyLimit: number;
}

export interface ProviderHealth {
  providerId: string;
  status: 'healthy' | 'degraded' | 'disconnected' | 'authentication-failed' | 'misconfigured' | 'unavailable' | 'rate-limited' | 'budget-blocked';
  authenticated: boolean;
  endpointVerified: boolean;
  modelVerified: boolean;
  latencyMs: number;
  message: string;
  checkedAt: string;
  lastCheckedAt: string;
  errors?: string[];
}

export interface ModelProvider {
  id: string;
  name: string;
  version: string;
  status: 'discovered' | 'registered' | 'active' | 'suspended' | 'disabled';
  capabilities: string[];
  models: string[];
  health: ProviderHealth;
  authentication: {
    type: 'apiKey' | 'oauth2' | 'token' | 'none';
    authenticated: boolean;
    maskedToken: string;
  };
  configuration: Record<string, any>;
  permissions: string[];
  usage: ProviderUsage;
  costControls: ProviderCostControls;
  supportedTaskTypes: string[];
  fallbackEligibility: boolean;

  initialize(): Promise<void>;
  healthCheck(): Promise<ProviderHealth>;
  listModels(): string[];
  supportsCapability(capability: string): boolean;
  executeText(payload: any): Promise<any>;
  executeStructured(payload: any): Promise<any>;
  executeTools(payload: any): Promise<any>;
  executeStreaming(payload: any): Promise<any>;
  executeVoice(payload: any): Promise<any>;
  executeImage(payload: any): Promise<any>;
  estimateCost(model: string, inputTokens: number, outputTokens: number): number;
  cancelRequest(requestId: string): Promise<boolean>;
}
