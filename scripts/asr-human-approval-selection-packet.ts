import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_AUTOMATED_ASR,
  ALLOW_MODEL_DOWNLOADS,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_MANUAL_SELECTION,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  asrSources,
  supportedModelFamilies,
  evaluationCriteria,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/asr-human-approval-selection-packet.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const logFile = path.join(logDir, `asr_approval_selection_log_${dateStr}.md`);
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
  return `HASP-${dateStr}-${suffix}`;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function scanSource(sourcePath: string): { exists: boolean; fileCount: number; files: string[] } {
  if (!fs.existsSync(sourcePath)) {
    return { exists: false, fileCount: 0, files: [] };
  }
  const files = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.'));
  return { exists: true, fileCount: files.length, files };
}

function fillTemplate(templateContent: string, data: Record<string, string>): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function readTemplate(filename: string): string {
  const filePath = path.join(TEMPLATE_ROOT, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARNING] Template file not found: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function ensureOutputDirs() {
  for (const [, folderPath] of Object.entries(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
}

// 1. Status Command
async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`  Module:                ${MODULE_NAME}`);
  console.log(`  Tool Type:             ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:           ${BRIDGE_MODE}`);
  console.log(`  Integration:           ${INTEGRATION_TARGET}`);
  console.log(`  Automated ASR:         ${ALLOW_AUTOMATED_ASR}`);
  console.log(`  Model Downloads:       ${ALLOW_MODEL_DOWNLOADS}`);
  console.log(`  External API:          ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  Manual Selection:      ${REQUIRE_MANUAL_SELECTION}`);
  console.log(`${'─'.repeat(55)}`);

  const folders = [
    { name: 'Selection Packets', dir: outputFolders.selectionPackets },
    { name: 'Candidate Reviews', dir: outputFolders.candidateReviews },
    { name: 'Model Reviews', dir: outputFolders.modelReviews },
    { name: 'Approval Records', dir: outputFolders.approvalRecords },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  Output Directories:');
  for (const folder of folders) {
    const count = countFiles(folder.dir);
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(28)} ${status}`);
  }

  console.log('\n  ASR Pipeline Sources:');
  for (const [source, sourcePath] of Object.entries(asrSources)) {
    const scan = scanSource(sourcePath);
    const status = scan.exists ? `${scan.fileCount} files` : 'not found';
    console.log(`     ${source.padEnd(28)} ${status}`);
  }

  console.log('\n  Supported Model Families:');
  for (const model of supportedModelFamilies) {
    console.log(`     - ${model}`);
  }

  console.log('\n  Evaluation Criteria:');
  for (const criterion of evaluationCriteria) {
    console.log(`     - ${criterion}`);
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// 2. List Candidates Command
async function handleListCandidates() {
  await announceIntent('Listing ASR candidate entries from upstream pipeline sources');
  console.log('Scanning ASR pipeline sources for candidates...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const packetId = generateRequestId();

  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [source, sourcePath] of Object.entries(asrSources)) {
    sourceResults[source] = scanSource(sourcePath);
  }

  const candidateLines: string[] = [
    '| Source | Status | Files | Candidate Entries |',
    '|---|---|---|---|',
  ];

  let totalCandidates = 0;
  for (const [source, result] of Object.entries(sourceResults)) {
    const status = result.exists ? (result.fileCount > 0 ? 'Active' : 'Empty') : 'Missing';
    const candidates = result.fileCount;
    totalCandidates += candidates;
    candidateLines.push(`| ${source} | ${status} | ${result.fileCount} | ${candidates} |`);
  }

  const fileListLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    if (result.exists && result.files.length > 0) {
      fileListLines.push(`\n### ${source}`);
      for (const file of result.files.slice(0, 15)) {
        fileListLines.push(`- \`${file}\``);
      }
      if (result.files.length > 15) {
        fileListLines.push(`- ... and ${result.files.length - 15} more`);
      }
    }
  }

  const template = readTemplate('candidate-review-template.md');
  if (!template) {
    console.error('Error: Candidate review template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    PACKET_ID: packetId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CANDIDATE_TABLE: candidateLines.join('\n'),
    TOTAL_CANDIDATES: String(totalCandidates),
    FILE_LISTING: fileListLines.join('\n') || 'No candidate files found in upstream sources.',
  });

  const safePath = getSafeWritePath(
    outputFolders.candidateReviews,
    `candidate_review_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Candidate review ${packetId}: ${totalCandidates} candidates across ${Object.keys(sourceResults).length} sources → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('LIST_CANDIDATES', msg);
  await announceCompletion(`ASR candidate review compiled: ${packetId}`, '10');
}

// 3. List Models Command
async function handleListModels() {
  await announceIntent('Compiling supported ASR model family registry');
  console.log('Compiling model family registry...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const reviewId = generateRequestId();

  const modelLines: string[] = [
    '| Model Family | Offline Ready | Estimated Size | Selection Status |',
    '|---|---|---|---|',
  ];

  const sizeEstimates: Record<string, string> = {
    'whisper-tiny': '~39 MB',
    'whisper-base': '~74 MB',
    'whisper-small': '~244 MB',
    'whisper-medium': '~769 MB',
    'whisper-large-v3': '~1.5 GB',
  };

  for (const model of supportedModelFamilies) {
    const size = sizeEstimates[model] || 'unknown';
    modelLines.push(`| ${model} | Pending verification | ${size} | Not selected |`);
  }

  const criteriaLines: string[] = [];
  for (const criterion of evaluationCriteria) {
    criteriaLines.push(`- **${criterion}:** Pending human evaluation`);
  }

  const notesLines: string[] = [
    '- Model downloads are disabled (ALLOW_MODEL_DOWNLOADS = false)',
    '- Model selection requires human approval (REQUIRE_HUMAN_APPROVAL = true)',
    '- All model evaluations must be performed manually on local hardware',
    '- No external APIs will be called for model benchmarking',
    '- Size estimates are approximate based on Whisper documentation',
  ];

  const template = readTemplate('model-review-template.md');
  if (!template) {
    console.error('Error: Model review template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    REVIEW_ID: reviewId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    MODEL_TABLE: modelLines.join('\n'),
    EVALUATION_CRITERIA: criteriaLines.join('\n'),
    SAFETY_NOTES: notesLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.modelReviews,
    `model_review_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Model review ${reviewId}: ${supportedModelFamilies.length} families documented → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('LIST_MODELS', msg);
  await announceCompletion(`ASR model family review compiled: ${reviewId}`, '10');
}

// 4. Stage Selection Command
async function handleStageSelection() {
  await announceIntent('Staging ASR candidate and model selection packet for human review');
  console.log('Staging selection packet...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const selectionId = generateRequestId();

  // Scan upstream sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [source, sourcePath] of Object.entries(asrSources)) {
    sourceResults[source] = scanSource(sourcePath);
  }

  // Build source summary
  const sourceSummaryLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    const statusStr = result.exists ? `Found (${result.fileCount} files)` : 'Not found';
    sourceSummaryLines.push(`- **${source}:** ${statusStr}`);
  }

  // Build model options
  const modelOptionLines: string[] = [
    '| Model | Size | Recommended For | Selection |',
    '|---|---|---|---|',
  ];

  const recommendations: Record<string, string> = {
    'whisper-tiny': 'Quick tests, low-resource environments',
    'whisper-base': 'Basic transcription, moderate accuracy',
    'whisper-small': 'Good accuracy/speed balance',
    'whisper-medium': 'High accuracy, moderate resource use',
    'whisper-large-v3': 'Maximum accuracy, requires significant resources',
  };

  const sizeEstimates: Record<string, string> = {
    'whisper-tiny': '~39 MB',
    'whisper-base': '~74 MB',
    'whisper-small': '~244 MB',
    'whisper-medium': '~769 MB',
    'whisper-large-v3': '~1.5 GB',
  };

  for (const model of supportedModelFamilies) {
    const rec = recommendations[model] || 'General purpose';
    const size = sizeEstimates[model] || 'unknown';
    modelOptionLines.push(`| ${model} | ${size} | ${rec} | [ ] |`);
  }

  // Build evaluation checklist
  const evalLines: string[] = [];
  for (const criterion of evaluationCriteria) {
    evalLines.push(`- [ ] **${criterion}:** (pending human assessment)`);
  }

  // Prerequisites
  const prereqLines: string[] = [
    '- [ ] ASR orchestrator outputs available in `outputs/asr_orchestrator/`',
    '- [ ] Model gate verification complete in `outputs/asr_model_gate/`',
    '- [ ] Local hardware specs confirmed for target model size',
    '- [ ] Audio input samples prepared for evaluation',
    '- [ ] Human operator available for selection decision',
  ];

  const template = readTemplate('selection-packet-template.md');
  if (!template) {
    console.error('Error: Selection packet template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    SELECTION_ID: selectionId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    SOURCE_SUMMARY: sourceSummaryLines.join('\n'),
    MODEL_OPTIONS: modelOptionLines.join('\n'),
    EVALUATION_CHECKLIST: evalLines.join('\n'),
    PREREQUISITES: prereqLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.selectionPackets,
    `selection_packet_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Selection packet staged ${selectionId}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('STAGE_SELECTION', msg);
  await announceCompletion(`ASR selection packet staged for human review: ${selectionId}`, '10');
}

// 5. Approve Command
async function handleApprove() {
  if (!REQUIRE_HUMAN_APPROVAL) {
    console.error('Safety violation: REQUIRE_HUMAN_APPROVAL is disabled but should be enabled.');
    process.exit(1);
  }

  await announceIntent('Recording human approval decision for ASR selection');
  console.log('Recording approval decision...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const approvalId = generateRequestId();

  // Check for existing selection packets
  const packetCount = countFiles(outputFolders.selectionPackets);
  if (packetCount === 0) {
    console.error('Error: No selection packets found. Run `stage-selection` first.');
    process.exit(1);
  }

  // List latest selection packet
  const packets = fs.readdirSync(outputFolders.selectionPackets)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  const latestPacket = packets[0];

  const approvalContent = `# ASR Selection Approval Record

- **Approval ID:** ${approvalId}
- **Date:** ${dateStr}
- **Timestamp:** ${new Date().toISOString()}
- **Status:** APPROVED
- **Decision By:** Human Operator (manual)
- **Selection Packet:** \`${latestPacket}\`

---

## Approval Decision

This approval record confirms that a human operator has reviewed the
ASR candidate and model selection packet and has approved the selections
contained within.

## Safety Confirmation

- [x] REQUIRE_HUMAN_APPROVAL enforced
- [x] REQUIRE_MANUAL_SELECTION enforced
- [x] ALLOW_AUTOMATED_ASR remains false
- [x] ALLOW_MODEL_DOWNLOADS remains false
- [x] No automated execution triggered by this approval

## Next Steps

1. Manually acquire the selected model binary per the command sheet
2. Verify checksum integrity against the model gate registry
3. Stage audio inputs for initial test transcription
4. Run manual verification pass before production use

---

*This approval is a record only. No automated actions have been or will be triggered.*
`;

  const safePath = getSafeWritePath(
    outputFolders.approvalRecords,
    `approval_record_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, approvalContent);

  const msg = `Approval recorded ${approvalId} for packet ${latestPacket}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('APPROVE', msg);
  await announceCompletion(`ASR selection approved: ${approvalId}`, '10');
}

// 6. Reject Command
async function handleReject() {
  await announceIntent('Recording human rejection decision for ASR selection');
  console.log('Recording rejection decision...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const rejectionId = generateRequestId();

  // Check for existing selection packets
  const packetCount = countFiles(outputFolders.selectionPackets);
  if (packetCount === 0) {
    console.error('Error: No selection packets found. Run `stage-selection` first.');
    process.exit(1);
  }

  const packets = fs.readdirSync(outputFolders.selectionPackets)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  const latestPacket = packets[0];

  const rejectionContent = `# ASR Selection Rejection Record

- **Rejection ID:** ${rejectionId}
- **Date:** ${dateStr}
- **Timestamp:** ${new Date().toISOString()}
- **Status:** REJECTED
- **Decision By:** Human Operator (manual)
- **Selection Packet:** \`${latestPacket}\`

---

## Rejection Decision

This rejection record confirms that a human operator has reviewed the
ASR candidate and model selection packet and has rejected the selections.

## Reason for Rejection

*(To be filled by human operator)*

- [ ] Model size exceeds available resources
- [ ] Accuracy benchmarks insufficient
- [ ] Latency requirements not met
- [ ] Language coverage gaps
- [ ] Offline compatibility issues
- [ ] Other: _______________

## Next Steps

1. Review rejection reasons and update selection criteria
2. Re-stage selection packet with revised candidates
3. Re-evaluate model options against updated requirements

---

*This rejection is a record only. No automated actions have been or will be triggered.*
`;

  const safePath = getSafeWritePath(
    outputFolders.approvalRecords,
    `rejection_record_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, rejectionContent);

  const msg = `Rejection recorded ${rejectionId} for packet ${latestPacket}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('REJECT', msg);
  await announceCompletion(`ASR selection rejected: ${rejectionId}`, '10');
}

// 7. Obsidian Export Command
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging ASR approval selection summary for Obsidian export');
  console.log('Staging Obsidian export summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();

  // Scan ASR sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [source, sourcePath] of Object.entries(asrSources)) {
    sourceResults[source] = scanSource(sourcePath);
  }

  // Compute summary
  const totalSources = Object.values(sourceResults).filter(r => r.exists).length;
  const totalFiles = Object.values(sourceResults).reduce((sum, r) => sum + r.fileCount, 0);
  const packetCount = countFiles(outputFolders.selectionPackets);
  const candidateCount = countFiles(outputFolders.candidateReviews);
  const modelCount = countFiles(outputFolders.modelReviews);
  const approvalCount = countFiles(outputFolders.approvalRecords);

  const summaryLines: string[] = [
    `- **ASR Sources Available:** ${totalSources} of ${Object.keys(sourceResults).length}`,
    `- **Total Source Files:** ${totalFiles}`,
    `- **Selection Packets Staged:** ${packetCount}`,
    `- **Candidate Reviews:** ${candidateCount}`,
    `- **Model Reviews:** ${modelCount}`,
    `- **Approval/Rejection Records:** ${approvalCount}`,
  ];

  // Source states
  const stateLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    const status = result.exists ? (result.fileCount > 0 ? 'Active' : 'Empty') : 'Missing';
    stateLines.push(`- **${source}:** ${status} (${result.fileCount} files)`);
  }

  // Active selections
  let selectionStr = 'No selection packets staged yet. Run `stage-selection` to create one.';
  if (packetCount > 0) {
    const packetFiles = fs.readdirSync(outputFolders.selectionPackets).filter(f => f.endsWith('.md'));
    selectionStr = packetFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Approval status
  let approvalStr = 'No approval or rejection decisions recorded yet.';
  if (approvalCount > 0) {
    const approvalFiles = fs.readdirSync(outputFolders.approvalRecords).filter(f => f.endsWith('.md'));
    approvalStr = approvalFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Next actions
  const nextActionLines: string[] = [
    '- [ ] Review ASR pipeline source directories for completeness',
    '- [ ] List and evaluate candidate entries from upstream phases',
    '- [ ] Review supported model families and evaluation criteria',
    '- [ ] Stage selection packet for human review',
    '- [ ] Record approval or rejection decision',
    '- [ ] Proceed to manual model acquisition if approved',
  ];

  const template = readTemplate('obsidian-export-template.md');
  if (!template) {
    console.error('Error: Obsidian export template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    SELECTION_SUMMARY: summaryLines.join('\n'),
    SOURCE_STATES: stateLines.join('\n'),
    ACTIVE_SELECTIONS: selectionStr,
    APPROVAL_STATUS: approvalStr,
    NEXT_ACTIONS: nextActionLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.root,
    `asr_approval_selection_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('ASR approval selection Obsidian export staged', '10');
}

// Main dispatcher
async function main() {
  if (ALLOW_AUTOMATED_ASR) {
    console.error('Safety gate: ALLOW_AUTOMATED_ASR is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_MODEL_DOWNLOADS) {
    console.error('Safety gate: ALLOW_MODEL_DOWNLOADS is enabled. This is not permitted.');
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error('Safety gate: ALLOW_EXTERNAL_API_CALLS is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run asr-human-approval-selection-packet-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'list-candidates':
      await handleListCandidates();
      break;
    case 'list-models':
      await handleListModels();
      break;
    case 'stage-selection':
      await handleStageSelection();
      break;
    case 'approve':
      await handleApprove();
      break;
    case 'reject':
      await handleReject();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run asr-human-approval-selection-packet-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
