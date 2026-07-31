import { globalEventBus } from '../kernel/events/EventBus.js';
import { ModelRole, ModelProvider, ModelStatus, ModelRecord } from './ModelTypes.js';

export class ModelEventService {
  public publishAssignmentChanged(role: ModelRole, previousModelId: string, newModelId: string): void {
    globalEventBus.publish('ModelAssignmentChanged', {
      role,
      previousModelId,
      newModelId
    });
  }

  public publishProviderStatusChanged(provider: ModelProvider, previousStatus: ModelStatus, newStatus: ModelStatus): void {
    globalEventBus.publish('ModelProviderStatusChanged', {
      provider,
      previousStatus,
      newStatus
    });
  }

  public publishModelRegistered(model: ModelRecord): void {
    globalEventBus.publish('ModelRegistered', {
      modelId: model.id,
      provider: model.provider,
      displayName: model.displayName
    });
  }

  public publishConfigSaved(): void {
    globalEventBus.publish('ModelConfigSaved', {
      timestamp: new Date().toISOString()
    });
  }
}

export const globalModelEventService = new ModelEventService();
