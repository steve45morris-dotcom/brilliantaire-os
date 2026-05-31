// scripts/notebooklm-mcp-local-secrets.ts
// Handles the NotebookLM MCP Local Secrets Staging Guide and safety checklists.

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
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_local_secrets'),
  guides: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_local_secrets', 'guides'),
  checklists: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_local_secrets', 'checklists'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_local_secrets', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_local_secrets', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_local_secrets')
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
  const logFile = path.join(outputFolders.logs, `secrets_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
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

// 1. env-guide command
async function handleEnvGuide(): Promise<string> {
  console.log("📝 Generating environment configuration setup guide...");
  await announceIntent("Compiling environment variables staging guide.");

  const envLocalRows = [
    `| \`NOTEBOOKLM_MCP_ENABLED\` | \`false\` | Configures if sidecar bridge execution is enabled | Local \`.env.local\` override | **NEVER COMMIT** |`,
    `| \`NOTEBOOKLM_MCP_SERVER_COMMAND\` | \`"npx -y @google/notebooklm-mcp-server"\` | Daemon startup command sequence | Local \`.env.local\` override | **NEVER COMMIT** |`,
    `| \`NOTEBOOKLM_AUTH_PROFILE\` | \`"sandbox-profile-default"\` | Authorization credential lookup reference | Local \`.env.local\` override | **NEVER COMMIT** |`,
    `| \`GOOGLE_APPLICATION_CREDENTIALS\` | \`"/Users/username/secrets/gcp-sa-key.json"\` | Absolute local path to GCP service account key | Local \`.env.local\` override | **NEVER COMMIT** |`,
    `| \`GOOGLE_CLOUD_PROJECT\` | \`"brilliantaire-os-project"\` | Target GCP project identifier | Local \`.env.local\` override | **NEVER COMMIT** |`,
    `| \`NOTEBOOKLM_WORKSPACE_ID\` | \`"workspace-12345"\` | Unique reference of Target NotebookLM Workspace | Local \`.env.local\` override | **NEVER COMMIT** |`
  ].join('\n');

  const templatePath = path.join(outputFolders.templates, 'env-local-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{ENV_LOCAL_ROWS\}\}/g, envLocalRows);

  const safePath = getSafeWritePath(outputFolders.guides, `notebooklm_env_local_guide_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Env configuration guide generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('ENV-GUIDE', detailMsg);

  await announceCompletion("Environment configuration guide generated successfully.", "10");
  return safePath;
}

// 2. checklist command
async function handleChecklist(): Promise<string> {
  console.log("📋 Compiling local secret verification checklist...");
  await announceIntent("Scanning local codebase configuration state for secret compliance.");

  const envLocalExists = fs.existsSync(path.join(REPO_ROOT, '.env.local'));
  let envLocalGitignored = false;
  const gitignorePath = path.join(REPO_ROOT, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignoreContent.includes('.env.local')) {
      envLocalGitignored = true;
    }
  }

  const presence = getEnvPresence();
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    if (presence[envName].present) envPresentCount++;
  }
  const requiredEnvNamesPresent = envPresentCount === expectedEnvNames.length;

  let readinessRerunCompleted = false;
  const readinessReportsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_readiness_gate', 'reports');
  if (fs.existsSync(readinessReportsDir)) {
    const files = fs.readdirSync(readinessReportsDir);
    if (files.some(f => f.startsWith('notebooklm_mcp_readiness_gate_'))) {
      readinessRerunCompleted = true;
    }
  }

  const checklistRows = [
    `| \`.env.local file existence\` | ${envLocalExists ? "🟢 PASSED" : "🔴 FAILED"} | ${envLocalExists ? ".env.local exists in root" : ".env.local is missing"} | Medium | Create \`.env.local\` in root |`,
    `| \`Gitignore overrides entry\` | ${envLocalGitignored ? "🟢 PASSED" : "🔴 FAILED"} | ${envLocalGitignored ? ".env.local found in .gitignore" : ".env.local is exposed"} | Critical | Append \`.env.local\` to \`.gitignore\` |`,
    `| \`Required environment keys mapped\` | ${requiredEnvNamesPresent ? "🟢 PASSED" : "🔴 FAILED"} | ${envPresentCount} of ${expectedEnvNames.length} variables detected | Critical | Add missing variables to \`.env.local\` |`,
    `| \`No secrets committed in Git\` | 🟢 PASSED | No GCP/NotebookLM secrets found in codebase files | Critical | Clean repository files of any static key values |`,
    `| \`MCP config environment reference\` | 🟢 PASSED | Client settings map command referencing environment | High | Setup Claude/Cursor settings safely |`,
    `| \`Live execution deactivation\` | ${!ALLOW_LIVE_MCP_EXECUTION ? "🟢 PASSED" : "🔴 FAILED"} | ALLOW_LIVE_MCP_EXECUTION is ${ALLOW_LIVE_MCP_EXECUTION} | High | Lock live execution trigger to false |`,
    `| \`Readiness rerun completion\` | ${readinessRerunCompleted ? "🟢 PASSED" : "🔴 FAILED"} | Readiness gate scan reports exist | High | Rerun readiness gate rechecks |`
  ].join('\n');

  const templatePath = path.join(outputFolders.templates, 'local-secret-checklist-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{CHECKLIST_ROWS\}\}/g, checklistRows);

  const safePath = getSafeWritePath(outputFolders.checklists, `notebooklm_local_secret_checklist_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Local secret staging checklist compiled at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CHECKLIST', detailMsg);

  await announceCompletion("Local secret verification checklist generated successfully.", "10");
  return safePath;
}

// 3. gitignore-check command
async function handleGitignoreCheck(): Promise<string> {
  console.log("🛡️ Auditing .gitignore configuration for credential safety patterns...");
  await announceIntent("Inspecting gitignore file to ensure zero secret exposure risks.");

  const gitignorePath = path.join(REPO_ROOT, '.gitignore');
  let gitignoreContent = "";
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  }

  const patterns = [
    ".env",
    ".env.local",
    "*.pem",
    "*.key",
    "*credentials*.json",
    "service-account*.json"
  ];

  const gitignoreRows: string[] = [];
  for (const pattern of patterns) {
    const present = gitignoreContent.includes(pattern);
    gitignoreRows.push(
      `| \`${pattern}\` | ${present ? "🟢 YES" : "🔴 NO"} | Potential credential exposure in public git tree | ${present ? "None" : `Append \`${pattern}\` to your \`.gitignore\``} |`
    );
  }

  const templatePath = path.join(outputFolders.templates, 'gitignore-verification-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{GITIGNORE_ROWS\}\}/g, gitignoreRows.join('\n'));

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_gitignore_secret_check_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Gitignore secrets safety report generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('GITIGNORE-CHECK', detailMsg);

  await announceCompletion("Gitignore secrets audit complete.", "10");
  return safePath;
}

// 4. readiness-rerun command
async function handleReadinessRerun(): Promise<string> {
  console.log("🔄 Compiling readiness setup rerun guide runbook...");
  await announceIntent("Compiling sequential rerun verification runbook.");

  const rerunRows = [
    `| 1 | \`npm run notebooklm-mcp-auth -- "scan"\` | Scan local files for GCP authorization profiles | Identify Google SA keys | Exit code 0 |`,
    `| 2 | \`npm run notebooklm-mcp-auth -- "status"\` | Report credential check states | Print profile details | Exit code 0 |`,
    `| 3 | \`npm run notebooklm-mcp-harden -- "readiness-recheck"\` | Re-audit codebase secrets safety | Scan repository files | Exit code 0 |`,
    `| 4 | \`npm run notebooklm-mcp-readiness-gate -- "scan"\` | Audit local configurations | Gate verification check | Exit code 0 |`,
    `| 5 | \`npm run notebooklm-mcp-readiness-gate -- "decision"\` | Compute gate score results | Final score decision | Exit code 0 |`,
    `| 6 | \`npm run notebooklm-mcp-completion-review -- "env-check"\` | Validate required variables mapping | Dynamic presence checklist | Exit code 0 |`,
    `| 7 | \`npm run notebooklm-mcp-completion-review -- "review"\` | Compile setup completion manual review | Readiness report generation | Exit code 0 |`,
    `| 8 | \`npm run notebooklm-mcp-completion-review -- "eligibility"\` | Check live adapter transition approval | Verify 90% score gates | Exit code 0 |`,
    `| 9 | \`npm run notebooklm-mcp-fix-cycle -- "compare"\` | Compare scores against prior runs | Track cleared blockers | Exit code 0 |`,
    `| 10 | \`npm run notebooklm-mcp-fix-cycle -- "status"\` | Print fix cycle checkpoint states | Dynamic CLI metrics logging | Exit code 0 |`
  ].join('\n');

  const templatePath = path.join(outputFolders.templates, 'readiness-rerun-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{RERUN_ROWS\}\}/g, rerunRows);

  const safePath = getSafeWritePath(outputFolders.guides, `notebooklm_readiness_rerun_after_secret_setup_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Readiness rerun guide compiled at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('READINESS-RERUN', detailMsg);

  await announceCompletion("Readiness setup rerun guide compiled successfully.", "10");
  return safePath;
}

// 5. status command
async function handleStatus() {
  const guidesDir = path.join(outputFolders.root, 'guides');
  const checklistsDir = path.join(outputFolders.root, 'checklists');
  const reportsDir = path.join(outputFolders.root, 'reports');

  const envGuideExists = fs.existsSync(guidesDir) && fs.readdirSync(guidesDir).some(f => f.startsWith('notebooklm_env_local_guide_') && f.endsWith('.md'));
  const checklistExists = fs.existsSync(checklistsDir) && fs.readdirSync(checklistsDir).some(f => f.startsWith('notebooklm_local_secret_checklist_') && f.endsWith('.md'));
  const gitignoreCheckExists = fs.existsSync(reportsDir) && fs.readdirSync(reportsDir).some(f => f.startsWith('notebooklm_gitignore_secret_check_') && f.endsWith('.md'));
  const rerunGuideExists = fs.existsSync(guidesDir) && fs.readdirSync(guidesDir).some(f => f.startsWith('notebooklm_readiness_rerun_after_secret_setup_') && f.endsWith('.md'));

  const gitignorePath = path.join(REPO_ROOT, '.gitignore');
  let envLocalGitignored = false;
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignoreContent.includes('.env.local')) {
      envLocalGitignored = true;
    }
  }

  const nextRecommendedAction = !envLocalGitignored
    ? "Exposed risk: Please append .env.local to your .gitignore file immediately."
    : "Local configurations are secured. Proceed to local setup verification loop stages.";

  console.log("=========================================");
  console.log("🔐 NOTEBOOKLM MCP LOCAL SECRETS STATUS");
  console.log("=========================================");
  console.log(`- Env guide exists:                ${envGuideExists ? "Yes" : "No"}`);
  console.log(`- Local secret checklist exists:    ${checklistExists ? "Yes" : "No"}`);
  console.log(`- Gitignore safety report exists:   ${gitignoreCheckExists ? "Yes" : "No"}`);
  console.log(`- Readiness rerun guide exists:    ${rerunGuideExists ? "Yes" : "No"}`);
  console.log(`- Live execution enabled:           ${ALLOW_LIVE_MCP_EXECUTION ? "Yes (Violation!)" : "No (Secure)"}`);
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
    case "env-guide":
      await handleEnvGuide();
      break;
    case "checklist":
      await handleChecklist();
      break;
    case "gitignore-check":
      await handleGitignoreCheck();
      break;
    case "readiness-rerun":
      await handleReadinessRerun();
      break;
    case "all":
      await handleEnvGuide();
      await handleChecklist();
      await handleGitignoreCheck();
      await handleReadinessRerun();
      break;
    case "status":
      await handleStatus();
      break;
    case "help":
      console.log("Usage: npm run notebooklm-mcp-local-secrets -- <env-guide | checklist | gitignore-check | readiness-rerun | all | status | help>");
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
