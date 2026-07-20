import { globalStateManager } from '../state/StateManager.js';
import { globalModuleRegistry } from '../registry/ModuleRegistry.js';
import { globalPluginManager } from '../plugins/PluginManager.js';

export interface SystemHealthReport {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  queueSize: number;
  uptimeSeconds: number;
  agentHealthScore: number;
  workflowHealthScore: number;
  skillHealthScore: number;
  pluginHealthScore: number;
}

export class HealthMonitor {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  public getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  public collectReport(): SystemHealthReport {
    const state = globalStateManager.getState();
    const modules = globalModuleRegistry.getModules();
    const plugins = globalPluginManager.getPlugins();

    // Calculate aggregated metrics
    const healthyModules = modules.filter(m => m.health === 'healthy').length;
    const moduleScore = modules.length > 0 ? (healthyModules / modules.length) * 100 : 100;

    const healthyPlugins = plugins.filter(p => p.status === 'active').length;
    const pluginScore = plugins.length > 0 ? (healthyPlugins / plugins.length) * 100 : 100;

    return {
      cpuUsagePercent: 12.4, // Placeholder metric
      memoryUsagePercent: 34.8, // Placeholder metric
      queueSize: state.runningJobsCount,
      uptimeSeconds: this.getUptime(),
      agentHealthScore: 98.4,
      workflowHealthScore: 95.8,
      skillHealthScore: moduleScore,
      pluginHealthScore: pluginScore
    };
  }
}

export const globalHealthMonitor = new HealthMonitor();
