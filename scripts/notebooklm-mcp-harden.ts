import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  HARDENING_ONLY,
  ALLOW_REAL_SECRET_WRITES,
  ALLOW_OAUTH_FLOW,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_LIVE_MCP_EXECUTION,
  ALLOW_DIRECT_CONFIG_OVERWRITE,
  REQUIRE_STAGED_CONFIG,
  REQUIRE_MANUAL_COPY,
  requiredEnvNames,
  STAGED_ENV_EXAMPLE_PATH,
  STAGED_MCP_CONFIG_PATH,
  HARDENING_REPORT_DIR,
  HARDENING_LOG_DIR,
  STAGED_CONFIG_DIR,
  HARDENING_ROOT_DIR,
  REPO_ROOT
} from '../config/notebooklm-mcp-hardening.js';
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
  if (!fs.existsSync(HARDENING_LOG_DIR)) {
    fs.mkdirSync(HARDENING_LOG_DIR, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(HARDENING_LOG_DIR, `hardening_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// 1. Create Env Template
async function handleCreateEnvTemplate() {
  console.log("📝 Generating staged environment template...");
  await announceIntent("Generating staged environment variable templates for NotebookLM MCP.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_hardening', 'env-example-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let templateContent = fs.readFileSync(templatePath, 'utf-8');
  // Write to outputs/notebooklm_bridge/mcp_hardening/staged_config/notebooklm_mcp_env_example_YYYY-MM-DD.md
  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(STAGED_CONFIG_DIR, `notebooklm_mcp_env_example_${dateStr}`, '.md');
  fs.writeFileSync(safePath, templateContent);

  const detailMsg = `Staged environment template generated at ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CREATE_ENV_TEMPLATE', detailMsg);

  await announceCompletion("NotebookLM MCP environment variable template staged successfully.", "10");
}

// 2. Create MCP Template
async function handleCreateMcpTemplate() {
  console.log("📝 Generating staged MCP configuration JSON template...");
  await announceIntent("Compiling staged configuration payload template for Claude/Cursor sidecar deployment.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_hardening', 'mcp-config-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let templateContent = fs.readFileSync(templatePath, 'utf-8');
  // Write to outputs/notebooklm_bridge/mcp_hardening/staged_config/notebooklm_mcp_config_template_YYYY-MM-DD.md
  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(STAGED_CONFIG_DIR, `notebooklm_mcp_config_template_${dateStr}`, '.md');
  fs.writeFileSync(safePath, templateContent);

  const detailMsg = `Staged MCP configuration template generated at ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CREATE_MCP_TEMPLATE', detailMsg);

  await announceCompletion("NotebookLM MCP config template generated and staged successfully.", "10");
}

// Helper to recursively list files to scan
function getFilesToScan(dir: string, filesList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Enforce Ignored Folders rules
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === '.git' ||
      entry.name === 'outputs'
    ) {
      continue;
    }
    if (entry.isDirectory()) {
      getFilesToScan(fullPath, filesList);
    } else {
      // Scan only text-based files for API keys
      const ext = path.extname(entry.name);
      if (['.ts', '.js', '.json', '.yml', '.yaml', '.md', '.env', '.local', '.txt'].includes(ext)) {
        filesList.push(fullPath);
      }
    }
  }
  return filesList;
}

// 3. Secret Hygiene Scan
async function handleSecretHygiene() {
  console.log("🔍 Running secret hygiene sweep...");
  await announceIntent("Scanning local codebase for accidental plain-text secrets and credential patterns.");

  const files = getFilesToScan(REPO_ROOT);
  const suspiciousFindings: { file: string; patternType: string }[] = [];

  // Patterns to inspect:
  // - GCP API Keys: AIzaSy... (39 chars)
  const gcpApiKeyRegex = /AIzaSy[A-Za-z0-9_-]{33}/;
  // - Private Keys / Secret assignments with values:
  const credentialAssignmentRegex = /(private_key|client_secret|client_id|password|api_key)\s*[:=]\s*["'][A-Za-z0-9_\-\.\/]{12,}["']/i;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for GCP API keys
      if (gcpApiKeyRegex.test(content)) {
        suspiciousFindings.push({
          file: path.relative(REPO_ROOT, file),
          patternType: "Potential GCP API Key (AIzaSy prefix matched)"
        });
      }
      
      // Check for credential assignment with value
      const match = content.match(credentialAssignmentRegex);
      if (match) {
        // Exempt configurations and templates that only specify placeholder markers
        const val = match[0];
        if (!val.includes('placeholder') && !val.includes('your-') && !val.includes('{{') && !val.includes('path/to/')) {
          suspiciousFindings.push({
            file: path.relative(REPO_ROOT, file),
            patternType: `Potential plaintext credential in assignment: "${match[1]}"`
          });
        }
      }
    } catch (_) {}
  }

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_hardening', 'secret-hygiene-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  
  const redactedFindingsList = suspiciousFindings.length > 0
    ? suspiciousFindings.map(f => `- **File:** \`${f.file}\` | **Pattern Type:** ${f.patternType} | **Value:** \`[REDACTED]\``).join('\n')
    : "*No suspicious plain-text secrets detected in the scanned paths.*";
    
  const riskLevel = suspiciousFindings.length > 0 ? "Medium/High (Credentials check flagged issues)" : "Low (Zero leaks detected)";
  const nextAction = suspiciousFindings.length > 0
    ? "Clean or remove plaintext credential references in the flagged files immediately."
    : "Proceed to readiness recheck stage.";

  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{FILES_SCANNED_COUNT\}\}/g, String(files.length))
    .replace(/\{\{SUSPICIOUS_PATTERNS_COUNT\}\}/g, String(suspiciousFindings.length))
    .replace(/\{\{RISK_LEVEL\}\}/g, riskLevel)
    .replace(/\{\{REDACTED_FINDINGS_LIST\}\}/g, redactedFindingsList)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(HARDENING_REPORT_DIR, `notebooklm_mcp_secret_hygiene_${dateStr}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Secret hygiene scan complete. Files scanned: ${files.length}. Suspicious findings: ${suspiciousFindings.length}. Report written to ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('SECRET_HYGIENE', detailMsg);

  await announceCompletion(`Secret hygiene audit finished. Findings count: ${suspiciousFindings.length}.`, "10");
}

// 4. Readiness Recheck
async function handleReadinessRecheck() {
  console.log("🔄 Running configuration readiness recheck...");
  await announceIntent("Compiling authentication validation findings with local hardening status.");

  // Read latest Phase 11E auth readiness report
  let previousReadinessScore = 0;
  const authReportDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_auth', 'reports');
  if (fs.existsSync(authReportDir)) {
    const files = fs.readdirSync(authReportDir).filter(f => f.startsWith('notebooklm_mcp_auth_readiness_')).sort();
    if (files.length > 0) {
      const latestAuthReport = files[files.length - 1];
      try {
        const content = fs.readFileSync(path.join(authReportDir, latestAuthReport), 'utf-8');
        const match = content.match(/Readiness Score[:\*]*\s*(\d+)/i);
        if (match) {
          previousReadinessScore = parseInt(match[1], 10);
        }
      } catch (_) {}
    }
  }

  // Check staged configuration files presence
  let hasStagedEnv = false;
  let hasStagedConfig = false;
  let hasHygieneReport = false;

  if (fs.existsSync(STAGED_CONFIG_DIR)) {
    const files = fs.readdirSync(STAGED_CONFIG_DIR);
    hasStagedEnv = files.some(f => f.startsWith('notebooklm_mcp_env_example_'));
    hasStagedConfig = files.some(f => f.startsWith('notebooklm_mcp_config_template_'));
  }

  if (fs.existsSync(HARDENING_REPORT_DIR)) {
    const files = fs.readdirSync(HARDENING_REPORT_DIR);
    hasHygieneReport = files.some(f => f.startsWith('notebooklm_mcp_secret_hygiene_'));
  }

  // Blocker compilation
  const blockers: string[] = [];
  if (!hasStagedEnv) blockers.push("- **MISSING:** Staged environment template has not been generated.");
  if (!hasStagedConfig) blockers.push("- **MISSING:** Staged MCP configuration template has not been generated.");
  if (!hasHygieneReport) blockers.push("- **MISSING:** Secret hygiene scan report has not been compiled.");
  if (ALLOW_LIVE_MCP_EXECUTION) blockers.push("- **POLICY VIOLATION:** ALLOW_LIVE_MCP_EXECUTION is enabled.");
  if (previousReadinessScore < 100) blockers.push("- **AUTH INCOMPLETE:** Base environment variables keys are missing or unconfigured.");

  const blockersText = blockers.length > 0 ? blockers.join('\n') : "None. Hardening readiness verified.";
  const nextAction = blockers.length > 0
    ? "Resolve outstanding blockers, generate templates, and verify credentials offline."
    : "Readiness verified. All configuration safety checks completed.";

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_hardening', 'readiness-recheck-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{PREVIOUS_READINESS_SCORE\}\}/g, String(previousReadinessScore))
    .replace(/\{\{STAGED_ENV_TEMPLATE_EXISTS\}\}/g, hasStagedEnv ? "Yes" : "No")
    .replace(/\{\{STAGED_MCP_CONFIG_EXISTS\}\}/g, hasStagedConfig ? "Yes" : "No")
    .replace(/\{\{SECRET_HYGIENE_REPORT_EXISTS\}\}/g, hasHygieneReport ? "Yes" : "No")
    .replace(/\{\{LIVE_EXECUTION_ENABLED\}\}/g, ALLOW_LIVE_MCP_EXECUTION ? "Yes" : "No")
    .replace(/\{\{BLOCKER_LIST\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const dateStr = getFormattedDate();
  const safePath = getSafeWritePath(HARDENING_REPORT_DIR, `notebooklm_mcp_readiness_recheck_${dateStr}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Readiness recheck report generated at ${path.relative(REPO_ROOT, safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('READINESS_RECHECK', detailMsg);

  await announceCompletion("NotebookLM MCP readiness recheck compiled.", "10");
}

// 5. Status Output
async function handleStatus() {
  console.log("=========================================");
  console.log("🔒 NOTEBOOKLM MCP HARDENING STATUS SUMMARY");
  console.log("=========================================");

  let hasStagedEnv = "No";
  let hasStagedConfig = "No";
  let latestHygieneReport = "None";
  let latestRecheckReport = "None";

  if (fs.existsSync(STAGED_CONFIG_DIR)) {
    const files = fs.readdirSync(STAGED_CONFIG_DIR);
    const envFiles = files.filter(f => f.startsWith('notebooklm_mcp_env_example_')).sort();
    if (envFiles.length > 0) hasStagedEnv = `Yes (${envFiles[envFiles.length - 1]})`;
    
    const configFiles = files.filter(f => f.startsWith('notebooklm_mcp_config_template_')).sort();
    if (configFiles.length > 0) hasStagedConfig = `Yes (${configFiles[configFiles.length - 1]})`;
  }

  if (fs.existsSync(HARDENING_REPORT_DIR)) {
    const files = fs.readdirSync(HARDENING_REPORT_DIR);
    const hygieneFiles = files.filter(f => f.startsWith('notebooklm_mcp_secret_hygiene_')).sort();
    if (hygieneFiles.length > 0) latestHygieneReport = hygieneFiles[hygieneFiles.length - 1];

    const recheckFiles = files.filter(f => f.startsWith('notebooklm_mcp_readiness_recheck_')).sort();
    if (recheckFiles.length > 0) latestRecheckReport = recheckFiles[recheckFiles.length - 1];
  }

  console.log(`- **Env Template Exists:** ${hasStagedEnv}`);
  console.log(`- **MCP Config Template Exists:** ${hasStagedConfig}`);
  console.log(`- **Latest Secret Hygiene Report:** ${latestHygieneReport}`);
  console.log(`- **Latest Readiness Recheck Report:** ${latestRecheckReport}`);
  console.log(`- **Live Execution Enabled:** ${ALLOW_LIVE_MCP_EXECUTION ? 'Yes' : 'No'}`);

  let nextAction = "Execute env template generation using `npm run notebooklm-mcp-harden -- \"create-env-template\"`.";
  if (hasStagedEnv !== 'No') {
    if (hasStagedConfig === 'No') {
      nextAction = "Execute MCP config template generation using `npm run notebooklm-mcp-harden -- \"create-mcp-template\"`";
    } else if (latestHygieneReport === 'None') {
      nextAction = "Run secret hygiene scan using `npm run notebooklm-mcp-harden -- \"secret-hygiene\"`";
    } else if (latestRecheckReport === 'None') {
      nextAction = "Run readiness recheck report using `npm run notebooklm-mcp-harden -- \"readiness-recheck\"`";
    } else {
      nextAction = "Hardening completed. Ready for manual credential parameters integration.";
    }
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");

  logEvent('STATUS', `Status checked. hasStagedEnv=${hasStagedEnv !== 'No'}, hasStagedConfig=${hasStagedConfig !== 'No'}, latestHygieneReport=${latestHygieneReport}`);
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const command = rawInput.trim();

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-harden-help.js');
    await import(helpPath);
    return;
  }

  // Hard safety boundaries checks
  if (ALLOW_REAL_SECRET_WRITES) {
    console.error("❌ Error: ALLOW_REAL_SECRET_WRITES must remain disabled in hardening phase.");
    process.exit(1);
  }
  if (ALLOW_LIVE_MCP_EXECUTION) {
    console.error("❌ Error: ALLOW_LIVE_MCP_EXECUTION must remain disabled in hardening phase.");
    process.exit(1);
  }
  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Error: ALLOW_EXTERNAL_API_CALLS must remain disabled in hardening phase.");
    process.exit(1);
  }
  if (ALLOW_OAUTH_FLOW) {
    console.error("❌ Error: ALLOW_OAUTH_FLOW must remain disabled in hardening phase.");
    process.exit(1);
  }
  if (ALLOW_DIRECT_CONFIG_OVERWRITE) {
    console.error("❌ Error: ALLOW_DIRECT_CONFIG_OVERWRITE must remain disabled in hardening phase.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'create-env-template':
        await handleCreateEnvTemplate();
        break;
      case 'create-mcp-template':
        await handleCreateMcpTemplate();
        break;
      case 'secret-hygiene':
        await handleSecretHygiene();
        break;
      case 'readiness-recheck':
        await handleReadinessRecheck();
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-harden-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Hardening operation failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal hardening runtime error: ${err}`);
  process.exit(1);
});
