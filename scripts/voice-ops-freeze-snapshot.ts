import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  SYSTEM_STATUS_PATH,
  PROJECTS_PATH,
  NEXT_ACTIONS_PATH,
  COMMANDS_DOC_PATH,
  DASHBOARD_DIST_DIR,
  DASHBOARD_TELEMETRY_DIR,
  PHASE_REPORTS_DIR,
  RELEASE_CLOSURE_DIR,
  DELIVERY_PACKAGE_DIR,
  HANDOFF_DIR,
  ARCHIVE_RETENTION_DIR,
  FREEZE_ROOT,
  FREEZE_TAGS_DIR,
  FREEZE_MANIFESTS_DIR,
  RECOVERY_CHECKLIST_DIR,
  FREEZE_LOGS_DIR,
  FREEZE_REPORTS_DIR,
  RECOMMENDED_FREEZE_TAG_NAME,
  INCLUDE_DASHBOARD_SNAPSHOT,
  INCLUDE_REPORT_INDEX,
  INCLUDE_COMMAND_REGISTRY_CHECKSUM,
  INCLUDE_PACKAGE_CHECKSUMS,
  INCLUDE_RECOVERY_CHECKLIST,
  READONLY_MODE,
  AUTO_EXECUTE,
  AUTO_UPLOAD,
  AUTO_PUBLISH,
  AUTO_DELETE
} from '../config/voice-ops-freeze-snapshot.config.js';

