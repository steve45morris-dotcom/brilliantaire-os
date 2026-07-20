const CANONICAL_SLUGS = [
  'the-one-system',
  'icyflamze',
  'profbetgeng',
  'treegroove',
  'joy-beauty-studio',
  'avatar',
  'podcast',
  'ai-school'
];

const ALIAS_MAP: Record<string, string> = {
  'icyflamze-studio': 'icyflamze',
  'icyflamze studio': 'icyflamze',
  'the one system': 'the-one-system',
  'profbetgeng': 'profbetgeng',
  'treegroove-records': 'treegroove',
  'treegroove records': 'treegroove',
  'joy-beauty-studio': 'joy-beauty-studio',
  'joy beauty studio': 'joy-beauty-studio',
  'avatar-studio': 'avatar',
  'avatar studio': 'avatar',
  'podcast-engine': 'podcast',
  'podcast engine': 'podcast',
  'ai school': 'ai-school'
};

export function resolveWorkspaceBySlug(slug: string): string {
  let cleaned = slug.toLowerCase().trim().replace(/_/g, '-');
  
  if (cleaned.startsWith('/projects/')) {
    cleaned = cleaned.substring('/projects/'.length);
  } else if (cleaned.startsWith('projects-')) {
    cleaned = cleaned.substring('projects-'.length);
  }

  // Check alias map
  if (ALIAS_MAP[cleaned]) {
    return ALIAS_MAP[cleaned];
  }

  // Check raw string alias
  const withSpaces = cleaned.replace(/-/g, ' ');
  if (ALIAS_MAP[withSpaces]) {
    return ALIAS_MAP[withSpaces];
  }

  // Return if already a canonical slug
  if (CANONICAL_SLUGS.includes(cleaned)) {
    return cleaned;
  }

  // Fallback to match nearest startsWith/includes for safety
  const found = CANONICAL_SLUGS.find(s => s.startsWith(cleaned) || cleaned.startsWith(s));
  return found || cleaned;
}

export function toWorkspaceSlug(nameOrId: string): string {
  return resolveWorkspaceBySlug(nameOrId);
}

export function fromWorkspaceSlug(slug: string): string {
  const canonical = resolveWorkspaceBySlug(slug);
  switch (canonical) {
    case 'the-one-system':
      return 'The One System';
    case 'icyflamze':
      return 'Icyflamze Studio';
    case 'profbetgeng':
      return 'ProfBetGeng';
    case 'treegroove':
      return 'TreeGroove Records';
    case 'joy-beauty-studio':
      return 'Joy Beauty Studio';
    case 'avatar':
      return 'Avatar Studio';
    case 'podcast':
      return 'Podcast Engine';
    case 'ai-school':
      return 'AI School';
    default:
      return slug;
  }
}

export function getWorkspaceRoute(workspaceId: string): string {
  const slug = resolveWorkspaceBySlug(workspaceId);
  return `projects-${slug}`;
}
