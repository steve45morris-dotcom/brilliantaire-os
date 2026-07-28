import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { executeInstruction } from './engine.js';

describe('executeInstruction', () => {
  let repo: string;

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-engine-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repo });
    fs.writeFileSync(path.join(repo, 'a.txt'), 'hello world\n');
    execFileSync('git', ['add', 'a.txt'], { cwd: repo });
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repo });
  });

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it('process: runs the allowlisted executable and reports exit code + stdout', async () => {
    const result = await executeInstruction({ type: 'process', executable: 'cat', args: ['a.txt'], cwd: 'repo', timeout_ms: 5000 }, repo);
    expect(result.exit_code).toBe(0);
    expect(result.actual_result).toContain('hello world');
    expect(result.status_hint).toBe('pass');
  });

  it('process: a non-zero exit reports status_hint fail when expected exit_code is 0', async () => {
    const result = await executeInstruction({ type: 'process', executable: 'cat', args: ['does-not-exist.txt'], cwd: 'repo', timeout_ms: 5000, expected: { exit_code: 0 } }, repo);
    expect(result.exit_code).not.toBe(0);
    expect(result.status_hint).toBe('fail');
  });

  it('process: a non-zero exit reports status_hint fail even when expected is omitted (defaults to exit_code 0, not "any code passes")', async () => {
    const result = await executeInstruction({ type: 'process', executable: 'cat', args: ['does-not-exist.txt'], cwd: 'repo', timeout_ms: 5000 }, repo);
    expect(result.exit_code).not.toBe(0);
    expect(result.status_hint).toBe('fail');
  });

  it('git_diff: fails when git itself errors, not just when there is no diff', async () => {
    const result = await executeInstruction({ type: 'git_diff', args: ['--nonexistent-flag'] }, repo);
    expect(result.exit_code).not.toBe(0);
    expect(result.status_hint).toBe('fail');
  });

  it('file_exists: a path that escapes the repo root fails instead of reading the real file', async () => {
    const result = await executeInstruction({ type: 'file_exists', path: '../../../../etc/passwd' }, repo);
    expect(result.status_hint).toBe('fail');
    expect(result.actual_result).toBe('path escapes repository root');
  });

  it('file_contains: a path that escapes the repo root fails instead of reading the real file', async () => {
    const result = await executeInstruction({ type: 'file_contains', path: '../../../../etc/passwd', pattern: 'root', is_regex: false }, repo);
    expect(result.status_hint).toBe('fail');
    expect(result.actual_result).toBe('path escapes repository root');
  });

  it('file_exists: passes when the file exists, fails when it does not', async () => {
    const present = await executeInstruction({ type: 'file_exists', path: 'a.txt' }, repo);
    expect(present.status_hint).toBe('pass');
    const missing = await executeInstruction({ type: 'file_exists', path: 'nope.txt' }, repo);
    expect(missing.status_hint).toBe('fail');
  });

  it('file_absent: passes when the file is absent', async () => {
    const result = await executeInstruction({ type: 'file_absent', path: 'nope.txt' }, repo);
    expect(result.status_hint).toBe('pass');
  });

  it('file_contains: passes when the pattern is found', async () => {
    const result = await executeInstruction({ type: 'file_contains', path: 'a.txt', pattern: 'hello', is_regex: false }, repo);
    expect(result.status_hint).toBe('pass');
  });

  it('git_status: reports clean working tree', async () => {
    const result = await executeInstruction({ type: 'git_status' }, repo);
    expect(result.exit_code).toBe(0);
    expect(result.actual_result.trim()).toBe('');
  });

  it('test/typecheck/build: reports not_testable when the repo has no matching npm script', async () => {
    fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ name: 'fixture', scripts: {} }));
    const result = await executeInstruction({ type: 'test' }, repo);
    expect(result.status_hint).toBe('not_testable');
  });
});
