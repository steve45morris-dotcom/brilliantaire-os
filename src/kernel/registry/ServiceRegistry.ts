export class ServiceRegistry {
  private services: Map<string, any> = new Map();

  public register(name: string, service: any): void {
    if (this.services.has(name)) {
      throw new Error(`Service "${name}" already registered in Kernel Service Registry.`);
    }
    this.services.set(name, service);
  }

  public getService<T = any>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service "${name}" is not registered in the Kernel.`);
    }
    return service as T;
  }

  public hasService(name: string): boolean {
    return this.services.has(name);
  }

  public getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  public clear(): void {
    this.services.clear();
  }
}

export const globalServiceRegistry = new ServiceRegistry();
