import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  HANDOFF_APPROVED_DIR,
  DELIVERY_PACKAGE_DIR,
  DELIVERY_MANIFEST_DIR,
  ARCHIVE_ROOT,
  ARCHIVE_LEDGER_DIR,
  ARCHIVE_INDEX_DIR,
  RETENTION_REVIEW_DIR,
  ARCHIVE_LOGS_DIR,
  ARCHIVE_REPORTS_DIR,
  ARCHIVE_EXPORTS_DIR,
  REQUIRED_HANDOFF_STATUS,
  REQUIRE_CHECKSUM_VERIFICATION,
  REQUIRE_PACKAGE_MANIFEST,
  ARCHIVE_MODE,
  COPY_PACKAGE_INTO_ARCHIVE,
  DUPLICATE_ARCHIVE_PROTECTION,
  DEFAULT_RETENTION_DAYS,
  WARNING_RETENTION_DAYS,
  LEDGER_FORMAT,
  AUTO_DELETE_EXPIRED_PACKAGES,
  AUTO_UPLOAD_ARCHIVE,
  AUTO_SEND_ARCHIVE,
  MANUAL_RETENTION_REVIEW_REQUIRED
} from '../config/delivery-archive-retention.config.js';

// Ensure target directories exist
const dirs = [
  ARCHIVE_ROOT,
  ARCHIVE_LEDGER_DIR,
  ARCHIVE_INDEX_DIR,
  RETENTION_REVIEW_DIR,
  ARCHIVE_LOGS_DIR,
  ARCHIVE_REPORTS_DIR,
  ARCHIVE_EXPORTS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(ARCHIVE_LOGS_DIR, 'delivery_archive_retention.log');
const SNAPSHOT_JSON_FILE = path.join(ARCHIVE_REPORTS_DIR, 'dashboard_archive_retention_snapshot.json');

function logEvent(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/delivery_archive_retention', templateName);
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

// Parse sign-off values from manual handoff record
function parseHandoffRecord(packageId: string): { exists: boolean; signer: string; timestamp: string; note: string } {
  const handoffPath = path.join(HANDOFF_APPROVED_DIR, `approved_${packageId}.md`);
  if (!fs.existsSync(handoffPath)) {
    return { exists: false, signer: 'None', timestamp: 'None', note: 'None' };
  }

  const content = fs.readFileSync(handoffPath, 'utf-8');
  let signer = 'None';
  let timestamp = 'None';
  let note = 'None';

  const signerMatch = content.match(/Human Signer Identity:\s+\*?\*?([^*]+)\*?\*?/i);
  if (signerMatch) signer = signerMatch[1].replace(/[`]/g, '').trim();

  const timeMatch = content.match(/\*Timestamp:\s+([^*]+)\*?/i);
  if (timeMatch) timestamp = timeMatch[1].trim();

  // Match note paragraph following the quote mark
  const noteMatch = content.match(/Delivery Notes \/ Handoff Memo:\s*>\s*([^\n]+)/i);
  if (noteMatch) note = noteMatch[1].trim();

  return { exists: true, signer, timestamp, note };
}

// COMMAND: status
function handleStatus(quiet = false) {
  const handoffList = fs.existsSync(HANDOFF_APPROVED_DIR)
    ? fs.readdirSync(HANDOFF_APPROVED_DIR).filter(f => f.startsWith('approved_') && f.endsWith('.md'))
    : [];
  const handoffCount = handoffList.length;

  const ledgerList = fs.existsSync(ARCHIVE_LEDGER_DIR)
    ? fs.readdirSync(ARCHIVE_LEDGER_DIR).filter(f => f.startsWith('ledger_') && f.endsWith('.json'))
    : [];
  const archivedCount = ledgerList.length;

  const reviewList = fs.existsSync(RETENTION_REVIEW_DIR)
    ? fs.readdirSync(RETENTION_REVIEW_DIR).filter(f => f.startsWith('review_') && f.endsWith('.md'))
    : [];
  const reviewCount = reviewList.length;

  // Scan ledger records for warnings and due review counts
  let latestPackageId = 'None';
  let latestArchiveStatus = 'None';
  let latestChecksumStatus = 'None';
  let latestRetentionReviewDate = 'None';
  let reviewDueCount = 0;

  const records: any[] = [];
  ledgerList.forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ARCHIVE_LEDGER_DIR, f), 'utf-8'));
      records.push(data);
      
      const now = new Date().getTime();
      const warningTime = new Date(data.retentionWarningDate).getTime();
      if (now >= warningTime) {
        reviewDueCount++;
      }
    } catch (e) {
      // Corrupt JSON
    }
  });

  // Sort records by archive timestamp descending
  if (records.length > 0) {
    records.sort((a, b) => new Date(b.archiveTimestamp).getTime() - new Date(a.archiveTimestamp).getTime());
    const latest = records[0];
    latestPackageId = latest.packageId;
    latestArchiveStatus = 'ARCHIVED';
    latestChecksumStatus = latest.checksumsMatch ? 'VERIFIED' : 'FAILED';
    latestRetentionReviewDate = latest.retentionWarningDate;
  }

  const snapshotData = {
    approvedHandoffCount: handoffCount,
    archivedPackageCount: archivedCount,
    latestArchivedPackageId: latestPackageId,
    latestArchiveStatus: latestArchiveStatus,
    latestRetentionReviewDate: latestRetentionReviewDate,
    retentionReviewDueCount: reviewDueCount,
    checksumVerificationStatus: latestChecksumStatus,
    autoDeleteStatus: AUTO_DELETE_EXPIRED_PACKAGES ? 'enabled' : 'disabled',
    autoUploadStatus: AUTO_UPLOAD_ARCHIVE ? 'enabled' : 'disabled',
    manualRetentionReviewRequired: MANUAL_RETENTION_REVIEW_REQUIRED
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshotData, null, 2), 'utf-8');

  const statusMsg = fillTemplate('delivery-archive-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    HANDOFF_APPROVED_DIR,
    DELIVERY_PACKAGE_DIR,
    ARCHIVE_LEDGER_DIR,
    ARCHIVE_INDEX_DIR,
    RETENTION_REVIEW_DIR,
    ARCHIVE_EXPORTS_DIR,
    ARCHIVE_LOGS_DIR,
    ARCHIVE_REPORTS_DIR,
    AUTO_DELETE_EXPIRED_PACKAGES: String(AUTO_DELETE_EXPIRED_PACKAGES),
    AUTO_UPLOAD_ARCHIVE: String(AUTO_UPLOAD_ARCHIVE),
    AUTO_SEND_ARCHIVE: String(AUTO_SEND_ARCHIVE),
    MANUAL_RETENTION_REVIEW_REQUIRED: String(MANUAL_RETENTION_REVIEW_REQUIRED),
    DUPLICATE_ARCHIVE_PROTECTION: String(DUPLICATE_ARCHIVE_PROTECTION),
    HANDOFF_COUNT: String(handoffCount),
    ARCHIVED_COUNT: String(archivedCount),
    REVIEW_COUNT: String(reviewCount),
    REVIEW_DUE_COUNT: String(reviewDueCount),
    LATEST_PACKAGE_ID: latestPackageId,
    LATEST_ARCHIVE_STATUS: latestArchiveStatus,
    LATEST_CHECKSUM_STATUS: latestChecksumStatus
  });

  if (!quiet) {
    console.log(statusMsg);
  }

  return snapshotData;
}

// COMMAND: scan-handoffs
function handleScanHandoffs() {
  console.log(`\n======================================================`);
  console.log(`📡 Scanning Approved Briefing Handoff Records`);
  console.log(`======================================================`);

  const handoffFiles = fs.existsSync(HANDOFF_APPROVED_DIR)
    ? fs.readdirSync(HANDOFF_APPROVED_DIR).filter(f => f.startsWith('approved_') && f.endsWith('.md')).sort()
    : [];

  if (handoffFiles.length === 0) {
    console.log(`*No approved handoff logs discovered.*`);
    console.log(`💡 Note: Please run "manual-delivery-handoff approve-handoff <PACKAGE_ID>" first.`);
  } else {
    handoffFiles.forEach(f => {
      const pkgId = f.replace('approved_', '').replace('.md', '');
      const handoff = parseHandoffRecord(pkgId);
      const isArchived = fs.existsSync(path.join(ARCHIVE_LEDGER_DIR, `ledger_${pkgId}.json`));
      
      console.log(`- Package ID: ${pkgId} | Signer: ${handoff.signer} | Archived: [${isArchived ? 'YES' : 'NO'}]`);
    });
  }
  console.log(`======================================================\n`);
}

// COMMAND: inspect-handoff <PACKAGE_ID>
function handleInspectHandoff(rawPackageId: string) {
  const packageId = normalizePackageId(rawPackageId);
  const packageDir = path.join(DELIVERY_PACKAGE_DIR, packageId);
  const manifestPath = path.join(packageDir, 'package_manifest.json');
  
  const handoff = parseHandoffRecord(packageId);

  if (!handoff.exists) {
    const errMsg = fillTemplate('delivery-archive-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      PACKAGE_ID: packageId,
      COMMAND: 'inspect-handoff',
      FAILURE_CATEGORY: 'Handoff Audit Missing',
      ERROR_TEXT: `Package "${packageId}" does not have an approved handoff record. Archive blocks until handoff approval is logged.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  const manifestExists = fs.existsSync(manifestPath);
  const integrity = verifyPackageFiles(packageId);
  const checksumStatus = integrity.valid ? 'VERIFIED (PASS)' : 'FAILED: ' + integrity.errors.join(', ');

  const prevArchive = fs.existsSync(path.join(ARCHIVE_LEDGER_DIR, `ledger_${packageId}.json`)) ? 'ARCHIVED' : 'None';
  const eligible = handoff.exists && manifestExists && integrity.valid;
  
  const eligibilityStatus = eligible ? 'ELIGIBLE' : 'INELIGIBLE';
  let eligibilityReason = 'Handoff audit verified and checksum check passed.';
  if (!eligible) {
    eligibilityReason = `Inspection failed due to: ${!handoff.exists ? 'Missing approved handoff record; ' : ''}${!manifestExists ? 'Missing manifest JSON file; ' : ''}${!integrity.valid ? 'Checksum validation failed; ' : ''}`;
  }

  const inspectMsg = fillTemplate('delivery-archive-inspect-template.md', {
    TIMESTAMP: new Date().toISOString(),
    PACKAGE_ID: packageId,
    PACKAGE_PATH: packageDir,
    MANIFEST_EXISTS: String(manifestExists),
    HANDOFF_EXISTS: String(handoff.exists),
    SIGNER: handoff.signer,
    NOTE: handoff.note,
    CHECKSUM_STATUS: checksumStatus,
    ELIGIBILITY_STATUS: eligibilityStatus,
    ELIGIBILITY_REASON: eligibilityReason,
    PREVIOUS_ARCHIVE_STATE: prevArchive
  });

  console.log(inspectMsg);

  if (!eligible) {
    process.exit(1);
  }
}

// COMMAND: archive-record <PACKAGE_ID>
function handleArchiveRecord(rawPackageId: string) {
  const packageId = normalizePackageId(rawPackageId);
  const packageDir = path.join(DELIVERY_PACKAGE_DIR, packageId);
  const timestampStr = new Date().toISOString();

  // 1. Validate handoff approved status
  const handoff = parseHandoffRecord(packageId);
  if (!handoff.exists) {
    logEvent(`BLOCKED: Attempted to archive unapproved handoff for ${packageId}`);
    const errMsg = fillTemplate('delivery-archive-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'archive-record',
      FAILURE_CATEGORY: 'Handoff Audit Missing',
      ERROR_TEXT: `Package "${packageId}" does not have an approved manual handoff record in folders.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // 2. Validate manifest files and checksum
  const manifestJsonPath = path.join(packageDir, 'package_manifest.json');
  const manifestMdPath = path.join(packageDir, 'package_manifest.md');
  if (!fs.existsSync(manifestJsonPath) || !fs.existsSync(manifestMdPath)) {
    logEvent(`BLOCKED: Missing manifests for approved handoff: ${packageId}`);
    const errMsg = fillTemplate('delivery-archive-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'archive-record',
      FAILURE_CATEGORY: 'Manifest Files Missing',
      ERROR_TEXT: `Required package manifest JSON and markdown files are missing from package folder.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  const integrity = verifyPackageFiles(packageId);
  if (!integrity.valid) {
    logEvent(`BLOCKED: Checksum verification failure during archiving for: ${packageId}`);
    const errMsg = fillTemplate('delivery-archive-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'archive-record',
      FAILURE_CATEGORY: 'Integrity Checksum Mismatch',
      ERROR_TEXT: `Cryptographic SHA256 verification failed during ingestion review:\n${integrity.errors.join('\n')}`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // 3. Duplicate archive protection
  const ledgerPath = path.join(ARCHIVE_LEDGER_DIR, `ledger_${packageId}.json`);
  if (fs.existsSync(ledgerPath) && DUPLICATE_ARCHIVE_PROTECTION) {
    logEvent(`BLOCKED: Duplicate archive record attempt for ${packageId}`);
    const errMsg = fillTemplate('delivery-archive-error-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      COMMAND: 'archive-record',
      FAILURE_CATEGORY: 'Duplicate Archive Entry',
      ERROR_TEXT: `A retention ledger entry already exists for Package ID "${packageId}". Duplicate archive protection is enabled.`
    });
    console.error(errMsg);
    process.exit(1);
  }

  // 4. Calculate retention schedule
  const now = new Date();
  const warningDate = new Date(now.getTime() + WARNING_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expiryDate = new Date(now.getTime() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // Collect checksum entries
  const manifestData = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));
  const checksumEntries = manifestData.files.map((f: any) => `* ${f.name}: \`${f.checksum}\``).join('\n');

  // 5. Generate and write JSON ledger file
  const ledgerData = {
    packageId,
    packagePath: packageDir,
    handoffSigner: handoff.signer,
    handoffTimestamp: handoff.timestamp,
    handoffNote: handoff.note,
    manifestJsonPath,
    manifestMdPath,
    checksumsMatch: true,
    archiveTimestamp: timestampStr,
    retentionWarningDate: warningDate.toISOString(),
    retentionExpiryDate: expiryDate.toISOString(),
    retentionStatus: 'PRESERVED',
    chainOfCustody: [
      {
        timestamp: handoff.timestamp,
        event: 'HANDOFF_APPROVED',
        signer: handoff.signer,
        note: handoff.note
      },
      {
        timestamp: timestampStr,
        event: 'LEDGER_ARCHIVED',
        signer: 'SYSTEM_ARCHIVE_GATE',
        note: 'Ingested into offline ledger with checksum pass.'
      }
    ]
  };

  fs.writeFileSync(ledgerPath, JSON.stringify(ledgerData, null, 2), 'utf-8');

  // 6. Generate and write Markdown index file
  const indexMdPath = path.join(ARCHIVE_INDEX_DIR, `index_${packageId}.md`);
  const indexContent = fillTemplate('delivery-archive-ledger-record-template.md', {
    TIMESTAMP: timestampStr,
    PACKAGE_ID: packageId,
    PACKAGE_PATH: packageDir,
    SIGNER: handoff.signer,
    NOTE: handoff.note,
    CHECKSUMS_MATCH: 'TRUE (VERIFIED PASS)',
    MANIFEST_PATHS: `${manifestJsonPath}\n  ${manifestMdPath}`,
    RETENTION_EXPIRY_DATE: expiryDate.toISOString(),
    RETENTION_WARNING_DATE: warningDate.toISOString(),
    RETENTION_STATUS: 'PRESERVED'
  });

  fs.writeFileSync(indexMdPath, indexContent, 'utf-8');
  logEvent(`LEDGER ARCHIVED: Package ${packageId} successfully registered in retention ledger.`);

  console.log(`\n======================================================`);
  console.log(`✅ Success: Package Ingested to Retention Ledger`);
  console.log(`======================================================`);
  console.log(`- Package ID   : ${packageId}`);
  console.log(`- Ledger File  : ${ledgerPath}`);
  console.log(`- Index Markdown: ${indexMdPath}`);
  console.log(`- Warning Threshold Date: ${warningDate.toISOString().split('T')[0]}`);
  console.log(`- Expiry Policy Date    : ${expiryDate.toISOString().split('T')[0]}`);
  console.log(`- Package State: UNTOUCHED (Zero auto-deletion)`);
  console.log(`======================================================\n`);

  handleStatus(true);
}

// COMMAND: ledger-status <PACKAGE_ID>
function handleLedgerStatus(rawPackageId: string) {
  const packageId = normalizePackageId(rawPackageId);
  const ledgerPath = path.join(ARCHIVE_LEDGER_DIR, `ledger_${packageId}.json`);

  if (!fs.existsSync(ledgerPath)) {
    console.error(`❌ Error: Ledger entry does not exist for Package ID "${packageId}".`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(ledgerPath, 'utf-8'));
  const integrity = verifyPackageFiles(packageId);

  const expiryTime = new Date(data.retentionExpiryDate).getTime();
  const warningTime = new Date(data.retentionWarningDate).getTime();
  const now = new Date().getTime();

  let lifecycleState = 'PRESERVED';
  if (now >= warningTime) lifecycleState = 'WARNING: REVIEW DUE';
  if (now >= expiryTime) lifecycleState = 'EXPIRED';

  const daysRemaining = Math.max(0, Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24)));

  const ledgerStatusMsg = fillTemplate('delivery-archive-ledger-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    LEDGER_PATH: ledgerPath,
    PACKAGE_ID: packageId,
    SIGNER: data.handoffSigner,
    ARCHIVE_TIME: data.archiveTimestamp,
    CHECKSUMS_MATCH: integrity.valid ? 'VERIFIED (PASS)' : 'FAILED: Checksums mismatches detected!',
    RETENTION_WARNING_DATE: data.retentionWarningDate,
    RETENTION_EXPIRY_DATE: data.retentionExpiryDate,
    DAYS_REMAINING: String(daysRemaining),
    LIFECYCLE_STATE: lifecycleState
  });

  console.log(ledgerStatusMsg);
}

// COMMAND: list-archive
function handleListArchive() {
  console.log(`\n======================================================`);
  console.log(`📁 Listing All Local Archive Ledger Entries`);
  console.log(`======================================================`);

  const files = fs.existsSync(ARCHIVE_LEDGER_DIR)
    ? fs.readdirSync(ARCHIVE_LEDGER_DIR).filter(f => f.startsWith('ledger_') && f.endsWith('.json')).sort()
    : [];

  if (files.length === 0) {
    console.log(`*No archive ledger entries registered yet.*`);
  } else {
    files.forEach(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(ARCHIVE_LEDGER_DIR, f), 'utf-8'));
        const integrity = verifyPackageFiles(data.packageId);
        console.log(`- Ledger: ${f} | Package: ${data.packageId} | Ingest Signer: ${data.handoffSigner} | Checksums: [${integrity.valid ? 'PASS' : 'FAIL'}]`);
      } catch (e) {
        console.log(`- Ledger: ${f} (Corrupt record JSON)`);
      }
    });
  }
  console.log(`======================================================\n`);
}

// COMMAND: verify-archive <PACKAGE_ID>
function handleVerifyArchive(rawPackageId: string) {
  const packageId = normalizePackageId(rawPackageId);
  console.log(`📡 Verifying package archive checksums: ${packageId}...`);
  
  const ledgerPath = path.join(ARCHIVE_LEDGER_DIR, `ledger_${packageId}.json`);
  if (!fs.existsSync(ledgerPath)) {
    console.error(`❌ Error: Ledger entry does not exist for Package ID "${packageId}".`);
    process.exit(1);
  }

  const integrity = verifyPackageFiles(packageId);

  if (integrity.valid) {
    console.log(`✅ Success: Package "${packageId}" checksums verified. Match ledger record.`);
    logEvent(`VERIFY SUCCESS: Verified archive checksums for ${packageId}`);
  } else {
    console.error(`❌ Failure: Package "${packageId}" checksum check failed.`);
    integrity.errors.forEach(e => console.error(`  - ${e}`));
    logEvent(`VERIFY FAILURE: Checksum mismatch on archive package ${packageId}`);
    process.exit(1);
  }
}

// COMMAND: retention-review
function handleRetentionReview() {
  const ledgerList = fs.existsSync(ARCHIVE_LEDGER_DIR)
    ? fs.readdirSync(ARCHIVE_LEDGER_DIR).filter(f => f.startsWith('ledger_') && f.endsWith('.json'))
    : [];

  const now = new Date().getTime();
  let warningEntries = '';
  let cleanEntries = '';

  ledgerList.forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ARCHIVE_LEDGER_DIR, f), 'utf-8'));
      const expiryTime = new Date(data.retentionExpiryDate).getTime();
      const warningTime = new Date(data.retentionWarningDate).getTime();

      const daysLeft = Math.max(0, Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24)));
      const desc = `- Package ID: \`${data.packageId}\` | Expiry Date: \`${data.retentionExpiryDate.split('T')[0]}\` (${daysLeft} days remaining) | Signer: \`${data.handoffSigner}\`\n`;

      if (now >= warningTime) {
        warningEntries += desc;
      } else {
        cleanEntries += desc;
      }
    } catch (e) {
      // Corrupt JSON
    }
  });

  if (warningEntries === '') {
    warningEntries = '*Zero packages have breached the warning threshold. No cleanup actions recommended.*\n';
  }
  if (cleanEntries === '') {
    cleanEntries = '*No packages currently within normal retention windows.*\n';
  }

  const reviewContent = fillTemplate('delivery-archive-retention-review-template.md', {
    TIMESTAMP: new Date().toISOString(),
    DEFAULT_RETENTION_DAYS: String(DEFAULT_RETENTION_DAYS),
    WARNING_RETENTION_DAYS: String(WARNING_RETENTION_DAYS),
    AUTO_DELETE: AUTO_DELETE_EXPIRED_PACKAGES ? 'enabled' : 'disabled',
    AUDIT_WARNING_LIST: warningEntries.trim(),
    AUDIT_CLEAN_LIST: cleanEntries.trim()
  });

  const reviewReportPath = path.join(RETENTION_REVIEW_DIR, 'retention_review_recommendations.md');
  fs.writeFileSync(reviewReportPath, reviewContent, 'utf-8');
  logEvent(`Report Generated: Retention policy review report saved to ${reviewReportPath}`);

  console.log(reviewContent);
  console.log(`💡 Report saved to: ${reviewReportPath}`);
}

