import fs from 'node:fs';
import path from 'node:path';
import { resolveAdapter } from '../adapters/registry.js';
import { createShellAdapter } from '../adapters/shell.js';
import { captureRawEvidence } from '../evidence/capture.js';
import { sealEvidence } from '../evidence/seal.js';
import { validateClaimsFile } from '../claims/validate.js';
import { captureRepoIdentity, compareRepoIdentity } from '../core/repoState.js';
import type { StateSnapshot } from '../core/types.js';

export type Phase1Result =
  | { status: 'success' }
  | { status: 'ADAPTER_EXECUTION_FAILURE'; detail: string }
  | { status: 'CLAIMS_SCHEMA_INVALID'; errors: string[] }
  | { status: 'NARRATIVE_MISSING' }
  | { status: 'REPOSITORY_STATE_DRIFT'; reasons: string[] };

interface Phase1Overrides {
  shellExecutable?: string;
  shellFixedArgs?: string[];
}

const UNTRUSTED_BANNER = 'UNTRUSTED INTERPRETATION';

// The Auditor's claims.json must conform to the strict ClaimsFile schema
// (orchestrator/claims/schema.ts) or Phase 1 fail-closes with CLAIMS_SCHEMA_INVALID.
// This spells that contract out explicitly — it constrains the OUTPUT FORMAT only,
// never what the Auditor investigates or concludes. Without it, schema conformance is
// left to chance and the harness rejects otherwise-good audits non-deterministically.
function buildAuditorInstruction(runDir: string): string {
  const claimsPath = path.join(runDir, 'claims.json');
  const narrativePath = path.join(runDir, 'narrative.md');
  const example = {
    claims: [
      {
        claim_id: 'C001',
        claim: 'A single, checkable factual statement about the repository.',
        evidence: ['relative/path/or/note'],
        verification: [
          { type: 'file_contains', path: 'orchestrator/claims/validate.ts', pattern: 'isSafeProcessArg', is_regex: false },
        ],
      },
    ],
  };
  return [
    'You are the Auditor for this repository. Investigate using read-only, diagnostic operations only.',
    'Do not write anywhere except the two output files named below. Do not modify any file in this repository.',
    '',
    `Write your findings as structured claims to: ${claimsPath}`,
    `Write your narrative interpretation to: ${narrativePath} — begin that file with the line "${UNTRUSTED_BANNER}".`,
    '',
    'claims.json MUST conform EXACTLY to this schema, or it will be rejected:',
    '- Top-level object: { "claims": [ ... ] }.',
    '- Each claim: { "claim_id", "claim", "evidence", "verification" } and optionally "depends_on", "justification".',
    '  - claim_id: string matching ^C\\d{3,}$  (e.g. "C001", "C002"). NOT "C-001".',
    '  - claim: non-empty string, one checkable factual statement.',
    '  - evidence: array of strings (paths or short references).',
    '  - depends_on: array of other claim_ids (optional; default []).',
    '  - justification: string, REQUIRED only if every verification instruction is not-testable.',
    '  - verification: NON-EMPTY array of typed instruction objects. Every material claim MUST carry',
    '    at least one independently-executable verification instruction — a claim the harness cannot',
    '    re-run is worthless. Allowed instruction types (discriminated by "type"):',
    '      { "type": "process", "executable": <one of: ls cat wc comm diff grep shasum sha256sum>, "args": [<repo-relative paths only; no absolute or ".." paths>] }',
    '      { "type": "file_exists", "path": <repo-relative> }',
    '      { "type": "file_absent", "path": <repo-relative> }',
    '      { "type": "file_hash", "path": <repo-relative>, "expected_hash": <optional sha256 hex> }',
    '      { "type": "file_contains", "path": <repo-relative>, "pattern": <string>, "is_regex": <bool> }',
    '      { "type": "git_diff", "args": [<informational flags only, e.g. --stat, --name-only>] }',
    '      { "type": "git_status" }',
    '      { "type": "test" } | { "type": "typecheck" } | { "type": "build" }',
    '',
    'Minimal valid example:',
    '```json',
    JSON.stringify(example, null, 2),
    '```',
  ].join('\n');
}

export async function runAuditorPhase(
  runDir: string,
  repoRoot: string,
  adapterName: string,
  overrides?: Phase1Overrides
): Promise<Phase1Result> {
  const before = await captureRepoIdentity(repoRoot);

  const adapter = overrides?.shellExecutable
    ? createShellAdapter({
        adapterName,
        executable: overrides.shellExecutable,
        fixedArgs: overrides.shellFixedArgs ?? [],
        timeoutMs: 60000,
        sandboxMode: 'read-only',
      })
    : resolveAdapter(adapterName);

  const instructionPath = path.join(runDir, 'instruction.md');
  fs.writeFileSync(instructionPath, buildAuditorInstruction(runDir));

  const result = await adapter.run({ runDir, repoRoot, promptOrInstructionPath: instructionPath });

  captureRawEvidence(runDir, `${adapterName}-session-transcript.txt`, `--- stdout ---\n${result.stdout}\n--- stderr ---\n${result.stderr}\n`);

  if (result.outcome !== 'success') {
    return { status: 'ADAPTER_EXECUTION_FAILURE', detail: `adapter "${adapterName}" outcome: ${result.outcome}, exit code: ${result.exitCode}` };
  }

  const claimsPath = path.join(runDir, 'claims.json');
  if (!fs.existsSync(claimsPath)) {
    return { status: 'CLAIMS_SCHEMA_INVALID', errors: ['claims.json was not produced'] };
  }
  const rawClaims = JSON.parse(fs.readFileSync(claimsPath, 'utf-8'));
  const validation = validateClaimsFile(rawClaims);
  if (!validation.valid) {
    return { status: 'CLAIMS_SCHEMA_INVALID', errors: validation.errors };
  }

  const narrativePath = path.join(runDir, 'narrative.md');
  if (!fs.existsSync(narrativePath)) {
    return { status: 'NARRATIVE_MISSING' };
  }
  const narrativeContent = fs.readFileSync(narrativePath, 'utf-8');
  if (!narrativeContent.startsWith(UNTRUSTED_BANNER)) {
    fs.writeFileSync(narrativePath, `${UNTRUSTED_BANNER}\n\n${narrativeContent}`);
  }

  const after = await captureRepoIdentity(repoRoot);
  const comparison = compareRepoIdentity(before, after);

  const phase1Snapshot: StateSnapshot = { phase: 'phase-1', repo: after, recordedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(runDir, 'state', 'phase-1.json'), JSON.stringify(phase1Snapshot, null, 2));

  if (comparison.status === 'DRIFT') {
    return { status: 'REPOSITORY_STATE_DRIFT', reasons: comparison.reasons };
  }

  // Seal raw/ evidence now that Phase 1 collection is finished — Phase 2 and Phase 3
  // both re-verify against this seal rather than trusting a bare per-file re-hash.
  sealEvidence(runDir);

  return { status: 'success' };
}