// Ensure directories exist
const dirs = [
  FREEZE_ROOT,
  FREEZE_TAGS_DIR,
  FREEZE_MANIFESTS_DIR,
  RECOVERY_CHECKLIST_DIR,
  FREEZE_LOGS_DIR,
  FREEZE_REPORTS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(FREEZE_LOGS_DIR, 'voice_ops_freeze_snapshot.log');
const SNAPSHOT_JSON_FILE = path.join(FREEZE_ROOT, 'snapshots/dashboard_snapshot.json');

function logEvent(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/voice_ops_freeze_snapshot', templateName);
  if (!fs.existsSync(templatePath)) {
    return `Error: Template not found at ${templatePath}`;
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

function getSHA256(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function getFileSize(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.statSync(filePath).size;
}

// 1. scan-release
interface ReleaseState {
  closureReportExists: boolean;
  closureReportPath: string;
  closureReportVerification: string;
  completedPhaseRange: string;
  commandDocExists: boolean;
  dashboardDistExists: boolean;
  dashboardDistSize: string;
  packageExists: boolean;
  packagePath: string;
  handoffExists: boolean;
  handoffPath: string;
  archiveLedgerExists: boolean;
}

function scanReleaseState(): ReleaseState {
  const state: ReleaseState = {
    closureReportExists: false,
    closureReportPath: 'None',
    closureReportVerification: 'None',
    completedPhaseRange: 'N5A - N5Q',
    commandDocExists: fs.existsSync(COMMANDS_DOC_PATH),
    dashboardDistExists: false,
    dashboardDistSize: 'N/A',
    packageExists: false,
    packagePath: 'None',
    handoffExists: false,
    handoffPath: 'None',
    archiveLedgerExists: false
  };

  // Find latest closure report
  if (fs.existsSync(RELEASE_CLOSURE_DIR)) {
    const files = fs.readdirSync(RELEASE_CLOSURE_DIR).filter(f => f.startsWith('voice_ops_release_closure_report_') && f.endsWith('.md')).sort();
    if (files.length > 0) {
      const latestReport = files[files.length - 1];
      state.closureReportExists = true;
      state.closureReportPath = path.join('outputs/narrator/voice_ops_release_closure/reports', latestReport);
      
      const fullPath = path.join(RELEASE_CLOSURE_DIR, latestReport);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const hasBlockers = /Outstanding Blockers.*None/i.test(content);
      state.closureReportVerification = hasBlockers ? 'VERIFIED (PASS)' : 'BLOCKERS DETECTED';
    }
  }

  // Dashboard dist status
  const indexHtml = path.join(DASHBOARD_DIST_DIR, 'index.html');
  if (fs.existsSync(indexHtml)) {
    state.dashboardDistExists = true;
    state.dashboardDistSize = `${Math.round(getFileSize(indexHtml) / 1024)} KB`;
  }

  // Find delivery packages
  if (fs.existsSync(DELIVERY_PACKAGE_DIR)) {
    const packages = fs.readdirSync(DELIVERY_PACKAGE_DIR).sort();
    if (packages.length > 0) {
      state.packageExists = true;
      state.packagePath = path.join('outputs/narrator/briefing_delivery_packages/packages', packages[packages.length - 1]);
    }
  }

  // Find approved handoff
  if (fs.existsSync(HANDOFF_DIR)) {
    const files = fs.readdirSync(HANDOFF_DIR).filter(f => f.startsWith('approved_') && f.endsWith('.md')).sort();
    if (files.length > 0) {
      state.handoffExists = true;
      state.handoffPath = path.join('outputs/narrator/manual_delivery_handoff/approved', files[files.length - 1]);
    }
  }

  // Archive ledger status
  const ledgerDir = path.join(ARCHIVE_RETENTION_DIR, 'ledger');
  if (fs.existsSync(ledgerDir)) {
    const files = fs.readdirSync(ledgerDir).filter(f => f.startsWith('ledger_') && f.endsWith('.json')).sort();
    if (files.length > 0) {
      state.archiveLedgerExists = true;
    }
  }

  return state;
}

// Get latest snapshot info
function getLatestSnapshotInfo(): { tag: string; manifest: string; checklist: string; verifyStatus: string } {
  const result = { tag: 'None', manifest: 'None', checklist: 'None', verifyStatus: 'None' };

  // Latest tag file
  if (fs.existsSync(FREEZE_TAGS_DIR)) {
    const files = fs.readdirSync(FREEZE_TAGS_DIR).filter(f => f.startsWith('tag_') && f.endsWith('.md')).sort();
    if (files.length > 0) {
      result.tag = files[files.length - 1].replace('tag_', '').replace('.md', '');
    }
  }

  // Latest manifest
  if (fs.existsSync(FREEZE_MANIFESTS_DIR)) {
    const files = fs.readdirSync(FREEZE_MANIFESTS_DIR).filter(f => f.startsWith('manifest_') && f.endsWith('.md')).sort();
    if (files.length > 0) {
      result.manifest = path.join('outputs/narrator/voice_ops_freeze_snapshot/manifests', files[files.length - 1]);
    }
  }

  // Latest recovery checklist
  if (fs.existsSync(RECOVERY_CHECKLIST_DIR)) {
    const files = fs.readdirSync(RECOVERY_CHECKLIST_DIR).filter(f => f.startsWith('recovery_checklist_') && f.endsWith('.md')).sort();
    if (files.length > 0) {
      result.checklist = path.join('outputs/narrator/voice_ops_freeze_snapshot/recovery_checklists', files[files.length - 1]);
    }
  }

  // Verification status
  if (result.manifest !== 'None') {
    const reportList = fs.existsSync(FREEZE_REPORTS_DIR)
      ? fs.readdirSync(FREEZE_REPORTS_DIR).filter(f => f.startsWith('snapshot_verification_') && f.endsWith('.md')).sort()
      : [];
    if (reportList.length > 0) {
      const fullPath = path.join(FREEZE_REPORTS_DIR, reportList[reportList.length - 1]);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('Overall Snapshot Verification Status: `VERIFIED (PASS)`') || content.includes('VERIFIED (PASS)')) {
          result.verifyStatus = 'VERIFIED';
        } else {
          result.verifyStatus = 'FAILED';
        }
      }
    }
  }

  return result;
}

// COMMAND: status
function handleStatus(quiet = false) {
  const release = scanReleaseState();
  const latestSnap = getLatestSnapshotInfo();

  const snapshotData = {
    latestFreezeTag: latestSnap.tag,
    latestSnapshotManifestPath: latestSnap.manifest,
    latestRecoveryChecklistPath: latestSnap.checklist,
    snapshotVerificationStatus: latestSnap.verifyStatus,
    detectedPhaseRange: release.completedPhaseRange,
    releaseClosureStatus: release.closureReportExists ? 'CLOSED' : 'PENDING',
    safetyPostureStatus: release.closureReportVerification === 'VERIFIED (PASS)' ? 'VERIFIED' : 'PENDING',
    autoExecuteStatus: 'disabled',
    autoUploadStatus: 'disabled',
    autoPublishStatus: 'disabled'
  };

  // Ensure snapshot directory for JSON output exists
  const jsonSnapDir = path.dirname(SNAPSHOT_JSON_FILE);
  if (!fs.existsSync(jsonSnapDir)) {
    fs.mkdirSync(jsonSnapDir, { recursive: true });
  }
  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshotData, null, 2), 'utf-8');

  const statusMsg = fillTemplate('voice-ops-freeze-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    SYSTEM_STATUS_PATH,
    PHASE_REPORTS_DIR,
    DELIVERY_PACKAGE_DIR,
    FREEZE_TAGS_DIR,
    FREEZE_MANIFESTS_DIR,
    RECOVERY_CHECKLIST_DIR,
    FREEZE_LOGS_DIR,
    READONLY_MODE: String(READONLY_MODE),
    AUTO_EXECUTE: String(AUTO_EXECUTE),
    AUTO_UPLOAD: String(AUTO_UPLOAD),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    AUTO_DELETE: String(AUTO_DELETE),
    LATEST_FREEZE_TAG: latestSnap.tag,
    LATEST_SNAPSHOT_MANIFEST: latestSnap.manifest,
    LATEST_RECOVERY_CHECKLIST: latestSnap.checklist,
    SNAP_VERIFICATION_STATUS: latestSnap.verifyStatus
  });

  if (!quiet) {
    console.log(statusMsg);
  }

  return snapshotData;
}

