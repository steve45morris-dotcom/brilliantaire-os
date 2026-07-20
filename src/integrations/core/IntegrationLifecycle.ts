import { IntegrationContract } from './IntegrationTypes.js';
import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class IntegrationLifecycle {
  public async activate(id: string): Promise<void> {
    const integration = globalIntegrationRegistry.get(id);
    if (integration) {
      integration.status = 'active';
      globalEventBus.publish('IntegrationLifecycleUpdated', { id, status: 'active' });
    }
  }

  public async suspend(id: string): Promise<void> {
    const integration = globalIntegrationRegistry.get(id);
    if (integration) {
      integration.status = 'suspended';
      globalEventBus.publish('IntegrationLifecycleUpdated', { id, status: 'suspended' });
    }
  }

  public async disable(id: string): Promise<void> {
    const integration = globalIntegrationRegistry.get(id);
    if (integration) {
      integration.status = 'disabled';
      globalEventBus.publish('IntegrationLifecycleUpdated', { id, status: 'disabled' });
    }
  }
}

export const globalIntegrationLifecycle = new IntegrationLifecycle();
