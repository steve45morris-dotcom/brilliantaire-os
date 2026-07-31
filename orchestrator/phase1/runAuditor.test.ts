import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { runAuditorPhase } from './runAuditor.js';

function initFixtureRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-phase1-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), 'hello\n');
  execFileSync('git', ['add', 'README.md'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });
  return dir;
}

describe('runAuditorPhase', () => {
  let repo: string;
  let runDir: string;

  beforeEach(() => {
    repo = initFixtureRepo();
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-phase1-run-'));
    fs.mkdirSync(path.join(runDir, 'raw'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'state'), { recursive: true });

    const claimsPayload = JSON.stringify({
      claims: [{ claim_id: 'C001', claim: 'README.md exists', evidence: [], verification: [{ type: 'file_exists', path: 'README.md' }] }],
    });
    fs.writeFileSync(path.join(runDir, '__fixture_claims.json'), claimsPayload);
    fs.writeFileSync(path.join(runDir, '__fixture_narrative.md'), 'UNTRUSTED INTERPRETATION\n\nThe README exists.\n');
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('produces a valid claims.json, a labeled narrative.md, raw evidence, and a phase-1 state snapshot', async () => {
    const result = await runAuditorPhase(runDir, repo, 'shell', {
      shellFixedArgs: ['-e', `require('fs').copyFileSync('${path.join(runDir, '__fixture_claims.json')}', '${path.join(runDir, 'claims.json')}'); require('fs').copyFileSync('${path.join(runDir, '__fixture_narrative.md')}', '${path.join(runDir, 'narrative.md')}'); console.log('auditor ran');`],
      shellExecutable: 'node',
    });

    expect(result.status).toBe('success');
    expect(fs.existsSync(path.join(runDir, 'claims.json'))).toBe(true);
    expect(fs.readFileSync(path.join(runDir, 'narrative.md'), 'utf-8')).toContain('UNTRUSTED INTERPRETATION');
    expect(fs.existsSync(path.join(runDir, 'raw', 'shell-session-transcript.txt'))).toBe(true);
    expect(fs.existsSync(path.join(runDir, 'state', 'phase-1.json'))).toBe(true);
  });
});
