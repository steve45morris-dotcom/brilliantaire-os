import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writePhase0Manifest } from '../orchestrator/core/manifest.js';

export interface Phase0CliOutput {
  phase: 'phase-0';
  runDir: string;
}

export async function runPhase0Cli(repoRoot: string): Promise<Phase0CliOutput> {
  const { runDir } = await writePhase0Manifest(repoRoot, 'audit', {
    agentRole: 'Auditor',
    agentModel: 'codex-cli',
    sandboxMode: 'read-only',
  });
  return { phase: 'phase-0', runDir };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  runPhase0Cli(process.argv[2] ?? process.cwd())
    .then(output => process.stdout.write(`${JSON.stringify(output)}\n`))
    .catch(error => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
