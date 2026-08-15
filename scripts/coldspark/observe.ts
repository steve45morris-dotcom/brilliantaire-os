import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { redactSecrets } from './redact';

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

interface Commit {
  hash: string;
  dateStr: string; // YYYY-MM-DDTHH:MM:SS+/-TZ
  author: string;
  subject: string;
  localHour: number;
  dayOfWeek: string;
  dayStr: string; // YYYY-MM-DD
}

function runGitCommand(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    return '';
  }
}

function runSqliteQuery(dbPath: string, sql: string, useJson = true): string {
  try {
    const args = useJson ? [dbPath, '-json', sql] : [dbPath, sql];
    return execFileSync('/usr/bin/sqlite3', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    if (useJson) {
      // Fallback if -json flag is unsupported by older sqlite3 installations
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
    // Fallback parser for standard pipe-delimited output
    return raw.split('\n').map(line => {
      return line.split('|');
    });
  }
}

// A real command key is an executable-style token: lowercase, no spaces, short.
// Everything else reaching this point is history debris, not a command —
// prose fragments pasted into the terminal ("Run", "The", "Install"),
// shouted words ("AGY", "CLAUDE", "RELOAD"), and opaque high-entropy tokens
// (API keys, hashes) that must never be persisted as telemetry.
const COMMAND_KEY_RE = /^[a-z0-9][a-z0-9._+-]*$/;
const MAX_COMMAND_KEY_LEN = 32;

// Belt-and-braces: known credential prefixes, in case a secret is all-lowercase
// and would otherwise satisfy the shape rule above.
const SECRET_PREFIXES = [
  'aiza', 'sk-', 'ghp_', 'gho_', 'ghs_', 'ghu_', 'github_pat_',
  'xox', 'akia', 'asia', 'hf_', 'pplx-', 'glpat-', 'dop_v1_', 'shpat_'
];

function looksLikeCommandKey(base: string): boolean {
  if (!base || base.length > MAX_COMMAND_KEY_LEN) return false;
  if (!COMMAND_KEY_RE.test(base)) return false;

  const lower = base.toLowerCase();
  if (SECRET_PREFIXES.some(prefix => lower.startsWith(prefix))) return false;

  return true;
}

// Prefix stripping and subcommand key generation
function getCommandKey(cmd: string): string {
  const trimmed = cmd.trim();
  if (!trimmed || trimmed.startsWith('#')) return '';
  
  const cleanCmd = trimmed.split(/[;|]|\&\&|\|\|/)[0].trim();
  const words = cleanCmd.split(/\s+/);
  
  let startIndex = 0;
  while (startIndex < words.length) {
    const word = words[startIndex];
    
    // Skip environment variable assignments
    if (word.includes('=')) {
      startIndex++;
      continue;
    }
    
    // Skip command prefix modifiers
    if (word === 'sudo' || word === 'env') {
      startIndex++;
      continue;
    }
    
    break;
  }
  
  if (startIndex >= words.length) return '';
  
  let base = words[startIndex];
  
  if (base.includes('/')) {
    base = base.substring(base.lastIndexOf('/') + 1);
  }
  
  // Clean surrounding quotation marks
  base = base.replace(/^['"]+|['"]+$/g, '');
  
  if (!looksLikeCommandKey(base)) {
    return '';
  }

  if (base === 'git' && startIndex + 1 < words.length) {
    const sub = words[startIndex + 1].replace(/^['"]+|['"]+$/g, '');
    if (!sub.startsWith('-') && looksLikeCommandKey(sub)) {
      return `git ${sub}`;
    }
  }
  return base;
}

function generateBarChart(data: { label: string; count: number }[], maxBarLength = 40): string {
  if (data.length === 0) return 'No data available.\n';
  const maxCount = Math.max(...data.map(d => d.count));
  if (maxCount === 0) return 'No occurrences.\n';

  return data
    .map(d => {
      const barLength = Math.round((d.count / maxCount) * maxBarLength);
      const bar = '█'.repeat(barLength) + '░'.repeat(maxBarLength - barLength);
      return `  ${d.label.padEnd(15)} : ${bar} (${d.count})`;
    })
    .join('\n');
}

function parseZshHistory(filePath: string): {
  hasTimestamps: boolean;
  commands: string[];
  redactions: Map<string, number>;
} {
  const redactions = new Map<string, number>();

  if (!fs.existsSync(filePath)) {
    return { hasTimestamps: false, commands: [], redactions };
  }

  const raw = fs.readFileSync(filePath, 'latin1');
  const lines = raw.split('\n');
  const commands: string[] = [];
  let hasTimestamps = false;
  
  let currentBuffer = '';

  for (let line of lines) {
    if (!currentBuffer) {
      const extendedMatch = line.match(/^:\s*(\d+):(\d+);(.*)$/);
      if (extendedMatch) {
        hasTimestamps = true;
        line = extendedMatch[3];
      }
    }

    const endsWithBackslash = line.endsWith('\\');
    if (endsWithBackslash) {
      currentBuffer += (currentBuffer ? '\n' : '') + line.slice(0, -1);
    } else {
      currentBuffer += (currentBuffer ? '\n' : '') + line;
      const cmdText = currentBuffer.trim();
      if (cmdText) {
        commands.push(scrub(cmdText));
      }
      currentBuffer = '';
    }
  }

  if (currentBuffer.trim()) {
    commands.push(scrub(currentBuffer.trim()));
  }

  return { hasTimestamps, commands, redactions };

  // Every command string enters the mirror through here. Scrubbing at this one
  // point guarantees no credential can reach the ranks, the sequences, or a
  // digest, regardless of what downstream analysis is added later.
  function scrub(cmdText: string): string {
    const { text, hits } = redactSecrets(cmdText);
    for (const hit of hits) {
      redactions.set(hit, (redactions.get(hit) ?? 0) + 1);
    }
    return text;
  }
}

function main() {
  const repoDir = process.cwd();
  console.log(`\n${c.bold}${c.bgMagenta} ⚡ COLDSPARK WORKSPACE OBSERVER ⚡ ${c.reset}\n`);

  // Parse arguments
  const args = process.argv.slice(2);
  let days = 60;
  let shouldPersist = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && i + 1 < args.length) {
      days = parseInt(args[i + 1], 10) || 60;
      i++;
    } else if (args[i].startsWith('--days=')) {
      days = parseInt(args[i].split('=')[1], 10) || 60;
    } else if (args[i] === '--persist') {
      shouldPersist = true;
    }
  }

  console.log(`${c.cyan}Analyzing history inside:${c.reset} ${c.bold}${repoDir}${c.reset}`);
  console.log(`${c.cyan}Time window:${c.reset} Last ${c.bold}${days} days${c.reset}`);
  console.log(`${c.cyan}Persistence:${c.reset} ${shouldPersist ? `${c.green}Enabled (SQLite)${c.reset}` : `${c.yellow}Disabled${c.reset}`}\n`);

  // Check Git context
  const gitTopLevel = runGitCommand(['rev-parse', '--show-toplevel'], repoDir);
  if (!gitTopLevel) {
    console.log(`${c.red}Error: Current directory is not a git repository.${c.reset}`);
    process.exit(1);
  }

  const currentBranch = runGitCommand(['branch', '--show-current'], repoDir) || 'main';
  const branches = runGitCommand(['branch', '--format=%(refname:short)'], repoDir)
    .split('\n')
    .map(b => b.trim())
    .filter(Boolean);
  
  const comparisonBranch = branches.includes('main') ? 'main' : (branches.includes('master') ? 'master' : currentBranch);

  console.log(`${c.magenta}=== GIT ANALYSIS ===${c.reset}`);
  console.log(`Current Branch:    ${c.bold}${currentBranch}${c.reset}`);
  console.log(`Baseline Branch:  ${c.bold}${comparisonBranch}${c.reset}`);

  // Fetch commits using strict ISO format to ensure easy SQLite datetime parsing
  const allLogsRaw = runGitCommand(
    ['log', '--all', `--since=${days} days ago`, '--date=iso-strict', '--pretty=format:%h|%ad|%an|%s'],
    repoDir
  );
  
  const mainLogsRaw = runGitCommand(
    ['log', comparisonBranch, `--since=${days} days ago`, '--date=iso-strict', '--pretty=format:%h|%ad|%an|%s'],
    repoDir
  );

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function parseCommits(logOutput: string): Commit[] {
    if (!logOutput) return [];
    return logOutput
      .split('\n')
      .map(line => {
        if (!line.trim()) return null;
        const parts = line.split('|');
        if (parts.length < 4) return null;
        const [hash, dateStr, author, ...subjectParts] = parts;
        const subject = subjectParts.join('|');

        // Extract author's wall-clock hour from strict ISO date format: YYYY-MM-DDTHH:MM:SS+/-TZ
        const hourMatch = dateStr.match(/T(\d{2}):\d{2}/);
        const localHour = hourMatch ? parseInt(hourMatch[1], 10) : 0;

        const datePart = dateStr.split('T')[0];
        const dateObj = new Date(`${datePart}T12:00:00`);
        const dayOfWeek = daysOfWeek[isNaN(dateObj.getTime()) ? 0 : dateObj.getDay()];

        return {
          hash,
          dateStr,
          author,
          subject,
          localHour,
          dayOfWeek,
          dayStr: datePart
        };
      })
      .filter((c): c is Commit => c !== null);
  }

  const allCommits = parseCommits(allLogsRaw);
  const mainCommits = parseCommits(mainLogsRaw);

  const mainHashes = new Set(mainCommits.map(c => c.hash));
  const offBranchCommits = allCommits.filter(c => !mainHashes.has(c.hash));

  console.log(`Commits on ${c.bold}${comparisonBranch}${c.reset}:  ${c.bold}${mainCommits.length}${c.reset}`);
  console.log(`Off-branch commits: ${c.bold}${c.cyan}${offBranchCommits.length}${c.reset} (across all refs)`);
  console.log(`Total commits:      ${c.bold}${allCommits.length}${c.reset}`);

  if (offBranchCommits.length > 0) {
    console.log(`\n${c.yellow}Off-Branch Commit Samples:${c.reset}`);
    offBranchCommits.slice(0, 5).forEach(commit => {
      console.log(`  - [${c.dim}${commit.hash}${c.reset}] ${c.bold}${commit.subject}${c.reset} (${commit.dateStr})`);
    });
    if (offBranchCommits.length > 5) {
      console.log(`    ... and ${offBranchCommits.length - 5} more.`);
    }
  }

  // --- Commits by Hour of Day ---
  console.log(`\n${c.magenta}=== WALL-CLOCK COMMIT HOUR OF DAY ===${c.reset}`);
  const hourBuckets = Array.from({ length: 24 }, (_, i) => ({
    label: `${String(i).padStart(2, '0')}:00-${String((i + 1) % 24).padStart(2, '0')}:00`,
    count: 0
  }));
  allCommits.forEach(commit => {
    hourBuckets[commit.localHour].count++;
  });
  console.log(generateBarChart(hourBuckets));

  // --- Commits by Day of Week ---
  console.log(`\n${c.magenta}=== COMMIT DAY OF WEEK ===${c.reset}`);
  const dayBuckets = daysOfWeek.map(day => ({ label: day, count: 0 }));
  allCommits.forEach(commit => {
    const idx = daysOfWeek.indexOf(commit.dayOfWeek);
    if (idx !== -1) {
      dayBuckets[idx].count++;
    }
  });
  console.log(generateBarChart(dayBuckets));

  // --- Most Touched Files ---
  console.log(`\n${c.magenta}=== MOST TOUCHED PATHS (All Refs) ===${c.reset}`);
  const filesOutput = runGitCommand(
    ['log', '--all', `--since=${days} days ago`, '--name-only', '--pretty=format:'],
    repoDir
  );
  
  const lockfileBasenames = new Set([
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    'package-lock.yaml',
    'npm-shrinkwrap.json',
    'composer.lock',
    'Cargo.lock',
    'Gemfile.lock',
    'mix.lock',
    'poetry.lock'
  ]);

  const fileCounts: Record<string, number> = {};
  if (filesOutput) {
    filesOutput.split('\n').forEach(line => {
      const file = line.trim();
      if (file && !file.includes('node_modules/') && !file.endsWith('.tsbuildinfo')) {
        const basename = path.basename(file);
        if (!lockfileBasenames.has(basename)) {
          fileCounts[file] = (fileCounts[file] || 0) + 1;
        }
      }
    });
  }

  const sortedFiles = Object.entries(fileCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  if (sortedFiles.length === 0) {
    console.log('  No touched files found.');
  } else {
    sortedFiles.forEach(([file, count], i) => {
      const rank = String(i + 1).padStart(2, ' ');
      console.log(`  ${c.dim}${rank}.${c.reset} ${c.bold}${file.padEnd(50)}${c.reset} -> ${c.cyan}${count}x${c.reset}`);
    });
  }

  // --- Shell History Analysis ---
  console.log(`\n${c.magenta}=== SHELL HISTORY TELEMETRY ===${c.reset}`);
  const zshHistoryPath = path.join(os.homedir(), '.zsh_history');
  const { hasTimestamps, commands, redactions } = parseZshHistory(zshHistoryPath);

  // Report shapes and counts, never values — a scrub you cannot see is a scrub
  // you cannot trust, but printing what was scrubbed would defeat the purpose.
  if (redactions.size > 0) {
    const total = [...redactions.values()].reduce((sum, n) => sum + n, 0);
    console.log(`  ${c.yellow}🛡  Redacted ${total} credential(s) at ingest — never persisted:${c.reset}`);
    for (const [name, count] of [...redactions].sort((a, b) => b[1] - a[1])) {
      console.log(`       ${c.dim}${name}: ${count}${c.reset}`);
    }
  }

  const cmdCounts: Record<string, number> = {};
  const commandKeys: string[] = [];
  const seq2Counts: Record<string, number> = {};
  const seq3Counts: Record<string, number> = {};

  if (!fs.existsSync(zshHistoryPath)) {
    console.log(`  ${c.yellow}⚠️  No Zsh history file found at ${zshHistoryPath}${c.reset}`);
  } else {
    if (hasTimestamps) {
      console.log(`  History file:  ${c.green}✓ ${zshHistoryPath} (Timestamps Enabled)${c.reset}`);
    } else {
      console.log(`  History file:  ${c.red}✗ ${zshHistoryPath} (Timestamps Disabled)${c.reset}`);
      console.log(`\n  ${c.yellow}⚠️  To enable timestamps in your shell history going forward, add this to your ~/.zshrc:${c.reset}`);
      console.log(`      ${c.bold}export EXTENDED_HISTORY=1${c.reset}  or  ${c.bold}setopt EXTENDED_HISTORY${c.reset}\n`);
    }

    console.log(`  Total scanned commands (collapsed): ${c.bold}${commands.length}${c.reset}\n`);

    if (commands.length > 0) {
      commands.forEach(cmd => {
        const key = getCommandKey(cmd);
        if (key) {
          cmdCounts[key] = (cmdCounts[key] || 0) + 1;
          commandKeys.push(key);
        }
      });

      console.log(`${c.bold}Top 15 Most Common Commands:${c.reset}`);
      const sortedCmds = Object.entries(cmdCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      sortedCmds.forEach(([cmd, count], i) => {
        const rank = String(i + 1).padStart(2, ' ');
        console.log(`  ${c.dim}${rank}.${c.reset} ${c.bold}${cmd.padEnd(20)}${c.reset} -> ${c.cyan}${count}x${c.reset}`);
      });

      // Rank 2-Command Sequences
      console.log(`\n${c.bold}Top 10 Common 2-Command Sequences:${c.reset}`);
      for (let i = 0; i < commandKeys.length - 1; i++) {
        const seq = `${commandKeys[i]} → ${commandKeys[i+1]}`;
        seq2Counts[seq] = (seq2Counts[seq] || 0) + 1;
      }

      const sortedSeq2 = Object.entries(seq2Counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (sortedSeq2.length === 0) {
        console.log('  No distinct sequences found.');
      } else {
        sortedSeq2.forEach(([seq, count], i) => {
          const rank = String(i + 1).padStart(2, ' ');
          console.log(`  ${c.dim}${rank}.${c.reset} ${c.bold}${seq.padEnd(45)}${c.reset} -> ${c.cyan}${count}x${c.reset}`);
        });
      }

      // Rank 3-Command Sequences
      console.log(`\n${c.bold}Top 10 Common 3-Command Sequences:${c.reset}`);
      for (let i = 0; i < commandKeys.length - 2; i++) {
        const seq = `${commandKeys[i]} → ${commandKeys[i+1]} → ${commandKeys[i+2]}`;
        seq3Counts[seq] = (seq3Counts[seq] || 0) + 1;
      }

      const sortedSeq3 = Object.entries(seq3Counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (sortedSeq3.length === 0) {
        console.log('  No distinct sequences found.');
      } else {
        sortedSeq3.forEach(([seq, count], i) => {
          const rank = String(i + 1).padStart(2, ' ');
          console.log(`  ${c.dim}${rank}.${c.reset} ${c.bold}${seq.padEnd(55)}${c.reset} -> ${c.cyan}${count}x${c.reset}`);
        });
      }
    }
  }

  // --- SQLite Persistence & Run Comparison ---
  if (shouldPersist) {
    console.log(`\n${c.magenta}=== PERSISTING TO SQLITE ===${c.reset}`);
    const dbDir = path.join(repoDir, 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'coldspark.db');

    // 1. Initialize Tables
    const schemaInitSql = `
    CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        window_days INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS commits (
        hash TEXT PRIMARY KEY,
        author TEXT NOT NULL,
        date DATETIME NOT NULL,
        local_hour INTEGER NOT NULL,
        day_of_week TEXT NOT NULL,
        subject TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS commit_files (
        commit_hash TEXT NOT NULL,
        filepath TEXT NOT NULL,
        PRIMARY KEY (commit_hash, filepath),
        FOREIGN KEY (commit_hash) REFERENCES commits(hash) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS run_command_ranks (
        run_id INTEGER NOT NULL,
        command TEXT NOT NULL,
        count INTEGER NOT NULL,
        rank INTEGER NOT NULL,
        PRIMARY KEY (run_id, command),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS run_path_ranks (
        run_id INTEGER NOT NULL,
        filepath TEXT NOT NULL,
        count INTEGER NOT NULL,
        rank INTEGER NOT NULL,
        PRIMARY KEY (run_id, filepath),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS run_sequences (
        run_id INTEGER NOT NULL,
        sequence TEXT NOT NULL,
        count INTEGER NOT NULL,
        length INTEGER NOT NULL,
        PRIMARY KEY (run_id, sequence),
        FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );
    `;
    runSqliteQuery(dbPath, schemaInitSql, false);

    // Get count of previous runs before inserting current one
    const prevRunCountStr = runSqliteQuery(dbPath, 'SELECT COUNT(*) FROM runs;', false);
    const hasPreviousRuns = parseInt(prevRunCountStr.trim(), 10) > 0;

    // 2. Register New Run & Retrieve Insert ID (Chained to maintain same connection context)
    const runIdStr = runSqliteQuery(
      dbPath, 
      `INSERT INTO runs (window_days) VALUES (${days}); SELECT last_insert_rowid();`, 
      false
    );
    const runId = parseInt(runIdStr.trim(), 10);
    console.log(`Registered observation Run ID: ${c.bold}${runId}${c.reset}`);

    // 3. Insert Idempotent Git Commits
    if (allCommits.length > 0) {
      let commitsSql = 'BEGIN TRANSACTION;\n';
      allCommits.forEach(commit => {
        const escapedAuthor = commit.author.replace(/'/g, "''");
        const escapedSubject = commit.subject.replace(/'/g, "''");
        commitsSql += `INSERT OR IGNORE INTO commits (hash, author, date, local_hour, day_of_week, subject) VALUES ('${commit.hash}', '${escapedAuthor}', '${commit.dateStr}', ${commit.localHour}, '${commit.dayOfWeek}', '${escapedSubject}');\n`;
      });
      commitsSql += 'COMMIT;';
      runSqliteQuery(dbPath, commitsSql, false);
    }

    // 4. Map and Insert Commit Files (Single Git Call)
    const commitFilesRaw = runGitCommand(
      ['log', '--all', `--since=${days} days ago`, '--name-only', '--pretty=format:COMMIT:%h'],
      repoDir
    );
    const commitFilesMap: Record<string, string[]> = {};
    if (commitFilesRaw) {
      let currentHash = '';
      commitFilesRaw.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.startsWith('COMMIT:')) {
          currentHash = trimmed.substring(7);
          commitFilesMap[currentHash] = [];
        } else if (currentHash) {
          commitFilesMap[currentHash].push(trimmed);
        }
      });
    }

    let commitFilesSql = 'BEGIN TRANSACTION;\n';
    Object.entries(commitFilesMap).forEach(([hash, files]) => {
      files.forEach(file => {
        if (file && !file.includes('node_modules/')) {
          const escapedFile = file.replace(/'/g, "''");
          commitFilesSql += `INSERT OR IGNORE INTO commit_files (commit_hash, filepath) VALUES ('${hash}', '${escapedFile}');\n`;
        }
      });
    });
    commitFilesSql += 'COMMIT;';
    runSqliteQuery(dbPath, commitFilesSql, false);

    // 5. Insert Snapshot Command Rankings
    const sortedCmdsList = Object.entries(cmdCounts).sort((a, b) => b[1] - a[1]);
    if (sortedCmdsList.length > 0) {
      let cmdRanksSql = 'BEGIN TRANSACTION;\n';
      sortedCmdsList.forEach(([cmd, count], idx) => {
        const escapedCmd = cmd.replace(/'/g, "''");
        cmdRanksSql += `INSERT INTO run_command_ranks (run_id, command, count, rank) VALUES (${runId}, '${escapedCmd}', ${count}, ${idx + 1});\n`;
      });
      cmdRanksSql += 'COMMIT;';
      runSqliteQuery(dbPath, cmdRanksSql, false);
    }

    // 6. Insert Snapshot Path Rankings
    if (sortedFiles.length > 0) {
      let pathRanksSql = 'BEGIN TRANSACTION;\n';
      sortedFiles.forEach(([file, count], idx) => {
        const escapedFile = file.replace(/'/g, "''");
        pathRanksSql += `INSERT INTO run_path_ranks (run_id, filepath, count, rank) VALUES (${runId}, '${escapedFile}', ${count}, ${idx + 1});\n`;
      });
      pathRanksSql += 'COMMIT;';
      runSqliteQuery(dbPath, pathRanksSql, false);
    }

    // 7. Insert Snapshot Sequence Counts
    let seqSql = 'BEGIN TRANSACTION;\n';
    Object.entries(seq2Counts).forEach(([seq, count]) => {
      const escapedSeq = seq.replace(/'/g, "''");
      seqSql += `INSERT INTO run_sequences (run_id, sequence, count, length) VALUES (${runId}, '${escapedSeq}', ${count}, 2);\n`;
    });
    Object.entries(seq3Counts).forEach(([seq, count]) => {
      const escapedSeq = seq.replace(/'/g, "''");
      seqSql += `INSERT INTO run_sequences (run_id, sequence, count, length) VALUES (${runId}, '${escapedSeq}', ${count}, 3);\n`;
    });
    seqSql += 'COMMIT;';
    runSqliteQuery(dbPath, seqSql, false);

    console.log(`${c.green}Telemetry successfully written to SQLite.${c.reset}`);

    // 8. Run-to-Run Delta Reporting
    if (hasPreviousRuns) {
      console.log(`\n${c.bold}${c.magenta}=== RUN DIFFERENTIAL (Latest vs Previous) ===${c.reset}\n`);

      // Delta 1: Touched Paths delta (Query 1)
      const q1Sql = `
      WITH latest_run AS (
          SELECT id FROM runs ORDER BY timestamp DESC LIMIT 1
      ),
      previous_run AS (
          SELECT id FROM runs ORDER BY timestamp DESC LIMIT 1 OFFSET 1
      )
      SELECT 
          l.filepath,
          l.count AS latest_count,
          l.rank AS latest_rank
      FROM run_path_ranks l
      JOIN latest_run lr ON l.run_id = lr.id
      WHERE l.filepath NOT IN (
          SELECT p.filepath 
          FROM run_path_ranks p 
          JOIN previous_run pr ON p.run_id = pr.id
      )
      ORDER BY l.rank ASC;
      `;
      const q1Raw = runSqliteQuery(dbPath, q1Sql, true);
      const q1Rows = parseSqlResult(q1Raw);

      console.log(`${c.bold}Δ New Paths Entering Top List:${c.reset}`);
      if (q1Rows.length === 0) {
        console.log('  No new paths entered the top list.');
      } else {
        q1Rows.forEach((row: any) => {
          if (row.filepath !== undefined) {
            console.log(`  - ${c.bold}${row.filepath.padEnd(50)}${c.reset} [Rank #${row.latest_rank}, Count: ${c.cyan}${row.latest_count}x${c.reset}]`);
          } else if (Array.isArray(row) && row.length >= 3) {
            console.log(`  - ${c.bold}${row[0].padEnd(50)}${c.reset} [Rank #${row[2]}, Count: ${c.cyan}${row[1]}x${c.reset}]`);
          }
        });
      }

      // Delta 2: Shift in Sequence Loops (Query 2) - Filtered to non-zero drifts to remove noise
      const q2Sql = `
      WITH latest_run AS (
          SELECT id FROM runs ORDER BY timestamp DESC LIMIT 1
      ),
      previous_run AS (
          SELECT id FROM runs ORDER BY timestamp DESC LIMIT 1 OFFSET 1
      )
      SELECT 
          l.sequence,
          COALESCE(p.count, 0) AS prev_count,
          l.count AS latest_count,
          (l.count - COALESCE(p.count, 0)) AS count_delta
      FROM run_sequences l
      JOIN latest_run lr ON l.run_id = lr.id
      LEFT JOIN run_sequences p ON p.sequence = l.sequence 
          AND p.run_id = (SELECT id FROM previous_run)
      WHERE (l.count - COALESCE(p.count, 0)) != 0
      ORDER BY ABS(l.count - COALESCE(p.count, 0)) DESC
      LIMIT 5;
      `;
      const q2Raw = runSqliteQuery(dbPath, q2Sql, true);
      const q2Rows = parseSqlResult(q2Raw);

      console.log(`\n${c.bold}Δ Top Sequence Loop Drifts:${c.reset}`);
      if (q2Rows.length === 0) {
        console.log('  No loop changes recorded.');
      } else {
        q2Rows.forEach((row: any) => {
          if (row.sequence !== undefined) {
            const sign = row.count_delta >= 0 ? '+' : '';
            console.log(`  - ${c.bold}${row.sequence.padEnd(45)}${c.reset} [${row.prev_count} → ${row.latest_count} (${c.cyan}${sign}${row.count_delta}${c.reset})]`);
          } else if (Array.isArray(row) && row.length >= 4) {
            const delta = parseInt(row[3], 10);
            const sign = delta >= 0 ? '+' : '';
            console.log(`  - ${c.bold}${row[0].padEnd(45)}${c.reset} [${row[1]} → ${row[2]} (${c.cyan}${sign}${delta}${c.reset})]`);
          }
        });
      }

      // Delta 3: Commit Volume Drift (Query 3)
      const q3Sql = `
      WITH latest_run AS (
          SELECT id, timestamp, window_days FROM runs ORDER BY timestamp DESC LIMIT 1
      ),
      previous_run AS (
          SELECT id, timestamp, window_days FROM runs ORDER BY timestamp DESC LIMIT 1 OFFSET 1
      )
      SELECT 
          (SELECT COUNT(*) FROM commits 
           WHERE datetime(date) >= datetime((SELECT timestamp FROM latest_run), '-' || (SELECT window_days FROM latest_run) || ' days')
             AND datetime(date) <= datetime((SELECT timestamp FROM latest_run))
          ) AS latest_volume,
          (SELECT COUNT(*) FROM commits 
           WHERE datetime(date) >= datetime((SELECT timestamp FROM previous_run), '-' || (SELECT window_days FROM previous_run) || ' days')
             AND datetime(date) <= datetime((SELECT timestamp FROM previous_run))
          ) AS previous_volume;
      `;
      const q3Raw = runSqliteQuery(dbPath, q3Sql, true);
      const q3Rows = parseSqlResult(q3Raw);

      if (q3Rows.length > 0) {
        let latestVol = 0;
        let prevVol = 0;
        const row = q3Rows[0];
        if (row.latest_volume !== undefined) {
          latestVol = row.latest_volume;
          prevVol = row.previous_volume;
        } else if (Array.isArray(row) && row.length >= 2) {
          latestVol = parseInt(row[0], 10);
          prevVol = parseInt(row[1], 10);
        }
        const delta = latestVol - prevVol;
        const sign = delta >= 0 ? '+' : '';
        console.log(`\n${c.bold}Δ Commit Volume Drift (${days}-day window):${c.reset}`);
        console.log(`  - Latest Volume:   ${c.bold}${latestVol}${c.reset} commits`);
        console.log(`  - Previous Volume: ${c.bold}${prevVol}${c.reset} commits [Drift: ${c.cyan}${sign}${delta}${c.reset}]`);
      }
    }
  }

  console.log(`\n${c.bold}${c.green}Coldspark Analysis Complete.${c.reset}\n`);
}

main();
