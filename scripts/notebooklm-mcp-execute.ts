import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EXECUTION_MODE,
  ALLOW_LIVE_MCP_EXECUTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_BROWSER_AUTOMATION,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_MANUAL_ENABLE,
  REQUIRE_CONFIRM_FLAG_FOR_LIVE,
  MAX_QUERY_LENGTH,
  MCP_PAYLOAD_DIR,
  MCP_DRY_RUN_DIR,
  MCP_EXECUTION_LOG_DIR,
  allowedQueryTypes,
  REPO_ROOT
} from '../config/notebooklm-mcp-execution.js';
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

function logExecution(command: string, queryType: string, status: string, notes: string) {
  const logDir = MCP_EXECUTION_LOG_DIR;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `execution_log_${dateStr}.md`);

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_execution', 'execution-log-template.md');
  let entry = `- [${new Date().toISOString()}] **${command}** | Type: \`${queryType}\` | Mode: \`dry-run\` | Status: \`${status}\` | Notes: ${notes}\n`;

  if (fs.existsSync(templatePath)) {
    try {
      const template = fs.readFileSync(templatePath, 'utf-8');
      entry = template
        .replace(/\{\{TIMESTAMP\}\}/g, new Date().toISOString())
        .replace(/\{\{COMMAND\}\}/g, command)
        .replace(/\{\{QUERY_TYPE\}\}/g, queryType)
        .replace(/\{\{MODE\}\}/g, 'dry-run')
        .replace(/\{\{STATUS\}\}/g, status)
        .replace(/\{\{NOTES\}\}/g, notes);
    } catch (_) {}
  }

  fs.appendFileSync(logFile, entry);
}

