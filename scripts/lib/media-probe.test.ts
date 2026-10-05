// Regression tests for the Episode 1 intake probe.
//
// The defect these lock down: the previous validator read every file as utf-8 and regexed
// for a `dimensions:` line, so ASCII placeholders passed and real renders failed. 27 mock
// files reached APPROVED against zero real assets. The load-bearing assertion here is that
// a text mock is NOT_MEDIA.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { probeMedia, parseRatio, ratioMatches, durationMatches } from './media-probe.js';

let tmpDir: string;

/** Minimal valid PNG: signature + IHDR declaring width/height. */
function writePng(filePath: string, width: number, height: number): void {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4, 'ascii');
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8; // bit depth
  ihdr[17] = 6; // colour type RGBA
  fs.writeFileSync(filePath, Buffer.concat([sig, ihdr]));
}

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-probe-'));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('probeMedia', () => {
  it('rejects a text mock carrying a dimensions: line as NOT_MEDIA', () => {
    // Byte-for-byte the shape stage-trial-mocks.ts used to emit.
    const mock = path.join(tmpDir, 'IMG-01_staged.png');
    fs.writeFileSync(
      mock,
      'MOCK ASSET FOR SLOT IMG-01 (Hero Poster)\nsource: Midjourney\ngenerator: mock-generator-v1.0\ndimensions: 9:16\n'
    );

    const result = probeMedia(mock);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('NOT_MEDIA');
  });

  it('reads real dimensions out of a PNG IHDR header', () => {
    const png = path.join(tmpDir, 'IMG-02_staged.png');
    writePng(png, 1080, 1920);

    const result = probeMedia(png);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1920);
      expect(result.via).toBe('png');
    }
  });

  it('does not mistake a .png extension for a PNG container', () => {
    const liar = path.join(tmpDir, 'IMG-03_staged.png');
    fs.writeFileSync(liar, 'dimensions: 16:9');

    expect(probeMedia(liar).ok).toBe(false);
  });

  it('treats an empty file as not media', () => {
    const empty = path.join(tmpDir, 'IMG-04_staged.png');
    fs.writeFileSync(empty, '');

    expect(probeMedia(empty).ok).toBe(false);
  });
});

describe('ratioMatches', () => {
  it('accepts exact portrait and landscape renders', () => {
    expect(ratioMatches(1080, 1920, '9:16')).toBe(true);
    expect(ratioMatches(1920, 1080, '16:9')).toBe(true);
    expect(ratioMatches(1080, 1080, '1:1')).toBe(true);
  });

  it('rejects a transposed aspect ratio', () => {
    expect(ratioMatches(1920, 1080, '9:16')).toBe(false);
  });

  it('tolerates a few pixels of rounding but not a real mismatch', () => {
    expect(ratioMatches(1081, 1920, '9:16')).toBe(true);
    expect(ratioMatches(1280, 1920, '9:16')).toBe(false);
  });

  it('fails closed on a zero height', () => {
    expect(ratioMatches(1080, 0, '9:16')).toBe(false);
  });
});

describe('parseRatio', () => {
  it('parses W:H', () => {
    expect(parseRatio('9:16')).toBeCloseTo(0.5625);
  });

  it('returns null for anything else', () => {
    expect(parseRatio('portrait')).toBeNull();
    expect(parseRatio('9:0')).toBeNull();
    expect(parseRatio('')).toBeNull();
  });
});

describe('durationMatches', () => {
  it('accepts a render within half a second of target', () => {
    expect(durationMatches(30.2, 30.0)).toBe(true);
  });

  it('rejects a clip of the wrong length', () => {
    expect(durationMatches(15.0, 30.0)).toBe(false);
  });

  it('rejects an unmeasurable duration rather than assuming it is fine', () => {
    expect(durationMatches(null, 30.0)).toBe(false);
  });
});
