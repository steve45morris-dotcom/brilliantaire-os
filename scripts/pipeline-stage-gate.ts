import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  STAGE_GATE_ONLY,
  ALLOW_RAW_COMMAND_EXECUTION,
  ALLOW_SCRIPT_EXECUTION,
  ALLOW_AUTO_BUILD,
  ALLOW_OBSIDIAN_WRITE,
  ALLOW_NEXT_ACTIONS_AUTO_WRITE,
  REQUIRE_MANUAL_APPROVAL,
  REQUIRE_DEPENDENCY_MAP,
  REQUIRE_AGENT_ASSIGNMENT,
  INPUT_FOLDERS,
  OUTPUT_FOLDERS,
  RELEVANT_AGENTS
} from '../config/pipeline-stage-gate.js';

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

function writeLog(message: string) {
  const dateStr = getISODate();
  const logDir = path.join(REPO_ROOT, OUTPUT_FOLDERS.logs);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `pipeline_stage_gate_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Pipeline Stage Gate Log - ${dateStr}\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

function getTopIdea(): { title: string; score: number; sourceFile: string } {
  const rankedDir = path.join(REPO_ROOT, INPUT_FOLDERS.workflowScoringRankedIdeas);
  let topTitle = 'Pipeline Integration Stage Gate';
  let topScore = 84;
  let sourceFile = 'Default Grounded Notes';

  if (fs.existsSync(rankedDir)) {
    const files = fs.readdirSync(rankedDir)
      .filter(f => f.startsWith('ranked_workflow_ideas_') && f.endsWith('.md'))
      .sort();
    if (files.length > 0) {
      const latestFile = files[files.length - 1];
      sourceFile = `outputs/knowledge_harvest/workflow_scoring/ranked_ideas/${latestFile}`;
      const content = fs.readFileSync(path.join(rankedDir, latestFile), 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('| 1 |') || line.trim().startsWith('|1|')) {
          const parts = line.split('|').map(s => s.trim());
          if (parts.length > 3) {
            topTitle = parts[2];
            topScore = parseInt(parts[3], 10) || 84;
            break;
          }
        }
      }
    }
  }
  return { title: topTitle, score: topScore, sourceFile };
}

// 1. Proposal
function runProposal(): string {
  console.log('📖 Generating build proposal from top workflow recommendation...');
  const topIdea = getTopIdea();
  const dateStr = getISODate();
  
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_stage_gate/build-proposal-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  
  content = content
    .replace(/{{ideaTitle}}/g, topIdea.title)
    .replace('{{sourceFile}}', topIdea.sourceFile)
    .replace('{{weightedScore}}', String(topIdea.score))
    .replace('{{approvalStatus}}', 'pending')
    .replace('{{whyItMatters}}', 'Provides a safe pipeline staging gate before any scripts or commands are executed. Enforces boundaries for the One System.')
    .replace('{{targetSystem}}', 'Knowledge Harvest Engine')
    .replace('{{proposedModule}}', 'Pipeline Integration Stage Gate')
    .replace('{{expectedBenefit}}', 'Guarantees zero unauthorized local commands are run. Acts as a safety valve for staging agent recommendations.')
    .replace('{{risk}}', 'Low risk. Configured as stage-gate only without raw execution.')
    .replace('{{buildScope}}', 'Creates staging directories, generates proposals, mappings, assignments, and implementation prompt templates. Prepares structured approval packet.');

  const outPath = getOutputPath(OUTPUT_FOLDERS.proposals, 'pipeline_build_proposal_', dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');
  
  console.log(`✅ Proposal report generated: file://${outPath}`);
  writeLog(`Staged build proposal: ${path.basename(outPath)}`);
  return outPath;
}

