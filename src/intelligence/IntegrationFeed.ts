import { globalIntegrationRegistry } from '../integrations/core/IntegrationRegistry.js';
import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';

export class IntegrationFeed {
  public syncIntegrationsHealth(): void {
    const list = globalIntegrationRegistry.list();

    list.forEach(i => {
      const isHealthy = i.health.status === 'healthy' && i.status === 'active';
      globalIntelligenceRegistry.addObservation({
        id: `obs-uif-${i.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        source: 'Integrations',
        category: isHealthy ? 'health_check' : 'failure',
        timestamp: new Date().toISOString(),
        message: `UIF Plugin ${i.name} status is ${i.status} and health is ${i.health.status}`,
        data: { id: i.id, health: i.health, status: i.status }
      });
    });
  }
}

export const globalIntegrationFeed = new IntegrationFeed();
export default globalIntegrationFeed;
