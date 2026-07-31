import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { writePhase0Manifest } from '../core/manifest.js';
import { runAuditorPhase } from '../phase1/runAuditor.js';
import { runReconciliationPhase } from '../reconciliation/reconcile.js';
import { runCommanderGate } from '../gates/commanderGate.js';

function initFixtureRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-e2e-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), 'hello\n');
  execFileSync('git', ['add', 'README.md'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });
  return dir;
}

describe('Phase 0 -> 1 -> 2 -> 3 end to end', () => {
  let repo: string;

  beforeEach(() => {
    repo = initFixtureRepo();
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('produces a complete, schema-valid run directory and an approved_claims.json', async () => {
    const { runDir } = await writePhase0Manifest(repo, 'audit');
    expect(fs.existsSync(path.join(runDir, 'manifest.json'))).toBe(true);

    const claimsScript = [
      'const fs = require("fs");',
      `fs.writeFileSync(${JSON.stringify(path.join(runDir, 'claims.json'))}, JSON.stringify({claims:[{claim_id:"C001",claim:"README.md exists",evidence:[],verification:[{type:"file_exists",path:"README.md"}]}]}));`,
      `fs.writeFileSync(${JSON.stringify(path.join(runDir, 'narrative.md'))}, "UNTRUSTED INTERPRETATION\\n\\nREADME looks present.\\n");`,
      'console.log("auditor fixture ran");',
    ].join(' ');

    const phase1 = await runAuditorPhase(runDir, repo, 'shell-fixture', { shellExecutable: 'node', shellFixedArgs: ['-e', claimsScript] });
    expect(phase1.status).toBe('success');

    const phase2 = await runReconciliationPhase(runDir, repo);
    expect(phase2.status).toBe('success');

    const gateResult = await runCommanderGate(runDir, async () => 'approve-all-verified');
    expect(gateResult.decision).toBe('approve-all-verified');
    expect(gateResult.approvedClaimIds).toContain('C001');

    for (const expectedFile of [
      'manifest.json', 'state/phase-0.json', 'state/phase-1.json', 'state/phase-2.json',
      'evidence-index.json', 'claims.json', 'narrative.md', 'reconciliation.json', 'approved_claims.json',
    ]) {
      expect(fs.existsSync(path.join(runDir, expectedFile)), `expected ${expectedFile} to exist`).toBe(true);
    }
  });

  it('never overwrites a prior run when audit is invoked twice', async () => {
    const first = await writePhase0Manifest(repo, 'audit');
    const second = await writePhase0Manifest(repo, 'audit', { now: new Date(Date.now() + 1000) });
    expect(second.runDir).not.toBe(first.runDir);
    expect(fs.existsSync(first.runDir)).toBe(true);
  });
});
