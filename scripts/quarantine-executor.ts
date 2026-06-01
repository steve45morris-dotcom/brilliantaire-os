import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  QUARANTINE_ONLY,
  ALLOW_PERMANENT_DELETE,
  ALLOW_RM_COMMANDS,
  REQUIRE_CONFIRM_FLAG,
  REQUIRE_STAGED_PLAN,
  REQUIRE_CHECKSUM_VALIDATION,
  REQUIRE_RESTORE_MAP,
  CLEANUP_STAGING_DIR,
  CLEANUP_QUARANTINE_DIR,
  QUARANTINE_LOG_DIR,
  QUARANTINE_MANIFEST_DIR,
  CHECKSUM_OUTPUT_DIR,
  RESTORE_SCRIPT_DIR
} from '../config/quarantine-execution.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Helper to get formatted date
function getISODate(): string {
  return new Date().toISOString().split('T')[0];
}

function getFormattedDateTime(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}`;
}

function getFileMD5(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch {
    return '';
  }
}

function getLatestFile(dir: string, prefix: string, suffix: string): string | null {
  if (!fs.existsSync(dir)) return null;
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) && f.endsWith(suffix))
      .sort();
    if (files.length === 0) return null;
    return path.join(dir, files[files.length - 1]);
  } catch {
    return null;
  }
}

interface StagedQuarantineItem {
  source: string;
  destination: string;
  reason: string;
  confidence: string;
  restorePath: string;
  status: string;
}

function parseStagingPlan(filePath: string): StagedQuarantineItem[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const items: StagedQuarantineItem[] = [];
  
  for (const line of lines) {
    if (!line.includes('|')) continue;
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 7) continue;
    if (parts[1].toLowerCase().includes('source path') || parts[1].includes('---')) continue;
    
    const source = parts[1].replace(/`/g, '').trim();
    const destination = parts[2].replace(/`/g, '').trim();
    const reason = parts[3];
    const confidence = parts[4];
    const restorePath = parts[5].replace(/`/g, '').trim();
    const status = parts[6];
    
    if (source && destination && source !== 'None' && source !== 'Source Path') {
      items.push({
        source,
        destination,
        reason,
        confidence,
        restorePath,
        status
      });
    }
  }
  return items;
}

function parseManifest(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const items: { source: string; destination: string; checksumBefore: string; checksumAfter: string; status: string }[] = [];
  
  for (const line of lines) {
    if (!line.includes('|')) continue;
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 7) continue;
    if (parts[1].toLowerCase().includes('source path') || parts[1].includes('---')) continue;
    
    const source = parts[1].replace(/`/g, '').trim();
    const destination = parts[2].replace(/`/g, '').trim();
    const checksumBefore = parts[4].replace(/`/g, '').trim();
    const checksumAfter = parts[5].replace(/`/g, '').trim();
    const status = parts[6];
    
    if (source && destination && source !== 'Source Path') {
      items.push({ source, destination, checksumBefore, checksumAfter, status });
    }
  }
  return items;
}

