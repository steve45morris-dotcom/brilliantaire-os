import fs from 'fs';
import path from 'path';
import {
  APPEND_GATE_ONLY,
  ALLOW_PROJECTS_MD_OVERWRITE,
  ALLOW_APPEND_ALL_BY_DEFAULT,
  REQUIRE_CONFIRM_FLAG,
  REQUIRE_BACKUP_BEFORE_APPEND,
  REQUIRE_STAGED_ENTRIES,
  REQUIRE_DUPLICATE_CHECK,
  PROJECTS_MD_PATH,
  STAGED_ENTRIES_DIR,
  APPEND_REPORT_DIR,
  BACKUP_DIR,
  LOG_DIR
} from '../config/project-registry-append-gate.js';
import { printHelp } from './project-registry-append-gate-help.js';

const REPO_ROOT = '/Users/alexanderanthony';

interface CandidateEntry {
  projectName: string;
  path: string;
  purpose: string;
  status: string;
  priority: string;
  nextAction: string;
  relatedTools: string;
  notes: string;
  classification: string;
  rawLine: string;
}

// Get YYYY-MM-DD date format
function getDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Get HHMM time format
function getTimeStr(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}${min}`;
}

// Find latest file in a directory matching a prefix and suffix
function findLatestFile(dir: string, prefix: string, suffix: string): string | null {
  if (!fs.existsSync(dir)) return null;
  try {
    const files = fs.readdirSync(dir);
    const matched = files.filter(f => f.startsWith(prefix) && f.endsWith(suffix)).sort();
    if (matched.length > 0) {
      return path.join(dir, matched[matched.length - 1]);
    }
  } catch {}
  return null;
}

// Parse projects from PROJECTS.md to collect existing names and paths
function getExistingProjects(): { names: Set<string>; paths: Set<string>; content: string } {
  const names = new Set<string>();
  const paths = new Set<string>();
  const projectsFile = path.join(REPO_ROOT, PROJECTS_MD_PATH);
  if (!fs.existsSync(projectsFile)) {
    return { names, paths, content: '' };
  }

  const content = fs.readFileSync(projectsFile, 'utf-8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 8) continue;
    if (parts[1].toLowerCase().includes('project name') || parts[1].includes('---')) continue;

    const name = parts[1].replace(/\*\*/g, '').trim().toLowerCase();
    names.add(name);

    // Regex match to look for absolute paths
    const pathMatch = line.match(/\/Users\/alexanderanthony\/[a-zA-Z0-9_\-\/]+/);
    if (pathMatch) {
      paths.add(pathMatch[0].trim().toLowerCase());
    }
  }
  return { names, paths, content };
}

// Parse candidate entries from staged markdown table
function parseStagedEntries(filePath: string): CandidateEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const candidates: CandidateEntry[] = [];
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 8) continue;
    if (parts[1].toLowerCase().includes('project name') || parts[1].includes('---')) continue;

    const rawProjectName = parts[1];
    const projectName = rawProjectName.replace(/\*\*/g, '').trim();
    const purpose = parts[2];
    const status = parts[3];
    const priority = parts[4];
    const nextAction = parts[5];
    const relatedTools = parts[6];
    const notes = parts[7];

    // Extract path
    let path = '';
    const pathMatch = purpose.match(/Path:\s*`([^`]+)`/);
    if (pathMatch) {
      path = pathMatch[1].trim();
    }

    // Extract classification
    let classification = 'inspect_manually';
    if (notes.toLowerCase().includes('register classification')) {
      classification = 'register';
    } else if (notes.toLowerCase().includes('active_experiment classification')) {
      classification = 'active_experiment';
    } else if (notes.toLowerCase().includes('inspect_manually classification')) {
      classification = 'inspect_manually';
    }

    candidates.push({
      projectName,
      path,
      purpose,
      status,
      priority,
      nextAction,
      relatedTools,
      notes,
      classification,
      rawLine: line
    });
  }
  return candidates;
}

