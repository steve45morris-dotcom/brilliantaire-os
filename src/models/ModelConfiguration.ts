import fs from 'node:fs';
import path from 'node:path';
import { AMOCConfig, ModelAssignments, ModelRole, ModelStatus, ModelProvider } from './ModelTypes.js';
import { globalModelEventService } from './ModelEvents.js';


const CONFIG_PATH = '/Users/alexanderanthony/config/amoc_settings.json';

export const recommendedDefaults: ModelAssignments = {
  'Builder': 'gemini-1.5-pro',
  'Architecture Reviewer': 'claude-3-5-sonnet',
  'Research': 'gemini-1.5-pro',
  'Writing': 'claude-3-5-sonnet',
  'Debugger': 'claude-3-5-sonnet',
  'Executive Reports': 'gemini-1.5-pro',
  'Documentation': 'gemini-1.5-pro',
  'Workflow Planner': 'gemini-1.5-flash',
  'Skill Discovery': 'gemini-1.5-pro',
  'Knowledge Summarizer': 'gemini-1.5-pro',
  'Conversation': 'gemini-1.5-flash',
  'Voice Assistant': 'gemini-1.5-flash'
};

export const defaultProviderStatuses: Record<ModelProvider, ModelStatus> = {
  'Google Gemini': 'Available',
  'Anthropic': 'Available',
  'OpenAI': 'Configured',
  'Local': 'Disconnected',
  'MCP': 'Disconnected',
  'Open Source': 'Unavailable'
};

export class ModelConfigurationManager {
  private currentConfig: AMOCConfig;

  constructor() {
    this.currentConfig = {
      assignments: { ...recommendedDefaults },
      providerStatus: { ...defaultProviderStatuses }
    };
    this.load();
  }

  public getConfig(): AMOCConfig {
    return {
      assignments: { ...this.currentConfig.assignments },
      providerStatus: { ...this.currentConfig.providerStatus }
    };
  }

  public updateAssignments(updates: Partial<ModelAssignments>): void {
    const prevAssignments = { ...this.currentConfig.assignments };
    this.currentConfig.assignments = {
      ...this.currentConfig.assignments,
      ...updates
    };
    
    for (const [roleKey, newVal] of Object.entries(updates)) {
      const role = roleKey as ModelRole;
      const prevVal = prevAssignments[role];
      if (newVal && prevVal !== newVal) {
        globalModelEventService.publishAssignmentChanged(role, prevVal || '', newVal);
      }
    }
    
    this.save();
  }

  public updateProviderStatus(provider: ModelProvider, status: ModelStatus): void {
    const prevStatus = this.currentConfig.providerStatus[provider];
    if (prevStatus !== status) {
      this.currentConfig.providerStatus[provider] = status;
      globalModelEventService.publishProviderStatusChanged(provider, prevStatus, status);
      this.save();
    }
  }

  public getPreferredModel(role: ModelRole): string {
    return this.currentConfig.assignments[role] || recommendedDefaults[role];
  }

  public load(): void {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const fileContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.assignments) {
          this.currentConfig.assignments = {
            ...this.currentConfig.assignments,
            ...parsed.assignments
          };
        }
        if (parsed.providerStatus) {
          this.currentConfig.providerStatus = {
            ...this.currentConfig.providerStatus,
            ...parsed.providerStatus
          };
        }
      }
    } catch (e) {
      console.warn('[AMOCConfig] Failed to load settings from file, using memory defaults.', e);
    }
  }

  public save(): void {
    try {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.currentConfig, null, 2), 'utf-8');
      globalModelEventService.publishConfigSaved();
    } catch (e) {
      console.error('[AMOCConfig] Failed to persist settings to file.', e);
    }
  }
}

export const globalModelConfigManager = new ModelConfigurationManager();
