import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { captureRawEvidence, verifyEvidenceIntegrity, readEvidenceIndex } from './capture.js';

describe('captureRawEvidence / verifyEvidenceIntegrity', () => {
  let runDir: string;

  beforeEach(() => {
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-capture-'));
    fs.mkdirSync(path.join(runDir, 'raw'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('writes a raw evidence file and records it in evidence-index.json', () => {
    captureRawEvidence(runDir, 'session-transcript.txt', 'line one\nline two\n');
    const onDisk = fs.readFileSync(path.join(runDir, 'raw', 'session-transcript.txt'), 'utf-8');
    expect(onDisk).toBe('line one\nline two\n');

    const index = readEvidenceIndex(runDir);
    expect(index['raw/session-transcript.txt']).toBeDefined();
    expect(index['raw/session-transcript.txt'].sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('reports MATCH when raw/ is untouched after capture', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    captureRawEvidence(runDir, 'b.txt', 'content b');
    expect(verifyEvidenceIntegrity(runDir)).toEqual({ status: 'MATCH' });
  });

  it('detects a mutated raw file', () => {
    captureRawEvidence(runDir, 'a.txt', 'original');
    fs.writeFileSync(path.join(runDir, 'raw', 'a.txt'), 'tampered');
    const result = verifyEvidenceIntegrity(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('a.txt'))).toBe(true);
    }
  });

  it('detects an unexplained file added to raw/', () => {
    captureRawEvidence(runDir, 'a.txt', 'original');
    fs.writeFileSync(path.join(runDir, 'raw', 'unexplained.txt'), 'sneaky');
    const result = verifyEvidenceIntegrity(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('unexplained.txt'))).toBe(true);
    }
  });

  it('detects a deleted-but-indexed file', () => {
    captureRawEvidence(runDir, 'a.txt', 'original');
    fs.unlinkSync(path.join(runDir, 'raw', 'a.txt'));
    const result = verifyEvidenceIntegrity(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('a.txt'))).toBe(true);
    }
  });
});
