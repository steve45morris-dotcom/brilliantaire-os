import { describe, it, expect } from 'vitest';
import { summarizeReconciliation } from './summarize.js';

describe('summarizeReconciliation', () => {
  it('counts each status correctly', () => {
    const results = [
      { status: 'VERIFIED' }, { status: 'VERIFIED' }, { status: 'VERIFIED_WITH_CONDITIONS' },
      { status: 'CONTRADICTED' }, { status: 'NOT_VERIFIED' }, { status: 'NOT_TESTABLE' },
    ] as any[];
    const summary = summarizeReconciliation(results);
    expect(summary).toEqual({
      total: 6, verified: 2, verified_with_conditions: 1, contradicted: 1, not_verified: 1, not_testable: 1,
    });
  });
});
