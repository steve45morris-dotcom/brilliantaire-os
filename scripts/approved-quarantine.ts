import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  QUARANTINE_ONLY,
  ALLOW_FILE_DELETION,
  ALLOW_PROTECTED_FILE_TOUCH,
  REQUIRE_APPROVAL_LIST,
  REQUIRE_CONFIRM_FLAG,
  REQUIRE_ROLLBACK_MANIFEST,
  REQUIRE_DRY_RUN_FIRST,
  inputFolders,
  outputFolders,
  DO_NOT_TOUCH_PATTERNS,
  REPO_ROOT
} from '../config/approved-quarantine.js';

const NOW = new Date('2026-06-01T12:03:14-07:00');

interface ParsedCandidate {
  candidate: string;
  originalPath: string;
  quarantinePath: string;
  approved: boolean;
  isProtected: boolean;
  reason: string;
  group: string;
  confidence: string;
  proposedAction: string;
}

function ensureDirectories() {
  Object.values(outputFolders).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function getFormattedDate(date: Date = NOW): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFormattedTime(date: Date = NOW): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${hour}${min}${sec}`;
}

function getUniqueOutputPath(dir: string, baseName: string, ext: string, forceTimestamp: boolean = false): string {
  const dateStr = getFormattedDate();
  if (forceTimestamp) {
    const timeStr = getFormattedTime();
    return path.join(dir, `${baseName}_${dateStr}_${timeStr}.${ext}`);
  }
  const standardPath = path.join(dir, `${baseName}_${dateStr}.${ext}`);
  if (fs.existsSync(standardPath)) {
    const timeStr = getFormattedTime();
    return path.join(dir, `${baseName}_${dateStr}_${timeStr}.${ext}`);
  }
  return standardPath;
}

function getLatestFile(dir: string, pattern: RegExp): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const matched = files
    .filter(f => pattern.test(f))
    .map(f => ({ name: f, fullPath: path.join(dir, f), stat: fs.statSync(path.join(dir, f)) }))
    .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
  return matched.length > 0 ? matched[0].fullPath : null;
}

function matchesDoNotTouch(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return DO_NOT_TOUCH_PATTERNS.some(pattern => {
    if (pattern.endsWith('/')) {
      return normalized.includes('/' + pattern) || normalized.startsWith(pattern);
    } else {
      return normalized.endsWith('/' + pattern) || normalized === pattern;
    }
  });
}

function getFileChecksum(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) return 'N/A';
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (err) {
    return 'Error';
  }
}

function writeAuditLog(subcommand: string, outcome: string, filesMoved: number, filesBlocked: number) {
  const logDir = outputFolders.logs;
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `quarantine_execution_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();

  let entry = `## [${timestamp}] Subcommand Executed: "${subcommand}"\n`;
  entry += `- **Execution Mode:** \`Approved Quarantine Executor\`\n`;
  entry += `- **Outcome Status:** \`${outcome}\`\n`;
  entry += `- **Files Moved:** \`${filesMoved}\`\n`;
  entry += `- **Files Blocked:** \`${filesBlocked}\`\n`;
  entry += `\n---\n\n`;

  fs.appendFileSync(logFile, entry);
}

function parseApprovalList(filePath: string): ParsedCandidate[] {
  const results: ParsedCandidate[] = [];
  if (!fs.existsSync(filePath)) return results;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map(c => c.trim());
    if (cols.length < 8) continue;
    if (cols[1].toLowerCase().includes('candidate file')) continue;
    if (cols[1].includes('---')) continue;

    const linkMatch = cols[1].match(/\[([^\]]+)\]\(file:\/\/[^\)]+\)/);
    if (!linkMatch) continue;

    const relativePath = linkMatch[1];
    const approved = cols[6].toLowerCase().includes('[x]');
    const isProtected = matchesDoNotTouch(relativePath);
    
    const originalPath = path.resolve(REPO_ROOT, relativePath);
    const quarantinePath = path.resolve(outputFolders.quarantine, relativePath);

    results.push({
      candidate: relativePath,
      originalPath,
      quarantinePath,
      approved,
      isProtected,
      reason: cols[3] || '',
      group: cols[2] || '',
      confidence: cols[4] || '',
      proposedAction: cols[5] || ''
    });
  }

  return results;
}