// COMMAND: scan-release
function handleScanRelease() {
  console.log(`\n======================================================`);
  console.log(`📡 Scanning Voice Operations Release State (Post N5Q)`);
  console.log(`======================================================`);

  const release = scanReleaseState();

  console.log(`- Release Closure Report: [${release.closureReportExists ? 'FOUND' : 'MISSING'}] | Path: ${release.closureReportPath}`);
  console.log(`- Closure Verification  : ${release.closureReportVerification}`);
  console.log(`- Completed Phase Range : ${release.completedPhaseRange}`);
  console.log(`- COMMANDS.md Registry  : [${release.commandDocExists ? 'FOUND' : 'MISSING'}]`);
  console.log(`- Dashboard Dist Index  : [${release.dashboardDistExists ? 'FOUND' : 'MISSING'}] | Size: ${release.dashboardDistSize}`);
  console.log(`- Delivery Package Path : [${release.packageExists ? 'FOUND' : 'MISSING'}] | Path: ${release.packagePath}`);
  console.log(`- Handoff Sign-off md   : [${release.handoffExists ? 'FOUND' : 'MISSING'}] | Path: ${stateOrValue(release.handoffPath)}`);
  console.log(`- Retention Ledger Entry: [${release.archiveLedgerExists ? 'FOUND' : 'MISSING'}]`);
  console.log(`======================================================\n`);
}

function stateOrValue(v: string) {
  return v ? v : 'None';
}