function runDryRun() {
  console.log("🔍 Checking for staged quarantine plans...");
  const latestPlan = getLatestFile(CLEANUP_STAGING_DIR, 'duplicate_quarantine_plan_', '.md');
  if (!latestPlan) {
    console.error(`🚨 No staged quarantine plan found in ${CLEANUP_STAGING_DIR}. Run cleanup staging first.`);
    process.exit(1);
  }
  console.log(`Reading staged plan: file://${latestPlan}`);
  const items = parseStagingPlan(latestPlan);
  
  const dateStr = getISODate();
  const dryRunPath = path.join(QUARANTINE_MANIFEST_DIR, `quarantine_dry_run_${dateStr}.md`);
  
  let tableRows = '';
  if (items.length > 0) {
    tableRows = items.map(item => 
      `| \`${item.source}\` | \`${item.destination}\` | \`${item.source}\` | Yes | Disabled |`
    ).join('\n');
  } else {
    tableRows = '| None | None | None | - | - |';
  }
  
  const content = `# 📋 Approved Quarantine Dry-Run Report
Dry-Run Date: ${dateStr}
Source Plan: [${path.basename(latestPlan)}](file://${latestPlan})
Total Files Candidate: ${items.length}

## Staged Queue for Move
| Source Path | Quarantine Destination | Restore Path | Approval Required | Permanent Delete |
|-------------|------------------------|--------------|-------------------|------------------|
${tableRows}

### Safety Parameter Verification
- QUARANTINE_ONLY: ${QUARANTINE_ONLY}
- ALLOW_PERMANENT_DELETE: ${ALLOW_PERMANENT_DELETE}
- ALLOW_RM_COMMANDS: ${ALLOW_RM_COMMANDS}
- REQUIRE_CONFIRM_FLAG: ${REQUIRE_CONFIRM_FLAG}
`;

  fs.mkdirSync(QUARANTINE_MANIFEST_DIR, { recursive: true });
  fs.writeFileSync(dryRunPath, content, 'utf-8');
  console.log(`✅ Dry-run manifest generated at: file://${dryRunPath}`);
}