// 1. Dry Run subcommand
function handleDryRun(candidates: ParsedCandidate[], dateStr: string) {
  const approved = candidates.filter(c => c.approved && !c.isProtected);
  const blocked = candidates.filter(c => c.approved && c.isProtected);
  const skipped = candidates.filter(c => !c.approved);

  let rows = candidates.map(c => {
    let status = 'Skipped (Unapproved)';
    if (c.approved) {
      if (c.isProtected) {
        status = '⚠️ BLOCKED (Protected Path)';
      } else if (!fs.existsSync(c.originalPath)) {
        status = 'Skipped (File not found)';
      } else {
        status = 'Would Move';
      }
    }
    return `| [${c.candidate}](file://${c.originalPath}) | [quarantine/${c.candidate}](file://${c.quarantinePath}) | ${c.approved && !c.isProtected ? 'Yes' : 'No'} | ${status} |`;
  }).join('\n');

  if (!rows) {
    rows = `| None | N/A | N/A | No files processed |`;
  }

  const status = approved.length > 0 ? 'READY_FOR_EXECUTION' : 'NO_APPROVED_CANDIDATES';
  const nextAction = approved.length > 0 
    ? 'Run execute command with --confirm flag: npm run approved-quarantine -- "execute" --confirm'
    : 'Review approval matrix checklist and mark approved files with [x].';

  const reportContent = `# 🔍 Quarantine Dry Run Simulation Report
**Simulation Date:** ${dateStr}

## 📊 Telemetry Summary
- **Approved Candidates Found:** ${approved.length}
- **Protected Candidates Blocked:** ${blocked.length}
- **Source Files Missing/Skipped:** ${skipped.length}
- **Readiness Status:** ${status}

## 📂 Simulation Matrix
| Source Path | Intended Quarantine Path | Would Move | Status / Blocker |
|---|---|---|---|
${rows}

## 🚀 Next Action
${nextAction}
`;

  const outPath = getUniqueOutputPath(outputFolders.reports, 'quarantine_dry_run', 'md');
  fs.writeFileSync(outPath, reportContent);
  console.log(`✅ Dry-run report generated: [quarantine_dry_run_${dateStr}.md](file://${outPath})`);
  writeAuditLog('dry-run', 'Success', 0, blocked.length);
}

// 2. Execute subcommand
function handleExecute(candidates: ParsedCandidate[], confirm: boolean, dateStr: string) {
  if (!confirm) {
    console.error("❌ Blocked: High-risk execute command requires the explicit --confirm flag.");
    console.log("💡 Guidance: Run command as: npm run approved-quarantine -- \"execute\" --confirm");
    writeAuditLog('execute', 'Blocked: Missing Confirm Flag', 0, 0);
    process.exit(1);
  }

  if (REQUIRE_DRY_RUN_FIRST) {
    const latestDryRun = getLatestFile(outputFolders.reports, /quarantine_dry_run_(\d{4}-\d{2}-\d{2})/);
    if (!latestDryRun) {
      console.error("❌ Blocked: A prior dry-run report is required before live quarantine execution.");
      console.log("💡 Guidance: Run a dry-run first: npm run approved-quarantine -- \"dry-run\"");
      writeAuditLog('execute', 'Blocked: Dry-run Required First', 0, 0);
      process.exit(1);
    }
  }

  const approved = candidates.filter(c => c.approved && !c.isProtected);
  const blocked = candidates.filter(c => c.approved && c.isProtected);
  const skipped = candidates.filter(c => !c.approved);

  let movedCount = 0;
  let skippedCount = 0;

  const templatePath = path.join(outputFolders.templates, 'quarantine-execution-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf8');

  // Perform live move
  const executionRows = candidates.map(c => {
    let status = 'Skipped';
    let action = 'No action';

    if (c.approved) {
      if (c.isProtected) {
        status = 'Blocked';
        action = 'Protected system path. Skip move.';
      } else if (!fs.existsSync(c.originalPath)) {
        status = 'Skipped';
        action = 'Source file not found.';
        skippedCount++;
      } else {
        try {
          fs.mkdirSync(path.dirname(c.quarantinePath), { recursive: true });
          fs.copyFileSync(c.originalPath, c.quarantinePath);
          fs.unlinkSync(c.originalPath);
          status = 'Moved';
          action = 'Relocated to quarantine folder.';
          movedCount++;
        } catch (err) {
          status = 'Failed';
          action = `Error moving file: ${(err as Error).message}`;
        }
      }
    } else {
      skippedCount++;
    }

    return `| [${c.candidate}](file://${c.originalPath}) | [quarantine/${c.candidate}](file://${c.quarantinePath}) | ${status} | ${action} |`;
  }).join('\n');

  const rollbackManifestPath = getUniqueOutputPath(outputFolders.rollback, 'quarantine_rollback_plan', 'md');
  const finalStatus = movedCount > 0 ? 'COMPLETED_SUCCESS' : 'NO_FILES_MOVED';

  const reportContent = template
    .replace('{{REPORT_DATE}}', dateStr)
    .replace('{{FILES_MOVED}}', String(movedCount))
    .replace('{{FILES_BLOCKED}}', String(blocked.length))
    .replace('{{FILES_SKIPPED}}', String(skippedCount))
    .replace('{{CONFIRMATION_RECEIVED}}', 'Yes')
    .replace('{{ROLLBACK_MANIFEST}}', `[quarantine_rollback_plan_${dateStr}.md](file://${rollbackManifestPath})`)
    .replace('{{FINAL_STATUS}}', finalStatus)
    .replace('{{EXECUTION_MATRIX_ROWS}}', executionRows);

  const outPath = getUniqueOutputPath(outputFolders.reports, 'quarantine_execution_report', 'md');
  fs.writeFileSync(outPath, reportContent);

  // Auto-generate manifest & rollback plan as part of execution
  const activeMovedCandidates = candidates.filter(c => c.approved && !c.isProtected && fs.existsSync(c.quarantinePath));
  generateManifestFile(activeMovedCandidates, dateStr);
  generateRollbackFile(activeMovedCandidates, dateStr, rollbackManifestPath);

  console.log(`✅ Live quarantine complete. ${movedCount} files moved.`);
  console.log(`✅ Execution report generated: [quarantine_execution_report_${dateStr}.md](file://${outPath})`);
  writeAuditLog('execute', 'Success', movedCount, blocked.length);
}