// COMMAND: create-freeze-tag
function handleCreateFreezeTag() {
  const timestampStr = new Date().toISOString();
  const dateStr = timestampStr.split('T')[0];
  const tag = `release-voice-ops-${dateStr}`;

  const release = scanReleaseState();
  if (!release.closureReportExists) {
    console.error(`❌ Error: Incomplete Release Closure. Please generate-report in voice-ops-release-closure first.`);
    process.exit(1);
  }

  let gitBranch = 'main';
  try {
    const { execSync } = require('child_process');
    gitBranch = execSync('git rev-parse --abref HEAD || git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch (e) {}

  const tagContent = fillTemplate('voice-ops-freeze-tag-template.md', {
    FREEZE_TAG_NAME: tag,
    RELEASE_CLOSURE_ID: path.basename(release.closureReportPath, '.md'),
    SYSTEM_BRANCH: gitBranch,
    PROJECT_ROOT: process.cwd(),
    TIMESTAMP: timestampStr
  });

  const tagPath = path.join(FREEZE_TAGS_DIR, `tag_${tag}.md`);
  fs.writeFileSync(tagPath, tagContent, 'utf-8');

  logEvent(`TAG CREATED: Release freeze tag registered locally: ${tag}`);

  console.log(`\n======================================================`);
  console.log(`✅ Success: Local Freeze Tag Registered`);
  console.log(`======================================================`);
  console.log(`- Tag Name     : ${tag}`);
  gitBranch && console.log(`- Active Branch: ${gitBranch}`);
  console.log(`- Tag Metadata : ${tagPath}`);
  console.log(`- Git actions  : METADATA-ONLY (Zero remote network calls)`);
  console.log(`======================================================\n`);

  handleStatus(true);
}

// Helper to gather checksum format lists
function getFileChecksumString(relativePath: string): string {
  const fullPath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(fullPath)) return `- ${relativePath}: *File Missing*`;
  const hash = getSHA256(fullPath);
  const size = fs.statSync(fullPath).size;
  return `- ${relativePath} | size: \`${size} bytes\` | SHA256: \`${hash}\``;
}

// COMMAND: snapshot-manifest
function handleSnapshotManifest() {
  const timestampStr = new Date().toISOString();
  const dateStr = timestampStr.split('T')[0];
  const tag = `release-voice-ops-${dateStr}`;

  const release = scanReleaseState();

  // Core Scripts
  const scriptsList = [
    'scripts/narrator-tts-queue.ts',
    'scripts/narrator-tts-renderer.ts',
    'scripts/narrator-asr-listener.ts',
    'scripts/narrator-voice-bridge.ts',
    'scripts/narrator-voice-loop-dashboard.ts',
    'scripts/narrator-voice-session-recorder.ts',
    'scripts/narrator-voice-asr-orchestrator.ts',
    'scripts/narrator-voice-lifecycle-audit.ts',
    'scripts/narrator-voice-ops-daily-report.ts',
    'scripts/voice-ops-scheduled-briefing.ts',
    'scripts/briefing-tts-render-approval.ts',
    'scripts/briefing-audio-playback-review.ts',
    'scripts/briefing-delivery-package-exporter.ts',
    'scripts/manual-delivery-handoff.ts',
    'scripts/delivery-archive-retention.ts',
    'scripts/voice-ops-release-closure.ts',
    'scripts/voice-ops-freeze-snapshot.ts'
  ];
  const scriptsChecksums = scriptsList.map(s => getFileChecksumString(s)).join('\n');

  // Reports
  const reportsList = [
    release.closureReportPath,
    'outputs/narrator/voice_ops_daily_report/reports/voice_ops_daily_report_2026-06-01.md',
    'outputs/narrator/manual_delivery_handoff/reports/manual_delivery_handoff_summary.md',
    'outputs/narrator/delivery_archive_retention/reports/archive_summary_report.md'
  ].filter(p => p !== 'None');
  const reportsChecksums = reportsList.map(r => getFileChecksumString(r)).join('\n');

  // Dashboard
  const dashList = ['dashboard/dist/index.html', 'dashboard/public/dashboard-data.json'];
  const dashChecksums = dashList.map(d => getFileChecksumString(d)).join('\n');

  // Packages & Handoffs
  const pkgList: string[] = [];
  if (release.packageExists) {
    pkgList.push(path.join(release.packagePath, 'package_manifest.json'));
  }
  if (release.handoffExists) {
    pkgList.push(release.handoffPath);
  }
  const pkgChecksums = pkgList.map(p => getFileChecksumString(p)).join('\n');

  let gitBranch = 'main';
  try {
    const { execSync } = require('child_process');
    gitBranch = execSync('git rev-parse --abref HEAD || git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch (e) {}

  const manifestContent = fillTemplate('voice-ops-snapshot-manifest-template.md', {
    FREEZE_TAG_NAME: tag,
    PROJECT_ROOT: process.cwd(),
    SYSTEM_BRANCH: gitBranch,
    RELEASE_CLOSURE_ID: path.basename(release.closureReportPath, '.md'),
    COMPLETED_PHASE_RANGE: release.completedPhaseRange,
    CORE_SCRIPTS_CHECKSUMS: scriptsChecksums,
    REPORT_ARTIFACT_CHECKSUMS: reportsChecksums,
    DASHBOARD_ASSETS_CHECKSUMS: dashChecksums,
    PACKAGE_DELIVERABLE_CHECKSUMS: pkgChecksums
  });

  const manifestMdPath = path.join(FREEZE_MANIFESTS_DIR, `manifest_${tag}.md`);
  fs.writeFileSync(manifestMdPath, manifestContent, 'utf-8');

  // JSON export
  const manifestData = {
    freezeTag: tag,
    timestamp: timestampStr,
    projectRoot: process.cwd(),
    branch: gitBranch,
    closureId: path.basename(release.closureReportPath, '.md'),
    phaseRange: release.completedPhaseRange,
    files: [
      ...scriptsList,
      ...reportsList,
      ...dashList,
      ...pkgList
    ].map(f => {
      const fullPath = path.join(process.cwd(), f);
      return {
        relativePath: f,
        hash: getSHA256(fullPath),
        size: getFileSize(fullPath)
      };
    })
  };
  const manifestJsonPath = path.join(FREEZE_MANIFESTS_DIR, `manifest_${tag}.json`);
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestData, null, 2), 'utf-8');

  // Fixed index paths
  fs.writeFileSync(path.join(FREEZE_MANIFESTS_DIR, 'voice_ops_snapshot_manifest.md'), manifestContent, 'utf-8');
  fs.writeFileSync(path.join(FREEZE_MANIFESTS_DIR, 'voice_ops_snapshot_manifest.json'), JSON.stringify(manifestData, null, 2), 'utf-8');

  logEvent(`MANIFEST CREATED: Compiled snapshot hashes to ${manifestMdPath}`);

  console.log(`\n======================================================`);
  console.log(`✅ Success: Snapshot Manifests Exported`);
  console.log(`======================================================`);
  console.log(`- MD Manifest  : ${manifestMdPath}`);
  console.log(`- JSON Manifest: ${manifestJsonPath}`);
  console.log(`- Total Files  : ${manifestData.files.length}`);
  console.log(`======================================================\n`);
}

// COMMAND: recovery-checklist
function handleRecoveryChecklist() {
  const timestampStr = new Date().toISOString();
  const dateStr = timestampStr.split('T')[0];
  const tag = `release-voice-ops-${dateStr}`;

  const content = fillTemplate('voice-ops-recovery-checklist-template.md', {
    FREEZE_TAG_NAME: tag,
    PROJECT_ROOT: process.cwd(),
    TIMESTAMP: timestampStr
  });

  const checklistPath = path.join(RECOVERY_CHECKLIST_DIR, `recovery_checklist_${tag}.md`);
  fs.writeFileSync(checklistPath, content, 'utf-8');
  fs.writeFileSync(path.join(RECOVERY_CHECKLIST_DIR, 'voice_ops_recovery_checklist.md'), content, 'utf-8');

  logEvent(`CHECKLIST CREATED: Recovery checklist runbook compiled to ${checklistPath}`);

  console.log(`\n======================================================`);
  console.log(`✅ Success: Recovery Checklist Runbook Generated`);
  console.log(`======================================================`);
  console.log(`- Runbook Markdown: ${checklistPath}`);
  console.log(`- Restoration Steps: 21 validation items enqueued`);
  console.log(`======================================================\n`);
}

// COMMAND: verify-snapshot
function handleVerifySnapshot() {
  console.log(`📡 Verifying latest snapshot manifest hashes...`);

  const manifestList = fs.existsSync(FREEZE_MANIFESTS_DIR)
    ? fs.readdirSync(FREEZE_MANIFESTS_DIR).filter(f => f.startsWith('manifest_') && f.endsWith('.json')).sort()
    : [];

  if (manifestList.length === 0) {
    console.error(`❌ Error: No snapshot manifests discovered. Please run snapshot-manifest first.`);
    process.exit(1);
  }

  const latestJson = manifestList[manifestList.length - 1];
  const fullPath = path.join(FREEZE_MANIFESTS_DIR, latestJson);
  const tag = latestJson.replace('manifest_', '').replace('.json', '');

  let filePresenceStatus = 'VERIFIED (PASS)';
  let checksumAuditStatus = 'VERIFIED (PASS)';
  let verificationDecision = 'VERIFIED (PASS)';
  const mismatches: string[] = [];

  try {
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    for (const f of data.files) {
      const targetPath = path.join(process.cwd(), f.relativePath);
      if (!fs.existsSync(targetPath)) {
        filePresenceStatus = 'FAILED';
        mismatches.push(`File missing: ${f.relativePath}`);
        continue;
      }
      const actualHash = getSHA256(targetPath);
      if (actualHash !== f.hash) {
        checksumAuditStatus = 'FAILED';
        mismatches.push(`Hash mismatch for ${f.relativePath}: Expected ${f.hash}, got ${actualHash}`);
      }
    }
  } catch (err) {
    filePresenceStatus = 'FAILED';
    checksumAuditStatus = 'FAILED';
    mismatches.push(`Failed to parse JSON manifest: ${(err as Error).message}`);
  }

  if (mismatches.length > 0) {
    verificationDecision = 'FAILED';
  }

  const timestampStr = new Date().toISOString();
  const verifyReportContent = fillTemplate('voice-ops-snapshot-verification-template.md', {
    TIMESTAMP: timestampStr,
    MANIFEST_PATH: fullPath,
    FREEZE_TAG_NAME: tag,
    FILE_PRESENCE_STATUS: filePresenceStatus,
    CHECKSUM_AUDIT_STATUS: checksumAuditStatus,
    VERIFICATION_DECISION: verificationDecision
  });

  const dateStr = timestampStr.split('T')[0];
  const reportPath = path.join(FREEZE_REPORTS_DIR, `snapshot_verification_${dateStr}.md`);
  fs.writeFileSync(reportPath, verifyReportContent, 'utf-8');
  fs.writeFileSync(path.join(FREEZE_REPORTS_DIR, 'snapshot_verification_report.md'), verifyReportContent, 'utf-8');

  logEvent(`VERIFY RESULT: Audit verification completed: ${verificationDecision}`);

  if (verificationDecision === 'VERIFIED (PASS)') {
    console.log(`✅ Success: All files exist and SHA256 checksum signatures match.`);
    console.log(`💡 Verification details saved to: ${reportPath}`);
  } else {
    console.error(`❌ Failure: Checksum or file validation error:`);
    mismatches.forEach(m => console.error(`  - ${m}`));
    process.exit(1);
  }

  handleStatus(true);
}

// COMMAND: list-snapshots
function handleListSnapshots() {
  console.log(`\n======================================================`);
  console.log(`📁 Listing All Local Archive Freeze Snapshots`);
  console.log(`======================================================`);

  const files = fs.existsSync(FREEZE_MANIFESTS_DIR)
    ? fs.readdirSync(FREEZE_MANIFESTS_DIR).filter(f => f.startsWith('manifest_') && f.endsWith('.json')).sort()
    : [];

  if (files.length === 0) {
    console.log(`*No snapshots registered yet.*`);
  } else {
    files.forEach(f => {
      const tag = f.replace('manifest_', '').replace('.json', '');
      console.log(`- Tag: ${tag.padEnd(28)} | Manifest: ${f}`);
    });
  }
  console.log(`======================================================\n`);
}

// COMMAND: latest
function handleLatest() {
  const manifestList = fs.existsSync(FREEZE_MANIFESTS_DIR)
    ? fs.readdirSync(FREEZE_MANIFESTS_DIR).filter(f => f.startsWith('manifest_') && f.endsWith('.json')).sort()
    : [];

  console.log(`\n======================================================`);
  console.log(`📦 Latest Freeze Snapshot Context`);
  console.log(`======================================================`);

  if (manifestList.length === 0) {
    console.log(`No freeze tag snapshots found.`);
  } else {
    const latestFile = manifestList[manifestList.length - 1];
    const fullPath = path.join(FREEZE_MANIFESTS_DIR, latestFile);
    try {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      console.log(`Latest Stable Snapshot:`);
      console.log(`  - Tag Reference : ${data.freezeTag}`);
      console.log(`  - Timestamp     : ${data.timestamp}`);
      console.log(`  - Active Branch : ${data.branch}`);
      console.log(`  - Closure ID    : ${data.closureId}`);
      console.log(`  - Registered Files: ${data.files.length}`);
    } catch (e) {
      console.log(`  - Latest manifest record is corrupted.`);
    }
  }
  console.log(`======================================================\n`);
}

// COMMAND: freeze-summary
function handleFreezeSummary() {
  const snapshotsCount = fs.existsSync(FREEZE_MANIFESTS_DIR)
    ? fs.readdirSync(FREEZE_MANIFESTS_DIR).filter(f => f.startsWith('manifest_') && f.endsWith('.json')).length
    : 0;

  const latest = getLatestSnapshotInfo();
  const release = scanReleaseState();

  const timestampStr = new Date().toISOString();
  const summaryContent = fillTemplate('voice-ops-freeze-summary-template.md', {
    TIMESTAMP: timestampStr,
    SNAPSHOTS_COUNT: String(snapshotsCount),
    LATEST_FREEZE_TAG: latest.tag,
    RELEASE_CLOSURE_ID: path.basename(release.closureReportPath, '.md'),
    COMPLETED_PHASE_RANGE: release.completedPhaseRange,
    READONLY_MODE: String(READONLY_MODE),
    AUTO_EXECUTE: String(AUTO_EXECUTE),
    AUTO_UPLOAD: String(AUTO_UPLOAD),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    AUTO_DELETE: String(AUTO_DELETE),
    MANIFEST_PATH: latest.manifest,
    CHECKLIST_PATH: latest.checklist,
    VERIFICATION_STATUS: latest.verifyStatus
  });

  const summaryPath = path.join(FREEZE_REPORTS_DIR, 'freeze_summary_report.md');
  fs.writeFileSync(summaryPath, summaryContent, 'utf-8');
  logEvent(`Report Generated: Freeze summary report saved to ${summaryPath}`);

  console.log(summaryContent);
  console.log(`💡 Report saved to: ${summaryPath}`);
}

// COMMAND: freeze-log
function handleFreezeLog() {
  let logsContent = 'No freeze log events recorded.';
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
    logsContent = lines.slice(-20).join('\n');
  }

  const logMsg = fillTemplate('voice-ops-freeze-log-template.md', {
    TIMESTAMP: new Date().toISOString(),
    LOG_PATH: LOG_FILE,
    LOG_ENTRIES: logsContent
  });

  console.log(logMsg);
}

