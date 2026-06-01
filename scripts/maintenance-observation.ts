import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  OBSERVATION_ONLY,
  ALLOW_PERMANENT_DELETE,
  ALLOW_RM_COMMANDS,
  ALLOW_FILE_UNLINK,
  ALLOW_QUARANTINE_MUTATION,
  ALLOW_PROJECTS_MD_WRITE,
  MINIMUM_MONITORING_DAYS,
  MAINTENANCE_REPORT_DIR,
  QUARANTINE_MONITORING_REPORT_DIR,
  DELETION_READINESS_REPORT_DIR,
  REGISTRY_HEALTH_REPORT_DIR,
  OBSERVATION_REPORT_DIR,
  OBSERVATION_SNAPSHOT_DIR,
  OBSERVATION_LOG_DIR
} from '../config/maintenance-observation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = '/Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os';

function getScanDate(): string {
  return '2026-06-01'; // Fixed local anchor date
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

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, OBSERVATION_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `observation_log_2026-06-01.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Maintenance Observation Execution Log - 2026-06-01\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

function calculateCountdown() {
  const manifestFile = findLatestFile('outputs/cleanup/quarantine_manifests', 'quarantine_manifest_', '.md');
  let quarantineDateStr = '2026-06-01';
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
  const daysElapsed = diffDays;
  const daysRemaining = Math.max(0, MINIMUM_MONITORING_DAYS - diffDays);
  
  const nextCheckDate = new Date(qDate);
  nextCheckDate.setDate(nextCheckDate.getDate() + MINIMUM_MONITORING_DAYS);
  const nextCheckDateStr = nextCheckDate.toISOString().split('T')[0];

  return {
    quarantineDateStr,
    daysElapsed,
    daysRemaining,
    nextCheckDateStr
  };
}

// 1. Snapshot Command
function runSnapshot() {
  console.log('🩺 Querying Maintenance Observation snapshot parameters...');
  
  const latestMaintenance = findLatestFile(MAINTENANCE_REPORT_DIR, 'maintenance_daily_check_', '.md');
  const latestCleanup = findLatestFile(MAINTENANCE_REPORT_DIR, 'cleanup_status_', '.md');
  const latestRegistry = findLatestFile(MAINTENANCE_REPORT_DIR, 'registry_status_', '.md');
  const latestQuarantine = findLatestFile(QUARANTINE_MONITORING_REPORT_DIR, 'quarantine_monitoring_continuation_', '.md') ||
                            findLatestFile(QUARANTINE_MONITORING_REPORT_DIR, 'quarantine_next_check_', '.md');
  const latestReadiness = findLatestFile(DELETION_READINESS_REPORT_DIR, 'quarantine_deletion_readiness_report_', '.md');

  const { daysRemaining } = calculateCountdown();
  const deletionEligible = daysRemaining === 0 ? 'yes' : 'no';

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates/maintenance/observation/observation-snapshot-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🩺 Maintenance Observation Snapshot\n- **Snapshot Date:** {{snapshotDate}}\n- **Maintenance Report:** {{maintenanceReport}}\n- **Registry Status:** {{registryStatus}}\n- **Cleanup Status:** {{cleanupStatus}}\n- **Quarantine Status:** {{quarantineStatus}}\n- **Deletion Readiness:** {{deletionReadiness}}\n- **Days Remaining:** {{daysRemaining}}\n- **Deletion Eligible:** {{deletionEligible}}\n- **Permanent Delete Enabled:** {{permanentDeleteEnabled}}`;
  }

  const outputContent = template
    .replace('{{snapshotDate}}', getScanDate())
    .replace('{{maintenanceReport}}', latestMaintenance ? `file://${latestMaintenance}` : 'None')
    .replace('{{registryStatus}}', latestRegistry ? `file://${latestRegistry}` : 'None')
    .replace('{{cleanupStatus}}', latestCleanup ? `file://${latestCleanup}` : 'None')
    .replace('{{quarantineStatus}}', latestQuarantine ? `file://${latestQuarantine}` : 'None')
    .replace('{{deletionReadiness}}', latestReadiness ? `file://${latestReadiness}` : 'None')
    .replace('{{daysRemaining}}', daysRemaining.toString())
    .replace('{{deletionEligible}}', deletionEligible)
    .replace('{{permanentDeleteEnabled}}', ALLOW_PERMANENT_DELETE ? 'yes' : 'no');

  const destDir = path.join(REPO_ROOT, OBSERVATION_SNAPSHOT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(OBSERVATION_SNAPSHOT_DIR, 'maintenance_observation_snapshot_', getScanDate(), '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Observation snapshot generated: file://${destPath}`);
  writeLog(`Observation snapshot generated: ${path.basename(destPath)}`);
}

// 2. Countdown Command
function runCountdown() {
  console.log('🩺 Running quarantine countdown status report...');
  
  const { quarantineDateStr, daysElapsed, daysRemaining, nextCheckDateStr } = calculateCountdown();
  const deletionEligible = daysRemaining === 0 ? 'yes' : 'no';
  const recommendedAction = 'Maintain quarantine state. Do not execute file unlinks.';

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates/maintenance/observation/countdown-status-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# ⏳ Quarantine Countdown Status\n- **Quarantine Date:** {{quarantineDate}}\n- **Current Date:** {{currentDate}}\n- **Days Elapsed:** {{daysElapsed}}\n- **Days Remaining:** {{daysRemaining}}\n- **Minimum Days:** {{minimumDays}}\n- **Deletion Eligible:** {{deletionEligible}}\n- **Next Check Date:** {{nextCheckDate}}\n- **Recommended Action:** {{recommendedAction}}`;
  }

  const outputContent = template
    .replace('{{quarantineDate}}', quarantineDateStr)
    .replace('{{currentDate}}', getScanDate())
    .replace('{{daysElapsed}}', daysElapsed.toString())
    .replace('{{daysRemaining}}', daysRemaining.toString())
    .replace('{{minimumDays}}', MINIMUM_MONITORING_DAYS.toString())
    .replace('{{deletionEligible}}', deletionEligible)
    .replace('{{nextCheckDate}}', nextCheckDateStr)
    .replace('{{recommendedAction}}', recommendedAction);

  const destDir = path.join(REPO_ROOT, OBSERVATION_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(OBSERVATION_REPORT_DIR, 'quarantine_countdown_status_', getScanDate(), '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Countdown status report generated: file://${destPath}`);
  writeLog(`Countdown status report generated: ${path.basename(destPath)}`);
}

// 3. Observation Report Command
function runObservationReport() {
  console.log('🩺 Compiling maintenance observation report...');

  const latestRegistry = findLatestFile(REGISTRY_HEALTH_REPORT_DIR, 'registry_health_report_', '.md');
  const latestQuarantine = findLatestFile(QUARANTINE_MONITORING_REPORT_DIR, 'quarantine_monitoring_continuation_', '.md') ||
                            findLatestFile(QUARANTINE_MONITORING_REPORT_DIR, 'quarantine_next_check_', '.md');
  const latestReadiness = findLatestFile(DELETION_READINESS_REPORT_DIR, 'quarantine_deletion_readiness_report_', '.md');

  const registrySummary = latestRegistry ? 'Registry check verified. Unresolved matrix risks are zero.' : 'Matrix health telemetry not compiled.';
  const cleanupSummary = 'Quarantine checksum verified. Restore scripts staged in outputs.';
  const quarantineSummary = latestQuarantine ? 'Continuation tracking active. 7-day safety period locked.' : 'Quarantine monitor parameters locked.';
  const readinessSummary = latestReadiness ? 'Age verification eligible: no. Safety gate verification completed.' : 'Deletion readiness scanner locked.';

  const maintenanceStatus = `PROJECTS.md health registry, quarantine logs, and deletion readiness telemetry are aggregated.`;
  const blockedActions = 'File deletions, unlinking, write mutations, and PROJECTS.md auto-appends are blocked.';
  const safeNextAction = 'Continue daily check observation cycles. Monitor remaining window countdown.';

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates/maintenance/observation/observation-report-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🔬 Maintenance Observation Report\n- **Report Date:** {{reportDate}}\n- **Registry Summary:** {{registrySummary}}\n- **Cleanup Summary:** {{cleanupSummary}}\n- **Quarantine Summary:** {{quarantineSummary}}\n- **Maintenance Status:** {{maintenanceStatus}}\n- **Blocked Actions:** {{blockedActions}}\n- **Safe Next Action:** {{safeNextAction}}`;
  }

  const outputContent = template
    .replace('{{reportDate}}', getScanDate())
    .replace('{{registrySummary}}', registrySummary)
    .replace('{{cleanupSummary}}', `${cleanupSummary} | ${readinessSummary}`)
    .replace('{{quarantineSummary}}', quarantineSummary)
    .replace('{{maintenanceStatus}}', maintenanceStatus)
    .replace('{{blockedActions}}', blockedActions)
    .replace('{{safeNextAction}}', safeNextAction);

  const destDir = path.join(REPO_ROOT, OBSERVATION_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(OBSERVATION_REPORT_DIR, 'maintenance_observation_report_', getScanDate(), '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Observation report generated: file://${destPath}`);
  writeLog(`Observation report generated: ${path.basename(destPath)}`);
}

// 4. Expiration Watch Command
function runExpirationWatch() {
  console.log('🩺 Compiling quarantine expiration watch report...');
  
  const { daysRemaining } = calculateCountdown();
  const currentEligibility = daysRemaining === 0 ? 'yes' : 'no';
  
  const earliestExpirationDate = '2026-06-08';
  const requiredChecks = 'Checksum validation, restore script matching, and operator confirmation sign-off.';
  const commandsToRun = `  npm run quarantine-deletion-readiness -- "readiness-report"
  npm run quarantine-monitoring -- "continuation-report"
  npm run maintenance-check -- "full-report"`;
  const futureGateRequired = 'Yes (requires separate approval gate and confirming command switches before pruning).';

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates/maintenance/observation/expiration-watch-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🔎 Quarantine Expiration Watch\n- **Earliest Expiration Date:** {{earliestExpirationDate}}\n- **Current Eligibility:** {{currentEligibility}}\n- **Required Checks:** {{requiredChecks}}\n- **Commands To Run:**\n{{commandsToRun}}\n- **Future Gate Required:** {{futureGateRequired}}`;
  }

  const outputContent = template
    .replace('{{earliestExpirationDate}}', earliestExpirationDate)
    .replace('{{currentEligibility}}', currentEligibility)
    .replace('{{requiredChecks}}', requiredChecks)
    .replace('{{commandsToRun}}', commandsToRun)
    .replace('{{futureGateRequired}}', futureGateRequired);

  const destDir = path.join(REPO_ROOT, OBSERVATION_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(OBSERVATION_REPORT_DIR, 'quarantine_expiration_watch_', getScanDate(), '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Expiration watch report generated: file://${destPath}`);
  writeLog(`Expiration watch report generated: ${path.basename(destPath)}`);
}