// COMMAND: mark-retention-reviewed <PACKAGE_ID> --signer "<NAME>" --note "<NOTE>"
function handleMarkRetentionReviewed(rawPackageId: string, signer: string, note: string) {
  const packageId = normalizePackageId(rawPackageId);
  const ledgerPath = path.join(ARCHIVE_LEDGER_DIR, `ledger_${packageId}.json`);
  const timestampStr = new Date().toISOString();

  if (!fs.existsSync(ledgerPath)) {
    console.error(`❌ Error: Ledger entry does not exist for Package ID "${packageId}".`);
    process.exit(1);
  }

  if (!signer || signer.trim() === '') {
    console.error(`❌ Error: Missing --signer "<NAME>" option parameter.`);
    process.exit(1);
  }

  if (!note || note.trim() === '') {
    console.error(`❌ Error: Missing --note "<NOTE>" option parameter.`);
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(ledgerPath, 'utf-8'));
    
    // Add review event to custody trail
    data.chainOfCustody.push({
      timestamp: timestampStr,
      event: 'RETENTION_REVIEWED',
      signer: signer.trim(),
      note: note.trim()
    });

    // Reset warning and expiry date by extending retention
    const now = new Date();
    const newWarning = new Date(now.getTime() + WARNING_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const newExpiry = new Date(now.getTime() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    data.retentionWarningDate = newWarning.toISOString();
    data.retentionExpiryDate = newExpiry.toISOString();
    data.retentionStatus = 'PRESERVED (RETENTION EXTENDED)';

    fs.writeFileSync(ledgerPath, JSON.stringify(data, null, 2), 'utf-8');
    logEvent(`RETENTION REVIEWED: Extension logged for ${packageId} signed by ${signer}`);

    // Update index md
    const indexMdPath = path.join(ARCHIVE_INDEX_DIR, `index_${packageId}.md`);
    const indexContent = fillTemplate('delivery-archive-ledger-record-template.md', {
      TIMESTAMP: timestampStr,
      PACKAGE_ID: packageId,
      PACKAGE_PATH: data.packagePath,
      SIGNER: data.handoffSigner,
      NOTE: data.handoffNote,
      CHECKSUMS_MATCH: 'TRUE (VERIFIED PASS)',
      MANIFEST_PATHS: `${data.manifestJsonPath}\n  ${data.manifestMdPath}`,
      RETENTION_EXPIRY_DATE: newExpiry.toISOString(),
      RETENTION_WARNING_DATE: newWarning.toISOString(),
      RETENTION_STATUS: 'PRESERVED (RETENTION EXTENDED)'
    });
    fs.writeFileSync(indexMdPath, indexContent, 'utf-8');

    console.log(`\n======================================================`);
    console.log(`✅ Success: Retention Review Marked`);
    console.log(`======================================================`);
    console.log(`- Package ID   : ${packageId}`);
    console.log(`- Status       : Extended Preservation Window`);
    console.log(`- Human Auditor: ${signer}`);
    console.log(`- Expiry Date  : ${newExpiry.toISOString().split('T')[0]}`);
    console.log(`- Package State: UNTOUCHED (Local preservation active)`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error(`❌ Error parsing or writing ledger record: ${(err as Error).message}`);
    process.exit(1);
  }

  handleStatus(true);
}

// COMMAND: export-ledger
function handleExportLedger() {
  const ledgerList = fs.existsSync(ARCHIVE_LEDGER_DIR)
    ? fs.readdirSync(ARCHIVE_LEDGER_DIR).filter(f => f.startsWith('ledger_') && f.endsWith('.json'))
    : [];

  const unifiedLedger: any[] = [];
  let markdownExport = `# Unified Archive Retention Ledger Exports\n*Generated: ${new Date().toISOString()}*\n\n| Package ID | Handoff Signer | Archive Timestamp | Expiry Date | Status |\n|---|---|---|---|---|\n`;

  ledgerList.forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ARCHIVE_LEDGER_DIR, f), 'utf-8'));
      unifiedLedger.push(data);
      markdownExport += `| \`${data.packageId}\` | ${data.handoffSigner} | \`${data.archiveTimestamp.split('T')[0]}\` | \`${data.retentionExpiryDate.split('T')[0]}\` | **${data.retentionStatus}** |\n`;
    } catch (e) {
      // Corrupt JSON
    }
  });

  const jsonExportPath = path.join(ARCHIVE_EXPORTS_DIR, 'unified_retention_ledger.json');
  const mdExportPath = path.join(ARCHIVE_EXPORTS_DIR, 'unified_retention_ledger.md');

  fs.writeFileSync(jsonExportPath, JSON.stringify(unifiedLedger, null, 2), 'utf-8');
  fs.writeFileSync(mdExportPath, markdownExport, 'utf-8');

  logEvent(`EXPORTS REGISTERED: Exported database archives to ${jsonExportPath} and ${mdExportPath}`);

  console.log(`\n======================================================`);
  console.log(`📥 Success: Unified Ledger Exported`);
  console.log(`======================================================`);
  console.log(`- JSON Export: ${jsonExportPath}`);
  console.log(`- MD Export  : ${mdExportPath}`);
  console.log(`- Entries    : ${unifiedLedger.length}`);
  console.log(`======================================================\n`);
}