// 3. Manifest generator
function generateManifestFile(movedCandidates: ParsedCandidate[], dateStr: string) {
  const templatePath = path.join(outputFolders.templates, 'quarantine-manifest-template.md');
  if (!fs.existsSync(templatePath)) return;
  const template = fs.readFileSync(templatePath, 'utf8');

  const rows = movedCandidates.map(c => {
    const checksum = getFileChecksum(c.quarantinePath);
    const timestamp = NOW.toISOString();
    return `| [quarantine/${c.candidate}](file://${c.quarantinePath}) | [${c.candidate}](file://${c.originalPath}) | [quarantine/${c.candidate}](file://${c.quarantinePath}) | ${c.reason} | ${timestamp} | \`${checksum}\` | Yes |`;
  }).join('\n');

  const manifestContent = template
    .replace('{{GENERATION_DATE}}', dateStr)
    .replace('{{QUARANTINED_COUNT}}', String(movedCandidates.length))
    .replace('{{MANIFEST_MATRIX_ROWS}}', rows || '| None | N/A | N/A | N/A | N/A | N/A | N/A |');

  const outPath = getUniqueOutputPath(outputFolders.manifests, 'quarantine_manifest', 'md');
  fs.writeFileSync(outPath, manifestContent);
  console.log(`✅ Manifest generated: [quarantine_manifest_${dateStr}.md](file://${outPath})`);
}

function handleManifest(candidates: ParsedCandidate[], dateStr: string) {
  // Generate manifest from approved, non-protected files currently in quarantine
  const moved = candidates.filter(c => c.approved && !c.isProtected && fs.existsSync(c.quarantinePath));
  generateManifestFile(moved, dateStr);
  writeAuditLog('manifest', 'Success', 0, 0);
}

// 4. Rollback Plan generator
function generateRollbackFile(movedCandidates: ParsedCandidate[], dateStr: string, specifiedPath?: string) {
  const templatePath = path.join(outputFolders.templates, 'rollback-manifest-template.md');
  if (!fs.existsSync(templatePath)) return;
  const template = fs.readFileSync(templatePath, 'utf8');

  const rows = movedCandidates.map(c => {
    return `| [quarantine/${c.candidate}](file://${c.quarantinePath}) | [${c.candidate}](file://${c.originalPath}) | \`mv "${c.quarantinePath}" "${c.originalPath}"\` | Low | Yes |`;
  }).join('\n');

  const rollbackContent = template
    .replace('{{GENERATION_DATE}}', dateStr)
    .replace('{{ROLLBACK_MATRIX_ROWS}}', rows || '| None | N/A | N/A | N/A | N/A |');

  const outPath = specifiedPath || getUniqueOutputPath(outputFolders.rollback, 'quarantine_rollback_plan', 'md');
  fs.writeFileSync(outPath, rollbackContent);
  if (!specifiedPath) {
    console.log(`✅ Rollback plan generated: [quarantine_rollback_plan_${dateStr}.md](file://${outPath})`);
  }
}

function handleRollbackPlan(candidates: ParsedCandidate[], dateStr: string) {
  const moved = candidates.filter(c => c.approved && !c.isProtected && fs.existsSync(c.quarantinePath));
  generateRollbackFile(moved, dateStr);
  writeAuditLog('rollback-plan', 'Success', 0, 0);
}

