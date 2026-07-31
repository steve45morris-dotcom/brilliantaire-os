import { IntegrationContract } from './IntegrationTypes.js';

export class IntegrationRegistry {
  private integrations: Map<string, IntegrationContract> = new Map();

  public register(integration: IntegrationContract): void {
    if (this.integrations.has(integration.id)) {
      throw new Error(`Integration with ID "${integration.id}" is already registered.`);
    }
    this.integrations.set(integration.id, integration);
  }

  public get(id: string): IntegrationContract | undefined {
    return this.integrations.get(id);
  }

  public list(): IntegrationContract[] {
    return Array.from(this.integrations.values());
  }

  public remove(id: string): boolean {
    return this.integrations.delete(id);
  }

  public clear(): void {
    this.integrations.clear();
  }
}

export const globalIntegrationRegistry = new IntegrationRegistry();