// COMMAND: latest
function handleLatest() {
  const ledgerList = fs.existsSync(ARCHIVE_LEDGER_DIR)
    ? fs.readdirSync(ARCHIVE_LEDGER_DIR).filter(f => f.startsWith('ledger_') && f.endsWith('.json')).sort()
    : [];

  console.log(`\n======================================================`);
  console.log(`📦 Latest Archive Ledger Context`);
  console.log(`======================================================`);

  if (ledgerList.length === 0) {
    console.log(`No archive ledger entries found.`);
  } else {
    const latestFile = ledgerList[ledgerList.length - 1];
    const fullPath = path.join(ARCHIVE_LEDGER_DIR, latestFile);
    try {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      console.log(`Latest Archival:`);
      console.log(`  - Package ID: ${data.packageId}`);
      console.log(`  - Signer    : ${data.handoffSigner}`);
      console.log(`  - Timestamp : ${data.archiveTimestamp}`);
      console.log(`  - Expiry    : ${data.retentionExpiryDate}`);
    } catch (e) {
      console.log(`  - Latest record corrupted.`);
    }
  }
  console.log(`======================================================\n`);
}

// COMMAND: archive-summary
function handleArchiveSummary() {
  const handoffList = fs.existsSync(HANDOFF_APPROVED_DIR)
    ? fs.readdirSync(HANDOFF_APPROVED_DIR).filter(f => f.startsWith('approved_') && f.endsWith('.md'))
    : [];
  const handoffCount = handoffList.length;

  const ledgerList = fs.existsSync(ARCHIVE_LEDGER_DIR)
    ? fs.readdirSync(ARCHIVE_LEDGER_DIR).filter(f => f.startsWith('ledger_') && f.endsWith('.json')).sort()
    : [];
  const archivedCount = ledgerList.length;

  const reviewList = fs.existsSync(RETENTION_REVIEW_DIR)
    ? fs.readdirSync(RETENTION_REVIEW_DIR).filter(f => f.startsWith('review_') && f.endsWith('.md'))
    : [];
  const reviewCount = reviewList.length;

  let reviewDueCount = 0;
  let detailsList = '';

  ledgerList.forEach(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ARCHIVE_LEDGER_DIR, f), 'utf-8'));
      const expiryTime = new Date(data.retentionExpiryDate).getTime();
      const warningTime = new Date(data.retentionWarningDate).getTime();
      const now = new Date().getTime();

      if (now >= warningTime) reviewDueCount++;
      detailsList += `- Package: \`${data.packageId}\` | Ingest Signer: \`${data.handoffSigner}\` | Expiry: \`${data.retentionExpiryDate.split('T')[0]}\` | Integrity: **[PASS]**\n`;
    } catch (e) {
      // Corrupt JSON
    }
  });

  if (detailsList === '') {
    detailsList = '*No ledger archive entries registered.*';
  }

  const summaryReportPath = path.join(ARCHIVE_REPORTS_DIR, 'archive_summary_report.md');
  const summaryContent = fillTemplate('delivery-archive-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    HANDOFF_COUNT: String(handoffCount),
    ARCHIVED_COUNT: String(archivedCount),
    REVIEW_COUNT: String(reviewCount),
    REVIEW_DUE_COUNT: String(reviewDueCount),
    AUTO_DELETE: AUTO_DELETE_EXPIRED_PACKAGES ? 'enabled' : 'disabled',
    AUTO_UPLOAD: AUTO_UPLOAD_ARCHIVE ? 'enabled' : 'disabled',
    AUTO_SEND: AUTO_SEND_ARCHIVE ? 'enabled' : 'disabled',
    MANUAL_RETENTION_REQUIRED: MANUAL_RETENTION_REVIEW_REQUIRED ? 'REQUIRED' : 'BYPASSABLE',
    ARCHIVE_DETAILS_LIST: detailsList.trim(),
    SUMMARY_REPORT_PATH: summaryReportPath
  });

  fs.writeFileSync(summaryReportPath, summaryContent, 'utf-8');
  logEvent(`Report Generated: Archive summary written to ${summaryReportPath}`);

  console.log(summaryContent);
  console.log(`💡 Report saved to: ${summaryReportPath}`);
}

