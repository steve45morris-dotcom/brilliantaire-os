import { IntegrationContract } from './IntegrationTypes.js';

export interface IntegrationPlugin {
  id: string;
  name: string;
  factory: () => IntegrationContract;
}

export class IntegrationFactory {
  private plugins: Map<string, IntegrationPlugin> = new Map();

  public registerPlugin(plugin: IntegrationPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public create(pluginId: string): IntegrationContract | null {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return null;
    return plugin.factory();
  }

  public listPlugins(): IntegrationPlugin[] {
    return Array.from(this.plugins.values());
  }

  public hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }
}

export const globalIntegrationFactory = new IntegrationFactory();