// 1. preview subcommand
function runPreview(): { candidates: CandidateEntry[]; safe: CandidateEntry[] } {
  console.log('🛡️ Initiating project registry append preview...');
  const stagedDir = path.join(REPO_ROOT, STAGED_ENTRIES_DIR);
  const latestStaged = findLatestFile(stagedDir, 'project_registry_candidate_entries_', '.md');

  if (!latestStaged) {
    console.error('❌ Error: No staged entries file found. Run project-registry-review first.');
    process.exit(1);
  }

  console.log(`🧭 Sourcing candidates from staged entries file: ${latestStaged}`);
  const candidates = parseStagedEntries(latestStaged);
  const { names: existingNames, paths: existingPaths, content: existingContent } = getExistingProjects();

  const dupNames: CandidateEntry[] = [];
  const dupPaths: CandidateEntry[] = [];
  const safeToAppend: CandidateEntry[] = [];
  const requireManualReview: CandidateEntry[] = [];

  for (const c of candidates) {
    const isDupName = existingNames.has(c.projectName.toLowerCase());
    const isDupPath = existingPaths.has(c.path.toLowerCase()) || existingContent.toLowerCase().includes(c.path.toLowerCase());

    if (isDupName) {
      dupNames.push(c);
    }
    if (isDupPath) {
      dupPaths.push(c);
    }

    if (c.classification !== 'register') {
      requireManualReview.push(c);
    } else if (isDupName || isDupPath) {
      requireManualReview.push(c); // Duplicates require manual review
    } else {
      safeToAppend.push(c);
    }
  }

  // Load preview template
  const templatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'append_gate', 'append-preview-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🧭 Project Registry Append Preview\n- **Preview Date:** {{previewDate}}\n- **Staged Entries Source:** {{stagedEntriesSource}}\n- **Candidates Found:** {{candidatesFound}}\n\n## 🔍 Duplicate Analysis\n- **Duplicate Names:**\n{{duplicateNames}}\n- **Duplicate Paths:**\n{{duplicatePaths}}\n\n## 🛡️ Target Append Groups\n- **Safe To Append:**\n{{safeToAppend}}\n- **Manual Review Required:**\n{{manualReviewRequired}}\n\n## ⚠️ Action Status\n- **Default Action:** {{defaultAction}}`;
  }

  const formatList = (list: CandidateEntry[]) => {
    return list.length > 0 ? list.map(c => `  - **${c.projectName}** (\`${c.path}\`)`).join('\n') : '  None';
  };

  const previewDate = getDateStr(new Date());
  const reportContent = template
    .replace('{{previewDate}}', previewDate)
    .replace('{{stagedEntriesSource}}', path.basename(latestStaged))
    .replace('{{candidatesFound}}', candidates.length.toString())
    .replace('{{duplicateNames}}', formatList(dupNames))
    .replace('{{duplicatePaths}}', formatList(dupPaths))
    .replace('{{safeToAppend}}', formatList(safeToAppend))
    .replace('{{manualReviewRequired}}', formatList(requireManualReview))
    .replace('{{defaultAction}}', 'do not append yet');

  const reportDir = path.join(REPO_ROOT, APPEND_REPORT_DIR);
  fs.mkdirSync(reportDir, { recursive: true });
  const destPath = path.join(reportDir, `project_registry_append_preview_${previewDate}.md`);
  fs.writeFileSync(destPath, reportContent, 'utf-8');

  console.log(`✅ Append preview generated: file://${destPath}`);
  return { candidates, safe: safeToAppend };
}