function runExecuteApproved(hasConfirm: boolean) {
  if (!hasConfirm) {
    console.error("⚠️  Warning: quarantine-executor is a HIGH-risk operation.");
    console.error("❌ Blocked: execute-approved requires the --confirm flag.");
    console.log("💡 Guidance: npm run quarantine-executor -- \"execute-approved\" --confirm");
    process.exit(1);
  }

  console.log("📦 Execution confirmed. Locating latest staged plan...");
  const latestPlan = getLatestFile(CLEANUP_STAGING_DIR, 'duplicate_quarantine_plan_', '.md');
  if (!latestPlan) {
    console.error(`🚨 No staged quarantine plan found in ${CLEANUP_STAGING_DIR}. Run cleanup staging first.`);
    process.exit(1);
  }
  console.log(`Reading staged plan: file://${latestPlan}`);
  const items = parseStagingPlan(latestPlan);
  if (items.length === 0) {
    console.log("No files to quarantine.");
    process.exit(0);
  }

  const executionResults: {
    source: string;
    destination: string;
    checksumBefore: string;
    checksumAfter: string;
    status: string;
    notes: string;
  }[] = [];

  fs.mkdirSync(CLEANUP_QUARANTINE_DIR, { recursive: true });

  for (const item of items) {
    const src = item.source;
    const dest = item.destination;
    
    // Check if source exists
    if (!fs.existsSync(src)) {
      console.warn(`⚠️ Source file does not exist: ${src}`);
      executionResults.push({
        source: src,
        destination: dest,
        checksumBefore: 'N/A',
        checksumAfter: 'N/A',
        status: 'FAILED',
        notes: 'Source file not found'
      });
      continue;
    }

    try {
      // Checksum before
      const hashBefore = getFileMD5(src);
      
      // Ensure target folder exists
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      
      // Copy file
      fs.copyFileSync(src, dest);
      
      // Checksum after
      const hashAfter = getFileMD5(dest);
      
      if (hashBefore === hashAfter) {
        // Safe delete from source using node standard library (no rm commands)
        fs.unlinkSync(src);
        
        executionResults.push({
          source: src,
          destination: dest,
          checksumBefore: hashBefore,
          checksumAfter: hashAfter,
          status: 'QUARANTINED',
          notes: 'Moved successfully'
        });
        console.log(`✅ Quarantined: ${path.basename(src)}`);
      } else {
        // Mismatch, clean up destination copy
        if (fs.existsSync(dest)) {
          fs.unlinkSync(dest);
        }
        executionResults.push({
          source: src,
          destination: dest,
          checksumBefore: hashBefore,
          checksumAfter: hashAfter,
          status: 'FAILED',
          notes: 'Checksum verification mismatch'
        });
        console.error(`🚨 Checksum mismatch for ${src}`);
      }
    } catch (err) {
      executionResults.push({
        source: src,
        destination: dest,
        checksumBefore: 'ERROR',
        checksumAfter: 'ERROR',
        status: 'FAILED',
        notes: `Error: ${(err as Error).message}`
      });
      console.error(`❌ Failed to move ${src}: ${(err as Error).message}`);
    }
  }

  const dateStr = getISODate();
  const dateTimeStr = getFormattedDateTime();

  // Read templates
  const manifestTemplatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine_execution', 'quarantine-manifest-template.md');
  const logTemplatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine_execution', 'quarantine-log-template.md');

  // Fill manifest
  const manifestRows = executionResults.map(r =>
    `| \`${r.source}\` | \`${r.destination}\` | \`${r.source}\` | \`${r.checksumBefore}\` | \`${r.checksumAfter}\` | ${r.status} |`
  ).join('\n');
  
  let manifestContent = '';
  if (fs.existsSync(manifestTemplatePath)) {
    manifestContent = fs.readFileSync(manifestTemplatePath, 'utf-8')
      .replace('{{QUARANTINE_DATE}}', dateTimeStr)
      .replace('{{TOTAL_FILES}}', executionResults.filter(r => r.status === 'QUARANTINED').length.toString())
      .replace('{{MANIFEST_ROWS}}', manifestRows);
  } else {
    manifestContent = `# Manifest\nDate: ${dateTimeStr}\nTotal: ${executionResults.filter(r => r.status === 'QUARANTINED').length}\n${manifestRows}`;
  }

  const manifestFile = path.join(QUARANTINE_MANIFEST_DIR, `quarantine_manifest_${dateTimeStr}.md`);
  fs.mkdirSync(QUARANTINE_MANIFEST_DIR, { recursive: true });
  fs.writeFileSync(manifestFile, manifestContent, 'utf-8');

  // Fill log
  const logRows = executionResults.map(r => {
    const timestamp = new Date().toISOString();
    return `| ${timestamp} | MOVE | \`${r.source}\` | \`${r.destination}\` | ${r.status} | ${r.notes} |`;
  }).join('\n');

  let logContent = '';
  if (fs.existsSync(logTemplatePath)) {
    logContent = fs.readFileSync(logTemplatePath, 'utf-8')
      .replace('{{LOG_DATE}}', dateStr)
      .replace('{{LOG_ROWS}}', logRows);
  } else {
    logContent = `# Log\nDate: ${dateStr}\n${logRows}`;
  }

  const logFile = path.join(QUARANTINE_LOG_DIR, `quarantine_log_${dateStr}.md`);
  fs.mkdirSync(QUARANTINE_LOG_DIR, { recursive: true });
  fs.writeFileSync(logFile, logContent, 'utf-8');

  // Write checksums file (quarantine_checksums_YYYY-MM-DD.md)
  const checksumsFile = path.join(CHECKSUM_OUTPUT_DIR, `quarantine_checksums_${dateStr}.md`);
  let checksumsContent = `# Checksum Log\nDate: ${dateStr}\n\n`;
  checksumsContent += "| File | Checksum Before | Checksum After | Match |\n|---|---|---|---|\n";
  checksumsContent += executionResults.map(r =>
    `| \`${path.basename(r.source)}\` | \`${r.checksumBefore}\` | \`${r.checksumAfter}\` | ${r.checksumBefore === r.checksumAfter ? 'MATCH' : 'MISMATCH'} |`
  ).join('\n');
  fs.mkdirSync(CHECKSUM_OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(checksumsFile, checksumsContent, 'utf-8');

  console.log(`✅ Approved files quarantined.`);
  console.log(`Manifest: file://${manifestFile}`);
  console.log(`Log: file://${logFile}`);
  console.log(`Checksum Log: file://${checksumsFile}`);
}

function runChecksumVerification() {
  console.log("🔍 Finding latest quarantine manifest...");
  const latestManifest = getLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_manifest_', '.md');
  if (!latestManifest) {
    console.error(`🚨 No quarantine manifest found in ${QUARANTINE_MANIFEST_DIR}. Run execute-approved first.`);
    process.exit(1);
  }
  console.log(`Reading manifest: file://${latestManifest}`);
  const items = parseManifest(latestManifest);
  if (items.length === 0) {
    console.log("No items found in manifest to verify.");
    process.exit(0);
  }

  const verifiedRows: {
    file: string;
    origHash: string;
    quarHash: string;
    match: string;
    risk: string;
    action: string;
  }[] = [];

  let overallMatch = true;

  for (const item of items) {
    const file = path.basename(item.destination);
    const origHash = item.checksumBefore;
    
    let quarHash = 'N/A';
    let match = 'NO';
    let risk = 'High (Missing file)';
    let action = 'Re-stage or restore';

    if (fs.existsSync(item.destination)) {
      quarHash = getFileMD5(item.destination);
      if (quarHash === origHash) {
        match = 'YES';
        risk = 'None';
        action = 'Keep quarantined';
      } else {
        match = 'NO';
        risk = 'High (Corrupted)';
        action = 'Re-copy or inspect';
        overallMatch = false;
      }
    } else {
      overallMatch = false;
    }

    verifiedRows.push({
      file,
      origHash,
      quarHash,
      match,
      risk,
      action
    });
  }

  const dateStr = getISODate();
  const verificationTemplatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine_execution', 'checksum-report-template.md');
  
  const rowsStr = verifiedRows.map(r =>
    `| \`${r.file}\` | \`${r.origHash}\` | \`${r.quarHash}\` | ${r.match} | ${r.risk} | ${r.action} |`
  ).join('\n');

  let reportContent = '';
  if (fs.existsSync(verificationTemplatePath)) {
    reportContent = fs.readFileSync(verificationTemplatePath, 'utf-8')
      .replace('{{VERIFICATION_DATE}}', dateStr)
      .replace('{{TOTAL_VERIFIED}}', verifiedRows.length.toString())
      .replace('{{INTEGRITY_STATUS}}', overallMatch ? 'INTEGRITY_MATCH' : 'INTEGRITY_ERROR')
      .replace('{{CHECKSUM_ROWS}}', rowsStr);
  } else {
    reportContent = `# Verification Report\nDate: ${dateStr}\nStatus: ${overallMatch ? 'OK' : 'FAIL'}\n${rowsStr}`;
  }

  const verificationFile = path.join(CHECKSUM_OUTPUT_DIR, `quarantine_checksum_verification_${dateStr}.md`);
  fs.writeFileSync(verificationFile, reportContent, 'utf-8');
  console.log(`✅ Checksum verification complete. Report written to: file://${verificationFile}`);
}

function runRestoreMap() {
  console.log("🔍 Generating restore map...");
  const latestManifest = getLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_manifest_', '.md');
  if (!latestManifest) {
    console.error(`🚨 No quarantine manifest found in ${QUARANTINE_MANIFEST_DIR}. Run execute-approved first.`);
    process.exit(1);
  }
  console.log(`Reading manifest: file://${latestManifest}`);
  const items = parseManifest(latestManifest);
  if (items.length === 0) {
    console.log("No items found in manifest to generate restore map.");
    process.exit(0);
  }

  const genDate = getISODate();
  const restoreTemplatePath = path.join(REPO_ROOT, 'templates', 'cleanup', 'quarantine_execution', 'restore-map-template.md');

  const restoreCommands = items.map(item => {
    return `# Restore file: ${path.basename(item.source)}
# Source in quarantine: ${item.destination}
# Target original path: ${item.source}
# mkdir -p "${path.dirname(item.source)}"
# cp "${item.destination}" "${item.source}"`;
  }).join('\n\n');

  let scriptContent = '';
  if (fs.existsSync(restoreTemplatePath)) {
    scriptContent = fs.readFileSync(restoreTemplatePath, 'utf-8')
      .replace('{{GENERATED_DATE}}', genDate)
      .replace('{{SAFETY_NOTE}}', 'This script contains safe copy rollback commands. Run manually or uncomment commands to restore files.')
      .replace('{{RESTORE_COMMANDS}}', restoreCommands);
  } else {
    scriptContent = `#!/bin/bash\n# Date: ${genDate}\n# Safety Note: Commented out\n${restoreCommands}`;
  }

  const restoreScriptFile = path.join(RESTORE_SCRIPT_DIR, `restore_quarantined_files_${genDate}.sh`);
  fs.mkdirSync(RESTORE_SCRIPT_DIR, { recursive: true });
  fs.writeFileSync(restoreScriptFile, scriptContent, 'utf-8');

  console.log(`✅ Restore map generated: file://${restoreScriptFile}`);
}

function runStatus() {
  console.log("=================================================================");
  console.log("📊 STATUS DASHBOARD: APPROVED QUARANTINE EXECUTION GATE");
  console.log("=================================================================");

  const latestPlan = getLatestFile(CLEANUP_STAGING_DIR, 'duplicate_quarantine_plan_', '.md');
  const latestDryRun = getLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_dry_run_', '.md');
  const latestManifest = getLatestFile(QUARANTINE_MANIFEST_DIR, 'quarantine_manifest_', '.md');
  const latestChecksum = getLatestFile(CHECKSUM_OUTPUT_DIR, 'quarantine_checksum_verification_', '.md');
  const latestRestore = getLatestFile(RESTORE_SCRIPT_DIR, 'restore_quarantined_files_', '.sh');

  // Count files quarantined
  let quarantinedCount = 0;
  if (latestManifest) {
    const items = parseManifest(latestManifest);
    quarantinedCount = items.filter(i => i.status === 'QUARANTINED').length;
  }

  console.log(`Latest Staged Plan:      ${latestPlan ? `file://${latestPlan} (FOUND)` : 'NOT FOUND (Run cleanup staging first)'}`);
  console.log(`Latest Dry-Run Manifest: ${latestDryRun ? `file://${latestDryRun} (FOUND)` : 'NOT FOUND (Run dry-run)'}`);
  console.log(`Latest Manifest:         ${latestManifest ? `file://${latestManifest} (FOUND)` : 'NOT FOUND (Run execute-approved)'}`);
  console.log(`Latest Checksum Report:  ${latestChecksum ? `file://${latestChecksum} (FOUND)` : 'NOT FOUND (Run checksum)'}`);
  console.log(`Latest Restore Map:      ${latestRestore ? `file://${latestRestore} (FOUND)` : 'NOT FOUND (Run restore-map)'}`);
  console.log("-----------------------------------------------------------------");
  console.log(`Quarantined Files Count:  ${quarantinedCount}`);
  console.log(`Permanent Delete Enabled: ${ALLOW_PERMANENT_DELETE ? 'YES 🚨' : 'NO ✅'}`);
  console.log("-----------------------------------------------------------------");
  console.log("Next Recommended Action:     Review dry-run then run execute-approved.");
  console.log("=================================================================");
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error("🚨 Missing subcommand. Use -- 'help' or -- 'status' to review parameters.");
    process.exit(1);
  }

  const hasConfirm = args.includes('--confirm');

  switch (command) {
    case 'dry-run':
      runDryRun();
      break;
    case 'execute-approved':
      runExecuteApproved(hasConfirm);
      break;
    case 'checksum':
      runChecksumVerification();
      break;
    case 'restore-map':
      runRestoreMap();
      break;
    case 'status':
      runStatus();
      break;
    case 'help':
      import('./quarantine-executor-help.js');
      break;
    default:
      console.error(`🚨 Unknown subcommand: ${command}`);
      console.error("Run npm run quarantine-executor-help to check command menu.");
      process.exit(1);
  }
}

main();
