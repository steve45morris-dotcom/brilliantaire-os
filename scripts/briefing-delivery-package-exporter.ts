import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  BRIEFING_AUDIO_REVIEW_APPROVED_DIR,
  BRIEFING_FLOW_RENDERED_DIR,
  NARRATOR_TTS_RENDERED_AUDIO_DIR,
  BRIEFING_DAILY_REPORTS_DIR,
  BRIEFING_SCHEDULED_DIR,
  BRIEFING_TTS_REQUESTS_DIR,
  BRIEFING_TTS_REPORTS_DIR,
  BRIEFING_AUDIO_REVIEW_REPORTS_DIR,
  DELIVERY_PACKAGE_ROOT,
  DELIVERY_PACKAGE_OUTPUT_DIR,
  DELIVERY_PACKAGE_MANIFESTS_DIR,
  DELIVERY_PACKAGE_LOGS_DIR,
  DELIVERY_PACKAGE_REPORTS_DIR,
  DELIVERY_PACKAGE_BLOCKED_DIR,
  ALLOWED_AUDIO_FORMATS,
  ALLOWED_METADATA_FORMATS,
  AUTO_SEND,
  AUTO_UPLOAD,
  AUTO_PUBLISH,
  AUTO_EMAIL,
  AUTO_PLAYBACK,
  MANUAL_DELIVERY_REQUIRED,
  DUPLICATE_PACKAGE_PROTECTION,
  PACKAGE_NAMING_PATTERN,
  INCLUDE_MANIFEST,
  INCLUDE_CHECKSUM
} from '../config/briefing-delivery-package-exporter.config.js';

