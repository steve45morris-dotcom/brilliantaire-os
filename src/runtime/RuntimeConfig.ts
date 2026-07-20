export interface RuntimeConfig {
  maxChatHistoryLogs: number;
  enableStreamOutput: boolean;
  defaultSystemPrompt: string;
}

export class RuntimeConfigService {
  private config: RuntimeConfig = {
    maxChatHistoryLogs: 100,
    enableStreamOutput: true,
    defaultSystemPrompt: 'You are Supernova, the sovereign intelligence orchestrator of The One System.'
  };

  public getConfig(): RuntimeConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<RuntimeConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export const globalRuntimeConfig = new RuntimeConfigService();
