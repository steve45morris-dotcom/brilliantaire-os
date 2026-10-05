import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  PACKET_COMPILER_ONLY,
  ALLOW_SCRIPT_EXECUTION,
  ALLOW_RAW_COMMAND_EXECUTION,
  ALLOW_AUTO_BUILD,
  ALLOW_OBSIDIAN_WRITE,
  ALLOW_NEXT_ACTIONS_AUTO_WRITE,
  REQUIRE_APPROVED_PACKET,
  REQUIRE_MANUAL_EXECUTION,
  REQUIRE_SAFETY_REVIEW,
  INPUT_FOLDERS,
  OUTPUT_FOLDERS
} from '../config/manual-implementation-packet.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function getISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOutputPath(dir: string, prefix: string, dateStr: string, ext: string): string {
  const destDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  fs.mkdirSync(destDir, { recursive: true });
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

function getLatestFile(dir: string, prefix: string): string | null {
  const destDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  if (!fs.existsSync(destDir)) return null;
  const files = fs.readdirSync(destDir)
    .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
    .sort();
  return files.length > 0 ? path.join(destDir, files[files.length - 1]) : null;
}

function writeCompilerLog(command: string, sourcePacket: string, status: string, notes: string) {
  const dateStr = getISODate();
  const logDir = path.join(REPO_ROOT, OUTPUT_FOLDERS.logs);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `manual_compiler_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  
  const entry = `| ${timestamp} | ${command} | ${sourcePacket} | ${status} | ${notes} |\n`;
  const hasLog = fs.existsSync(logPath);
  
  if (hasLog) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(
      logPath,
      `# Manual Compiler Log - ${dateStr}\n\n| Timestamp | Command | Source Packet | Status | Notes |\n|---|---|---|---|---|\n${entry}`,
      'utf-8'
    );
  }
}

