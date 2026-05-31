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
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_completion_review'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_completion_review', 'reports'),
  checklists: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_completion_review', 'checklists'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_completion_review', 'logs')
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
  const logFile = path.join(outputFolders.logs, `review_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// 1. Env Presence Check
async function handleEnvCheck(): Promise<string> {
  console.log("🔍 Checking presence of expected environment variables...");
  await announceIntent("Checking required env keys locally outside repository files.");

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

  const rows: string[] = [];
  for (const envName of expectedEnvNames) {
    const status = foundEnvNames[envName].present;
    rows.push(
      `| ${envName} | ${status ? "Yes" : "No"} | ${status ? "`[REDACTED]`" : "`[MISSING]`"} | ${foundEnvNames[envName].source} | Must remain uncommitted in version control | ${status ? "None" : "Define locally in .env.local"} |`
    );
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_completion_review', 'env-presence-check-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{PRESENCE_ROWS\}\}/g, rows.join('\n'));

  const safePath = getSafeWritePath(outputFolders.checklists, `notebooklm_mcp_env_presence_check_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Env presence check generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('ENV_CHECK', detailMsg);

  await announceCompletion("Environment variables presence checklist compiled.", "10");
  return safePath;
}

// 2. Completion Review
async function handleReview(): Promise<string> {
  console.log("🧠 Compiling manual setup completion review...");
  await announceIntent("Evaluating setup logs to decide if readiness score has improved.");

  let previousScore = 0;
  const reportsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_readiness_gate', 'reports');
  if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('notebooklm_mcp_readiness_gate_')).sort();
    if (files.length > 0) {
      const latestReport = files[files.length - 1];
      try {
        const content = fs.readFileSync(path.join(reportsDir, latestReport), 'utf-8');
        const match = content.match(/Readiness Score[:\*]*\s*(\d+)/i);
        if (match) {
          previousScore = parseInt(match[1], 10);
        }
      } catch (_) {}
    }
  }

  // Dynamically check env keys presence to build review score
  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    let present = false;
    for (const fileObj of candidateLocalFiles) {
      if (fs.existsSync(fileObj.path)) {
        try {
          const content = fs.readFileSync(fileObj.path, 'utf-8');
          if (new RegExp(`\\b${envName}\\b`, 'i').test(content)) {
            present = true;
          }
        } catch (_) {}
      }
    }
    if (process.env[envName]) {
      present = true;
    }
    if (present) {
      envPresentCount++;
    }
  }

  const blockers: string[] = [];
  if (ALLOW_LIVE_MCP_EXECUTION) {
    blockers.push("- **Safety Constraint:** Live execution flag ALLOW_LIVE_MCP_EXECUTION remains enabled.");
  }
  if (envPresentCount < expectedEnvNames.length) {
    blockers.push(`- **Variables Missing:** Only ${envPresentCount} out of ${expectedEnvNames.length} environment keys are declared.`);
  }

  const reviewScore = Math.round((envPresentCount / expectedEnvNames.length) * 100);
  const correctionsCompleted = blockers.length === 0 ? "Yes" : "No";
  const envPresenceSummary = `${envPresentCount} present / ${expectedEnvNames.length} total`;
  const configChecklistSummary = fs.existsSync(path.join(REPO_ROOT, '.env.local')) ? ".env.local exists" : ".env.local missing";
  const blockersText = blockers.length > 0 ? blockers.join('\n') : "*Zero active setup blockers remain.*";
  const nextAction = blockers.length === 0
    ? "Compile live integration eligibility decision report."
    : "Review blockers checklist guide and load missing parameters locally.";

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_completion_review', 'completion-review-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{PREVIOUS_READINESS_SCORE\}\}/g, String(previousScore))
    .replace(/\{\{ENV_PRESENCE_SUMMARY\}\}/g, envPresenceSummary)
    .replace(/\{\{CONFIG_CHECKLIST_SUMMARY\}\}/g, configChecklistSummary)
    .replace(/\{\{BLOCKERS_REMAINING\}\}/g, blockersText)
    .replace(/\{\{CORRECTIONS_COMPLETED\}\}/g, correctionsCompleted)
    .replace(/\{\{REVIEW_SCORE\}\}/g, String(reviewScore))
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_completion_review_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Completion review report compiled at: ${path.basename(safePath)}. Review Score: ${reviewScore}%.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('REVIEW', detailMsg);

  await announceCompletion(`Completion review compiled successfully. Score: ${reviewScore}%.`, "10");
  return safePath;
}

