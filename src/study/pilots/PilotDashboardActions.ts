import type { MaturityDecision, PilotRecord } from './PilotTypes.js';

export type PilotDashboardAction =
  | 'Open Pilot'
  | 'Start Pilot'
  | 'View Evidence'
  | 'Run Verification'
  | 'Record Outcome'
  | 'Make Maturity Decision'
  | 'Promote'
  | 'Continue'
  | 'Revise'
  | 'Suspend'
  | 'Reject';

export interface PilotDashboardActionResult {
  pilot: PilotRecord;
  detail: string;
}

const DECISIONS: Partial<Record<PilotDashboardAction, MaturityDecision>> = {
  Continue: 'Continue Pilot',
  Revise: 'Revise',
  Suspend: 'Suspend',
  Reject: 'Reject'
};

export function applyPilotDashboardAction(
  source: PilotRecord,
  action: PilotDashboardAction
): PilotDashboardActionResult {
  const pilot = structuredClone(source);
  const decision = DECISIONS[action];
  if (decision) {
    pilot.maturityDecision = decision;
    return { pilot, detail: `Maturity decision recorded: ${decision}.` };
  }
  if (action === 'Open Pilot') return { pilot, detail: `${pilot.realTask} Objective: ${pilot.objective}` };
  if (action === 'View Evidence') return { pilot, detail: pilot.evidence.map((item) => item.path).join('\n') };
  if (action === 'Run Verification') return { pilot, detail: pilot.verificationResult?.passed ? 'Verification passed with stored evidence.' : 'Verification is incomplete.' };
  if (action === 'Record Outcome') return { pilot, detail: pilot.measuredOutcome?.summary ?? 'No measured outcome is recorded.' };
  if (action === 'Make Maturity Decision') return { pilot, detail: `Current decision: ${pilot.maturityDecision ?? 'Pending reviewer decision'}.` };
  if (action === 'Promote') return { pilot, detail: 'Operational promotion blocked: repeated successful use is required after this first pilot.' };
  if (action === 'Start Pilot') {
    return pilot.status === 'completed'
      ? { pilot, detail: 'Pilot is already completed. Start a separately approved cycle to collect repeated-use evidence.' }
      : { pilot: { ...pilot, status: 'running', startedAt: pilot.startedAt ?? new Date().toISOString() }, detail: 'Pilot started.' };
  }
  return { pilot, detail: `Action ${action} completed.` };
}