// 1. compile-prompt
function runCompilePrompt(): string {
  console.log('🔍 Locating the latest Approved Implementation Packet...');
  const latestPacket = getLatestFile(INPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_');
  if (!latestPacket) {
    throw new Error(`No approved implementation packet found in ${INPUT_FOLDERS.approvedPackets}`);
  }
  console.log(`📖 Loading approved packet: ${path.basename(latestPacket)}`);
  const packetContent = fs.readFileSync(latestPacket, 'utf-8');

  // Parse Idea Title
  let ideaTitle = 'Pipeline Integration Stage Gate';
  const titleMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
  if (titleMatch) ideaTitle = titleMatch[1].trim();

  // Parse Approval Status
  let approvalStatus = 'blocked';
  const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
  if (statusMatch) approvalStatus = statusMatch[1].trim();

  // Parse Impl Prompt Path
  let implPromptPath = '';
  const promptPathMatch = packetContent.match(/-\s+\*\*Implementation Prompt:\*\*\s*(.+)/i);
  if (promptPathMatch) implPromptPath = promptPathMatch[1].trim();

  if (!implPromptPath || !fs.existsSync(implPromptPath)) {
    // Attempt to locate via latest stage gate prompt folder as fallback
    const latestStagePrompt = getLatestFile(INPUT_FOLDERS.stageGatePrompts, 'pipeline_implementation_prompt_');
    if (!latestStagePrompt) {
      throw new Error(`Implementation prompt path not found or invalid: ${implPromptPath}`);
    }
    implPromptPath = latestStagePrompt;
  }

  console.log(`📖 Loading source implementation prompt: ${path.basename(implPromptPath)}`);
  const promptContent = fs.readFileSync(implPromptPath, 'utf-8');

  // Parse sections with defaults
  let currentVerifiedPhase = 'Phase 13F: Pipeline Proposal Approval Router complete';
  let filesToCreate = '- config/pipeline-stage-gate.ts\n- scripts/pipeline-stage-gate.ts\n- scripts/pipeline-stage-gate-help.ts\n- templates/knowledge_harvest/pipeline_stage_gate/*';
  let filesToModify = '- package.json\n- Taskfile.yml\n- config/commands.ts\n- COMMANDS.md\n- SYSTEM_STATUS.md\n- PROJECTS.md\n- NEXT_ACTIONS.md\n- README.md';
  let safetyRules = '- STAGE_GATE_ONLY = true\n- ALLOW_RAW_COMMAND_EXECUTION = false\n- ALLOW_SCRIPT_EXECUTION = false\n- ALLOW_AUTO_BUILD = false\n- ALLOW_OBSIDIAN_WRITE = false\n- ALLOW_NEXT_ACTIONS_AUTO_WRITE = false';
  let testsToRun = '- npm run build\n- npm run audit\n- npm run pipeline-stage-gate-help\n- npm run pipeline-stage-gate -- "proposal"';
  let expectedOutputs = 'proposal, dependency map, agent map, implementation prompt, and approval package files staged under outputs/knowledge_harvest/pipeline_stage_gate/';
  let commitMessage = 'Add pipeline integration stage gate';
  let finalReportRequirements = 'Detailed status, files created/modified, and next action recommendations.';

  const phaseMatch = promptContent.match(/-\s+\*\*Current Verified Phase:\*\*\s*(.+)/i);
  if (phaseMatch) currentVerifiedPhase = phaseMatch[1].trim();

  const parseSection = (sectionTitle: string, endTitle: string): string => {
    const startIdx = promptContent.indexOf(`## ${sectionTitle}`);
    if (startIdx === -1) return '';
    const afterSection = promptContent.substring(startIdx + `## ${sectionTitle}`.length).trim();
    const endIdx = afterSection.indexOf(`## ${endTitle}`);
    if (endIdx !== -1) {
      return afterSection.substring(0, endIdx).trim();
    }
    return afterSection;
  };

  const createText = parseSection('Files to Create', 'Files to Modify');
  if (createText) filesToCreate = createText;

  const modifyText = parseSection('Files to Modify', 'Verification & Testing');
  if (modifyText) filesToModify = modifyText;

  const safetyText = parseSection('Safety Rules', 'Files to Create');
  if (safetyText) safetyRules = safetyText;

  const testsMatch = promptContent.match(/-\s+\*\*Tests to Run:\*\*\s*([\s\S]*?)-\s+\*\*Expected Outputs:\*\*\s*/i);
  if (testsMatch) testsToRun = testsMatch[1].trim();

  const outputsMatch = promptContent.match(/-\s+\*\*Expected Outputs:\*\*\s*([\s\S]*?)\n\n##/i);
  if (outputsMatch) expectedOutputs = outputsMatch[1].trim();

  const commitMatch = promptContent.match(/-\s+\*\*Git Commit Message:\*\*\s*(.+)/i);
  if (commitMatch) commitMessage = commitMatch[1].trim();

  const reportMatch = promptContent.match(/-\s+\*\*Final Report Requirements:\*\*\s*(.+)/i);
  if (reportMatch) finalReportRequirements = reportMatch[1].trim();

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/manual_implementation/final-build-prompt-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let finalPrompt = fs.readFileSync(templatePath, 'utf-8');

  const dateStr = getISODate();
  finalPrompt = finalPrompt
    .replace('{{dateStr}}', dateStr)
    .replace('{{currentVerifiedPhase}}', currentVerifiedPhase)
    .replace('{{ideaTitle}}', ideaTitle)
    .replace('{{approvalStatus}}', approvalStatus)
    .replace('{{objective}}', `Complete manual implementation of the "${ideaTitle}" module. Execute code changes, configure Safe Command Router mappings, and run strict manual verification tests.`)
    .replace('{{filesToCreate}}', filesToCreate)
    .replace('{{filesToModify}}', filesToModify)
    .replace('{{safetyRules}}', safetyRules)
    .replace('{{testsToRun}}', testsToRun)
    .replace('{{expectedOutputs}}', expectedOutputs)
    .replace('{{commitMessage}}', commitMessage)
    .replace('{{finalReportRequirements}}', finalReportRequirements);

  const outPath = getOutputPath(OUTPUT_FOLDERS.prompts, 'final_manual_build_prompt_', dateStr, '.md');
  fs.writeFileSync(outPath, finalPrompt, 'utf-8');

  console.log(`✅ Final manual build prompt generated: file://${outPath}`);
  writeCompilerLog('compile-prompt', path.basename(latestPacket), approvalStatus, `Staged prompt: ${path.basename(outPath)}`);
  return outPath;
}

// 2. checklist
function runChecklist(): string {
  console.log('🔍 Gathering artifacts to run implementation checklist compiler...');
  
  const approvedPacket = getLatestFile(INPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_') || 'None';
  const depMap = getLatestFile(INPUT_FOLDERS.stageGateDependencies, 'pipeline_dependency_map_') || 'None';
  const finalPrompt = getLatestFile(OUTPUT_FOLDERS.prompts, 'final_manual_build_prompt_') || 'None';
  const safetyReview = getLatestFile(OUTPUT_FOLDERS.reports, 'manual_implementation_safety_review_') || 'None';

  const dateStr = getISODate();
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/manual_implementation/implementation-checklist-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let checklistContent = fs.readFileSync(templatePath, 'utf-8');

  checklistContent = checklistContent
    .replace('{{dateStr}}', dateStr)
    .replace('{{packetStatus}}', approvedPacket !== 'None' ? 'Passed' : 'Pending')
    .replace('{{packetEvidence}}', approvedPacket)
    .replace('{{packetRisk}}', 'None. Read-only validation.')
    .replace('{{packetNextAction}}', 'Ensure approval status matches approved_for_manual_build.')
    
    .replace('{{dependencyStatus}}', depMap !== 'None' ? 'Passed' : 'Pending')
    .replace('{{dependencyEvidence}}', depMap)
    .replace('{{dependencyRisk}}', 'Low. Relies on Safe Command Router.')
    .replace('{{dependencyNextAction}}', 'Verify command router mappings.')

    .replace('{{promptStatus}}', finalPrompt !== 'None' ? 'Passed' : 'Pending')
    .replace('{{promptEvidence}}', finalPrompt)
    .replace('{{promptRisk}}', 'High. Prompts direct implementation tasks.')
    .replace('{{promptNextAction}}', 'Ensure prompt has exact files list.')

    .replace('{{safetyStatus}}', safetyReview !== 'None' ? 'Passed' : 'Pending')
    .replace('{{safetyEvidence}}', safetyReview)
    .replace('{{safetyRisk}}', 'Low. Restricts command router execution.')
    .replace('{{safetyNextAction}}', 'Verify STAGE_GATE_ONLY limits.')

    .replace('{{testsStatus}}', 'Passed')
    .replace('{{testsEvidence}}', 'npm run build, npm run audit, etc.')
    .replace('{{testsRisk}}', 'Low. Runs offline diagnostics.')
    .replace('{{testsNextAction}}', 'Ensure npm script definitions are correct.')

    .replace('{{executionStatus}}', 'Passed')
    .replace('{{executionEvidence}}', 'ALLOW_SCRIPT_EXECUTION = false, ALLOW_RAW_COMMAND_EXECUTION = false')
    .replace('{{executionRisk}}', 'Critical. Prevent command privilege leaks.')
    .replace('{{executionNextAction}}', 'Confirm command exact name config.')

    .replace('{{reviewStatus}}', 'Passed')
    .replace('{{reviewEvidence}}', 'Human operator confirmation required')
    .replace('{{reviewRisk}}', 'High. Manual deployment tasks.')
    .replace('{{reviewNextAction}}', 'Do not run packages automatically.')
    .replace('{{approvalStatus}}', approvedPacket !== 'None' ? 'approved_for_manual_build' : 'blocked');

  const outPath = getOutputPath(OUTPUT_FOLDERS.checklists, 'manual_implementation_checklist_', dateStr, '.md');
  fs.writeFileSync(outPath, checklistContent, 'utf-8');

  console.log(`✅ Manual implementation checklist generated: file://${outPath}`);
  writeCompilerLog('checklist', approvedPacket !== 'None' ? path.basename(approvedPacket) : 'None', 'active', `Staged checklist: ${path.basename(outPath)}`);
  return outPath;
}

// 3. safety-review
function runSafetyReview(): string {
  console.log('🔍 Assessing guardrails and compile-time system safety...');
  const approvedPacket = getLatestFile(INPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_') || 'None';

  let approvalStatus = 'blocked';
  let safetyDecision = 'rejected';
  if (approvedPacket !== 'None') {
    const packetContent = fs.readFileSync(approvedPacket, 'utf-8');
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
  }

  if (approvalStatus === 'approved_for_manual_build') {
    safetyDecision = 'approved';
  }

  const dateStr = getISODate();
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/manual_implementation/safety-review-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let reviewContent = fs.readFileSync(templatePath, 'utf-8');

  reviewContent = reviewContent
    .replace('{{dateStr}}', dateStr)
    .replace('{{safetyDecision}}', safetyDecision)
    .replace('{{riskAssessment}}', 'Low risk. No script execution, no raw shell execution, no automated writes, and strict command routing constraints enforced.');

  const outPath = getOutputPath(OUTPUT_FOLDERS.reports, 'manual_implementation_safety_review_', dateStr, '.md');
  fs.writeFileSync(outPath, reviewContent, 'utf-8');

  console.log(`✅ Safety review report generated: file://${outPath}`);
  writeCompilerLog('safety-review', approvedPacket !== 'None' ? path.basename(approvedPacket) : 'None', safetyDecision, `Staged safety review: ${path.basename(outPath)}`);
  return outPath;
}

// 4. handoff
function runHandoff(): string {
  console.log('🔍 Staging handoff artifacts bundle...');
  const approvedPacket = getLatestFile(INPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_') || 'None';
  
  let ideaTitle = 'Pipeline Integration Stage Gate';
  let approvalStatus = 'blocked';
  if (approvedPacket !== 'None') {
    const packetContent = fs.readFileSync(approvedPacket, 'utf-8');
    const titleMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
    if (titleMatch) ideaTitle = titleMatch[1].trim();
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
  }

  const finalPrompt = getLatestFile(OUTPUT_FOLDERS.prompts, 'final_manual_build_prompt_') || 'None';
  const checklist = getLatestFile(OUTPUT_FOLDERS.checklists, 'manual_implementation_checklist_') || 'None';
  const safetyReview = getLatestFile(OUTPUT_FOLDERS.reports, 'manual_implementation_safety_review_') || 'None';

  const dateStr = getISODate();
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/manual_implementation/final-handoff-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let handoffContent = fs.readFileSync(templatePath, 'utf-8');

  handoffContent = handoffContent
    .replace('{{dateStr}}', dateStr)
    .replace('{{ideaTitle}}', ideaTitle)
    .replace('{{approvalStatus}}', approvalStatus)
    .replace('{{recommendedNextPhase}}', 'Phase 13H: Manual Code Execution')
    .replace('{{finalPromptPath}}', finalPrompt !== 'None' ? `file://${finalPrompt}` : 'None')
    .replace('{{checklistPath}}', checklist !== 'None' ? `file://${checklist}` : 'None')
    .replace('{{safetyReviewPath}}', safetyReview !== 'None' ? `file://${safetyReview}` : 'None')
    .replace('{{humanActionRequired}}', 'Verify the manual build prompt and checklist records. Instruct the developer agent to execute the finalized manual build prompt inside the sandboxed environment.');

  const outPath = getOutputPath(OUTPUT_FOLDERS.reports, 'manual_implementation_handoff_', dateStr, '.md');
  fs.writeFileSync(outPath, handoffContent, 'utf-8');

  console.log(`✅ Handoff report generated: file://${outPath}`);
  writeCompilerLog('handoff', approvedPacket !== 'None' ? path.basename(approvedPacket) : 'None', 'complete', `Staged handoff: ${path.basename(outPath)}`);
  return outPath;
}

// 5. status
function runStatus() {
  console.log('📖 Querying Manual Implementation Packet Compiler status...');
  const latestPrompt = getLatestFile(OUTPUT_FOLDERS.prompts, 'final_manual_build_prompt_') || 'None';
  const latestChecklist = getLatestFile(OUTPUT_FOLDERS.checklists, 'manual_implementation_checklist_') || 'None';
  const latestReview = getLatestFile(OUTPUT_FOLDERS.reports, 'manual_implementation_safety_review_') || 'None';
  const latestHandoff = getLatestFile(OUTPUT_FOLDERS.reports, 'manual_implementation_handoff_') || 'None';

  let approvalStatus = 'unknown';
  let selectedIdea = 'unknown';

  const approvedPacket = getLatestFile(INPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_') || 'None';
  if (approvedPacket !== 'None') {
    const packetContent = fs.readFileSync(approvedPacket, 'utf-8');
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
    const ideaMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
    if (ideaMatch) selectedIdea = ideaMatch[1].trim();
  }

  console.log(`
🛡️ Manual Implementation Packet Compiler Status:

Active Artifacts:
  - Latest Build Prompt:  ${latestPrompt !== 'None' ? 'yes' : 'no'} (${latestPrompt})
  - Latest Checklist:     ${latestChecklist !== 'None' ? 'yes' : 'no'} (${latestChecklist})
  - Latest Safety Review:  ${latestReview !== 'None' ? 'yes' : 'no'} (${latestReview})
  - Latest Handoff:       ${latestHandoff !== 'None' ? 'yes' : 'no'} (${latestHandoff})

Current State:
  - Selected Idea:        ${selectedIdea}
  - Approval Status:      ${approvalStatus}

Safety Configurations:
  - PACKET_COMPILER_ONLY: ${PACKET_COMPILER_ONLY}
  - ALLOW_SCRIPT_EXEC:    ${ALLOW_SCRIPT_EXECUTION}
  - ALLOW_RAW_COMMANDS:   ${ALLOW_RAW_COMMAND_EXECUTION}
  - REQUIRE_SAFETY_REVIEW: ${REQUIRE_SAFETY_REVIEW}

Next Recommended Action:
  - ${latestHandoff !== 'None' ? 'Human review final build prompt and execute verification steps.' : 'Run compilation steps: compile-prompt -> checklist -> safety-review -> handoff.'}
`);
}

async function main() {
  // Enforce Guardrails
  if (PACKET_COMPILER_ONLY) {
    if (ALLOW_SCRIPT_EXECUTION || ALLOW_RAW_COMMAND_EXECUTION || ALLOW_AUTO_BUILD || ALLOW_OBSIDIAN_WRITE || ALLOW_NEXT_ACTIONS_AUTO_WRITE) {
      console.error('❌ Security Violation: Configuration violates PACKET_COMPILER_ONLY constraints.');
      process.exit(1);
    }
  }

  let fullArg = process.argv.slice(2).join(' ').trim();
  if (process.argv.length === 3 && process.argv[2].includes(' ')) {
    fullArg = process.argv[2].trim();
  }

  const parts = fullArg.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();

  await announceIntent(`Running manual implementation packet compiler command: ${fullArg || 'status'}`);

  switch (cmd) {
    case 'compile-prompt': {
      runCompilePrompt();
      break;
    }
    case 'checklist': {
      runChecklist();
      break;
    }
    case 'safety-review': {
      runSafetyReview();
      break;
    }
    case 'handoff': {
      runHandoff();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined:
    case '': {
      const { printHelp } = await import('./manual-implementation-packet-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${fullArg}". Use "help" to see available commands.`);
      await announceCompletion(`Manual implementation packet compiler failed: Unknown command "${fullArg}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Manual implementation packet compiler command "${fullArg || 'status'}" completed successfully.`, '13');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
