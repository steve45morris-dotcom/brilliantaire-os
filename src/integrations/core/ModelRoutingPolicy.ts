import { globalConfigService } from '../../kernel/configuration/ConfigService.js';
import { TaskRole } from './ModelRoutingTypes.js';
import fs from 'node:fs';
import path from 'node:path';

const CONFIG_FILE_PATH = '/Users/alexanderanthony/config/routing_settings.json';

export interface RoutingPolicySettings {
  routingMode: 'automatic' | 'manual';
  preferredProvider: string;
  preferredFastProvider: string;
  preferredReasoningProvider: string;
  preferredCodingProvider: string;
  preferredResearchProvider: string;
  preferredVerificationProvider: string;
  preferredVoiceProvider: string;
  preferredImageProvider: string;
  allowProviderFallback: boolean;
  requireApprovalBeforeProviderSwitch: boolean;
  maxEstimatedCostPerRequest: number;
}

export class ModelRoutingPolicy {
  private settings: RoutingPolicySettings;

  constructor() {
    let diskSettings: Partial<RoutingPolicySettings> = {};
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        diskSettings = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
      }
    } catch (e) {
      // Ignore load failures
    }

    const sysPref = globalConfigService.getConfig().systemPreferences || {};
    this.settings = {
      routingMode: diskSettings.routingMode || sysPref.routingMode || 'automatic',
      preferredProvider: diskSettings.preferredProvider || sysPref.preferredProvider || 'openai',
      preferredFastProvider: diskSettings.preferredFastProvider || sysPref.preferredFastProvider || 'openai',
      preferredReasoningProvider: diskSettings.preferredReasoningProvider || sysPref.preferredReasoningProvider || 'openai',
      preferredCodingProvider: diskSettings.preferredCodingProvider || sysPref.preferredCodingProvider || 'openai',
      preferredResearchProvider: diskSettings.preferredResearchProvider || sysPref.preferredResearchProvider || 'openai',
      preferredVerificationProvider: diskSettings.preferredVerificationProvider || sysPref.preferredVerificationProvider || 'openai',
      preferredVoiceProvider: diskSettings.preferredVoiceProvider || sysPref.preferredVoiceProvider || 'openai',
      preferredImageProvider: diskSettings.preferredImageProvider || sysPref.preferredImageProvider || 'openai',
      allowProviderFallback: diskSettings.allowProviderFallback ?? (sysPref.allowProviderFallback !== false),
      requireApprovalBeforeProviderSwitch: diskSettings.requireApprovalBeforeProviderSwitch ?? (sysPref.requireApprovalBeforeProviderSwitch !== false),
      maxEstimatedCostPerRequest: diskSettings.maxEstimatedCostPerRequest ?? sysPref.maxEstimatedCostPerRequest ?? 0.50
    };
  }

  public getSettings(): RoutingPolicySettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<RoutingPolicySettings>): void {
    this.settings = { ...this.settings, ...updates };
    
    // Save to disk
    try {
      const dir = path.dirname(CONFIG_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (e) {
      console.error('[ModelRoutingPolicy] Failed to save settings to disk:', e);
    }

    // Persist back to globalConfigService
    globalConfigService.updateConfig({
      systemPreferences: {
        ...(globalConfigService.getConfig().systemPreferences || {}),
        ...this.settings
      }
    });
  }

  public getPreferredProviderForRole(role: TaskRole): string {
    switch (role) {
      case 'fast':
        return this.settings.preferredFastProvider;
      case 'reasoning':
        return this.settings.preferredReasoningProvider;
      case 'coding':
        return this.settings.preferredCodingProvider;
      case 'research':
        return this.settings.preferredResearchProvider;
      case 'verification':
        return this.settings.preferredVerificationProvider;
      case 'voice':
        return this.settings.preferredVoiceProvider;
      case 'image':
        return this.settings.preferredImageProvider;
      default:
        return this.settings.preferredProvider;
    }
  }
}

export const globalModelRoutingPolicy = new ModelRoutingPolicy();
export default globalModelRoutingPolicy;