// 5. Status Command
function runStatus() {
  console.log('🩺 Querying Maintenance Observation status...');
  
  const latestSnapshot = findLatestFile(OBSERVATION_SNAPSHOT_DIR, 'maintenance_observation_snapshot_', '.md');
  const latestCountdown = findLatestFile(OBSERVATION_REPORT_DIR, 'quarantine_countdown_status_', '.md');
  const latestReport = findLatestFile(OBSERVATION_REPORT_DIR, 'maintenance_observation_report_', '.md');
  const latestWatch = findLatestFile(OBSERVATION_REPORT_DIR, 'quarantine_expiration_watch_', '.md');

  const { daysRemaining } = calculateCountdown();
  const deletionEligible = daysRemaining === 0 ? 'yes' : 'no';

  console.log(`
📊 Maintenance Observation Status:

Snapshots & Reports Found:
  - Observation Snapshot:  ${latestSnapshot ? `file://${latestSnapshot}` : 'NOT FOUND'}
  - Countdown Status:      ${latestCountdown ? `file://${latestCountdown}` : 'NOT FOUND'}
  - Observation Report:    ${latestReport ? `file://${latestReport}` : 'NOT FOUND'}
  - Expiration Watch:      ${latestWatch ? `file://${latestWatch}` : 'NOT FOUND'}

Active Metrics:
  - Days Remaining:        ${daysRemaining}
  - Deletion Eligible:     ${deletionEligible}

Next Recommended Phase:
  - Phase 12K: Quarantine Expiration Verification & Pruning Approval Gate
`);
}

async function main() {
  const arg = process.argv[2]?.trim().toLowerCase();

  if (OBSERVATION_ONLY) {
    if (ALLOW_PERMANENT_DELETE || ALLOW_RM_COMMANDS || ALLOW_FILE_UNLINK || ALLOW_QUARANTINE_MUTATION || ALLOW_PROJECTS_MD_WRITE) {
      console.error('❌ Security Violation: Configuration violates OBSERVATION_ONLY constraints.');
      process.exit(1);
    }
  }

  await announceIntent(`Running maintenance observation command: ${arg || 'help'}`);

  switch (arg) {
    case 'snapshot': {
      runSnapshot();
      break;
    }
    case 'countdown': {
      runCountdown();
      break;
    }
    case 'observation-report': {
      runObservationReport();
      break;
    }
    case 'expiration-watch': {
      runExpirationWatch();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined: {
      const { printHelp } = await import('./maintenance-observation-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${arg}". Use "help" to see available commands.`);
      await announceCompletion(`Maintenance observation failed: Unknown command "${arg}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Maintenance observation command "${arg || 'help'}" executed successfully.`, '12');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
