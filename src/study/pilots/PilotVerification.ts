import type { MaturityLevel, PilotRecord } from './PilotTypes.js';

export interface PilotGateResult {
  passed: boolean;
  blockers: string[];
}

export function verifyPilot(pilot: PilotRecord, target: MaturityLevel): PilotGateResult {
  const blockers: string[] = [];

  if (target === 'Experimental') {
    if (!pilot.procedure.length) blockers.push('Approved pilot plan is missing.');
    if (!pilot.realTask) blockers.push('Real task is missing.');
    if (!pilot.failureConditions.length) blockers.push('Risks are not documented.');
  }

  if (target === 'Verified' || target === 'Operational') {
    if (pilot.status !== 'measured' && pilot.status !== 'completed') blockers.push('Real pilot is not measured.');
    if (!pilot.evidence.some((item) => item.verified)) blockers.push('Verified evidence is missing.');
    if (!pilot.verificationResult?.passed) blockers.push('Verification checks have not passed.');
    if (!pilot.measuredOutcome) blockers.push('Measured outcome is missing.');
    if (!pilot.reviewer) blockers.push('Reviewer approval is missing.');
  }

  if (target === 'Operational') {
    blockers.push('Repeated successful use is required before Operational promotion.');
    blockers.push('A single pilot cannot establish sustained measurable value.');
  }

  return { passed: blockers.length === 0, blockers };
}
