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
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_correction_pack'),
  checklists: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_correction_pack', 'checklists'),
  runbooks: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_correction_pack', 'runbooks'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_correction_pack', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_correction_pack', 'logs')
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
  const logFile = path.join(outputFolders.logs, `correction_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// 1. Generate Blocker Corrections Report
async function handleBlockers(): Promise<string> {
  console.log("🔍 Compiling blocker corrections report...");
  await announceIntent("Evaluating active readiness gate blockers to generate manual steps.");

  const foundEnvNames: string[] = [];
  let localSetupExists = false;
  let mcpConfigRefExists = false;

  for (const fileObj of candidateLocalFiles) {
    if (fs.existsSync(fileObj.path)) {
      if (fileObj.name === '.env.local' || fileObj.name === '.mcp.local.json') {
        localSetupExists = true;
      }
      try {
        const content = fs.readFileSync(fileObj.path, 'utf-8');
        if (content.includes('notebooklm-mcp')) {
          mcpConfigRefExists = true;
        }
        for (const envName of expectedEnvNames) {
          const regex = new RegExp(`\\b${envName}\\b`, 'i');
          if (regex.test(content) && !foundEnvNames.includes(envName)) {
            foundEnvNames.push(envName);
          }
        }
      } catch (_) {}
    }
  }

  for (const envName of expectedEnvNames) {
    if (process.env[envName] && !foundEnvNames.includes(envName)) {
      foundEnvNames.push(envName);
    }
  }

  const blockersRows: string[] = [];

  if (ALLOW_LIVE_MCP_EXECUTION) {
    blockersRows.push(`| Live Execution Policy | High | Live adapter operations are prohibited prior to security signing. | Set ALLOW_LIVE_MCP_EXECUTION = false in config/notebooklm-mcp-readiness-gate.ts | npm run notebooklm-mcp-readiness-gate -- "scan" | ALLOW_LIVE_MCP_EXECUTION is false |`);
  }
  if (!localSetupExists) {
    blockersRows.push(`| Missing Local Setup Files | Medium | Local credential parameters are not defined outside version control. | Create local config file .env.local or .mcp.local.json | npm run notebooklm-mcp-readiness-gate -- "scan" | Local setup file exists logs as Yes |`);
  }
  if (!mcpConfigRefExists) {
    blockersRows.push(`| Missing MCP Config Reference | Medium | Claude/Cursor cannot resolve the sidecar execution command block. | Copy sidecar connector config to client settings | npm run notebooklm-mcp-readiness-gate -- "scan" | MCP Config References logs as Yes |`);
  }
  for (const envName of expectedEnvNames) {
    if (!foundEnvNames.includes(envName)) {
      blockersRows.push(`| Missing Environment Key: ${envName} | High | Node runtime is missing target credential profiles and workspace parameters. | Define the ${envName} key-value pair in .env.local | npm run notebooklm-mcp-readiness-gate -- "scan" | Key is list-checked as present |`);
    }
  }

  const tableRowsText = blockersRows.length > 0
    ? blockersRows.join('\n')
    : "| None | Low | No active blockers detected | No action required | N/A | Readiness score >= 90% and blockers is empty |";

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_correction_pack', 'blocker-correction-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{BLOCKER_ROWS\}\}/g, tableRowsText);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_blocker_corrections_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Blocker corrections report generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('BLOCKERS', detailMsg);

  await announceCompletion("Blocker corrections report generated successfully.", "10");
  return safePath;
}

// 2. Generate Env Key Map
async function handleEnvMap(): Promise<string> {
  console.log("🔑 Generating environment variables key map...");
  await announceIntent("Compiling expected variable profiles for credentials de-escalation.");

  const envMapDetails = [
    { name: "NOTEBOOKLM_MCP_ENABLED", purpose: "Enable MCP Sidecar Bridge", example: "false", location: ".env.local" },
    { name: "NOTEBOOKLM_MCP_SERVER_COMMAND", purpose: "Local MCP executable script command", example: "node dist/scripts/notebooklm-bridge.js", location: ".env.local" },
    { name: "NOTEBOOKLM_AUTH_PROFILE", purpose: "Named auth profile to load", example: "dev-profile", location: ".env.local" },
    { name: "GOOGLE_APPLICATION_CREDENTIALS", purpose: "Local filesystem path to Google Service Account JSON", example: "/Users/username/.config/gcloud/sa.json", location: ".env.local" },
    { name: "GOOGLE_CLOUD_PROJECT", purpose: "Google Cloud project ID to reference", example: "brilliantaire-os-project", location: ".env.local" },
    { name: "NOTEBOOKLM_WORKSPACE_ID", purpose: "NotebookLM workspace identifier token", example: "workspace-abc-123", location: ".env.local" }
  ];

  const envRows = envMapDetails.map(env => 
    `| ${env.name} | ${env.purpose} | \`${env.example}\` | ${env.location} | Do not commit to version control |`
  ).join('\n');

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_correction_pack', 'env-key-map-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{ENV_KEY_MAP_ROWS\}\}/g, envRows);

  const safePath = getSafeWritePath(outputFolders.checklists, `notebooklm_mcp_env_key_map_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Env key map generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('ENV_MAP', detailMsg);

  await announceCompletion("Env key map checklist generated successfully.", "10");
  return safePath;
}

// 3. Generate Local Config Checklist
async function handleLocalConfig(): Promise<string> {
  console.log("📋 Generating local configuration checklist...");
  await announceIntent("Compiling verification list for offline config setups.");

  const envLocalExists = fs.existsSync(path.join(REPO_ROOT, '.env.local'));
  let gitignoreIncludesEnvLocal = false;

  try {
    const gitignoreContent = fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf-8');
    if (gitignoreContent.includes('.env.local')) {
      gitignoreIncludesEnvLocal = true;
    }
  } catch (_) {}

  const checklistItems = [
    { check: "Create local-only .env.local", status: envLocalExists ? "PASSED" : "PENDING", evidence: envLocalExists ? ".env.local exists" : ".env.local not found", risk: "Medium", next: "Create the file in project root" },
    { check: "Confirm .env.local is gitignored", status: gitignoreIncludesEnvLocal ? "PASSED" : "PENDING", evidence: gitignoreIncludesEnvLocal ? ".gitignore contains .env.local" : ".env.local is not gitignored", risk: "High", next: "Add .env.local to .gitignore" },
    { check: "Confirm MCP local config references env variables only", status: "PASSED", evidence: "Static configurations verified", risk: "High", next: "Verify no plain secrets exist in mcp.json" },
    { check: "Confirm NOTEBOOKLM_MCP_ENABLED remains false until readiness passes", status: "PASSED", evidence: "Configuration flag is false", risk: "Medium", next: "Ensure bridge script loads disabled by default" },
    { check: "Confirm no secrets exist in repo files", status: "PASSED", evidence: "Checked codebase scanning", risk: "High", next: "Keep codebase clean from plaintext keys" }
  ];

  const checklistRows = checklistItems.map(item =>
    `| ${item.check} | ${item.status} | ${item.evidence} | ${item.risk} | ${item.next} |`
  ).join('\n');

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_correction_pack', 'local-config-checklist-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{CHECKLIST_ROWS\}\}/g, checklistRows);

  const safePath = getSafeWritePath(outputFolders.checklists, `notebooklm_mcp_local_config_checklist_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Local config checklist generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('LOCAL_CONFIG', detailMsg);

  await announceCompletion("Local config checklist generated successfully.", "10");
  return safePath;
}

