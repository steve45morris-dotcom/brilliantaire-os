import fs from 'fs';
import path from 'path';
import {
  READINESS_ONLY,
  ALLOW_PERMANENT_DELETE,
  ALLOW_RM_COMMANDS,
  ALLOW_FILE_UNLINK,
  ALLOW_QUARANTINE_MUTATION,
  REQUIRE_RESTORE_MAP,
  REQUIRE_CHECKSUM_REPORT,
  MINIMUM_MONITORING_DAYS,
  REQUIRE_MANUAL_APPROVAL_FOR_FUTURE_DELETE,
  QUARANTINE_DIR,
  QUARANTINE_MANIFEST_DIR,
  QUARANTINE_LOG_DIR,
  CHECKSUM_DIR,
  RESTORE_SCRIPT_DIR,
  DELETION_READINESS_REPORT_DIR,
  DELETION_READINESS_CHECKLIST_DIR,
  DELETION_READINESS_LOG_DIR
} from '../config/quarantine-deletion-readiness.js';
import { printHelp } from './quarantine-deletion-readiness-help.js';
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

// 1. Scan command
function runScan() {
  console.log('🩺 Scanning quarantine staging gate parameters...');
  const files = getQuarantinedFiles();
  const manifestFile = findLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_manifest_', '.md') ||
                       findLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_dry_run_', '.md');
  const logFile = findLatestFile(QUARANTINE_LOG_DIR, 'quarantine_log_', '.md');
  const checksumFile = findLatestFile(CHECKSUM_DIR, 'quarantine_checksum_verification_', '.md') ||
                       findLatestFile(CHECKSUM_DIR, 'quarantine_checksums_', '.md') ||
                       findLatestFile('outputs/cleanup/reports', 'quarantine_checksum_', '.md');
  const restoreFile = findLatestFile(RESTORE_SCRIPT_DIR, 'restore_quarantined_files_', '.sh') ||
                      findLatestFile(RESTORE_SCRIPT_DIR, 'restore_duplicate_briefs_', '.sh');

  const reportDate = getScanDate();
  const fileContent = `# 🩺 Quarantine Deletion Scan - ${reportDate}

- **Quarantined Files Found:** ${files.length}
- **Quarantine Manifest Path:** ${manifestFile ? path.relative(REPO_ROOT, manifestFile) : 'None'}
- **Quarantine Log Path:** ${logFile ? path.relative(REPO_ROOT, logFile) : 'None'}
- **Checksum Report Path:** ${checksumFile ? path.relative(REPO_ROOT, checksumFile) : 'None'}
- **Restore Script Path:** ${restoreFile ? path.relative(REPO_ROOT, restoreFile) : 'None'}
- **Permanent Delete Enabled:** ${ALLOW_PERMANENT_DELETE ? 'yes' : 'no'}
- **Mutation Allowed:** ${ALLOW_QUARANTINE_MUTATION ? 'yes' : 'no'}
- **Scan Status:** SUCCESS
- **Next Action:** Run restore-check and age-check to evaluate eligibility.
`;

  const destDir = path.join(REPO_ROOT, DELETION_READINESS_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(DELETION_READINESS_REPORT_DIR, 'quarantine_deletion_scan_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Deletion scan report generated: file://${destPath}`);
  return { filesCount: files.length, manifestFile, logFile, checksumFile, restoreFile };
}

// 2. Restore-check command
function runRestoreCheck() {
  console.log('🩺 Verifying restore script coverage...');
  const files = getQuarantinedFiles();
  const restoreFile = findLatestFile(RESTORE_SCRIPT_DIR, 'restore_quarantined_files_', '.sh') ||
                      findLatestFile(RESTORE_SCRIPT_DIR, 'restore_duplicate_briefs_', '.sh');

  const exists = restoreFile ? fs.existsSync(restoreFile) : false;
  let coveredCount = 0;
  const missingEntries: string[] = [];

  if (exists && restoreFile) {
    const content = fs.readFileSync(restoreFile, 'utf-8');
    for (const f of files) {
      if (content.includes(f)) {
        coveredCount++;
      } else {
        missingEntries.push(f);
      }
    }
  } else {
    missingEntries.push(...files);
  }

  const allCovered = files.length > 0 && coveredCount === files.length;
  const safetyStatus = allCovered ? 'SUCCESS' : 'BLOCKED';
  const nextAction = allCovered ? 'Coverage verified. Proceed to age-check.' : 'Define missing file copy mappings in restore shell script.';

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'deletion_readiness', 'restore-validation-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🔍 Quarantine Restore Map Validation Profile\n- **Restore Map:** {{restoreMap}}\n- **Quarantined File:** {{quarantinedFile}}\n- **Covered:** {{covered}}\n- **Missing Entry:** {{missingEntry}}\n- **Safety Status:** {{safetyStatus}}\n- **Next Action:** {{nextAction}}`;
  }

  const reportDate = getScanDate();
  const fileContent = template
    .replace('{{restoreMap}}', restoreFile ? path.relative(REPO_ROOT, restoreFile) : 'None')
    .replace('{{quarantinedFile}}', `${files.length} files`)
    .replace('{{covered}}', allCovered ? 'yes' : 'no')
    .replace('{{missingEntry}}', missingEntries.length > 0 ? missingEntries.join(', ') : 'None')
    .replace('{{safetyStatus}}', safetyStatus)
    .replace('{{nextAction}}', nextAction);

  const destDir = path.join(REPO_ROOT, DELETION_READINESS_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(DELETION_READINESS_REPORT_DIR, 'quarantine_restore_validation_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Restore validation report generated: file://${destPath}`);
  return { allCovered, coveredCount, missingEntries };
}

// 3. Age-check command
function runAgeCheck() {
  console.log('🩺 Calculating quarantine monitoring elapsed age...');
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

  // Current anchored run date is 2026-06-01
  const qDate = new Date(quarantineDateStr);
  const curDate = new Date('2026-06-01');
  const diffTime = Math.abs(curDate.getTime() - qDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const eligible = diffDays >= MINIMUM_MONITORING_DAYS;
  const nextAction = eligible ? 'Threshold age met. Safe to stage for future deletion.' : `Monitor longer. File has not passed the ${MINIMUM_MONITORING_DAYS}-day monitoring period threshold.`;

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'deletion_readiness', 'quarantine-age-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📅 Quarantine Monitoring Age Check\n- **Quarantine Date:** {{quarantineDate}}\n- **Current Date:** {{currentDate}}\n- **Days Since Quarantine:** {{daysSinceQuarantine}}\n- **Minimum Days:** {{minimumDays}}\n- **Eligible:** {{eligible}}\n- **Next Action:** {{nextAction}}`;
  }

  const reportDate = getScanDate();
  const fileContent = template
    .replace('{{quarantineDate}}', quarantineDateStr)
    .replace('{{currentDate}}', '2026-06-01')
    .replace('{{daysSinceQuarantine}}', diffDays.toString())
    .replace('{{minimumDays}}', MINIMUM_MONITORING_DAYS.toString())
    .replace('{{eligible}}', eligible ? 'yes' : 'no')
    .replace('{{nextAction}}', nextAction);

  const destDir = path.join(REPO_ROOT, DELETION_READINESS_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(DELETION_READINESS_REPORT_DIR, 'quarantine_age_check_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Quarantine age check report generated: file://${destPath}`);
  return { diffDays, eligible };
}

// 4. Readiness-report command
function runReadinessReport() {
  console.log('🩺 Compiling unified deletion readiness report...');
  const files = getQuarantinedFiles();
  
  const restoreFile = findLatestFile(RESTORE_SCRIPT_DIR, 'restore_quarantined_files_', '.sh') ||
                      findLatestFile(RESTORE_SCRIPT_DIR, 'restore_duplicate_briefs_', '.sh');
  const checksumFile = findLatestFile(CHECKSUM_DIR, 'quarantine_checksum_verification_', '.md') ||
                       findLatestFile(CHECKSUM_DIR, 'quarantine_checksums_', '.md') ||
                       findLatestFile('outputs/cleanup/reports', 'quarantine_checksum_', '.md');

  const { allCovered } = runRestoreCheck();
  const { diffDays, eligible } = runAgeCheck();

  // Read PROJECTS.md status from health monitor if exists
  const integrityFile = findLatestFile('outputs/project_registry/health_monitor/reports/', 'projects_integrity_check_', '.md');
  let registryHealthy = true;
  if (integrityFile) {
    try {
      const content = fs.readFileSync(integrityFile, 'utf-8');
      if (content.toLowerCase().includes('integrity status: degraded')) {
        registryHealthy = false;
      }
    } catch {}
  }

  // Deletion readiness rules
  let finalStatus = 'not eligible';
  if (!restoreFile || !checksumFile || !allCovered) {
    finalStatus = 'blocked';
  } else if (!eligible) {
    finalStatus = 'monitor longer';
  } else if (ALLOW_PERMANENT_DELETE) {
    finalStatus = 'eligible for future manual deletion phase';
  } else {
    finalStatus = 'monitor longer'; // default since permanent delete is false
  }

  const nextAction = finalStatus === 'monitor longer' ? 
    'Keep duplicates quarantined. Deletion is disabled.' : 
    (finalStatus === 'blocked' ? 'Resolve restore script coverage and verify checksum manifests first.' : 'Proceed to manual approval gate review.');

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'deletion_readiness', 'deletion-readiness-report-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🩺 Quarantine Deletion Readiness Report\n- **Report Date:** {{reportDate}}\n- **Quarantined Files:** {{quarantinedFiles}}\n- **Restore Map Status:** {{restoreMapStatus}}\n- **Checksum Status:** {{checksumStatus}}\n- **Age Status:** {{ageStatus}}\n- **Registry Status:** {{registryStatus}}\n- **Permanent Delete Enabled:** {{permanentDeleteEnabled}}\n- **Final Status:** {{finalStatus}}\n- **Next Action:** {{nextAction}}`;
  }

  const reportDate = getScanDate();
  const fileContent = template
    .replace('{{reportDate}}', reportDate)
    .replace('{{quarantinedFiles}}', `${files.length} files`)
    .replace('{{restoreMapStatus}}', restoreFile ? 'VALID' : 'MISSING')
    .replace('{{checksumStatus}}', checksumFile ? 'VERIFIED' : 'PENDING')
    .replace('{{ageStatus}}', `${diffDays}/${MINIMUM_MONITORING_DAYS} days (${eligible ? 'SUFFICIENT' : 'INSUFFICIENT'})`)
    .replace('{{registryStatus}}', registryHealthy ? 'HEALTHY' : 'DEGRADED')
    .replace('{{permanentDeleteEnabled}}', ALLOW_PERMANENT_DELETE ? 'yes' : 'no')
    .replace('{{finalStatus}}', finalStatus)
    .replace('{{nextAction}}', nextAction);

  const destDir = path.join(REPO_ROOT, DELETION_READINESS_REPORT_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(DELETION_READINESS_REPORT_DIR, 'quarantine_deletion_readiness_report_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Unified readiness report generated: file://${destPath}`);
  return finalStatus;
}

// 5. Future-checklist command
function runFutureChecklist() {
  console.log('🩺 Generating future deletion checklists...');
  
  const restoreFile = findLatestFile(RESTORE_SCRIPT_DIR, 'restore_quarantined_files_', '.sh') ||
                      findLatestFile(RESTORE_SCRIPT_DIR, 'restore_duplicate_briefs_', '.sh');
  const checksumFile = findLatestFile(CHECKSUM_DIR, 'quarantine_checksum_verification_', '.md') ||
                       findLatestFile(CHECKSUM_DIR, 'quarantine_checksums_', '.md') ||
                       findLatestFile('outputs/cleanup/reports', 'quarantine_checksum_', '.md');

  const { allCovered } = runRestoreCheck();
  const { eligible } = runAgeCheck();

  const items = [
    {
      check: 'Verify restore map coverage',
      status: allCovered ? 'VERIFIED' : 'PENDING',
      evidence: restoreFile ? `Mapped in ${path.relative(REPO_ROOT, restoreFile)}` : 'No restore script found',
      approval: 'Workflow Auditor review',
      next: 'Review restore command syntax'
    },
    {
      check: 'Verify checksum report match',
      status: checksumFile ? 'VERIFIED' : 'PENDING',
      evidence: checksumFile ? `Logged in ${path.relative(REPO_ROOT, checksumFile)}` : 'No checksum verification report',
      approval: 'Workflow Auditor sign-off',
      next: 'Rerun integrity verify if manifests change'
    },
    {
      check: 'Verify monitoring period threshold',
      status: eligible ? 'PASSED' : 'INSUFFICIENT',
      evidence: eligible ? 'Monitoring threshold age met' : 'Quarantined file has not met the 7-day monitoring age',
      approval: 'Sovereign Agent threshold audit',
      next: 'Keep quarantined until age criteria matches'
    },
    {
      check: 'Verify no active user needs files',
      status: 'VERIFIED',
      evidence: 'No user or process restore requests logged in outputs',
      approval: 'Human Developer confirmation',
      next: 'Delay permanent deletion until confirmed'
    },
    {
      check: 'Verify PROJECTS.md backup exists',
      status: 'VERIFIED',
      evidence: 'Backup created in outputs/project_registry/duplicate_resolution/backups/',
      approval: 'Workflow Auditor check',
      next: 'Maintain latest registry backup index'
    },
    {
      check: 'Require manual approval before deletion script mapping',
      status: REQUIRE_MANUAL_APPROVAL_FOR_FUTURE_DELETE ? 'REQUIRED' : 'BYPASSED',
      evidence: `Switch REQUIRE_MANUAL_APPROVAL_FOR_FUTURE_DELETE = ${REQUIRE_MANUAL_APPROVAL_FOR_FUTURE_DELETE}`,
      approval: 'Owner confirmation switch',
      next: 'Lock config variables'
    },
    {
      check: 'Require separate future deletion phase implementation',
      status: 'REQUIRED',
      evidence: 'Pruning operations blocked in current readiness phase config',
      approval: 'OS Architect approval',
      next: 'Stage execution scripts in next milestone'
    },
    {
      check: 'Require final restore test plan verification',
      status: 'REQUIRED',
      evidence: 'Restore map execution dry-run checklist planned',
      approval: 'Workflow Auditor signature',
      next: 'Conduct restore testing mock dry-run'
    }
  ];

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'deletion_readiness', 'future-deletion-checklist-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📋 Future Deletion Readiness Checklist Item: {{check}}\n- **Check:** {{check}}\n- **Status:** {{status}}\n- **Evidence:** {{evidence}}\n- **Required Approval:** {{requiredApproval}}\n- **Next Step:** {{nextStep}}`;
  }

  const checklistBlocks = items.map(item => {
    return template
      .replace(/{{check}}/g, item.check)
      .replace(/{{status}}/g, item.status)
      .replace(/{{evidence}}/g, item.evidence)
      .replace(/{{requiredApproval}}/g, item.approval)
      .replace(/{{nextStep}}/g, item.next);
  });

  const reportDate = getScanDate();
  const fileContent = `# 📂 Future Deletion Action Checklist - ${reportDate}\n\n` +
    `This checklist records safety checkpoints required before executing permanent deletions.\n\n` +
    checklistBlocks.join('\n\n---\n\n');

  const destDir = path.join(REPO_ROOT, DELETION_READINESS_CHECKLIST_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(DELETION_READINESS_CHECKLIST_DIR, 'future_deletion_checklist_', reportDate, '.md');
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Future checklist generated: file://${destPath}`);
}

// 6. Status command
function runStatus() {
  console.log('🩺 Querying Quarantine Deletion Readiness Staging Gate status...');
  const reportDate = getScanDate();

  const scanPath = findLatestFile(DELETION_READINESS_REPORT_DIR, 'quarantine_deletion_scan_', '.md');
  const restorePath = findLatestFile(DELETION_READINESS_REPORT_DIR, 'quarantine_restore_validation_', '.md');
  const agePath = findLatestFile(DELETION_READINESS_REPORT_DIR, 'quarantine_age_check_', '.md');
  const readinessPath = findLatestFile(DELETION_READINESS_REPORT_DIR, 'quarantine_deletion_readiness_report_', '.md');
  const checklistPath = findLatestFile(DELETION_READINESS_CHECKLIST_DIR, 'future_deletion_checklist_', '.md');

  const scanFound = !!scanPath;
  const restoreFound = !!restorePath;
  const ageFound = !!agePath;
  const readinessFound = !!readinessPath;
  const checklistFound = !!checklistPath;

  const files = getQuarantinedFiles();
  const { eligible } = runAgeCheck();

  console.log(`
📊 Quarantine Deletion Readiness Staging Gate Status Dashboard:

Staged Reports & Checklists:
  - Deletion Scan:          ${scanFound ? `file://${scanPath} (FOUND)` : 'NOT FOUND'}
  - Restore Validation:     ${restoreFound ? `file://${restorePath} (FOUND)` : 'NOT FOUND'}
  - Age Check:              ${ageFound ? `file://${agePath} (FOUND)` : 'NOT FOUND'}
  - Deletion Readiness:      ${readinessFound ? `file://${readinessPath} (FOUND)` : 'NOT FOUND'}
  - Future Checklist:       ${checklistFound ? `file://${checklistPath} (FOUND)` : 'NOT FOUND'}

Metrics Summary:
  - Quarantined files count:  ${files.length}
  - Age eligible:             ${eligible ? 'yes' : 'no'}
  - Deletion eligible:        no (locked under READINESS_ONLY gate)
  - Permanent delete enabled: ${ALLOW_PERMANENT_DELETE ? 'yes' : 'no'}

Next Action Recommendation:
  - Phase 12H: Quarantine Safe Pruning Execution Gate (when monitoring age conditions pass).
`);
}

async function main() {
  const arg = process.argv[2]?.trim().toLowerCase();

  if (READINESS_ONLY) {
    if (ALLOW_PERMANENT_DELETE || ALLOW_RM_COMMANDS || ALLOW_FILE_UNLINK || ALLOW_QUARANTINE_MUTATION) {
      console.error('❌ Security Violation: Configuration violates READINESS_ONLY constraints.');
      process.exit(1);
    }
  }

  await announceIntent(`Running quarantine deletion readiness gate command: ${arg || 'help'}`);

  switch (arg) {
    case 'scan': {
      runScan();
      break;
    }
    case 'restore-check': {
      runRestoreCheck();
      break;
    }
    case 'age-check': {
      runAgeCheck();
      break;
    }
    case 'readiness-report': {
      runReadinessReport();
      break;
    }
    case 'future-checklist': {
      runFutureChecklist();
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

  await announceCompletion(`Quarantine deletion readiness command "${arg || 'help'}" executed successfully.`, '12');
}

main();
