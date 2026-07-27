import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createShellAdapter } from './shell.js';

describe('shell adapter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-shell-adapter-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs the configured executable and captures stdout/stderr/exit code', async () => {
    const adapter = createShellAdapter({
      adapterName: 'shell',
      executable: 'node',
      fixedArgs: ['-e', 'console.log("hello from fixture"); process.exit(0);'],
      timeoutMs: 5000,
      sandboxMode: 'read-only',
    });

    const result = await adapter.run({ runDir: tmpDir, repoRoot: tmpDir, promptOrInstructionPath: '' });

    expect(result.outcome).toBe('success');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello from fixture');
    expect(adapter.adapterName).toBe('shell');
    expect(adapter.cwd).toBe('repo');
  });

  it('reports failure outcome on non-zero exit code', async () => {
    const adapter = createShellAdapter({
      adapterName: 'shell',
      executable: 'node',
      fixedArgs: ['-e', 'process.exit(1);'],
      timeoutMs: 5000,
      sandboxMode: 'read-only',
    });

    const result = await adapter.run({ runDir: tmpDir, repoRoot: tmpDir, promptOrInstructionPath: '' });
    expect(result.outcome).toBe('failure');
    expect(result.exitCode).toBe(1);
  });

  it('reports timeout outcome when the process exceeds timeoutMs', async () => {
    const adapter = createShellAdapter({
      adapterName: 'shell',
      executable: 'node',
      fixedArgs: ['-e', 'setTimeout(() => {}, 5000);'],
      timeoutMs: 200,
      sandboxMode: 'read-only',
    });

    const result = await adapter.run({ runDir: tmpDir, repoRoot: tmpDir, promptOrInstructionPath: '' });
    expect(result.outcome).toBe('timeout');
  }, 10000);
});
