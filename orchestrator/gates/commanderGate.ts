import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { summarizeReconciliation } from '../reporting/summarize.js';
import { verifySeal } from '../evidence/seal.js';
import type { ReconciliationEntry } from '../reconciliation/reconcile.js';

export interface GateResult {
  decision: 'approve-all-verified' | 'select' | 'reject';
  approvedClaimIds: string[];
}

const APPROVABLE_STATUSES = new Set(['VERIFIED']);
const SELECTIVELY_APPROVABLE_STATUSES = new Set(['VERIFIED', 'VERIFIED_WITH_CONDITIONS']);

function dependenciesApprovedRecursively(
  entry: ReconciliationEntry,
  byId: Map<string, ReconciliationEntry>,
  approvedIds: Set<string>,
  visiting = new Set<string>(),
): boolean {
  if (visiting.has(entry.claim_id)) return false;
  const nextVisiting = new Set(visiting).add(entry.claim_id);
  return (entry.depends_on ?? []).every(dependencyId => {
    const dependency = byId.get(dependencyId);
    return dependency !== undefined
      && approvedIds.has(dependencyId)
      && dependenciesApprovedRecursively(dependency, byId, approvedIds, nextVisiting);
  });
}

function loadApprovedClaimIds(runDir: string): Set<string> {
  const approvalPath = path.join(runDir, 'approved_claims.json');
  if (!fs.existsSync(approvalPath)) return new Set();
  const prior = JSON.parse(fs.readFileSync(approvalPath, 'utf-8')) as { approved_claim_ids?: string[] };
  return new Set(prior.approved_claim_ids ?? []);
}

async function defaultDecisionSource(entries: ReconciliationEntry[]): Promise<string> {
  const summary = summarizeReconciliation(entries);
  const rl = readline.createInterface({ input, output });
  try {
    output.write(
      `\nReconciliation summary: ${summary.total} total, ${summary.verified} verified, ` +
      `${summary.verified_with_conditions} verified-with-conditions, ${summary.contradicted} contradicted, ` +
      `${summary.not_verified} not-verified, ${summary.not_testable} not-testable\n\n` +
      `Decisions: "approve-all-verified" | "select:C001,C002" | "reject"\n`
    );
    return await rl.question('Decision: ');
  } finally {
    rl.close();
  }
}

export async function runCommanderGate(
  runDir: string,
  decisionSource: (entries: ReconciliationEntry[]) => Promise<string> = defaultDecisionSource
): Promise<GateResult> {
  // Re-verify the evidence seal immediately before presenting the gate — evidence
  // integrity is not a one-time check at Phase 2, it's re-checked at every recheck
  // point up to the point Commander's decision is recorded.
  const seal = verifySeal(runDir);
  if (seal.status === 'VIOLATION') {
    throw new Error(`EVIDENCE_INTEGRITY_VIOLATION: ${seal.violations.join('; ')}`);
  }

  const entries = JSON.parse(fs.readFileSync(path.join(runDir, 'reconciliation.json'), 'utf-8')) as ReconciliationEntry[];
  const byId = new Map(entries.map(entry => [entry.claim_id, entry]));
  const alreadyApprovedIds = loadApprovedClaimIds(runDir);
  const rawDecision = (await decisionSource(entries)).trim();

  if (rawDecision === 'reject') {
    return { decision: 'reject', approvedClaimIds: [] };
  }

  if (rawDecision === 'approve-all-verified') {
    const bulkCandidateIds = new Set([
      ...alreadyApprovedIds,
      ...entries.filter(e => APPROVABLE_STATUSES.has(e.status)).map(e => e.claim_id),
    ]);
    const approvedClaimIds = entries
      .filter(e => APPROVABLE_STATUSES.has(e.status))
      .filter(e => dependenciesApprovedRecursively(e, byId, bulkCandidateIds))
      .map(e => e.claim_id);
    const cumulativeApprovedIds = [...new Set([...alreadyApprovedIds, ...approvedClaimIds])];
    fs.writeFileSync(path.join(runDir, 'approved_claims.json'), JSON.stringify({ approved_claim_ids: cumulativeApprovedIds, decided_at: new Date().toISOString() }, null, 2));
    return { decision: 'approve-all-verified', approvedClaimIds: cumulativeApprovedIds };
  }

  if (rawDecision.startsWith('select:')) {
    const requestedIds = rawDecision.slice('select:'.length).split(',').map(id => id.trim()).filter(Boolean);
    for (const id of requestedIds) {
      const entry = entries.find(e => e.claim_id === id);
      if (!entry) {
        throw new Error(`unknown claim_id in selection: ${id}`);
      }
      if (!SELECTIVELY_APPROVABLE_STATUSES.has(entry.status)) {
        throw new Error(`cannot approve claim ${id} — its reconciliation status is ${entry.status}; CONTRADICTED, NOT_VERIFIED, and NOT_TESTABLE have no Phase 0-3 override path`);
      }
      const approvedForDecision = new Set([...alreadyApprovedIds, ...requestedIds]);
      if (!dependenciesApprovedRecursively(entry, byId, approvedForDecision)) {
        throw new Error(`cannot approve claim ${id} — UNSATISFIED_DEPENDENCY`);
      }
    }
    const cumulativeApprovedIds = [...new Set([...alreadyApprovedIds, ...requestedIds])];
    fs.writeFileSync(path.join(runDir, 'approved_claims.json'), JSON.stringify({ approved_claim_ids: cumulativeApprovedIds, decided_at: new Date().toISOString() }, null, 2));
    return { decision: 'select', approvedClaimIds: cumulativeApprovedIds };
  }

  throw new Error(`unrecognized decision: "${rawDecision}"`);
}
