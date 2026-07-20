import { globalIntegrationRegistry } from './IntegrationRegistry.js';

export class IntegrationBridge {
  public async route(integrationId: string, endpoint: string): Promise<any> {
    const integration = globalIntegrationRegistry.get(integrationId);

    if (!integration) {
      return { data: null, error: 'Integration not found' };
    }

    return integration.bridge(endpoint);
  }
}

export const globalIntegrationBridge = new IntegrationBridge();
