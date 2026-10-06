import { WorkflowManager } from '../src/agent-upgrade/workflows.js';
import { SkillCategory } from '../src/agent-upgrade/types.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        params[key] = val;
        i++;
      } else {
        params[key] = 'true';
      }
    }
  }
  return params;
}

async function main() {
  const params = parseArgs();
  const runId = params.runId;
  const category = params.category as SkillCategory;
  const name = params.name;
  const owner = params.owner || 'Planner Agent';

  if (!runId || !category || !name) {
    console.error('Usage: npm run package-workflow -- --runId [wf-run-xxx] --category [category] --name [new-skill-name] --owner [agent]');
    process.exit(1);
  }

  const manager = new WorkflowManager();
  const success = manager.packageWorkflowToSkill(runId, category, name, owner);

  if (success) {
    console.log(`✓ Workflow run ${runId} successfully packaged into new skill '${name}' under category '${category}'.`);
  } else {
    console.error(`✗ Failed to package workflow run ${runId}. Make sure it exists, completed successfully, and the skill name does not conflict.`);
    process.exit(1);
  }
}

main();
