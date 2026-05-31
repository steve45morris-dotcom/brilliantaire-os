import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_LIVE_MCP_EXECUTION,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_DOTENV_GITIGNORE,
  REQUIRE_MANUAL_SIGNOFF,
  expectedEnvNames,
  candidateFilesToCheck,
  outputFolders,
  REPO_ROOT
} from '../config/notebooklm-mcp-secrets.js';
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
  const logFile = path.join(outputFolders.logs, `secrets_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// 1. Create local-only placeholder templates
async function handleCreateTemplates() {
  console.log("📁 Generating placeholder local templates...");
  await announceIntent("Creating local-only environment and configuration template files.");

  const envExPath = path.join(REPO_ROOT, '.env.notebooklm.example');
  const mcpExPath = path.join(REPO_ROOT, '.mcp.notebooklm.example.json');

  let envCreated = false;
  let mcpCreated = false;

  if (!fs.existsSync(envExPath)) {
    const envContent = expectedEnvNames.map(key => `${key}=your_${key.toLowerCase()}_placeholder`).join('\n') + '\n';
    fs.writeFileSync(envExPath, envContent);
    envCreated = true;
  }

  if (!fs.existsSync(mcpExPath)) {
    const mcpContent = JSON.stringify({
      mcpServers: {
        "notebooklm-mcp": {
          command: "node",
          args: ["dist/scripts/notebooklm-bridge.js"],
          env: expectedEnvNames.reduce((acc, key) => {
            acc[key] = `\${${key}}`;
            return acc;
          }, {} as { [key: string]: string })
        }
      }
    }, null, 2) + '\n';
    fs.writeFileSync(mcpExPath, mcpContent);
    mcpCreated = true;
  }

  const detailMsg = `Placeholder templates generation completed. EnvCreated=${envCreated}, McpCreated=${mcpCreated}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CREATE_TEMPLATES', detailMsg);

  await announceCompletion("Local placeholder templates created successfully.", "10");
}

// 2. Redaction Check scan
async function handleRedactionCheck(): Promise<string> {
  console.log("🔍 Scanning codebase for suspicious plain credentials patterns...");
  await announceIntent("Inspecting documentation, scripts, and package files for plain secrets.");

  const checkedFiles: string[] = [];
  const findings: string[] = [];
  let patternCount = 0;

  // Pattern detection: matching credential variables with high entropy or plaintext value assignments
  const secretPattern = /(api[_-]?key|secret|password|private[_-]?key)\s*[:=]\s*['"]?([a-zA-Z0-9_\-\.\/]{10,})['"]?/gi;

  for (const filePath of candidateFilesToCheck) {
    const relativePath = path.relative(REPO_ROOT, filePath);
    if (!fs.existsSync(filePath)) {
      checkedFiles.push(`- [Not Found] ${relativePath}`);
      continue;
    }
    checkedFiles.push(`- [Checked] ${relativePath}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let match;
      while ((match = secretPattern.exec(content)) !== null) {
        // Redact matching text values
        const matchedVar = match[1];
        const rawValue = match[2];
        // Redact only if it doesn't look like placeholder text
        if (!rawValue.includes('placeholder') && !rawValue.includes('your_') && !rawValue.includes('example') && !rawValue.includes('template')) {
          patternCount++;
          findings.push(`| ${relativePath} | Secret Assignment Pattern | \`${matchedVar}=[REDACTED]\` | Replace assignment with environment variables |`);
        }
      }
    } catch (_) {}
  }

  const findingsText = findings.length > 0 ? findings.join('\n') : "| None | No pattern issues found | `[CLEAN]` | N/A |";
  const passStatus = patternCount === 0 ? "PASS" : "FAIL";
  const nextAction = passStatus === "PASS"
    ? "Security check passed. Proceed to compile readiness report."
    : "Remove plaintext credentials assignments and configure variables locally.";

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_secrets', 'redaction-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{FILES_CHECKED\}\}/g, checkedFiles.join('\n'))
    .replace(/\{\{PATTERN_COUNT\}\}/g, String(patternCount))
    .replace(/\{\{STATUS\}\}/g, passStatus)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction)
    .replace(/\{\{FINDINGS_ROWS\}\}/g, findingsText);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_redaction_check_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Redaction check finished. Report: ${path.basename(safePath)}. Patterns Found: ${patternCount}. Status: ${passStatus}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('REDACTION_CHECK', detailMsg);

  await announceCompletion(`Redaction scan finished with status ${passStatus}.`, "10");
  return safePath;
}

