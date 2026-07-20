import { globalLiveOperationsStore } from '../kernel/live/LiveOperationsStore.js';
import { calculateVisualScore } from './DesignGuardian.js';
import { getDesignProfile } from './DesignProfiles.js';
import { PILOT_VERIFICATIONS } from './PilotVerification.js';

export const DESIGN_COMMANDS = [
  'design:audit', 'design:profile', 'design:review', 'design:score', 'design:screenshot',
  'design:compare', 'design:regression', 'design:sources', 'design:pilot',
] as const;

export type DesignCommand = typeof DESIGN_COMMANDS[number];

export function runDesignCommand(command: DesignCommand, args: string[] = []) {
  const projectId = args[0] ?? 'the-one-system';
  const profile = getDesignProfile(projectId);
  const threshold = profile?.minimumVisualScore ?? 85;
  const verification = PILOT_VERIFICATIONS[projectId];
  const visualScore = verification ? calculateVisualScore(verification.categories) : 0;
  const evidencePaths = verification
    ? [verification.evidence.report, verification.evidence.desktop, verification.evidence.mobile, ...verification.evidence.interactiveStates]
    : [
      'docs/design/PROJECT_DESIGN_PROFILES.md',
      `/private/tmp/frontend-design-guardian-${projectId}-desktop.png`,
      `/private/tmp/frontend-design-guardian-${projectId}-mobile.png`,
    ];
  const blockers = !profile
    ? ['Unknown project.']
    : verification
      ? [
        ...verification.unresolvedBlockers,
        ...(visualScore >= threshold ? [] : ['Visual evidence has not reached the acceptance threshold.']),
      ]
      : ['No independent visual verification record exists for this project.'];
  const decision = blockers.length === 0 ? 'pass' as const : 'revise' as const;
  const result = { status: profile ? 'ok' as const : 'error' as const, command, projectId, evidencePaths, threshold, visualScore, blockers, decision };
  globalLiveOperationsStore.addEvent({
    id: `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'DesignCommandExecuted',
    timestamp: new Date().toISOString(),
    source: 'DesignCli',
    actor: 'Design Review Agent',
    severity: decision === 'pass' ? 'info' : 'warn',
    message: `${command} returned ${decision} for ${projectId}.`,
    data: result,
    attention: decision === 'revise',
  });
  return result;
}
