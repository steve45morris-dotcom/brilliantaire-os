import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runCommanderGate } from './commanderGate.js';

describe('runCommanderGate', () => {
  let runDir: string;

  beforeEach(() => {
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-gate-'));
    fs.writeFileSync(path.join(runDir, 'reconciliation.json'), JSON.stringify([
      { claim_id: 'C001', claim: 'a', depends_on: [], status: 'VERIFIED' },
      { claim_id: 'C002', claim: 'b', depends_on: ['C001'], status: 'VERIFIED_WITH_CONDITIONS' },
      { claim_id: 'C003', claim: 'c', depends_on: [], status: 'CONTRADICTED' },
      { claim_id: 'C004', claim: 'd', depends_on: [], status: 'NOT_TESTABLE', justification: 'fixture has no test script' },
    ]));
  });

  afterEach(() => {
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('"approve-all-verified" writes approved_claims.json with only VERIFIED claims', async () => {
    const result = await runCommanderGate(runDir, async () => 'approve-all-verified');
    expect(result.decision).toBe('approve-all-verified');
    const approved = JSON.parse(fs.readFileSync(path.join(runDir, 'approved_claims.json'), 'utf-8'));
    expect(approved.approved_claim_ids.sort()).toEqual(['C001']);
  });

  it('"select:C001" approves only the named claim', async () => {
    const result = await runCommanderGate(runDir, async () => 'select:C001');
    expect(result.decision).toBe('select');
    const approved = JSON.parse(fs.readFileSync(path.join(runDir, 'approved_claims.json'), 'utf-8'));
    expect(approved.approved_claim_ids).toEqual(['C001']);
  });

  it('rejects an attempt to select a CONTRADICTED claim by ID', async () => {
    await expect(runCommanderGate(runDir, async () => 'select:C003')).rejects.toThrow(/CONTRADICTED/);
  });

  it('requires dependencies recursively against selected or already-approved IDs and excludes NOT_TESTABLE from bulk approval', async () => {
    await expect(runCommanderGate(runDir, async () => 'select:C002')).rejects.toThrow(/dependency/i);
    const selected = await runCommanderGate(runDir, async () => 'select:C001,C002');
    expect(selected.approvedClaimIds).toEqual(['C001', 'C002']);
    const result = await runCommanderGate(runDir, async () => 'approve-all-verified');
    expect(result.approvedClaimIds).not.toContain('C004');
  });

  it('"reject" writes no approved_claims.json', async () => {
    const result = await runCommanderGate(runDir, async () => 'reject');
    expect(result.decision).toBe('reject');
    expect(fs.existsSync(path.join(runDir, 'approved_claims.json'))).toBe(false);
  });
});
