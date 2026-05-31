// scripts/notebooklm-mcp-fix-cycle.ts
// Handles the NotebookLM MCP Setup Fix Cycle, checklists, comparisons, and runbooks.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_LIVE_MCP_EXECUTION,
  expectedEnvNames,
  candidateLocalFiles,
  REPO_ROOT
} from '../config/notebooklm-mcp-readiness-gate.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_fix_cycle'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_fix_cycle', 'reports'),
  checklists: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_fix_cycle', 'checklists'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_fix_cycle', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_fix_cycle')
};

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
  if (!fs.existsSync(outputFolders.logs)) {
    fs.mkdirSync(outputFolders.logs, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(outputFolders.logs, `fix_cycle_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function findLatestFile(dirPath: string, prefix: string): string | null {
  if (!fs.existsSync(dirPath)) return null;
  const files = fs.readdirSync(dirPath)
    .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
    .sort();
  if (files.length === 0) return null;
  return path.join(dirPath, files[files.length - 1]);
}

function getEnvPresence(): { [key: string]: { present: boolean; source: string } } {
  const foundEnvNames: { [key: string]: { present: boolean; source: string } } = {};
  for (const envName of expectedEnvNames) {
    foundEnvNames[envName] = { present: false, source: "None" };
  }

  // Check files
  for (const fileObj of candidateLocalFiles) {
    if (fs.existsSync(fileObj.path)) {
      if (fileObj.type === 'file') {
        try {
          const content = fs.readFileSync(fileObj.path, 'utf-8');
          for (const envName of expectedEnvNames) {
            const regex = new RegExp(`\\b${envName}\\b`, 'i');
            if (regex.test(content)) {
              foundEnvNames[envName] = { present: true, source: fileObj.name };
            }
          }
        } catch (_) {}
      } else if (fileObj.type === 'directory') {
        try {
          const files = fs.readdirSync(fileObj.path);
          for (const file of files) {
            const content = fs.readFileSync(path.join(fileObj.path, file), 'utf-8');
            for (const envName of expectedEnvNames) {
              const regex = new RegExp(`\\b${envName}\\b`, 'i');
              if (regex.test(content)) {
                foundEnvNames[envName] = { present: true, source: `${fileObj.name}${file}` };
              }
            }
          }
        } catch (_) {}
      }
    }
  }

  // Check process env
  for (const envName of expectedEnvNames) {
    if (process.env[envName]) {
      foundEnvNames[envName] = { present: true, source: "process.env" };
    }
  }

  return foundEnvNames;
}

function parseReadinessScore(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/Readiness Score[:\*]*\s*(\d+)%/i) || content.match(/Readiness Score[:\*]*\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function parseReviewScore(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/Review Score[:\*]*\s*(\d+)%/i) || content.match(/Review Score[:\*]*\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function parseBlockers(filePath: string | null): string[] {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const blockers: string[] = [];
  for (const line of lines) {
    if (line.trim().startsWith('|') && !line.includes('Blocker') && !line.includes('---')) {
      const parts = line.split('|');
      if (parts.length > 2) {
        const blockerName = parts[1].trim();
        const blockerEvidence = parts[2] ? parts[2].trim() : '';
        if (blockerName) {
          if (blockerEvidence) {
            blockers.push(`${blockerName} (${blockerEvidence})`);
          } else {
            blockers.push(blockerName);
          }
        }
      }
    }
  }
  return blockers;
}

// 1. tasks command
async function handleTasks(): Promise<string> {
  console.log("🔍 Processing latest reports and generating fix checklist...");
  await announceIntent("Evaluating setup reports to compile local fix checklist.");

  const readinessGateDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_readiness_gate', 'reports');
  const correctionPackDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_correction_pack', 'reports');
  const completionReviewDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_completion_review', 'reports');

  const latestReadinessGate = findLatestFile(readinessGateDir, 'notebooklm_mcp_readiness_gate_');
  const latestBlocker = findLatestFile(readinessGateDir, 'notebooklm_mcp_blockers_');
  const latestCorrectionPack = findLatestFile(correctionPackDir, 'notebooklm_mcp_blocker_corrections_');
  const latestCompletionReview = findLatestFile(completionReviewDir, 'notebooklm_mcp_completion_review_');
  const latestLiveEligibility = findLatestFile(completionReviewDir, 'notebooklm_mcp_live_eligibility_');

  console.log("Inputs checked:");
  console.log(`- Readiness Gate:     ${latestReadinessGate ? path.basename(latestReadinessGate) : 'Not found'}`);
  console.log(`- Blocker List:       ${latestBlocker ? path.basename(latestBlocker) : 'Not found'}`);
  console.log(`- Correction Pack:    ${latestCorrectionPack ? path.basename(latestCorrectionPack) : 'Not found'}`);
  console.log(`- Completion Review:  ${latestCompletionReview ? path.basename(latestCompletionReview) : 'Not found'}`);
  console.log(`- Live Eligibility:   ${latestLiveEligibility ? path.basename(latestLiveEligibility) : 'Not found'}`);

  // Dynamic status checks
  const envLocalExists = fs.existsSync(path.join(REPO_ROOT, '.env.local'));
  let envLocalGitignored = false;
  const gitignorePath = path.join(REPO_ROOT, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignoreContent.includes('.env.local')) {
      envLocalGitignored = true;
    }
  }

  let mcpConfigured = false;
  for (const fileObj of candidateLocalFiles) {
    if (fs.existsSync(fileObj.path)) {
      if (fileObj.type === 'file') {
        try {
          const content = fs.readFileSync(fileObj.path, 'utf-8');
          if (content.includes('notebooklm-mcp')) {
            mcpConfigured = true;
          }
        } catch (_) {}
      } else if (fileObj.type === 'directory') {
        try {
          const files = fs.readdirSync(fileObj.path);
          for (const file of files) {
            const content = fs.readFileSync(path.join(fileObj.path, file), 'utf-8');
            if (content.includes('notebooklm-mcp')) {
              mcpConfigured = true;
            }
          }
        } catch (_) {}
      }
    }
  }

  const envVarsStatus = getEnvPresence();
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    if (envVarsStatus[envName].present) {
      envPresentCount++;
    }
  }

  const allComplete = envLocalExists && envLocalGitignored && mcpConfigured && (envPresentCount === expectedEnvNames.length);
  const fixCycleStatus = allComplete ? "COMPLETED" : "IN_PROGRESS";

  // Compile checklist rows
  const rows: string[] = [];

  const envLocalStatus = envLocalExists ? '🟢 DONE' : '🔴 PENDING';
  rows.push(
    `| Create .env.local file | .env.local file is missing in root | Create .env.local in repo root | ls -la .env.local | File exists | Knowledge Librarian | ${envLocalStatus} |`
  );

  const gitignoreStatus = envLocalGitignored ? '🟢 DONE' : '🔴 PENDING';
  rows.push(
    `| Gitignore .env.local | .env.local not found in .gitignore | Append .env.local to .gitignore | git check-ignore .env.local | File is gitignored | Knowledge Librarian | ${gitignoreStatus} |`
  );

  const configStatus = mcpConfigured ? '🟢 DONE' : '🔴 PENDING';
  rows.push(
    `| Configure Client Sidecar | 'notebooklm-mcp' config not found in client settings | Copy mcp config block to client settings | npm run notebooklm-mcp-readiness-gate -- scan | Client config mapped | Knowledge Librarian | ${configStatus} |`
  );

  for (const envName of expectedEnvNames) {
    const present = envVarsStatus[envName].present;
    const varStatus = present ? '🟢 DONE' : '🔴 PENDING';
    rows.push(
      `| Map ${envName} | ${envName} not found in configurations | Define ${envName} inside .env.local | npm run notebooklm-mcp-completion-review -- env-check | Key is present | Knowledge Librarian | ${varStatus} |`
    );
  }

  const templatePath = path.join(outputFolders.templates, 'fix-task-list-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{FIX_CYCLE_STATUS\}\}/g, fixCycleStatus)
    .replace(/\{\{FIX_TASK_ROWS\}\}/g, rows.join('\n'));

  const safePath = getSafeWritePath(outputFolders.checklists, `notebooklm_mcp_fix_tasks_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Fix task list generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('TASKS', detailMsg);

  await announceCompletion(`Fix tasks checklist updated. Status: ${fixCycleStatus}.`, "10");
  return safePath;
}

// 2. compare command
async function handleCompare(): Promise<string> {
  console.log("📊 Comparing latest scores and blockers...");
  await announceIntent("Compiling readiness and completion review scores comparison report.");

  const readinessGateDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_readiness_gate', 'reports');
  const completionReviewDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_completion_review', 'reports');

  // Scores
  let currentReadinessScore = 0;
  let previousReadinessScore = 0;
  let currentReviewScore = 0;

  if (fs.existsSync(readinessGateDir)) {
    const files = fs.readdirSync(readinessGateDir)
      .filter(f => f.startsWith('notebooklm_mcp_readiness_gate_') && f.endsWith('.md'))
      .sort();
    if (files.length > 0) {
      currentReadinessScore = parseReadinessScore(path.join(readinessGateDir, files[files.length - 1]));
    }
    if (files.length > 1) {
      previousReadinessScore = parseReadinessScore(path.join(readinessGateDir, files[files.length - 2]));
    }
  }

  if (fs.existsSync(completionReviewDir)) {
    const files = fs.readdirSync(completionReviewDir)
      .filter(f => f.startsWith('notebooklm_mcp_completion_review_') && f.endsWith('.md'))
      .sort();
    if (files.length > 0) {
      currentReviewScore = parseReviewScore(path.join(completionReviewDir, files[files.length - 1]));
    }
  }

  const scoreDelta = currentReviewScore - previousReadinessScore;

  // Blockers parsed from reports
  let latestBlockerFile = findLatestFile(readinessGateDir, 'notebooklm_mcp_blockers_');
  let currentBlockers: string[] = [];
  let previousBlockers: string[] = [];

  if (latestBlockerFile) {
    currentBlockers = parseBlockers(latestBlockerFile);
  } else {
    // Dynamic fallback
    const envVarsStatus = getEnvPresence();
    const envLocalExists = fs.existsSync(path.join(REPO_ROOT, '.env.local'));
    if (!envLocalExists) currentBlockers.push("Local Setup Files");
    for (const envName of expectedEnvNames) {
      if (!envVarsStatus[envName].present) currentBlockers.push(`Missing Env Key: ${envName}`);
    }
  }

  if (fs.existsSync(readinessGateDir)) {
    const files = fs.readdirSync(readinessGateDir)
      .filter(f => f.startsWith('notebooklm_mcp_blockers_') && f.endsWith('.md'))
      .sort();
    if (files.length > 1) {
      const prevBlockerFile = path.join(readinessGateDir, files[files.length - 2]);
      previousBlockers = parseBlockers(prevBlockerFile);
    }
  }

  const blockersCleared = previousBlockers.filter(b => !currentBlockers.includes(b));
  
  const clearedText = blockersCleared.length > 0 
    ? blockersCleared.map(b => `- **Cleared:** ${b}`).join('\n')
    : "*No blockers cleared in this pass.*";

  const remainingText = currentBlockers.length > 0
    ? currentBlockers.map(b => `- **Remaining:** ${b}`).join('\n')
    : "*Zero active blockers remaining.*";

  const isEligible = currentReviewScore >= 90 && !ALLOW_LIVE_MCP_EXECUTION && currentBlockers.length === 0;

  const nextAction = isEligible 
    ? "Proceed to live integration phase." 
    : "Resolve remaining blockers in .env.local and rerun readiness gate.";

  const templatePath = path.join(outputFolders.templates, 'readiness-comparison-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{PREVIOUS_SCORE\}\}/g, `${previousReadinessScore}%`)
    .replace(/\{\{CURRENT_SCORE\}\}/g, `${currentReviewScore}%`)
    .replace(/\{\{DELTA\}\}/g, `${scoreDelta >= 0 ? '+' : ''}${scoreDelta}%`)
    .replace(/\{\{BLOCKERS_CLEARED\}\}/g, clearedText)
    .replace(/\{\{BLOCKERS_REMAINING\}\}/g, remainingText)
    .replace(/\{\{LIVE_ELIGIBLE\}\}/g, isEligible ? "Yes" : "No")
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_readiness_comparison_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Readiness comparison generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPARE', detailMsg);

  await announceCompletion(`Readiness comparison compiled. Score Delta: ${scoreDelta >= 0 ? '+' : ''}${scoreDelta}%.`, "10");
  return safePath;
}

// 3. next-pass command
async function handleNextPass(): Promise<string> {
  console.log("🧭 Compiling runbook for the next pass...");
  await announceIntent("Compiling sequential sandbox setup runbook for the next pass.");

  const nextPassRows = [
    `| 1 | Map missing env variables in local override file | Define expected keys (e.g. NOTEBOOKLM_MCP_ENABLED) inside \`.env.local\` | Keys are successfully parsed | All 6 env vars detected |`,
    `| 2 | Confirm .env.local is properly gitignored | Verify \`.env.local\` is in \`.gitignore\` | File is ignored | git check-ignore returns file path |`,
    `| 3 | Configure Claude/Cursor MCP client settings | Add sidecar connector block to local configuration path | 'notebooklm-mcp' detected | Client setup matches command |`,
    `| 4 | Run local readiness gate validation re-check | \`npm run notebooklm-mcp-readiness-gate -- scan\` | Readiness score increases | Readiness Score is >= 90% |`,
    `| 5 | Compile setup manual review check | \`npm run notebooklm-mcp-completion-review -- review\` | Setup Completion Review report is created | Review Score reaches >= 90% |`,
    `| 6 | Check fix cycle status and compare progress | \`npm run notebooklm-mcp-fix-cycle -- status\` | Progress metrics printed | Live eligibility is confirmed |`
  ].join('\n');

  const safetyNote = "DO NOT enable live execution. The toggle ALLOW_LIVE_MCP_EXECUTION must remain set to false in config/notebooklm-mcp-readiness-gate.ts to prevent any external API queries, OAuth launch, or secret exposure in production/CI environments.";

  const templatePath = path.join(outputFolders.templates, 'next-pass-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{NEXT_PASS_ROWS\}\}/g, nextPassRows)
    .replace(/\{\{SAFETY_NOTE\}\}/g, safetyNote);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_next_pass_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Next pass runbook generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('NEXT-PASS', detailMsg);

  await announceCompletion("Next pass runbook staged safely in reports directory.", "10");
  return safePath;
}

// 4. status command
async function handleStatus() {
  const checklistsDir = path.join(outputFolders.root, 'checklists');
  const reportsDir = path.join(outputFolders.root, 'reports');

  const fixTaskListExists = fs.existsSync(checklistsDir) && fs.readdirSync(checklistsDir).some(f => f.startsWith('notebooklm_mcp_fix_tasks_') && f.endsWith('.md'));
  const comparisonReportExists = fs.existsSync(reportsDir) && fs.readdirSync(reportsDir).some(f => f.startsWith('notebooklm_mcp_readiness_comparison_') && f.endsWith('.md'));
  const nextPassReportExists = fs.existsSync(reportsDir) && fs.readdirSync(reportsDir).some(f => f.startsWith('notebooklm_mcp_next_pass_') && f.endsWith('.md'));

  const envVarsStatus = getEnvPresence();
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    if (envVarsStatus[envName].present) {
      envPresentCount++;
    }
  }

  const currentScore = Math.round((envPresentCount / expectedEnvNames.length) * 100);
  const isEligible = currentScore >= 90 && !ALLOW_LIVE_MCP_EXECUTION;

  const nextRecommendedAction = isEligible
    ? "Setup score is ready. Proceed to live integration stage."
    : "Rerun 'tasks' and generate the next-pass runbook to clear blockers.";

  console.log("=========================================");
  console.log("🔄 NOTEBOOKLM MCP SETUP FIX CYCLE STATUS");
  console.log("=========================================");
  console.log(`- Latest fix task list exists:     ${fixTaskListExists ? "Yes" : "No"}`);
  console.log(`- Latest comparison report exists:  ${comparisonReportExists ? "Yes" : "No"}`);
  console.log(`- Latest next-pass report exists:  ${nextPassReportExists ? "Yes" : "No"}`);
  console.log(`- Current score:                   ${currentScore}%`);
  console.log(`- Live eligible:                   ${isEligible ? "Yes" : "No"}`);
  console.log(`- Next recommended action:         ${nextRecommendedAction}`);
  console.log("=========================================");
}

async function run() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  // Ensure directories exist
  for (const dir of Object.values(outputFolders)) {
    if (dir !== outputFolders.templates && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  switch (command) {
    case "tasks":
      await handleTasks();
      break;
    case "compare":
      await handleCompare();
      break;
    case "next-pass":
      await handleNextPass();
      break;
    case "status":
      await handleStatus();
      break;
    case "help":
      console.log("Usage: npm run notebooklm-mcp-fix-cycle -- <tasks | compare | next-pass | status | help>");
      break;
    default:
      console.error(`Error: Unknown subcommand "${command}".`);
      process.exit(1);
  }
}

run().catch(err => {
  console.error("Critical execution error:", err);
  process.exit(1);
});
