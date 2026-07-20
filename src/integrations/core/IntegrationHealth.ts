import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import { IntegrationContract, IntegrationHealth } from './IntegrationTypes.js';

export interface IntegrationHealthRecord {
  id: string;
  name: string;
  health: IntegrationHealth;
}

export class IntegrationHealthChecker {
  public checkAll(): IntegrationHealthRecord[] {
    return globalIntegrationRegistry.list().map((integration: IntegrationContract) => ({
      id: integration.id,
      name: integration.name,
      health: integration.health
    }));
  }

  public checkOne(id: string): IntegrationHealthRecord | null {
    const integration = globalIntegrationRegistry.get(id);
    if (!integration) return null;
    return {
      id: integration.id,
      name: integration.name,
      health: integration.health
    };
  }
}

export const globalIntegrationHealthChecker = new IntegrationHealthChecker();
