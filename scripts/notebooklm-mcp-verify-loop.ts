// scripts/notebooklm-mcp-verify-loop.ts
// Handles the NotebookLM MCP local setup verification loop commands.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
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
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_verification_loop'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_verification_loop', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_verification_loop', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_verification_loop')
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
  const logFile = path.join(outputFolders.logs, `verify_loop_log_${dateStr}.md`);
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

function findLatestFile(dir: string, prefix: string): string {
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.md')).sort();
  if (files.length === 0) return '';
  return path.join(dir, files[files.length - 1]);
}

function parseReadinessScore(content: string): number {
  const match = content.match(/Readiness Score[:\*]*\s*(\d+)%/i) || content.match(/Review Score[:\*]*\s*(\d+)%/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

function parseLiveEligible(content: string): boolean {
  const match = content.match(/Live Eligible[:\*]*\s*(yes|no|true|false)/i);
  if (match) {
    const val = match[1].toLowerCase();
    return val === 'yes' || val === 'true';
  }
  return false;
}

// 1. chain
async function handleChain(): Promise<string> {
  console.log("⛓️ Initiating setup verification loop command chain...");
  await announceIntent("Running setup readiness checks through verification chain.");

  const commandsToRun = [
    "npm run notebooklm-mcp-auth -- \"scan\"",
    "npm run notebooklm-mcp-auth -- \"status\"",
    "npm run notebooklm-mcp-harden -- \"readiness-recheck\"",
    "npm run notebooklm-mcp-readiness-gate -- \"scan\"",
    "npm run notebooklm-mcp-readiness-gate -- \"decision\"",
    "npm run notebooklm-mcp-completion-review -- \"env-check\"",
    "npm run notebooklm-mcp-completion-review -- \"review\"",
    "npm run notebooklm-mcp-completion-review -- \"eligibility\"",
    "npm run notebooklm-mcp-completion-review -- \"status\"",
    "npm run notebooklm-mcp-fix-cycle -- \"decision-summary\""
  ];

  const passed: string[] = [];
  const failed: string[] = [];
  const rows: string[] = [];

  for (let i = 0; i < commandsToRun.length; i++) {
    const cmd = commandsToRun[i];
    console.log(`[${i + 1}/${commandsToRun.length}] Running: ${cmd}`);
    try {
      execSync(cmd, { cwd: REPO_ROOT, stdio: 'ignore' });
      passed.push(cmd);
      rows.push(`| Step ${i + 1} | \`${cmd}\` | Verification check | Pass | Run successfully |`);
    } catch (err: any) {
      failed.push(cmd);
      rows.push(`| Step ${i + 1} | \`${cmd}\` | Verification check | Fail | Exit code non-zero |`);
    }
  }

  // Calculate score dynamically
  const presence = getEnvPresence();
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    if (presence[envName].present) {
      envPresentCount++;
    }
  }
  const score = Math.round((envPresentCount / expectedEnvNames.length) * 100);
  const isEligible = score >= 90 && !ALLOW_LIVE_MCP_EXECUTION;

  const missingKeys = expectedEnvNames.filter(k => !presence[k].present);
  const blockers: string[] = [];
  if (missingKeys.length > 0) {
    blockers.push(`- **Environment Variables Missing:** ${missingKeys.map(k => `\`${k}\``).join(', ')}`);
  }
  if (ALLOW_LIVE_MCP_EXECUTION) {
    blockers.push("- **Safety Gate Toggle Error:** ALLOW_LIVE_MCP_EXECUTION must be false.");
  }
  const blockersText = blockers.length > 0 ? blockers.join('\n') : "*Zero active setup blockers remain.*";
  const nextAction = isEligible ? "Proceed to Phase 11M Live MCP Integration." : "Complete local-only setup and rerun verification loop.";

  // Write chain report
  const chainTemplatePath = path.join(outputFolders.templates, 'verification-chain-template.md');
  if (!fs.existsSync(chainTemplatePath)) {
    console.error(`❌ Template not found at: ${chainTemplatePath}`);
    process.exit(1);
  }
  let chainTemplate = fs.readFileSync(chainTemplatePath, 'utf-8');
  chainTemplate = chainTemplate
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{READINESS_SCORE\}\}/g, `${score}%`)
    .replace(/\{\{LIVE_ELIGIBLE\}\}/g, isEligible ? "Yes" : "No")
    .replace(/\{\{VERIFICATION_CHAIN_ROWS\}\}/g, rows.join('\n'))
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const chainReportPath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_verification_chain_${getFormattedDate()}`, '.md');
  fs.writeFileSync(chainReportPath, chainTemplate);

  // Write general loop report
  const loopReportTemplatePath = path.join(outputFolders.templates, 'verification-loop-report-template.md');
  if (fs.existsSync(loopReportTemplatePath)) {
    let loopTemplate = fs.readFileSync(loopReportTemplatePath, 'utf-8');
    loopTemplate = loopTemplate
      .replace(/\{\{DATE\}\}/g, getFormattedDate())
      .replace(/\{\{READINESS_SCORE\}\}/g, `${score}%`)
      .replace(/\{\{LIVE_ELIGIBLE\}\}/g, isEligible ? "Yes" : "No")
      .replace(/\{\{COMMANDS_RUN\}\}/g, commandsToRun.map(c => `- \`${c}\``).join('\n'))
      .replace(/\{\{PASSED_STEPS\}\}/g, passed.length > 0 ? passed.map(c => `- \`${c}\``).join('\n') : "*None*")
      .replace(/\{\{FAILED_STEPS\}\}/g, failed.length > 0 ? failed.map(c => `- \`${c}\``).join('\n') : "*None*")
      .replace(/\{\{BLOCKERS\}\}/g, blockersText)
      .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

    const loopReportPath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_verification_loop_report_${getFormattedDate()}`, '.md');
    fs.writeFileSync(loopReportPath, loopTemplate);
  }

  const detailMsg = `Verification chain report generated at: ${path.basename(chainReportPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CHAIN', detailMsg);

  await announceCompletion("Verification chain check completed.", "10");
  return chainReportPath;
}

// 2. final-check
async function handleFinalCheck(): Promise<string> {
  console.log("🧠 Executing final eligibility check...");
  await announceIntent("Verifying setup reports to compile final eligibility status.");

  // Check env presence to calculate score dynamically
  const presence = getEnvPresence();
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    if (presence[envName].present) {
      envPresentCount++;
    }
  }
  const dynamicScore = Math.round((envPresentCount / expectedEnvNames.length) * 100);
  const dynamicEligible = dynamicScore >= 90 && !ALLOW_LIVE_MCP_EXECUTION;

  // Let's decide eligibility
  let decision = "";
  let reason = "";
  let nextPhase = "";

  if (dynamicScore >= 90 && dynamicEligible) {
    decision = "eligible for Phase 11M Live MCP Query Adapter With Manual Enable";
    reason = `Readiness score of ${dynamicScore}% meets the required threshold (>= 90%) and safety gates are locked.`;
    nextPhase = "Phase 11M: Live MCP Query Adapter With Manual Enable";
  } else {
    decision = "not eligible";
    reason = `Readiness score of ${dynamicScore}% does not meet the minimum requirement (>= 90%) or safety locks are active.`;
    nextPhase = "complete local-only setup and rerun verification loop";
  }

  const templatePath = path.join(outputFolders.templates, 'final-eligibility-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{READINESS_SCORE\}\}/g, `${dynamicScore}%`)
    .replace(/\{\{LIVE_ELIGIBLE\}\}/g, dynamicEligible ? "Yes" : "No")
    .replace(/\{\{DECISION\}\}/g, decision)
    .replace(/\{\{REASON\}\}/g, reason)
    .replace(/\{\{NEXT_PHASE\}\}/g, nextPhase);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_final_eligibility_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Final eligibility report generated at: ${path.basename(safePath)}. Eligible: ${dynamicEligible ? "Yes" : "No"}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('FINAL_CHECK', detailMsg);

  await announceCompletion(`Final eligibility report compiled. Eligible: ${dynamicEligible ? "Yes" : "No"}.`, "10");
  return safePath;
}

// 3. status
async function handleStatus() {
  const chainReportFile = findLatestFile(outputFolders.reports, 'notebooklm_mcp_verification_chain_');
  const finalEligibilityFile = findLatestFile(outputFolders.reports, 'notebooklm_mcp_final_eligibility_');

  const presence = getEnvPresence();
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    if (presence[envName].present) {
      envPresentCount++;
    }
  }
  const score = Math.round((envPresentCount / expectedEnvNames.length) * 100);
  const isEligible = score >= 90 && !ALLOW_LIVE_MCP_EXECUTION;

  const missingKeys = expectedEnvNames.filter(k => !presence[k].present);
  const blockers: string[] = [];
  if (missingKeys.length > 0) {
    blockers.push(`Missing keys: ${missingKeys.join(', ')}`);
  }
  if (ALLOW_LIVE_MCP_EXECUTION) {
    blockers.push("ALLOW_LIVE_MCP_EXECUTION is true (safety toggle error)");
  }
  const blockersText = blockers.length > 0 ? blockers.join(', ') : "None";

  console.log("=========================================");
  console.log("🔄 NOTEBOOKLM MCP VERIFICATION LOOP STATUS");
  console.log("=========================================");
  console.log(`- Latest verification chain report: ${chainReportFile ? path.basename(chainReportFile) : "None (Run npm run notebooklm-mcp-verify-loop -- chain)"}`);
  console.log(`- Latest final eligibility report:  ${finalEligibilityFile ? path.basename(finalEligibilityFile) : "None (Run npm run notebooklm-mcp-verify-loop -- final-check)"}`);
  console.log(`- Current readiness score:          ${score}%`);
  console.log(`- Live eligible:                    ${isEligible ? "Yes" : "No"}`);
  console.log(`- Blockers:                         ${blockersText}`);
  console.log(`- Next recommended phase:           ${isEligible ? "Phase 11M: Live MCP Query Adapter" : "Phase 11K/11L: Fix Cycle & Verification Loop"}`);
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
    case "chain":
      await handleChain();
      break;
    case "final-check":
      await handleFinalCheck();
      break;
    case "status":
      await handleStatus();
      break;
    case "help":
    default:
      console.log("Usage: npm run notebooklm-mcp-verify-loop -- <chain | final-check | status | help>");
      break;
  }
}

run().catch(err => {
  console.error("Critical execution error:", err);
  process.exit(1);
});
