import { EyeState } from './EyeTypes.js';

export class EyeStateManager {
  private currentState: EyeState = 'idle';
  private listeners: ((state: EyeState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).globalEyeStateManager = this;
    }
  }

  public subscribe(callback: (state: EyeState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public setState(state: EyeState): void {
    if (this.currentState !== state) {
      this.currentState = state;
      this.listeners.forEach(l => l(state));
    }
  }

  public getState(): EyeState {
    return this.currentState;
  }
}

export const globalEyeStateManager = new EyeStateManager();
