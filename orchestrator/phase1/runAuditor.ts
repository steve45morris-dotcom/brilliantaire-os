import fs from 'node:fs';
import path from 'node:path';
import { resolveAdapter } from '../adapters/registry.js';
import { createShellAdapter } from '../adapters/shell.js';
import { captureRawEvidence } from '../evidence/capture.js';
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
  fs.writeFileSync(
    instructionPath,
    [
      'You are the Auditor for this repository. Investigate using read-only, diagnostic operations only.',
      `Write your findings as structured claims to: ${path.join(runDir, 'claims.json')}`,
      `Write your narrative interpretation to: ${path.join(runDir, 'narrative.md')} — begin that file with the line "${UNTRUSTED_BANNER}".`,
      'Do not write anywhere else. Do not modify any file in this repository.',
    ].join('\n')
  );

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

  return { status: 'success' };
}
