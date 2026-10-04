import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_AUTOMATED_FILE_MOVES,
  ALLOW_AUTOMATED_VALIDATION,
  ALLOW_EXTERNAL_ASSET_FETCH,
  REQUIRE_HUMAN_REVIEW,
  REQUIRE_ASSEMBLY_APPROVAL,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  inputFolders,
  supportedAssetTypes,
  assetExtensionMap,
  assetCategories,
  categoryExtensions,
  REPO_ROOT
} from '../config/render-intake.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Utility Functions ───────────────────────────────────────────

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    targetPath = path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const logDir = outputFolders.logs;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `render_intake_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function containsUnsafeText(text: string): boolean {
  const dangerousPatterns = [
    /rm\s+-rf/i,
    /sudo\s+/i,
    /chmod\s+/i,
    /chown\s+/i,
    /mkfs/i,
    />\s*\/dev\/sda/i,
    /eval\(/i
  ];
  return dangerousPatterns.some(pattern => pattern.test(text));
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `RI-${dateStr}-${suffix}`;
}

function getAssetCategory(ext: string): string | null {
  const lower = ext.toLowerCase();
  for (const [cat, exts] of Object.entries(categoryExtensions)) {
    if (exts.includes(lower)) return cat;
  }
  return null;
}

function scanDirectory(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ext in assetExtensionMap;
  });
}

function loadTemplate(templateName: string): string {
  const templatePath = path.join(REPO_ROOT, 'templates', 'render_intake', templateName);
  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found at: ${templatePath}`);
    process.exit(1);
  }
  return fs.readFileSync(templatePath, 'utf-8');
}

// ─── 1. Status Command ──────────────────────────────────────────

