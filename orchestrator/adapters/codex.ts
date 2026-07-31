import { spawn } from 'node:child_process';
import type { AgentAdapter, AgentInvocation, AdapterResult } from './types.js';

const CODEX_TIMEOUT_MS = 300000;

export function createCodexAdapter(): AgentAdapter {
  return {
    adapterName: 'codex',
    executable: 'codex',
    cwd: 'repo',
    timeoutMs: CODEX_TIMEOUT_MS,
    // Describes the Auditor's access to the REPOSITORY under our capability model
    // (read-only — no repo mutation), which is a separate axis from Codex's own
    // --sandbox flag below (which governs where *Codex* may write on disk at all).
    sandboxMode: 'read-only',
    buildArgs(invocation: AgentInvocation): string[] {
      return [
        'exec',
        '--sandbox', 'workspace-write',
        // Codex's own "workspace" write-scope is the -C directory, not the repo.
        // Reads are unrestricted under both read-only and workspace-write (verified
        // empirically: under --sandbox read-only, Codex read files far outside the
        // repo). Scoping -C to the run directory lets Codex write claims.json/
        // narrative.md there while remaining unable to write anywhere in the repo
        // itself — repo mutation was never in its write scope to begin with.
        '-C', invocation.runDir,
        '--json',
        `Read the task instructions at ${invocation.promptOrInstructionPath} and follow them exactly.`,
      ];
    },
    buildEnv(): Record<string, string> {
      return {};
    },
    async run(invocation: AgentInvocation): Promise<AdapterResult> {
      const args = this.buildArgs(invocation);
      const start = Date.now();
      return new Promise(resolve => {
        const child = spawn(this.executable, args, {
          cwd: invocation.repoRoot,
          env: { ...process.env, ...this.buildEnv() },
          // codex exec reads/appends stdin when it's piped (see `codex exec --help`);
          // the prompt is already passed as an argument, so stdin must be closed,
          // not left open as an empty pipe, or codex blocks waiting to read it.
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          child.kill('SIGTERM');
        }, this.timeoutMs);

        child.stdout.on('data', (chunk: Buffer) => {
          stdout += chunk.toString('utf-8');
        });
        child.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString('utf-8');
        });

        child.on('close', (code: number | null) => {
          clearTimeout(timer);
          const durationMs = Date.now() - start;
          if (timedOut) {
            resolve({ exitCode: null, outcome: 'timeout', stdout, stderr, durationMs, modelIdentity: 'codex-cli' });
            return;
          }
          resolve({
            exitCode: code,
            outcome: code === 0 ? 'success' : 'failure',
            stdout,
            stderr,
            durationMs,
            modelIdentity: 'codex-cli',
          });
        });
      });
    },
  };
}
