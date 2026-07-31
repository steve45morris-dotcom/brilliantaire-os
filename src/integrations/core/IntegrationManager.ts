import { IntegrationContract } from './IntegrationTypes.js';
import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import { globalIntegrationLifecycle } from './IntegrationLifecycle.js';
import { globalServiceRegistry } from '../../kernel/registry/ServiceRegistry.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class IntegrationManager {
  public registerService(): void {
    globalServiceRegistry.register('UniversalIntegrationFramework', {
      registerIntegration: (integration: IntegrationContract) => {
        globalIntegrationRegistry.register(integration);
        globalEventBus.publish('IntegrationRegistered', { id: integration.id });
      },
      activateIntegration: (id: string) => globalIntegrationLifecycle.activate(id),
      suspendIntegration: (id: string) => globalIntegrationLifecycle.suspend(id),
      disableIntegration: (id: string) => globalIntegrationLifecycle.disable(id),
      getIntegration: (id: string) => globalIntegrationRegistry.get(id),
      listIntegrations: () => globalIntegrationRegistry.list(),
      getSnapshot: () => ({
        integrations: globalIntegrationRegistry.list().map(i => ({
          id: i.id,
          name: i.name,
          provider: i.provider,
          status: i.status,
          health: i.health
        }))
      })
    });
  }
}

export const globalIntegrationManager = new IntegrationManager();
export default globalIntegrationManager;
