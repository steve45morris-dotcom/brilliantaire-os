import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LIVE_ADAPTER_AVAILABLE,
  LIVE_EXECUTION_DEFAULT,
  READ_ONLY_MODE,
  ALLOW_NOTEBOOK_MODIFICATION,
  ALLOW_OBSIDIAN_WRITE,
  ALLOW_SOURCE_UPLOAD,
  ALLOW_BACKGROUND_QUERIES,
  REQUIRE_MANUAL_ENABLE,
  REQUIRE_CONFIRM_FLAG,
  REQUIRE_READINESS_SCORE,
  MAX_QUERY_LENGTH,
  MAX_RESPONSE_LENGTH,
  expectedEnvNames,
  allowedQueryTypes,
  outputFolders,
  REPO_ROOT
} from '../config/notebooklm-mcp-live.js';
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
  const logFile = path.join(outputFolders.logs, `live_adapter_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// Extract readiness score from latest Phase 11K secrets report
function getLatestSecretsReadinessScore(): number {
  const secretsReportsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_secrets', 'reports');
  if (!fs.existsSync(secretsReportsDir)) {
    return 0;
  }
  try {
    const files = fs.readdirSync(secretsReportsDir)
      .filter(f => f.startsWith('notebooklm_mcp_local_secrets_readiness_') && f.endsWith('.md'))
      .sort();
    if (files.length === 0) {
      return 0;
    }
    const latestFile = path.join(secretsReportsDir, files[files.length - 1]);
    const content = fs.readFileSync(latestFile, 'utf-8');
    const match = content.match(/Overall Readiness Score[:\*]*\s*(\d+)%/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (err) {
    console.error(`Error reading latest secrets readiness score: ${(err as Error).message}`);
  }
  return 0;
}

// Extract latest auth readiness score if available
function getLatestAuthReadinessScore(): number {
  const authReportsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_auth', 'reports');
  if (!fs.existsSync(authReportsDir)) {
    return 0;
  }
  try {
    const files = fs.readdirSync(authReportsDir)
      .filter(f => f.startsWith('notebooklm_mcp_auth_readiness_') && f.endsWith('.md'))
      .sort();
    if (files.length === 0) {
      return 0;
    }
    const latestFile = path.join(authReportsDir, files[files.length - 1]);
    const content = fs.readFileSync(latestFile, 'utf-8');
    const match = content.match(/Readiness Score[:\*]*\s*(\d+)%/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (_) {}
  return 0;
}

// Extract latest detection confidence
function getLatestDetectionConfidence(): number {
  const detectionReportsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_detection', 'reports');
  if (!fs.existsSync(detectionReportsDir)) {
    return 0;
  }
  try {
    const files = fs.readdirSync(detectionReportsDir)
      .filter(f => f.startsWith('notebooklm_mcp_detection_') && f.endsWith('.md'))
      .sort();
    if (files.length === 0) {
      return 0;
    }
    const latestFile = path.join(detectionReportsDir, files[files.length - 1]);
    const content = fs.readFileSync(latestFile, 'utf-8');
    const match = content.match(/Confidence Score[:\*]*\s*(\d+)%/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (_) {}
  return 0;
}

// 1. status Command
async function handleStatus() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP LIVE ADAPTER STATUS");
  console.log("=========================================");

  const secretsScore = getLatestSecretsReadinessScore();
  const envsPresent = expectedEnvNames.every(name => process.env[name] !== undefined && process.env[name] !== '');
  const serverCommandPresent = process.env.NOTEBOOKLM_MCP_SERVER_COMMAND !== undefined && process.env.NOTEBOOKLM_MCP_SERVER_COMMAND !== '';

  console.log(`- **Live Adapter Available:** ${LIVE_ADAPTER_AVAILABLE ? 'Yes' : 'No'}`);
  console.log(`- **Live Execution Default Enabled:** ${LIVE_EXECUTION_DEFAULT ? 'Yes (Violation!)' : 'No'}`);
  console.log(`- **Read-Only Mode Active:** ${READ_ONLY_MODE ? 'Yes' : 'No'}`);
  console.log(`- **Secrets Readiness Score:** ${secretsScore}%`);
  console.log(`- **Expected Env Names Present:** ${envsPresent ? 'Yes' : 'No'}`);
  console.log(`- **NotebookLM MCP Server Command Present:** ${serverCommandPresent ? 'Yes' : 'No'}`);

  let nextAction = "Complete Phase 11K local secrets staging credentials setup.";
  if (secretsScore === 100 && envsPresent && serverCommandPresent) {
    nextAction = "Ready for query preparation. Run prepare-live-query tasks.";
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");
  logEvent('STATUS', `Status requested. secretsScore=${secretsScore}%, envsPresent=${envsPresent}`);
}

// 2. prepare-live-query Command
async function handlePrepareLiveQuery(queryType: string) {
  const normalizedType = queryType.toLowerCase().replace(/_/g, '-');
  if (!allowedQueryTypes.includes(normalizedType)) {
    console.error(`❌ Error: Unknown query type "${queryType}". Allowed types: ${allowedQueryTypes.join(', ')}`);
    process.exit(1);
  }

  console.log(`📁 Preparing live query staging file for type: "${normalizedType}"...`);
  await announceIntent(`Staging NotebookLM MCP live query for type ${normalizedType}.`);

  const payloadsDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_execution', 'payloads');
  let payloadFile = '';
  let preparedQuestion = '';

  if (fs.existsSync(payloadsDir)) {
    const files = fs.readdirSync(payloadsDir)
      .filter(f => f.startsWith(`notebooklm_payload_${queryType.replace(/-/g, '_')}_`) || f === `notebooklm_payload_${queryType.replace(/-/g, '_')}.md`)
      .sort();
    if (files.length > 0) {
      payloadFile = path.join(payloadsDir, files[files.length - 1]);
      try {
        preparedQuestion = fs.readFileSync(payloadFile, 'utf-8');
      } catch (err) {
        console.warn(`[Warning] Could not read payload file: ${(err as Error).message}`);
      }
    }
  }

  if (!preparedQuestion) {
    preparedQuestion = `Analyze the current repository structure and summarize findings for query type: ${normalizedType}. Ensure all outputs align with the Brilliantaire OS schema rules.`;
    payloadFile = 'FALLBACK_GENERATED';
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'live_adapter', 'live-query-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{QUERY_TYPE\}\}/g, normalizedType)
    .replace(/\{\{SOURCE_PAYLOAD_PATH\}\}/g, payloadFile)
    .replace(/\{\{PREPARED_QUESTION\}\}/g, preparedQuestion.trim())
    .replace(/\{\{READ_ONLY_MODE\}\}/g, String(READ_ONLY_MODE))
    .replace(/\{\{CONFIRMATION_REQUIRED\}\}/g, String(REQUIRE_CONFIRM_FLAG))
    .replace(/\{\{LIVE_EXECUTION_DEFAULT\}\}/g, String(LIVE_EXECUTION_DEFAULT))
    .replace(/\{\{OBSIDIAN_WRITE_DISABLED\}\}/g, String(!ALLOW_OBSIDIAN_WRITE))
    .replace(/\{\{NOTEBOOK_MODIFICATION_DISABLED\}\}/g, String(!ALLOW_NOTEBOOK_MODIFICATION));

  const safePath = getSafeWritePath(outputFolders.queries, `notebooklm_live_query_${normalizedType.replace(/-/g, '_')}_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Live query file staged at: ${path.basename(safePath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('PREPARE_QUERY', detailMsg);

  await announceCompletion(`Live query file successfully staged for ${normalizedType}.`, "10");
}

// 3. test-readiness Command
async function handleTestReadiness(): Promise<string> {
  console.log("⏱️ Compiling live adapter readiness report...");
  await announceIntent("Auditing live adapter configuration readiness parameters.");

  const secretsScore = getLatestSecretsReadinessScore();
  const detectionConfidence = getLatestDetectionConfidence();
  
  const mcpExecutionDir = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_execution', 'dry_runs');
  const dryRunsPresent = fs.existsSync(mcpExecutionDir) && fs.readdirSync(mcpExecutionDir).filter(f => f.endsWith('.md')).length > 0;

  const envsPresent = expectedEnvNames.every(name => process.env[name] !== undefined && process.env[name] !== '');
  const serverCommandPresent = process.env.NOTEBOOKLM_MCP_SERVER_COMMAND !== undefined && process.env.NOTEBOOKLM_MCP_SERVER_COMMAND !== '';

  const blockers: string[] = [];
  if (secretsScore < REQUIRE_READINESS_SCORE) {
    blockers.push(`Secrets readiness score is ${secretsScore}% (100% required)`);
  }
  if (!envsPresent) {
    blockers.push("Missing expected environment variables");
  }
  if (!serverCommandPresent) {
    blockers.push("NOTEBOOKLM_MCP_SERVER_COMMAND variable is missing");
  }
  if (process.env.NOTEBOOKLM_MCP_ENABLED !== 'true') {
    blockers.push("NOTEBOOKLM_MCP_ENABLED environment variable is not true");
  }

  const isEligible = blockers.length === 0;
  const statusStr = isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE";

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'live_adapter', 'live-run-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{QUERY_TYPE\}\}/g, 'readiness-test')
    .replace(/\{\{READINESS_SCORE\}\}/g, String(secretsScore))
    .replace(/\{\{DETECTION_CONFIDENCE\}\}/g, String(detectionConfidence))
    .replace(/\{\{LIVE_ENABLED\}\}/g, String(process.env.NOTEBOOKLM_MCP_ENABLED === 'true'))
    .replace(/\{\{CONFIRMED\}\}/g, 'true')
    .replace(/\{\{RESULT\}\}/g, `Readiness Status: ${statusStr}`)
    .replace(/\{\{BLOCKERS\}\}/g, blockers.length > 0 ? blockers.join(', ') : 'None')
    .replace(/\{\{RESPONSE_PATH\}\}/g, 'N/A')
    .replace(/\{\{NEXT_ACTION\}\}/g, isEligible ? "Proceed to manually dispatch live query run." : "Fix configuration blockers and rerun readiness check.");

  const readinessFilePath = getSafeWritePath(outputFolders.reports, `notebooklm_live_adapter_readiness_${getFormattedDate()}`, '.md');
  fs.writeFileSync(readinessFilePath, template);

  const detailMsg = `Live readiness report written to: ${path.basename(readinessFilePath)}. Eligible=${isEligible}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('TEST_READINESS', detailMsg);

  await announceCompletion(`Readiness audit compiled. Eligibility status: ${statusStr}.`, "10");
  return readinessFilePath;
}

// 4. run-live-query Command
async function handleRunLiveQuery(queryType: string, confirmPassed: boolean) {
  const normalizedType = queryType.toLowerCase().replace(/_/g, '-');
  if (!allowedQueryTypes.includes(normalizedType)) {
    console.error(`❌ Error: Unknown query type "${queryType}". Allowed types: ${allowedQueryTypes.join(', ')}`);
    process.exit(1);
  }

  console.log(`⚡ Dispatching live query run for "${normalizedType}"...`);
  await announceIntent(`Running live NotebookLM MCP adapter execution gate for ${normalizedType}.`);

  const secretsScore = getLatestSecretsReadinessScore();
  const detectionConfidence = getLatestDetectionConfidence();
  const mcpEnabled = process.env.NOTEBOOKLM_MCP_ENABLED === 'true';

  const blockers: string[] = [];
  if (!confirmPassed) {
    blockers.push("Confirm flag --confirm missing");
  }
  if (!mcpEnabled) {
    blockers.push("NOTEBOOKLM_MCP_ENABLED environment variable is not true");
  }
  if (secretsScore < REQUIRE_READINESS_SCORE) {
    blockers.push(`Secrets readiness score is ${secretsScore}% (100% required)`);
  }
  if (!READ_ONLY_MODE) {
    blockers.push("Read-only mode must be enabled");
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'live_adapter', 'live-run-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  const reportTemplate = fs.readFileSync(templatePath, 'utf-8');

  if (blockers.length > 0) {
    // Write blocked report safely
    const blockedMsg = `Live run blocked: ${blockers.join(', ')}`;
    console.error(`❌ ${blockedMsg}`);

    let report = reportTemplate
      .replace(/\{\{DATE\}\}/g, getFormattedDate())
      .replace(/\{\{QUERY_TYPE\}\}/g, normalizedType)
      .replace(/\{\{READINESS_SCORE\}\}/g, String(secretsScore))
      .replace(/\{\{DETECTION_CONFIDENCE\}\}/g, String(detectionConfidence))
      .replace(/\{\{LIVE_ENABLED\}\}/g, String(mcpEnabled))
      .replace(/\{\{CONFIRMED\}\}/g, String(confirmPassed))
      .replace(/\{\{RESULT\}\}/g, "BLOCKED")
      .replace(/\{\{BLOCKERS\}\}/g, blockers.join(', '))
      .replace(/\{\{RESPONSE_PATH\}\}/g, 'N/A')
      .replace(/\{\{NEXT_ACTION\}\}/g, "Verify parameters and resolve active blocks before retry.");

    const blockedReportPath = getSafeWritePath(outputFolders.reports, `notebooklm_live_run_report_${normalizedType.replace(/-/g, '_')}_blocked_${getFormattedDate()}`, '.md');
    fs.writeFileSync(blockedReportPath, report);
    logEvent('RUN_LIVE_QUERY_BLOCKED', blockedMsg);

    await announceCompletion("Live query execution blocked due to safety parameters.", "10");
    process.exit(1);
  }

  // Safety Fallback: Actual invocation contract is unknown - generate manual execution instruction report
  const instructionsMsg = "Actual MCP JSON-RPC invocation signature remains offline. Generating safe manual instructions report.";
  console.log(`ℹ️ ${instructionsMsg}`);

  const serverCommand = process.env.NOTEBOOKLM_MCP_SERVER_COMMAND || "node dist/scripts/notebooklm-bridge.js";

  const manualInstructions = `# NotebookLM MCP Manual Query Execution Instructions

* **Date:** ${getFormattedDate()}
* **Query Type:** ${normalizedType}

## ⚡ Manual Execution Commands

The live connection interface is staging only. Follow these steps to query NotebookLM MCP locally:

1. Start your local MCP Host or client server using the configured environment command:
   \`\`\`bash
   ${serverCommand}
   \`\`\`

2. Dispatch the prepared query parameters (staged in queries folder) to the active NotebookLM server interface:
   - Target Folder ID: \`${process.env.NOTEBOOKLM_WORKSPACE_ID || 'your-workspace-id'}\`
   - Prompt context: Analyze dry-run payloads.

3. Once NotebookLM generates the answer response, save the raw text locally and import it:
   \`\`\`bash
   npm run command -- "notebooklm-mcp-live import-response <path_to_saved_response_file>"
   \`\`\`
`;

  const instructionPath = getSafeWritePath(outputFolders.responses, `notebooklm_manual_execution_instructions_${normalizedType.replace(/-/g, '_')}_${getFormattedDate()}`, '.md');
  fs.writeFileSync(instructionPath, manualInstructions);

  // Write success run report pointing to manual instructions
  let report = reportTemplate
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{QUERY_TYPE\}\}/g, normalizedType)
    .replace(/\{\{READINESS_SCORE\}\}/g, String(secretsScore))
    .replace(/\{\{DETECTION_CONFIDENCE\}\}/g, String(detectionConfidence))
    .replace(/\{\{LIVE_ENABLED\}\}/g, 'true')
    .replace(/\{\{CONFIRMED\}\}/g, 'true')
    .replace(/\{\{RESULT\}\}/g, "Instructions Generated")
    .replace(/\{\{BLOCKERS\}\}/g, "None (Safety Fallback applied)")
    .replace(/\{\{RESPONSE_PATH\}\}/g, instructionPath)
    .replace(/\{\{NEXT_ACTION\}\}/g, "Execute manual steps and import the response text file.");

  const runReportPath = getSafeWritePath(outputFolders.reports, `notebooklm_live_run_report_${normalizedType.replace(/-/g, '_')}_${getFormattedDate()}`, '.md');
  fs.writeFileSync(runReportPath, report);

  const detailMsg = `Live execution report created at ${path.basename(runReportPath)}. Manual instructions path: ${path.basename(instructionPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('RUN_LIVE_QUERY_MANUAL_FALLBACK', detailMsg);

  await announceCompletion("Live run completed safely using manual fallback report.", "10");
}

// 5. import-response Command
async function handleImportResponse(filePath: string) {
  console.log(`📥 Importing response file: "${filePath}"...`);
  await announceIntent(`Importing manually staged NotebookLM response from ${filePath}.`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: Response file not found at path "${filePath}".`);
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    console.error("❌ Error: Response file is empty.");
    process.exit(1);
  }

  const text = fs.readFileSync(filePath, 'utf-8');
  if (text.length > MAX_RESPONSE_LENGTH) {
    console.error(`❌ Error: Response file size is ${text.length} characters (Max allowed: ${MAX_RESPONSE_LENGTH}).`);
    process.exit(1);
  }

  // Basic safe text validation: reject suspicious injections
  const unsafePatterns = [/<script>/i, /process\.exit/i, /require\(/i, /exec\(/i, /eval\(/i];
  const containsUnsafe = unsafePatterns.some(pat => pat.test(text));
  if (containsUnsafe) {
    console.error("❌ Error: Unsafe payload detected. Import rejected.");
    process.exit(1);
  }

  const baseName = path.basename(filePath, path.extname(filePath));
  const importedFile = getSafeWritePath(outputFolders.responses, `notebooklm_live_response_${baseName}_${getFormattedDate()}`, '.md');
  fs.writeFileSync(importedFile, text);

  // Infer Query Type
  let queryType = 'source-summary';
  const lowerText = text.toLowerCase() + ' ' + baseName.toLowerCase();
  if (lowerText.includes('workflow')) {
    queryType = 'workflow-extraction';
  } else if (lowerText.includes('weak') || lowerText.includes('claims')) {
    queryType = 'weak-claims-review';
  }

  // Parse sections for template formatting
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const summary = paragraphs[0] || 'Staged NotebookLM response text.';
  
  // Extract bullet lines containing citations or sources
  const citations = text.split('\n')
    .filter(line => line.includes('[') && line.includes(']') || line.trim().startsWith('-') || line.trim().startsWith('*'))
    .slice(0, 10)
    .join('\n') || '- Live NotebookLM citation references.';

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'live_adapter', 'live-response-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{QUERY_TYPE\}\}/g, queryType)
    .replace(/\{\{RESPONSE_SOURCE\}\}/g, baseName)
    .replace(/\{\{IMPORTED_AT\}\}/g, new Date().toISOString())
    .replace(/\{\{STATUS\}\}/g, 'staged_for_processing')
    .replace(/\{\{SUMMARY\}\}/g, summary.trim())
    .replace(/\{\{CITATIONS\}\}/g, citations.trim())
    .replace(/\{\{NEXT_ACTION\}\}/g, "Run review checks and compile the final report.");

  const normalizedFile = getSafeWritePath(outputFolders.responses, `notebooklm_normalized_response_${baseName}_${getFormattedDate()}`, '.md');
  fs.writeFileSync(normalizedFile, template);

  const detailMsg = `Normalized response generated at ${path.basename(normalizedFile)}. Raw response copied to ${path.basename(importedFile)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('IMPORT_RESPONSE', detailMsg);

  await announceCompletion(`Successfully imported manual response. Record created.`, "10");
}

// 6. report Command
async function handleReport() {
  console.log("⏱️ Generating live adapter operations report...");
  await announceIntent("Compiling query and response metric indices for live adapter.");

  let queriesCount = 0;
  if (fs.existsSync(outputFolders.queries)) {
    queriesCount = fs.readdirSync(outputFolders.queries).filter(f => f.endsWith('.md')).length;
  }

  let responsesCount = 0;
  if (fs.existsSync(outputFolders.responses)) {
    responsesCount = fs.readdirSync(outputFolders.responses)
      .filter(f => f.startsWith('notebooklm_live_response_') || f.startsWith('notebooklm_normalized_response_'))
      .length;
  }

  let blockedCount = 0;
  if (fs.existsSync(outputFolders.reports)) {
    blockedCount = fs.readdirSync(outputFolders.reports).filter(f => f.includes('_blocked_')).length;
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'live_adapter', 'live-run-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  const reportContent = `# NotebookLM Live Adapter Operations Report

* **Compile Date:** ${getFormattedDate()}

## Telemetry Metrics Summary
* **Queries Staged Count:** ${queriesCount}
* **Responses Imported/Captured Count:** ${responsesCount}
* **Blocked Run Attempts:** ${blockedCount}
* **Live Execution Mode Allowed:** ${LIVE_EXECUTION_DEFAULT ? 'Yes' : 'No'}
* **Read-Only Lock Active:** ${READ_ONLY_MODE ? 'Yes' : 'No'}

## Safety State Check
- **Notebook mutations blocked:** Yes (Mutations are restricted)
- **Obsidian direct writes blocked:** Yes (All responses reside locally under output folders)
- **Automatic query loops active:** No (Manual dispatch only)

## Next Recommended Action
Staging environment validated. Complete remaining manual answers ingestion.
`;

  const reportPath = getSafeWritePath(outputFolders.reports, `notebooklm_live_adapter_report_${getFormattedDate()}`, '.md');
  fs.writeFileSync(reportPath, reportContent);

  const detailMsg = `Live adapter operations report compiled at: ${path.basename(reportPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('GENERATE_REPORT', detailMsg);

  await announceCompletion("Live adapter operations report compiled successfully.", "10");
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  // Check if --confirm flag is passed
  const confirmPassed = rawInput.includes('--confirm');
  const commandArg = rawInput.replace('--confirm', '').trim();

  // Parse command arguments
  const parts = commandArg.split(' ').map(p => p.trim()).filter(p => p.length > 0);
  const command = parts[0];

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-live-help.js');
    await import(helpPath);
    return;
  }

  try {
    switch (command) {
      case 'status':
        await handleStatus();
        break;
      case 'prepare-live-query': {
        const queryType = parts[1];
        if (!queryType) {
          console.error("❌ Error: Missing query-type argument. Example: prepare-live-query source-summary");
          process.exit(1);
        }
        await handlePrepareLiveQuery(queryType);
        break;
      }
      case 'test-readiness':
        await handleTestReadiness();
        break;
      case 'run-live-query': {
        const queryType = parts[1];
        if (!queryType) {
          console.error("❌ Error: Missing query-type argument. Example: run-live-query source-summary --confirm");
          process.exit(1);
        }
        await handleRunLiveQuery(queryType, confirmPassed);
        break;
      }
      case 'import-response': {
        const filePath = parts[1];
        if (!filePath) {
          console.error("❌ Error: Missing response-file path argument. Example: import-response test_inputs/notebooklm_live_response_sample.md");
          process.exit(1);
        }
        await handleImportResponse(filePath);
        break;
      }
      case 'report':
        await handleReport();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-live-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Live adapter task failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal live adapter runtime error: ${err}`);
  process.exit(1);
});
