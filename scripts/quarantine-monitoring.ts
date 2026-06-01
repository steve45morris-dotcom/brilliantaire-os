import fs from 'fs';
import path from 'path';
import {
  MONITORING_ONLY,
  ALLOW_PERMANENT_DELETE,
  ALLOW_RM_COMMANDS,
  ALLOW_FILE_UNLINK,
  ALLOW_QUARANTINE_MUTATION,
  REQUIRE_MINIMUM_MONITORING_DAYS,
  MINIMUM_MONITORING_DAYS,
  QUARANTINE_DIR,
  QUARANTINE_MANIFEST_DIR,
  CHECKSUM_DIR,
  RESTORE_SCRIPT_DIR,
  READINESS_REPORT_DIR,
  MONITORING_REPORT_DIR,
  MONITORING_LOG_DIR,
  SNAPSHOT_DIR
} from '../config/quarantine-monitoring.js';
import { printHelp } from './quarantine-monitoring-help.js';
import { announceIntent, announceCompletion } from './vnp.js';

const REPO_ROOT = '/Users/alexanderanthony';

function getScanDate(): string {
  return '2026-06-01';
}

function getOutputPath(dir: string, prefix: string, dateStr: string, ext: string): string {
  const destDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  const baseFile = path.join(destDir, `${prefix}${dateStr}${ext}`);
  if (!fs.existsSync(baseFile)) {
    return baseFile;
  }
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return path.join(destDir, `${prefix}${dateStr}_${hours}${minutes}${seconds}${ext}`);
}

function findLatestFile(dir: string, prefix: string, suffix: string): string | null {
  const fullDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullDir)) return null;
  try {
    const files = fs.readdirSync(fullDir);
    const matched = files.filter(f => f.startsWith(prefix) && f.endsWith(suffix)).sort();
    if (matched.length > 0) {
      return path.join(fullDir, matched[matched.length - 1]);
    }
  } catch {}
  return null;
}

