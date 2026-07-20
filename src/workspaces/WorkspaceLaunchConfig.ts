import { WorkspaceLaunchConfig } from './LaunchTypes.js';

export const defaultLaunchConfigs: Record<string, WorkspaceLaunchConfig> = {
  'the-one-system': {
    workspaceId: 'the-one-system',
    launchUrl: '/dashboard',
    frontendPath: 'dashboard/dist/index.html',
    status: 'Available',
    launchMode: 'internal_route'
  },
  'icyflamze': {
    workspaceId: 'icyflamze',
    launchUrl: '/projects/icyflamze',
    status: 'Available',
    launchMode: 'internal_route'
  },
  'profbetgeng': {
    workspaceId: 'profbetgeng',
    launchUrl: '/projects/profbetgeng',
    status: 'Local Preview',
    launchMode: 'internal_route'
  },
  'treegroove': {
    workspaceId: 'treegroove',
    launchUrl: '/projects/treegroove',
    status: 'Local Preview',
    launchMode: 'internal_route'
  },
  'joy-beauty-studio': {
    workspaceId: 'joy-beauty-studio',
    launchUrl: '/projects/joy-beauty-studio',
    status: 'Local Preview',
    launchMode: 'internal_route'
  },
  'avatar': {
    workspaceId: 'avatar',
    launchUrl: '/projects/avatar',
    status: 'Requires Configuration',
    launchMode: 'internal_route'
  },
  'podcast': {
    workspaceId: 'podcast',
    launchUrl: '/projects/podcast',
    status: 'Requires Build',
    launchMode: 'internal_route'
  },
  'ai-school': {
    workspaceId: 'ai-school',
    launchUrl: '/projects/ai-school',
    status: 'Not Available',
    launchMode: 'not_launchable'
  }
};
