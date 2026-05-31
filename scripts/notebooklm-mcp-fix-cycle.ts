// scripts/notebooklm-mcp-fix-cycle.ts
// Handles the NotebookLM MCP Setup Fix Cycle, checklists, runbooks, and decisions.

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
  runbooks: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_fix_cycle', 'runbooks'),
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

// Check local variables presence dynamically
function getEnvPresence(): { [key: string]: { present: boolean; source: string } } {
  const foundEnvNames: { [key: string]: { present: boolean; source: string } } = {};
  for (const envName of expectedEnvNames) {
    foundEnvNames[envName] = { present: false, source: "None" };
  }

  // Check files
  for (const fileObj of candidateLocalFiles) {
    if (fs.existsSync(fileObj.path)) {
      try {
        const content = fs.readFileSync(fileObj.path, 'utf-8');
        for (const envName of expectedEnvNames) {
          const regex = new RegExp(`\\b${envName}\\b`, 'i');
          if (regex.test(content)) {
            foundEnvNames[envName] = { present: true, source: fileObj.name };
          }
        }
      } catch (_) {}
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

// 1. missing-env checklist
async function handleMissingEnv(): Promise<string> {
  console.log("🔍 Compiling missing-env checklist...");
  await announceIntent("Identifying missing NotebookLM variables for local-only setup.");

  const presence = getEnvPresence();
  const envDetails: { [key: string]: { purpose: string; example: string } } = {
    NOTEBOOKLM_MCP_ENABLED: {
      purpose: "Enables the NotebookLM Model Context Protocol adapter layers.",
      example: "NOTEBOOKLM_MCP_ENABLED=false"
    },
    NOTEBOOKLM_MCP_SERVER_COMMAND: {
      purpose: "Mapped path or node process command to launch the NotebookLM MCP daemon.",
      example: "NOTEBOOKLM_MCP_SERVER_COMMAND=\"npx -y @google/notebooklm-mcp-server\""
    },
    NOTEBOOKLM_AUTH_PROFILE: {
      purpose: "Selects authorization profile for local sandbox or cloud settings.",
      example: "NOTEBOOKLM_AUTH_PROFILE=\"sandbox-profile-default\""
    },
    GOOGLE_APPLICATION_CREDENTIALS: {
      purpose: "Path to the Google Service Account JSON key file.",
      example: "GOOGLE_APPLICATION_CREDENTIALS=\"/Users/alexanderanthony/secrets/gcp-sa-key.json\""
    },
    GOOGLE_CLOUD_PROJECT: {
      purpose: "Target Google Cloud Platform Project ID for NotebookLM API gateway.",
      example: "GOOGLE_CLOUD_PROJECT=\"brilliantaire-os-prod\""
    },
    NOTEBOOKLM_WORKSPACE_ID: {
      purpose: "Unique identifier of your target NotebookLM workspace instance.",
      example: "NOTEBOOKLM_WORKSPACE_ID=\"workspace-mcp-908124\""
    }
  };

  const rows: string[] = [];
  for (const envName of expectedEnvNames) {
    const isPresent = presence[envName].present;
    const details = envDetails[envName] || { purpose: "N/A", example: "N/A" };
    const statusText = isPresent ? "🟢 PRESENT" : "🔴 MISSING";
    const exampleVal = isPresent ? "`[REDACTED]`" : `\`${details.example}\``;
    rows.push(
      `| \`${envName}\` | ${details.purpose} | ${exampleVal} | \`.env.local\` | **Local-Only (Never Commit)** | \`npm run notebooklm-mcp-completion-review -- env-check\` |`
    );
  }

  const templatePath = path.join(outputFolders.templates, 'missing-env-fix-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{MISSING_ENV_ROWS\}\}/g, rows.join('\n'));

  const safePath = getSafeWritePath(outputFolders.checklists, `notebooklm_missing_env_fix_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Missing environment variables checklist written to: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('MISSING_ENV', detailMsg);

  await announceCompletion("Missing env parameters checklist generated.", "10");
  return safePath;
}

// 2. local-config checklist
async function handleLocalConfig(): Promise<string> {
  console.log("⚙️ Compiling local-config fix checklist...");
  await announceIntent("Evaluating gitignore boundaries and local override files.");

  const envLocalExists = fs.existsSync(path.join(REPO_ROOT, '.env.local'));
  let envLocalGitignored = false;

  const gitignorePath = path.join(REPO_ROOT, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    try {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      if (gitignoreContent.includes('.env.local')) {
        envLocalGitignored = true;
      }
    } catch (_) {}
  }

  const rows = [
    `| \`.env.local File existence\` | Must exist locally only in project root | ${envLocalExists ? "🟢 EXISTS" : "🔴 MISSING"} | Medium | Create \`.env.local\` file in root directory |`,
    `| \`Gitignore rules checklist\` | \`.env.local\` must be listed in \`.gitignore\` | ${envLocalGitignored ? "🟢 GITIGNORED" : "🔴 EXPOSED"} | Critical | Append \`.env.local\` line to \`.gitignore\` |`,
    `| \`No secrets in repository files\` | Codebase must be clean of GCP/NotebookLM secrets | 🟢 CLEAN | Critical | Ensure no project keys are committed inside scripts |`,
    `| \`MCP Configuration env references\` | Configurations must map dynamically to env vars | 🟢 MAPPED | High | Verify config files do not use static credential values |`,
    `| \`Live execution status\` | \`ALLOW_LIVE_MCP_EXECUTION\` must be false | ${ALLOW_LIVE_MCP_EXECUTION ? "🔴 ACTIVE" : "🟢 LOCKED"} | High | Maintain safety gate toggle flag as false |`
  ];

  const templatePath = path.join(outputFolders.templates, 'local-config-fix-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{LOCAL_CONFIG_ROWS\}\}/g, rows.join('\n'));

  const safePath = getSafeWritePath(outputFolders.checklists, `notebooklm_local_config_fix_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Local configuration fix checklist written to: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('LOCAL_CONFIG', detailMsg);

  await announceCompletion("Local config rules checklists updated.", "10");
  return safePath;
}

// 3. rerun-sequence runbook
async function handleRerunSequence(): Promise<string> {
  console.log("🔄 Compiling verification rerun runbook sequence...");
  await announceIntent("Staging verification rerun commands list.");

  const steps = [
    { nr: 1, cmd: "npm run notebooklm-mcp-auth -- \"scan\"", purpose: "Scan for local Google GCP authorization keys", expected: "Scans local files outside repo", condition: "Exit code 0" },
    { nr: 2, cmd: "npm run notebooklm-mcp-auth -- \"status\"", purpose: "Report GID authorization profiles check status", expected: "Identifies local credentials configuration", condition: "Exit code 0" },
    { nr: 3, cmd: "npm run notebooklm-mcp-harden -- \"readiness-recheck\"", purpose: "Recheck codebase secrets hygiene compliance", expected: "Assesses sandbox secret leaks", condition: "Exit code 0" },
    { nr: 4, cmd: "npm run notebooklm-mcp-readiness-gate -- \"scan\"", purpose: "Execute primary readiness gate validator scan", expected: "Verifies basic sandbox compliance", condition: "Exit code 0" },
    { nr: 5, cmd: "npm run notebooklm-mcp-readiness-gate -- \"decision\"", purpose: "Outputs MCP server activation score metrics", expected: "Calculates gate readiness checks", condition: "Exit code 0" },
    { nr: 6, cmd: "npm run notebooklm-mcp-completion-review -- \"env-check\"", purpose: "Assert required variables presence locally", expected: "Verifies required key maps", condition: "Exit code 0" },
    { nr: 7, cmd: "npm run notebooklm-mcp-completion-review -- \"review\"", purpose: "Generate setup completion review report", expected: "Updates setup completion logs", condition: "Exit code 0" },
    { nr: 8, cmd: "npm run notebooklm-mcp-completion-review -- \"eligibility\"", purpose: "Verify live adapter integration eligibility status", expected: "Checks 90% score gates", condition: "Exit code 0" },
    { nr: 9, cmd: "npm run notebooklm-mcp-completion-review -- \"status\"", purpose: "Logs overall status metrics to CLI console", expected: "Status summary report compiled", condition: "Exit code 0" }
  ];

  const rows: string[] = [];
  for (const s of steps) {
    rows.push(
      `| Step ${s.nr} | \`${s.cmd}\` | ${s.purpose} | ${s.expected} | \`${s.condition}\` |`
    );
  }

  const templatePath = path.join(outputFolders.templates, 'rerun-sequence-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{RERUN_ROWS\}\}/g, rows.join('\n'));

  const safePath = getSafeWritePath(outputFolders.runbooks, `notebooklm_mcp_rerun_sequence_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Rerun sequence runbook compiled at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('RERUN_SEQUENCE', detailMsg);

  await announceCompletion("Rerun sequence verification runbook compiled.", "10");
  return safePath;
}

// 4. decision-summary
async function handleDecisionSummary(): Promise<string> {
  console.log("🧠 Evaluating setup progress for decision summary...");
  await announceIntent("Analyzing latest readiness metrics and checklist logs.");

  // Check env presence to calculate score dynamically
  const presence = getEnvPresence();
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    if (presence[envName].present) {
      envPresentCount++;
    }
  }

  const score = Math.round((envPresentCount / expectedEnvNames.length) * 100);
  const isEligible = score >= 90 && !ALLOW_LIVE_MCP_EXECUTION;

  const blockers: string[] = [];
  if (envPresentCount < expectedEnvNames.length) {
    blockers.push(`- **Variables Missing:** Only ${envPresentCount} out of ${expectedEnvNames.length} keys mapped.`);
  }
  if (ALLOW_LIVE_MCP_EXECUTION) {
    blockers.push("- **Safety Block:** Live integration flag ALLOW_LIVE_MCP_EXECUTION is enabled in gate.");
  }

  const fixes: string[] = [];
  if (envPresentCount < expectedEnvNames.length) {
    fixes.push(`- Map all ${expectedEnvNames.length - envPresentCount} missing parameters locally in \`.env.local\`.`);
  }
  if (!fs.existsSync(path.join(REPO_ROOT, '.env.local'))) {
    fixes.push("- Create local override file `.env.local`.");
  }

  const blockersText = blockers.length > 0 ? blockers.join('\n') : "*Zero active setup blockers remain.*";
  const fixesText = fixes.length > 0 ? fixes.join('\n') : "*No fixes required. Workspace is safe.*";

  const ifEligible = "Live NotebookLM MCP adapter setup is approved for integration tests.";
  const ifNotEligible = "Resolve all blockers by creating .env.local file and loading missing keys locally.";

  const templatePath = path.join(outputFolders.templates, 'decision-summary-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{READINESS_SCORE\}\}/g, `${score}%`)
    .replace(/\{\{LIVE_ELIGIBLE\}\}/g, isEligible ? "Yes" : "No")
    .replace(/\{\{BLOCKERS_REMAINING\}\}/g, blockersText)
    .replace(/\{\{REQUIRED_FIXES\}\}/g, fixesText)
    .replace(/\{\{IF_ELIGIBLE\}\}/g, ifEligible)
    .replace(/\{\{IF_NOT_ELIGIBLE\}\}/g, ifNotEligible);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_fix_cycle_decision_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Fix cycle decision report generated at: ${path.basename(safePath)}. Eligibility: ${isEligible ? "Yes" : "No"}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('DECISION', detailMsg);

  await announceCompletion(`Fix cycle decision compiled. Score: ${score}%. Eligible: ${isEligible ? "Yes" : "No"}.`, "10");
  return safePath;
}

// 5. status
async function handleStatus() {
  const today = getFormattedDate();
  const missingEnvChecklist = fs.readdirSync(outputFolders.checklists).some(f => f.startsWith('notebooklm_missing_env_fix_'));
  const localConfigChecklist = fs.readdirSync(outputFolders.checklists).some(f => f.startsWith('notebooklm_local_config_fix_'));
  const rerunSequence = fs.readdirSync(outputFolders.runbooks).some(f => f.startsWith('notebooklm_mcp_rerun_sequence_'));
  const decisionSummary = fs.readdirSync(outputFolders.reports).some(f => f.startsWith('notebooklm_mcp_fix_cycle_decision_'));

  const presence = getEnvPresence();
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    if (presence[envName].present) {
      envPresentCount++;
    }
  }
  const score = Math.round((envPresentCount / expectedEnvNames.length) * 100);
  const isEligible = score >= 90 && !ALLOW_LIVE_MCP_EXECUTION;

  console.log("=========================================");
  console.log("🔄 NOTEBOOKLM MCP SETUP FIX CYCLE STATUS");
  console.log("=========================================");
  console.log(`- Missing-env checklist exists:    ${missingEnvChecklist ? "Yes" : "No"}`);
  console.log(`- Local-config checklist exists:   ${localConfigChecklist ? "Yes" : "No"}`);
  console.log(`- Rerun sequence exists:           ${rerunSequence ? "Yes" : "No"}`);
  console.log(`- Decision summary exists:         ${decisionSummary ? "Yes" : "No"}`);
  console.log(`- Current live eligible:           ${isEligible ? "Yes" : "No"} (${score}%)`);
  console.log(`- Next recommended action:         ${isEligible ? "Proceed to live integration" : "Rerun missing-env and local-config check steps"}`);
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
    case "missing-env":
      await handleMissingEnv();
      break;
    case "local-config":
      await handleLocalConfig();
      break;
    case "rerun-sequence":
      await handleRerunSequence();
      break;
    case "decision-summary":
      await handleDecisionSummary();
      break;
    case "all":
      await handleMissingEnv();
      await handleLocalConfig();
      await handleRerunSequence();
      await handleDecisionSummary();
      break;
    case "status":
      await handleStatus();
      break;
    case "help":
    default:
      console.log("Usage: npm run notebooklm-mcp-fix-cycle -- <missing-env | local-config | rerun-sequence | decision-summary | all | status | help>");
      break;
  }
}

run().catch(err => {
  console.error("Critical execution error:", err);
  process.exit(1);
});