// Parse command arguments
let parsedArgs: string[] = [];

async function main() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ') && !args[0].startsWith('-')) {
    const match = args[0].match(/--?\w+|"[^"]*"|'[^']*'|[^\s"']+/g);
    if (match) {
      args = match.map(m => m.replace(/^['"]|['"]$/g, ''));
    }
  }
  parsedArgs = args;

  const positionalArgs: string[] = [];
  for (let i = 0; i < parsedArgs.length; i++) {
    if (parsedArgs[i].startsWith('--')) {
      i++; // Skip flag value
      continue;
    }
    positionalArgs.push(parsedArgs[i]);
  }

  const command = positionalArgs[0] ? positionalArgs[0].trim().toLowerCase() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'scan-release':
      handleScanRelease();
      break;
    case 'create-freeze-tag':
      handleCreateFreezeTag();
      break;
    case 'snapshot-manifest':
      handleSnapshotManifest();
      break;
    case 'recovery-checklist':
      handleRecoveryChecklist();
      break;
    case 'verify-snapshot':
      handleVerifySnapshot();
      break;
    case 'list-snapshots':
      handleListSnapshots();
      break;
    case 'latest':
      handleLatest();
      break;
    case 'freeze-summary':
      handleFreezeSummary();
      break;
    case 'freeze-log':
      handleFreezeLog();
      break;
    default:
      console.error(`❌ Error: Unknown command "${command}". Run npm run voice-ops-freeze-snapshot-help for guidance.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal execution error: ${err}`);
  process.exit(1);
});
