import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Sleek ANSI colors for premium terminal design
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m'
};

function runSqliteQuery(dbPath: string, sql: string, useJson = true): string {
  try {
    const args = useJson ? [dbPath, '-json', sql] : [dbPath, sql];
    return execFileSync('/usr/bin/sqlite3', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    if (useJson) {
      return runSqliteQuery(dbPath, sql, false);
    }
    return '';
  }
}

function parseSqlResult(raw: string): any[] {
  if (!raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return raw.split('\n').map(line => line.split('|'));
  }
}

// Interactive agents. A loop through one of these is a human-in-the-loop
// handoff, never a shell script — scripting it blindly would automate away
// the review step that is the whole point of the tool.
const handoffTools = new Set([
  'gemini', 'claude', 'claude-code', 'codex', 'agy', 'aider', 'cursor'
]);
const noiseCommands = new Set([
  'cd', 'ls', 'pwd', 'clear', 'exit', 'echo', 'cat', 'sandbox-exec', 'bash', 'zsh', 'sh', 'history'
]);

// Distinctness is case-insensitive: `agy` and `AGY` are the same tool typed
// two ways, so `agy → AGY → agy` is a self-repeat, not a real 2-step loop.
function meaningful(sequence: string): string[] {
  return sequence
    .split(' → ')
    .map(part => part.trim().toLowerCase())
    .filter(part => part.length > 0);
}

// A sequence is a self-repeat if it does not contain at least 2 distinct commands
function isSelfRepeat(sequence: string): boolean {
  const uniqueParts = new Set(meaningful(sequence));
  return uniqueParts.size < 2;
}

function isNoiseSequence(sequence: string): boolean {
  const parts = meaningful(sequence);
  return parts.every(part => noiseCommands.has(part)) ||
         parts.includes('sandbox-exec') ||
         parts.includes('cd');
}

function classifyCandidate(sequence: string): 'handoff' | 'scriptable' {
  const parts = meaningful(sequence);
  const hasHandoff = parts.some(part => {
    return Array.from(handoffTools).some(tool => part === tool || part.startsWith(`${tool} `));
  });
  return hasHandoff ? 'handoff' : 'scriptable';
}

function generateSkeleton(sequence: string): { skeleton: string; droppedStatus: boolean } {
  const parts = sequence.split(' → ').map(p => p.trim());
  let droppedStatus = false;
  
  const skeletons = parts
    .map(cmd => {
      if (cmd === 'git status') {
        droppedStatus = true;
        return null;
      }
      
      // Map common command names to parameterised skeletons
      if (cmd === 'git add') return 'git add <paths>';
      if (cmd === 'git commit') return 'git commit -m "<message>"';
      if (cmd === 'git push') return 'git push origin <branch>';
      if (cmd === 'git pull') return 'git pull origin <branch>';
      if (cmd === 'git checkout') return 'git checkout <branch>';
      if (cmd === 'git merge') return 'git merge <branch>';
      if (cmd === 'git branch') return 'git branch <name>';
      if (cmd === 'git fetch') return 'git fetch <remote>';
      if (cmd === 'npm install' || cmd === 'npm i') return 'npm install <package>';
      if (cmd === 'npm run') return 'npm run <script>';
      if (cmd === 'curl') return 'curl <options> <url>';
      if (cmd === 'jq') return 'jq <filter> <file>';
      if (cmd === 'node') return 'node <file>';
      if (cmd === 'python3' || cmd === 'python') return 'python3 <script>';
      if (cmd === 'docker run') return 'docker run <options> <image>';
      if (cmd === 'docker build') return 'docker build -t <tag> .';
      if (cmd === 'docker compose' || cmd === 'docker-compose') return 'docker compose up';
      
      return `${cmd} <args>`;
    })
    .filter((x): x is string => x !== null);
    
  return {
    skeleton: skeletons.join(' && '),
    droppedStatus
  };
}

interface RawCandidate {
  sequence: string;
  count: number;
  length: number;
}

// Containment must respect command boundaries. Raw string `includes` would
// treat `npm → np` as contained in `npm → npx`.
function containsSequence(parent: string[], child: string[]): boolean {
  if (child.length >= parent.length) return false;
  outer: for (let i = 0; i <= parent.length - child.length; i++) {
    for (let j = 0; j < child.length; j++) {
      if (parent[i + j] !== child[j]) continue outer;
    }
    return true;
  }
  return false;
}

// The observer emits 2-grams and 3-grams over the same command stream, so
// almost every 2-gram is contained in some 3-gram. Suppressing on containment
// alone therefore erases the entire short-loop layer — 267 of 271 two-step
// loops, measured against real telemetry.
//
// A shorter sequence is only a fragment if it barely occurs outside its best
// parent. When it recurs well beyond that parent, it is the stable core that
// many different 3-grams happen to wrap, and it is the automatable unit.
const CORE_RECURRENCE_RATIO = 1.25;

function collapseSubsequences(candidates: RawCandidate[]): RawCandidate[] {
  const tokens = new Map<string, string[]>(
    candidates.map(item => [item.sequence, meaningful(item.sequence)])
  );
  const sorted = [...candidates].sort((a, b) => b.length - a.length || b.count - a.count);
  const accepted: RawCandidate[] = [];

  for (const item of sorted) {
    const itemTokens = tokens.get(item.sequence) ?? [];
    let maxParentCount = 0;

    for (const parent of accepted) {
      const parentTokens = tokens.get(parent.sequence) ?? [];
      if (containsSequence(parentTokens, itemTokens)) {
        maxParentCount = Math.max(maxParentCount, parent.count);
      }
    }

    if (maxParentCount === 0 || item.count > maxParentCount * CORE_RECURRENCE_RATIO) {
      accepted.push(item);
    }
  }

  return accepted.sort((a, b) => b.count - a.count);
}

function main() {
  const repoDir = process.cwd();
  console.log(`\n${c.bold}${c.bgBlue} ⚡ COLDSPARK AUTOMATION SCOUT ⚡ ${c.reset}\n`);

  const dbPath = path.join(repoDir, 'data', 'coldspark.db');
  if (!fs.existsSync(dbPath)) {
    console.log(`${c.red}Error: SQLite database not found at ${dbPath}.${c.reset}`);
    console.log(`Please run the observer with --persist first to initialize telemetry database.\n`);
    process.exit(1);
  }

  // Fetch sequences from the latest run
  const qSql = `
  WITH latest_run AS (
      SELECT id FROM runs ORDER BY timestamp DESC LIMIT 1
  )
  SELECT sequence, count, length
  FROM run_sequences
  WHERE run_id = (SELECT id FROM latest_run)
  ORDER BY count DESC;
  `;

  const rawRows = runSqliteQuery(dbPath, qSql, true);
  const parsedRows = parseSqlResult(rawRows);

  const rawCandidates: RawCandidate[] = parsedRows.map((row: any) => {
    if (row.sequence !== undefined) {
      return {
        sequence: row.sequence,
        count: parseInt(row.count, 10),
        length: parseInt(row.length, 10)
      };
    } else if (Array.isArray(row) && row.length >= 3) {
      return {
        sequence: row[0],
        count: parseInt(row[1], 10),
        length: parseInt(row[2], 10)
      };
    }
    return null;
  }).filter((x): x is RawCandidate => x !== null);

  // 1. Filter out transport/navigation noise and self-repeat cycles
  const cleanCandidates = rawCandidates.filter(item => {
    return !isNoiseSequence(item.sequence) && !isSelfRepeat(item.sequence);
  });

  // 2. Collapse sub-sequences into their parents to avoid redundant loop reporting
  // Display the top 20 significant candidates (no count limit, to allow 1x ceremonies to show)
  const uniqueCandidates = collapseSubsequences(cleanCandidates).slice(0, 20);

  console.log(`${c.cyan}================================================================================${c.reset}`);
  console.log(`${c.yellow}⚠️  NOTICE & SAFETY RULES:${c.reset}`);
  console.log(`  - The mirror stores command names ONLY, not arguments.`);
  console.log(`  - The proposed templates below are shapes/skeletons to fill in, NOT drop-in code.`);
  console.log(`  - Safety Contract: The scout proposes; it never writes files or executes code.`);
  console.log(`${c.cyan}================================================================================${c.reset}\n`);

  console.log(`${c.magenta}=== RANKED AUTOMATION CANDIDATES ===${c.reset}\n`);

  if (uniqueCandidates.length === 0) {
    console.log(`  No significant automation candidates found.\n`);
  } else {
    uniqueCandidates.forEach((item, idx) => {
      const cls = classifyCandidate(item.sequence);
      const { skeleton, droppedStatus } = generateSkeleton(item.sequence);
      
      const classTag = cls === 'handoff' ? `${c.red}[handoff]${c.reset}` : `${c.green}[scriptable]${c.reset}`;
      
      console.log(`[${idx + 1}] Count: ${c.bold}${item.count}x${c.reset} | Length: ${item.length} | Class: ${classTag}`);
      console.log(`    Sequence: ${c.cyan}${item.sequence}${c.reset}`);
      console.log(`    Skeleton: ${c.bold}${skeleton}${c.reset}`);
      
      if (droppedStatus) {
        console.log(`    ${c.dim}(Note: git status was dropped as informational-only)${c.reset}`);
      }
      
      if (cls === 'handoff') {
        console.log(`    ${c.yellow}Guidance: ⚠️  This is an interactive loop of agents. Do not script this blindly.${c.reset}`);
        console.log(`              Instead, fold it into your orchestration/harness layer.\n`);
      } else {
        console.log(`    ${c.green}Guidance: ✓ SKELETON ONLY. Review before adding to automation.${c.reset}\n`);
      }
    });
  }

  console.log(`${c.bold}${c.green}Coldspark Scout Complete.${c.reset}\n`);
}

main();
