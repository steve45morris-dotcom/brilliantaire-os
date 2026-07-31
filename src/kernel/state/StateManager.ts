import { globalEventBus } from '../events/EventBus.js';

export interface KernelState {
  currentUser: string;
  currentWorkspace: string;
  currentProject: string;
  systemStatus: 'booting' | 'online' | 'degraded' | 'maintenance' | 'offline';
  runningJobsCount: number;
  loadedModulesCount: number;
  theme: 'supernova' | 'dark' | 'hud';
  notifications: string[];
}

export class StateManager {
  private state: KernelState;

  constructor() {
    this.state = {
      currentUser: 'Icyflamze',
      currentWorkspace: '/Users/alexanderanthony',
      currentProject: 'The One System',
      systemStatus: 'booting',
      runningJobsCount: 0,
      loadedModulesCount: 0,
      theme: 'supernova',
      notifications: []
    };
  }

  public getState(): KernelState {
    return { ...this.state };
  }

  public updateState(updates: Partial<KernelState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Publish StateChanged event on the bus
    globalEventBus.publish('StateChanged', {
      oldState,
      newState: this.state,
      updates
    });
  }

  public addNotification(message: string): void {
    const newNotifications = [message, ...this.state.notifications].slice(0, 50);
    this.updateState({ notifications: newNotifications });
  }

  public clearNotifications(): void {
    this.updateState({ notifications: [] });
  }
}

export const globalStateManager = new StateManager();