async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'='.repeat(50)}`);
  console.log(`  Tool Type:              ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:            ${BRIDGE_MODE}`);
  console.log(`  Integration:            ${INTEGRATION_TARGET}`);
  console.log(`  Auto File Moves:        ${ALLOW_AUTOMATED_FILE_MOVES}`);
  console.log(`  Auto Validation:        ${ALLOW_AUTOMATED_VALIDATION}`);
  console.log(`  External Asset Fetch:   ${ALLOW_EXTERNAL_ASSET_FETCH}`);
  console.log(`  Human Review Required:  ${REQUIRE_HUMAN_REVIEW}`);
  console.log(`  Assembly Approval:      ${REQUIRE_ASSEMBLY_APPROVAL}`);
  console.log(`${'='.repeat(50)}`);

  const folders = [
    { name: 'Scans', dir: outputFolders.scans },
    { name: 'Validations', dir: outputFolders.validations },
    { name: 'Continuity Checklists', dir: outputFolders.continuityChecklists },
    { name: 'Readiness Reports', dir: outputFolders.readinessReports },
    { name: 'Revision Logs', dir: outputFolders.revisionLogs },
    { name: 'Obsidian Exports', dir: outputFolders.obsidianExports },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  Output Directories:');
  for (const folder of folders) {
    let count = 0;
    if (fs.existsSync(folder.dir)) {
      count = fs.readdirSync(folder.dir).filter(f => f.endsWith('.md')).length;
    }
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(24)} ${status}`);
  }

  const inputs = [
    { name: 'Incoming', dir: inputFolders.incoming },
    { name: 'Reviewed', dir: inputFolders.reviewed }
  ];

  console.log('\n  Input Directories:');
  for (const inp of inputs) {
    let count = 0;
    if (fs.existsSync(inp.dir)) {
      count = scanDirectory(inp.dir).length;
    }
    const status = fs.existsSync(inp.dir) ? `${count} assets` : 'not created';
    console.log(`     ${inp.name.padEnd(24)} ${status}`);
  }

  console.log('\n  Supported Asset Types:');
  for (const t of supportedAssetTypes) {
    console.log(`     - ${t}`);
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// ─── 2. Scan Command ────────────────────────────────────────────

async function handleScan() {
  await announceIntent('Scanning incoming rendered assets');
  console.log('Scanning incoming asset folders...');

  const incomingFiles = scanDirectory(inputFolders.incoming);
  const reviewedFiles = scanDirectory(inputFolders.reviewed);

  const categorize = (files: string[]) => {
    const result: Record<string, string[]> = { image: [], video: [], audio: [], unknown: [] };
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      const cat = getAssetCategory(ext);
      result[cat || 'unknown'].push(f);
    }
    return result;
  };

  const incomingCats = categorize(incomingFiles);
  const reviewedCats = categorize(reviewedFiles);

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  let incomingInventory = '';
  for (const [cat, files] of Object.entries(incomingCats)) {
    if (files.length > 0) {
      incomingInventory += `\n### ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${files.length})\n\n`;
      for (const f of files) {
        incomingInventory += `- ${f}\n`;
      }
    }
  }
  if (!incomingInventory) incomingInventory = '\nNo incoming assets found.\n';

  let reviewedInventory = '';
  for (const [cat, files] of Object.entries(reviewedCats)) {
    if (files.length > 0) {
      reviewedInventory += `\n### ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${files.length})\n\n`;
      for (const f of files) {
        reviewedInventory += `- ${f}\n`;
      }
    }
  }
  if (!reviewedInventory) reviewedInventory = '\nNo reviewed assets found.\n';

  let template = loadTemplate('scan-report-template.md');
  template = template
    .replace(/\{\{SCAN_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{BRIDGE_MODE\}\}/g, BRIDGE_MODE)
    .replace(/\{\{INCOMING_TOTAL\}\}/g, String(incomingFiles.length))
    .replace(/\{\{REVIEWED_TOTAL\}\}/g, String(reviewedFiles.length))
    .replace(/\{\{INCOMING_IMAGE_COUNT\}\}/g, String(incomingCats.image.length))
    .replace(/\{\{INCOMING_VIDEO_COUNT\}\}/g, String(incomingCats.video.length))
    .replace(/\{\{INCOMING_AUDIO_COUNT\}\}/g, String(incomingCats.audio.length))
    .replace(/\{\{INCOMING_INVENTORY\}\}/g, incomingInventory)
    .replace(/\{\{REVIEWED_INVENTORY\}\}/g, reviewedInventory);

  const safePath = getSafeWritePath(
    outputFolders.scans,
    `scan_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Scan report ${requestId}: ${path.basename(safePath)} (${incomingFiles.length} incoming, ${reviewedFiles.length} reviewed)`;
  console.log(`Scan complete: ${msg}`);
  logEvent('SCAN', msg);
  await announceCompletion(`Render intake scan complete: ${requestId}`, '10');
}

// ─── 3. Validate Command ────────────────────────────────────────

async function handleValidate(assetType: string) {
  const validTypes = ['image', 'video', 'audio', 'all'];
  if (!assetType || !validTypes.includes(assetType)) {
    console.error(`Error: Invalid asset type "${assetType}". Use one of: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  await announceIntent(`Validating ${assetType} assets against Phase 14D queue manifest`);
  console.log(`Validating ${assetType} assets...`);

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  const categoriesToValidate = assetType === 'all' ? ['image', 'video', 'audio'] : [assetType];
  const incomingFiles = scanDirectory(inputFolders.incoming);
  const reviewedFiles = scanDirectory(inputFolders.reviewed);
  const allFiles = [...incomingFiles, ...reviewedFiles];

  let validationRows = '';
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const cat of categoriesToValidate) {
    const exts = categoryExtensions[cat as keyof typeof categoryExtensions] || [];
    const catFiles = allFiles.filter(f => exts.includes(path.extname(f).toLowerCase()));

    for (const f of catFiles) {
      const ext = path.extname(f).toLowerCase();
      const mimeType = assetExtensionMap[ext] || 'unknown';
      const nameValid = /^[a-zA-Z0-9_\-\.]+$/.test(f);
      const status = nameValid ? 'PASS' : 'WARN';
      if (status === 'PASS') passCount++;
      else warnCount++;
      validationRows += `| ${f} | ${cat} | ${mimeType} | ${status} | ${nameValid ? 'Clean naming' : 'Non-standard filename characters'} |\n`;
    }
  }

  if (!validationRows) {
    validationRows = '| (none) | - | - | - | No assets found for validation |\n';
  }

  let template = loadTemplate('validation-report-template.md');
  template = template
    .replace(/\{\{VALIDATION_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{ASSET_TYPE\}\}/g, assetType)
    .replace(/\{\{BRIDGE_MODE\}\}/g, BRIDGE_MODE)
    .replace(/\{\{TOTAL_VALIDATED\}\}/g, String(passCount + warnCount + failCount))
    .replace(/\{\{PASS_COUNT\}\}/g, String(passCount))
    .replace(/\{\{WARN_COUNT\}\}/g, String(warnCount))
    .replace(/\{\{FAIL_COUNT\}\}/g, String(failCount))
    .replace(/\{\{VALIDATION_ROWS\}\}/g, validationRows);

  const safePath = getSafeWritePath(
    outputFolders.validations,
    `validation_report_${sanitizeFilename(assetType)}_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Validation report ${requestId}: ${path.basename(safePath)} (${passCount} pass, ${warnCount} warn, ${failCount} fail)`;
  console.log(`Validation complete: ${msg}`);
  logEvent('VALIDATE', msg);
  await announceCompletion(`Render intake validation complete: ${requestId}`, '10');
}

// ─── 4. Visual Continuity Command ───────────────────────────────

async function handleVisualContinuity() {
  await announceIntent('Generating visual continuity checklist');
  console.log('Generating visual continuity checklist...');

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  const imageExts = categoryExtensions.image;
  const videoExts = categoryExtensions.video;
  const visualExts = [...imageExts, ...videoExts];

  const incomingFiles = scanDirectory(inputFolders.incoming).filter(f => visualExts.includes(path.extname(f).toLowerCase()));
  const reviewedFiles = scanDirectory(inputFolders.reviewed).filter(f => visualExts.includes(path.extname(f).toLowerCase()));
  const allVisual = [...incomingFiles, ...reviewedFiles];

  let checklistRows = '';
  for (const f of allVisual) {
    const cat = getAssetCategory(path.extname(f).toLowerCase()) || 'unknown';
    checklistRows += `| ${f} | ${cat} | [ ] | [ ] | [ ] | [ ] |\n`;
  }
  if (!checklistRows) {
    checklistRows = '| (none) | - | - | - | - | - |\n';
  }

  let template = loadTemplate('visual-continuity-template.md');
  template = template
    .replace(/\{\{CHECKLIST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{VISUAL_ASSET_COUNT\}\}/g, String(allVisual.length))
    .replace(/\{\{CHECKLIST_ROWS\}\}/g, checklistRows);

  const safePath = getSafeWritePath(
    outputFolders.continuityChecklists,
    `visual_continuity_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Visual continuity checklist ${requestId}: ${path.basename(safePath)} (${allVisual.length} assets)`;
  console.log(`Visual continuity checklist complete: ${msg}`);
  logEvent('VISUAL_CONTINUITY', msg);
  await announceCompletion(`Visual continuity checklist staged: ${requestId}`, '10');
}

// ─── 5. Audio Review Command ────────────────────────────────────

async function handleAudioReview() {
  await announceIntent('Generating audio review checklist');
  console.log('Generating audio review checklist...');

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  const audioExts = categoryExtensions.audio;

  const incomingFiles = scanDirectory(inputFolders.incoming).filter(f => audioExts.includes(path.extname(f).toLowerCase()));
  const reviewedFiles = scanDirectory(inputFolders.reviewed).filter(f => audioExts.includes(path.extname(f).toLowerCase()));
  const allAudio = [...incomingFiles, ...reviewedFiles];

  let checklistRows = '';
  for (const f of allAudio) {
    const ext = path.extname(f).toLowerCase();
    const mimeType = assetExtensionMap[ext] || 'unknown';
    checklistRows += `| ${f} | ${mimeType} | [ ] | [ ] | [ ] | [ ] |\n`;
  }
  if (!checklistRows) {
    checklistRows = '| (none) | - | - | - | - | - |\n';
  }

  let template = loadTemplate('audio-review-template.md');
  template = template
    .replace(/\{\{CHECKLIST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{AUDIO_ASSET_COUNT\}\}/g, String(allAudio.length))
    .replace(/\{\{CHECKLIST_ROWS\}\}/g, checklistRows);

  const safePath = getSafeWritePath(
    outputFolders.continuityChecklists,
    `audio_review_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Audio review checklist ${requestId}: ${path.basename(safePath)} (${allAudio.length} assets)`;
  console.log(`Audio review checklist complete: ${msg}`);
  logEvent('AUDIO_REVIEW', msg);
  await announceCompletion(`Audio review checklist staged: ${requestId}`, '10');
}

// ─── 6. Readiness Command ───────────────────────────────────────

async function handleReadiness() {
  await announceIntent('Generating assembly readiness report');
  console.log('Generating assembly readiness report...');

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  const incomingFiles = scanDirectory(inputFolders.incoming);
  const reviewedFiles = scanDirectory(inputFolders.reviewed);

  const categorize = (files: string[]) => {
    const result: Record<string, number> = { image: 0, video: 0, audio: 0 };
    for (const f of files) {
      const cat = getAssetCategory(path.extname(f).toLowerCase());
      if (cat && cat in result) result[cat]++;
    }
    return result;
  };

  const incomingCats = categorize(incomingFiles);
  const reviewedCats = categorize(reviewedFiles);

  const totalIncoming = incomingFiles.length;
  const totalReviewed = reviewedFiles.length;
  const totalAssets = totalIncoming + totalReviewed;

  // Readiness scoring
  const hasImages = (incomingCats.image + reviewedCats.image) > 0;
  const hasVideo = (incomingCats.video + reviewedCats.video) > 0;
  const hasAudio = (incomingCats.audio + reviewedCats.audio) > 0;
  const allReviewed = totalIncoming === 0 && totalReviewed > 0;

  let readinessScore = 0;
  if (hasImages) readinessScore += 25;
  if (hasVideo) readinessScore += 25;
  if (hasAudio) readinessScore += 25;
  if (allReviewed) readinessScore += 25;

  let readinessStatus = 'NOT READY';
  if (readinessScore >= 100) readinessStatus = 'READY FOR ASSEMBLY';
  else if (readinessScore >= 50) readinessStatus = 'PARTIAL - NEEDS REVIEW';
  else if (readinessScore > 0) readinessStatus = 'EARLY STAGE';

  let categoryRows = '';
  for (const cat of assetCategories) {
    const inc = incomingCats[cat] || 0;
    const rev = reviewedCats[cat] || 0;
    const catStatus = rev > 0 && inc === 0 ? 'Reviewed' : inc > 0 ? 'Pending Review' : 'Missing';
    categoryRows += `| ${cat} | ${inc} | ${rev} | ${catStatus} |\n`;
  }

  let template = loadTemplate('readiness-report-template.md');
  template = template
    .replace(/\{\{READINESS_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{BRIDGE_MODE\}\}/g, BRIDGE_MODE)
    .replace(/\{\{TOTAL_ASSETS\}\}/g, String(totalAssets))
    .replace(/\{\{TOTAL_INCOMING\}\}/g, String(totalIncoming))
    .replace(/\{\{TOTAL_REVIEWED\}\}/g, String(totalReviewed))
    .replace(/\{\{READINESS_SCORE\}\}/g, String(readinessScore))
    .replace(/\{\{READINESS_STATUS\}\}/g, readinessStatus)
    .replace(/\{\{CATEGORY_ROWS\}\}/g, categoryRows)
    .replace(/\{\{HAS_IMAGES\}\}/g, hasImages ? 'Yes' : 'No')
    .replace(/\{\{HAS_VIDEO\}\}/g, hasVideo ? 'Yes' : 'No')
    .replace(/\{\{HAS_AUDIO\}\}/g, hasAudio ? 'Yes' : 'No')
    .replace(/\{\{ALL_REVIEWED\}\}/g, allReviewed ? 'Yes' : 'No');

  const safePath = getSafeWritePath(
    outputFolders.readinessReports,
    `readiness_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Readiness report ${requestId}: ${path.basename(safePath)} (score: ${readinessScore}/100 - ${readinessStatus})`;
  console.log(`Readiness report complete: ${msg}`);
  logEvent('READINESS', msg);
  await announceCompletion(`Assembly readiness report staged: ${requestId}`, '10');
}

// ─── 7. Revision Log Command ────────────────────────────────────

async function handleRevisionLog() {
  await announceIntent('Generating revision log for current intake cycle');
  console.log('Generating revision log...');

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  // Gather existing scan, validation, and readiness reports
  const countFiles = (dir: string) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
  };

  const scanCount = countFiles(outputFolders.scans);
  const validationCount = countFiles(outputFolders.validations);
  const checklistCount = countFiles(outputFolders.continuityChecklists);
  const readinessCount = countFiles(outputFolders.readinessReports);

  let logEntries = '';
  // Scan the event log for today if it exists
  const todayLog = path.join(outputFolders.logs, `render_intake_log_${dateStr}.md`);
  if (fs.existsSync(todayLog)) {
    logEntries = fs.readFileSync(todayLog, 'utf-8');
  }
  if (!logEntries) {
    logEntries = '(No events logged today)';
  }

  let template = loadTemplate('revision-log-template.md');
  template = template
    .replace(/\{\{REVISION_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{BRIDGE_MODE\}\}/g, BRIDGE_MODE)
    .replace(/\{\{SCAN_COUNT\}\}/g, String(scanCount))
    .replace(/\{\{VALIDATION_COUNT\}\}/g, String(validationCount))
    .replace(/\{\{CHECKLIST_COUNT\}\}/g, String(checklistCount))
    .replace(/\{\{READINESS_COUNT\}\}/g, String(readinessCount))
    .replace(/\{\{LOG_ENTRIES\}\}/g, logEntries);

  const safePath = getSafeWritePath(
    outputFolders.revisionLogs,
    `revision_log_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Revision log ${requestId}: ${path.basename(safePath)}`;
  console.log(`Revision log complete: ${msg}`);
  logEvent('REVISION_LOG', msg);
  await announceCompletion(`Revision log staged: ${requestId}`, '10');
}

// ─── 8. Obsidian Export Command ─────────────────────────────────

async function handleObsidianExport() {
  await announceIntent('Staging render intake summary for Obsidian export');
  console.log('Staging Obsidian export summary...');

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  const countFiles = (dir: string) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
  };

  const scanCount = countFiles(outputFolders.scans);
  const validationCount = countFiles(outputFolders.validations);
  const checklistCount = countFiles(outputFolders.continuityChecklists);
  const readinessCount = countFiles(outputFolders.readinessReports);
  const revisionCount = countFiles(outputFolders.revisionLogs);

  const incomingAssets = scanDirectory(inputFolders.incoming).length;
  const reviewedAssets = scanDirectory(inputFolders.reviewed).length;

  let template = loadTemplate('obsidian-export-template.md');
  template = template
    .replace(/\{\{EXPORT_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{BRIDGE_MODE\}\}/g, BRIDGE_MODE)
    .replace(/\{\{INTEGRATION_TARGET\}\}/g, INTEGRATION_TARGET)
    .replace(/\{\{SCAN_COUNT\}\}/g, String(scanCount))
    .replace(/\{\{VALIDATION_COUNT\}\}/g, String(validationCount))
    .replace(/\{\{CHECKLIST_COUNT\}\}/g, String(checklistCount))
    .replace(/\{\{READINESS_COUNT\}\}/g, String(readinessCount))
    .replace(/\{\{REVISION_COUNT\}\}/g, String(revisionCount))
    .replace(/\{\{INCOMING_ASSETS\}\}/g, String(incomingAssets))
    .replace(/\{\{REVIEWED_ASSETS\}\}/g, String(reviewedAssets));

  const safePath = getSafeWritePath(
    outputFolders.obsidianExports,
    `render_intake_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Obsidian export staged ${requestId}: ${path.basename(safePath)}`;
  console.log(`Obsidian export complete: ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Render intake Obsidian export staged', '10');
}

// ─── Main Dispatcher ────────────────────────────────────────────

async function main() {
  // Safety gates
  if (ALLOW_AUTOMATED_FILE_MOVES) {
    console.error("Safety gate: ALLOW_AUTOMATED_FILE_MOVES is enabled. This is not permitted in manual-first mode.");
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_ASSET_FETCH) {
    console.error("Safety gate: ALLOW_EXTERNAL_ASSET_FETCH is enabled. This is not permitted in manual-first mode.");
    process.exit(1);
  }

  if (ALLOW_AUTOMATED_VALIDATION) {
    console.error("Safety gate: ALLOW_AUTOMATED_VALIDATION is enabled. This is not permitted in manual-first mode.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error("Error: No command provided. Run `npm run render-intake-help` for usage.");
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];
  const restArgs = parts.slice(1).join(' ');

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'scan':
      await handleScan();
      break;
    case 'validate':
      await handleValidate(restArgs || 'all');
      break;
    case 'visual-continuity':
      await handleVisualContinuity();
      break;
    case 'audio-review':
      await handleAudioReview();
      break;
    case 'readiness':
      await handleReadiness();
      break;
    case 'revision-log':
      await handleRevisionLog();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run render-intake-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
