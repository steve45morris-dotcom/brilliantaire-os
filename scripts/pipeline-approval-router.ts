import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  APPROVAL_ROUTER_ONLY,
  ALLOW_SCRIPT_EXECUTION,
  ALLOW_RAW_COMMAND_EXECUTION,
  ALLOW_AUTO_BUILD,
  ALLOW_OBSIDIAN_WRITE,
  ALLOW_NEXT_ACTIONS_AUTO_WRITE,
  REQUIRE_APPROVAL_PACKAGE,
  REQUIRE_APPROVE_DECISION,
  REQUIRE_MANUAL_EXECUTION,
  INPUT_FOLDERS,
  OUTPUT_FOLDERS,
  DECISION_LABELS,
  APPROVAL_STATUS_LABELS,
  DecisionLabel,
  ApprovalStatusLabel
} from '../config/pipeline-approval-router.js';

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

function writeRouterLog(command: string, sourcePackage: string, decision: string, status: string, notes: string) {
  const dateStr = getISODate();
  const logDir = path.join(REPO_ROOT, OUTPUT_FOLDERS.logs);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `pipeline_approval_router_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_approval_router/approval-router-log-template.md');
  let hasLogFile = fs.existsSync(logPath);
  
  const entry = `| ${timestamp} | ${command} | ${sourcePackage} | ${decision} | ${status} | ${notes} |\n`;
  
  if (hasLogFile) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf-8');
      content = content
        .replace('{{dateStr}}', dateStr)
        .replace('{{timestamp}}', timestamp)
        .replace('{{command}}', command)
        .replace('{{sourcePackage}}', sourcePackage)
        .replace('{{decision}}', decision)
        .replace('{{status}}', status)
        .replace('{{notes}}', notes);
      fs.writeFileSync(logPath, content, 'utf-8');
    } else {
      fs.writeFileSync(logPath, `# Pipeline Approval Router Log - ${dateStr}\n\n| Timestamp | Command | Source Package | Decision | Status | Notes |\n|---|---|---|---|---|---|\n${entry}`, 'utf-8');
    }
  }
}

