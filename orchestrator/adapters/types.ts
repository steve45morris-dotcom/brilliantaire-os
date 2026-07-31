export interface AgentInvocation {
  runDir: string;
  repoRoot: string;
  promptOrInstructionPath: string;
}

export interface AdapterResult {
  exitCode: number | null;
  outcome: 'success' | 'failure' | 'timeout';
  stdout: string;
  stderr: string;
  durationMs: number;
  modelIdentity: string;
}

export interface AgentAdapter {
  readonly adapterName: string;
  readonly executable: string;
  buildArgs(invocation: AgentInvocation): string[];
  readonly cwd: 'repo';
  buildEnv(): Record<string, string>;
  readonly timeoutMs: number;
  readonly sandboxMode: 'read-only' | 'repo-write' | 'unrestricted';
  run(invocation: AgentInvocation): Promise<AdapterResult>;
}

export class DeferredAdapterError extends Error {
  constructor(adapterName: string) {
    super(`Adapter "${adapterName}" is DEFERRED_ADAPTER — not implemented in this build.`);
    this.name = 'DeferredAdapterError';
  }
}
