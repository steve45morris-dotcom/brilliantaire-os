export interface RuntimeState {
  isStreaming: boolean;
  activeSessionId: string | null;
  activeModelName: string;
}

export class RuntimeStateStore {
  private state: RuntimeState = {
    isStreaming: false,
    activeSessionId: null,
    activeModelName: 'Gemini 3.5 Flash'
  };

  public getState(): RuntimeState {
    return { ...this.state };
  }

  public updateState(updates: Partial<RuntimeState>): void {
    this.state = { ...this.state, ...updates };
  }
}

export const globalRuntimeState = new RuntimeStateStore();
