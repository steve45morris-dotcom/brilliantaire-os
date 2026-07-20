import { WorkspaceLaunchConfig } from './LaunchTypes.js';
import { defaultLaunchConfigs } from './WorkspaceLaunchConfig.js';

export class LaunchRegistry {
  private configs: Map<string, WorkspaceLaunchConfig> = new Map();

  constructor() {
    // Populate registry with defaults
    Object.entries(defaultLaunchConfigs).forEach(([id, config]) => {
      this.configs.set(id, { ...config });
    });
  }

  public getLaunchConfig(workspaceId: string): WorkspaceLaunchConfig | null {
    return this.configs.get(workspaceId) || null;
  }

  public updateLaunchConfig(workspaceId: string, updates: Partial<WorkspaceLaunchConfig>): void {
    const current = this.configs.get(workspaceId);
    if (current) {
      this.configs.set(workspaceId, {
        ...current,
        ...updates
      });
    }
  }

  public listLaunchConfigs(): WorkspaceLaunchConfig[] {
    return Array.from(this.configs.values());
  }

  public clear(): void {
    this.configs.clear();
  }
}

export const globalLaunchRegistry = new LaunchRegistry();