// 1. Prepare Query Payload
async function handlePrepareQuery(queryType: string) {
  if (!allowedQueryTypes.includes(queryType)) {
    console.error(`❌ Error: Unknown query type "${queryType}". Allowed types: ${allowedQueryTypes.join(', ')}`);
    process.exit(1);
  }

  console.log(`📡 Preparing query payload for type: "${queryType}"...`);
  await announceIntent(`Preparing query payload packet for type ${queryType}.`);

  // Scan latest NotebookLM bridge source pack
  let latestSourcePack = 'Staged source pack placeholder (Manual Upload Required)';
  const sourcePackDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'source_packs');
  if (fs.existsSync(sourcePackDir)) {
    const files = fs.readdirSync(sourcePackDir)
      .filter(f => f.startsWith('notebooklm_bridge_source_pack_') && f.endsWith('.md'))
      .sort();
    if (files.length > 0) {
      latestSourcePack = path.join(sourcePackDir, files[files.length - 1]);
    }
  }

  // Pre-configured questions
  let preparedQuestion = 'Provide a structured executive summary of all files compiled in the source pack.';
  if (queryType === 'workflow-extraction') {
    preparedQuestion = 'Extract step-by-step workflow instructions and tool descriptions mentioned in the sources.';
  } else if (queryType === 'weak-claims-review') {
    preparedQuestion = 'Identify assumptions, limitations, potential security risks, or weak claims made across the documents.';
  } else if (queryType === 'os-module-suggestions') {
    preparedQuestion = 'Propose files or modules in config/ or scripts/ to update with these learnings.';
  } else if (queryType === 'prompt-pack-ideas') {
    preparedQuestion = 'Draft reusable prompt templates or prompt vault expansions based on the provided notes.';
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_execution', 'query-payload-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{QUERY_TYPE\}\}/g, queryType)
    .replace(/\{\{SOURCE_PACK_PATH\}\}/g, path.relative(REPO_ROOT, latestSourcePack))
    .replace(/\{\{SAFETY_MODE\}\}/g, 'dry-run')
    .replace(/\{\{LIVE_EXECUTION_ENABLED\}\}/g, 'false')
    .replace(/\{\{PREPARED_QUESTION\}\}/g, preparedQuestion)
    .replace(/\{\{EXPECTED_FORMAT\}\}/g, 'Section-based markdown bullets with descriptive headers.')
    .replace(/\{\{CITATION_REQUEST\}\}/g, 'Please link all claims directly to source filenames and line numbers where possible.');

  if (template.length > MAX_QUERY_LENGTH) {
    console.warn(`⚠️ Warning: Prepared query length (${template.length}) exceeds maximum limit (${MAX_QUERY_LENGTH}). Truncating...`);
    template = template.substring(0, MAX_QUERY_LENGTH);
  }

  const safeType = queryType.replace(/-/g, '_');
  const safePath = getSafeWritePath(MCP_PAYLOAD_DIR, `notebooklm_payload_${safeType}_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Prepared payload written to ${path.basename(safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logExecution('prepare-query', queryType, 'Success', `Staged payload: ${path.basename(safePath)}`);

  await announceCompletion(`Payload created successfully. Staged at outputs/notebooklm_bridge/mcp_execution/payloads/`, "10");
}

// 2. Simulate Dry-Run Execution
async function handleDryRun(queryType: string) {
  if (!allowedQueryTypes.includes(queryType)) {
    console.error(`❌ Error: Unknown query type "${queryType}". Allowed types: ${allowedQueryTypes.join(', ')}`);
    process.exit(1);
  }

  console.log(`⚡ Running dry-run simulation for type: "${queryType}"...`);
  await announceIntent(`Simulating dry-run query dispatch for type ${queryType}.`);

  const safeType = queryType.replace(/-/g, '_');
  let latestPayload = '';
  if (fs.existsSync(MCP_PAYLOAD_DIR)) {
    const files = fs.readdirSync(MCP_PAYLOAD_DIR)
      .filter(f => f.startsWith(`notebooklm_payload_${safeType}_`) && f.endsWith('.md'))
      .sort();
    if (files.length > 0) {
      latestPayload = path.join(MCP_PAYLOAD_DIR, files[files.length - 1]);
    }
  }

  if (!latestPayload) {
    console.error(`❌ Error: No prepared payload found for type: "${queryType}". Please run prepare-query first.`);
    logExecution('dry-run', queryType, 'Failed', `Missing payload file for type: ${queryType}`);
    process.exit(1);
  }

  // Retrieve connector detection confidence score
  let connectorConfidence = '0';
  const detectionReportsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_detection', 'reports');
  if (fs.existsSync(detectionReportsDir)) {
    const files = fs.readdirSync(detectionReportsDir)
      .filter(f => f.startsWith('notebooklm_mcp_detection_') && f.endsWith('.md'))
      .sort();
    if (files.length > 0) {
      const latestReport = path.join(detectionReportsDir, files[files.length - 1]);
      try {
        const reportContent = fs.readFileSync(latestReport, 'utf-8');
        const match = reportContent.match(/Confidence Score[:\*]*\s*(\d+)/i);
        if (match) {
          connectorConfidence = match[1];
        }
      } catch (_) {}
    }
  }

  const blockedOps = [
    "- Direct connection to NotebookLM connector API.",
    "- External socket requests to Google API gateways.",
    "- Local execution process spawning for live MCP servers.",
    "- Direct write file commits to active Obsidian notes directory."
  ].join('\n');

  const simulatedResult = [
    "- Dry-run validation check passed.",
    `- Prepared question size: ${fs.readFileSync(latestPayload, 'utf-8').length} chars.`,
    "- Simulated status code: 200 (Mock Dry-Run Success).",
    `- Simulated answer: "Staged mock response for query type: ${queryType}. Live execution is disabled."`
  ].join('\n');

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_execution', 'dry-run-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DRY_RUN_DATE\}\}/g, getFormattedDate())
    .replace(/\{\{QUERY_TYPE\}\}/g, queryType)
    .replace(/\{\{PAYLOAD_CHECKED\}\}/g, path.relative(REPO_ROOT, latestPayload))
    .replace(/\{\{CONNECTOR_CONFIDENCE\}\}/g, connectorConfidence)
    .replace(/\{\{EXECUTION_MODE\}\}/g, EXECUTION_MODE)
    .replace(/\{\{LIVE_MCP_ALLOWED\}\}/g, String(ALLOW_LIVE_MCP_EXECUTION))
    .replace(/\{\{EXTERNAL_API_ALLOWED\}\}/g, String(ALLOW_EXTERNAL_API_CALLS))
    .replace(/\{\{BROWSER_ALLOWED\}\}/g, String(ALLOW_BROWSER_AUTOMATION))
    .replace(/\{\{OBSIDIAN_WRITE_ALLOWED\}\}/g, String(ALLOW_OBSIDIAN_WRITE))
    .replace(/\{\{BLOCKED_OPERATIONS\}\}/g, blockedOps)
    .replace(/\{\{SIMULATED_RESULT\}\}/g, simulatedResult)
    .replace(/\{\{NEXT_ACTION\}\}/g, 'Review the prepared payload and wait for Phase 11E live connector authorization validation.');

  const safeReportPath = getSafeWritePath(MCP_DRY_RUN_DIR, `notebooklm_dry_run_${safeType}_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safeReportPath, template);

  const detailMsg = `Dry-run simulation completed. Report written to ${path.basename(safeReportPath)}.`;
  console.log(`✅ ${detailMsg}`);
  logExecution('dry-run', queryType, 'Success', `Staged dry-run report: ${path.basename(safeReportPath)}`);

  await announceCompletion(`Dry-run report generated successfully. Staged at outputs/notebooklm_bridge/mcp_execution/dry_runs/`, "10");
}

