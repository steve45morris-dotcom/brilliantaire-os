export const WORKSPACE_ROUTES = {
  'the-one-system': 'projects-the-one-system',
  'icyflamze': 'projects-icyflamze',
  'profbetgeng': 'projects-profbetgeng',
  'treegroove': 'projects-treegroove',
  'joy-beauty-studio': 'projects-joy-beauty-studio',
  'avatar': 'projects-avatar',
  'podcast': 'projects-podcast',
  'ai-school': 'projects-ai-school'
};

export function getRouteForWorkspace(id: string): string {
  const normalizedId = id.toLowerCase().replace(/_/g, '-');
  return WORKSPACE_ROUTES[normalizedId as keyof typeof WORKSPACE_ROUTES] || `projects-${normalizedId}`;
}