// 1. validate
function runValidate(): string {
  console.log('🔍 Locating the latest Pipeline Approval Package...');
  const latestPackage = getLatestFile(INPUT_FOLDERS.reports, 'pipeline_approval_package_');
  if (!latestPackage) {
    throw new Error(`No pipeline approval package found in ${INPUT_FOLDERS.reports}`);
  }
  console.log(`📖 Loading package: ${path.basename(latestPackage)}`);
  const content = fs.readFileSync(latestPackage, 'utf-8');

  // Parse Decision
  let decision: DecisionLabel = 'unknown';
  const recMatch = content.match(/-\s+\*\*Recommended Decision:\*\*\s*(.+)/i);
  if (recMatch) {
    const rawDecision = recMatch[1].trim().toLowerCase();
    if (DECISION_LABELS.includes(rawDecision as any)) {
      decision = rawDecision as DecisionLabel;
    }
  }

  // Parse Paths
  let proposalPath = 'unknown';
  let depMapPath = 'unknown';
  let agentAssignmentPath = 'unknown';
  let implPromptPath = 'unknown';

  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('Build Proposal Path:')) {
      const m = line.match(/\(([^)]+)\)/);
      if (m) proposalPath = m[1];
    } else if (line.includes('Dependency Map Path:')) {
      const m = line.match(/\(([^)]+)\)/);
      if (m) depMapPath = m[1];
    } else if (line.includes('Agent Assignment Path:')) {
      const m = line.match(/\(([^)]+)\)/);
      if (m) agentAssignmentPath = m[1];
    } else if (line.includes('Implementation Prompt Path:')) {
      const m = line.match(/\(([^)]+)\)/);
      if (m) implPromptPath = m[1];
    }
  }

  // Parse Risks
  let risks = 'No execution risks are present.';
  const riskHeaderIndex = content.indexOf('## Risk Mitigation');
  if (riskHeaderIndex !== -1) {
    const afterHeader = content.substring(riskHeaderIndex + '## Risk Mitigation'.length).trim();
    const nextHeaderIndex = afterHeader.search(/^##/m);
    if (nextHeaderIndex !== -1) {
      risks = afterHeader.substring(0, nextHeaderIndex).trim();
    } else {
      risks = afterHeader.trim();
    }
  }

  // Determine Approval Status
  let approvalStatus: ApprovalStatusLabel = 'blocked';
  if (decision === 'approve') {
    approvalStatus = 'approved_for_manual_build';
  } else if (decision === 'revise') {
    approvalStatus = 'needs_revision';
  } else if (decision === 'reject') {
    approvalStatus = 'rejected';
  } else if (decision === 'defer') {
    approvalStatus = 'deferred';
  }

  const dateStr = getISODate();
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_approval_router/approval-validation-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let reportContent = fs.readFileSync(templatePath, 'utf-8');

  reportContent = reportContent
    .replace('{{dateStr}}', dateStr)
    .replace('{{approvalPackage}}', latestPackage)
    .replace('{{recommendationDetected}}', decision)
    .replace('{{approvalStatus}}', approvalStatus)
    .replace('{{proposalPath}}', proposalPath)
    .replace('{{dependencyMapPath}}', depMapPath)
    .replace('{{implementationPromptPath}}', implPromptPath)
    .replace('{{risks}}', risks)
    .replace('{{nextAction}}', decision === 'approve' 
      ? 'Run approve-packet to generate approved implementation packet.' 
      : 'Review errors and obtain revision.');

  const outPath = getOutputPath(OUTPUT_FOLDERS.reports, 'pipeline_approval_validation_', dateStr, '.md');
  fs.writeFileSync(outPath, reportContent, 'utf-8');

  console.log(`✅ Validation report generated: file://${outPath}`);
  writeRouterLog('validate', path.basename(latestPackage), decision, approvalStatus, `Generated validation report: ${path.basename(outPath)}`);
  return outPath;
}

