import { globalEventBus } from '../events/EventBus.js';
import { loadState, SchedulerState, Schedule } from '../../scheduler_layer.js';

export class KernelScheduler {
  private activeJobs: string[] = [];

  public getSchedulerState(): SchedulerState {
    return loadState();
  }

  public getActiveJobs(): string[] {
    return [...this.activeJobs];
  }

  public triggerJob(name: string): void {
    this.activeJobs.push(name);
    globalEventBus.publish('JobStarted', { name, timestamp: new Date().toISOString() });
    
    // Simulate async job completion
    setTimeout(() => {
      this.activeJobs = this.activeJobs.filter(j => j !== name);
      globalEventBus.publish('JobCompleted', { name, timestamp: new Date().toISOString() });
    }, 4000);
  }
}

export const globalKernelScheduler = new KernelScheduler();