// Ensure directories exist
const dirs = [
  DELIVERY_PACKAGE_ROOT,
  DELIVERY_PACKAGE_OUTPUT_DIR,
  DELIVERY_PACKAGE_MANIFESTS_DIR,
  DELIVERY_PACKAGE_LOGS_DIR,
  DELIVERY_PACKAGE_REPORTS_DIR,
  DELIVERY_PACKAGE_BLOCKED_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(DELIVERY_PACKAGE_LOGS_DIR, 'briefing_delivery_package_exporter.log');
const SNAPSHOT_JSON_FILE = path.join(DELIVERY_PACKAGE_REPORTS_DIR, 'dashboard_briefing_delivery_snapshot.json');

function logEvent(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/briefing_delivery_package_exporter', templateName);
  if (!fs.existsSync(templatePath)) {
    return `Error: Template not found at ${templatePath}`;
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

function normalizeAudioId(input: string): string {
  let id = input.trim();
  id = id.replace(/\.(mp3|wav|m4a)$/i, '');
  id = id.replace(/^narrator_audio_/i, '');
  return id;
}

function countFiles(dir: string, filter?: (file: string) => boolean): number {
  if (!fs.existsSync(dir)) return 0;
  let list = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  if (filter) {
    list = list.filter(filter);
  }
  return list.length;
}

function findRenderedAudio(audioId: string): string | null {
  const formats = ALLOWED_AUDIO_FORMATS;
  for (const fmt of formats) {
    const p1 = path.join(BRIEFING_FLOW_RENDERED_DIR, `narrator_audio_${audioId}.${fmt}`);
    if (fs.existsSync(p1)) return p1;
    const p2 = path.join(NARRATOR_TTS_RENDERED_AUDIO_DIR, `narrator_audio_${audioId}.${fmt}`);
    if (fs.existsSync(p2)) return p2;
  }
  return null;
}

function getSHA256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function parseApprovedStatus(audioId: string): boolean {
  const file = path.join(BRIEFING_AUDIO_REVIEW_APPROVED_DIR, `approved_audio_${audioId}.md`);
  return fs.existsSync(file);
}

// Check verification of a package
function verifyPackageFiles(packageId: string): { valid: boolean; errors: string[]; files: any[] } {
  const packageDir = path.join(DELIVERY_PACKAGE_OUTPUT_DIR, packageId);
  const manifestPath = path.join(packageDir, 'package_manifest.json');
  const errors: string[] = [];
  const filesList: any[] = [];

  if (!fs.existsSync(manifestPath)) {
    return { valid: false, errors: [`Manifest file missing at ${manifestPath}`], files: [] };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    for (const f of manifest.files) {
      const fullPath = path.join(packageDir, f.relativePath);
      if (!fs.existsSync(fullPath)) {
        errors.push(`File missing: ${f.relativePath}`);
        continue;
      }
      const actualHash = getSHA256(fullPath);
      if (actualHash !== f.checksum) {
        errors.push(`Checksum mismatch for ${f.relativePath}: Expected ${f.checksum}, got ${actualHash}`);
      } else {
        filesList.push({ name: f.name, hash: actualHash, size: f.size });
      }
    }
  } catch (err) {
    errors.push(`Failed to parse manifest JSON: ${(err as Error).message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    files: filesList
  };
}

// COMMAND: status
function handleStatus(quiet = false) {
  // Discovered approved files
  const approvedCount = countFiles(BRIEFING_AUDIO_REVIEW_APPROVED_DIR, f => f.startsWith('approved_audio_') && f.endsWith('.md'));
  
  // Total packages
  const packagesList = fs.existsSync(DELIVERY_PACKAGE_OUTPUT_DIR)
    ? fs.readdirSync(DELIVERY_PACKAGE_OUTPUT_DIR).filter(f => f.startsWith('delivery_package_'))
    : [];
  const packageCount = packagesList.length;

  let latestPackageId = 'None';
  let latestPackagePath = 'None';
  let verificationStatus = 'None';

  if (packageCount > 0) {
    const sorted = packagesList.sort();
    latestPackageId = sorted[sorted.length - 1];
    latestPackagePath = path.join(DELIVERY_PACKAGE_OUTPUT_DIR, latestPackageId);
    
    // Check verification of latest package
    const verification = verifyPackageFiles(latestPackageId);
    verificationStatus = verification.valid ? 'VERIFIED' : 'FAILED: ' + verification.errors.join(', ');
  }

  const snapshotData = {
    approvedAudioCount: approvedCount,
    packageCount: packageCount,
    latestPackageId: latestPackageId,
    latestPackagePath: latestPackagePath,
    latestVerificationStatus: verificationStatus,
    duplicatePackageProtectionStatus: DUPLICATE_PACKAGE_PROTECTION ? 'enabled' : 'disabled',
    autoSendStatus: AUTO_SEND ? 'enabled' : 'disabled',
    autoUploadStatus: AUTO_UPLOAD ? 'enabled' : 'disabled',
    autoPublishStatus: AUTO_PUBLISH ? 'enabled' : 'disabled',
    manualDeliveryRequired: MANUAL_DELIVERY_REQUIRED
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshotData, null, 2), 'utf-8');

  const statusMsg = fillTemplate('briefing-delivery-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    BRIEFING_AUDIO_REVIEW_APPROVED_DIR,
    BRIEFING_FLOW_RENDERED_DIR,
    NARRATOR_TTS_RENDERED_AUDIO_DIR,
    BRIEFING_DAILY_REPORTS_DIR,
    BRIEFING_SCHEDULED_DIR,
    DELIVERY_PACKAGE_OUTPUT_DIR,
    DELIVERY_PACKAGE_MANIFESTS_DIR,
    DELIVERY_PACKAGE_LOGS_DIR,
    DELIVERY_PACKAGE_REPORTS_DIR,
    DELIVERY_PACKAGE_BLOCKED_DIR,
    AUTO_SEND: String(AUTO_SEND),
    AUTO_UPLOAD: String(AUTO_UPLOAD),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    AUTO_EMAIL: String(AUTO_EMAIL),
    AUTO_PLAYBACK: String(AUTO_PLAYBACK),
    MANUAL_DELIVERY_REQUIRED: String(MANUAL_DELIVERY_REQUIRED),
    DUPLICATE_PACKAGE_PROTECTION: String(DUPLICATE_PACKAGE_PROTECTION),
    APPROVED_AUDIO_COUNT: String(approvedCount),
    PACKAGE_COUNT: String(packageCount),
    LATEST_PACKAGE_ID: latestPackageId,
    LATEST_PACKAGE_PATH: latestPackagePath
  });

  if (!quiet) {
    console.log(statusMsg);
  }

  return snapshotData;
}

// COMMAND: scan-approved-audio
function handleScanApproved() {
  console.log(`\n======================================================`);
  console.log(`📡 Scanning Approved Briefing Audio Log files`);
  console.log(`======================================================`);

  const approvedFiles = fs.existsSync(BRIEFING_AUDIO_REVIEW_APPROVED_DIR)
    ? fs.readdirSync(BRIEFING_AUDIO_REVIEW_APPROVED_DIR).filter(f => f.startsWith('approved_audio_') && f.endsWith('.md')).sort()
    : [];

  if (approvedFiles.length === 0) {
    console.log(`*No approved briefing audio review files found.*`);
    console.log(`💡 Note: Please run "briefing-audio-playback-review approve-audio <AUDIO_ID>" first.`);
  } else {
    approvedFiles.forEach(f => {
      const audioId = f.replace('approved_audio_', '').replace('.md', '');
      const audioPath = findRenderedAudio(audioId) || 'MISSING AUDIO';
      console.log(`- Approved ID: ${audioId} | Rendered Audio File: ${audioPath}`);
    });
  }
  console.log(`======================================================\n`);
}

// COMMAND: inspect <AUDIO_ID>
function handleInspect(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const audioPath = findRenderedAudio(audioId);
  const isApproved = parseApprovedStatus(audioId);

  // Setup review status text
  const reviewStatus = isApproved ? 'APPROVED' : 'UNAPPROVED (PENDING REVIEW OR REJECTED)';
  const eligibilityStatus = isApproved && audioPath ? 'ELIGIBLE' : 'INELIGIBLE';
  const eligibilityReason = isApproved 
    ? (audioPath ? 'Audio approved and rendered file discovered.' : 'Audio approved but source rendered audio is missing!')
    : 'Audio has not passed the playback review gate approval process.';

  const reviewLogPath = path.join(BRIEFING_AUDIO_REVIEW_APPROVED_DIR, `approved_audio_${audioId}.md`);
  const dailyReportPath = path.join(BRIEFING_DAILY_REPORTS_DIR, `voice_ops_daily_report_${audioId.replace('briefing_', '')}.md`);
  const scheduledBriefingPath = path.join(BRIEFING_SCHEDULED_DIR, 'approved', `briefing_${audioId.replace('briefing_', '')}.json`);

  const inspectMsg = fillTemplate('briefing-delivery-inspect-template.md', {
    TIMESTAMP: new Date().toISOString(),
    AUDIO_ID: audioId,
    RENDER_PATH: audioPath || 'None',
    FILE_SIZE_BYTES: audioPath ? String(fs.statSync(audioPath).size) : '0',
    AUDIO_FORMAT: audioPath ? path.extname(audioPath).replace('.', '') : 'None',
    CREATED_TIMESTAMP: audioPath ? fs.statSync(audioPath).mtime.toISOString() : 'None',
    REVIEW_LOG_PATH: fs.existsSync(reviewLogPath) ? reviewLogPath : 'None',
    REVIEW_STATUS: reviewStatus,
    DAILY_REPORT_PATH: fs.existsSync(dailyReportPath) ? dailyReportPath : 'None',
    SCHEDULED_BRIEFING_PATH: fs.existsSync(scheduledBriefingPath) ? scheduledBriefingPath : 'None',
    ELIGIBILITY_STATUS: eligibilityStatus,
    ELIGIBILITY_REASON: eligibilityReason
  });

  console.log(inspectMsg);

  if (eligibilityStatus === 'INELIGIBLE') {
    process.exit(1);
  }
}

// COMMAND: create-package <AUDIO_ID>
function handleCreatePackage(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const audioPath = findRenderedAudio(audioId);
  const isApproved = parseApprovedStatus(audioId);

  const timestampStr = new Date().toISOString();

  // Validate approval status
  if (!isApproved) {
    logEvent(`BLOCKED: Attempted to package unapproved audio ID: ${audioId}`);
    
    // Write blocked report
    const blockedReportPath = path.join(DELIVERY_PACKAGE_BLOCKED_DIR, `blocked_package_${audioId}.md`);
    const blockedMsg = `## Blocked Package Attempt: ${audioId}\n*Timestamp: ${timestampStr}*\nReason: Audio has not been approved in playback review gate.`;
    fs.writeFileSync(blockedReportPath, blockedMsg, 'utf-8');

    const errMsg = fillTemplate('briefing-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      AUDIO_ID: audioId,
      COMMAND: 'create-package',
      FAILURE_CATEGORY: 'Unapproved Audio Blocker',
      ERROR_TEXT: `Cannot create delivery package because Audio ID "${audioId}" has not been approved. Run "npm run briefing-audio-playback-review mark-reviewed" and "approve-audio" first.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // Validate audio exists
  if (!audioPath) {
    logEvent(`BLOCKED: Rendered audio file missing for approved ID: ${audioId}`);
    const errMsg = fillTemplate('briefing-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      AUDIO_ID: audioId,
      COMMAND: 'create-package',
      FAILURE_CATEGORY: 'Missing Rendered Audio',
      ERROR_TEXT: `Approved audio ID "${audioId}" exists, but the physical rendered audio file was not found in source directories.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  const packageId = `delivery_package_${audioId}`;
  const packageDir = path.join(DELIVERY_PACKAGE_OUTPUT_DIR, packageId);

  // Duplicate protection
  if (fs.existsSync(packageDir)) {
    if (DUPLICATE_PACKAGE_PROTECTION) {
      logEvent(`BLOCKED: Duplicate package creation blocked for ID: ${packageId}`);
      const errMsg = fillTemplate('briefing-delivery-error-template.md', {
        TIMESTAMP: timestampStr,
        AUDIO_ID: audioId,
        COMMAND: 'create-package',
        FAILURE_CATEGORY: 'Duplicate Package Blocked',
        ERROR_TEXT: `A delivery package folder already exists for package ID "${packageId}" and duplicate package protection is enabled.`
      });
      console.error(errMsg);
      process.exit(1);
    } else {
      // Idempotent overwrite/skip
      console.log(`⚠️ Warning: Duplicate package directory exists. Overwriting due to idempotent configuration...`);
      logEvent(`Idempotent overwrite of package ID: ${packageId}`);
    }
  }

  // Create package folder
  fs.mkdirSync(packageDir, { recursive: true });

  const copiedFiles: Array<{ name: string; relativePath: string; size: number; checksum: string }> = [];

  // 1. Copy Audio File
  const audioExt = path.extname(audioPath);
  const audioDestName = `narrator_audio_${audioId}${audioExt}`;
  const audioDestPath = path.join(packageDir, audioDestName);
  fs.copyFileSync(audioPath, audioDestPath);
  copiedFiles.push({
    name: audioDestName,
    relativePath: audioDestName,
    size: fs.statSync(audioDestPath).size,
    checksum: getSHA256(audioDestPath)
  });

  // Helper to copy optional metadata files
  function copyOptionalFile(srcPath: string, destName: string) {
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(packageDir, destName);
      fs.copyFileSync(srcPath, destPath);
      copiedFiles.push({
        name: destName,
        relativePath: destName,
        size: fs.statSync(destPath).size,
        checksum: getSHA256(destPath)
      });
      return true;
    }
    return false;
  }

  // Extract date suffix for file matching (e.g. 2026-05-31 from briefing_2026-05-31)
  const dateSuffix = audioId.replace('briefing_', '');

  // 2. Copy source daily report
  const reportSrc = path.join(BRIEFING_DAILY_REPORTS_DIR, `voice_ops_daily_report_${dateSuffix}.md`);
  copyOptionalFile(reportSrc, `voice_ops_daily_report_${dateSuffix}.md`);

  // 3. Copy scheduled briefing summary
  const briefingSrc = path.join(BRIEFING_SCHEDULED_DIR, 'approved', `briefing_${dateSuffix}.json`);
  copyOptionalFile(briefingSrc, `briefing_${dateSuffix}.json`);

  // 4. Copy TTS render approval report
  const ttsReportSrc = path.join(BRIEFING_TTS_REPORTS_DIR, `render_briefing_${dateSuffix}.md`);
  copyOptionalFile(ttsReportSrc, `render_briefing_${dateSuffix}.md`);

  // 5. Copy playback review decision
  const reviewSrc = path.join(BRIEFING_AUDIO_REVIEW_APPROVED_DIR, `approved_audio_${audioId}.md`);
  copyOptionalFile(reviewSrc, `approved_audio_${audioId}.md`);

  // 6. Copy lifecycle reference if available
  const lifecycleSrc = path.join(process.cwd(), 'outputs/narrator/voice_lifecycle_audit/reports', `lifecycle_timeline_${dateSuffix}.md`);
  copyOptionalFile(lifecycleSrc, `lifecycle_timeline_${dateSuffix}.md`);

  // 7. Write delivery notes
  const notesDestName = 'delivery_notes.md';
  const notesContent = fillTemplate('briefing-delivery-notes-template.md', {
    PACKAGE_ID: packageId,
    PACKAGE_DIR: packageDir,
    AUDIO_FILE: audioDestName,
    MANIFEST_FILE: 'package_manifest.json',
    SOURCE_REPORT: fs.existsSync(reportSrc) ? `voice_ops_daily_report_${dateSuffix}.md` : 'None'
  });
  const notesDestPath = path.join(packageDir, notesDestName);
  fs.writeFileSync(notesDestPath, notesContent, 'utf-8');
  copiedFiles.push({
    name: notesDestName,
    relativePath: notesDestName,
    size: fs.statSync(notesDestPath).size,
    checksum: getSHA256(notesDestPath)
  });

  // 8. Generate package_manifest.json
  const manifestJson = {
    packageId,
    audioId,
    timestamp: timestampStr,
    files: copiedFiles
  };
  const manifestJsonPath = path.join(packageDir, 'package_manifest.json');
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2), 'utf-8');

  // Copy manifest.json to manifests directory
  const manifestJsonGlobalPath = path.join(DELIVERY_PACKAGE_MANIFESTS_DIR, `manifest_${packageId}.json`);
  fs.writeFileSync(manifestJsonGlobalPath, JSON.stringify(manifestJson, null, 2), 'utf-8');

  // 9. Generate package_manifest.md
  let tableRows = '';
  copiedFiles.forEach(f => {
    tableRows += `| \`${f.name}\` | ${f.size} | \`${f.checksum}\` |\n`;
  });
  const fileManifestTable = `| File Name | Size (Bytes) | SHA256 Checksum |\n|---|---|---|\n${tableRows}`;

  const manifestMdContent = fillTemplate('briefing-delivery-package-manifest-template.md', {
    PACKAGE_ID: packageId,
    AUDIO_ID: audioId,
    PACKAGE_DIR: packageDir,
    VERIFICATION_STATUS: 'VERIFIED (CHECKSUM GENERATED)',
    TIMESTAMP: timestampStr,
    FILE_MANIFEST_TABLE: fileManifestTable
  });

  const manifestMdPath = path.join(packageDir, 'package_manifest.md');
  fs.writeFileSync(manifestMdPath, manifestMdContent, 'utf-8');

  // Copy manifest.md to manifests directory
  const manifestMdGlobalPath = path.join(DELIVERY_PACKAGE_MANIFESTS_DIR, `manifest_${packageId}.md`);
  fs.writeFileSync(manifestMdGlobalPath, manifestMdContent, 'utf-8');

  logEvent(`SUCCESS: Created delivery package ${packageId} containing ${copiedFiles.length} files.`);
  console.log(`\n======================================================`);
  console.log(`✅ Success: Delivery Package Created`);
  console.log(`======================================================`);
  console.log(`- Package ID   : ${packageId}`);
  console.log(`- Location     : ${packageDir}`);
  console.log(`- Files Copied : ${copiedFiles.length}`);
  console.log(`- Manifests    : ${manifestJsonGlobalPath}`);
  console.log(`                 ${manifestMdGlobalPath}`);
  console.log(`======================================================\n`);

  // Update status snapshot
  handleStatus(true);
}

// COMMAND: package-status <PACKAGE_ID>
function handlePackageStatus(packageId: string) {
  const packageDir = path.join(DELIVERY_PACKAGE_OUTPUT_DIR, packageId);
  if (!fs.existsSync(packageDir)) {
    console.error(`❌ Error: Package directory does not exist for ID "${packageId}".`);
    process.exit(1);
  }

  const manifestPath = path.join(packageDir, 'package_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: Manifest file missing for package ID "${packageId}".`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const verification = verifyPackageFiles(packageId);

  console.log(`\n======================================================`);
  console.log(`📦 Package Status: "${packageId}"`);
  console.log(`======================================================`);
  console.log(`- Package ID   : ${manifest.packageId}`);
  console.log(`- Source Audio : ${manifest.audioId}`);
  console.log(`- Created At   : ${manifest.timestamp}`);
  console.log(`- Location     : ${packageDir}`);
  console.log(`- Integrity    : [${verification.valid ? 'VERIFIED' : 'INVALID'}]`);
  if (!verification.valid) {
    console.log(`  - Issues:`);
    verification.errors.forEach(err => console.log(`    * ${err}`));
  }
  console.log(`- Included Files:`);
  manifest.files.forEach((f: any) => {
    console.log(`  * ${f.name} (${f.size} bytes)`);
  });
  console.log(`======================================================\n`);
}

// COMMAND: list-packages
function handleListPackages() {
  console.log(`\n======================================================`);
  console.log(`📁 Listing All Local Delivery Packages`);
  console.log(`======================================================`);

  const packagesList = fs.existsSync(DELIVERY_PACKAGE_OUTPUT_DIR)
    ? fs.readdirSync(DELIVERY_PACKAGE_OUTPUT_DIR).filter(f => f.startsWith('delivery_package_')).sort()
    : [];

  if (packagesList.length === 0) {
    console.log(`*No delivery packages have been generated yet.*`);
  } else {
    packagesList.forEach(pkgId => {
      const verification = verifyPackageFiles(pkgId);
      console.log(`- ID: ${pkgId} | Integrity: [${verification.valid ? 'VERIFIED' : 'CORRUPTED'}]`);
    });
  }
  console.log(`======================================================\n`);
}

// COMMAND: latest
function handleLatest() {
  const packagesList = fs.existsSync(DELIVERY_PACKAGE_OUTPUT_DIR)
    ? fs.readdirSync(DELIVERY_PACKAGE_OUTPUT_DIR).filter(f => f.startsWith('delivery_package_')).sort()
    : [];

  console.log(`\n======================================================`);
  console.log(`📦 Latest Delivery Package Context`);
  console.log(`======================================================`);

  if (packagesList.length === 0) {
    console.log(`No local delivery packages found.`);
  } else {
    const latestPkgId = packagesList[packagesList.length - 1];
    const packageDir = path.join(DELIVERY_PACKAGE_OUTPUT_DIR, latestPkgId);
    const verification = verifyPackageFiles(latestPkgId);

    console.log(`Latest Package:`);
    console.log(`  - ID: ${latestPkgId}`);
    console.log(`  - Location: ${packageDir}`);
    console.log(`  - Integrity: [${verification.valid ? 'VERIFIED' : 'INVALID'}]`);
  }
  console.log(`======================================================\n`);
}

// COMMAND: export-manifest <PACKAGE_ID>
function handleExportManifest(packageId: string) {
  const packageDir = path.join(DELIVERY_PACKAGE_OUTPUT_DIR, packageId);
  const manifestMdPath = path.join(packageDir, 'package_manifest.md');

  if (!fs.existsSync(manifestMdPath)) {
    console.error(`❌ Error: Manifest markdown not found for Package ID "${packageId}".`);
    process.exit(1);
  }

  const content = fs.readFileSync(manifestMdPath, 'utf-8');
  console.log(content);
}

// COMMAND: verify-package <PACKAGE_ID>
function handleVerifyPackage(packageId: string) {
  console.log(`📡 Verifying package integrity: ${packageId}...`);
  const verification = verifyPackageFiles(packageId);

  if (verification.valid) {
    console.log(`✅ Success: Package "${packageId}" integrity verified. Checksums match exactly.`);
    logEvent(`VERIFY SUCCESS: Package ${packageId} verified successfully.`);
  } else {
    console.error(`❌ Failure: Package "${packageId}" integrity check failed.`);
    verification.errors.forEach(err => console.error(`  - ${err}`));
    logEvent(`VERIFY FAILURE: Package ${packageId} integrity failure: ${verification.errors.join(', ')}`);
    process.exit(1);
  }
}

// COMMAND: delivery-summary
function handleDeliverySummary() {
  const approvedCount = countFiles(BRIEFING_AUDIO_REVIEW_APPROVED_DIR, f => f.startsWith('approved_audio_') && f.endsWith('.md'));
  
  const packagesList = fs.existsSync(DELIVERY_PACKAGE_OUTPUT_DIR)
    ? fs.readdirSync(DELIVERY_PACKAGE_OUTPUT_DIR).filter(f => f.startsWith('delivery_package_')).sort()
    : [];
  
  let detailsList = '';
  if (packagesList.length === 0) {
    detailsList = '*No delivery packages currently generated.*';
  } else {
    packagesList.forEach(pkgId => {
      const verification = verifyPackageFiles(pkgId);
      detailsList += `- Package ID: \`${pkgId}\` | Integrity: **[${verification.valid ? 'VERIFIED' : 'FAILED'}]**\n`;
    });
  }

  let latestPackageId = 'None';
  if (packagesList.length > 0) {
    latestPackageId = packagesList[packagesList.length - 1];
  }

  const summaryContent = fillTemplate('briefing-delivery-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    APPROVED_AUDIO_COUNT: String(approvedCount),
    PACKAGE_COUNT: String(packagesList.length),
    LATEST_PACKAGE_ID: latestPackageId,
    DUPLICATE_PROTECTION: DUPLICATE_PACKAGE_PROTECTION ? 'enabled' : 'disabled',
    AUTO_SEND: String(AUTO_SEND),
    AUTO_UPLOAD: String(AUTO_UPLOAD),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    AUTO_PLAYBACK: String(AUTO_PLAYBACK),
    MANUAL_DELIVERY_REQUIRED: String(MANUAL_DELIVERY_REQUIRED),
    PACKAGE_DETAILS_LIST: detailsList
  });

  const summaryReportPath = path.join(DELIVERY_PACKAGE_REPORTS_DIR, 'delivery_summary_report.md');
  fs.writeFileSync(summaryReportPath, summaryContent, 'utf-8');
  logEvent(`Report Generated: Delivery summary written to ${summaryReportPath}`);

  console.log(summaryContent);
  console.log(`💡 Report saved to: ${summaryReportPath}`);
}

// COMMAND: exporter-log
function handleExporterLog() {
  let logsContent = 'No exporter log events recorded.';
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
    logsContent = lines.slice(-20).join('\n');
  }

  const logMsg = fillTemplate('briefing-delivery-log-template.md', {
    TIMESTAMP: new Date().toISOString(),
    LOG_PATH: LOG_FILE,
    LOG_ENTRIES: logsContent
  });

  console.log(logMsg);
}

// CLI Router
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].trim().toLowerCase() : '';
  const param = args[1] ? args[1].trim() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'scan-approved-audio':
      handleScanApproved();
      break;
    case 'inspect':
      if (!param) {
        console.error('❌ Error: Missing <AUDIO_ID> parameter.');
        process.exit(1);
      }
      handleInspect(param);
      break;
    case 'create-package':
      if (!param) {
        console.error('❌ Error: Missing <AUDIO_ID> parameter.');
        process.exit(1);
      }
      handleCreatePackage(param);
      break;
    case 'package-status':
      if (!param) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handlePackageStatus(param);
      break;
    case 'list-packages':
      handleListPackages();
      break;
    case 'latest':
      handleLatest();
      break;
    case 'export-manifest':
      if (!param) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleExportManifest(param);
      break;
    case 'verify-package':
      if (!param) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleVerifyPackage(param);
      break;
    case 'delivery-summary':
      handleDeliverySummary();
      break;
    case 'exporter-log':
      handleExporterLog();
      break;
    default:
      console.error(`❌ Error: Unknown command "${command}". Run npm run briefing-delivery-package-exporter-help for guidance.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal execution error: ${err}`);
  process.exit(1);
});