// 2. append-approved subcommand
function runAppendApproved() {
  console.log('🛡️ Attempting execution of approved project registry appending...');

  // Enforce --confirm flag check
  const isConfirmed = process.argv.includes('--confirm');
  if (REQUIRE_CONFIRM_FLAG && !isConfirmed) {
    console.error('❌ Error: The "append-approved" command requires the explicit --confirm flag to execute.');
    process.exit(1);
  }

  const { candidates, safe } = runPreview();

  if (safe.length === 0) {
    console.log('ℹ️ No safe-to-append candidates found. Appending skipped.');
    return;
  }

  const stagedDir = path.join(REPO_ROOT, STAGED_ENTRIES_DIR);
  const latestStaged = findLatestFile(stagedDir, 'project_registry_candidate_entries_', '.md') || 'unknown';

  const now = new Date();
  const dateStr = getDateStr(now);
  const timeStr = getTimeStr(now);

  // PROJECTS.md backup
  const projectsFile = path.join(REPO_ROOT, PROJECTS_MD_PATH);
  if (!fs.existsSync(projectsFile)) {
    console.error('❌ Error: PROJECTS.md file is missing.');
    process.exit(1);
  }

  const backupDir = path.join(REPO_ROOT, BACKUP_DIR);
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = `PROJECTS_backup_${dateStr}_${timeStr}.md`;
  const backupPath = path.join(backupDir, backupFile);

  const projectsContent = fs.readFileSync(projectsFile, 'utf-8');

  // Load backup header template
  const backupTemplatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'append_gate', 'projects-backup-template.md');
  let backupHeader = '';
  if (fs.existsSync(backupTemplatePath)) {
    backupHeader = fs.readFileSync(backupTemplatePath, 'utf-8');
  } else {
    backupHeader = `# PROJECTS.md Backup File\n- **Backup Date:** {{backupDate}}\n- **Source File:** {{sourceFile}}\n- **Backup Path:** {{backupPath}}\n- **Restore Note:** {{restoreNote}}`;
  }

  const formattedHeader = backupHeader
    .replace('{{backupDate}}', dateStr)
    .replace('{{sourceFile}}', PROJECTS_MD_PATH)
    .replace('{{backupPath}}', backupPath)
    .replace('{{restoreNote}}', 'Copy this file back to PROJECTS.md in root to rollback the changes.');

  // Write exact restorable content with comments metadata header
  const backupContent = `<!--\n${formattedHeader}\n-->\n${projectsContent}`;
  fs.writeFileSync(backupPath, backupContent, 'utf-8');
  console.log(`✅ PROJECTS.md backup successfully generated: file://${backupPath}`);

  // Create additions block to append
  console.log('✍️ Appending new entries to PROJECTS.md...');
  const appendRows = safe.map(c => c.rawLine).join('\n');
  const appendBlock = `\n\n## Staged Registry Additions\n- **Date Appended:** ${dateStr}\n- **Source Staged Entries File:** ${path.basename(latestStaged)}\n- **Approval Command Used:** npm run project-registry-append-gate -- "append-approved" --confirm\n- **Candidate Entries Appended:**\n| Project Name | Purpose | Status | Priority | Next Action | Related Tools | Notes |\n|---|---|---|---|---|---|---|\n${appendRows}\n`;

  // Write modification (append)
  fs.appendFileSync(projectsFile, appendBlock, 'utf-8');
  console.log(`✅ Appended ${safe.length} project entries to PROJECTS.md.`);

  // Write execution log using template
  const logTemplatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'append_gate', 'append-log-template.md');
  let logTemplate = '';
  if (fs.existsSync(logTemplatePath)) {
    logTemplate = fs.readFileSync(logTemplatePath, 'utf-8');
  } else {
    logTemplate = `# 🛡️ Project Registry Append Run Log\n- **Timestamp:** {{timestamp}}\n- **Backup Path:** {{backupPath}}\n- **Source File:** {{sourceFile}}\n- **Appended Count:** {{appendedCount}}\n- **Skipped Duplicates:** {{skippedDuplicates}}\n- **Skipped Manual Review:** {{skippedManualReview}}\n- **Status:** {{status}}`;
  }

  const skippedDups = candidates.length - safe.length; // Approximate counts
  const skippedReview = candidates.filter(c => c.classification !== 'register').length;

  const logContent = logTemplate
    .replace('{{timestamp}}', now.toISOString())
    .replace('{{backupPath}}', backupPath)
    .replace('{{sourceFile}}', path.basename(latestStaged))
    .replace('{{appendedCount}}', safe.length.toString())
    .replace('{{skippedDuplicates}}', skippedDups.toString())
    .replace('{{skippedManualReview}}', skippedReview.toString())
    .replace('{{status}}', 'SUCCESS');

  const logDir = path.join(REPO_ROOT, LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `project_registry_append_log_${dateStr}.md`);
  fs.writeFileSync(logPath, logContent, 'utf-8');

  console.log(`✅ Run log generated: file://${logPath}`);
}

