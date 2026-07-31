import { globalEventBus } from '../events/EventBus.js';
import { globalModuleRegistry } from '../registry/ModuleRegistry.js';

export class LifecycleManager {
  public async loadModule(moduleName: string): Promise<void> {
    globalEventBus.publish('LifecycleEvent', { module: moduleName, action: 'load' });
    globalModuleRegistry.updateModuleStatus(moduleName, 'loaded');
  }

  public async initializeModule(moduleName: string): Promise<void> {
    globalEventBus.publish('LifecycleEvent', { module: moduleName, action: 'initialize' });
    globalModuleRegistry.updateModuleStatus(moduleName, 'initialized');
  }

  public async activateModule(moduleName: string): Promise<void> {
    globalEventBus.publish('LifecycleEvent', { module: moduleName, action: 'activate' });
    globalModuleRegistry.updateModuleStatus(moduleName, 'active');
  }

  public async suspendModule(moduleName: string): Promise<void> {
    globalEventBus.publish('LifecycleEvent', { module: moduleName, action: 'suspend' });
    globalModuleRegistry.updateModuleStatus(moduleName, 'suspended');
  }

  public async resumeModule(moduleName: string): Promise<void> {
    globalEventBus.publish('LifecycleEvent', { module: moduleName, action: 'resume' });
    globalModuleRegistry.updateModuleStatus(moduleName, 'active');
  }

  public async shutdownModule(moduleName: string): Promise<void> {
    globalEventBus.publish('LifecycleEvent', { module: moduleName, action: 'shutdown' });
    globalModuleRegistry.updateModuleStatus(moduleName, 'loaded');
  }

  public async restartModule(moduleName: string): Promise<void> {
    await this.shutdownModule(moduleName);
    await this.initializeModule(moduleName);
    await this.activateModule(moduleName);
  }

  public async unloadModule(moduleName: string): Promise<void> {
    globalEventBus.publish('LifecycleEvent', { module: moduleName, action: 'unload' });
    // Keep registered but clear active status or remove from list if needed.
    globalModuleRegistry.updateModuleStatus(moduleName, 'loaded');
  }
}

export const globalLifecycleManager = new LifecycleManager();
