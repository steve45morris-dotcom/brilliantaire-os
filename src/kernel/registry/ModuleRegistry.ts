export interface ModuleInfo {
  name: string;
  version: string;
  owner: string;
  dependencies: string[];
  status: 'loaded' | 'initialized' | 'active' | 'suspended' | 'error';
  health: 'healthy' | 'warning' | 'degraded' | 'critical';
  priority: 'high' | 'medium' | 'low';
  capabilities: string[];
  configuration: Record<string, any>;
  routes?: string[];
  commands?: string[];
  events?: string[];
}

export class ModuleRegistry {
  private modules: Map<string, ModuleInfo> = new Map();

  public register(module: ModuleInfo): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} already registered in Kernel Module Registry.`);
    }
    this.modules.set(module.name, { ...module });
  }

  public getModule(name: string): ModuleInfo | undefined {
    const mod = this.modules.get(name);
    return mod ? { ...mod } : undefined;
  }

  public updateModuleStatus(name: string, status: ModuleInfo['status']): void {
    const mod = this.modules.get(name);
    if (!mod) {
      throw new Error(`Module ${name} not found in registry.`);
    }
    mod.status = status;
    this.modules.set(name, mod);
  }

  public updateModuleHealth(name: string, health: ModuleInfo['health']): void {
    const mod = this.modules.get(name);
    if (!mod) {
      throw new Error(`Module ${name} not found in registry.`);
    }
    mod.health = health;
    this.modules.set(name, mod);
  }

  public getModules(): ModuleInfo[] {
    return Array.from(this.modules.values()).map(m => ({ ...m }));
  }

  public clear(): void {
    this.modules.clear();
  }
}

export const globalModuleRegistry = new ModuleRegistry();