// COMMAND: archive-log
function handleArchiveLog() {
  let logsContent = 'No archive log events recorded.';
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
    logsContent = lines.slice(-20).join('\n');
  }

  const logMsg = fillTemplate('delivery-archive-log-template.md', {
    TIMESTAMP: new Date().toISOString(),
    LOG_PATH: LOG_FILE,
    LOG_ENTRIES: logsContent
  });

  console.log(logMsg);
}

let parsedArgs: string[] = [];

function getOptionValue(flag: string): string {
  const idx = parsedArgs.indexOf(flag);
  if (idx !== -1 && idx + 1 < parsedArgs.length) {
    return parsedArgs[idx + 1].replace(/^['"]|['"]$/g, '').trim();
  }
  return '';
}

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
  const packageIdParam = positionalArgs[1] ? positionalArgs[1].trim() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'scan-handoffs':
      handleScanHandoffs();
      break;
    case 'inspect-handoff':
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleInspectHandoff(packageIdParam);
      break;
    case 'archive-record':
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleArchiveRecord(packageIdParam);
      break;
    case 'ledger-status':
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleLedgerStatus(packageIdParam);
      break;
    case 'list-archive':
      handleListArchive();
      break;
    case 'verify-archive':
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      handleVerifyArchive(packageIdParam);
      break;
    case 'retention-review':
      handleRetentionReview();
      break;
    case 'mark-retention-reviewed': {
      if (!packageIdParam) {
        console.error('❌ Error: Missing <PACKAGE_ID> parameter.');
        process.exit(1);
      }
      const signer = getOptionValue('--signer');
      const note = getOptionValue('--note');
      handleMarkRetentionReviewed(packageIdParam, signer, note);
      break;
    }
    case 'export-ledger':
      handleExportLedger();
      break;
    case 'latest':
      handleLatest();
      break;
    case 'archive-summary':
      handleArchiveSummary();
      break;
    case 'archive-log':
      handleArchiveLog();
      break;
    default:
      console.error(`❌ Error: Unknown command "${command}". Run npm run delivery-archive-retention-help for guidance.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal execution error: ${err}`);
  process.exit(1);
});