function getQuarantinedFiles(): string[] {
  const qDir = path.join(REPO_ROOT, QUARANTINE_DIR);
  if (!fs.existsSync(qDir)) return [];
  try {
    return fs.readdirSync(qDir).filter(f => !f.startsWith('.'));
  } catch {
    return [];
  }
}

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, MONITORING_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  // We use standard date check to find/write log
  const logPath = path.join(logDir, `quarantine_monitoring_log_2026-06-01.md`);
  const timestamp = new Date().toISOString();
  const logEntry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, logEntry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Quarantine Monitoring Execution Log - 2026-06-01\n\n| Timestamp | Event |\n|---|---|\n${logEntry}`, 'utf-8');
  }
}

// 1. Snapshot command
function runSnapshot() {
  console.log('🩺 Capturing quarantine monitoring snapshot...');
  const files = getQuarantinedFiles();
  const manifestFile = findLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_manifest_', '.md') ||
                       findLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_dry_run_', '.md');
  const checksumFile = findLatestFile(CHECKSUM_DIR, 'quarantine_checksum_verification_', '.md') ||
                       findLatestFile(CHECKSUM_DIR, 'quarantine_checksums_', '.md') ||
                       findLatestFile('outputs/cleanup/reports', 'quarantine_checksum_', '.md');
  const restoreFile = findLatestFile(RESTORE_SCRIPT_DIR, 'restore_quarantined_files_', '.sh') ||
                      findLatestFile(RESTORE_SCRIPT_DIR, 'restore_duplicate_briefs_', '.sh');
  const readinessFile = findLatestFile(READINESS_REPORT_DIR, 'quarantine_deletion_readiness_report_', '.md');

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine_monitoring', 'monitoring-snapshot-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🩺 Quarantine Monitoring Snapshot Profile\n- **Snapshot Date:** {{snapshotDate}}\n- **Quarantined Files Count:** {{quarantinedFilesCount}}\n- **Manifest Path:** {{manifestPath}}\n- **Checksum Report Path:** {{checksumReportPath}}\n- **Restore Script Path:** {{restoreScriptPath}}\n- **Readiness Report Path:** {{readinessReportPath}}\n- **Deletion Eligible:** {{deletionEligible}}\n- **Permanent Delete Enabled:** {{permanentDeleteEnabled}}\n- **Monitoring Status:** {{monitoringStatus}}`;
  }

  const reportDate = getScanDate();
  const fileContent = template
    .replace('{{snapshotDate}}', reportDate)
    .replace('{{quarantinedFilesCount}}', files.length.toString())
    .replace('{{manifestPath}}', manifestFile ? path.relative(REPO_ROOT, manifestFile) : 'None')
    .replace('{{checksumReportPath}}', checksumFile ? path.relative(REPO_ROOT, checksumFile) : 'None')
    .replace('{{restoreScriptPath}}', restoreFile ? path.relative(REPO_ROOT, restoreFile) : 'None')
    .replace('{{readinessReportPath}}', readinessFile ? path.relative(REPO_ROOT, readinessFile) : 'None')
    .replace('{{deletionEligible}}', 'no')
    .replace('{{permanentDeleteEnabled}}', ALLOW_PERMANENT_DELETE ? 'yes' : 'no')
    .replace('{{monitoringStatus}}', 'ACTIVE');

  const destDir = path.join(REPO_ROOT, SNAPSHOT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(SNAPSHOT_DIR, 'quarantine_monitoring_snapshot_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Monitoring snapshot generated: file://${destPath}`);
  writeLog(`Snapshot generated: ${path.basename(destPath)}`);
}

// 2. Continuation-report command
function runContinuationReport() {
  console.log('🩺 Compiling monitoring continuation report...');
  const manifestFile = findLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_manifest_', '.md');
  let quarantineDateStr = '2026-06-01'; // Default baseline
  if (manifestFile) {
    try {
      const content = fs.readFileSync(manifestFile, 'utf-8');
      const match = content.match(/Quarantine Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
      if (match) {
        quarantineDateStr = match[1];
      }
    } catch {}
  }

  const qDate = new Date(quarantineDateStr);
  const curDate = new Date('2026-06-01');
  const diffTime = Math.abs(curDate.getTime() - qDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, MINIMUM_MONITORING_DAYS - diffDays);

  const nextCheckDate = new Date(qDate);
  nextCheckDate.setDate(nextCheckDate.getDate() + MINIMUM_MONITORING_DAYS);
  const nextCheckDateStr = nextCheckDate.toISOString().split('T')[0];

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine_monitoring', 'monitoring-continuation-report-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📅 Quarantine Monitoring Continuation Report\n- **Quarantine Date:** {{quarantineDate}}\n- **Current Date:** {{currentDate}}\n- **Days Elapsed:** {{daysElapsed}}\n- **Minimum Days:** {{minimumDays}}\n- **Days Remaining:** {{daysRemaining}}\n- **Readiness Status:** {{readinessStatus}}\n- **Block Reason:** {{blockReason}}\n- **Next Check Date:** {{nextCheckDate}}`;
  }

  const reportDate = getScanDate();
  const fileContent = template
    .replace('{{quarantineDate}}', quarantineDateStr)
    .replace('{{currentDate}}', reportDate)
    .replace('{{daysElapsed}}', diffDays.toString())
    .replace('{{minimumDays}}', MINIMUM_MONITORING_DAYS.toString())
    .replace('{{daysRemaining}}', daysRemaining.toString())
    .replace('{{readinessStatus}}', 'monitor longer')
    .replace('{{blockReason}}', 'Quarantined files must remain in monitoring for a minimum of 7 days. Permanent deletion is disabled.')
    .replace('{{nextCheckDate}}', nextCheckDateStr);

  const destDir = path.join(REPO_ROOT, MONITORING_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(MONITORING_REPORT_DIR, 'quarantine_monitoring_continuation_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Monitoring continuation report generated: file://${destPath}`);
  writeLog(`Continuation report generated: ${path.basename(destPath)}`);
  return { diffDays, daysRemaining };
}

// 3. Pruning-block command
function runPruningBlock() {
  console.log('🩺 Building pruning operation safety block record...');
  const manifestFile = findLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_manifest_', '.md');
  let quarantineDateStr = '2026-06-01'; // Default baseline
  if (manifestFile) {
    try {
      const content = fs.readFileSync(manifestFile, 'utf-8');
      const match = content.match(/Quarantine Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
      if (match) {
        quarantineDateStr = match[1];
      }
    } catch {}
  }
  const qDate = new Date(quarantineDateStr);
  const curDate = new Date('2026-06-01');
  const diffTime = Math.abs(curDate.getTime() - qDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const ageEligible = diffDays >= MINIMUM_MONITORING_DAYS;

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine_monitoring', 'pruning-block-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# ❌ Quarantine Pruning Operation Blocked Record\n- **Deletion Eligible:** {{deletionEligible}}\n- **Age Eligible:** {{ageEligible}}\n- **Permanent Delete Enabled:** {{permanentDeleteEnabled}}\n- **Blocked Operations:** {{blockedOperations}}\n- **Safety Reason:** {{safetyReason}}\n- **Required Future Conditions:** {{requiredFutureConditions}}`;
  }

  const reportDate = getScanDate();
  const fileContent = template
    .replace('{{deletionEligible}}', 'no')
    .replace('{{ageEligible}}', ageEligible ? 'yes' : 'no')
    .replace('{{permanentDeleteEnabled}}', ALLOW_PERMANENT_DELETE ? 'yes' : 'no')
    .replace('{{blockedOperations}}', 'File unlinking, permanent deletion, quarantine mutation, and rm commands.')
    .replace('{{safetyReason}}', 'The system is locked under strict MONITORING_ONLY constraints. Files cannot be pruned until the monitoring window expires and manual human approval is staged.')
    .replace('{{requiredFutureConditions}}', 'Monitoring age must be >= 7 days, a separate future pruning phase must be defined, and ALLOW_PERMANENT_DELETE must be enabled by manual configuration change.');

  const destDir = path.join(REPO_ROOT, MONITORING_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(MONITORING_REPORT_DIR, 'quarantine_pruning_block_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Pruning block record generated: file://${destPath}`);
  writeLog(`Pruning block record generated: ${path.basename(destPath)}`);
}

// 4. Next-check command
function runNextCheck() {
  console.log('🩺 Building next check manual running guide...');
  const manifestFile = findLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_manifest_', '.md');
  let quarantineDateStr = '2026-06-01'; // Default baseline
  if (manifestFile) {
    try {
      const content = fs.readFileSync(manifestFile, 'utf-8');
      const match = content.match(/Quarantine Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
      if (match) {
        quarantineDateStr = match[1];
      }
    } catch {}
  }
  const qDate = new Date(quarantineDateStr);
  const nextCheckDate = new Date(qDate);
  nextCheckDate.setDate(nextCheckDate.getDate() + MINIMUM_MONITORING_DAYS);
  const nextCheckDateStr = nextCheckDate.toISOString().split('T')[0];

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine_monitoring', 'next-check-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🗓️ Quarantine Monitoring Next Check Instructions\n- **Next Check Date:** {{nextCheckDate}}\n- **Readiness Command:** \`{{readinessCommand}}\`\n- **Monitoring Command:** \`{{monitoringCommand}}\`\n- **Expected Progress Condition:** {{expectedProgressCondition}}\n- **Notes:** {{notes}}`;
  }

  const reportDate = getScanDate();
  const fileContent = template
    .replace('{{nextCheckDate}}', nextCheckDateStr)
    .replace('{{readinessCommand}}', 'npm run quarantine-deletion-readiness -- "readiness-report"')
    .replace('{{monitoringCommand}}', 'npm run quarantine-monitoring -- "continuation-report"')
    .replace('{{expectedProgressCondition}}', 'Monitoring age reaches 7 days or more, allowing the staging gate to pass the monitoring age check.')
    .replace('{{notes}}', 'Ensure that the restore script and checksum reports are not altered during the monitoring period.');

  const destDir = path.join(REPO_ROOT, MONITORING_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(MONITORING_REPORT_DIR, 'quarantine_next_check_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Next check guide generated: file://${destPath}`);
  writeLog(`Next check guide generated: ${path.basename(destPath)}`);
}

// 5. Status command
function runStatus() {
  console.log('🩺 Querying Quarantine Monitoring status dashboard...');
  const snapshotPath = findLatestFile(SNAPSHOT_DIR, 'quarantine_monitoring_snapshot_', '.md');
  const continuationPath = findLatestFile(MONITORING_REPORT_DIR, 'quarantine_monitoring_continuation_', '.md');
  const blockPath = findLatestFile(MONITORING_REPORT_DIR, 'quarantine_pruning_block_', '.md');
  const nextCheckPath = findLatestFile(MONITORING_REPORT_DIR, 'quarantine_next_check_', '.md');

  const files = getQuarantinedFiles();
  const { daysRemaining } = runContinuationReport();

  console.log(`
📊 Quarantine Monitoring Staging Dashboard:

Staged Reports & Snapshots:
  - Monitoring Snapshot:    ${snapshotPath ? `file://${snapshotPath} (FOUND)` : 'NOT FOUND'}
  - Continuation Report:     ${continuationPath ? `file://${continuationPath} (FOUND)` : 'NOT FOUND'}
  - Pruning Safety Block:    ${blockPath ? `file://${blockPath} (FOUND)` : 'NOT FOUND'}
  - Next Check Run Guide:    ${nextCheckPath ? `file://${nextCheckPath} (FOUND)` : 'NOT FOUND'}

Active Metrics:
  - Quarantined Files Count:  ${files.length}
  - Elapsed Age Days:         ${MINIMUM_MONITORING_DAYS - daysRemaining}
  - Days Remaining:           ${daysRemaining}
  - Deletion Eligible:        no (locked under MONITORING_ONLY constraints)

Next Action Recommendation:
  - Keep duplicates quarantined. Do not run pruning or deletion tasks.
`);
}

async function main() {
  const arg = process.argv[2]?.trim().toLowerCase();

  if (MONITORING_ONLY) {
    if (ALLOW_PERMANENT_DELETE || ALLOW_RM_COMMANDS || ALLOW_FILE_UNLINK || ALLOW_QUARANTINE_MUTATION) {
      console.error('❌ Security Violation: Configuration violates MONITORING_ONLY constraints.');
      process.exit(1);
    }
  }

  await announceIntent(`Running quarantine monitoring gate command: ${arg || 'help'}`);

  switch (arg) {
    case 'snapshot': {
      runSnapshot();
      break;
    }
    case 'continuation-report': {
      runContinuationReport();
      break;
    }
    case 'pruning-block': {
      runPruningBlock();
      break;
    }
    case 'next-check': {
      runNextCheck();
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

  await announceCompletion(`Quarantine monitoring command "${arg || 'help'}" executed successfully.`, '12');
}

main();
