import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper to expand ~ path
const expandHome = (p: string) => p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;

const SCAN_PATHS = [
  '~/.claude/skills',
  '~/.claude/plugins',
  '.claude/skills',
  '.claude/plugins'
].map(expandHome);

interface SkillInfo {
  filePath: string;
  name: string;
  description: string;
  disabled: boolean;
  charCount: number;
}

// Simple but robust YAML frontmatter parser handling quoted and folded scalars
function parseFrontmatter(content: string, filePath: string): Partial<{ name: string; description: string; 'disable-model-invocation': boolean }> {
  const result: any = {};
  const match = content.match(/^---([\s\S]*?)---/);
  if (!match) {
    console.warn(`[!] Malformed frontmatter (no --- boundaries) in: ${filePath}`);
    return result;
  }

  const lines = match[1].split('\n');
  let currentKey = '';
  let inFoldedScalar = false;
  let foldedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle folded scalar continuation
    if (inFoldedScalar) {
      if (line.startsWith(' ') || line.trim() === '') {
        foldedLines.push(line.trim());
        continue;
      } else {
        // Folded scalar finished
        result[currentKey] = foldedLines.join(' ');
        inFoldedScalar = false;
        foldedLines = [];
      }
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (value === '>' || value === '|') {
      inFoldedScalar = true;
      currentKey = key;
      continue;
    }

    // Clean up quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key === 'disable-model-invocation') {
      result[key] = value.toLowerCase() === 'true';
    } else {
      result[key] = value;
    }
  }

  // Flush any trailing folded scalar
  if (inFoldedScalar && foldedLines.length > 0) {
    result[currentKey] = foldedLines.join(' ');
  }

  return result;
}

// Recursively find all SKILL.md files
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
    // Silently skip unreadable paths
  }
  return results;
}

async function runAudit() {
  console.log('🔍 Starting Skill Index Character Audit...');
  
  const skillFiles: string[] = [];
  for (const scanPath of SCAN_PATHS) {
    if (fs.existsSync(scanPath)) {
      const files = findSkillFiles(scanPath);
      skillFiles.push(...files);
    }
  }

  // Deduplicate files by absolute path
  const uniqueFiles = Array.from(new Set(skillFiles.map(f => path.resolve(f))));
  console.log(`Found ${uniqueFiles.length} SKILL.md file(s) across target paths.`);

  const activeSkills: SkillInfo[] = [];
  const suppressedSkills: SkillInfo[] = [];

  for (const file of uniqueFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const fm = parseFrontmatter(content, file);
      
      const name = fm.name || path.basename(path.dirname(file));
      const description = fm.description || '';
      const disabled = fm['disable-model-invocation'] === true;

      // Injected string length
      const injectedStr = `name: ${name}\ndescription: ${description}`;
      const charCount = injectedStr.length;

      const info: SkillInfo = {
        filePath: file,
        name,
        description,
        disabled,
        charCount
      };

      if (disabled) {
        suppressedSkills.push(info);
      } else {
        activeSkills.push(info);
      }
    } catch (err) {
      console.error(`[!] Failed to parse ${file}:`, err);
    }
  }

  // Sort active skills by character size descending
  activeSkills.sort((a, b) => b.charCount - a.charCount);

  console.log('\n==================================================');
  console.log('          ACTIVE SKILL INDEX BREAKDOWN            ');
  console.log('==================================================');
  
  let totalActiveChars = 0;
  for (const skill of activeSkills) {
    totalActiveChars += skill.charCount;
    console.log(`${skill.charCount.toString().padStart(6)} chars | ${skill.name.padEnd(30)} (${path.relative(os.homedir(), skill.filePath)})`);
  }

  console.log('--------------------------------------------------');
  console.log(`Active Skills Count:       ${activeSkills.length}`);
  console.log(`Suppressed Skills Count:   ${suppressedSkills.length}`);
  console.log(`Total Active Characters:   ${totalActiveChars}`);
  
  // Bounded token estimation: 1 token is typically 3.5 to 4.5 characters
  const minTokens = Math.round(totalActiveChars / 4.5);
  const maxTokens = Math.round(totalActiveChars / 3.5);
  console.log(`Estimated Token Bounds:   ${minTokens} - ${maxTokens} tokens`);
  console.log('==================================================\n');

  if (suppressedSkills.length > 0) {
    console.log(`ℹ️  Suppressed skills (${suppressedSkills.length} total, disable-model-invocation: true):`);
    for (const skill of suppressedSkills) {
      console.log(`   - ${skill.name} (${path.relative(os.homedir(), skill.filePath)})`);
    }
    console.log('');
  }
}

runAudit();
