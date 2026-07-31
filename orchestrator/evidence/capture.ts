import fs from 'node:fs';
import path from 'node:path';
import { sha256File } from './hashing.js';

export interface EvidenceIndexEntry {
  sha256: string;
  captured_at: string;
}

export type EvidenceIndex = Record<string, EvidenceIndexEntry>;

function indexPath(runDir: string): string {
  return path.join(runDir, 'evidence-index.json');
}

export function readEvidenceIndex(runDir: string): EvidenceIndex {
  const p = indexPath(runDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as EvidenceIndex;
}

export function writeEvidenceIndex(runDir: string, index: EvidenceIndex): void {
  fs.writeFileSync(indexPath(runDir), JSON.stringify(index, null, 2));
}

export function captureRawEvidence(runDir: string, relativeName: string, content: string): void {
  const rawDir = path.join(runDir, 'raw');
  fs.mkdirSync(rawDir, { recursive: true });
  const filePath = path.join(rawDir, relativeName);
  fs.writeFileSync(filePath, content);

  const index = readEvidenceIndex(runDir);
  index[`raw/${relativeName}`] = {
    sha256: sha256File(filePath),
    captured_at: new Date().toISOString(),
  };
  writeEvidenceIndex(runDir, index);
}

export function verifyEvidenceIntegrity(
  runDir: string
): { status: 'MATCH' } | { status: 'VIOLATION'; violations: string[] } {
  const rawDir = path.join(runDir, 'raw');
  const index = readEvidenceIndex(runDir);
  const violations: string[] = [];

  const filesOnDisk = fs.existsSync(rawDir) ? fs.readdirSync(rawDir) : [];
  const indexedRelativePaths = new Set(Object.keys(index));

  for (const fileName of filesOnDisk) {
    const relativePath = `raw/${fileName}`;
    if (!indexedRelativePaths.has(relativePath)) {
      violations.push(`unexplained file present in raw/: ${fileName}`);
      continue;
    }
    const actualHash = sha256File(path.join(rawDir, fileName));
    if (actualHash !== index[relativePath].sha256) {
      violations.push(`hash mismatch for ${fileName} — file was modified after capture`);
    }
  }

  const onDiskSet = new Set(filesOnDisk);
  for (const relativePath of indexedRelativePaths) {
    const fileName = relativePath.replace(/^raw\//, '');
    if (!onDiskSet.has(fileName)) {
      violations.push(`indexed file missing from raw/: ${fileName}`);
    }
  }

  return violations.length === 0 ? { status: 'MATCH' } : { status: 'VIOLATION', violations };
}