// 3. Status Output
async function handleStatus() {
  console.log("=========================================");
  console.log("⚙️ NOTEBOOKLM MCP EXECUTION STATUS");
  console.log("=========================================");

  let payloadCount = 0;
  let dryRunCount = 0;
  let latestPayloadFile = 'None';
  let latestDryRunFile = 'None';

  if (fs.existsSync(MCP_PAYLOAD_DIR)) {
    const files = fs.readdirSync(MCP_PAYLOAD_DIR).filter(f => f.endsWith('.md')).sort();
    payloadCount = files.length;
    if (payloadCount > 0) latestPayloadFile = files[files.length - 1];
  }

  if (fs.existsSync(MCP_DRY_RUN_DIR)) {
    const files = fs.readdirSync(MCP_DRY_RUN_DIR).filter(f => f.endsWith('.md')).sort();
    dryRunCount = files.length;
    if (dryRunCount > 0) latestDryRunFile = files[files.length - 1];
  }

  console.log(`- **Staged Query Payloads:** ${payloadCount} (${latestPayloadFile})`);
  console.log(`- **Simulated Dry Runs:** ${dryRunCount} (${latestDryRunFile})`);
  console.log(`- **Live Execution Enabled:** ${ALLOW_LIVE_MCP_EXECUTION ? 'Yes' : 'No'}`);
  console.log(`- **External API Calls Enabled:** ${ALLOW_EXTERNAL_API_CALLS ? 'Yes' : 'No'}`);
  console.log(`- **Browser Automation Enabled:** ${ALLOW_BROWSER_AUTOMATION ? 'Yes' : 'No'}`);
  console.log(`- **Obsidian Write Enabled:** ${ALLOW_OBSIDIAN_WRITE ? 'Yes' : 'No'}`);

  let nextAction = 'Prepare a query payload using `npm run notebooklm-mcp-execute -- "prepare-query source-summary"`';
  if (payloadCount > dryRunCount) {
    nextAction = 'Simulate execution using `npm run notebooklm-mcp-execute -- "dry-run source-summary"`';
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");

  logExecution('status', 'None', 'Success', `Status checked. Payloads=${payloadCount}, DryRuns=${dryRunCount}`);
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const tokens = rawInput.trim().split(/\s+/);
  const command = tokens[0];
  const subArg = tokens.slice(1).join(' ');

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-execute-help.js');
    await import(helpPath);
    return;
  }

  // Hard safety boundaries checks
  if (ALLOW_LIVE_MCP_EXECUTION) {
    console.error("❌ Error: ALLOW_LIVE_MCP_EXECUTION must remain disabled in dry-run phase.");
    process.exit(1);
  }
  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Error: ALLOW_EXTERNAL_API_CALLS must remain disabled in dry-run phase.");
    process.exit(1);
  }
  if (ALLOW_BROWSER_AUTOMATION) {
    console.error("❌ Error: ALLOW_BROWSER_AUTOMATION must remain disabled in dry-run phase.");
    process.exit(1);
  }
  if (ALLOW_OBSIDIAN_WRITE) {
    console.error("❌ Error: ALLOW_OBSIDIAN_WRITE must remain disabled in dry-run phase.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'prepare-query':
        await handlePrepareQuery(subArg);
        break;
      case 'dry-run':
        await handleDryRun(subArg);
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-execute-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Operation failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal runtime error: ${err}`);
  process.exit(1);
});
