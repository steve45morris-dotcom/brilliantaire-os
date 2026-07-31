export type LaunchStatusType =
  | 'Available'
  | 'Local Preview'
  | 'External URL'
  | 'Requires Build'
  | 'Requires Configuration'
  | 'Offline'
  | 'Not Available';

export type LaunchModeType =
  | 'internal_route'
  | 'external_tab'
  | 'local_preview'
  | 'not_launchable';

export interface WorkspaceLaunchConfig {
  workspaceId: string;
  launchUrl?: string;
  previewCommand?: string;
  frontendPath?: string;
  status: LaunchStatusType;
  launchMode: LaunchModeType;
  lastLaunchedAt?: string;
}
