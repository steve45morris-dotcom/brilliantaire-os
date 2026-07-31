import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { captureRawEvidence } from './capture.js';
import { sealEvidence, verifySeal } from './seal.js';

describe('sealEvidence / verifySeal', () => {
  let runDir: string;

  beforeEach(() => {
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-seal-'));
    fs.mkdirSync(path.join(runDir, 'raw'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  it('writes evidence-seal.json with a hash, timestamp, and file count', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    captureRawEvidence(runDir, 'b.txt', 'content b');
    const seal = sealEvidence(runDir);
    expect(seal.file_count).toBe(2);
    expect(seal.evidence_index_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.parse(fs.readFileSync(path.join(runDir, 'evidence-seal.json'), 'utf-8'))).toEqual(seal);
  });

  it('reports MATCH when nothing changed since sealing', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    sealEvidence(runDir);
    expect(verifySeal(runDir)).toEqual({ status: 'MATCH' });
  });

  it('reports VIOLATION when the seal file is missing', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    const result = verifySeal(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('never sealed'))).toBe(true);
    }
  });

  it('reports VIOLATION when a file is added to raw/ after sealing, even if the index is updated to match it', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    sealEvidence(runDir);
    captureRawEvidence(runDir, 'b.txt', 'content b'); // legitimate-looking capture, but after the seal
    const result = verifySeal(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('file count changed'))).toBe(true);
    }
  });

  it('reports VIOLATION when a raw/ file is mutated after sealing', () => {
    captureRawEvidence(runDir, 'a.txt', 'original');
    sealEvidence(runDir);
    fs.writeFileSync(path.join(runDir, 'raw', 'a.txt'), 'tampered');
    const result = verifySeal(runDir);
    expect(result.status).toBe('VIOLATION');
  });

  it('reports VIOLATION when claims.json is edited after sealing', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({ claims: [] }));
    fs.writeFileSync(path.join(runDir, 'narrative.md'), 'UNTRUSTED INTERPRETATION\n');
    sealEvidence(runDir);

    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({ claims: [{ claim_id: 'C999' }] }));
    const result = verifySeal(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('claims.json'))).toBe(true);
    }
  });

  it('reports VIOLATION when narrative.md is edited after sealing', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({ claims: [] }));
    fs.writeFileSync(path.join(runDir, 'narrative.md'), 'UNTRUSTED INTERPRETATION\n');
    sealEvidence(runDir);

    fs.writeFileSync(path.join(runDir, 'narrative.md'), 'UNTRUSTED INTERPRETATION\ntampered\n');
    const result = verifySeal(runDir);
    expect(result.status).toBe('VIOLATION');
    if (result.status === 'VIOLATION') {
      expect(result.violations.some(v => v.includes('narrative.md'))).toBe(true);
    }
  });

  it('reports MATCH when claims.json and narrative.md are untouched after sealing', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    fs.writeFileSync(path.join(runDir, 'claims.json'), JSON.stringify({ claims: [] }));
    fs.writeFileSync(path.join(runDir, 'narrative.md'), 'UNTRUSTED INTERPRETATION\n');
    sealEvidence(runDir);
    expect(verifySeal(runDir)).toEqual({ status: 'MATCH' });
  });

  it('produces the same hash from an index re-keyed in a different property order', () => {
    captureRawEvidence(runDir, 'a.txt', 'content a');
    captureRawEvidence(runDir, 'b.txt', 'content b');
    const originalIndex = JSON.parse(fs.readFileSync(path.join(runDir, 'evidence-index.json'), 'utf-8'));
    const sealOriginalOrder = sealEvidence(runDir);

    const reorderedIndex = { 'raw/b.txt': originalIndex['raw/b.txt'], 'raw/a.txt': originalIndex['raw/a.txt'] };
    fs.writeFileSync(path.join(runDir, 'evidence-index.json'), JSON.stringify(reorderedIndex));
    const sealReorderedInput = sealEvidence(runDir);

    expect(sealReorderedInput.evidence_index_sha256).toBe(sealOriginalOrder.evidence_index_sha256);
  });
});
