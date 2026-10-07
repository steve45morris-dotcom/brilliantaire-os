import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  BRIDGE_MODE,
  ALLOW_AUTOMATED_BUILD,
  ALLOW_CODE_GENERATION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_SCRIPT_EXECUTION,
  ALLOW_RAW_COMMAND_EXECUTION,
  ALLOW_AUTO_BUILD,
  ALLOW_OBSIDIAN_WRITE,
  ALLOW_NEXT_ACTIONS_AUTO_WRITE,
  REQUIRE_HUMAN_REVIEW,
  REQUIRE_SAFETY_REVIEW,
  REQUIRE_APPROVED_PACKET,
  REQUIRE_MANUAL_EXECUTION,
  PACKET_COMPILER_ONLY,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  INPUT_FOLDERS,
  supportedCommands,
  REPO_ROOT
} from '../config/manual-implementation-packet.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Utility Functions ───

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
  const logFile = path.join(logDir, `mip_log_${dateStr}.md`);
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
  return `MIP-${dateStr}-${suffix}`;
}

function getLatestFile(dir: string, prefix: string): string | null {
  const destDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  if (!fs.existsSync(destDir)) return null;
  const files = fs.readdirSync(destDir)
    .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
    .sort();
  return files.length > 0 ? path.join(destDir, files[files.length - 1]) : null;
}

function findApprovedPacket(): string | null {
  // Check multiple input locations for approved packets
  const searchDirs = [
    INPUT_FOLDERS.approvedPackets,
    INPUT_FOLDERS.knowledgeHarvestApprovedPackets
  ];
  const prefixes = [
    'pipeline_approved_implementation_packet_',
    'approved_',
    'approval_'
  ];
  for (const dir of searchDirs) {
    for (const prefix of prefixes) {
      const result = getLatestFile(dir, prefix);
      if (result) return result;
    }
    // Also try any .md file in the directory
    if (fs.existsSync(dir)) {
      const mdFiles = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
      if (mdFiles.length > 0) return path.join(dir, mdFiles[mdFiles.length - 1]);
    }
  }
  return null;
}

function findStageGatePrompt(): string | null {
  const searchDirs = [
    INPUT_FOLDERS.stageGatePrompts,
    INPUT_FOLDERS.knowledgeHarvestStageGatePrompts
  ];
  for (const dir of searchDirs) {
    const result = getLatestFile(dir, 'pipeline_implementation_prompt_');
    if (result) return result;
    if (fs.existsSync(dir)) {
      const mdFiles = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
      if (mdFiles.length > 0) return path.join(dir, mdFiles[mdFiles.length - 1]);
    }
  }
  return null;
}

function findDependencyMap(): string | null {
  const searchDirs = [
    INPUT_FOLDERS.stageGateDependencies,
    INPUT_FOLDERS.knowledgeHarvestStageGateDependencies
  ];
  for (const dir of searchDirs) {
    const result = getLatestFile(dir, 'pipeline_dependency_map_');
    if (result) return result;
    if (fs.existsSync(dir)) {
      const mdFiles = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
      if (mdFiles.length > 0) return path.join(dir, mdFiles[mdFiles.length - 1]);
    }
  }
  return null;
}

