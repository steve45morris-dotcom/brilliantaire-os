export type Phase = 'phase-0' | 'phase-1' | 'phase-2' | 'phase-3';

export interface RepoIdentity {
  repoRoot: string;
  branch: string;
  commit: string;
  remote: string | null;
  workingTreeStatusHash: string;
  capturedAt: string;
}

export interface RunManifest {
  runId: string;
  runDir: string;
  repo: RepoIdentity;
  agentRole: 'Auditor';
  agentModel: string;
  sandboxMode: 'read-only';
  timestamp: string;
}

export interface StateSnapshot {
  phase: Phase;
  repo: RepoIdentity;
  recordedAt: string;
}
