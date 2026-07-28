import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { runReconciliationPhase } from './reconcile.js';
import { captureRawEvidence } from '../evidence/capture.js';
import { sealEvidence } from '../evidence/seal.js';
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

    // Write the Auditor's outputs first, then seal — matching production order in
    // runAuditor.ts, where sealEvidence() is the final Phase 1 step, after claims.json
    // and narrative.md exist. The seal now covers those two files (C002b).
    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({
      claims: [
        { claim_id: 'C001', claim: 'README.md exists', evidence: ['raw/placeholder.txt'], verification: [{ type: 'file_exists', path: 'README.md' }] },
        { claim_id: 'C002', claim: 'nonexistent.txt exists', evidence: [], verification: [{ type: 'file_exists', path: 'nonexistent.txt' }] },
      ],
    }));
    fs.writeFileSync(path.join(runDir, 'narrative.md'), 'UNTRUSTED INTERPRETATION\n');
    sealEvidence(runDir);
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

  it('detects a missing evidence seal as EVIDENCE_INTEGRITY_VIOLATION', async () => {
    fs.rmSync(path.join(runDir, 'evidence-seal.json'));
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('EVIDENCE_INTEGRITY_VIOLATION');
  });

  it('detects a file smuggled into raw/ after sealing, even with a correctly-hashed index entry', async () => {
    // A per-file hash check alone would pass here — the smuggled file's own hash is
    // correctly recorded, so a bare verifyEvidenceIntegrity() call would say MATCH.
    // Only the seal's file_count / index-hash lock catches the extra entry.
    const crypto = await import('node:crypto');
    const content = 'not part of the original seal';
    fs.writeFileSync(path.join(runDir, 'raw', 'smuggled.txt'), content);
    const index = JSON.parse(fs.readFileSync(path.join(runDir, 'evidence-index.json'), 'utf-8'));
    index['raw/smuggled.txt'] = {
      sha256: crypto.createHash('sha256').update(content).digest('hex'),
      captured_at: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(runDir, 'evidence-index.json'), JSON.stringify(index));
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
    // Re-seal: these are legitimate new Phase 1 outputs, so the seal must reflect them
    // (otherwise the C002b seal correctly reports them as tampered).
    sealEvidence(runDir);
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('success');
    const [entry] = JSON.parse(fs.readFileSync(path.join(runDir, 'reconciliation.json'), 'utf-8'));
    expect(entry.self_specified).toBe(true);
    expect(entry.status).toBe('VERIFIED_WITH_CONDITIONS');
  });

  it('detects an edited claims.json as EVIDENCE_INTEGRITY_VIOLATION (seal covers it, C002b)', async () => {
    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({
      claims: [{ claim_id: 'C001', claim: 'swapped for something that always passes', evidence: [], verification: [{ type: 'git_status' }] }],
    }));
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('EVIDENCE_INTEGRITY_VIOLATION');
  });

  it('re-validates claims.json in Phase 2 and returns CLAIMS_SCHEMA_INVALID for a schema-invalid (but correctly sealed) file (C002a)', async () => {
    // A schema-invalid claims.json that IS sealed to match — so the seal passes and the
    // independent Phase 2 re-validation is what must catch it. This layer would never be
    // reached in practice (Phase 1 validates before sealing), so it is defense-in-depth.
    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({
      claims: [{ claim_id: 'BAD-ID', claim: 'malformed claim id', evidence: [], verification: [{ type: 'git_status' }] }],
    }));
    sealEvidence(runDir);
    const result = await runReconciliationPhase(runDir, repo);
    expect(result.status).toBe('CLAIMS_SCHEMA_INVALID');
  });
});
