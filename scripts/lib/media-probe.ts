// Real media probing for the Episode 1 render intake.
//
// Replaces the previous "read the file as utf-8 and regex for `dimensions:`" check,
// which passed text mocks and failed every real render. Dimensions come from the
// container: PNG IHDR and JPEG SOF are parsed directly; everything else goes to
// ffprobe. A file that carries no decodable media is NOT_MEDIA, which is how text
// mocks are now rejected.

import fs from 'fs';
import { execFileSync } from 'child_process';

export type ProbeFailure =
  | 'NOT_MEDIA'          // no recognisable container — this is what a text mock hits
  | 'PROBE_UNAVAILABLE'  // ffprobe missing; cannot verify, do not guess
  | 'PROBE_FAILED';      // ffprobe ran but returned nothing usable

export type ProbeResult =
  | { ok: true; width: number; height: number; durationSec: number | null; via: 'png' | 'jpeg' | 'ffprobe' }
  | { ok: false; reason: ProbeFailure; detail: string };

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// SOF markers carry frame dimensions. C4 (DHT), C8 (JPG) and CC (DAC) share the
// range but are not SOF, so they are excluded.
function isSofMarker(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function readHeader(filePath: string, bytes: number): Buffer {
  const buf = Buffer.alloc(bytes);
  const fd = fs.openSync(filePath, 'r');
  try {
    const read = fs.readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, read);
  } finally {
    fs.closeSync(fd);
  }
}

function probePng(filePath: string): ProbeResult | null {
  const head = readHeader(filePath, 24);
  if (head.length < 24 || !head.subarray(0, 8).equals(PNG_MAGIC)) return null;
  // IHDR is always the first chunk: length(4) type(4) then width(4) height(4).
  return {
    ok: true,
    width: head.readUInt32BE(16),
    height: head.readUInt32BE(20),
    durationSec: null,
    via: 'png'
  };
}

function probeJpeg(filePath: string): ProbeResult | null {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++; // resync past padding
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2; // standalone markers carry no length
      continue;
    }
    const segLength = buf.readUInt16BE(offset + 2);
    if (isSofMarker(marker)) {
      return {
        ok: true,
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
        durationSec: null,
        via: 'jpeg'
      };
    }
    offset += 2 + segLength;
  }
  return null;
}

function probeFfprobe(filePath: string): ProbeResult {
  let raw: string;
  try {
    raw = execFileSync(
      'ffprobe',
      [
        '-v', 'error',
        '-show_entries', 'stream=codec_type,width,height:format=duration',
        '-of', 'default=noprint_wrappers=1',
        filePath
      ],
      { encoding: 'utf-8', timeout: 20_000, stdio: ['ignore', 'pipe', 'ignore'] }
    );
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return { ok: false, reason: 'PROBE_UNAVAILABLE', detail: 'ffprobe not found on PATH' };
    }
    return { ok: false, reason: 'NOT_MEDIA', detail: 'ffprobe could not decode the file' };
  }

  const pickNumber = (key: string): number | null => {
    const m = raw.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const width = pickNumber('width') ?? 0;
  const height = pickNumber('height') ?? 0;
  const durationSec = pickNumber('duration');
  const codecTypes = [...raw.matchAll(/^codec_type=(.+)$/gm)].map(m => m[1].trim());

  // ffprobe guesses the demuxer from the file extension and exits 0 even when the container
  // is garbage — a text file named .png yields codec_type=video with width=0, height=0. So a
  // declared stream is not evidence of media; usable geometry or a real duration is.
  const hasVisual = codecTypes.includes('video') && width > 0 && height > 0;
  const hasAudible = codecTypes.includes('audio') && durationSec !== null && durationSec > 0;

  if (!hasVisual && !hasAudible) {
    return {
      ok: false,
      reason: 'NOT_MEDIA',
      detail: `no decodable stream (codec_types: ${codecTypes.join(',') || 'none'}, ${width}x${height}, duration ${durationSec ?? 'none'})`
    };
  }

  return { ok: true, width, height, durationSec, via: 'ffprobe' };
}

/** Probe real media dimensions and duration. Never infers from file contents as text. */
export function probeMedia(filePath: string): ProbeResult {
  try {
    const png = probePng(filePath);
    if (png) return png;
    const jpeg = probeJpeg(filePath);
    if (jpeg) return jpeg;
  } catch (err: any) {
    return { ok: false, reason: 'NOT_MEDIA', detail: `unreadable: ${err?.message ?? err}` };
  }
  return probeFfprobe(filePath);
}

/** "9:16" -> 0.5625. Returns null for anything unparseable. */
export function parseRatio(spec: string): number | null {
  const m = spec.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const h = Number(m[2]);
  return h === 0 ? null : Number(m[1]) / h;
}

/** Compare measured pixels against an expected "W:H" spec, tolerating rounding. */
export function ratioMatches(width: number, height: number, expected: string, tolerance = 0.02): boolean {
  const want = parseRatio(expected);
  if (want === null || height === 0) return false;
  return Math.abs(width / height - want) <= tolerance * want;
}

/** Compare measured duration against the manifest target. */
export function durationMatches(actualSec: number | null, expectedSec: number, tolerance = 0.1): boolean {
  if (actualSec === null) return false;
  return Math.abs(actualSec - expectedSec) <= Math.max(0.5, tolerance * expectedSec);
}
