import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper to expand ~ path
const expandHome = (p: string) => p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;

const SCAN_PATHS = [
  '~/.claude/skills',
  '.claude/skills'
].map(expandHome);

const CORE_SKILLS = [
  "lint-and-validate",
  "verification-before-completion",
  "systematic-debugging",
  "plan-writing",
  "find-bugs",
  "testing-patterns",
  "software-architecture",
  "github",
  "iterate-pr",
  "agent-tool-builder",
  "mcp-builder",
  "frontend-dev-guidelines",
  "backend-dev-guidelines",
  "configure-ecc",
  "retro",
  "verification-loop",
  "read-first",
  "session-setup",
  "priority-signal",
  "sentinel",
  "audit-skills"
];

const CORE_MAP = new Map(CORE_SKILLS.map(s => [s, true]));

function findSkillFiles(dir: string, depth = 0, maxDepth = 4): string[] {
  let results: string[] = [];
  if (depth > maxDepth || !fs.existsSync(dir)) return results;

  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(findSkillFiles(fullPath, depth + 1, maxDepth));
      } else if (file === 'SKILL.md') {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Skip unreadable directories
  }
  return results;
}

function parseFrontmatter(content: string): { name: string; disabled: boolean } {
  const match = content.match(/^---([\s\S]*?)---/);
  if (!match) return { name: '', disabled: false };

  const lines = match[1].split('\n');
  let name = '';
  let disabled = false;

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key === 'name') {
      name = value;
    } else if (key === 'disable-model-invocation') {
      disabled = value.toLowerCase() === 'true';
    }
  }

  return { name, disabled };
}

function disableSkill(filePath: string, content: string): boolean {
  // Check if disable-model-invocation is already in the file content
  if (/disable-model-invocation:\s*true/i.test(content)) {
    return false;
  }

  // Insert disable-model-invocation: true right after the opening ---
  const updatedContent = content.replace(/^---/, '---\ndisable-model-invocation: true');
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  return true;
}

async function run() {
  console.log('🔍 Starting Frontmatter Skills Pruning...');
  
  const skillFiles: string[] = [];
  for (const scanPath of SCAN_PATHS) {
    if (fs.existsSync(scanPath)) {
      const files = findSkillFiles(scanPath);
      skillFiles.push(...files);
    }
  }

  // Deduplicate files
  const uniqueFiles = Array.from(new Set(skillFiles.map(f => path.resolve(f))));
  console.log(`Found ${uniqueFiles.length} SKILL.md file(s) on disk.`);

  let disabledCount = 0;
  let skippedCoreCount = 0;
  let alreadyDisabledCount = 0;

  for (const file of uniqueFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { name, disabled } = parseFrontmatter(content);
      
      const skillName = name || path.basename(path.dirname(file));

      if (CORE_MAP.has(skillName)) {
        skippedCoreCount++;
        continue;
      }

      if (disabled) {
        alreadyDisabledCount++;
        continue;
      }

      // Modify in place
      const success = disableSkill(file, content);
      if (success) {
        console.log(`[✔] Suppressed: ${skillName} (${path.relative(os.homedir(), file)})`);
        disabledCount++;
      }
    } catch (err) {
      console.error(`[!] Error processing ${file}:`, err);
    }
  }

  console.log('\n==================================================');
  console.log('            PRUNING RUN SUMMARY                   ');
  console.log('==================================================');
  console.log(`Core Skills Skipped (Kept Active):  ${skippedCoreCount}`);
  console.log(`Already Suppressed Skills:          ${alreadyDisabledCount}`);
  console.log(`Newly Suppressed Skills:            ${disabledCount}`);
  console.log(`Total Skills Processed:             ${uniqueFiles.length}`);
  console.log('==================================================\n');
}

run();
