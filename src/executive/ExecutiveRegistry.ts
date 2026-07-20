import { globalServiceRegistry } from '../kernel/registry/ServiceRegistry.js';

export class ExecutiveRegistry {
  public registerExecutiveServices(): void {
    globalServiceRegistry.register('PriorityEngine', {
      rank: () => 'P1'
    });
    globalServiceRegistry.register('DecisionEngine', {
      makeDecision: () => 'approved'
    });
  }
}

export const globalExecutiveRegistry = new ExecutiveRegistry();
