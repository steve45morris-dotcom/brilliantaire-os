import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  READINESS_GATE_ONLY,
  ALLOW_LIVE_MCP_EXECUTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_OAUTH_FLOW,
  ALLOW_SECRET_PRINTING,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_ENV_LOCAL_ONLY,
  REQUIRE_MANUAL_REVIEW,
  MINIMUM_LIVE_INTEGRATION_SCORE,
  expectedEnvNames,
  candidateLocalFiles,
  outputFolders,
  REPO_ROOT
} from '../config/notebooklm-mcp-readiness-gate.js';
import { announceIntent, announceCompletion } from './vnp.js';

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
  if (!fs.existsSync(outputFolders.logs)) {
    fs.mkdirSync(outputFolders.logs, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(outputFolders.logs, `gate_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// 1. Run Setup Scan
async function handleScan() {
  console.log("🔍 Scanning local environment and configurations for gate review...");
  await announceIntent("Inspecting required env names and local config sidecar parameters.");

  const filesChecked: string[] = [];
  const foundEnvNames: string[] = [];
  let localSetupExists = false;
  let mcpConfigRefExists = false;

  // Inspect config profiles for variable names (Do not print values!)
  for (const fileObj of candidateLocalFiles) {
    const filePath = fileObj.path;
    const resolvedPath = path.relative(REPO_ROOT, filePath).startsWith('..') ? filePath : path.relative(REPO_ROOT, filePath);

    if (fileObj.type === 'file') {
      if (!fs.existsSync(filePath)) {
        filesChecked.push(`- [Not Found] ${resolvedPath}`);
        continue;
      }
      filesChecked.push(`- [Checked File] ${resolvedPath}`);
      if (fileObj.name === '.env.local' || fileObj.name === '.mcp.local.json') {
        localSetupExists = true;
      }
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
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
    } else if (fileObj.type === 'directory') {
      if (!fs.existsSync(filePath)) {
        filesChecked.push(`- [Not Found] Directory: ${resolvedPath}`);
        continue;
      }
      filesChecked.push(`- [Checked Directory] ${resolvedPath}`);
      try {
        const files = fs.readdirSync(filePath);
        for (const file of files) {
          const subPath = path.join(filePath, file);
          const subResolvedPath = path.relative(REPO_ROOT, subPath).startsWith('..') ? subPath : path.relative(REPO_ROOT, subPath);
          filesChecked.push(`  - [Checked Subfile] ${subResolvedPath}`);
          const content = fs.readFileSync(subPath, 'utf-8');
          if (content.includes('notebooklm-mcp')) {
            mcpConfigRefExists = true;
          }
          for (const envName of expectedEnvNames) {
            const regex = new RegExp(`\\b${envName}\\b`, 'i');
            if (regex.test(content) && !foundEnvNames.includes(envName)) {
              foundEnvNames.push(envName);
            }
          }
        }
      } catch (_) {}
    }
  }

  // Also check active process environment variables
  for (const envName of expectedEnvNames) {
    if (process.env[envName] && !foundEnvNames.includes(envName)) {
      foundEnvNames.push(envName);
    }
  }

  // Calculate readiness score
  const scoreMultiplier = 100 / expectedEnvNames.length;
  let score = Math.round(foundEnvNames.length * scoreMultiplier);
  score = Math.min(100, score);

  // Check blockers
  const blockers: string[] = [];
  if (ALLOW_LIVE_MCP_EXECUTION) {
    blockers.push("- **POLICY VIOLATION:** Live execution adapter is enabled (`ALLOW_LIVE_MCP_EXECUTION = true`).");
  }
  if (!localSetupExists) {
    blockers.push("- **MISSING:** No local-only setup configuration files (`.env.local` or `.mcp.local.json`) detected.");
  }
  if (!mcpConfigRefExists) {
    blockers.push("- **MISSING:** No NotebookLM MCP client configuration mappings found in Cursor/Claude config files.");
  }
  for (const envName of expectedEnvNames) {
    if (!foundEnvNames.includes(envName)) {
      blockers.push(`- **MISSING ENV KEY:** The environment key \`${envName}\` is not mapped in any local configuration file.`);
    }
  }

  const blockersText = blockers.length > 0 ? blockers.join('\n') : "*Zero active blocker flags detected.*";
  const passStatus = (score >= MINIMUM_LIVE_INTEGRATION_SCORE && blockers.length === 0) ? "PASS" : "FAIL";
  const nextAction = passStatus === "PASS"
    ? "Readiness threshold met. Run live integration decision compiler."
    : "Resolve outstanding blockers, map env parameters locally, and run re-scan.";

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_readiness_gate', 'readiness-gate-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{FILES_CHECKED\}\}/g, filesChecked.join('\n'))
    .replace(/\{\{ENV_NAMES_PRESENT\}\}/g, foundEnvNames.length > 0 ? foundEnvNames.map(e => `\`${e}\``).join(', ') : "None")
    .replace(/\{\{LOCAL_SETUP_FILES\}\}/g, localSetupExists ? "Yes (.env.local or .mcp.local.json found)" : "No")
    .replace(/\{\{MCP_CONFIG_REFERENCES\}\}/g, mcpConfigRefExists ? "Yes (notebooklm-mcp configured)" : "No")
    .replace(/\{\{LIVE_EXECUTION_DISABLED\}\}/g, ALLOW_LIVE_MCP_EXECUTION ? "No (Violation!)" : "Yes (Active)")
    .replace(/\{\{READINESS_SCORE\}\}/g, String(score))
    .replace(/\{\{STATUS\}\}/g, passStatus)
    .replace(/\{\{BLOCKER_LIST\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_readiness_gate_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Readiness gate scan finished. Report: ${path.basename(safePath)}. Readiness Score: ${score}%. Status: ${passStatus}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('SCAN', detailMsg);

  await announceCompletion(`Readiness gate scan finished with status ${passStatus}. Score: ${score}%.`, "10");
}

// 2. Decision Logic
async function handleDecision() {
  console.log("🧠 Checking live integration decision matrix...");
  await announceIntent("Evaluating setup criteria to determine live adapter integration eligibility.");

  let readinessScore = 0;
  let hasBlockers = true;
  let reportExists = false;

  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports).filter(f => f.startsWith('notebooklm_mcp_readiness_gate_')).sort();
    if (files.length > 0) {
      reportExists = true;
      const latestReport = files[files.length - 1];
      try {
        const content = fs.readFileSync(path.join(outputFolders.reports, latestReport), 'utf-8');
        const scoreMatch = content.match(/Readiness Score[:\*]*\s*(\d+)/i);
        if (scoreMatch) {
          readinessScore = parseInt(scoreMatch[1], 10);
        }
        if (content.includes('Zero active blocker flags detected')) {
          hasBlockers = false;
        }
      } catch (_) {}
    }
  }

  const blockersCount = hasBlockers ? 1 : 0;
  const isEligible = (readinessScore >= MINIMUM_LIVE_INTEGRATION_SCORE && !hasBlockers);
  const decision = isEligible ? "ELIGIBLE for manual-enable live adapter preparation" : "NOT ELIGIBLE";
  const reason = isEligible
    ? "All environment keys found, client configuration mapping detected, and zero safety blockers active."
    : `Readiness score is ${readinessScore}% (Required >= 90%) or active blockers remain.`;
  const nextPhase = isEligible
    ? "Phase 11I: NotebookLM MCP Live Adapter Integration"
    : "Phase 11G: NotebookLM MCP Manual Setup Instructions (re-run validation)";

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_readiness_gate', 'live-integration-decision-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{READINESS_SCORE\}\}/g, String(readinessScore))
    .replace(/\{\{BLOCKER_COUNT\}\}/g, String(blockersCount))
    .replace(/\{\{DECISION\}\}/g, decision)
    .replace(/\{\{DECISION_REASON\}\}/g, reason)
    .replace(/\{\{NEXT_PHASE\}\}/g, nextPhase);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_live_integration_decision_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Decision report compiled. Path: ${path.basename(safePath)}. Eligibility: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('DECISION', detailMsg);

  await announceCompletion(`Decision matrix evaluated. Eligibility: ${isEligible ? 'Eligible' : 'Not Eligible'}.`, "10");
}

