import type { ReconciliationEntry } from '../reconciliation/reconcile.js';

export interface ReconciliationSummary {
  total: number;
  verified: number;
  verified_with_conditions: number;
  contradicted: number;
  not_verified: number;
  not_testable: number;
}

export function summarizeReconciliation(entries: Pick<ReconciliationEntry, 'status'>[]): ReconciliationSummary {
  return {
    total: entries.length,
    verified: entries.filter(e => e.status === 'VERIFIED').length,
    verified_with_conditions: entries.filter(e => e.status === 'VERIFIED_WITH_CONDITIONS').length,
    contradicted: entries.filter(e => e.status === 'CONTRADICTED').length,
    not_verified: entries.filter(e => e.status === 'NOT_VERIFIED').length,
    not_testable: entries.filter(e => e.status === 'NOT_TESTABLE').length,
  };
}
