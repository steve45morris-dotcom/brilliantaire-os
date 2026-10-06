// What `recovery-run` does for one approved recovery job, in render intake v2.
//
// An asset goes STALE when a parent it was made from changes version, or when a
// parent is not yet APPROVED. Recovering it means making a new version BY HAND
// from the current parents: generation is manual by rule. So recovery-run never
// writes to an asset file. It reads what the Commander placed and decides:
//
//   - nothing new to look at  -> wait, and say exactly what to regenerate;
//   - a new file              -> validate it as any other new version;
//   - the same file, made against the current parents, held STALE only
//     because a parent was not approved yet -> re-probe it in place.
//
// The previous implementation wrote a text placeholder over the asset, then
// "rolled back" from a utf-8 decoded copy, which destroyed any PNG or video.
//
// Pure, so the decision can be tested without touching the intake folder.

export interface RecoveryParent {
  id: string;
  /** The parent version this asset's file was made against. */
  recordedVersion: number;
  /** The parent's version now. */
  currentVersion: number;
  approved: boolean;
}

export interface RecoveryEntry {
  sha256: string;
  approvalState: string;
}

export type RecoveryPlan =
  | { kind: 'await_file'; reason: string }
  | { kind: 'validate'; force: boolean };

export function planRecovery(input: {
  stagedSha: string | null;
  entry: RecoveryEntry | undefined;
  parents: RecoveryParent[];
}): RecoveryPlan {
  const { stagedSha, entry, parents } = input;

  if (stagedSha === null) {
    return { kind: 'await_file', reason: 'No file is staged for this slot.' };
  }

  // A file validate has not seen yet: the Commander placed a new version.
  if (!entry || entry.sha256 !== stagedSha) {
    return { kind: 'validate', force: false };
  }

  // validate already took the new file; reconcile from what it recorded.
  if (entry.approvalState !== 'STALE') {
    return { kind: 'validate', force: false };
  }

  const outdated = parents.filter(p => p.currentVersion > p.recordedVersion);
  if (outdated.length > 0) {
    const list = outdated.map(p => `${p.id} v${p.currentVersion}`).join(', ');
    return {
      kind: 'await_file',
      reason: `The staged file was made from older parents. Regenerate it by hand from ${list}.`
    };
  }

  // Same bytes, made against the current parents: STALE only because a parent
  // was not approved when it was checked. Re-probe it rather than keep it stuck.
  return { kind: 'validate', force: true };
}

export type RecoveryResult = 'COMPLETED' | 'WAITING_ON_PARENTS' | 'FAILED_CHECKS' | 'HELD';

/** Classify an asset's state after recovery-run validated it. */
export function classifyRecovery(stateAfter: string): RecoveryResult {
  if (stateAfter === 'STALE') return 'WAITING_ON_PARENTS';
  if (stateAfter === 'REJECTED') return 'FAILED_CHECKS';
  if (stateAfter === 'STAGED') return 'HELD';
  return 'COMPLETED';
}