// 3. Compile Blockers Report
async function handleBlockers() {
  console.log("📝 Generating outstanding blockers checklist...");
  await announceIntent("Compiling active blocker variables, missing config files, and remediation commands.");

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

  // Also check active process env
  for (const envName of expectedEnvNames) {
    if (process.env[envName] && !foundEnvNames.includes(envName)) {
      foundEnvNames.push(envName);
    }
  }

  const blockersRows: string[] = [];

  if (ALLOW_LIVE_MCP_EXECUTION) {
    blockersRows.push(`| Live Execution Policy | ALLOW_LIVE_MCP_EXECUTION is true | High | Set ALLOW_LIVE_MCP_EXECUTION=false in config | npm run notebooklm-mcp-readiness-gate -- "scan" |`);
  }
  if (!localSetupExists) {
    blockersRows.push(`| Local Setup Files | Missing .env.local or .mcp.local.json | Medium | Create local configuration file | npm run notebooklm-mcp-setup-guide -- "env-instructions" |`);
  }
  if (!mcpConfigRefExists) {
    blockersRows.push(`| MCP Config References | notebooklm-mcp not configured in Cursor/Claude | Medium | Copy configuration block to client settings | npm run notebooklm-mcp-setup-guide -- "config-copy" |`);
  }
  for (const envName of expectedEnvNames) {
    if (!foundEnvNames.includes(envName)) {
      blockersRows.push(`| Missing Env Key | ${envName} not found in configurations | High | Define ${envName} key-value pair in .env.local | npm run notebooklm-mcp-readiness-gate -- "scan" |`);
    }
  }

  const tableRowsText = blockersRows.length > 0
    ? blockersRows.join('\n')
    : "| None | No blockers detected | Low | No action required | N/A |";

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_readiness_gate', 'blocker-list-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{BLOCKERS_TABLE_ROWS\}\}/g, tableRowsText);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_blockers_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Blockers report written to ${path.basename(safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('BLOCKERS', detailMsg);

  await announceCompletion("Blockers report compiled successfully.", "10");
}

// 4. Status Output
async function handleStatus() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP READINESS GATE STATUS");
  console.log("=========================================");

  let gateReport = "None";
  let decisionReport = "None";
  let blockerReport = "None";
  let score = 0;
  let reportExists = false;
  let isEligibleText = "No";

  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports).sort();

    const gateFiles = files.filter(f => f.startsWith('notebooklm_mcp_readiness_gate_'));
    if (gateFiles.length > 0) {
      reportExists = true;
      gateReport = gateFiles[gateFiles.length - 1];
      try {
        const content = fs.readFileSync(path.join(outputFolders.reports, gateReport), 'utf-8');
        const match = content.match(/Readiness Score[:\*]*\s*(\d+)/i);
        if (match) {
          score = parseInt(match[1], 10);
        }
      } catch (_) {}
    }

    const decisionFiles = files.filter(f => f.startsWith('notebooklm_mcp_live_integration_decision_'));
    if (decisionFiles.length > 0) {
      decisionReport = decisionFiles[decisionFiles.length - 1];
      try {
        const content = fs.readFileSync(path.join(outputFolders.reports, decisionReport), 'utf-8');
        if (content.includes('Decision: ELIGIBLE')) {
          isEligibleText = "Yes";
        }
      } catch (_) {}
    }

    const blockerFiles = files.filter(f => f.startsWith('notebooklm_mcp_blockers_'));
    if (blockerFiles.length > 0) blockerReport = blockerFiles[blockerFiles.length - 1];
  }

  console.log(`- **Latest Readiness Gate Report:** ${reportExists ? `Yes (${gateReport})` : 'No'}`);
  console.log(`- **Latest Decision Report:** ${decisionReport !== 'None' ? `Yes (${decisionReport})` : 'No'}`);
  console.log(`- **Latest Blocker Report:** ${blockerReport !== 'None' ? `Yes (${blockerReport})` : 'No'}`);
  console.log(`- **Readiness Score:** ${score}%`);
  console.log(`- **Eligible for Live Adapter:** ${isEligibleText}`);

  let nextAction = "Run setup validation scan using `npm run notebooklm-mcp-readiness-gate -- \"scan\"`.";
  if (reportExists) {
    if (decisionReport === 'None') {
      nextAction = "Generate integration decision using `npm run notebooklm-mcp-readiness-gate -- \"decision\"`";
    } else if (blockerReport === 'None') {
      nextAction = "Generate blocker matrix report using `npm run notebooklm-mcp-readiness-gate -- \"blockers\"`";
    } else {
      nextAction = isEligibleText === "Yes"
        ? "Gate passed. System is eligible for Phase 11I: NotebookLM MCP Live Adapter Integration."
        : "Gate failed. Solve active blockers and rerun scan.";
    }
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");

  logEvent('STATUS', `Status checked. reportExists=${reportExists}, score=${score}, eligible=${isEligibleText}`);
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const command = rawInput.trim();

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-readiness-gate-help.js');
    await import(helpPath);
    return;
  }

  // Hard safety boundaries checks
  if (ALLOW_LIVE_MCP_EXECUTION) {
    console.error("❌ Error: ALLOW_LIVE_MCP_EXECUTION must remain disabled in readiness gate phase.");
    process.exit(1);
  }
  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Error: ALLOW_EXTERNAL_API_CALLS must remain disabled in readiness gate phase.");
    process.exit(1);
  }
  if (ALLOW_OAUTH_FLOW) {
    console.error("❌ Error: ALLOW_OAUTH_FLOW must remain disabled in readiness gate phase.");
    process.exit(1);
  }
  if (ALLOW_SECRET_PRINTING) {
    console.error("❌ Error: ALLOW_SECRET_PRINTING must remain disabled in readiness gate phase.");
    process.exit(1);
  }
  if (ALLOW_OBSIDIAN_WRITE) {
    console.error("❌ Error: ALLOW_OBSIDIAN_WRITE must remain disabled in readiness gate phase.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'scan':
        await handleScan();
        break;
      case 'decision':
        await handleDecision();
        break;
      case 'blockers':
        await handleBlockers();
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-readiness-gate-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Readiness gate operation failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal readiness gate runtime error: ${err}`);
  process.exit(1);
});