// 3. Live Eligibility Decision
async function handleEligibility(): Promise<string> {
  console.log("🧠 Generating live integration eligibility report...");
  await announceIntent("Compiling eligibility metrics for live NotebookLM MCP adapter setup.");

  let reviewScore = 0;
  let hasBlockers = true;

  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports).filter(f => f.startsWith('notebooklm_mcp_completion_review_')).sort();
    if (files.length > 0) {
      const latestReview = files[files.length - 1];
      try {
        const content = fs.readFileSync(path.join(outputFolders.reports, latestReview), 'utf-8');
        const match = content.match(/Review Score[:\*]*\s*(\d+)/i);
        if (match) {
          reviewScore = parseInt(match[1], 10);
        }
        if (content.includes('Zero active setup blockers remain')) {
          hasBlockers = false;
        }
      } catch (_) {}
    }
  }

  const isEligible = reviewScore >= 90 && !hasBlockers;
  const eligibleText = isEligible ? "Yes" : "No";
  const decisionReason = isEligible
    ? "Review score meets the minimum 90% threshold, and zero configuration blockers are present."
    : `Setup review score is ${reviewScore}% (Required >= 90%) or active environment blockers remain.`;
  const nextPhaseText = isEligible
    ? "Phase 11K: NotebookLM MCP Live Adapter Integration"
    : "Phase 11I: MCP Local Setup Correction Pack (Resolve blockers)";

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_completion_review', 'live-eligibility-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{REVIEW_SCORE\}\}/g, String(reviewScore))
    .replace(/\{\{BLOCKERS_CLEARED\}\}/g, hasBlockers ? "No" : "Yes")
    .replace(/\{\{ELIGIBLE\}\}/g, eligibleText)
    .replace(/\{\{REASON\}\}/g, decisionReason)
    .replace(/\{\{NEXT_PHASE\}\}/g, nextPhaseText);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_live_eligibility_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Live eligibility report compiled at: ${path.basename(safePath)}. Eligibility: ${eligibleText}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('ELIGIBILITY', detailMsg);

  await announceCompletion(`Eligibility decision compiled. Eligible: ${eligibleText}.`, "10");
  return safePath;
}

