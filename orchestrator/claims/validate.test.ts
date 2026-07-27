import { describe, it, expect } from 'vitest';
import { validateClaimsFile } from './validate.js';

describe('validateClaimsFile', () => {
  it('accepts a claim whose process instruction uses an allowlisted executable', () => {
    const result = validateClaimsFile({
      claims: [{
        claim_id: 'C001', claim: 'x', evidence: [],
        verification: [{ type: 'process', executable: 'cat', args: ['README.md'] }],
      }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a claim whose process instruction uses a non-allowlisted executable', () => {
    const result = validateClaimsFile({
      claims: [{
        claim_id: 'C001', claim: 'x', evidence: [],
        verification: [{ type: 'process', executable: 'rm', args: ['-rf', '.'] }],
      }],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some(e => e.includes('rm') && e.includes('allowlist'))).toBe(true);
    }
  });

  it('rejects the whole file, not just the bad claim, when one claim is invalid', () => {
    const result = validateClaimsFile({
      claims: [
        { claim_id: 'C001', claim: 'good', evidence: [], verification: [{ type: 'git_status' }] },
        {
          claim_id: 'C002', claim: 'bad', evidence: [],
          verification: [{ type: 'process', executable: 'curl', args: [] }],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects git and find as process executables', () => {
    for (const executable of ['git', 'find']) {
      const result = validateClaimsFile({
        claims: [{ claim_id: 'C001', claim: 'unsafe generic process', evidence: [], verification: [{ type: 'process', executable, args: [] }] }],
      });
      expect(result.valid).toBe(false);
    }
  });

  it('rejects an unknown dependency ID with a diagnostic', () => {
    const result = validateClaimsFile({
      claims: [{ claim_id: 'C001', claim: 'x', evidence: [], depends_on: ['C999'], verification: [{ type: 'git_status' }] }],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain('claim C001: unknown dependency "C999"');
  });
});
