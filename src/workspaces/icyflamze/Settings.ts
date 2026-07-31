import { globalEventBus } from '../../kernel/events/EventBus.js';

export interface WorkspaceSettings {
  allowDirectObsidianWrite: boolean;
  voiceBusConcurrencyLock: boolean;
  piperTtsTone: 'street-scholar' | 'neutral' | 'narrator';
  defaultModelBuilder: string;
  defaultModelReviewer: string;
  collisionProtectionEnabled: boolean;
}

export class SettingsManager {
  private settings: WorkspaceSettings = {
    allowDirectObsidianWrite: false,
    voiceBusConcurrencyLock: true,
    piperTtsTone: 'street-scholar',
    defaultModelBuilder: 'gemini-1.5-pro',
    defaultModelReviewer: 'claude-3-5-sonnet',
    collisionProtectionEnabled: true
  };

  public getSettings(): WorkspaceSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<WorkspaceSettings>): WorkspaceSettings {
    Object.assign(this.settings, updates);
    globalEventBus.publish('IcyflamzeSettingsUpdated', { updates });
    return { ...this.settings };
  }
}

export const globalSettingsManager = new SettingsManager();
