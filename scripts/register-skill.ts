import { SkillRegistryManager } from '../src/agent-upgrade/registry.js';
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
  const category = params.category as SkillCategory;
  const name = params.name;
  const owner = params.owner || 'Planner Agent';
  const version = params.version || '1.0.0';
  const instructions = params.instructions || `# Skill instructions for ${name}`;

  if (!category || !name) {
    console.error('Usage: npm run register-skill -- --category [category] --name [skill-name] --owner [agent] --version [version] --instructions [markdown]');
    process.exit(1);
  }

  const manager = new SkillRegistryManager();
  const success = manager.registerSkill(category, name, owner, version, instructions);

  if (success) {
    console.log(`✓ Skill '${name}' registered successfully as 'experimental' under category '${category}'.`);
  } else {
    console.error(`✗ Failed to register skill '${name}'. It might already exist.`);
    process.exit(1);
  }
}

main();
