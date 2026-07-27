import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { runReconciliationPhase } from './reconcile.js';
import { captureRawEvidence } from '../evidence/capture.js';
import { captureRepoIdentity } from '../core/repoState.js';

describe('runReconciliationPhase', () => {
  let repo: string;
  let runDir: string;

  beforeEach(async () => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-recon-repo-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
    fs.writeFileSync(path.join(repo, 'README.md'), 'hello\n');
    execFileSync('git', ['add', 'README.md'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repo });

    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-recon-run-'));
    fs.mkdirSync(path.join(runDir, 'raw'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'state'), { recursive: true });
    const repoIdentity = await captureRepoIdentity(repo);
    fs.writeFileSync(path.join(runDir, 'state', 'phase-1.json'), JSON.stringify({
      phase: 'phase-1', recordedAt: new Date().toISOString(),
      repo: repoIdentity,
    }));
    captureRawEvidence(runDir, 'placeholder.txt', 'evidence');

    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({
      claims: [
        { claim_id: 'C001', claim: 'README.md exists', evidence: ['raw/placeholder.txt'], verification: [{ type: 'file_exists', path: 'README.md' }] },
        { claim_id: 'C002', claim: 'nonexistent.txt exists', evidence: [], verification: [{ type: 'file_exists', path: 'nonexistent.txt' }] },
      ],
    }));
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('produces reconciliation.json with correctly classified statuses', async () => {
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('success');

    const reconciliation = JSON.parse(fs.readFileSync(path.join(runDir, 'reconciliation.json'), 'utf-8'));
    const c001 = reconciliation.find((r: any) => r.claim_id === 'C001');
    const c002 = reconciliation.find((r: any) => r.claim_id === 'C002');
    expect(c001.status).toBe('VERIFIED');
    expect(c002.status).toBe('CONTRADICTED');
  });

  it('detects a tampered raw/ file as EVIDENCE_INTEGRITY_VIOLATION before reconciling', async () => {
    fs.writeFileSync(path.join(runDir, 'raw', 'placeholder.txt'), 'tampered');
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('EVIDENCE_INTEGRITY_VIOLATION');
  });

  it('detects repository drift since phase-1 as REPOSITORY_STATE_DRIFT', async () => {
    fs.writeFileSync(path.join(repo, 'new-file.txt'), 'surprise');
    execFileSync('git', ['add', 'new-file.txt'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'unexpected change'], { cwd: repo });
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('REPOSITORY_STATE_DRIFT');
  });

  it('caps a claim that targets the agent-writable run output at VERIFIED_WITH_CONDITIONS and marks it SELF_SPECIFIED', async () => {
    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({ claims: [{
      claim_id: 'C003', claim: 'agent output exists', evidence: [], depends_on: [],
      verification: [{ type: 'file_exists', path: path.relative(repo, path.join(runDir, 'narrative.md')) }],
    }] }));
    fs.writeFileSync(path.join(runDir, 'narrative.md'), 'agent-created');
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('success');
    const [entry] = JSON.parse(fs.readFileSync(path.join(runDir, 'reconciliation.json'), 'utf-8'));
    expect(entry.self_specified).toBe(true);
    expect(entry.status).toBe('VERIFIED_WITH_CONDITIONS');
  });
});