// 3. status subcommand
function runStatus() {
  console.log('🛡️ Querying Project Registry Append Gate status...');
  const stagedDir = path.join(REPO_ROOT, STAGED_ENTRIES_DIR);
  const reportDir = path.join(REPO_ROOT, APPEND_REPORT_DIR);
  const backupDir = path.join(REPO_ROOT, BACKUP_DIR);
  const logDir = path.join(REPO_ROOT, LOG_DIR);

  const latestStaged = findLatestFile(stagedDir, 'project_registry_candidate_entries_', '.md');
  const latestPreview = findLatestFile(reportDir, 'project_registry_append_preview_', '.md');
  const latestBackup = findLatestFile(backupDir, 'PROJECTS_backup_', '.md');
  const latestLog = findLatestFile(logDir, 'project_registry_append_log_', '.md');

  let safeCount = 0;
  if (latestStaged) {
    const candidates = parseStagedEntries(latestStaged);
    const { names: existingNames, paths: existingPaths, content: existingContent } = getExistingProjects();
    safeCount = candidates.filter(c => {
      const isDupName = existingNames.has(c.projectName.toLowerCase());
      const isDupPath = existingPaths.has(c.path.toLowerCase()) || existingContent.toLowerCase().includes(c.path.toLowerCase());
      return c.classification === 'register' && !isDupName && !isDupPath;
    }).length;
  }

  let appendedCount = 0;
  if (latestLog) {
    try {
      const logContent = fs.readFileSync(latestLog, 'utf-8');
      const match = logContent.match(/Appended Count[^\d]+(\d+)/i);
      if (match) {
        appendedCount = parseInt(match[1], 10);
      }
    } catch {}
  }

  console.log(`
📊 Project Registry Append Gate Status Dashboard:

Staging & Files:
  - Staged Entries Source:  ${latestStaged ? `file://${latestStaged} (FOUND)` : 'NOT FOUND'}
  - Append Preview Report:  ${latestPreview ? `file://${latestPreview} (FOUND)` : 'NOT FOUND'}
  - Current Backup:         ${latestBackup ? `file://${latestBackup} (FOUND)` : 'NOT FOUND'}
  - Run Log:                ${latestLog ? `file://${latestLog} (FOUND)` : 'NOT FOUND'}

Appends & Metrics:
  - Safe-to-Append Count:   ${safeCount}
  - Appended Count:         ${appendedCount}

Next Action Recommendation:
  - Run project-registry-append-gate "append-approved" --confirm to push candidates.
`);
}

// CLI Entrypoint
function main() {
  const arg = process.argv[2]?.trim().toLowerCase();

  if (APPEND_GATE_ONLY) {
    if (ALLOW_PROJECTS_MD_OVERWRITE || ALLOW_APPEND_ALL_BY_DEFAULT) {
      console.error('❌ Security Violation: Configuration violates APPEND_GATE_ONLY limits.');
      process.exit(1);
    }
  }

  switch (arg) {
    case 'preview': {
      runPreview();
      break;
    }
    case 'append-approved': {
      runAppendApproved();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined: {
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${arg}". Use "help" to see available commands.`);
      process.exit(1);
    }
  }
}

main();
