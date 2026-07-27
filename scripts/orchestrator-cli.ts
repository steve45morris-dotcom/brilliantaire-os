import { writePhase0Manifest } from '../orchestrator/core/manifest.js';
import { runAuditorPhase } from '../orchestrator/phase1/runAuditor.js';
import { runReconciliationPhase } from '../orchestrator/reconciliation/reconcile.js';
import { runCommanderGate } from '../orchestrator/gates/commanderGate.js';

const REPO_ROOT = process.cwd();

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case 'audit': {
      const { runDir } = await writePhase0Manifest(REPO_ROOT, 'audit');
      console.log(`Phase 0 complete: ${runDir}`);
      const phase1 = await runAuditorPhase(runDir, REPO_ROOT, 'codex');
      console.log(`Phase 1 result: ${phase1.status}`);
      if (phase1.status !== 'success') {
        process.exitCode = 1;
        return;
      }
      const phase2 = await runReconciliationPhase(runDir, REPO_ROOT);
      console.log(`Phase 2 result: ${phase2.status}`);
      if (phase2.status !== 'success') {
        process.exitCode = 1;
        return;
      }
      console.log(`Run ready for Commander review: npx tsx scripts/orchestrator-cli.ts gate ${runDir}`);
      break;
    }
    case 'gate': {
      const runDir = rest[0];
      if (!runDir) {
        console.error('Usage: orchestrator gate <runDir>');
        process.exitCode = 1;
        return;
      }
      const result = await runCommanderGate(runDir);
      console.log(`Decision recorded: ${result.decision}`);
      break;
    }
    default: {
      const { printHelp } = await import('./orchestrator-cli-help.js');
      printHelp();
      process.exitCode = command ? 1 : 0;
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
