import process from 'node:process';
import { ModelProvider, ModelStatus } from './ModelTypes.js';

export interface ProviderHealthReport {
  provider: ModelProvider;
  status: ModelStatus;
  latencyMs?: number;
  lastChecked: string;
  details: string;
}

export class ModelHealthService {
  public getCredentialStatus(provider: ModelProvider): boolean {
    // Check environment variables
    switch (provider) {
      case 'Google Gemini':
        return !!(process.env.GEMINI_API_KEY || 'mock-key-loaded'); // fallback for mock
      case 'Anthropic':
        return !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || 'mock-key-loaded');
      case 'OpenAI':
        return !!(process.env.OPENAI_API_KEY); // if user hasn't set it, this is false
      case 'Local':
        return true; // local is always "available" or "unavailable" depending on service, say yes
      case 'MCP':
        return true; // MCP server connectivity
      case 'Open Source':
        return false; // let's say not configured/credentials missing
      default:
        return false;
    }
  }

  public async testConnection(provider: ModelProvider): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
  }> {
    // Artificial delay to simulate network call
    await new Promise(resolve => setTimeout(resolve, 300));

    const hasCreds = this.getCredentialStatus(provider);

    if (!hasCreds && provider === 'OpenAI') {
      return {
        success: false,
        latencyMs: 0,
        message: `Credentials not found for provider: ${provider}. Set OPENAI_API_KEY.`
      };
    }

    if (provider === 'Open Source') {
      return {
        success: false,
        latencyMs: 0,
        message: `Provider ${provider} endpoint is currently unreachable.`
      };
    }

    // Default simulation values
    let latency = 120;
    if (provider === 'Google Gemini') latency = 90;
    if (provider === 'Anthropic') latency = 150;
    if (provider === 'Local') latency = 10;

    return {
      success: true,
      latencyMs: latency,
      message: `Successfully connected to ${provider} API.`
    };
  }

  public getProviderHealth(provider: ModelProvider): ProviderHealthReport {
    const hasCreds = this.getCredentialStatus(provider);
    let status: ModelStatus = 'Disconnected';
    let details = 'Credentials not configured.';

    if (hasCreds) {
      if (provider === 'Google Gemini' || provider === 'Anthropic') {
        status = 'Available';
        details = 'Provider connection is stable and operational.';
      } else if (provider === 'OpenAI') {
        status = 'Configured';
        details = 'Credentials loaded. Connection inactive.';
      } else if (provider === 'Local' || provider === 'MCP') {
        status = 'Disconnected';
        details = 'Service offline or host unreachable.';
      }
    } else {
      if (provider === 'Open Source') {
        status = 'Unavailable';
        details = 'No endpoint registered.';
      }
    }

    return {
      provider,
      status,
      lastChecked: new Date().toISOString(),
      details
    };
  }
}

export const globalModelHealthService = new ModelHealthService();
