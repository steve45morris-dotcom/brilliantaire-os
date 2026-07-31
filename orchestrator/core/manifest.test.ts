import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRunDir, RunDirectoryCollisionError } from './runPaths.js';
import { captureRepoIdentity, type GitRunner } from './repoState.js';
import { writePhase0Manifest, writeStateSnapshot } from './manifest.js';

function initFixtureRepo(withOrigin = true): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-phase0-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'phase0@example.test'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Phase 0 Test'], { cwd: repo });
  if (withOrigin) execFileSync('git', ['remote', 'add', 'origin', 'https://example.test/phase0.git'], { cwd: repo });
  fs.writeFileSync(path.join(repo, 'README.md'), 'phase 0\n');
  execFileSync('git', ['add', 'README.md'], { cwd: repo });
  execFileSync('git', ['commit', '-q', '-m', 'fixture'], { cwd: repo });
  return repo;
}

describe('Phase 0 repository snapshot', () => {
  let repo: string;

  beforeEach(() => {
    repo = initFixtureRepo();
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('writes an immutable manifest with repository and agent identity', async () => {
    const result = await writePhase0Manifest(repo, 'audit', {
      now: new Date('2026-07-26T12:34:56.000Z'),
      agentRole: 'Auditor',
      agentModel: 'codex-cli',
      sandboxMode: 'read-only',
    });
    const manifestPath = path.join(result.runDir, 'manifest.json');
    const before = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(before);

    expect(manifest.repo.repoRoot).toBe(fs.realpathSync(repo));
    expect(manifest.repo.branch).toBeTruthy();
    expect(manifest.repo.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(manifest.repo.remote).toBe('https://example.test/phase0.git');
    expect(manifest.repo.workingTreeStatusHash).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.timestamp).toBe('2026-07-26T12:34:56.000Z');
    expect(manifest.agentRole).toBe('Auditor');
    expect(manifest.agentModel).toBe('codex-cli');
    expect(manifest.sandboxMode).toBe('read-only');

    writeStateSnapshot(result.runDir, 'phase-1', result.manifest.repo);
    expect(fs.readFileSync(manifestPath, 'utf8')).toBe(before);
  });

  it('records null when no origin is configured', async () => {
    fs.rmSync(repo, { recursive: true, force: true });
    repo = initFixtureRepo(false);
    const result = await writePhase0Manifest(repo, 'audit');
    expect(result.manifest.repo.remote).toBeNull();
  });

  it('hard-stops with no run directory when git rev-parse fails', async () => {
    const runsRoot = path.join(repo, 'runs');
    const failingGit: GitRunner = async (args) => {
      if (args[0] === 'rev-parse') throw new Error('rev-parse failed');
      return '';
    };

    await expect(writePhase0Manifest(repo, 'audit', { runGit: failingGit })).rejects.toThrow('rev-parse failed');
    expect(fs.existsSync(runsRoot)).toBe(false);
  });

  it('hard-stops with no run directory when configured origin cannot be read', async () => {
    const runsRoot = path.join(repo, 'runs');
    const realIdentity = await captureRepoIdentity(repo);
    const failingOrigin: GitRunner = async (args) => {
      if (args.join(' ') === 'remote') return 'origin';
      if (args.join(' ') === 'remote get-url origin') throw new Error('origin unreadable');
      if (args.join(' ') === 'rev-parse --show-toplevel') return repo;
      if (args.join(' ') === 'rev-parse --abbrev-ref HEAD') return realIdentity.branch;
      if (args.join(' ') === 'rev-parse HEAD') return realIdentity.commit;
      if (args.join(' ') === 'status --porcelain=v1') return '';
      throw new Error(`unexpected git args: ${args.join(' ')}`);
    };

    await expect(writePhase0Manifest(repo, 'audit', { runGit: failingOrigin })).rejects.toThrow('origin unreadable');
    expect(fs.existsSync(runsRoot)).toBe(false);
  });

  it('refuses an existing timestamped run directory without overwriting it', () => {
    const now = new Date('2026-07-26T12:34:56.000Z');
    const first = createRunDir('audit', now, repo);
    fs.writeFileSync(path.join(first, 'sentinel.txt'), 'keep');

    expect(() => createRunDir('audit', now, repo)).toThrow(RunDirectoryCollisionError);
    expect(fs.readFileSync(path.join(first, 'sentinel.txt'), 'utf8')).toBe('keep');
  });
});