// 2. Dependency Map
function runDependencyMap(): string {
  console.log('📖 Generating dependency checklist for target system...');
  const topIdea = getTopIdea();
  const dateStr = getISODate();
  
  const latestProposal = getLatestFile(OUTPUT_FOLDERS.proposals, 'pipeline_build_proposal_') || 'Pending proposal run';

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_stage_gate/dependency-map-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');

  content = content
    .replace(/{{ideaTitle}}/g, topIdea.title)
    .replace('{{proposalPath}}', latestProposal)
    .replace('{{readinessStatus}}', 'Ready for Manual Stage Gate Review')
    .replace('{{module}}', 'Pipeline Integration Stage Gate')
    .replace('{{existingDependency}}', 'Knowledge Harvest Engine, Command Router')
    .replace('{{requiredInput}}', `outputs/knowledge_harvest/workflow_scoring/ranked_ideas/ranked_workflow_ideas_${dateStr}.md`)
    .replace('{{requiredOutput}}', 'outputs/knowledge_harvest/pipeline_stage_gate/proposals/, dependencies/, prompts/, reports/, logs/')
    .replace('{{commandRouterDependency}}', 'pipeline-stage-gate, pipeline-stage-gate-help')
    .replace('{{safetyGate}}', 'Safe Command Router, Manual Stage Gate Checklist')
    .replace('{{blockedDependencies}}', 'Local Script Executor (blocked in Phase 13E), Raw Command Execution (strictly blocked)');

  const outPath = getOutputPath(OUTPUT_FOLDERS.dependencies, 'pipeline_dependency_map_', dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');
  
  console.log(`✅ Dependency map generated: file://${outPath}`);
  writeLog(`Staged dependency map: ${path.basename(outPath)}`);
  return outPath;
}

// 3. Agent Map
function runAgentMap(): string {
  console.log('📖 Mapping productivity agent roles and review responsibilities...');
  const topIdea = getTopIdea();
  const dateStr = getISODate();

  const latestProposal = getLatestFile(OUTPUT_FOLDERS.proposals, 'pipeline_build_proposal_') || 'Pending proposal run';

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_stage_gate/agent-assignment-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');

  const rows = [
    '| Knowledge Librarian | Data Ingestion & Staging | Manages the knowledge bases and transcript notes. | No | Yes (staging proposal logs) | Yes |',
    '| Workflow Auditor | Compliance & Safety Check | Checks that no raw commands or scripts are executed. | Yes | No | Yes |',
    '| OS Architect | System Integrity Governor | Ensures new modules adhere to boundaries. | Yes | No | Yes |',
    '| Prompt Engineer | Instruction Architect | Formulates implementation prompt templates. | No | Yes | Yes |',
    '| Build Operator | Build & Verification Driver | Compiles TS code and runs tests. | No | Yes | Yes |',
    '| Creative Revenue Strategist | Business Alignment Auditor | Ensures new workflows connect to strategic revenue items. | Yes | No | Yes |'
  ].join('\n');

  content = content
    .replace(/{{ideaTitle}}/g, topIdea.title)
    .replace('{{proposalPath}}', latestProposal)
    .replace('{{agentMatrixRows}}', rows);

  const outPath = getOutputPath(OUTPUT_FOLDERS.reports, 'pipeline_agent_assignment_', dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');
  
  console.log(`✅ Agent assignment generated: file://${outPath}`);
  writeLog(`Staged agent assignment: ${path.basename(outPath)}`);
  return outPath;
}

// 4. Implementation Prompt
function runImplementationPrompt(): string {
  console.log('📖 Staging full implementation context and code instructions...');
  const topIdea = getTopIdea();
  const dateStr = getISODate();

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_stage_gate/implementation-prompt-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');

  content = content
    .replace(/{{ideaTitle}}/g, topIdea.title)
    .replace('{{currentVerifiedPhase}}', 'Phase 13D: Workflow Idea Scoring Engine complete')
    .replace('{{safetyRules}}', '- STAGE_GATE_ONLY = true\n- ALLOW_RAW_COMMAND_EXECUTION = false\n- ALLOW_SCRIPT_EXECUTION = false\n- ALLOW_AUTO_BUILD = false\n- ALLOW_OBSIDIAN_WRITE = false\n- ALLOW_NEXT_ACTIONS_AUTO_WRITE = false')
    .replace('{{filesToCreate}}', '- config/pipeline-stage-gate.ts\n- scripts/pipeline-stage-gate.ts\n- scripts/pipeline-stage-gate-help.ts\n- templates/knowledge_harvest/pipeline_stage_gate/*')
    .replace('{{filesToModify}}', '- package.json\n- Taskfile.yml\n- config/commands.ts\n- COMMANDS.md\n- SYSTEM_STATUS.md\n- PROJECTS.md\n- NEXT_ACTIONS.md\n- README.md')
    .replace('{{testsToRun}}', '- npm run build\n- npm run audit\n- npm run pipeline-stage-gate-help\n- npm run pipeline-stage-gate -- "proposal"')
    .replace('{{expectedOutputs}}', 'proposal, dependency map, agent map, implementation prompt, and approval package files staged under outputs/knowledge_harvest/pipeline_stage_gate/')
    .replace('{{commitMessage}}', 'Add pipeline integration stage gate')
    .replace('{{finalReportRequirements}}', 'Detailed status, files created/modified, and next action recommendations.');

  const outPath = getOutputPath(OUTPUT_FOLDERS.prompts, 'pipeline_implementation_prompt_', dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');
  
  console.log(`✅ Implementation prompt generated: file://${outPath}`);
  writeLog(`Staged implementation prompt: ${path.basename(outPath)}`);
  return outPath;
}

// 5. Approval Package
function runApprovalPackage(): string {
  console.log('📖 Packaging all reports into manual approval checkbook...');
  const topIdea = getTopIdea();
  const dateStr = getISODate();

  const proposal = getLatestFile(OUTPUT_FOLDERS.proposals, 'pipeline_build_proposal_') || 'Pending proposal';
  const depMap = getLatestFile(OUTPUT_FOLDERS.dependencies, 'pipeline_dependency_map_') || 'Pending dependency map';
  const agentMap = getLatestFile(OUTPUT_FOLDERS.reports, 'pipeline_agent_assignment_') || 'Pending agent assignment';
  const implPrompt = getLatestFile(OUTPUT_FOLDERS.prompts, 'pipeline_implementation_prompt_') || 'Pending implementation prompt';

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/pipeline_stage_gate/approval-package-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let content = fs.readFileSync(templatePath, 'utf-8');

  content = content
    .replace(/{{ideaTitle}}/g, topIdea.title)
    .replace('{{proposalPath}}', proposal)
    .replace('{{proposalFilename}}', path.basename(proposal))
    .replace('{{dependencyMapPath}}', depMap)
    .replace('{{dependencyMapFilename}}', path.basename(depMap))
    .replace('{{agentAssignmentPath}}', agentMap)
    .replace('{{agentAssignmentFilename}}', path.basename(agentMap))
    .replace('{{implementationPromptPath}}', implPrompt)
    .replace('{{implementationPromptFilename}}', path.basename(implPrompt))
    .replace('{{approvalChecklist}}', '- [ ] Proposal details verified with zero local command execution risk\n- [ ] Dependencies map checked and resolved correctly\n- [ ] Relevant agents mapped to responsibilities\n- [ ] Implementation prompt generated and verified safe')
    .replace('{{risks}}', 'No execution risks are present. The stage gate operates entirely as a document-based staging layout.')
    .replace('{{recommendedDecision}}', 'approve');

  const outPath = getOutputPath(OUTPUT_FOLDERS.reports, 'pipeline_approval_package_', dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');
  
  console.log(`✅ Approval package generated: file://${outPath}`);
  writeLog(`Staged approval package: ${path.basename(outPath)}`);
  return outPath;
}

// 6. Status
function runStatus() {
  console.log('📖 Querying Pipeline Integration Stage Gate status...');
  const topIdea = getTopIdea();

  const proposal = getLatestFile(OUTPUT_FOLDERS.proposals, 'pipeline_build_proposal_') || 'None';
  const depMap = getLatestFile(OUTPUT_FOLDERS.dependencies, 'pipeline_dependency_map_') || 'None';
  const agentMap = getLatestFile(OUTPUT_FOLDERS.reports, 'pipeline_agent_assignment_') || 'None';
  const implPrompt = getLatestFile(OUTPUT_FOLDERS.prompts, 'pipeline_implementation_prompt_') || 'None';
  const approvalPkg = getLatestFile(OUTPUT_FOLDERS.reports, 'pipeline_approval_package_') || 'None';

  console.log(`
🛡️ Pipeline Integration Stage Gate Status:

Active Artifacts:
  - Selected Idea:          ${topIdea.title} (Score: ${topIdea.score})
  - Latest Proposal:       ${proposal !== 'None' ? 'yes' : 'no'} (${proposal})
  - Latest Dependency Map:  ${depMap !== 'None' ? 'yes' : 'no'} (${depMap})
  - Latest Agent Map:       ${agentMap !== 'None' ? 'yes' : 'no'} (${agentMap})
  - Latest Impl Prompt:     ${implPrompt !== 'None' ? 'yes' : 'no'} (${implPrompt})
  - Latest Approval Pkg:    ${approvalPkg !== 'None' ? 'yes' : 'no'} (${approvalPkg})

Safety Configurations:
  - STAGE_GATE_ONLY:        ${STAGE_GATE_ONLY}
  - ALLOW_RAW_COMMANDS:     ${ALLOW_RAW_COMMAND_EXECUTION}
  - ALLOW_SCRIPT_EXECUTION: ${ALLOW_SCRIPT_EXECUTION}
  - REQUIRE_MANUAL_APPROVAL:${REQUIRE_MANUAL_APPROVAL}

Next Recommended Action:
  - Review the staged approval package file manually to confirm ready status.
`);
}

async function main() {
  // Enforce Guardrails
  if (STAGE_GATE_ONLY) {
    if (ALLOW_RAW_COMMAND_EXECUTION || ALLOW_SCRIPT_EXECUTION || ALLOW_AUTO_BUILD || ALLOW_OBSIDIAN_WRITE || ALLOW_NEXT_ACTIONS_AUTO_WRITE) {
      console.error('❌ Security Violation: Configuration violates STAGE_GATE_ONLY constraints.');
      process.exit(1);
    }
  }

  let fullArg = process.argv.slice(2).join(' ').trim();
  if (process.argv.length === 3 && process.argv[2].includes(' ')) {
    fullArg = process.argv[2].trim();
  }

  const parts = fullArg.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();

  await announceIntent(`Running pipeline stage gate command: ${fullArg || 'status'}`);

  switch (cmd) {
    case 'proposal': {
      runProposal();
      break;
    }
    case 'dependency-map': {
      runDependencyMap();
      break;
    }
    case 'agent-map': {
      runAgentMap();
      break;
    }
    case 'implementation-prompt': {
      runImplementationPrompt();
      break;
    }
    case 'approval-package': {
      runApprovalPackage();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined:
    case '': {
      const { printHelp } = await import('./pipeline-stage-gate-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${fullArg}". Use "help" to see available commands.`);
      await announceCompletion(`Pipeline stage gate failed: Unknown command "${fullArg}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Pipeline stage gate command "${fullArg || 'status'}" completed successfully.`, '13');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