// 2. approve-packet
function runApprovePacket(): string {
  console.log('🔍 Locating latest approval validation report...');
  const latestValidation = getLatestFile(OUTPUT_FOLDERS.reports, 'pipeline_approval_validation_');
  if (!latestValidation) {
    throw new Error(`No approval validation report found in ${OUTPUT_FOLDERS.reports}. Run validate command first.`);
  }
  console.log(`📖 Loading validation: ${path.basename(latestValidation)}`);
  const valContent = fs.readFileSync(latestValidation, 'utf-8');

  // Parse approval status
  let approvalStatus = 'blocked';
  const statusMatch = valContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
  if (statusMatch) {
    approvalStatus = statusMatch[1].trim();
  }

  // Parse decision
  let decision = 'unknown';
  const decMatch = valContent.match(/-\s+\*\*Recommendation Detected:\*\*\s*(.+)/i);
  if (decMatch) {
    decision = decMatch[1].trim();
  }

  // Parse paths
  let proposalPath = '';
  let depMapPath = '';
  let implPromptPath = '';

  const valLines = valContent.split('\n');
  for (const line of valLines) {
    if (line.includes('Proposal Path:')) {
      proposalPath = line.split('Proposal Path:**')[1]?.trim() || '';
    } else if (line.includes('Dependency Map Path:')) {
      depMapPath = line.split('Dependency Map Path:**')[1]?.trim() || '';
    } else if (line.includes('Implementation Prompt Path:')) {
      implPromptPath = line.split('Implementation Prompt Path:**')[1]?.trim() || '';
    }
  }

  const dateStr = getISODate();

  if (approvalStatus !== 'approved_for_manual_build') {
    // Generate blocked report
    console.log(`⚠️ Recommendation is "${decision}" (Status: ${approvalStatus}). Generating blocked report.`);
    const blockedContent = `# Pipeline Approved Implementation Packet - BLOCKED

The proposal was NOT approved.
- **Recommended Decision:** ${decision}
- **Approval Status:** ${approvalStatus}
- **Reason:** The stage gate recommended decision was not 'approve'. No implementation packet will be generated.
- **Next Action:** Resolve dependencies or address risks in the proposal.
`;
    const outPath = getOutputPath(OUTPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_blocked_', dateStr, '.md');
    fs.writeFileSync(outPath, blockedContent, 'utf-8');
    console.log(`🛑 Blocked report generated: file://${outPath}`);
    writeRouterLog('approve-packet', path.basename(latestValidation), decision, approvalStatus, `Generated blocked report: ${path.basename(outPath)}`);
    return outPath;
  }

  // Parse build proposal
  let ideaTitle = 'Pipeline Integration Stage Gate';
  let weightedScore = '84';
  if (fs.existsSync(proposalPath)) {
    const proposalContent = fs.readFileSync(proposalPath, 'utf-8');
    const titleMatch = proposalContent.match(/-\s+\*\*Idea Title:\*\*\s*(.+)/i);
    if (titleMatch) ideaTitle = titleMatch[1].trim();
    const scoreMatch = proposalContent.match(/-\s+\*\*Weighted Score:\*\*\s*(.+)/i);
    if (scoreMatch) weightedScore = scoreMatch[1].trim();
  }

  // Parse agent assignment
  const agentAssignmentPath = getLatestFile(INPUT_FOLDERS.reports, 'pipeline_agent_assignment_') || '';
  let assignedAgents = 'Knowledge Librarian, Workflow Auditor, OS Architect, Prompt Engineer, Build Operator, Creative Revenue Strategist';
  if (fs.existsSync(agentAssignmentPath)) {
    const agentContent = fs.readFileSync(agentAssignmentPath, 'utf-8');
    const agentLines = agentContent.split('\n');
    const agentsFound: string[] = [];
    for (const line of agentLines) {
      if (line.trim().startsWith('|') && !line.includes('Role') && !line.includes('---')) {
        const parts = line.split('|').map(s => s.trim());
        if (parts[1]) {
          agentsFound.push(parts[1]);
        }
      }
    }
    if (agentsFound.length > 0) {
      assignedAgents = agentsFound.join(', ');
    }
  }

  // Parse safety rules
  let safetyRules = '- STAGE_GATE_ONLY = true\n- ALLOW_RAW_COMMAND_EXECUTION = false\n- ALLOW_SCRIPT_EXECUTION = false\n- ALLOW_AUTO_BUILD = false\n- ALLOW_OBSIDIAN_WRITE = false\n- ALLOW_NEXT_ACTIONS_AUTO_WRITE = false';
  if (fs.existsSync(implPromptPath)) {
    const implContent = fs.readFileSync(implPromptPath, 'utf-8');
    const rulesHeaderIndex = implContent.indexOf('## Safety Rules');
    if (rulesHeaderIndex !== -1) {
      const afterRules = implContent.substring(rulesHeaderIndex + '## Safety Rules'.length).trim();
      const nextHeaderIndex = afterRules.search(/^##/m);
      if (nextHeaderIndex !== -1) {
        safetyRules = afterRules.substring(0, nextHeaderIndex).trim();
      } else {
        safetyRules = afterRules.trim();
      }
    }
  }

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_approval_router/approved-implementation-packet-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let packetContent = fs.readFileSync(templatePath, 'utf-8');

  packetContent = packetContent
    .replace('{{dateStr}}', dateStr)
    .replace('{{ideaTitle}}', ideaTitle)
    .replace('{{weightedScore}}', weightedScore)
    .replace('{{approvalStatus}}', approvalStatus)
    .replace('{{proposalPath}}', proposalPath)
    .replace('{{dependencyMapPath}}', depMapPath)
    .replace('{{implementationPromptPath}}', implPromptPath)
    .replace('{{assignedAgents}}', assignedAgents)
    .replace('{{safetyRules}}', safetyRules)
    .replace('{{manualExecutionRequired}}', String(REQUIRE_MANUAL_EXECUTION))
    .replace('{{nextAction}}', 'Run manual-brief to generate the manual execution brief.');

  const outPath = getOutputPath(OUTPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_', dateStr, '.md');
  fs.writeFileSync(outPath, packetContent, 'utf-8');

  console.log(`✅ Approved implementation packet generated: file://${outPath}`);
  writeRouterLog('approve-packet', path.basename(latestValidation), decision, approvalStatus, `Generated approved implementation packet: ${path.basename(outPath)}`);
  return outPath;
}

// 3. manual-brief
function runManualBrief(): string {
  console.log('🔍 Locating latest approved implementation packet...');
  const latestPacket = getLatestFile(OUTPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_');
  if (!latestPacket) {
    throw new Error(`No approved implementation packet found in ${OUTPUT_FOLDERS.approvedPackets}. Run approve-packet command first.`);
  }
  console.log(`📖 Loading packet: ${path.basename(latestPacket)}`);
  const packetContent = fs.readFileSync(latestPacket, 'utf-8');

  // Parse Idea Title
  let ideaTitle = 'Pipeline Integration Stage Gate';
  const titleMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
  if (titleMatch) {
    ideaTitle = titleMatch[1].trim();
  }

  // Parse Impl Prompt
  let implPromptPath = 'outputs/knowledge_harvest/pipeline_stage_gate/prompts/pipeline_implementation_prompt_2026-06-03.md';
  const promptMatch = packetContent.match(/-\s+\*\*Implementation Prompt:\*\*\s*(.+)/i);
  if (promptMatch) {
    implPromptPath = promptMatch[1].trim();
  }

  const dateStr = getISODate();
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_approval_router/manual-execution-brief-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let briefContent = fs.readFileSync(templatePath, 'utf-8');

  const filesToReview = [
    `- file://${latestPacket} (Approved Packet)`,
    `- file://${implPromptPath} (Implementation Prompt)`,
    `- file://${REPO_ROOT}/config/pipeline-approval-router.ts`,
    `- file://${REPO_ROOT}/scripts/pipeline-approval-router.ts`
  ].join('\n');

  const promptToUseUrl = path.isAbsolute(implPromptPath)
    ? `file://${implPromptPath}`
    : `file://${REPO_ROOT}/${implPromptPath}`;

  briefContent = briefContent
    .replace('{{dateStr}}', dateStr)
    .replace('{{ideaTitle}}', ideaTitle)
    .replace('{{notAllowed}}', 'No script execution, no raw commands, no general-purpose local executor, no auto-run implementation prompts, no auto-edit NEXT_ACTIONS.md beyond phase documentation, no Obsidian writes, no bypassing the Safe Command Router.')
    .replace('{{promptToUse}}', promptToUseUrl)
    .replace('{{filesToReview}}', filesToReview)
    .replace('{{manualConfirmation}}', 'I confirm that I have reviewed the approved implementation packet and the safety rules, and I will manually run the implementation prompt.')
    .replace('{{expectedNextPhase}}', 'Phase 13G: Manual Implementation Execution');

  const outPath = getOutputPath(OUTPUT_FOLDERS.reports, 'pipeline_manual_execution_brief_', dateStr, '.md');
  fs.writeFileSync(outPath, briefContent, 'utf-8');

  console.log(`✅ Manual execution brief generated: file://${outPath}`);
  writeRouterLog('manual-brief', path.basename(latestPacket), 'approve', 'approved_for_manual_build', `Generated manual execution brief: ${path.basename(outPath)}`);
  return outPath;
}

// 4. status
function runStatus() {
  console.log('📖 Querying Pipeline Proposal Approval Router status...');
  const latestValidation = getLatestFile(OUTPUT_FOLDERS.reports, 'pipeline_approval_validation_') || 'None';
  const latestPacket = getLatestFile(OUTPUT_FOLDERS.approvedPackets, 'pipeline_approved_implementation_packet_') || 'None';
  const latestBrief = getLatestFile(OUTPUT_FOLDERS.reports, 'pipeline_manual_execution_brief_') || 'None';

  let approvalStatus = 'unknown';
  let selectedIdea = 'unknown';

  if (latestPacket !== 'None') {
    const packetContent = fs.readFileSync(latestPacket, 'utf-8');
    const statusMatch = packetContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
    const ideaMatch = packetContent.match(/-\s+\*\*Selected Idea:\*\*\s*(.+)/i);
    if (ideaMatch) selectedIdea = ideaMatch[1].trim();
  } else if (latestValidation !== 'None') {
    const validationContent = fs.readFileSync(latestValidation, 'utf-8');
    const statusMatch = validationContent.match(/-\s+\*\*Approval Status:\*\*\s*(.+)/i);
    if (statusMatch) approvalStatus = statusMatch[1].trim();
  }

  console.log(`
🛡️ Pipeline Proposal Approval Router Status:

Active Artifacts:
  - Latest Validation Report: ${latestValidation !== 'None' ? 'yes' : 'no'} (${latestValidation})
  - Latest Approved Packet:   ${latestPacket !== 'None' ? 'yes' : 'no'} (${latestPacket})
  - Latest Execution Brief:   ${latestBrief !== 'None' ? 'yes' : 'no'} (${latestBrief})

Current State:
  - Selected Idea:            ${selectedIdea}
  - Approval Status:          ${approvalStatus}

Safety Configurations:
  - APPROVAL_ROUTER_ONLY:     ${APPROVAL_ROUTER_ONLY}
  - ALLOW_SCRIPT_EXECUTION:   ${ALLOW_SCRIPT_EXECUTION}
  - ALLOW_RAW_COMMANDS:       ${ALLOW_RAW_COMMAND_EXECUTION}
  - REQUIRE_MANUAL_EXECUTION: ${REQUIRE_MANUAL_EXECUTION}

Next Recommended Action:
  - ${latestBrief !== 'None' ? 'Review manual execution brief and confirm ready status.' : 'Run command workflow (validate -> approve-packet -> manual-brief).'}
`);
}

async function main() {
  // Enforce Guardrails
  if (APPROVAL_ROUTER_ONLY) {
    if (ALLOW_SCRIPT_EXECUTION || ALLOW_RAW_COMMAND_EXECUTION || ALLOW_AUTO_BUILD || ALLOW_OBSIDIAN_WRITE || ALLOW_NEXT_ACTIONS_AUTO_WRITE) {
      console.error('❌ Security Violation: Configuration violates APPROVAL_ROUTER_ONLY constraints.');
      process.exit(1);
    }
  }

  let fullArg = process.argv.slice(2).join(' ').trim();
  if (process.argv.length === 3 && process.argv[2].includes(' ')) {
    fullArg = process.argv[2].trim();
  }

  const parts = fullArg.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();

  await announceIntent(`Running pipeline approval router command: ${fullArg || 'status'}`);

  switch (cmd) {
    case 'validate': {
      runValidate();
      break;
    }
    case 'approve-packet': {
      runApprovePacket();
      break;
    }
    case 'manual-brief': {
      runManualBrief();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined:
    case '': {
      const { printHelp } = await import('./pipeline-approval-router-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${fullArg}". Use "help" to see available commands.`);
      await announceCompletion(`Pipeline approval router failed: Unknown command "${fullArg}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Pipeline approval router command "${fullArg || 'status'}" completed successfully.`, '13');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
