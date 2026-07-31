import { globalEventBus } from '../events/EventBus.js';
import { globalStateManager } from '../state/StateManager.js';
import { globalModuleRegistry } from '../registry/ModuleRegistry.js';
import { globalServiceRegistry } from '../registry/ServiceRegistry.js';
import { globalLifecycleManager } from '../lifecycle/LifecycleManager.js';
import { globalConfigService } from '../configuration/ConfigService.js';
import { globalHealthMonitor } from '../monitoring/HealthMonitor.js';
import { globalLiveOperationsBridge } from '../live/LiveOperationsBridge.js';
import { globalSessionTracker } from '../live/SessionTracker.js';
import { globalIntegrationManager } from '../../integrations/core/IntegrationManager.js';
import { globalGitHubIntegrationContract } from '../../integrations/github/GitHubIntegrationContract.js';
import { globalOpenAIIntegrationContract } from '../../integrations/openai/OpenAIIntegrationContract.js';
import { globalOpenAIIntegration } from '../../integrations/openai/OpenAIIntegration.js';
import { globalGeminiIntegrationContract } from '../../integrations/gemini/GeminiIntegrationContract.js';
import { globalGeminiIntegration } from '../../integrations/gemini/GeminiIntegration.js';
import { globalAnthropicIntegrationContract } from '../../integrations/anthropic/AnthropicIntegrationContract.js';
import { globalLocalIntegrationContract } from '../../integrations/core/LocalIntegrationContract.js';
import { globalModelRouter } from '../../integrations/core/ModelRouter.js';
import { globalIntelligenceService } from '../../intelligence/IntelligenceService.js';

import { globalObservationEngine } from '../../intelligence/ObservationEngine.js';
import { globalSkillAcquisitionService } from '../../skills/acquisition/SkillAcquisitionService.js';

export interface StartupReport {
  bootTimeMs: number;
  servicesRegistered: string[];
  modulesLoaded: string[];
  dependencyStatus: 'verified' | 'degraded';
  errors: string[];
}

export class BootManager {
  private startTime = 0;
  private bootTimeMs = 0;
  private sequenceLogs: string[] = [];

  public async boot(): Promise<StartupReport> {
    this.startTime = Date.now();
    this.logSeq('Initializing Boot Sequence...');

    // 1. Start Event Bus
    this.logSeq('Started global Event Bus.');
    globalEventBus.publish('SystemBooting', { timestamp: new Date().toISOString() });

    // 2. Load Configuration
    this.logSeq('Loaded system configurations.');
    const config = globalConfigService.getConfig();

    // 3. Register Core Services
    this.logSeq('Registering core Kernel services...');
    globalServiceRegistry.register('ConfigService', globalConfigService);
    globalServiceRegistry.register('EventBus', globalEventBus);
    globalServiceRegistry.register('ModuleRegistry', globalModuleRegistry);
    globalServiceRegistry.register('LifecycleManager', globalLifecycleManager);
    globalServiceRegistry.register('HealthMonitor', globalHealthMonitor);
    globalLiveOperationsBridge.registerService();
    this.logSeq('Registered Live Operations service.');

    // Register Universal Integration Framework & GitHub Plugin
    globalIntegrationManager.registerService();
    globalOpenAIIntegration.registerService();
    globalGeminiIntegration.registerService();
    globalModelRouter.registerService();
    globalServiceRegistry.getService('UniversalIntegrationFramework').registerIntegration(globalGitHubIntegrationContract);
    globalServiceRegistry.getService('UniversalIntegrationFramework').registerIntegration(globalOpenAIIntegrationContract);
    globalServiceRegistry.getService('UniversalIntegrationFramework').registerIntegration(globalGeminiIntegrationContract);
    globalServiceRegistry.getService('UniversalIntegrationFramework').registerIntegration(globalAnthropicIntegrationContract);
    globalServiceRegistry.getService('UniversalIntegrationFramework').registerIntegration(globalLocalIntegrationContract);
    globalServiceRegistry.register('SkillAcquisitionService', globalSkillAcquisitionService);
    this.logSeq('Registered Universal Integration Framework, GitHub plugin, OpenAI, Gemini, Anthropic, Local integrations, and SkillAcquisitionService.');


    // Register Operations Intelligence Layer (OIL)
    globalIntelligenceService.registerService();
    globalObservationEngine.startObserving();
    this.logSeq('Registered Operations Intelligence Layer and started ObservationEngine.');

    // 4. Initialize Core Modules in Registry
    this.logSeq('Initializing core system modules...');
    const coreModules = [
      { name: 'AgentRouter', version: '1.0.0', owner: 'Planner', dependencies: [], status: 'loaded' as const, health: 'healthy' as const, priority: 'high' as const, capabilities: ['dispatch', 'route'], configuration: {} },
      { name: 'Memory', version: '2.0.0', owner: 'Librarian', dependencies: [], status: 'loaded' as const, health: 'healthy' as const, priority: 'high' as const, capabilities: ['read', 'write'], configuration: {} },
      { name: 'Verification', version: '1.1.0', owner: 'Guardian', dependencies: [], status: 'loaded' as const, health: 'healthy' as const, priority: 'high' as const, capabilities: ['typecheck', 'lint'], configuration: {} },
      { name: 'WorkflowEngine', version: '1.5.0', owner: 'Executor', dependencies: [], status: 'loaded' as const, health: 'healthy' as const, priority: 'high' as const, capabilities: ['run', 'deploy'], configuration: {} }
    ];

    for (const mod of coreModules) {
      globalModuleRegistry.register(mod);
      await globalLifecycleManager.initializeModule(mod.name);
      await globalLifecycleManager.activateModule(mod.name);
      this.logSeq(`Module "${mod.name}" initialized and activated.`);
    }

    // 5. Update State
    globalStateManager.updateState({
      systemStatus: 'online',
      loadedModulesCount: coreModules.length
    });

    if (process.env.NODE_ENV !== 'test') {
      const interval = setInterval(() => {
        globalSessionTracker.expireStaleSessions();
      }, 60000);
      if (interval.unref) interval.unref();
    }

    this.bootTimeMs = Date.now() - this.startTime;
    this.logSeq(`Boot sequence completed in ${this.bootTimeMs}ms.`);

    const report: StartupReport = {
      bootTimeMs: this.bootTimeMs,
      servicesRegistered: globalServiceRegistry.getServiceNames(),
      modulesLoaded: globalModuleRegistry.getModules().map(m => m.name),
      dependencyStatus: 'verified',
      errors: []
    };

    globalEventBus.publish('SystemOnline', { report });
    return report;
  }

  public getBootLogs(): string[] {
    return [...this.sequenceLogs];
  }

  private logSeq(msg: string): void {
    const timeOffset = Date.now() - (this.startTime || Date.now());
    this.sequenceLogs.push(`[+${timeOffset}ms] ${msg}`);
    console.log(`[OSK Boot] ${msg}`);
  }
}

export const globalBootManager = new BootManager();
