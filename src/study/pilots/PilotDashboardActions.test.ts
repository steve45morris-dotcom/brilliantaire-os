import { describe, expect, it } from 'vitest';
import { ENGINEERING_PILOT_RECORDS } from './InitialPilotPack.js';
import { applyPilotDashboardAction } from './PilotDashboardActions.js';

describe('Engineering Skill Pilots dashboard actions', () => {
  const pilot = ENGINEERING_PILOT_RECORDS[0];

  it('opens evidence, verification, and measured outcomes', () => {
    expect(applyPilotDashboardAction(pilot, 'Open Pilot').detail).toContain(pilot.realTask);
    expect(applyPilotDashboardAction(pilot, 'View Evidence').detail).toContain(pilot.evidence[0].path);
    expect(applyPilotDashboardAction(pilot, 'Run Verification').detail).toMatch(/passed/i);
    expect(applyPilotDashboardAction(pilot, 'Record Outcome').detail).toContain(pilot.measuredOutcome?.summary);
  });

  it('records review decisions without bypassing maturity gates', () => {
    expect(applyPilotDashboardAction(pilot, 'Continue').pilot.maturityDecision).toBe('Continue Pilot');
    expect(applyPilotDashboardAction(pilot, 'Revise').pilot.maturityDecision).toBe('Revise');
    expect(applyPilotDashboardAction(pilot, 'Suspend').pilot.maturityDecision).toBe('Suspend');
    expect(applyPilotDashboardAction(pilot, 'Reject').pilot.maturityDecision).toBe('Reject');
    expect(applyPilotDashboardAction(pilot, 'Promote')).toMatchObject({
      pilot: { maturityDecision: pilot.maturityDecision },
      detail: expect.stringMatching(/operational.*blocked/i)
    });
  });

  it('does not restart a completed pilot as if evidence were absent', () => {
    expect(applyPilotDashboardAction(pilot, 'Start Pilot')).toMatchObject({
      pilot: { status: 'completed' },
      detail: expect.stringMatching(/completed/i)
    });
  });
});
