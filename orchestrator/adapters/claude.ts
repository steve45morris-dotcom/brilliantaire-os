import { execFile } from 'node:child_process';
import type { AgentAdapter, AgentInvocation, AdapterResult } from './types.js';

const CLAUDE_TIMEOUT_MS = 300000;

export function createClaudeAdapter(): AgentAdapter {
  return {
    adapterName: 'claude',
    executable: 'claude',
    cwd: 'repo',
    timeoutMs: CLAUDE_TIMEOUT_MS,
    sandboxMode: 'repo-write',
    buildArgs(invocation: AgentInvocation): string[] {
      return [
        '-p',
        `Read the task instructions at ${invocation.promptOrInstructionPath} and follow them exactly.`,
        '--output-format', 'json',
      ];
    },
    buildEnv(): Record<string, string> {
      return {};
    },
    async run(invocation: AgentInvocation): Promise<AdapterResult> {
      const args = this.buildArgs(invocation);
      const start = Date.now();
      return new Promise(resolve => {
        execFile(
          this.executable,
          args,
          { cwd: invocation.repoRoot, timeout: this.timeoutMs, env: { ...process.env, ...this.buildEnv() } },
          (error, stdout, stderr) => {
            const durationMs = Date.now() - start;
            if (error && (error as NodeJS.ErrnoException).killed) {
              resolve({ exitCode: null, outcome: 'timeout', stdout, stderr, durationMs, modelIdentity: 'claude-cli' });
              return;
            }
            const exitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
            resolve({
              exitCode,
              outcome: exitCode === 0 ? 'success' : 'failure',
              stdout,
              stderr,
              durationMs,
              modelIdentity: 'claude-cli',
            });
          }
        );
      });
    },
  };
}
