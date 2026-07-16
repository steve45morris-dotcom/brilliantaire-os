import { getDesignProfile } from './DesignProfiles.js';

export const DESIGN_QUALITY_ACTIONS = [
  'Run Audit', 'Open DESIGN.md', 'Capture Screenshots', 'Run Review',
  'View Score', 'Compare Versions', 'Start Revision',
] as const;

export type DesignQualityAction = typeof DESIGN_QUALITY_ACTIONS[number];

const details: Record<DesignQualityAction, string> = {
  'Run Audit': 'Runs the project maturity audit and records route and design-system evidence.',
  'Open DESIGN.md': 'Opens the governed project design specification for review.',
  'Capture Screenshots': 'Captures desktop and mobile evidence outside tracked source folders.',
  'Run Review': 'Invokes Frontend Design Guardian and requires an independent reviewer.',
  'View Score': 'Shows the latest evidenced score and required acceptance threshold.',
  'Compare Versions': 'Compares baseline and revised screenshot evidence.',
  'Start Revision': 'Creates a prioritized revision list from unresolved score defects.',
};

export function applyDesignDashboardAction(projectId: string, action: DesignQualityAction) {
  const profile = getDesignProfile(projectId);
  const designPath = projectId === 'joy-beauty-studio'
    ? 'docs/design/joy-beauty-studio/DESIGN.md'
    : `docs/design/profiles/${projectId}.md`;
  return {
    projectId,
    action,
    status: profile ? 'ready' as const : 'revise' as const,
    detail: profile ? details[action] : `No design profile exists for ${projectId}.`,
    evidencePaths: [designPath, '/private/tmp/frontend-design-guardian-*'],
  };
}
