import { ModelRecord } from './ModelTypes.js';
import { defaultModelProfiles } from './ModelProfiles.js';
import { globalModelConfigManager } from './ModelConfiguration.js';

export class ModelRegistry {
  private models: Map<string, ModelRecord> = new Map();

  constructor() {
    // Populate with default profiles
    this.resetToDefaults();
  }

  public registerModel(model: ModelRecord): void {
    this.models.set(model.id, { ...model });
  }

  public getModel(id: string): ModelRecord | undefined {
    const record = this.models.get(id);
    if (!record) return undefined;

    // Dynamically enrich status with config manager's provider state
    const providerStatus = globalModelConfigManager.getConfig().providerStatus[record.provider];
    return {
      ...record,
      status: providerStatus || record.status
    };
  }

  public getAllModels(): ModelRecord[] {
    const config = globalModelConfigManager.getConfig();
    return Array.from(this.models.values()).map(model => ({
      ...model,
      status: config.providerStatus[model.provider] || model.status
    }));
  }

  public resetToDefaults(): void {
    this.models.clear();
    for (const profile of defaultModelProfiles) {
      this.registerModel(profile);
    }
  }
}

export const globalModelRegistry = new ModelRegistry();
