import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { sha256File } from './hashing.js';

describe('sha256File', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-hashing-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('produces a stable sha256 hex digest for identical content', () => {
    const filePath = path.join(tmpDir, 'a.txt');
    fs.writeFileSync(filePath, 'hello world\n');
    const first = sha256File(filePath);
    const second = sha256File(filePath);
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a different digest when content changes', () => {
    const filePath = path.join(tmpDir, 'a.txt');
    fs.writeFileSync(filePath, 'hello world\n');
    const before = sha256File(filePath);
    fs.writeFileSync(filePath, 'goodbye world\n');
    const after = sha256File(filePath);
    expect(before).not.toBe(after);
  });
});
