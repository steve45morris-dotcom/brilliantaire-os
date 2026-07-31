import { globalEventBus } from '../events/EventBus.js';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  status: 'discovered' | 'installed' | 'active' | 'deactivated';
  description: string;
  author: string;
}

export class PluginManager {
  private plugins: Map<string, PluginInfo> = new Map();

  constructor() {
    // Scaffold initial plugins
    this.plugins.set('alex-frontend-product-pack', {
      id: 'alex-frontend-product-pack',
      name: 'alex-frontend-product-pack',
      version: '1.0.0',
      status: 'active',
      description: 'Standard UI tools, Playwright test suite and designer kits.',
      author: 'One System Engine'
    });
  }

  public registerPlugin(plugin: PluginInfo): void {
    this.plugins.set(plugin.id, plugin);
    globalEventBus.publish('PluginRegistered', { id: plugin.id, name: plugin.name });
  }

  public getPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  public async installPlugin(id: string, details: Omit<PluginInfo, 'status'>): Promise<void> {
    const plugin: PluginInfo = {
      ...details,
      status: 'installed'
    };
    this.plugins.set(id, plugin);
    globalEventBus.publish('PluginInstalled', { id });
  }

  public async activatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`Plugin ${id} not found.`);
    plugin.status = 'active';
    this.plugins.set(id, plugin);
    globalEventBus.publish('PluginActivated', { id });
  }

  public async deactivatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`Plugin ${id} not found.`);
    plugin.status = 'deactivated';
    this.plugins.set(id, plugin);
    globalEventBus.publish('PluginDeactivated', { id });
  }

  public async removePlugin(id: string): Promise<void> {
    if (!this.plugins.has(id)) throw new Error(`Plugin ${id} not found.`);
    this.plugins.delete(id);
    globalEventBus.publish('PluginRemoved', { id });
  }
}

export const globalPluginManager = new PluginManager();
