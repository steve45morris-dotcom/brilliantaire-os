export interface SystemConfig {
  environment: 'development' | 'production' | 'staging';
  featureFlags: Record<string, boolean>;
  installedProviders: string[];
  systemPreferences: Record<string, any>;
}

export class ConfigService {
  private config: SystemConfig;

  constructor() {
    this.config = {
      environment: 'production',
      featureFlags: {
        voiceNarrativeAnnouncements: true,
        strictValidationGate: true,
        unsandboxedTerminalAllowed: false,
        automaticIngestionUpdates: true
      },
      installedProviders: ['Gemini API', 'Anthropic Claude API'],
      systemPreferences: {
        theme: 'supernova',
        refreshIntervalMs: 30000,
        retentionMaxFilesCount: 500
      }
    };
  }

  public getConfig(): SystemConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<SystemConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public setFeatureFlag(flag: string, value: boolean): void {
    this.config.featureFlags[flag] = value;
  }
}

export const globalConfigService = new ConfigService();
