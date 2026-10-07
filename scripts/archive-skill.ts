import { SkillRegistryManager } from '../src/agent-upgrade/registry.js';

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
  const name = params.name;

  if (!name) {
    console.error('Usage: npm run archive-skill -- --name [skill-name]');
    process.exit(1);
  }

  const manager = new SkillRegistryManager();
  const success = manager.archiveSkill(name);

  if (success) {
    console.log(`✓ Skill '${name}' status updated to 'archived'. It will no longer match intent queries.`);
  } else {
    console.error(`✗ Skill '${name}' not found in registry.`);
    process.exit(1);
  }
}

main();
