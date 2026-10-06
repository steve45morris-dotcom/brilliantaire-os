// Tests for recovery-run's per-job decision.
//
// The defect behind this module: recovery-run wrote a text placeholder over the
// real asset and restored it from a utf-8 decoded copy, so a PNG came back with
// a broken signature. recovery-run no longer writes asset files at all; these
// tests pin down what it decides instead.

import { describe, it, expect } from 'vitest';
import { classifyRecovery, planRecovery, type RecoveryParent } from './recovery-plan.js';

const OLD = 'a'.repeat(64);
const NEW = 'b'.repeat(64);

function parent(overrides: Partial<RecoveryParent> = {}): RecoveryParent {
  return { id: 'IMG-01', recordedVersion: 2, currentVersion: 2, approved: true, ...overrides };
}

describe('planRecovery', () => {
  it('waits when no file is staged', () => {
    const plan = planRecovery({ stagedSha: null, entry: { sha256: OLD, approvalState: 'STALE' }, parents: [parent()] });
    expect(plan.kind).toBe('await_file');
  });

  it('waits, naming the parent, when the staged file predates a parent change', () => {
    const plan = planRecovery({
      stagedSha: OLD,
      entry: { sha256: OLD, approvalState: 'STALE' },
      parents: [parent({ currentVersion: 3 })]
    });
    expect(plan).toEqual({
      kind: 'await_file',
      reason: 'The staged file was made from older parents. Regenerate it by hand from IMG-01 v3.'
    });
  });

  it('validates a new file normally', () => {
    const plan = planRecovery({
      stagedSha: NEW,
      entry: { sha256: OLD, approvalState: 'STALE' },
      parents: [parent({ currentVersion: 3 })]
    });
    expect(plan).toEqual({ kind: 'validate', force: false });
  });

  it('validates normally when validate already recorded the new file', () => {
    for (const approvalState of ['TECHNICALLY_VERIFIED', 'APPROVED', 'REJECTED', 'STAGED']) {
      const plan = planRecovery({ stagedSha: NEW, entry: { sha256: NEW, approvalState }, parents: [parent()] });
      expect(plan, approvalState).toEqual({ kind: 'validate', force: false });
    }
  });

  it('re-probes in place a file made from the current parents that was held only for approval', () => {
    const plan = planRecovery({
      stagedSha: OLD,
      entry: { sha256: OLD, approvalState: 'STALE' },
      parents: [parent({ approved: false }), parent({ id: 'AUD-01', recordedVersion: 1, currentVersion: 1 })]
    });
    expect(plan).toEqual({ kind: 'validate', force: true });
  });

  it('forces a re-probe only for an unchanged STALE file whose parents have not moved', () => {
    const shas = [null, OLD, NEW];
    const states = ['STALE', 'TECHNICALLY_VERIFIED', 'APPROVED', 'REJECTED'];
    const parentSets = [[parent()], [parent({ currentVersion: 3 })], [parent({ approved: false })]];
    for (const stagedSha of shas) {
      for (const approvalState of states) {
        for (const parents of parentSets) {
          const plan = planRecovery({ stagedSha, entry: { sha256: OLD, approvalState }, parents });
          const forced = plan.kind === 'validate' && plan.force;
          const shouldForce =
            stagedSha === OLD &&
            approvalState === 'STALE' &&
            parents.every(p => p.currentVersion <= p.recordedVersion);
          expect(forced, `${stagedSha?.[0]}/${approvalState}/${JSON.stringify(parents)}`).toBe(shouldForce);
        }
      }
    }
  });

  it('treats a slot with no provenance record as a new file', () => {
    expect(planRecovery({ stagedSha: NEW, entry: undefined, parents: [] })).toEqual({ kind: 'validate', force: false });
  });
});

describe('classifyRecovery', () => {
  it('completes only when the asset left STALE and passed its checks', () => {
    expect(classifyRecovery('TECHNICALLY_VERIFIED')).toBe('COMPLETED');
    expect(classifyRecovery('APPROVED')).toBe('COMPLETED');
    expect(classifyRecovery('STALE')).toBe('WAITING_ON_PARENTS');
    expect(classifyRecovery('REJECTED')).toBe('FAILED_CHECKS');
    expect(classifyRecovery('STAGED')).toBe('HELD');
  });
});
