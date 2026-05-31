import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const MANUAL_SETUP_ROOT = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_manual_setup');
const RUNBOOKS_DIR = path.join(MANUAL_SETUP_ROOT, 'runbooks');
const CHECKLISTS_DIR = path.join(MANUAL_SETUP_ROOT, 'checklists');
const REPORTS_DIR = path.join(MANUAL_SETUP_ROOT, 'reports');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_manual_setup');

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
  const logDir = path.join(MANUAL_SETUP_ROOT, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `setup_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// 1. Generate Runbook
async function handleRunbook(): Promise<string> {
  console.log("📝 Compiling manual setup runbook...");
  await announceIntent("Compiling step-by-step setup parameters and manual boundary instructions.");

  const templatePath = path.join(TEMPLATES_DIR, 'manual-setup-runbook-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content.replace(/\{\{DATE\}\}/g, getFormattedDate());

  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(RUNBOOKS_DIR, `notebooklm_mcp_manual_setup_runbook_${dateStr}`, '.md');
  fs.writeFileSync(safePath, content);

  const detailMsg = `Manual setup runbook generated at ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('RUNBOOK', detailMsg);

  await announceCompletion("Manual setup runbook generated successfully.", "10");
  return safePath;
}

// 2. Generate Env Instructions
async function handleEnvInstructions(): Promise<string> {
  console.log("📝 Generating .env.local manual setup instructions...");
  await announceIntent("Creating safe local environment templates for credentials de-escalation.");

  const templatePath = path.join(TEMPLATES_DIR, 'env-local-instructions-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content.replace(/\{\{DATE\}\}/g, getFormattedDate());

  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(CHECKLISTS_DIR, `notebooklm_env_local_instructions_${dateStr}`, '.md');
  fs.writeFileSync(safePath, content);

  const detailMsg = `.env.local setup instructions written to ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('ENV_INSTRUCTIONS', detailMsg);

  await announceCompletion(".env.local instructions generated.", "10");
  return safePath;
}

// 3. Generate Config Copy Guide
async function handleConfigCopy(): Promise<string> {
  console.log("📝 Generating MCP client configuration copy guide...");
  await announceIntent("Generating manual instructions to map sidecar connector to Claude/Cursor.");

  const templatePath = path.join(TEMPLATES_DIR, 'mcp-config-copy-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content.replace(/\{\{DATE\}\}/g, getFormattedDate());

  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(CHECKLISTS_DIR, `notebooklm_mcp_config_copy_${dateStr}`, '.md');
  fs.writeFileSync(safePath, content);

  const detailMsg = `Config copy guide written to ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CONFIG_COPY', detailMsg);

  await announceCompletion("MCP client configuration copy checklist compiled.", "10");
  return safePath;
}

// 4. Generate Readiness Rerun Guide
async function handleReadinessRerun(): Promise<string> {
  console.log("📝 Generating readiness rerun and validation guide...");
  await announceIntent("Generating instructions to rerun validation scripts to confirm variables mapping.");

  const templatePath = path.join(TEMPLATES_DIR, 'readiness-rerun-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content.replace(/\{\{DATE\}\}/g, getFormattedDate());

  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(CHECKLISTS_DIR, `notebooklm_readiness_rerun_${dateStr}`, '.md');
  fs.writeFileSync(safePath, content);

  const detailMsg = `Readiness rerun guide written to ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('READINESS_RERUN', detailMsg);

  await announceCompletion("Readiness rerun validation guide generated.", "10");
  return safePath;
}

// 5. Generate Rollback Checklist
async function handleRollback(): Promise<string> {
  console.log("📝 Generating manual rollback and deactivation checklist...");
  await announceIntent("Compiling rollback procedures to clean credentials from environment.");

  const templatePath = path.join(TEMPLATES_DIR, 'rollback-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content.replace(/\{\{DATE\}\}/g, getFormattedDate());

  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(CHECKLISTS_DIR, `notebooklm_mcp_rollback_${dateStr}`, '.md');
  fs.writeFileSync(safePath, content);

  const detailMsg = `Deactivation rollback plan written to ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('ROLLBACK', detailMsg);

  await announceCompletion("Rollback deactivation plan checklist generated.", "10");
  return safePath;
}

// 6. Generate All Setup Documents
async function handleAll() {
  console.log("🚀 Generating all manual setup documents and checklists...");
  await announceIntent("Running full manual setup compilation suite.");

  await handleRunbook();
  await handleEnvInstructions();
  await handleConfigCopy();
  await handleReadinessRerun();
  await handleRollback();

  const detailMsg = "All manual setup guides and checklists compiled successfully.";
  console.log(`🎉 ${detailMsg}`);
  logEvent('ALL', detailMsg);

  await announceCompletion("Full manual setup suite generated.", "12");
}

// 7. Print Status Output
async function handleStatus() {
  console.log("=========================================");
  console.log("📖 NOTEBOOKLM MCP MANUAL SETUP STATUS SUMMARY");
  console.log("=========================================");

  let hasRunbook = "No";
  let hasEnv = "No";
  let hasCopy = "No";
  let hasRerun = "No";
  let hasRollback = "No";

  if (fs.existsSync(RUNBOOKS_DIR)) {
    const files = fs.readdirSync(RUNBOOKS_DIR);
    const runbookFiles = files.filter(f => f.startsWith('notebooklm_mcp_manual_setup_runbook_')).sort();
    if (runbookFiles.length > 0) hasRunbook = `Yes (${runbookFiles[runbookFiles.length - 1]})`;
  }

  if (fs.existsSync(CHECKLISTS_DIR)) {
    const files = fs.readdirSync(CHECKLISTS_DIR);
    
    const envFiles = files.filter(f => f.startsWith('notebooklm_env_local_instructions_')).sort();
    if (envFiles.length > 0) hasEnv = `Yes (${envFiles[envFiles.length - 1]})`;

    const copyFiles = files.filter(f => f.startsWith('notebooklm_mcp_config_copy_')).sort();
    if (copyFiles.length > 0) hasCopy = `Yes (${copyFiles[copyFiles.length - 1]})`;

    const rerunFiles = files.filter(f => f.startsWith('notebooklm_readiness_rerun_')).sort();
    if (rerunFiles.length > 0) hasRerun = `Yes (${rerunFiles[rerunFiles.length - 1]})`;

    const rollbackFiles = files.filter(f => f.startsWith('notebooklm_mcp_rollback_')).sort();
    if (rollbackFiles.length > 0) hasRollback = `Yes (${rollbackFiles[rollbackFiles.length - 1]})`;
  }

  // Find latest hardening report
  let latestHardeningReport = "None";
  const hardeningReportsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_hardening', 'reports');
  if (fs.existsSync(hardeningReportsDir)) {
    const files = fs.readdirSync(hardeningReportsDir).filter(f => f.startsWith('notebooklm_mcp_readiness_recheck_')).sort();
    if (files.length > 0) {
      latestHardeningReport = files[files.length - 1];
    }
  }

  // Find latest auth readiness report
  let latestAuthReport = "None";
  const authReportsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_auth', 'reports');
  if (fs.existsSync(authReportsDir)) {
    const files = fs.readdirSync(authReportsDir).filter(f => f.startsWith('notebooklm_mcp_auth_readiness_')).sort();
    if (files.length > 0) {
      latestAuthReport = files[files.length - 1];
    }
  }

  console.log(`- **Manual Setup Runbook Exists:** ${hasRunbook}`);
  console.log(`- **Env Local Instructions Exist:** ${hasEnv}`);
  console.log(`- **Config Copy Guide Exists:** ${hasCopy}`);
  console.log(`- **Readiness Rerun Guide Exists:** ${hasRerun}`);
  console.log(`- **Rollback Checklist Exists:** ${hasRollback}`);
  console.log(`- **Latest Hardening Report:** ${latestHardeningReport}`);
  console.log(`- **Latest Auth Readiness Report:** ${latestAuthReport}`);

  let nextAction = "Compile the setup runbook using `npm run notebooklm-mcp-setup-guide -- \"runbook\"`.";
  if (hasRunbook !== 'No') {
    if (hasEnv === 'No') {
      nextAction = "Compile env instructions using `npm run notebooklm-mcp-setup-guide -- \"env-instructions\"`";
    } else if (hasCopy === 'No') {
      nextAction = "Compile config copy guide using `npm run notebooklm-mcp-setup-guide -- \"config-copy\"`";
    } else if (hasRerun === 'No') {
      nextAction = "Compile readiness rerun guide using `npm run notebooklm-mcp-setup-guide -- \"readiness-rerun\"`";
    } else if (hasRollback === 'No') {
      nextAction = "Compile rollback checklist using `npm run notebooklm-mcp-setup-guide -- \"rollback\"`";
    } else {
      nextAction = "Manual setup checklists generated. Verification runs pending operator credentials input.";
    }
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");

  logEvent('STATUS', `Status verified. hasRunbook=${hasRunbook !== 'No'}, hasEnv=${hasEnv !== 'No'}, hasCopy=${hasCopy !== 'No'}`);
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const command = rawInput.trim();

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-setup-guide-help.js');
    await import(helpPath);
    return;
  }

  try {
    switch (command) {
      case 'runbook':
        await handleRunbook();
        break;
      case 'env-instructions':
        await handleEnvInstructions();
        break;
      case 'config-copy':
        await handleConfigCopy();
        break;
      case 'readiness-rerun':
        await handleReadinessRerun();
        break;
      case 'rollback':
        await handleRollback();
        break;
      case 'all':
        await handleAll();
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-setup-guide-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Manual setup guide operation failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal setup guide runtime error: ${err}`);
  process.exit(1);
});