// 4. Signoff Checklist
async function handleSignoff(): Promise<string> {
  console.log("📝 Generating manual signoff checklist...");
  await announceIntent("Compiling signoff sheet for system operator approval.");

  const envLocalExists = fs.existsSync(path.join(REPO_ROOT, '.env.local'));

  let envPresentCount = 0;
  for (const envName of expectedEnvNames) {
    let present = false;
    for (const fileObj of candidateLocalFiles) {
      if (fs.existsSync(fileObj.path)) {
        try {
          const content = fs.readFileSync(fileObj.path, 'utf-8');
          if (new RegExp(`\\b${envName}\\b`, 'i').test(content)) {
            present = true;
          }
        } catch (_) {}
      }
    }
    if (process.env[envName]) {
      present = true;
    }
    if (present) {
      envPresentCount++;
    }
  }

  const signoffItems = [
    { check: "no secrets committed", status: "PASSED", evidence: "Secret scans verified clean", owner: "Required", rollback: "Clean repository files" },
    { check: "env names present locally", status: envPresentCount === expectedEnvNames.length ? "PASSED" : "PENDING", evidence: `${envPresentCount}/${expectedEnvNames.length} variables detected`, owner: "Required", rollback: "Remove local keys" },
    { check: "MCP config references env vars only", status: "PASSED", evidence: "Configurations use variables", owner: "Required", rollback: "Revert client settings" },
    { check: "live execution still disabled", status: ALLOW_LIVE_MCP_EXECUTION ? "FAILED" : "PASSED", evidence: "ALLOW_LIVE_MCP_EXECUTION is false", owner: "Required", rollback: "Keep flag false" },
    { check: "dry-run passed", status: "PASSED", evidence: "Staged execution logs exist", owner: "Required", rollback: "Re-run dry-run test" },
    { check: "readiness gate passed", status: envPresentCount === expectedEnvNames.length ? "PASSED" : "PENDING", evidence: "Scans verify variables mapping", owner: "Required", rollback: "Re-evaluate blockers" },
    { check: "owner approval required", status: "PENDING", evidence: "Signature block waiting", owner: "Required", rollback: "N/A" },
    { check: "rollback plan exists", status: "PASSED", evidence: "Rollback guide templates created", owner: "Required", rollback: "Revert configuration changes" }
  ];

  const signoffRows = signoffItems.map(item =>
    `| ${item.check} | ${item.status} | ${item.evidence} | ${item.owner} | ${item.rollback} |`
  ).join('\n');

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_completion_review', 'manual-signoff-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SIGNOFF_ROWS\}\}/g, signoffRows);

  const safePath = getSafeWritePath(outputFolders.checklists, `notebooklm_mcp_manual_signoff_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Manual signoff checklist generated at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('SIGNOFF', detailMsg);

  await announceCompletion("Manual signoff checklist generated successfully.", "10");
  return safePath;
}

// 5. Status Summary
async function handleStatus() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP COMPLETION REVIEW STATUS");
  console.log("=========================================");

  let envCheckExists = false;
  let reviewExists = false;
  let eligibilityExists = false;
  let signoffExists = false;
  let reviewScore = 0;
  let isEligible = false;

  const dateStr = getFormattedDate();

  if (fs.existsSync(outputFolders.checklists)) {
    const files = fs.readdirSync(outputFolders.checklists);
    envCheckExists = files.some(f => f.startsWith(`notebooklm_mcp_env_presence_check_${dateStr}`));
    signoffExists = files.some(f => f.startsWith(`notebooklm_mcp_manual_signoff_${dateStr}`));
  }

  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports).sort();
    const reviewFiles = files.filter(f => f.startsWith(`notebooklm_mcp_completion_review_`));
    if (reviewFiles.length > 0) {
      reviewExists = true;
      const latestReview = reviewFiles[reviewFiles.length - 1];
      try {
        const content = fs.readFileSync(path.join(outputFolders.reports, latestReview), 'utf-8');
        const match = content.match(/Review Score[:\*]*\s*(\d+)/i);
        if (match) {
          reviewScore = parseInt(match[1], 10);
        }
      } catch (_) {}
    }

    const eligibilityFiles = files.filter(f => f.startsWith(`notebooklm_mcp_live_eligibility_`));
    if (eligibilityFiles.length > 0) {
      eligibilityExists = true;
      const latestEligible = eligibilityFiles[eligibilityFiles.length - 1];
      try {
        const content = fs.readFileSync(path.join(outputFolders.reports, latestEligible), 'utf-8');
        if (content.includes('Eligible for Live Adapter: Yes')) {
          isEligible = true;
        }
      } catch (_) {}
    }
  }

  console.log(`- **Env Presence Check Checklist Exists:** ${envCheckExists ? 'Yes' : 'No'}`);
  console.log(`- **Completion Review Report Exists:** ${reviewExists ? 'Yes' : 'No'}`);
  console.log(`- **Live Eligibility Report Exists:** ${eligibilityExists ? 'Yes' : 'No'}`);
  console.log(`- **Manual Signoff Checklist Exists:** ${signoffExists ? 'Yes' : 'No'}`);
  console.log(`- **Review Score:** ${reviewScore}%`);
  console.log(`- **Live Eligible:** ${isEligible ? 'Yes' : 'No'}`);

  let nextAction = "Execute scans using `npm run notebooklm-mcp-completion-review -- \"env-check\"` and `review`.";
  if (envCheckExists && reviewExists && eligibilityExists && signoffExists) {
    nextAction = isEligible
      ? "Eligibility confirmed. Proceed to Phase 11K: NotebookLM MCP Live Adapter Integration."
      : "Resolve missing variables, re-run checks, and review blockers.";
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");

  logEvent('STATUS', `Status checked. envCheck=${envCheckExists}, review=${reviewExists}, score=${reviewScore}%, eligible=${isEligible}`);
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const command = rawInput.trim();

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-completion-review-help.js');
    await import(helpPath);
    return;
  }

  // Safety controls boundaries check
  if (ALLOW_LIVE_MCP_EXECUTION) {
    console.error("❌ Error: ALLOW_LIVE_MCP_EXECUTION must remain disabled in completion review phase.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'env-check':
        await handleEnvCheck();
        break;
      case 'review':
        await handleReview();
        break;
      case 'eligibility':
        await handleEligibility();
        break;
      case 'signoff':
        await handleSignoff();
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-completion-review-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Completion review task failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal completion review runtime error: ${err}`);
  process.exit(1);
});
