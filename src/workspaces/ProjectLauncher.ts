import { globalEyeStateManager } from '../ui/eye/EyeStateManager.js';
import { globalLaunchRegistry } from './LaunchRegistry.js';
import { globalEventBus } from '../kernel/events/EventBus.js';
import { resolveWorkspaceBySlug } from './WorkspaceSlug.js';

export interface LaunchResult {
  success: boolean;
  mode: "internal" | "external" | "local-preview" | "configuration-required" | "unavailable";
  message: string;
  target?: string;
  error?: string;
}

export class ProjectLauncher {
  public async launch(workspaceId: string): Promise<LaunchResult> {
    const resolvedId = resolveWorkspaceBySlug(workspaceId);
    console.log(`[ProjectLauncher] Attempting to launch workspace: ${resolvedId} (input: ${workspaceId})`);
    
    // System Eye state on launch start
    globalEyeStateManager.setState('observing');

    const config = globalLaunchRegistry.getLaunchConfig(resolvedId);
    if (!config) {
      globalEyeStateManager.setState('alert');
      globalEventBus.publish('ProjectLaunchFailed', { workspaceId: resolvedId, reason: 'Registry config missing' });
      return {
        success: false,
        mode: "unavailable",
        message: "No launch configuration registered.",
        error: "Registry configuration missing."
      };
    }

    const now = new Date().toISOString();
    globalLaunchRegistry.updateLaunchConfig(resolvedId, { lastLaunchedAt: now });

    // Handle configuration validations
    if (config.status === 'Not Available') {
      globalEyeStateManager.setState('error');
      globalEventBus.publish('ProjectLaunchFailed', { workspaceId: resolvedId, reason: 'Workspace not available' });
      return {
        success: false,
        mode: "unavailable",
        message: "Workspace launch target is currently not available.",
        error: "This workspace has been marked as unavailable."
      };
    }

    if (config.status === 'Requires Configuration') {
      globalEyeStateManager.setState('approval');
      globalEventBus.publish('ProjectLaunchFailed', { workspaceId: resolvedId, reason: 'Workspace requires setup' });
      return {
        success: false,
        mode: "configuration-required",
        message: "Project configuration setup is required before launching.",
        error: "Configuration properties missing."
      };
    }

    if (config.status === 'Requires Build') {
      globalEyeStateManager.setState('alert');
      globalEventBus.publish('ProjectLaunchFailed', { workspaceId: resolvedId, reason: 'Frontend build needed' });
      return {
        success: false,
        mode: "unavailable",
        message: "Frontend build required. Build assets are missing.",
        error: "Please run compilation build scripts."
      };
    }

    if (config.status === 'Offline') {
      globalEyeStateManager.setState('error');
      globalEventBus.publish('ProjectLaunchFailed', { workspaceId: resolvedId, reason: 'Local server offline' });
      return {
        success: false,
        mode: "unavailable",
        message: "The preview server is offline.",
        error: "Please start the local preview server."
      };
    }

    // Trigger execution sound and visual eye transitions
    globalEyeStateManager.setState('executing');
    globalEventBus.publish('ProjectLaunchSuccess', { workspaceId: resolvedId, url: config.launchUrl });

    // Let the eye settle back to idle/reporting
    setTimeout(() => {
      globalEyeStateManager.setState('reporting');
      setTimeout(() => {
        globalEyeStateManager.setState('idle');
      }, 1000);
    }, 1500);

    if (config.status === 'Local Preview') {
      return {
        success: true,
        mode: "local-preview",
        message: `Run preview command to launch locally: ${config.previewCommand || 'npm run dev'}`,
        target: config.frontendPath || config.launchUrl
      };
    }

    if (config.launchMode === 'internal_route') {
      return {
        success: true,
        mode: "internal",
        message: `Launched project ${resolvedId} internally.`,
        target: config.launchUrl
      };
    }

    return {
      success: true,
      mode: "external",
      message: `Launched project ${resolvedId} externally.`,
      target: config.launchUrl
    };
  }
}

export const globalProjectLauncher = new ProjectLauncher();
