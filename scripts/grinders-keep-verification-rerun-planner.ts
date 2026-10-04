import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_AUTOMATED_EXECUTION,
  ALLOW_SCHEDULED_RUNS,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_MANUAL_COMMAND_EXECUTION,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  evidenceSources,
  verificationTaskTypes,
  schedulingModes,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/grinders-keep-verification-rerun-planner.js';

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
  const logFile = path.join(logDir, `verification_rerun_log_${dateStr}.md`);
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
  return `VRP-${dateStr}-${suffix}`;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function scanEvidenceSource(sourcePath: string): { exists: boolean; fileCount: number; files: string[] } {
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

// Ensure output directories exist
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
  console.log(`  Automated Execution:   ${ALLOW_AUTOMATED_EXECUTION}`);
  console.log(`  Scheduled Runs:        ${ALLOW_SCHEDULED_RUNS}`);
  console.log(`  External API:          ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  Manual Cmd Execution:  ${REQUIRE_MANUAL_COMMAND_EXECUTION}`);
  console.log(`${'─'.repeat(55)}`);

  const folders = [
    { name: 'Rerun Plans', dir: outputFolders.rerunPlans },
    { name: 'Command Sheets', dir: outputFolders.commandSheets },
    { name: 'Schedule Recommendations', dir: outputFolders.scheduleRecommendations },
    { name: 'Verification Status', dir: outputFolders.verificationStatus },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  Output Directories:');
  for (const folder of folders) {
    const count = countFiles(folder.dir);
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(28)} ${status}`);
  }

  console.log('\n  Evidence Sources:');
  for (const [phase, sourcePath] of Object.entries(evidenceSources)) {
    const scan = scanEvidenceSource(sourcePath);
    const status = scan.exists ? `${scan.fileCount} files` : 'not found';
    console.log(`     ${phase.padEnd(28)} ${status}`);
  }

  console.log('\n  Verification Task Types:');
  for (const vt of verificationTaskTypes) {
    console.log(`     - ${vt}`);
  }

  console.log('\n  Scheduling Modes (advisory):');
  for (const sm of schedulingModes) {
    console.log(`     - ${sm}`);
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// 2. Compile Plan Command
async function handleCompilePlan() {
  await announceIntent('Compiling verification rerun plan from evidence sources');
  console.log('Compiling verification rerun plan...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const planId = generateRequestId();

  // Scan all evidence sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [phase, sourcePath] of Object.entries(evidenceSources)) {
    sourceResults[phase] = scanEvidenceSource(sourcePath);
  }

  // Build evidence source summary
  const sourceSummaryLines: string[] = [];
  for (const [phase, result] of Object.entries(sourceResults)) {
    const statusStr = result.exists ? `Found (${result.fileCount} files)` : 'Not found';
    sourceSummaryLines.push(`- **${phase}:** ${statusStr}`);
    if (result.exists && result.files.length > 0) {
      for (const file of result.files.slice(0, 10)) {
        sourceSummaryLines.push(`  - \`${file}\``);
      }
      if (result.files.length > 10) {
        sourceSummaryLines.push(`  - ... and ${result.files.length - 10} more`);
      }
    }
  }

  // Build rerun task sequence
  const taskLines: string[] = [];
  let taskNum = 1;
  for (const taskType of verificationTaskTypes) {
    taskLines.push(`${taskNum}. **${taskType}**`);
    taskLines.push(`   - Command: \`npm run grinders-keep-verification-rerun-planner -- "command-sheet"\``);
    taskLines.push(`   - Execution: Manual only`);
    taskLines.push(`   - Prerequisites: Evidence source files present`);
    taskNum++;
  }

  // Build dependencies
  const depLines: string[] = [
    '- Phase 12V: Evidence Pack Completion Importer outputs',
    '- Phase 12W: Evidence Tracker Sync outputs',
    '- Phase 12X: Evidence Tracker Rerun Planner outputs',
    '- Phase 13I: Evidence Completion Detector outputs',
    '- Human operator available for manual command execution',
  ];

  // Build estimated effort
  const totalSources = Object.values(sourceResults).filter(r => r.exists).length;
  const totalFiles = Object.values(sourceResults).reduce((sum, r) => sum + r.fileCount, 0);
  const effortLines: string[] = [
    `- **Evidence sources available:** ${totalSources} of ${Object.keys(sourceResults).length}`,
    `- **Total evidence files:** ${totalFiles}`,
    `- **Verification tasks:** ${verificationTaskTypes.length}`,
    `- **Estimated manual time:** ${verificationTaskTypes.length * 5}-${verificationTaskTypes.length * 15} minutes`,
  ];

  const template = readTemplate('rerun-plan-template.md');
  if (!template) {
    console.error('Error: Rerun plan template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    PLAN_ID: planId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    EVIDENCE_SOURCE_SUMMARY: sourceSummaryLines.join('\n'),
    RERUN_TASK_SEQUENCE: taskLines.join('\n'),
    DEPENDENCIES: depLines.join('\n'),
    ESTIMATED_EFFORT: effortLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.rerunPlans,
    `verification_rerun_plan_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Compiled rerun plan ${planId}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('COMPILE_PLAN', msg);
  await announceCompletion(`Verification rerun plan compiled: ${planId}`, '10');
}

// 3. Command Sheet Command
async function handleCommandSheet() {
  await announceIntent('Generating manual command execution sheet');
  console.log('Generating manual command sheet...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const sheetId = generateRequestId();

  // Build command sequence
  const commandLines: string[] = [];
  let stepNum = 1;

  // Evidence source check commands
  commandLines.push(`### Step ${stepNum}: Check Evidence Source Availability`);
  commandLines.push('');
  for (const [phase, sourcePath] of Object.entries(evidenceSources)) {
    commandLines.push(`\`\`\`bash`);
    commandLines.push(`# ${phase}: Check if evidence source directory exists`);
    commandLines.push(`ls -la "${sourcePath}" 2>/dev/null || echo "${phase} source not found"`);
    commandLines.push(`\`\`\``);
    commandLines.push('');
  }
  stepNum++;

  // Rerun planner status check
  commandLines.push(`### Step ${stepNum}: Run Verification Rerun Planner Status`);
  commandLines.push('');
  commandLines.push('```bash');
  commandLines.push('npx ts-node scripts/grinders-keep-verification-rerun-planner.ts status');
  commandLines.push('```');
  commandLines.push('');
  stepNum++;

  // Compile rerun plan
  commandLines.push(`### Step ${stepNum}: Compile Verification Rerun Plan`);
  commandLines.push('');
  commandLines.push('```bash');
  commandLines.push('npx ts-node scripts/grinders-keep-verification-rerun-planner.ts compile-plan');
  commandLines.push('```');
  commandLines.push('');
  stepNum++;

  // Verification status
  commandLines.push(`### Step ${stepNum}: Check Verification Status`);
  commandLines.push('');
  commandLines.push('```bash');
  commandLines.push('npx ts-node scripts/grinders-keep-verification-rerun-planner.ts verification-status');
  commandLines.push('```');
  commandLines.push('');
  stepNum++;

  // Schedule recommendations
  commandLines.push(`### Step ${stepNum}: Generate Schedule Recommendations`);
  commandLines.push('');
  commandLines.push('```bash');
  commandLines.push('npx ts-node scripts/grinders-keep-verification-rerun-planner.ts schedule');
  commandLines.push('```');
  commandLines.push('');
  stepNum++;

  // Obsidian export
  commandLines.push(`### Step ${stepNum}: Stage Obsidian Export`);
  commandLines.push('');
  commandLines.push('```bash');
  commandLines.push('npx ts-node scripts/grinders-keep-verification-rerun-planner.ts obsidian-export');
  commandLines.push('```');
  commandLines.push('');

  // Post-execution steps
  const postExecLines: string[] = [
    '1. Review each command output for errors or warnings.',
    '2. Verify output files were created in `outputs/grinders_keep_verification_rerun/`.',
    '3. Check logs for any anomalies.',
    '4. Confirm no automated execution occurred.',
    '5. Review rerun plan before scheduling manual tasks.',
  ];

  const template = readTemplate('command-sheet-template.md');
  if (!template) {
    console.error('Error: Command sheet template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    SHEET_ID: sheetId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    COMMAND_SEQUENCE: commandLines.join('\n'),
    POST_EXECUTION_STEPS: postExecLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.commandSheets,
    `command_sheet_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Generated command sheet ${sheetId}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('COMMAND_SHEET', msg);
  await announceCompletion(`Manual command sheet generated: ${sheetId}`, '10');
}

// 4. Schedule Command
async function handleSchedule() {
  await announceIntent('Generating scheduling recommendations for verification reruns');
  console.log('Generating scheduling recommendations...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const recId = generateRequestId();

  // Scan evidence sources to determine priority
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [phase, sourcePath] of Object.entries(evidenceSources)) {
    sourceResults[phase] = scanEvidenceSource(sourcePath);
  }

  // Build schedule table
  const scheduleLines: string[] = [
    '| Task Type | Priority | Recommended Mode | Source Ready | Est. Duration |',
    '|---|---|---|---|---|',
  ];

  for (const taskType of verificationTaskTypes) {
    const hasAnySource = Object.values(sourceResults).some(r => r.exists && r.fileCount > 0);
    const priority = hasAnySource ? 'High' : 'Deferred';
    const mode = hasAnySource ? 'immediate-manual' : 'on-demand';
    const sourceReady = hasAnySource ? 'Yes' : 'No';
    scheduleLines.push(`| ${taskType} | ${priority} | ${mode} | ${sourceReady} | 5-15 min |`);
  }

  // Priority ranking
  const priorityLines: string[] = [];
  let rank = 1;
  const sourcesAvailable = Object.entries(sourceResults).filter(([, r]) => r.exists && r.fileCount > 0);
  const sourcesMissing = Object.entries(sourceResults).filter(([, r]) => !r.exists || r.fileCount === 0);

  if (sourcesAvailable.length > 0) {
    priorityLines.push('**Available sources (run verification first):**');
    for (const [phase] of sourcesAvailable) {
      priorityLines.push(`${rank}. ${phase} - source data available, verify immediately`);
      rank++;
    }
  }

  if (sourcesMissing.length > 0) {
    priorityLines.push('');
    priorityLines.push('**Missing sources (defer until collected):**');
    for (const [phase] of sourcesMissing) {
      priorityLines.push(`${rank}. ${phase} - source data not yet available`);
      rank++;
    }
  }

  if (priorityLines.length === 0) {
    priorityLines.push('No evidence sources detected. All verification tasks deferred until evidence is collected.');
  }

  // Time windows
  const timeLines: string[] = [
    `- **Best window:** Next manual session when operator is available`,
    `- **Batch mode:** Group all available verifications into a single session`,
    `- **Frequency:** Re-check after each evidence collection phase completes`,
    `- **Note:** All scheduling is advisory. ALLOW_SCHEDULED_RUNS = false.`,
  ];

  const template = readTemplate('schedule-recommendation-template.md');
  if (!template) {
    console.error('Error: Schedule recommendation template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    RECOMMENDATION_ID: recId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    SCHEDULE_TABLE: scheduleLines.join('\n'),
    PRIORITY_RANKING: priorityLines.join('\n'),
    TIME_WINDOWS: timeLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.scheduleRecommendations,
    `schedule_recommendation_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Generated schedule recommendation ${recId}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('SCHEDULE', msg);
  await announceCompletion(`Schedule recommendation generated: ${recId}`, '10');
}

// 5. Verification Status Command
async function handleVerificationStatus() {
  await announceIntent('Summarizing verification status across all evidence tasks');
  console.log('Summarizing verification status...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const statusId = generateRequestId();

  // Scan evidence sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [phase, sourcePath] of Object.entries(evidenceSources)) {
    sourceResults[phase] = scanEvidenceSource(sourcePath);
  }

  // Pipeline state
  const pipelineLines: string[] = [
    '| Phase | Source Directory | Status | File Count |',
    '|---|---|---|---|',
  ];

  for (const [phase, result] of Object.entries(sourceResults)) {
    const status = result.exists ? (result.fileCount > 0 ? 'Active' : 'Empty') : 'Missing';
    pipelineLines.push(`| ${phase} | ${(evidenceSources as any)[phase]} | ${status} | ${result.fileCount} |`);
  }

  // Completion matrix
  const matrixLines: string[] = [
    '| Task Type | Source Available | Verification Ready | Last Run |',
    '|---|---|---|---|',
  ];

  for (const taskType of verificationTaskTypes) {
    const anySource = Object.values(sourceResults).some(r => r.exists && r.fileCount > 0);
    matrixLines.push(`| ${taskType} | ${anySource ? 'Yes' : 'No'} | ${anySource ? 'Pending' : 'Blocked'} | (not yet run) |`);
  }

  // Blockers
  const blockerLines: string[] = [];
  const missingPhases = Object.entries(sourceResults).filter(([, r]) => !r.exists || r.fileCount === 0);

  if (missingPhases.length > 0) {
    for (const [phase] of missingPhases) {
      blockerLines.push(`- **${phase}:** Evidence source directory missing or empty. Run corresponding phase to generate outputs.`);
    }
  } else {
    blockerLines.push('No blockers detected. All evidence sources are available.');
  }

  // Next steps
  const nextStepLines: string[] = [];
  if (missingPhases.length > 0) {
    nextStepLines.push('1. Run missing evidence collection phases to populate source directories.');
    nextStepLines.push('2. Re-run `verification-status` to confirm sources are available.');
  }
  nextStepLines.push(`${missingPhases.length > 0 ? '3' : '1'}. Run \`compile-plan\` to generate a full verification rerun plan.`);
  nextStepLines.push(`${missingPhases.length > 0 ? '4' : '2'}. Run \`command-sheet\` to get manual execution instructions.`);
  nextStepLines.push(`${missingPhases.length > 0 ? '5' : '3'}. Run \`schedule\` for timing recommendations.`);

  const template = readTemplate('verification-status-template.md');
  if (!template) {
    console.error('Error: Verification status template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    STATUS_ID: statusId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    PIPELINE_STATE: pipelineLines.join('\n'),
    COMPLETION_MATRIX: matrixLines.join('\n'),
    BLOCKERS: blockerLines.join('\n'),
    NEXT_STEPS: nextStepLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.verificationStatus,
    `verification_status_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Generated verification status ${statusId}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('VERIFICATION_STATUS', msg);
  await announceCompletion(`Verification status summary generated: ${statusId}`, '10');
}

// 6. Obsidian Export Command
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging verification rerun planner summary for Obsidian export');
  console.log('Staging Obsidian export summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();

  // Scan evidence sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [phase, sourcePath] of Object.entries(evidenceSources)) {
    sourceResults[phase] = scanEvidenceSource(sourcePath);
  }

  // Planner summary
  const totalSources = Object.values(sourceResults).filter(r => r.exists).length;
  const totalFiles = Object.values(sourceResults).reduce((sum, r) => sum + r.fileCount, 0);
  const planCount = countFiles(outputFolders.rerunPlans);
  const sheetCount = countFiles(outputFolders.commandSheets);
  const schedCount = countFiles(outputFolders.scheduleRecommendations);
  const statusCount = countFiles(outputFolders.verificationStatus);

  const summaryLines: string[] = [
    `- **Evidence Sources Available:** ${totalSources} of ${Object.keys(sourceResults).length}`,
    `- **Total Evidence Files:** ${totalFiles}`,
    `- **Rerun Plans Generated:** ${planCount}`,
    `- **Command Sheets Generated:** ${sheetCount}`,
    `- **Schedule Recommendations:** ${schedCount}`,
    `- **Verification Status Reports:** ${statusCount}`,
  ];

  // Source states
  const stateLines: string[] = [];
  for (const [phase, result] of Object.entries(sourceResults)) {
    const status = result.exists ? (result.fileCount > 0 ? 'Active' : 'Empty') : 'Missing';
    stateLines.push(`- **${phase}:** ${status} (${result.fileCount} files)`);
  }

  // Active plans
  let planListStr = 'No rerun plans generated yet. Run `compile-plan` to create one.';
  if (planCount > 0) {
    const planFiles = fs.readdirSync(outputFolders.rerunPlans).filter(f => f.endsWith('.md'));
    planListStr = planFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Schedule summary
  let schedSummaryStr = 'No schedule recommendations generated yet. Run `schedule` to create one.';
  if (schedCount > 0) {
    const schedFiles = fs.readdirSync(outputFolders.scheduleRecommendations).filter(f => f.endsWith('.md'));
    schedSummaryStr = schedFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Next actions
  const nextActionLines: string[] = [
    '- [ ] Review all evidence source directories for completeness',
    '- [ ] Run verification status check across all phases',
    '- [ ] Compile rerun plan for pending verification tasks',
    '- [ ] Generate command sheets for manual execution',
    '- [ ] Review scheduling recommendations',
    '- [ ] Execute manual verification commands per command sheet',
  ];

  const template = readTemplate('obsidian-export-template.md');
  if (!template) {
    console.error('Error: Obsidian export template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    PLANNER_SUMMARY: summaryLines.join('\n'),
    SOURCE_STATES: stateLines.join('\n'),
    ACTIVE_PLANS: planListStr,
    SCHEDULE_SUMMARY: schedSummaryStr,
    NEXT_ACTIONS: nextActionLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.root,
    `verification_rerun_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Verification rerun planner Obsidian export staged', '10');
}

// Main dispatcher
async function main() {
  if (ALLOW_AUTOMATED_EXECUTION) {
    console.error('Safety gate: ALLOW_AUTOMATED_EXECUTION is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_SCHEDULED_RUNS) {
    console.error('Safety gate: ALLOW_SCHEDULED_RUNS is enabled. This is not permitted.');
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error('Safety gate: ALLOW_EXTERNAL_API_CALLS is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run grinders-keep-verification-rerun-planner-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'compile-plan':
      await handleCompilePlan();
      break;
    case 'command-sheet':
      await handleCommandSheet();
      break;
    case 'schedule':
      await handleSchedule();
      break;
    case 'verification-status':
      await handleVerificationStatus();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run grinders-keep-verification-rerun-planner-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