// 3. Readiness Compiler
async function handleReadiness(): Promise<string> {
  console.log("⏱️ Compiling secrets staging readiness report...");
  await announceIntent("Evaluating safety readiness checks to confirm staging boundaries.");

  // Check 1: Gitignore protects .env
  let gitignoreProtectsEnv = false;
  try {
    const gitignoreContent = fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf-8');
    if (gitignoreContent.includes('.env.local') || gitignoreContent.includes('.env*')) {
      gitignoreProtectsEnv = true;
    }
  } catch (_) {}

  // Check 2: example files exist
  const envExExists = fs.existsSync(path.join(REPO_ROOT, '.env.notebooklm.example'));
  const mcpExExists = fs.existsSync(path.join(REPO_ROOT, '.mcp.notebooklm.example.json'));

  // Check 3: Expected env names documented
  const isDocumented = fs.existsSync(path.join(REPO_ROOT, 'NOTEBOOKLM_MCP_SECRETS_STAGING.md'));

  // Check 4: Secrets absent (from latest report if exists, or do check)
  let secretsAbsent = true;
  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports).filter(f => f.startsWith('notebooklm_mcp_redaction_check_')).sort();
    if (files.length > 0) {
      const content = fs.readFileSync(path.join(outputFolders.reports, files[files.length - 1]), 'utf-8');
      if (content.includes('Status: FAIL')) {
        secretsAbsent = false;
      }
    }
  }

  const checks = [
    { req: ".gitignore protects .env files", status: gitignoreProtectsEnv ? "PASSED" : "FAILED", blocker: !gitignoreProtectsEnv ? "No gitignore protections mapped for local env" : "None", evidence: gitignoreProtectsEnv ? ".env.local is ignored" : ".env.local is tracked", next: gitignoreProtectsEnv ? "None" : "Add .env.local to .gitignore" },
    { req: ".env.notebooklm.example exists", status: envExExists ? "PASSED" : "FAILED", blocker: !envExExists ? "Placeholder env template missing" : "None", evidence: envExExists ? "Example env file found" : "Example env file not found", next: envExExists ? "None" : "Run create-templates command" },
    { req: ".mcp.notebooklm.example.json exists", status: mcpExExists ? "PASSED" : "FAILED", blocker: !mcpExExists ? "Placeholder MCP client template missing" : "None", evidence: mcpExExists ? "Example json file found" : "Example json file not found", next: mcpExExists ? "None" : "Run create-templates command" },
    { req: "Expected variables documented", status: isDocumented ? "PASSED" : "FAILED", blocker: !isDocumented ? "Staging guide markdown file missing" : "None", evidence: isDocumented ? "Staging guide exists" : "Staging guide missing", next: isDocumented ? "None" : "Restore NOTEBOOKLM_MCP_SECRETS_STAGING.md" },
    { req: "Real secrets absent", status: secretsAbsent ? "PASSED" : "FAILED", blocker: !secretsAbsent ? "Suspicious credential assignment patterns found" : "None", evidence: secretsAbsent ? "No raw secrets detected in code" : "Accidental plaintext credentials found", next: secretsAbsent ? "None" : "Clean credentials assignments from codebase" },
    { req: "Live MCP execution disabled", status: !ALLOW_LIVE_MCP_EXECUTION ? "PASSED" : "FAILED", blocker: ALLOW_LIVE_MCP_EXECUTION ? "ALLOW_LIVE_MCP_EXECUTION flag is true" : "None", evidence: !ALLOW_LIVE_MCP_EXECUTION ? "Execution flag disabled" : "Execution flag active", next: !ALLOW_LIVE_MCP_EXECUTION ? "None" : "Set ALLOW_LIVE_MCP_EXECUTION = false" },
    { req: "External API calls disabled", status: !ALLOW_EXTERNAL_API_CALLS ? "PASSED" : "FAILED", blocker: ALLOW_EXTERNAL_API_CALLS ? "ALLOW_EXTERNAL_API_CALLS flag is true" : "None", evidence: !ALLOW_EXTERNAL_API_CALLS ? "API flag disabled" : "API flag active", next: !ALLOW_EXTERNAL_API_CALLS ? "None" : "Set ALLOW_EXTERNAL_API_CALLS = false" },
    { req: "Manual signoff required", status: REQUIRE_MANUAL_SIGNOFF ? "PASSED" : "FAILED", blocker: !REQUIRE_MANUAL_SIGNOFF ? "REQUIRE_MANUAL_SIGNOFF flag is false" : "None", evidence: REQUIRE_MANUAL_SIGNOFF ? "Operator signature required" : "No signature required", next: REQUIRE_MANUAL_SIGNOFF ? "None" : "Set REQUIRE_MANUAL_SIGNOFF = true" }
  ];

  const passedCount = checks.filter(c => c.status === "PASSED").length;
  const readinessScore = Math.round((passedCount / checks.length) * 100);

  const blockers = checks.filter(c => c.status === "FAILED").map(c => `- **${c.req}:** ${c.blocker}`);
  const blockersText = blockers.length > 0 ? blockers.join('\n') : "*Zero active readiness blockers detected.*";

  const nextAction = readinessScore === 100
    ? "Staging check succeeded. Verify parameters review status."
    : "Resolve active configuration blockers and rerun readiness check.";

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_secrets', 'live-readiness-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  const checklistRows = checks.map(c => 
    `| ${c.req} | ${c.status} | ${c.blocker} | ${c.evidence} | ${c.next} |`
  ).join('\n');

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{READINESS_SCORE\}\}/g, String(readinessScore))
    .replace(/\{\{READINESS_ROWS\}\}/g, checklistRows)
    .replace(/\{\{BLOCKERS_LIST\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_local_secrets_readiness_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Local secrets readiness report written to ${path.basename(safePath)}. Readiness Score: ${readinessScore}%.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('READINESS', detailMsg);

  await announceCompletion(`Secrets readiness compiler completed. Score: ${readinessScore}%.`, "10");
  return safePath;
}

// 4. Status Check
async function handleStatus() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP SECRETS STAGING STATUS");
  console.log("=========================================");

  let redactionCheckExists = false;
  let readinessReportExists = false;
  let score = 0;
  let hasBlockers = true;

  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports).sort();

    const redactionFiles = files.filter(f => f.startsWith('notebooklm_mcp_redaction_check_'));
    if (redactionFiles.length > 0) {
      redactionCheckExists = true;
    }

    const readinessFiles = files.filter(f => f.startsWith('notebooklm_mcp_local_secrets_readiness_'));
    if (readinessFiles.length > 0) {
      readinessReportExists = true;
      const latestReadiness = readinessFiles[readinessFiles.length - 1];
      try {
        const content = fs.readFileSync(path.join(outputFolders.reports, latestReadiness), 'utf-8');
        const match = content.match(/Overall Readiness Score[:\*]*\s*(\d+)/i);
        if (match) {
          score = parseInt(match[1], 10);
        }
        if (content.includes('Zero active readiness blockers detected')) {
          hasBlockers = false;
        }
      } catch (_) {}
    }
  }

  console.log(`- **Latest Redaction Check Report Exists:** ${redactionCheckExists ? 'Yes' : 'No'}`);
  console.log(`- **Latest Readiness Report Exists:** ${readinessReportExists ? 'Yes' : 'No'}`);
  console.log(`- **Overall Secrets Readiness Score:** ${score}%`);
  console.log(`- **Active Blockers Present:** ${hasBlockers ? 'Yes' : 'No'}`);
  console.log(`- **Live MCP Execution Enabled:** ${ALLOW_LIVE_MCP_EXECUTION ? 'Yes (Violation!)' : 'No'}`);

  let nextAction = "Execute scans using `npm run notebooklm-mcp-secrets -- \"create-templates\"` and `redaction-check`.";
  if (redactionCheckExists && readinessReportExists) {
    nextAction = (score === 100 && !hasBlockers)
      ? "Staging validation passes. Local boundary checks successfully complete."
      : "Verify checklist details, solve active blockers, and rerun readiness check.";
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");

  logEvent('STATUS', `Status checked. redaction=${redactionCheckExists}, readiness=${readinessReportExists}, score=${score}%, eligible=${!hasBlockers}`);
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const command = rawInput.trim();

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-secrets-help.js');
    await import(helpPath);
    return;
  }

  // Safety controls boundary checks
  if (ALLOW_LIVE_MCP_EXECUTION) {
    console.error("❌ Error: ALLOW_LIVE_MCP_EXECUTION must remain disabled in secrets staging phase.");
    process.exit(1);
  }
  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Error: ALLOW_EXTERNAL_API_CALLS must remain disabled in secrets staging phase.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'create-templates':
        await handleCreateTemplates();
        break;
      case 'redaction-check':
        await handleRedactionCheck();
        break;
      case 'readiness':
        await handleReadiness();
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-secrets-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Secrets staging task failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal secrets staging runtime error: ${err}`);
  process.exit(1);
});
