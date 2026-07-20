import { MCPResource } from './MCPTypes.js';
import { MCPAuth } from './MCPAuth.js';
import { globalHealthMonitor } from '../../../kernel/monitoring/HealthMonitor.js';

export class MCPResourceRegistry {
  private static resources: Map<string, MCPResource> = new Map([
    [
      'system://health',
      {
        uri: 'system://health',
        name: 'System Health Status',
        description: 'Current logical and database health parameters.',
        mimeType: 'application/json',
        read: async (token) => {
          const health = globalHealthMonitor.collectReport();
          return JSON.stringify(health);
        }
      }
    ]
  ]);

  public static getResource(uri: string): MCPResource | undefined {
    return this.resources.get(uri);
  }

  public static listResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }
}
