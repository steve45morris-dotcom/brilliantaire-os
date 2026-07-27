import fs from 'node:fs';
import path from 'node:path';
import { executeInstruction } from './engine.js';
import { verifyEvidenceIntegrity } from '../evidence/capture.js';
import { captureRepoIdentity, compareRepoIdentity } from '../core/repoState.js';
import type { ClaimsFile, Claim } from '../claims/schema.js';
import type { StateSnapshot, RepoIdentity } from '../core/types.js';

export type ReconciliationStatus = 'VERIFIED' | 'VERIFIED_WITH_CONDITIONS' | 'NOT_VERIFIED' | 'CONTRADICTED' | 'NOT_TESTABLE';

export interface ReconciliationEntry {
  claim_id: string;
  claim: string;
  depends_on: string[];
  verification_procedure: string;
  expected_result?: string;
  actual_result: string;
  exit_code: number;
  evidence: string[];
  self_specified: boolean;
  resolved_targets: string[];
  justification?: string;
  status: ReconciliationStatus;
}

export type Phase2Result =
  | { status: 'success' }
  | { status: 'EVIDENCE_INTEGRITY_VIOLATION'; violations: string[] }
  | { status: 'REPOSITORY_STATE_DRIFT'; reasons: string[] };

function resolveVerificationTargets(verification: Claim['verification'], repoRoot: string): string[] {
  return verification.flatMap(instruction => {
    if ('path' in instruction) return [path.resolve(repoRoot, instruction.path)];
    return [];
  });
}

function isWithinAgentWritableOutputPath(target: string, runDir: string): boolean {
  const outputRoot = path.resolve(runDir);
  return target === outputRoot || target.startsWith(`${outputRoot}${path.sep}`);
}

function classify(hints: Array<'pass' | 'fail' | 'not_testable'>, selfSpecified: boolean): ReconciliationStatus {
  if (hints.every(h => h === 'not_testable')) return 'NOT_TESTABLE';
  if (selfSpecified && !hints.includes('fail')) return 'VERIFIED_WITH_CONDITIONS';
  if (hints.every(h => h === 'pass')) return 'VERIFIED';
  if (hints.some(h => h === 'pass') && hints.some(h => h === 'not_testable') && !hints.includes('fail')) return 'VERIFIED_WITH_CONDITIONS';
  if (hints.every(h => h === 'fail')) return 'CONTRADICTED';
  return 'NOT_VERIFIED';
}

export async function runReconciliationPhase(runDir: string, repoRoot: string): Promise<Phase2Result> {
  const integrity = verifyEvidenceIntegrity(runDir);
  if (integrity.status === 'VIOLATION') {
    return { status: 'EVIDENCE_INTEGRITY_VIOLATION', violations: integrity.violations };
  }

  const phase1State = JSON.parse(fs.readFileSync(path.join(runDir, 'state', 'phase-1.json'), 'utf-8')) as StateSnapshot;
  const currentIdentity = await captureRepoIdentity(repoRoot);
  const comparison = compareRepoIdentity(phase1State.repo, currentIdentity);
  if (comparison.status === 'DRIFT') {
    return { status: 'REPOSITORY_STATE_DRIFT', reasons: comparison.reasons };
  }

  const claimsFile = JSON.parse(fs.readFileSync(path.join(runDir, 'claims.json'), 'utf-8')) as ClaimsFile;
  const entries: ReconciliationEntry[] = [];

  for (const claim of claimsFile.claims) {
    const hints: Array<'pass' | 'fail' | 'not_testable'> = [];
    const actualResults: string[] = [];
    let lastExitCode = 0;

    const resolvedTargets = resolveVerificationTargets(claim.verification, repoRoot);
    const selfSpecified = resolvedTargets.some(target => isWithinAgentWritableOutputPath(target, runDir));
    for (const instruction of claim.verification) {
      const outcome = await executeInstruction(instruction, repoRoot);
      hints.push(outcome.status_hint);
      actualResults.push(outcome.actual_result);
      lastExitCode = outcome.exit_code;
    }

    entries.push({
      claim_id: claim.claim_id,
      claim: claim.claim,
      depends_on: claim.depends_on,
      verification_procedure: JSON.stringify(claim.verification),
      actual_result: actualResults.join('\n---\n'),
      exit_code: lastExitCode,
      evidence: claim.evidence,
      self_specified: selfSpecified,
      resolved_targets: resolvedTargets,
      justification: hints.every(h => h === 'not_testable') ? claim.justification : undefined,
      status: classify(hints, selfSpecified),
    });
  }

  if (entries.some(entry => entry.status === 'NOT_TESTABLE' && !entry.justification?.trim())) {
    throw new Error('NOT_TESTABLE_WITHOUT_JUSTIFICATION');
  }

  fs.writeFileSync(path.join(runDir, 'reconciliation.json'), JSON.stringify(entries, null, 2));

  const phase2Snapshot: StateSnapshot = { phase: 'phase-2', repo: currentIdentity, recordedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(runDir, 'state', 'phase-2.json'), JSON.stringify(phase2Snapshot, null, 2));

  return { status: 'success' };
}
