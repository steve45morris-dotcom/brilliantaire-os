import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runPhase0Cli } from './orchestrator-phase0.js';

describe('orchestrator-phase0 runner', () => {
  let repo: string;

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-phase0-cli-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'cli@example.test'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Phase 0 CLI'], { cwd: repo });
    fs.writeFileSync(path.join(repo, 'README.md'), 'cli\n');
    execFileSync('git', ['add', 'README.md'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'fixture'], { cwd: repo });
  });

  afterEach(() => fs.rmSync(repo, { recursive: true, force: true }));

  it('creates only a Phase 0 snapshot and reports its run directory', async () => {
    const output = await runPhase0Cli(repo);
    expect(output.phase).toBe('phase-0');
    expect(fs.existsSync(path.join(output.runDir, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(output.runDir, 'state', 'phase-0.json'))).toBe(true);
    expect(fs.existsSync(path.join(output.runDir, 'claims.json'))).toBe(false);
  });
});
