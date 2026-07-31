import { globalLaunchRegistry } from '../../workspaces/LaunchRegistry.js';

export function getPresenceSuggestions(projectId?: string): { action: string; reason: string; focus: string } {
  if (!projectId) {
    return {
      action: 'Run Operations Intelligence Sweep',
      reason: 'No active project selected. System analysis scan recommended.',
      focus: 'the-one-system'
    };
  }

  const launchConfig = globalLaunchRegistry.getLaunchConfig(projectId);
  if (!launchConfig) {
    return {
      action: 'Configure Project',
      reason: 'Launch target registry record is missing.',
      focus: projectId
    };
  }

  if (launchConfig.status === 'Requires Configuration') {
    return {
      action: 'Configure Project',
      reason: 'This workspace requires setup parameters config.',
      focus: projectId
    };
  }

  if (launchConfig.status === 'Requires Build') {
    return {
      action: 'Run Build Pipeline',
      reason: 'Local build assets missing for this preview target.',
      focus: projectId
    };
  }

  if (launchConfig.status === 'Available' || launchConfig.status === 'Local Preview') {
    return {
      action: 'Launch Project',
      reason: 'Project preview target is ready and online.',
      focus: projectId
    };
  }

  return {
    action: 'Open Workspace',
    reason: 'Review goals and workflows timeline feeds.',
    focus: projectId
  };
}
