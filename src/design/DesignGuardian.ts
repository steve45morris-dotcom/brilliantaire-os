export const DESIGN_MD_SECTIONS = [
  'Product identity', 'Business objective', 'Audience', 'Brand personality', 'Visual references',
  'Typography system', 'Color system', 'Spacing scale', 'Grid and layout', 'Components',
  'Borders and radius', 'Elevation and shadows', 'Icons', 'Photography and artwork', 'Motion',
  'Responsive rules', 'Accessibility rules', 'Conversion hierarchy', 'Forbidden patterns',
  'Acceptance criteria',
] as const;

export const FORBIDDEN_PATTERNS = [
  'generic purple gradients', 'excessive glass cards', 'random neon',
  'identical card grids for every section', 'oversized empty hero areas',
  'meaningless dashboard statistics', 'unverified testimonials', 'generic AI imagery',
  'inconsistent icon styles', 'excessive animation', 'unreadable low-contrast text',
  'arbitrary font-size choices',
] as const;

const FORBIDDEN_MATCHERS: Array<[string, RegExp]> = [
  ['generic purple gradients', /generic\s+purple\s+gradient/i],
  ['excessive glass cards', /excessive\s+glass\s+cards?|glassmorphism\s+everywhere/i],
  ['random neon', /random\s+neon/i],
  ['identical card grids for every section', /identical\s+card\s+grids?/i],
  ['oversized empty hero areas', /oversized\s+empty\s+hero/i],
  ['meaningless dashboard statistics', /meaningless\s+dashboard\s+statistics/i],
  ['unverified testimonials', /unverified\s+testimonials?/i],
  ['generic AI imagery', /generic\s+AI\s+imagery/i],
  ['inconsistent icon styles', /inconsistent\s+icon\s+styles?/i],
  ['excessive animation', /excessive\s+animation/i],
  ['unreadable low-contrast text', /unreadable\s+low[- ]contrast\s+text/i],
  ['arbitrary font-size choices', /arbitrary\s+font[- ]size\s+choices?/i],
];

export interface VisualScoreCategories {
  brandDistinction: number;
  typography: number;
  layoutHierarchy: number;
  spacingConsistency: number;
  colorDiscipline: number;
  imageryVisualInterest: number;
  responsiveBehavior: number;
  interactionQuality: number;
  accessibility: number;
  conversionClarity: number;
}

export interface VisualEvidence {
  desktop: string;
  mobile: string;
  independentReviewer: string;
  tablet?: string;
  interactiveStates?: string[];
}

export const VISUAL_THRESHOLDS = {
  internal: 80,
  business: 85,
  flagship: 90,
} as const;

export function validateDesignSpec(markdown: string) {
  const missingSections = DESIGN_MD_SECTIONS.filter((section) =>
    !new RegExp(`^#{1,6}\\s+(?:\\d+\\.\\s*)?${section}\\s*$`, 'im').test(markdown),
  );
  return { valid: missingSections.length === 0, missingSections };
}

export function detectForbiddenPatterns(input: string): string[] {
  return FORBIDDEN_MATCHERS.filter(([, matcher]) => matcher.test(input)).map(([name]) => name);
}

export function calculateVisualScore(categories: VisualScoreCategories): number {
  return Object.values(categories).reduce((sum, score) => sum + Math.max(0, Math.min(10, score)), 0);
}

export function thresholdForProject(projectId: string): number {
  if (projectId === 'the-one-system') return VISUAL_THRESHOLDS.internal;
  if (projectId === 'icyflamze') return VISUAL_THRESHOLDS.flagship;
  return VISUAL_THRESHOLDS.business;
}

export function evaluateVisualAcceptance(input: {
  projectId: string;
  categories: VisualScoreCategories;
  evidence: VisualEvidence;
  unresolvedBlockers?: string[];
}) {
  const score = calculateVisualScore(input.categories);
  const threshold = thresholdForProject(input.projectId);
  const blockers = [...(input.unresolvedBlockers ?? [])];
  if (!input.evidence.desktop) blockers.push('Desktop screenshot evidence is required.');
  if (!input.evidence.mobile) blockers.push('Mobile screenshot evidence is required.');
  if (!input.evidence.independentReviewer) blockers.push('Independent review evidence is required.');
  if (score < threshold) blockers.push(`Visual score ${score} is below the required threshold ${threshold}.`);
  return { score, threshold, blockers, decision: blockers.length === 0 ? 'pass' as const : 'revise' as const };
}