// 5. Status dashboard subcommand
function handleStatus(candidates: ParsedCandidate[], dateStr: string) {
  ensureDirectories();

  function getLatestDisplayFile(dir: string, pattern: RegExp): string {
    const filepath = getLatestFile(dir, pattern);
    if (filepath) {
      return `[${path.basename(filepath)}](file://${filepath})`;
    }
    return 'None (Run command first)';
  }

  const latestDryRun = getLatestDisplayFile(outputFolders.reports, /^quarantine_dry_run_/);
  const latestExecReport = getLatestDisplayFile(outputFolders.reports, /^quarantine_execution_report_/);
  const latestManifest = getLatestDisplayFile(outputFolders.manifests, /^quarantine_manifest_/);
  const latestRollback = getLatestDisplayFile(outputFolders.rollback, /^quarantine_rollback_plan_/);

  const moved = candidates.filter(c => c.approved && !c.isProtected && fs.existsSync(c.quarantinePath));
  const blocked = candidates.filter(c => c.approved && c.isProtected);
  const skipped = candidates.filter(c => !c.approved);

  const templatePath = path.join(outputFolders.templates, 'quarantine-status-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf8');

  const nextAction = moved.length > 0 
    ? 'Post-quarantine execution complete. Check status dashboard.'
    : 'Run dry-run simulation first, then execute with --confirm flag.';

  const statusDashboard = template
    .replace('{{SYSTEM_TIME}}', NOW.toISOString())
    .replace('{{LATEST_DRY_RUN}}', latestDryRun)
    .replace('{{LATEST_EXEC_REPORT}}', latestExecReport)
    .replace('{{LATEST_MANIFEST}}', latestManifest)
    .replace('{{LATEST_ROLLBACK}}', latestRollback)
    .replace('{{MOVED_COUNT}}', String(moved.length))
    .replace('{{BLOCKED_COUNT}}', String(blocked.length))
    .replace('{{SKIPPED_COUNT}}', String(skipped.length))
    .replace('{{DELETION_ENABLED}}', ALLOW_FILE_DELETION ? 'Yes' : 'No')
    .replace('{{NEXT_ACTION}}', nextAction);

  console.log("\n=========================================");
  console.log("🛡️ QUARANTINE EXECUTOR STATUS");
  console.log("=========================================");
  console.log(`- Latest Dry Run:          ${latestDryRun}`);
  console.log(`- Latest Execution Report: ${latestExecReport}`);
  console.log(`- Latest Manifest:         ${latestManifest}`);
  console.log(`- Latest Rollback Plan:    ${latestRollback}`);
  console.log(`- Files Moved Count:       ${moved.length}`);
  console.log(`- Files Blocked Count:     ${blocked.length}`);
  console.log(`- Files Skipped Count:     ${skipped.length}`);
  console.log(`- Deletion Enabled:        ${ALLOW_FILE_DELETION ? 'Yes' : 'No'}`);
  console.log(`- Next Recommended Action: ${nextAction}`);
  console.log("=========================================");

  const statusOutPath = path.join(outputFolders.reports, `quarantine_status_dashboard_${dateStr}.md`);
  fs.writeFileSync(statusOutPath, statusDashboard);
  writeAuditLog('status', 'Success', moved.length, blocked.length);
}

async function main() {
  ensureDirectories();
  const args = process.argv.slice(2);
  const command = (args[0] || 'help').toLowerCase();

  const confirm = args.includes('--confirm');
  const dateStr = getFormattedDate();

  const latestApprovalList = getLatestFile(inputFolders.approvalLists, /cleanup_approval_list_(\d{4}-\d{2}-\d{2})/);
  if (!latestApprovalList && REQUIRE_APPROVAL_LIST) {
    console.error("❌ Error: Missing cleanup approval list resources in outputs/cleanup_approval/approval_lists/.");
    console.error("💡 Try running cleanup-approval checklist commands first.");
    writeAuditLog(command, 'Failed: Missing Approval List', 0, 0);
    process.exit(1);
  }

  const candidates = parseApprovalList(latestApprovalList!);

  switch (command) {
    case 'dry-run':
      handleDryRun(candidates, dateStr);
      break;
    case 'execute':
      handleExecute(candidates, confirm, dateStr);
      break;
    case 'manifest':
      handleManifest(candidates, dateStr);
      break;
    case 'rollback-plan':
      handleRollbackPlan(candidates, dateStr);
      break;
    case 'status':
      handleStatus(candidates, dateStr);
      break;
    case 'help':
    default:
      console.log(`💡 Note: Try 'npm run approved-quarantine-help' for documentation.\n`);
      handleStatus(candidates, dateStr);
      break;
  }
}

main().catch(err => {
  console.error("❌ Execution error in Approved Quarantine Executor:", err);
  process.exit(1);
});
