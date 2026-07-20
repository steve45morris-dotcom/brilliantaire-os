export interface IntegrationRuntimeState {
  integrationId: string;
  lastSyncAt?: string;
  syncCount: number;
  errorCount: number;
  isHealthy: boolean;
  metadata: Record<string, any>;
}

const DEFAULT_STATE = (integrationId: string): IntegrationRuntimeState => ({
  integrationId,
  syncCount: 0,
  errorCount: 0,
  isHealthy: true,
  metadata: {}
});

export class IntegrationState {
  private states: Map<string, IntegrationRuntimeState> = new Map();

  private ensureState(integrationId: string): IntegrationRuntimeState {
    if (!this.states.has(integrationId)) {
      this.states.set(integrationId, DEFAULT_STATE(integrationId));
    }
    return this.states.get(integrationId)!;
  }

  public setState(integrationId: string, state: Partial<IntegrationRuntimeState>): void {
    const current = this.ensureState(integrationId);
    this.states.set(integrationId, { ...current, ...state, integrationId });
  }

  public getState(integrationId: string): IntegrationRuntimeState {
    return this.ensureState(integrationId);
  }

  public incrementSync(integrationId: string): void {
    const state = this.ensureState(integrationId);
    state.syncCount += 1;
    state.lastSyncAt = new Date().toISOString();
  }

  public incrementError(integrationId: string): void {
    const state = this.ensureState(integrationId);
    state.errorCount += 1;
  }

  public markHealthy(integrationId: string, isHealthy: boolean): void {
    const state = this.ensureState(integrationId);
    state.isHealthy = isHealthy;
  }
}

export const globalIntegrationState = new IntegrationState();
