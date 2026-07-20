export interface IntegrationHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'unknown' | 'disconnected' | 'authentication-failed' | 'misconfigured' | 'unavailable' | 'rate-limited' | 'budget-blocked';
  lastCheckedAt: string;
  latencyMs: number;
  errors?: string[];
}

export interface IntegrationAuth {
  type: 'apiKey' | 'oauth2' | 'token' | 'none';
  authenticated: boolean;
  maskedToken?: string;
}

export interface IntegrationContract {
  id: string;
  name: string;
  provider: string;
  version: string;
  status: 'discovered' | 'registered' | 'active' | 'suspended' | 'disabled';
  type?: 'model-provider' | 'data-provider' | 'tool-provider' | 'communication-provider' | 'storage-provider';
  permissions: string[];
  authentication: IntegrationAuth;
  health: IntegrationHealth;
  capabilities: string[];
  events: string[];
  commands: string[];
  sync(repoName?: string): Promise<void>;
  bridge(endpoint: string): Promise<any>;
  knowledgeSync(repoName?: string): Promise<void>;
  executiveSync(repoName?: string): Promise<void>;
}
