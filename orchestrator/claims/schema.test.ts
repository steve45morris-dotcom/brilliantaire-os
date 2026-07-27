import { describe, it, expect } from 'vitest';
import { ClaimsFile } from './schema.js';

describe('ClaimsFile schema', () => {
  it('accepts a well-formed claims file with a process instruction', () => {
    const input = {
      claims: [
        {
          claim_id: 'C001',
          claim: '34 skills are missing',
          evidence: ['raw/skills-diff.txt'],
          verification: [
            { type: 'process', executable: 'comm', args: ['-23', 'expected-skills.txt', 'actual-skills.txt'] },
          ],
        },
      ],
    };
    const result = ClaimsFile.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts each of the 9 instruction types', () => {
    const base = { claim_id: 'C001', claim: 'x', evidence: [] };
    const instructions = [
      { type: 'process', executable: 'cat', args: ['README.md'] },
      { type: 'file_exists', path: 'a.ts' },
      { type: 'file_absent', path: 'b.ts' },
      { type: 'file_hash', path: 'a.ts' },
      { type: 'file_contains', path: 'a.ts', pattern: 'foo' },
      { type: 'git_diff' },
      { type: 'git_status' },
      { type: 'test' },
      { type: 'typecheck' },
      { type: 'build' },
    ];
    for (const instruction of instructions) {
      const result = ClaimsFile.safeParse({ claims: [{ ...base, verification: [instruction] }] });
      expect(result.success, `instruction type ${instruction.type} should be valid`).toBe(true);
    }
  });

  it('rejects a claim_id that does not match the C### pattern', () => {
    const result = ClaimsFile.safeParse({
      claims: [{ claim_id: 'bad-id', claim: 'x', evidence: [], verification: [{ type: 'git_status' }] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown instruction type', () => {
    const result = ClaimsFile.safeParse({
      claims: [{ claim_id: 'C001', claim: 'x', evidence: [], verification: [{ type: 'nonsense' }] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a process instruction with a non-"repo" cwd', () => {
    const result = ClaimsFile.safeParse({
      claims: [{
        claim_id: 'C001', claim: 'x', evidence: [],
        verification: [{ type: 'process', executable: 'cat', args: [], cwd: '/etc' }],
      }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts claim dependencies that use claim IDs', () => {
    const result = ClaimsFile.safeParse({
      claims: [{ claim_id: 'C002', claim: 'x', evidence: [], depends_on: ['C001'], verification: [{ type: 'git_status' }] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty agent-supplied justification', () => {
    const result = ClaimsFile.safeParse({
      claims: [{ claim_id: 'C001', claim: 'x', evidence: [], justification: '', verification: [{ type: 'git_status' }] }],
    });
    expect(result.success).toBe(false);
  });
});
