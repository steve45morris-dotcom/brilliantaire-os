export interface ScheduledSync {
  integrationId: string;
  intervalMs: number;
  lastRunAt?: string;
  nextRunAt: string;
}

export class IntegrationScheduler {
  private schedules: Map<string, ScheduledSync> = new Map();

  public schedule(integrationId: string, intervalMs: number): void {
    const now = new Date();
    const nextRun = new Date(now.getTime() + intervalMs);

    const existing = this.schedules.get(integrationId);
    this.schedules.set(integrationId, {
      integrationId,
      intervalMs,
      lastRunAt: existing?.lastRunAt,
      nextRunAt: nextRun.toISOString()
    });
  }

  public unschedule(integrationId: string): void {
    this.schedules.delete(integrationId);
  }

  public listSchedules(): ScheduledSync[] {
    return Array.from(this.schedules.values());
  }

  public getNextRun(integrationId: string): string | null {
    return this.schedules.get(integrationId)?.nextRunAt ?? null;
  }
}

export const globalIntegrationScheduler = new IntegrationScheduler();
