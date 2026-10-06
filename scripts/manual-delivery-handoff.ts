import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  DELIVERY_PACKAGE_DIR,
  DELIVERY_MANIFEST_DIR,
  HANDOFF_ROOT,
  HANDOFF_CHECKLIST_DIR,
  HANDOFF_APPROVED_DIR,
  HANDOFF_REJECTED_DIR,
  HANDOFF_LOGS_DIR,
  HANDOFF_REPORTS_DIR,
  ALLOWED_PACKAGE_STATUS,
  REQUIRED_MANIFEST_FILES,
  REQUIRED_REVIEW_STATUS,
  REQUIRE_CHECKSUM_VERIFICATION,
  REQUIRE_MANUAL_SIGNER,
  REQUIRE_HANDOFF_NOTE,
  AUTO_SEND,
  AUTO_UPLOAD,
  AUTO_PUBLISH,
  AUTO_EMAIL,
  AUTO_PLAYBACK,
  MANUAL_DELIVERY_REQUIRED,
  DUPLICATE_HANDOFF_PROTECTION
} from '../config/manual-delivery-handoff.config.js';

// Ensure all target directories exist
const dirs = [
  HANDOFF_ROOT,
  HANDOFF_CHECKLIST_DIR,
  HANDOFF_APPROVED_DIR,
  HANDOFF_REJECTED_DIR,
  HANDOFF_LOGS_DIR,
  HANDOFF_REPORTS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(HANDOFF_LOGS_DIR, 'manual_delivery_handoff.log');
const SNAPSHOT_JSON_FILE = path.join(HANDOFF_REPORTS_DIR, 'dashboard_manual_delivery_snapshot.json');

function logEvent(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/manual_delivery_handoff', templateName);
  if (!fs.existsSync(templatePath)) {
    return `Error: Template not found at ${templatePath}`;
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

function normalizePackageId(input: string): string {
  let id = input.trim();
  id = id.replace(/^delivery_package_/i, '');
  return `delivery_package_${id}`;
}

function countFiles(dir: string, filter?: (file: string) => boolean): number {
  if (!fs.existsSync(dir)) return 0;
  let list = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  if (filter) {
    list = list.filter(filter);
  }
  return list.length;
}

function getSHA256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Verify package files against manifest
function verifyPackageFiles(packageId: string): { valid: boolean; errors: string[]; files: any[] } {
  const packageDir = path.join(DELIVERY_PACKAGE_DIR, packageId);
  const manifestPath = path.join(packageDir, 'package_manifest.json');
  const errors: string[] = [];
  const filesList: any[] = [];

  if (!fs.existsSync(packageDir)) {
    return { valid: false, errors: [`Package folder missing at ${packageDir}`], files: [] };
  }

  if (!fs.existsSync(manifestPath)) {
    return { valid: false, errors: [`Manifest file missing at ${manifestPath}`], files: [] };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    for (const f of manifest.files) {
      const fullPath = path.join(packageDir, f.relativePath);
      if (!fs.existsSync(fullPath)) {
        errors.push(`File missing in package: ${f.relativePath}`);
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

// Parse checklist completion
function parseChecklistStatus(packageId: string): { completed: string[]; pending: string[]; total: number } {
  const checklistPath = path.join(HANDOFF_CHECKLIST_DIR, `checklist_${packageId}.md`);
  const completed: string[] = [];
  const pending: string[] = [];

  if (!fs.existsSync(checklistPath)) {
    return { completed, pending, total: 0 };
  }

  const lines = fs.readFileSync(checklistPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^-\s+\[(x|\s*)\]\s+`([^`]+)`/i);
    if (match) {
      const isChecked = match[1].trim().toLowerCase() === 'x';
      const itemId = match[2];
      if (isChecked) {
        completed.push(itemId);
      } else {
        pending.push(itemId);
      }
    }
  }

  return { completed, pending, total: completed.length + pending.length };
}

// Get Handoff Record Verdict Status
function getHandoffVerdict(packageId: string): 'None' | 'APPROVED' | 'REJECTED' {
  const appPath = path.join(HANDOFF_APPROVED_DIR, `approved_${packageId}.md`);
  if (fs.existsSync(appPath)) return 'APPROVED';
  
  const rejPath = path.join(HANDOFF_REJECTED_DIR, `rejected_${packageId}.md`);
  if (fs.existsSync(rejPath)) return 'REJECTED';

  return 'None';
}

// COMMAND: status
function handleStatus(quiet = false) {
  const packagesList = fs.existsSync(DELIVERY_PACKAGE_DIR)
    ? fs.readdirSync(DELIVERY_PACKAGE_DIR).filter(f => f.startsWith('delivery_package_'))
    : [];
  const packageCount = packagesList.length;

  const checklistCount = countFiles(HANDOFF_CHECKLIST_DIR, f => f.startsWith('checklist_') && f.endsWith('.md'));
  const approvedCount = countFiles(HANDOFF_APPROVED_DIR, f => f.startsWith('approved_') && f.endsWith('.md'));
  const rejectedCount = countFiles(HANDOFF_REJECTED_DIR, f => f.startsWith('rejected_') && f.endsWith('.md'));

  // Calculate completed checklists count
  let completedChecklistCount = 0;
  packagesList.forEach(pkgId => {
    const status = parseChecklistStatus(pkgId);
    if (status.total > 0 && status.pending.length === 0) {
      completedChecklistCount++;
    }
  });

  let latestPackageId = 'None';
  let latestHandoffStatus = 'None';
  let latestSigner = 'None';

  // Get latest handoff record if exists
  const approvedRecords = fs.existsSync(HANDOFF_APPROVED_DIR)
    ? fs.readdirSync(HANDOFF_APPROVED_DIR).filter(f => f.startsWith('approved_') && f.endsWith('.md')).sort()
    : [];
  const rejectedRecords = fs.existsSync(HANDOFF_REJECTED_DIR)
    ? fs.readdirSync(HANDOFF_REJECTED_DIR).filter(f => f.startsWith('rejected_') && f.endsWith('.md')).sort()
    : [];

  const allRecords = [
    ...approvedRecords.map(f => ({ name: f, verdict: 'APPROVED', mtime: fs.statSync(path.join(HANDOFF_APPROVED_DIR, f)).mtimeMs })),
    ...rejectedRecords.map(f => ({ name: f, verdict: 'REJECTED', mtime: fs.statSync(path.join(HANDOFF_REJECTED_DIR, f)).mtimeMs }))
  ].sort((a, b) => b.mtime - a.mtime);

  if (allRecords.length > 0) {
    const latest = allRecords[0];
    const recId = latest.name.replace(/(approved_|rejected_)/, '').replace('.md', '');
    latestPackageId = recId;
    latestHandoffStatus = latest.verdict;

    const fullPath = latest.verdict === 'APPROVED' 
      ? path.join(HANDOFF_APPROVED_DIR, latest.name) 
      : path.join(HANDOFF_REJECTED_DIR, latest.name);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const signerMatch = content.match(/Human Signer Identity:\s+\*?\*?([^*]+)\*?\*?/i);
      if (signerMatch) {
        latestSigner = signerMatch[1].trim();
      }
    }
  } else if (packageCount > 0) {
    const sortedPkgs = packagesList.sort();
    latestPackageId = sortedPkgs[sortedPkgs.length - 1];
  }

  const snapshotData = {
    packageCount: packageCount,
    checklistCount: checklistCount,
    completedChecklistCount: completedChecklistCount,
    approvedHandoffCount: approvedCount,
    rejectedHandoffCount: rejectedCount,
    latestPackageId: latestPackageId,
    latestHandoffStatus: latestHandoffStatus,
    latestSigner: latestSigner,
    autoSendStatus: AUTO_SEND ? 'enabled' : 'disabled',
    autoUploadStatus: AUTO_UPLOAD ? 'enabled' : 'disabled',
    autoPublishStatus: AUTO_PUBLISH ? 'enabled' : 'disabled',
    manualDeliveryRequired: MANUAL_DELIVERY_REQUIRED
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshotData, null, 2), 'utf-8');

  const statusMsg = fillTemplate('manual-delivery-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    DELIVERY_PACKAGE_DIR,
    DELIVERY_MANIFEST_DIR,
    HANDOFF_CHECKLIST_DIR,
    HANDOFF_APPROVED_DIR,
    HANDOFF_REJECTED_DIR,
    HANDOFF_LOGS_DIR,
    HANDOFF_REPORTS_DIR,
    AUTO_SEND: String(AUTO_SEND),
    AUTO_UPLOAD: String(AUTO_UPLOAD),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    AUTO_EMAIL: String(AUTO_EMAIL),
    AUTO_PLAYBACK: String(AUTO_PLAYBACK),
    MANUAL_DELIVERY_REQUIRED: String(MANUAL_DELIVERY_REQUIRED),
    DUPLICATE_HANDOFF_PROTECTION: String(DUPLICATE_HANDOFF_PROTECTION),
    PACKAGE_COUNT: String(packageCount),
    CHECKLIST_COUNT: String(checklistCount),
    APPROVED_COUNT: String(approvedCount),
    REJECTED_COUNT: String(rejectedCount),
    LATEST_PACKAGE_ID: latestPackageId,
    LATEST_HANDOFF_STATUS: latestHandoffStatus,
    LATEST_SIGNER: latestSigner
  });

  if (!quiet) {
    console.log(statusMsg);
  }

  return snapshotData;
}

// COMMAND: scan-packages
function handleScanPackages() {
  console.log(`\n======================================================`);
  console.log(`📡 Scanning Local Briefing Delivery Packages`);
  console.log(`======================================================`);

  const packagesList = fs.existsSync(DELIVERY_PACKAGE_DIR)
    ? fs.readdirSync(DELIVERY_PACKAGE_DIR).filter(f => f.startsWith('delivery_package_')).sort()
    : [];

  if (packagesList.length === 0) {
    console.log(`*No delivery packages discovered.*`);
    console.log(`💡 Note: Please run "briefing-delivery-package-exporter create-package <AUDIO_ID>" first.`);
  } else {
    packagesList.forEach(pkgId => {
      const integrity = verifyPackageFiles(pkgId);
      const checklist = parseChecklistStatus(pkgId);
      const handoff = getHandoffVerdict(pkgId);

      let checklistInfo = 'Checklist Missing';
      if (checklist.total > 0) {
        checklistInfo = `Checklist: [${checklist.completed.length}/${checklist.total} items]`;
      }

      console.log(`- Package ID: ${pkgId} | Integrity: [${integrity.valid ? 'VERIFIED' : 'FAILED'}] | ${checklistInfo} | Handoff: [${handoff}]`);
    });
  }
  console.log(`======================================================\n`);
}

// COMMAND: inspect <PACKAGE_ID>
function handleInspect(rawPackageId: string) {
  const packageId = normalizePackageId(rawPackageId);
  const packageDir = path.join(DELIVERY_PACKAGE_DIR, packageId);
  const packageExists = fs.existsSync(packageDir);

  if (!packageExists) {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      PACKAGE_ID: packageId,
      COMMAND: 'inspect',
      FAILURE_CATEGORY: 'Missing Package Blocker',
      ERROR_TEXT: `Delivery package "${packageId}" does not exist in output directory. Verify N5N output first.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  const manifestPath = path.join(packageDir, 'package_manifest.json');
  const manifestMdPath = path.join(packageDir, 'package_manifest.md');
  const manifestsExist = fs.existsSync(manifestPath) && fs.existsSync(manifestMdPath);
  const manifestFilesStatus = manifestsExist ? 'PRESENT' : 'MISSING REQUIRED FILES';

  const integrity = verifyPackageFiles(packageId);
  const checksumStatus = integrity.valid ? 'VERIFIED (PASS)' : 'FAILED: ' + integrity.errors.join(', ');

  // Fetch approved audio status
  let reviewStatus = 'UNKNOWN';
  const manifestJsonPath = path.join(packageDir, 'package_manifest.json');
  if (fs.existsSync(manifestJsonPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));
      const audioId = manifest.audioId;
      const approvedAudioLog = path.join(process.cwd(), 'outputs/narrator/briefing_audio_playback_review/approved', `approved_audio_${audioId}.md`);
      reviewStatus = fs.existsSync(approvedAudioLog) ? 'APPROVED' : 'UNAPPROVED';
    } catch (e) {
      reviewStatus = 'ERROR READING MANIFEST';
    }
  }

  const checklistStatusRaw = parseChecklistStatus(packageId);
  const checklistStatus = checklistStatusRaw.total > 0
    ? `INITIALIZED (${checklistStatusRaw.completed.length}/${checklistStatusRaw.total} items complete)`
    : 'NOT INITIALIZED';

  const prevHandoff = getHandoffVerdict(packageId);

  const eligible = packageExists && manifestsExist && integrity.valid && reviewStatus === 'APPROVED';
  const eligibilityStatus = eligible ? 'READY FOR CHECKLIST SIGN-OFF' : 'INELIGIBLE';
  let eligibilityReason = 'Package is eligible for handoff sign-off checklist.';
  if (!eligible) {
    eligibilityReason = `Inspection failed due to: ${!packageExists ? 'Missing package folder; ' : ''}${!manifestsExist ? 'Missing manifest files; ' : ''}${!integrity.valid ? 'Checksum failures; ' : ''}${reviewStatus !== 'APPROVED' ? 'Audio is not approved; ' : ''}`;
  }

  const inspectMsg = fillTemplate('manual-delivery-inspect-template.md', {
    TIMESTAMP: new Date().toISOString(),
    PACKAGE_ID: packageId,
    PACKAGE_PATH: packageDir,
    PACKAGE_EXISTS: String(packageExists),
    MANIFEST_FILES_STATUS: manifestFilesStatus,
    CHECKSUM_STATUS: checksumStatus,
    REVIEW_STATUS: reviewStatus,
    CHECKLIST_STATUS: checklistStatus,
    ELIGIBILITY_STATUS: eligibilityStatus,
    ELIGIBILITY_REASON: eligibilityReason,
    PREVIOUS_HANDOFF_STATE: prevHandoff
  });

  console.log(inspectMsg);

  if (!eligible) {
    process.exit(1);
  }
}

// COMMAND: create-checklist <PACKAGE_ID>
function handleCreateChecklist(rawPackageId: string) {
  const packageId = normalizePackageId(rawPackageId);
  const packageDir = path.join(DELIVERY_PACKAGE_DIR, packageId);

  if (!fs.existsSync(packageDir)) {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      PACKAGE_ID: packageId,
      COMMAND: 'create-checklist',
      FAILURE_CATEGORY: 'Missing Package Blocker',
      ERROR_TEXT: `Cannot create checklist because delivery package folder "${packageId}" does not exist.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  const checklistPath = path.join(HANDOFF_CHECKLIST_DIR, `checklist_${packageId}.md`);
  if (fs.existsSync(checklistPath)) {
    console.log(`⚠️ Warning: Checklist for package "${packageId}" already exists at ${checklistPath}.`);
    logEvent(`CHECKLIST WARN: Duplicate creation skipped for ${packageId}`);
    return;
  }

  // Pre-run automated integrity checks to auto-mark checklist items
  const manifestJsonPath = path.join(packageDir, 'package_manifest.json');
  const manifestMdPath = path.join(packageDir, 'package_manifest.md');
  const manifestJsonExists = fs.existsSync(manifestJsonPath);
  const manifestMdExists = fs.existsSync(manifestMdPath);

  const integrity = verifyPackageFiles(packageId);
  const checksumVerification = integrity.valid;

  // Read manifest to check audio ID and other files
  let audioIncluded = false;
  let dailyReportIncluded = false;
  let briefingSummaryIncluded = false;
  let renderReportIncluded = false;
  let playbackDecisionIncluded = false;

  if (manifestJsonExists) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));
      const fileNames = manifest.files.map((f: any) => f.name);

      audioIncluded = fileNames.some((n: string) => n.startsWith('narrator_audio_'));
      dailyReportIncluded = fileNames.some((n: string) => n.startsWith('voice_ops_daily_report_'));
      briefingSummaryIncluded = fileNames.some((n: string) => n.endsWith('.json') && !n.includes('manifest'));
      renderReportIncluded = fileNames.some((n: string) => n.startsWith('render_briefing_'));
      playbackDecisionIncluded = fileNames.some((n: string) => n.startsWith('approved_audio_'));
    } catch (e) {
      // Manifest corrupted
    }
  }

  const checklistContent = fillTemplate('manual-delivery-checklist-template.md', {
    PACKAGE_ID: packageId,
    CREATED_TIME: new Date().toISOString(),
    STATUS: 'INITIALIZED',
    manifest_json_exists: manifestJsonExists ? 'x' : ' ',
    manifest_md_exists: manifestMdExists ? 'x' : ' ',
    checksum_verification: checksumVerification ? 'x' : ' ',
    audio_included: audioIncluded ? 'x' : ' ',
    daily_report_included: dailyReportIncluded ? 'x' : ' ',
    briefing_summary_included: briefingSummaryIncluded ? 'x' : ' ',
    render_report_included: renderReportIncluded ? 'x' : ' ',
    playback_decision_included: playbackDecisionIncluded ? 'x' : ' ',
    delivery_notes_reviewed: ' ',
    signer_confirmed: ' ',
    delivery_method_selected: ' ',
    final_review_complete: ' '
  });

  fs.writeFileSync(checklistPath, checklistContent, 'utf-8');
  logEvent(`SUCCESS: Created checklist for package ${packageId}`);

  console.log(`\n======================================================`);
  console.log(`✅ Success: Handoff Checklist Created`);
  console.log(`======================================================`);
  console.log(`- Package ID   : ${packageId}`);
  console.log(`- Checklist    : ${checklistPath}`);
  console.log(`- Note         : Automated items have been auto-verified.`);
  console.log(`                 Run checklist-status to review progress.`);
  console.log(`======================================================\n`);

  handleStatus(true);
}

// COMMAND: checklist-status <PACKAGE_ID>
function handleChecklistStatus(rawPackageId: string) {
  const packageId = normalizePackageId(rawPackageId);
  const checklistPath = path.join(HANDOFF_CHECKLIST_DIR, `checklist_${packageId}.md`);

  if (!fs.existsSync(checklistPath)) {
    console.error(`❌ Error: Checklist has not been initialized for Package ID "${packageId}".`);
    console.error(`💡 Guidance: Run "npm run manual-delivery-handoff -- create-checklist ${packageId}" first.`);
    process.exit(1);
  }

  const status = parseChecklistStatus(packageId);
  const total = status.total;
  const completedCount = status.completed.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Build items display
  let displayList = '';
  const lines = fs.readFileSync(checklistPath, 'utf-8').split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('- [')) {
      displayList += line + '\n';
    }
  }

  const eligible = status.pending.length === 0;
  const readinessStatus = eligible ? 'READY FOR SIGN-OFF' : 'PENDING';
  const readinessReason = eligible 
    ? 'All required checklist items have been checked off.' 
    : `Checklist is incomplete. Remaining items to complete: ${status.pending.join(', ')}`;

  const checklistStatusMsg = fillTemplate('manual-delivery-checklist-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    PACKAGE_ID: packageId,
    CHECKLIST_PATH: checklistPath,
    COMPLETED_COUNT: String(completedCount),
    TOTAL_COUNT: String(total),
    PROGRESS_PERCENT: String(percent),
    ITEMIZED_CHECKLIST_STATUS: displayList.trim(),
    READINESS_STATUS: readinessStatus,
    READINESS_REASON: readinessReason
  });

  console.log(checklistStatusMsg);
}

// COMMAND: mark-item <PACKAGE_ID> <ITEM_ID>
function handleMarkItem(rawPackageId: string, itemId: string) {
  const packageId = normalizePackageId(rawPackageId);
  const checklistPath = path.join(HANDOFF_CHECKLIST_DIR, `checklist_${packageId}.md`);

  if (!fs.existsSync(checklistPath)) {
    console.error(`❌ Error: Checklist has not been initialized for Package ID "${packageId}".`);
    process.exit(1);
  }

  const items = [
    'manifest_json_exists', 'manifest_md_exists', 'checksum_verification',
    'audio_included', 'daily_report_included', 'briefing_summary_included',
    'render_report_included', 'playback_decision_included', 'delivery_notes_reviewed',
    'signer_confirmed', 'delivery_method_selected', 'final_review_complete'
  ];

  if (!items.includes(itemId.trim())) {
    console.error(`❌ Error: Invalid Checklist Item ID "${itemId}".`);
    console.error(`💡 Allowed IDs: \n${items.map(id => `  - ${id}`).join('\n')}`);
    process.exit(1);
  }

  let content = fs.readFileSync(checklistPath, 'utf-8');
  
  // Regex to match empty checkbox like [ ] `item_id` or [\s*] `item_id`
  const regex = new RegExp(`\\[\\s*\\]\\s*\`(${itemId.trim()})\``);
  if (regex.test(content)) {
    content = content.replace(regex, '[x] `$1`');
    fs.writeFileSync(checklistPath, content, 'utf-8');
    logEvent(`CHECKLIST MARK: Marked item ${itemId.trim()} complete for package ${packageId}`);
    console.log(`✅ Checklist item "${itemId.trim()}" marked complete for package "${packageId}".`);
    
    // Check if fully completed and log
    const status = parseChecklistStatus(packageId);
    if (status.pending.length === 0) {
      logEvent(`CHECKLIST COMPLETE: All items checked for package ${packageId}`);
      console.log(`🎉 Success: All required checklist items are now complete! Package is ready for handoff approval.`);
    }
  } else {
    // If it's already checked [x]
    if (content.includes(`[x] \`${itemId.trim()}\``)) {
      console.log(`ℹ️ Item "${itemId.trim()}" is already marked complete.`);
    } else {
      console.error(`❌ Error: Could not find checklist item "${itemId.trim()}" in ${checklistPath}.`);
    }
  }

  handleStatus(true);
}

// COMMAND: approve-handoff <PACKAGE_ID> --signer "<NAME>" --note "<NOTE>"
function handleApproveHandoff(rawPackageId: string, signer: string, note: string) {
  const packageId = normalizePackageId(rawPackageId);
  const packageDir = path.join(DELIVERY_PACKAGE_DIR, packageId);
  const timestampStr = new Date().toISOString();

  // 1. Requirements checks
  if (!fs.existsSync(packageDir)) {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'approve-handoff',
      FAILURE_CATEGORY: 'Missing Package Folder',
      ERROR_TEXT: `Package directory "${packageId}" does not exist in delivery folder.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  const manifestPath = path.join(packageDir, 'package_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'approve-handoff',
      FAILURE_CATEGORY: 'Missing Manifest JSON',
      ERROR_TEXT: `Package manifest JSON is missing from folder "${packageId}".`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // 2. Checksum check
  const integrity = verifyPackageFiles(packageId);
  if (!integrity.valid) {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'approve-handoff',
      FAILURE_CATEGORY: 'Checksum Integrity Failure',
      ERROR_TEXT: `Package checksum verification failed:\n${integrity.errors.map(e => `  - ${e}`).join('\n')}`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // 3. Signer and note validation
  if (!signer || signer.trim() === '') {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'approve-handoff',
      FAILURE_CATEGORY: 'Missing Human Signer',
      ERROR_TEXT: `Signer identity is required for approval. Add option parameter --signer "<NAME>".`
    });
    console.error(errMsg);
    process.exit(1);
  }

  if (!note || note.trim() === '') {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'approve-handoff',
      FAILURE_CATEGORY: 'Missing Handoff Note',
      ERROR_TEXT: `Delivery / review note is required for approval. Add option parameter --note "<NOTE>".`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // 4. Checklist validation
  const checklistPath = path.join(HANDOFF_CHECKLIST_DIR, `checklist_${packageId}.md`);
  if (!fs.existsSync(checklistPath)) {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'approve-handoff',
      FAILURE_CATEGORY: 'Checklist Missing',
      ERROR_TEXT: `Checklist has not been created for "${packageId}". Create it first with create-checklist.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  const status = parseChecklistStatus(packageId);
  if (status.pending.length > 0) {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'approve-handoff',
      FAILURE_CATEGORY: 'Checklist Incomplete',
      ERROR_TEXT: `Cannot approve handoff because checklist has pending items: ${status.pending.join(', ')}. Complete them using mark-item.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // Duplicate protection check
  const recordApprovedPath = path.join(HANDOFF_APPROVED_DIR, `approved_${packageId}.md`);
  if (fs.existsSync(recordApprovedPath) && DUPLICATE_HANDOFF_PROTECTION) {
    logEvent(`BLOCKED: Duplicate handoff approval attempt for ${packageId}`);
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'approve-handoff',
      FAILURE_CATEGORY: 'Duplicate Handoff Blocked',
      ERROR_TEXT: `A handoff approval record already exists for Package ID "${packageId}". Duplicate handoff protection is enabled.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // 5. Generate Approved Record file
  const recordContent = fillTemplate('manual-delivery-handoff-record-template.md', {
    RECORD_ID: `handoff_rec_approved_${packageId.replace('delivery_package_', '')}`,
    TIMESTAMP: timestampStr,
    VERDICT_STATUS: 'APPROVED',
    PACKAGE_ID: packageId,
    PACKAGE_PATH: packageDir,
    SIGNER: signer.trim(),
    NOTE: note.trim(),
    CHECKSUMS_MATCH: 'TRUE (VERIFIED PASS)'
  });

  fs.writeFileSync(recordApprovedPath, recordContent, 'utf-8');
  logEvent(`HANDOFF APPROVED: Approved handoff for package ${packageId} signed by ${signer}`);

  console.log(`\n======================================================`);
  console.log(`✅ Success: Briefing Manual Handoff Approved`);
  console.log(`======================================================`);
  console.log(`- Package ID   : ${packageId}`);
  console.log(`- Record File  : ${recordApprovedPath}`);
  console.log(`- Human Signer : ${signer}`);
  console.log(`- Ready State  : [READY FOR OFFLINE MANUAL DELIVERY]`);
  console.log(`======================================================\n`);

  handleStatus(true);
}

// COMMAND: reject-handoff <PACKAGE_ID> --signer "<NAME>" --note "<NOTE>"
function handleRejectHandoff(rawPackageId: string, signer: string, note: string) {
  const packageId = normalizePackageId(rawPackageId);
  const packageDir = path.join(DELIVERY_PACKAGE_DIR, packageId);
  const timestampStr = new Date().toISOString();

  // Validate signer and note
  if (!signer || signer.trim() === '') {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'reject-handoff',
      FAILURE_CATEGORY: 'Missing Human Signer',
      ERROR_TEXT: `Signer identity is required for rejection. Add option parameter --signer "<NAME>".`
    });
    console.error(errMsg);
    process.exit(1);
  }

  if (!note || note.trim() === '') {
    const errMsg = fillTemplate('manual-delivery-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'reject-handoff',
      FAILURE_CATEGORY: 'Missing Handoff Note',
      ERROR_TEXT: `Delivery / rejection note is required. Add option parameter --note "<NOTE>".`
    });
    console.error(errMsg);
    process.exit(1);
  }

  const recordRejectedPath = path.join(HANDOFF_REJECTED_DIR, `rejected_${packageId}.md`);

  // Generate Rejected Record file
  const recordContent = fillTemplate('manual-delivery-handoff-record-template.md', {
    RECORD_ID: `handoff_rec_rejected_${packageId.replace('delivery_package_', '')}`,
    TIMESTAMP: timestampStr,
    VERDICT_STATUS: 'REJECTED',
    PACKAGE_ID: packageId,
    PACKAGE_PATH: fs.existsSync(packageDir) ? packageDir : 'Missing package',
    SIGNER: signer.trim(),
    NOTE: note.trim(),
    CHECKSUMS_MATCH: fs.existsSync(packageDir) ? (verifyPackageFiles(packageId).valid ? 'TRUE (VERIFIED PASS)' : 'FALSE') : 'PACKAGE MISSING'
  });

  fs.writeFileSync(recordRejectedPath, recordContent, 'utf-8');
  logEvent(`HANDOFF REJECTED: Rejected handoff for package ${packageId} signed by ${signer}. Reason: ${note}`);

  console.log(`\n======================================================`);
  console.log(`❌ Reject logged: Briefing Manual Handoff Rejected`);
  console.log(`======================================================`);
  console.log("- Package ID   : " + packageId);
  console.log("- Record File  : " + recordRejectedPath);
  console.log("- Human Signer : " + signer);
  console.log("- Reason Note  : " + note);
  console.log(`- Package State: UNTOUCHED (Physical files not deleted)`);
  console.log(`======================================================\n`);

  handleStatus(true);
}

// COMMAND: handoff-status <PACKAGE_ID>
function handleHandoffStatus(rawPackageId: string) {
  const packageId = normalizePackageId(rawPackageId);
  const checklistExists = fs.existsSync(path.join(HANDOFF_CHECKLIST_DIR, `checklist_${packageId}.md`));
  const approvedExists = fs.existsSync(path.join(HANDOFF_APPROVED_DIR, `approved_${packageId}.md`));
  const rejectedExists = fs.existsSync(path.join(HANDOFF_REJECTED_DIR, `rejected_${packageId}.md`));

  let lifecycleState = 'UNINITIALIZED (No Checklist)';
  if (checklistExists) {
    lifecycleState = 'CHECKLIST PENDING';
    const status = parseChecklistStatus(packageId);
    if (status.pending.length === 0) {
      lifecycleState = 'CHECKLIST COMPLETE (PENDING SIGN-OFF)';
    }
  }

  if (rejectedExists) {
    lifecycleState = 'HANDOFF REJECTED';
  }

  if (approvedExists) {
    lifecycleState = 'HANDOFF APPROVED (READY FOR MANUAL RELEASE)';
  }

  console.log(`\n======================================================`);
  console.log(`📦 Handoff Lifecycle State: "${packageId}"`);
  console.log(`======================================================`);
  console.log(`- Package ID   : ${packageId}`);
  console.log(`- Checklist    : ${checklistExists ? 'INITIALIZED' : 'MISSING'}`);
  console.log(`- Lifecycle    : [${lifecycleState}]`);
  console.log(`- Approved File: ${approvedExists ? 'YES' : 'NO'}`);
  console.log(`- Rejected File: ${rejectedExists ? 'YES' : 'NO'}`);
  console.log(`======================================================\n`);
}

// COMMAND: list-handoffs
function handleListHandoffs() {
  console.log(`\n======================================================`);
  console.log(`📁 Listing All Local Delivery Handoff Records`);
  console.log(`======================================================`);

  const approvedList = fs.existsSync(HANDOFF_APPROVED_DIR)
    ? fs.readdirSync(HANDOFF_APPROVED_DIR).filter(f => f.startsWith('approved_') && f.endsWith('.md')).sort()
    : [];
  const rejectedList = fs.existsSync(HANDOFF_REJECTED_DIR)
    ? fs.readdirSync(HANDOFF_REJECTED_DIR).filter(f => f.startsWith('rejected_') && f.endsWith('.md')).sort()
    : [];

  console.log(`### Approved Handoffs (${approvedList.length}):`);
  if (approvedList.length === 0) {
    console.log(`  *No approved handoffs recorded yet.*`);
  } else {
    approvedList.forEach(f => {
      const pkgId = f.replace('approved_', '').replace('.md', '');
      console.log(`  - Record: ${f} (Package: ${pkgId})`);
    });
  }

  console.log(`\n### Rejected Handoffs (${rejectedList.length}):`);
  if (rejectedList.length === 0) {
    console.log(`  *No rejected handoffs recorded.*`);
  } else {
    rejectedList.forEach(f => {
      const pkgId = f.replace('rejected_', '').replace('.md', '');
      console.log(`  - Record: ${f} (Package: ${pkgId})`);
    });
  }
  console.log(`======================================================\n`);
}

// COMMAND: latest
function handleLatest() {
  const approvedList = fs.existsSync(HANDOFF_APPROVED_DIR)
    ? fs.readdirSync(HANDOFF_APPROVED_DIR).filter(f => f.startsWith('approved_') && f.endsWith('.md')).sort()
    : [];
  const rejectedList = fs.existsSync(HANDOFF_REJECTED_DIR)
    ? fs.readdirSync(HANDOFF_REJECTED_DIR).filter(f => f.startsWith('rejected_') && f.endsWith('.md')).sort()
    : [];

  const allRecords = [
    ...approvedList.map(f => ({ name: f, verdict: 'APPROVED', path: path.join(HANDOFF_APPROVED_DIR, f), mtime: fs.statSync(path.join(HANDOFF_APPROVED_DIR, f)).mtimeMs })),
    ...rejectedList.map(f => ({ name: f, verdict: 'REJECTED', path: path.join(HANDOFF_REJECTED_DIR, f), mtime: fs.statSync(path.join(HANDOFF_REJECTED_DIR, f)).mtimeMs }))
  ].sort((a, b) => b.mtime - a.mtime);

  console.log(`\n======================================================`);
  console.log(`📦 Latest Manual Handoff Context`);
  console.log(`======================================================`);

  if (allRecords.length === 0) {
    console.log(`No manual handoff records found.`);
  } else {
    const latest = allRecords[0];
    console.log(`Latest Record:`);
    console.log(`  - Record File : ${latest.name}`);
    console.log(`  - Location    : ${latest.path}`);
    console.log(`  - Verdict     : [${latest.verdict}]`);
    console.log(`  - Timestamp   : ${new Date(latest.mtime).toISOString()}`);
  }
  console.log(`======================================================\n`);
}

// COMMAND: handoff-summary
function handleHandoffSummary() {
  const packagesList = fs.existsSync(DELIVERY_PACKAGE_DIR)
    ? fs.readdirSync(DELIVERY_PACKAGE_DIR).filter(f => f.startsWith('delivery_package_'))
    : [];
  const packageCount = packagesList.length;

  const checklistCount = countFiles(HANDOFF_CHECKLIST_DIR, f => f.startsWith('checklist_') && f.endsWith('.md'));
  const approvedCount = countFiles(HANDOFF_APPROVED_DIR, f => f.startsWith('approved_') && f.endsWith('.md'));
  const rejectedCount = countFiles(HANDOFF_REJECTED_DIR, f => f.startsWith('rejected_') && f.endsWith('.md'));

  // Get details list
  const approvedFiles = fs.existsSync(HANDOFF_APPROVED_DIR)
    ? fs.readdirSync(HANDOFF_APPROVED_DIR).filter(f => f.startsWith('approved_') && f.endsWith('.md')).sort()
    : [];
  const rejectedFiles = fs.existsSync(HANDOFF_REJECTED_DIR)
    ? fs.readdirSync(HANDOFF_REJECTED_DIR).filter(f => f.startsWith('rejected_') && f.endsWith('.md')).sort()
    : [];

  let detailsList = '';
  if (approvedFiles.length === 0 && rejectedFiles.length === 0) {
    detailsList = '*No approved or rejected handoff records generated yet.*';
  } else {
    approvedFiles.forEach(f => {
      detailsList += `- Approved Handoff Record: \`${f}\` signed off for distribution.\n`;
    });
    rejectedFiles.forEach(f => {
      detailsList += `- Rejected Handoff Record: \`${f}\` marked ineligible for release.\n`;
    });
  }

  const summaryReportPath = path.join(HANDOFF_REPORTS_DIR, 'manual_delivery_handoff_summary.md');
  const summaryContent = fillTemplate('manual-delivery-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    PACKAGE_COUNT: String(packageCount),
    CHECKLIST_COUNT: String(checklistCount),
    APPROVED_COUNT: String(approvedCount),
    REJECTED_COUNT: String(rejectedCount),
    AUTO_SEND: String(AUTO_SEND),
    AUTO_UPLOAD: String(AUTO_UPLOAD),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    AUTO_PLAYBACK: String(AUTO_PLAYBACK),
    MANUAL_DELIVERY_REQUIRED: String(MANUAL_DELIVERY_REQUIRED),
    HANDOFF_DETAILS_LIST: detailsList.trim(),
    SUMMARY_REPORT_PATH: summaryReportPath
  });

  fs.writeFileSync(summaryReportPath, summaryContent, 'utf-8');
  logEvent(`Report Generated: Handoff summary written to ${summaryReportPath}`);

  console.log(summaryContent);
  console.log(`💡 Report saved to: ${summaryReportPath}`);
}

// COMMAND: handoff-log
function handleHandoffLog() {
  let logsContent = 'No handoff log events recorded.';
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
    logsContent = lines.slice(-20).join('\n');
  }

  const logMsg = fillTemplate('manual-delivery-log-template.md', {
    TIMESTAMP: new Date().toISOString(),
    LOG_PATH: LOG_FILE,
    LOG_ENTRIES: logsContent
  });

  console.log(logMsg);
}

// Parse option flags in command line arguments (e.g. --signer, --note)
function getOptionValue(flag: string): string {
  const args = process.argv;
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1].replace(/^['"]|['"]$/g, '').trim();
  }
  return '';
}

async function main() {
  const args = process.argv.slice(2);
  // Filter out option flags and their values to get standard positional arguments
  const positionalArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      i++; // Skip the flag value
      continue;
    }
    positionalArgs.push(args[i]);
  }

  const command = positionalArgs[0] ? positionalArgs[0].trim().toLowerCase() : '';
  const packageIdParam = positionalArgs[1] ? positionalArgs[1].trim() : '';
  const itemIdParam = positionalArgs[2] ? positionalArgs[2].trim() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'scan-packages':
      handleScanPackages();
      break;
    case 'inspect':
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleInspect(packageIdParam);
      break;
    case 'create-checklist':
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleCreateChecklist(packageIdParam);
      break;
    case 'checklist-status':
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleChecklistStatus(packageIdParam);
      break;
    case 'mark-item':
      if (!packageIdParam || !itemIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> or <ITEM_ID> parameter.');
        console.error('Usage: npm run manual-delivery-handoff -- mark-item <PACKAGE_ID> <ITEM_ID>');
        process.exit(1);
      }
      handleMarkItem(packageIdParam, itemIdParam);
      break;
    case 'approve-handoff': {
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      const signer = getOptionValue('--signer');
      const note = getOptionValue('--note');
      handleApproveHandoff(packageIdParam, signer, note);
      break;
    }
    case 'reject-handoff': {
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      const signer = getOptionValue('--signer');
      const note = getOptionValue('--note');
      handleRejectHandoff(packageIdParam, signer, note);
      break;
    }
    case 'handoff-status':
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleHandoffStatus(packageIdParam);
      break;
    case 'list-handoffs':
      handleListHandoffs();
      break;
    case 'latest':
      handleLatest();
      break;
    case 'handoff-summary':
      handleHandoffSummary();
      break;
    case 'handoff-log':
      handleHandoffLog();
      break;
    default:
      console.error(`❌ Error: Unknown command "${command}". Run npm run manual-delivery-handoff-help for guidance.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal execution error: ${err}`);
  process.exit(1);
});
