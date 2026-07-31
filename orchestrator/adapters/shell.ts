import { execFile } from 'node:child_process';
import type { AgentAdapter, AgentInvocation, AdapterResult } from './types.js';

export interface ShellAdapterConfig {
  adapterName: string;
  executable: string;
  fixedArgs: string[];
  timeoutMs: number;
  sandboxMode: 'read-only' | 'repo-write' | 'unrestricted';
}

export function createShellAdapter(config: ShellAdapterConfig): AgentAdapter {
  return {
    adapterName: config.adapterName,
    executable: config.executable,
    cwd: 'repo',
    timeoutMs: config.timeoutMs,
    sandboxMode: config.sandboxMode,
    buildArgs(_invocation: AgentInvocation): string[] {
      return config.fixedArgs;
    },
    buildEnv(): Record<string, string> {
      return {};
    },
    run(invocation: AgentInvocation): Promise<AdapterResult> {
      const args = this.buildArgs(invocation);
      const start = Date.now();
      return new Promise(resolve => {
        const child = execFile(
          config.executable,
          args,
          { cwd: invocation.repoRoot, timeout: config.timeoutMs, env: { ...process.env, ...this.buildEnv() } },
          (error, stdout, stderr) => {
            const durationMs = Date.now() - start;
            if (error && (error as NodeJS.ErrnoException).killed) {
              resolve({ exitCode: null, outcome: 'timeout', stdout, stderr, durationMs, modelIdentity: config.executable });
              return;
            }
            const exitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
            resolve({
              exitCode,
              outcome: exitCode === 0 ? 'success' : 'failure',
              stdout,
              stderr,
              durationMs,
              modelIdentity: config.executable,
            });
          }
        );
        void child;
      });
    },
  };
}
