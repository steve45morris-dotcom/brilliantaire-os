import fs from 'node:fs';
import path from 'node:path';
import { createRunDir } from './runPaths.js';
import { captureRepoIdentity, type GitRunner } from './repoState.js';
import type { Phase, RepoIdentity, RunManifest, StateSnapshot } from './types.js';

export interface Phase0Options {
  now?: Date;
  agentRole?: 'Auditor';
  agentModel?: string;
  sandboxMode?: 'read-only';
  runGit?: GitRunner;
}

export async function writePhase0Manifest(
  repoRoot: string,
  runKind: string,
  options: Phase0Options = {},
): Promise<{ runDir: string; manifest: RunManifest }> {
  const now = options.now ?? new Date();
  // Capture all repository identity before creating any evidence directory.
  const repo = await captureRepoIdentity(repoRoot, options.runGit);
  const runDir = createRunDir(runKind, now, repo.repoRoot);
  const manifest: RunManifest = {
    runId: path.basename(runDir),
    runDir,
    repo,
    agentRole: options.agentRole ?? 'Auditor',
    agentModel: options.agentModel ?? 'unresolved',
    sandboxMode: options.sandboxMode ?? 'read-only',
    timestamp: now.toISOString(),
  };

  fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  writeStateSnapshot(runDir, 'phase-0', repo, manifest.timestamp);
  return { runDir, manifest };
}

export function writeStateSnapshot(
  runDir: string,
  phase: Phase,
  repo: RepoIdentity,
  recordedAt: string = new Date().toISOString(),
): void {
  const state: StateSnapshot = { phase, repo, recordedAt };
  fs.writeFileSync(path.join(runDir, 'state', `${phase}.json`), JSON.stringify(state, null, 2), 'utf8');
}
