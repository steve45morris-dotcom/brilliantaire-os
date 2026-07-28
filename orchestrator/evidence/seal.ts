import fs from 'node:fs';
import path from 'node:path';
import { sha256String, sha256File } from './hashing.js';
import { readEvidenceIndex, verifyEvidenceIntegrity, type EvidenceIndex } from './capture.js';

export interface EvidenceSeal {
  evidence_index_sha256: string;
  // Hashes of the Auditor's own two output files, captured at seal time (after Phase 1
  // has validated them). Null only if the file was absent when sealed. Sealing these
  // alongside the raw/ index closes the time-of-check/time-of-use gap: claims.json is
  // validated once in Phase 1, and without this hash a between-phase edit that stayed
  // schema-valid (e.g. swapping a claim's verification for something that always passes)
  // would go undetected by an integrity check that only covered raw/.
  claims_sha256: string | null;
  narrative_sha256: string | null;
  sealed_at: string;
  file_count: number;
}

// Hashes a run-directory output file if present, else null.
function hashRunFileIfPresent(runDir: string, name: string): string | null {
  const filePath = path.join(runDir, name);
  return fs.existsSync(filePath) ? sha256File(filePath) : null;
}

export type SealVerificationResult =
  | { status: 'MATCH' }
  | { status: 'VIOLATION'; violations: string[] };

function sealPath(runDir: string): string {
  return path.join(runDir, 'evidence-seal.json');
}

// Canonical form is sorted-key JSON — an index built in a different capture order
// (e.g. after re-running Phase 1) must still seal to the same hash if the contents
// are the same.
function canonicalIndexString(index: EvidenceIndex): string {
  const canonical: EvidenceIndex = {};
  for (const key of Object.keys(index).sort()) canonical[key] = index[key];
  return JSON.stringify(canonical);
}

// Called once, at the end of Phase 1, after all raw/ capture is finished. Nothing
// after this point is permitted to add, remove, or modify a raw/ artifact without
// verifySeal() detecting it downstream.
export function sealEvidence(runDir: string): EvidenceSeal {
  const index = readEvidenceIndex(runDir);
  const seal: EvidenceSeal = {
    evidence_index_sha256: sha256String(canonicalIndexString(index)),
    claims_sha256: hashRunFileIfPresent(runDir, 'claims.json'),
    narrative_sha256: hashRunFileIfPresent(runDir, 'narrative.md'),
    sealed_at: new Date().toISOString(),
    file_count: Object.keys(index).length,
  };
  fs.writeFileSync(sealPath(runDir), JSON.stringify(seal, null, 2));
  return seal;
}

// Re-checks a sealed output-file hash. A change from present→absent, absent→present,
// or a content edit is all a violation.
function checkSealedFile(runDir: string, name: string, sealedHash: string | null, violations: string[]): void {
  const currentHash = hashRunFileIfPresent(runDir, name);
  if (currentHash !== sealedHash) {
    violations.push(`${name} no longer matches its sealed hash (was ${sealedHash ?? 'absent'}, now ${currentHash ?? 'absent'})`);
  }
}

// Supersedes a bare verifyEvidenceIntegrity() call wherever a seal is expected to
// exist: re-checks every raw/ file against evidence-index.json (via
// verifyEvidenceIntegrity), and additionally re-checks the index itself against the
// sealed hash and file count, so a swap of the whole index (matched hashes, but a
// smuggled-in extra entry pointing at a pre-existing, unmodified file) is also caught.
export function verifySeal(runDir: string): SealVerificationResult {
  const violations: string[] = [];

  if (!fs.existsSync(sealPath(runDir))) {
    return { status: 'VIOLATION', violations: ['no evidence-seal.json found — evidence was never sealed at the end of Phase 1'] };
  }
  const seal = JSON.parse(fs.readFileSync(sealPath(runDir), 'utf-8')) as EvidenceSeal;

  const index = readEvidenceIndex(runDir);
  const currentHash = sha256String(canonicalIndexString(index));
  if (currentHash !== seal.evidence_index_sha256) {
    violations.push('evidence-index.json content no longer matches the sealed hash');
  }
  const currentFileCount = Object.keys(index).length;
  if (currentFileCount !== seal.file_count) {
    violations.push(`evidence file count changed since sealing: sealed ${seal.file_count}, now ${currentFileCount}`);
  }

  checkSealedFile(runDir, 'claims.json', seal.claims_sha256, violations);
  checkSealedFile(runDir, 'narrative.md', seal.narrative_sha256, violations);

  const integrity = verifyEvidenceIntegrity(runDir);
  if (integrity.status === 'VIOLATION') {
    violations.push(...integrity.violations);
  }

  return violations.length === 0 ? { status: 'MATCH' } : { status: 'VIOLATION', violations };
}