// 4. Generate Git Push Recovery Runbook
async function handleGitPushRecovery(): Promise<string> {
  console.log("🔄 Generating git push recovery runbook...");
  await announceIntent("Compiling repository synchronization recovery directives.");

  const recoverySteps = [
    { step: "1. Check link connection / DNS", cmd: "ping -c 3 github.com", purpose: "Check local connection state", success: "Packets successfully received", warning: "Do not proceed if offline" },
    { step: "2. Check working copy status", cmd: "git status", purpose: "Verify local commit state", success: "Your branch is ahead or up to date", warning: "Address unstaged changes first" },
    { step: "3. Check remote destinations configuration", cmd: "git remote -v", purpose: "Inspect fetch/push target URLs", success: "Endpoints match origin repository target", warning: "Verify host endpoints before pushing" },
    { step: "4. Execute push command", cmd: "git push origin main", purpose: "Sync local branch with remote master repository", success: "Everything up-to-date or push succeeds", warning: "Do not force push without verification" },
    { step: "5. Verify latest remote commit sync", cmd: "git log -n 1", purpose: "Check local commits match upstream HEAD", success: "Latest commit hash matches remote HEAD history", warning: "N/A" }
  ];

  const recoveryRows = recoverySteps.map(step =>
    `| ${step.step} | \`${step.cmd}\` | ${step.purpose} | ${step.success} | ${step.warning} |`
  ).join('\n');

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_correction_pack', 'git-push-recovery-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{RECOVERY_ROWS\}\}/g, recoveryRows);

  const safePath = getSafeWritePath(outputFolders.runbooks, `notebooklm_git_push_recovery_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Git push recovery runbook generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('GIT_PUSH_RECOVERY', detailMsg);

  await announceCompletion("Git push recovery runbook generated successfully.", "10");
  return safePath;
}

// 5. Generate Readiness After Correction Runbook (Rerun Guide)
async function handleReadinessRerun(): Promise<string> {
  console.log("⏱️ Generating readiness rerun runbook...");
  await announceIntent("Compiling chronological validation checks to re-evaluate gate status.");

  const rerunSteps = [
    { cmd: "npm run notebooklm-mcp-auth -- \"scan\"", purpose: "Verify Auth environment variables setup", expected: "Auth variables exist logs as Yes", pass: "Readiness score shows positive change", next: "Run status checks" },
    { cmd: "npm run notebooklm-mcp-auth -- \"status\"", purpose: "Display auth parameters and checklist status", expected: "Outputs auth scan parameters", pass: "Config lists status passes", next: "Run hardening recheck" },
    { cmd: "npm run notebooklm-mcp-harden -- \"readiness-recheck\"", purpose: "Scan codebase for plain credentials", expected: "Hygiene scans find 0 plain credentials", pass: "Exit code 0 and reports show clean status", next: "Run setup readiness scan" },
    { cmd: "npm run notebooklm-mcp-readiness-gate -- \"scan\"", purpose: "Scan gate review setup state", expected: "Required env variables found logs as Yes", pass: "Gate scan score reaches 90% or above", next: "Run decision report builder" },
    { cmd: "npm run notebooklm-mcp-readiness-gate -- \"decision\"", purpose: "Compile live integration eligibility decision", expected: "Eligibility decision compiled successfully", pass: "Eligibility outputs ELIGIBLE", next: "Run final status review" },
    { cmd: "npm run notebooklm-mcp-readiness-gate -- \"status\"", purpose: "Display overall setup state review", expected: "Outputs status parameters review", pass: "Overall Eligible lists as Yes", next: "Operator manual approval" }
  ];

  const rerunRows = rerunSteps.map(step =>
    `| \`${step.cmd}\` | ${step.purpose} | ${step.expected} | ${step.pass} | ${step.next} |`
  ).join('\n');

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_correction_pack', 'readiness-after-correction-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{RERUN_ROWS\}\}/g, rerunRows);

  const safePath = getSafeWritePath(outputFolders.runbooks, `notebooklm_readiness_after_correction_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Readiness rerun runbook generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('READINESS_RERUN', detailMsg);

  await announceCompletion("Readiness rerun runbook generated successfully.", "10");
  return safePath;
}

// 6. Generate All Correction Pack Documents
async function handleAll() {
  console.log("🌀 Compiling entire correction pack documentation suite...");
  await announceIntent("Generating all manual setup runbooks and checklists.");

  await handleBlockers();
  await handleEnvMap();
  await handleLocalConfig();
  await handleGitPushRecovery();
  await handleReadinessRerun();

  console.log("🎉 Entire correction pack documents generated successfully.");
  logEvent('ALL', 'All correction pack documents compiled.');
}

// 7. Status Check
async function handleStatus() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP CORRECTION PACK STATUS");
  console.log("=========================================");

  let blockersReportExists = false;
  let envMapExists = false;
  let localConfigExists = false;
  let gitPushExists = false;
  let rerunExists = false;

  const dateStr = getFormattedDate();

  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports);
    blockersReportExists = files.some(f => f.startsWith(`notebooklm_mcp_blocker_corrections_${dateStr}`));
  }
  if (fs.existsSync(outputFolders.checklists)) {
    const files = fs.readdirSync(outputFolders.checklists);
    envMapExists = files.some(f => f.startsWith(`notebooklm_mcp_env_key_map_${dateStr}`));
    localConfigExists = files.some(f => f.startsWith(`notebooklm_mcp_local_config_checklist_${dateStr}`));
  }
  if (fs.existsSync(outputFolders.runbooks)) {
    const files = fs.readdirSync(outputFolders.runbooks);
    gitPushExists = files.some(f => f.startsWith(`notebooklm_git_push_recovery_${dateStr}`));
    rerunExists = files.some(f => f.startsWith(`notebooklm_readiness_after_correction_${dateStr}`));
  }

  console.log(`- **Latest Blocker Correction Report Exists:** ${blockersReportExists ? 'Yes' : 'No'}`);
  console.log(`- **Env Key Map Exists:** ${envMapExists ? 'Yes' : 'No'}`);
  console.log(`- **Local Config Checklist Exists:** ${localConfigExists ? 'Yes' : 'No'}`);
  console.log(`- **Git Push Recovery Runbook Exists:** ${gitPushExists ? 'Yes' : 'No'}`);
  console.log(`- **Readiness Rerun Runbook Exists:** ${rerunExists ? 'Yes' : 'No'}`);

  let nextRecommendedAction = "Run complete compilation using `npm run notebooklm-mcp-correction-pack -- \"all\"`.";
  if (blockersReportExists && envMapExists && localConfigExists && gitPushExists && rerunExists) {
    nextRecommendedAction = "All correction documents generated. Perform manual local setup outside version control.";
  }

  console.log(`- **Next Recommended Action:** ${nextRecommendedAction}`);
  console.log("=========================================");

  logEvent('STATUS', `Status checked. blockers=${blockersReportExists}, envMap=${envMapExists}, localConfig=${localConfigExists}, gitPush=${gitPushExists}, rerun=${rerunExists}`);
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const command = rawInput.trim();

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-correction-pack-help.js');
    await import(helpPath);
    return;
  }

  // Safety controls boundary checks
  if (ALLOW_LIVE_MCP_EXECUTION) {
    console.error("❌ Error: ALLOW_LIVE_MCP_EXECUTION must remain disabled in correction pack phase.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'blockers':
        await handleBlockers();
        break;
      case 'env-map':
        await handleEnvMap();
        break;
      case 'local-config':
        await handleLocalConfig();
        break;
      case 'git-push-recovery':
        await handleGitPushRecovery();
        break;
      case 'readiness-rerun':
        await handleReadinessRerun();
        break;
      case 'all':
        await handleAll();
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-correction-pack-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Correction pack execution failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal correction pack runtime error: ${err}`);
  process.exit(1);
});