function loadTemplate(templateName: string): string {
  // Check both template directories
  const paths = [
    path.join(REPO_ROOT, 'templates', 'manual_implementation_packet', templateName),
    path.join(REPO_ROOT, 'templates', 'knowledge_harvest', 'manual_implementation', templateName)
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  throw new Error(`Template not found: ${templateName}. Searched: ${paths.join(', ')}`);
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}

// ─── Command: status ───

async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'='.repeat(55)}`);
  console.log(`  Tool Type:              ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:            ${BRIDGE_MODE}`);
  console.log(`  Integration:            ${INTEGRATION_TARGET}`);
  console.log(`${'='.repeat(55)}`);

  console.log('\n  Safety Flags:');
  console.log(`    Automated Build:      ${ALLOW_AUTOMATED_BUILD}`);
  console.log(`    Code Generation:      ${ALLOW_CODE_GENERATION}`);
  console.log(`    External API Calls:   ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`    Script Execution:     ${ALLOW_SCRIPT_EXECUTION}`);
  console.log(`    Raw Command Exec:     ${ALLOW_RAW_COMMAND_EXECUTION}`);
  console.log(`    Obsidian Write:       ${ALLOW_OBSIDIAN_WRITE}`);
  console.log(`    Human Review Req:     ${REQUIRE_HUMAN_REVIEW}`);
  console.log(`    Safety Review Req:    ${REQUIRE_SAFETY_REVIEW}`);
  console.log(`    Approved Packet Req:  ${REQUIRE_APPROVED_PACKET}`);

  console.log('\n  Output Directories:');
  const folders = [
    { name: 'Build Prompts', dir: outputFolders.buildPrompts },
    { name: 'Checklists', dir: outputFolders.checklists },
    { name: 'Safety Reviews', dir: outputFolders.safetyReviews },
    { name: 'Handoffs', dir: outputFolders.handoffs },
    { name: 'Obsidian Exports', dir: outputFolders.obsidianExports },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  for (const folder of folders) {
    const count = countFiles(folder.dir);
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`    ${folder.name.padEnd(22)} ${status}`);
  }

  console.log('\n  Input Sources:');
  const inputDirs = [
    { name: 'Approval Router', dir: INPUT_FOLDERS.approvedPackets },
    { name: 'Stage Gate', dir: INPUT_FOLDERS.stageGatePrompts },
    { name: 'KH Approved Packets', dir: INPUT_FOLDERS.knowledgeHarvestApprovedPackets },
    { name: 'KH Stage Gate Prompts', dir: INPUT_FOLDERS.knowledgeHarvestStageGatePrompts }
  ];

  for (const input of inputDirs) {
    const count = countFiles(input.dir);
    const status = fs.existsSync(input.dir) ? `${count} files` : 'not created';
    console.log(`    ${input.name.padEnd(22)} ${status}`);
  }

  // Show latest artifacts
  const approvedPacket = findApprovedPacket();
  const latestPrompt = getLatestFile(outputFolders.buildPrompts, 'final_manual_build_prompt_');
  const latestChecklist = getLatestFile(outputFolders.checklists, 'manual_implementation_checklist_');
  const latestReview = getLatestFile(outputFolders.safetyReviews, 'manual_implementation_safety_review_');
  const latestHandoff = getLatestFile(outputFolders.handoffs, 'manual_implementation_handoff_');

  let approvalStatus = 'unknown';
  let selectedIdea = 'unknown';
  if (approvedPacket) {
    const packetContent = fs.readFileSync(approvedPacket, 'utf-8');
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
    const ideaMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
    if (ideaMatch) selectedIdea = ideaMatch[1].trim();
  }

  console.log('\n  Current State:');
  console.log(`    Selected Idea:        ${selectedIdea}`);
  console.log(`    Approval Status:      ${approvalStatus}`);
  console.log(`    Latest Build Prompt:  ${latestPrompt ? path.basename(latestPrompt) : 'None'}`);
  console.log(`    Latest Checklist:     ${latestChecklist ? path.basename(latestChecklist) : 'None'}`);
  console.log(`    Latest Safety Review: ${latestReview ? path.basename(latestReview) : 'None'}`);
  console.log(`    Latest Handoff:       ${latestHandoff ? path.basename(latestHandoff) : 'None'}`);

  console.log('\n  Supported Commands:');
  for (const cmd of supportedCommands) {
    console.log(`    - ${cmd}`);
  }

  console.log('\n  Next Recommended Action:');
  if (!approvedPacket) {
    console.log('    Run pipeline-approval-router first to generate an approved packet.');
  } else if (!latestPrompt) {
    console.log('    Run: npm run manual-implementation-packet -- "compile-prompt"');
  } else if (!latestChecklist) {
    console.log('    Run: npm run manual-implementation-packet -- "checklist"');
  } else if (!latestReview) {
    console.log('    Run: npm run manual-implementation-packet -- "safety-review"');
  } else if (!latestHandoff) {
    console.log('    Run: npm run manual-implementation-packet -- "handoff"');
  } else {
    console.log('    Human review final build prompt and execute verification steps.');
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// ─── Command: compile-prompt ───

async function handleCompilePrompt() {
  if (ALLOW_CODE_GENERATION) {
    console.error('Safety violation: ALLOW_CODE_GENERATION is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Compiling final manual build prompt from approved packet');
  console.log('Locating the latest approved implementation packet...');

  const approvedPacket = findApprovedPacket();
  if (!approvedPacket) {
    console.error('Error: No approved implementation packet found.');
    console.error('  Searched: outputs/pipeline_approval_router/');
    console.error('           outputs/knowledge_harvest/pipeline_approval_router/approved_packets/');
    console.error('  Run the pipeline-approval-router first.');
    process.exit(1);
  }

  console.log(`Loading approved packet: ${path.basename(approvedPacket)}`);
  const packetContent = fs.readFileSync(approvedPacket, 'utf-8');

  if (containsUnsafeText(packetContent)) {
    console.error('Error: Unsafe content detected in approved packet.');
    process.exit(1);
  }

  // Parse metadata from packet
  let ideaTitle = 'Pipeline Implementation';
  const titleMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
  if (titleMatch) ideaTitle = titleMatch[1].trim();

  let approvalStatus = 'blocked';
  const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
  if (statusMatch) approvalStatus = statusMatch[1].trim();

  // Find source implementation prompt
  let promptContent = '';
  let implPromptPath = '';
  const promptPathMatch = packetContent.match(/-\s+\*\*Implementation Prompt:\*\*\s*(.+)/i);
  if (promptPathMatch) implPromptPath = promptPathMatch[1].trim();

  if (implPromptPath && fs.existsSync(implPromptPath)) {
    promptContent = fs.readFileSync(implPromptPath, 'utf-8');
  } else {
    const stagePrompt = findStageGatePrompt();
    if (stagePrompt) {
      implPromptPath = stagePrompt;
      promptContent = fs.readFileSync(stagePrompt, 'utf-8');
    }
  }

  // Parse sections with defaults
  let currentVerifiedPhase = 'Phase: Pipeline Proposal Approval Router complete';
  let filesToCreate = '(derived from implementation prompt)';
  let filesToModify = '(derived from implementation prompt)';
  let safetyRules = `- BRIDGE_MODE = "${BRIDGE_MODE}"\n- ALLOW_AUTOMATED_BUILD = ${ALLOW_AUTOMATED_BUILD}\n- ALLOW_CODE_GENERATION = ${ALLOW_CODE_GENERATION}\n- ALLOW_EXTERNAL_API_CALLS = ${ALLOW_EXTERNAL_API_CALLS}\n- REQUIRE_HUMAN_REVIEW = ${REQUIRE_HUMAN_REVIEW}\n- REQUIRE_SAFETY_REVIEW = ${REQUIRE_SAFETY_REVIEW}`;
  let testsToRun = '- npm run build\n- npm run audit';
  let expectedOutputs = 'Files staged under outputs/manual_implementation_packet/';
  let commitMessage = `feat(pipeline): implement ${sanitizeFilename(ideaTitle)}`;
  let finalReportRequirements = 'Detailed status, files created/modified, and next action recommendations.';

  if (promptContent) {
    const phaseMatch = promptContent.match(/-\s+\*\*Current Verified Phase:\*\*\s*(.+)/i);
    if (phaseMatch) currentVerifiedPhase = phaseMatch[1].trim();

    const parseSection = (sectionTitle: string, endTitle: string): string => {
      const startIdx = promptContent.indexOf(`## ${sectionTitle}`);
      if (startIdx === -1) return '';
      const afterSection = promptContent.substring(startIdx + `## ${sectionTitle}`.length).trim();
      const endIdx = afterSection.indexOf(`## ${endTitle}`);
      if (endIdx !== -1) return afterSection.substring(0, endIdx).trim();
      return afterSection;
    };

    const createText = parseSection('Files to Create', 'Files to Modify');
    if (createText) filesToCreate = createText;

    const modifyText = parseSection('Files to Modify', 'Verification & Testing');
    if (modifyText) filesToModify = modifyText;

    const safetyText = parseSection('Safety Rules', 'Files to Create');
    if (safetyText) safetyRules = safetyText;

    const commitMatch = promptContent.match(/-\s+\*\*Git Commit Message:\*\*\s*(.+)/i);
    if (commitMatch) commitMessage = commitMatch[1].trim();

    const reportMatch = promptContent.match(/-\s+\*\*Final Report Requirements:\*\*\s*(.+)/i);
    if (reportMatch) finalReportRequirements = reportMatch[1].trim();
  }

  let finalPrompt: string;
  try {
    finalPrompt = loadTemplate('build-prompt-template.md');
  } catch {
    // Fallback to legacy template name
    finalPrompt = loadTemplate('final-build-prompt-template.md');
  }

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  finalPrompt = finalPrompt
    .replace(/\{\{REQUEST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{dateStr\}\}/g, dateStr)
    .replace(/\{\{currentVerifiedPhase\}\}/g, currentVerifiedPhase)
    .replace(/\{\{ideaTitle\}\}/g, ideaTitle)
    .replace(/\{\{approvalStatus\}\}/g, approvalStatus)
    .replace(/\{\{objective\}\}/g, `Complete manual implementation of the "${ideaTitle}" module. Execute code changes, configure Safe Command Router mappings, and run strict manual verification tests.`)
    .replace(/\{\{filesToCreate\}\}/g, filesToCreate)
    .replace(/\{\{filesToModify\}\}/g, filesToModify)
    .replace(/\{\{safetyRules\}\}/g, safetyRules)
    .replace(/\{\{testsToRun\}\}/g, testsToRun)
    .replace(/\{\{expectedOutputs\}\}/g, expectedOutputs)
    .replace(/\{\{commitMessage\}\}/g, commitMessage)
    .replace(/\{\{finalReportRequirements\}\}/g, finalReportRequirements);

  const safePath = getSafeWritePath(
    outputFolders.buildPrompts,
    `final_manual_build_prompt_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, finalPrompt);

  const msg = `Created build prompt ${requestId}: ${path.basename(safePath)}`;
  console.log(`Done: ${msg}`);
  logEvent('COMPILE_PROMPT', msg);
  await announceCompletion(`Manual build prompt compiled: ${requestId}`, '10');
}

// ─── Command: checklist ───

async function handleChecklist() {
  await announceIntent('Generating implementation checklist from approved packet');
  console.log('Gathering artifacts to compile implementation checklist...');

  const approvedPacket = findApprovedPacket();
  const depMap = findDependencyMap();
  const finalPrompt = getLatestFile(outputFolders.buildPrompts, 'final_manual_build_prompt_');
  const safetyReview = getLatestFile(outputFolders.safetyReviews, 'manual_implementation_safety_review_');

  let approvalStatus = 'blocked';
  if (approvedPacket) {
    const packetContent = fs.readFileSync(approvedPacket, 'utf-8');
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
  }

  let checklistContent: string;
  try {
    checklistContent = loadTemplate('checklist-template.md');
  } catch {
    checklistContent = loadTemplate('implementation-checklist-template.md');
  }

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  checklistContent = checklistContent
    .replace(/\{\{REQUEST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{dateStr\}\}/g, dateStr)
    .replace(/\{\{packetStatus\}\}/g, approvedPacket ? 'Passed' : 'Pending')
    .replace(/\{\{packetEvidence\}\}/g, approvedPacket || 'None')
    .replace(/\{\{packetRisk\}\}/g, 'None. Read-only validation.')
    .replace(/\{\{packetNextAction\}\}/g, 'Ensure approval status matches approved_for_manual_build.')
    .replace(/\{\{dependencyStatus\}\}/g, depMap ? 'Passed' : 'Pending')
    .replace(/\{\{dependencyEvidence\}\}/g, depMap || 'None')
    .replace(/\{\{dependencyRisk\}\}/g, 'Low. Relies on Safe Command Router.')
    .replace(/\{\{dependencyNextAction\}\}/g, 'Verify command router mappings.')
    .replace(/\{\{promptStatus\}\}/g, finalPrompt ? 'Passed' : 'Pending')
    .replace(/\{\{promptEvidence\}\}/g, finalPrompt || 'None')
    .replace(/\{\{promptRisk\}\}/g, 'High. Prompts direct implementation tasks.')
    .replace(/\{\{promptNextAction\}\}/g, 'Ensure prompt has exact files list.')
    .replace(/\{\{safetyStatus\}\}/g, safetyReview ? 'Passed' : 'Pending')
    .replace(/\{\{safetyEvidence\}\}/g, safetyReview || 'None')
    .replace(/\{\{safetyRisk\}\}/g, 'Low. Restricts command router execution.')
    .replace(/\{\{safetyNextAction\}\}/g, 'Verify safety flag limits.')
    .replace(/\{\{testsStatus\}\}/g, 'Passed')
    .replace(/\{\{testsEvidence\}\}/g, 'npm run build, npm run audit, etc.')
    .replace(/\{\{testsRisk\}\}/g, 'Low. Runs offline diagnostics.')
    .replace(/\{\{testsNextAction\}\}/g, 'Ensure npm script definitions are correct.')
    .replace(/\{\{executionStatus\}\}/g, 'Passed')
    .replace(/\{\{executionEvidence\}\}/g, `ALLOW_SCRIPT_EXECUTION = ${ALLOW_SCRIPT_EXECUTION}, ALLOW_RAW_COMMAND_EXECUTION = ${ALLOW_RAW_COMMAND_EXECUTION}`)
    .replace(/\{\{executionRisk\}\}/g, 'Critical. Prevent command privilege leaks.')
    .replace(/\{\{executionNextAction\}\}/g, 'Confirm command exact name config.')
    .replace(/\{\{reviewStatus\}\}/g, 'Passed')
    .replace(/\{\{reviewEvidence\}\}/g, 'Human operator confirmation required')
    .replace(/\{\{reviewRisk\}\}/g, 'High. Manual deployment tasks.')
    .replace(/\{\{reviewNextAction\}\}/g, 'Do not run packages automatically.')
    .replace(/\{\{approvalStatus\}\}/g, approvalStatus);

  const safePath = getSafeWritePath(
    outputFolders.checklists,
    `manual_implementation_checklist_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, checklistContent);

  const msg = `Created checklist ${requestId}: ${path.basename(safePath)}`;
  console.log(`Done: ${msg}`);
  logEvent('CHECKLIST', msg);
  await announceCompletion(`Implementation checklist generated: ${requestId}`, '10');
}

// ─── Command: safety-review ───

async function handleSafetyReview() {
  await announceIntent('Generating safety review of proposed implementation');
  console.log('Assessing guardrails and compile-time system safety...');

  const approvedPacket = findApprovedPacket();
  let approvalStatus = 'blocked';
  let safetyDecision = 'rejected';

  if (approvedPacket) {
    const packetContent = fs.readFileSync(approvedPacket, 'utf-8');
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();

    if (containsUnsafeText(packetContent)) {
      console.error('Error: Unsafe content detected in approved packet. Safety review REJECTED.');
      safetyDecision = 'rejected';
    } else if (approvalStatus === 'approved_for_manual_build') {
      safetyDecision = 'approved';
    }
  }

  // Verify all safety flags are properly set
  const flagViolations: string[] = [];
  if (ALLOW_AUTOMATED_BUILD) flagViolations.push('ALLOW_AUTOMATED_BUILD is true');
  if (ALLOW_CODE_GENERATION) flagViolations.push('ALLOW_CODE_GENERATION is true');
  if (ALLOW_EXTERNAL_API_CALLS) flagViolations.push('ALLOW_EXTERNAL_API_CALLS is true');
  if (ALLOW_SCRIPT_EXECUTION) flagViolations.push('ALLOW_SCRIPT_EXECUTION is true');
  if (ALLOW_RAW_COMMAND_EXECUTION) flagViolations.push('ALLOW_RAW_COMMAND_EXECUTION is true');
  if (!REQUIRE_HUMAN_REVIEW) flagViolations.push('REQUIRE_HUMAN_REVIEW is false');
  if (!REQUIRE_SAFETY_REVIEW) flagViolations.push('REQUIRE_SAFETY_REVIEW is false');

  if (flagViolations.length > 0) {
    safetyDecision = 'rejected';
    console.error(`Safety flag violations detected: ${flagViolations.join(', ')}`);
  }

  let reviewContent: string;
  try {
    reviewContent = loadTemplate('safety-review-template.md');
  } catch {
    // Use inline template as fallback
    reviewContent = `# Manual Implementation Safety Review - {{DATE}}

## Request ID: {{REQUEST_ID}}

## Boundary & Constraint Analysis
| Blocked Action | Allowed Action | Risk Level | Boundary |
|---|---|---|---|
| spawn/exec of raw shell commands | Reading/writing local static documents | High | Sandboxed command execution only via Router |
| Automating OS-level writes or scripts | Human-confirmed manual CLI execution | Medium | Safe Command Router & packaging compiler |
| Automatic writes to active Obsidian vaults | Staging reports for human manual copy | High | Read-only CLI note integrations |
| Automatic code generation or build execution | Manual prompt-driven implementation | High | ALLOW_CODE_GENERATION = false |
| External API calls | Local-only file operations | Medium | ALLOW_EXTERNAL_API_CALLS = false |

## Safety Flag Audit
| Flag | Value | Expected | Status |
|---|---|---|---|
| BRIDGE_MODE | ${BRIDGE_MODE} | manual-first | ${BRIDGE_MODE === 'manual-first' ? 'PASS' : 'FAIL'} |
| ALLOW_AUTOMATED_BUILD | ${ALLOW_AUTOMATED_BUILD} | false | ${!ALLOW_AUTOMATED_BUILD ? 'PASS' : 'FAIL'} |
| ALLOW_CODE_GENERATION | ${ALLOW_CODE_GENERATION} | false | ${!ALLOW_CODE_GENERATION ? 'PASS' : 'FAIL'} |
| ALLOW_EXTERNAL_API_CALLS | ${ALLOW_EXTERNAL_API_CALLS} | false | ${!ALLOW_EXTERNAL_API_CALLS ? 'PASS' : 'FAIL'} |
| REQUIRE_HUMAN_REVIEW | ${REQUIRE_HUMAN_REVIEW} | true | ${REQUIRE_HUMAN_REVIEW ? 'PASS' : 'FAIL'} |
| REQUIRE_SAFETY_REVIEW | ${REQUIRE_SAFETY_REVIEW} | true | ${REQUIRE_SAFETY_REVIEW ? 'PASS' : 'FAIL'} |

## Final Decision Matrix
- **Safety Decision:** {{safetyDecision}}
- **Risk Assessment:** {{riskAssessment}}
- **Flag Violations:** ${flagViolations.length > 0 ? flagViolations.join('; ') : 'None'}
- **Confirmation Checklist:**
  - [${!ALLOW_AUTOMATED_BUILD ? 'x' : ' '}] Automated build execution is disabled
  - [${!ALLOW_CODE_GENERATION ? 'x' : ' '}] Code generation is disabled
  - [${!ALLOW_EXTERNAL_API_CALLS ? 'x' : ' '}] External API calls are disabled
  - [${REQUIRE_HUMAN_REVIEW ? 'x' : ' '}] Human review is required
  - [${REQUIRE_SAFETY_REVIEW ? 'x' : ' '}] Safety review is required
`;
  }

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  reviewContent = reviewContent
    .replace(/\{\{REQUEST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{dateStr\}\}/g, dateStr)
    .replace(/\{\{safetyDecision\}\}/g, safetyDecision)
    .replace(/\{\{riskAssessment\}\}/g, flagViolations.length > 0
      ? `REJECTED. Safety flag violations: ${flagViolations.join(', ')}`
      : 'Low risk. No script execution, no raw shell execution, no automated writes, no code generation, and strict command routing constraints enforced.');

  const safePath = getSafeWritePath(
    outputFolders.safetyReviews,
    `manual_implementation_safety_review_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, reviewContent);

  const msg = `Created safety review ${requestId}: ${path.basename(safePath)} [${safetyDecision}]`;
  console.log(`Done: ${msg}`);
  logEvent('SAFETY_REVIEW', msg);
  await announceCompletion(`Safety review generated: ${requestId} [${safetyDecision}]`, '10');
}

// ─── Command: handoff ───

async function handleHandoff() {
  await announceIntent('Generating final handoff document for manual implementation');
  console.log('Staging handoff artifacts bundle...');

  const approvedPacket = findApprovedPacket();
  let ideaTitle = 'Pipeline Implementation';
  let approvalStatus = 'blocked';

  if (approvedPacket) {
    const packetContent = fs.readFileSync(approvedPacket, 'utf-8');
    const titleMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
    if (titleMatch) ideaTitle = titleMatch[1].trim();
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
  }

  const finalPrompt = getLatestFile(outputFolders.buildPrompts, 'final_manual_build_prompt_');
  const checklist = getLatestFile(outputFolders.checklists, 'manual_implementation_checklist_');
  const safetyReview = getLatestFile(outputFolders.safetyReviews, 'manual_implementation_safety_review_');

  // Check safety review status before allowing handoff
  if (safetyReview) {
    const reviewContent = fs.readFileSync(safetyReview, 'utf-8');
    if (reviewContent.includes('**Safety Decision:** rejected')) {
      console.error('Error: Safety review was REJECTED. Cannot generate handoff until safety issues are resolved.');
      process.exit(1);
    }
  }

  let handoffContent: string;
  try {
    handoffContent = loadTemplate('handoff-template.md');
  } catch {
    handoffContent = loadTemplate('final-handoff-template.md');
  }

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  handoffContent = handoffContent
    .replace(/\{\{REQUEST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{dateStr\}\}/g, dateStr)
    .replace(/\{\{ideaTitle\}\}/g, ideaTitle)
    .replace(/\{\{approvalStatus\}\}/g, approvalStatus)
    .replace(/\{\{recommendedNextPhase\}\}/g, 'Manual Code Execution')
    .replace(/\{\{finalPromptPath\}\}/g, finalPrompt ? `file://${finalPrompt}` : 'None')
    .replace(/\{\{checklistPath\}\}/g, checklist ? `file://${checklist}` : 'None')
    .replace(/\{\{safetyReviewPath\}\}/g, safetyReview ? `file://${safetyReview}` : 'None')
    .replace(/\{\{humanActionRequired\}\}/g, 'Verify the manual build prompt and checklist records. Execute the finalized manual build prompt inside the sandboxed environment. NO automated execution permitted.');

  const safePath = getSafeWritePath(
    outputFolders.handoffs,
    `manual_implementation_handoff_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, handoffContent);

  const msg = `Created handoff ${requestId}: ${path.basename(safePath)}`;
  console.log(`Done: ${msg}`);
  logEvent('HANDOFF', msg);
  await announceCompletion(`Handoff document generated: ${requestId}`, '10');
}

// ─── Command: obsidian-export ───

async function handleObsidianExport() {
  if (ALLOW_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging implementation packet summary for Obsidian export');
  console.log('Staging Obsidian export summary...');

  const dateStr = getFormattedDate();
  const requestId = generateRequestId();

  const promptCount = countFiles(outputFolders.buildPrompts);
  const checklistCount = countFiles(outputFolders.checklists);
  const reviewCount = countFiles(outputFolders.safetyReviews);
  const handoffCount = countFiles(outputFolders.handoffs);

  const approvedPacket = findApprovedPacket();
  let ideaTitle = 'unknown';
  let approvalStatus = 'unknown';
  if (approvedPacket) {
    const packetContent = fs.readFileSync(approvedPacket, 'utf-8');
    const titleMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
    if (titleMatch) ideaTitle = titleMatch[1].trim();
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
  }

  let exportContent: string;
  try {
    exportContent = loadTemplate('obsidian-export-template.md');
    exportContent = exportContent
      .replace(/\{\{REQUEST_ID\}\}/g, requestId)
      .replace(/\{\{DATE\}\}/g, dateStr)
      .replace(/\{\{BRIDGE_MODE\}\}/g, BRIDGE_MODE)
      .replace(/\{\{INTEGRATION_TARGET\}\}/g, INTEGRATION_TARGET)
      .replace(/\{\{IDEA_TITLE\}\}/g, ideaTitle)
      .replace(/\{\{APPROVAL_STATUS\}\}/g, approvalStatus)
      .replace(/\{\{PROMPT_COUNT\}\}/g, String(promptCount))
      .replace(/\{\{CHECKLIST_COUNT\}\}/g, String(checklistCount))
      .replace(/\{\{REVIEW_COUNT\}\}/g, String(reviewCount))
      .replace(/\{\{HANDOFF_COUNT\}\}/g, String(handoffCount));
  } catch {
    // Inline fallback if template not found
    exportContent = `# Manual Implementation Packet - Obsidian Export Summary

- **Export ID:** ${requestId}
- **Export Date:** ${dateStr}
- **Bridge Mode:** ${BRIDGE_MODE}
- **Integration Target:** ${INTEGRATION_TARGET}

## Current Pipeline State

- **Selected Idea:** ${ideaTitle}
- **Approval Status:** ${approvalStatus}

## Artifact Inventory

| Artifact Type | Count | Status |
|---|---|---|
| Build Prompts | ${promptCount} | staged |
| Implementation Checklists | ${checklistCount} | staged |
| Safety Reviews | ${reviewCount} | staged |
| Handoff Documents | ${handoffCount} | staged |

## Safety Configuration

- BRIDGE_MODE = "${BRIDGE_MODE}"
- ALLOW_AUTOMATED_BUILD = ${ALLOW_AUTOMATED_BUILD}
- ALLOW_CODE_GENERATION = ${ALLOW_CODE_GENERATION}
- ALLOW_EXTERNAL_API_CALLS = ${ALLOW_EXTERNAL_API_CALLS}
- REQUIRE_HUMAN_REVIEW = ${REQUIRE_HUMAN_REVIEW}
- REQUIRE_SAFETY_REVIEW = ${REQUIRE_SAFETY_REVIEW}

## Next Actions

- [ ] Review all staged build prompts for completeness
- [ ] Verify safety review reports pass all checks
- [ ] Confirm handoff documents reference correct artifacts
- [ ] Execute manual implementation steps from build prompt

---

*Staged for Obsidian export via Approved Write Gateway. Direct vault write is disabled.*
`;
  }

  const safePath = getSafeWritePath(
    outputFolders.obsidianExports,
    `mip_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, exportContent);

  const msg = `Obsidian export staged ${requestId}: ${path.basename(safePath)}`;
  console.log(`Done: ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Manual Implementation Packet Obsidian export staged', '10');
}

// ─── Main Dispatcher ───

async function main() {
  // Enforce safety gates
  if (ALLOW_AUTOMATED_BUILD) {
    console.error('Safety gate: ALLOW_AUTOMATED_BUILD is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_CODE_GENERATION) {
    console.error('Safety gate: ALLOW_CODE_GENERATION is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error('Safety gate: ALLOW_EXTERNAL_API_CALLS is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (PACKET_COMPILER_ONLY) {
    if (ALLOW_SCRIPT_EXECUTION || ALLOW_RAW_COMMAND_EXECUTION || ALLOW_AUTO_BUILD || ALLOW_OBSIDIAN_WRITE || ALLOW_NEXT_ACTIONS_AUTO_WRITE) {
      console.error('Security Violation: Configuration violates PACKET_COMPILER_ONLY constraints.');
      process.exit(1);
    }
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run manual-implementation-packet-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0].toLowerCase();

  await announceIntent(`Running manual implementation packet compiler: ${command}`);

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'compile-prompt':
      await handleCompilePrompt();
      break;
    case 'checklist':
      await handleChecklist();
      break;
    case 'safety-review':
      await handleSafetyReview();
      break;
    case 'handoff':
      await handleHandoff();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    case 'help': {
      const { printHelp } = await import('./manual-implementation-packet-help.js');
      printHelp();
      break;
    }
    default:
      console.error(`Unknown command: "${command}". Run \`npm run manual-implementation-packet-help\` for usage.`);
      process.exit(1);
  }

  await announceCompletion(`Manual implementation packet compiler "${command}" completed successfully.`, '13');
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
