import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_INFERENCE_CALLS,
  ALLOW_AUTONOMOUS_INFERENCE,
  ALLOW_EXTERNAL_MODEL_DOWNLOAD,
  REQUIRE_MANUAL_PROMPT_REVIEW,
  REQUIRE_RESPONSE_AUDIT,
  MAX_PROMPT_LENGTH,
  MAX_CONVERSATION_TURNS,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  SERVER_CONFIG,
  outputFolders,
  supportedModels,
  approvedUseCases,
  claudeCodeIntegrationPoints,
  REPO_ROOT
} from '../config/local-inference.js';
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
  const logDir = outputFolders.logs;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `local_inference_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function containsUnsafeText(text: string): boolean {
  const dangerousPatterns = [
    /rm\s+-rf/i,
    /sudo\s+/i,
    /chmod\s+/i,
    /chown\s+/i,
    /mkfs/i,
    />\s*\/dev\/sda/i,
    /eval\(/i
  ];
  return dangerousPatterns.some(pattern => pattern.test(text));
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `LI-${dateStr}-${suffix}`;
}

async function handleStatus() {
  console.log(`\n🧠 ${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`  Tool Type:         ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:       ${BRIDGE_MODE}`);
  console.log(`  Integration:       ${INTEGRATION_TARGET}`);
  console.log(`  Server URL:        ${SERVER_CONFIG.baseUrl}`);
  console.log(`  Endpoint:          ${SERVER_CONFIG.completionsEndpoint}`);
  console.log(`  Model:             ${SERVER_CONFIG.model}`);
  console.log(`  Protocol:          ${SERVER_CONFIG.protocol}`);
  console.log(`  Credentials:       ${SERVER_CONFIG.requiresCredentials ? 'required' : 'none (zero-credential)'}`);
  console.log(`  Live Calls:        ${ALLOW_LIVE_INFERENCE_CALLS}`);
  console.log(`  Auto Inference:    ${ALLOW_AUTONOMOUS_INFERENCE}`);
  console.log(`  Prompt Review:     ${REQUIRE_MANUAL_PROMPT_REVIEW}`);
  console.log(`  Response Audit:    ${REQUIRE_RESPONSE_AUDIT}`);
  console.log(`${'─'.repeat(50)}`);

  const folders = [
    { name: 'Chat Requests', dir: outputFolders.chatRequests },
    { name: 'Responses', dir: outputFolders.responses },
    { name: 'Prompt Staging', dir: outputFolders.promptStaging },
    { name: 'Obsidian Exports', dir: outputFolders.obsidianExports },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  📁 Output Directories:');
  for (const folder of folders) {
    let count = 0;
    if (fs.existsSync(folder.dir)) {
      count = fs.readdirSync(folder.dir).filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
    }
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(22)} ${status}`);
  }

  console.log('\n  🤖 Supported Models:');
  for (const m of supportedModels) {
    console.log(`     - ${m}`);
  }

  console.log('\n  📋 Approved Use Cases:');
  for (const uc of approvedUseCases) {
    console.log(`     - ${uc}`);
  }

  console.log('\n  🔗 Claude Code Integration Points:');
  for (const ip of claudeCodeIntegrationPoints) {
    console.log(`     - ${ip}`);
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

async function handleHealthCheck() {
  console.log(`\n🧠 ${PROJECT_NAME} - Health Check`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`  Target: ${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.completionsEndpoint}`);
  console.log(`  Model:  ${SERVER_CONFIG.model}`);
  console.log(`${'─'.repeat(50)}`);

  if (!ALLOW_LIVE_INFERENCE_CALLS) {
    console.log('\n  ⚠️  Live inference calls are DISABLED (ALLOW_LIVE_INFERENCE_CALLS = false).');
    console.log('  📋 To perform a live health check, enable the flag in config/local-inference.ts');
    console.log('     and restart. The health check will send a minimal test message to the server.');
    console.log('\n  📝 Manual Health Check Command:');
    console.log(`     curl ${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.completionsEndpoint} \\`);
    console.log(`       -H "Content-Type: application/json" \\`);
    console.log(`       -d '{"model":"${SERVER_CONFIG.model}","messages":[{"role":"user","content":"Hello!"}]}'`);
    logEvent('HEALTH_CHECK', 'Dry-run health check (live calls disabled)');
    return;
  }

  console.log('\n  🔄 Sending health check request...');
  try {
    const response = await fetch(`${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.completionsEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: SERVER_CONFIG.model,
        messages: [{ role: 'user', content: 'Health check: respond with OK' }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Server responded: HTTP ${response.status}`);
      if (data.choices && data.choices[0]) {
        console.log(`  📝 Response: ${data.choices[0].message?.content?.substring(0, 100) || '(empty)'}`);
      }
      if (data.model) {
        console.log(`  🤖 Model: ${data.model}`);
      }
      logEvent('HEALTH_CHECK', `Server healthy: HTTP ${response.status}`);
    } else {
      console.log(`  ❌ Server returned: HTTP ${response.status}`);
      logEvent('HEALTH_CHECK', `Server error: HTTP ${response.status}`);
    }
  } catch (err: any) {
    console.log(`  ❌ Connection failed: ${err.message}`);
    console.log('  💡 Ensure the local inference server is running at the configured URL.');
    logEvent('HEALTH_CHECK', `Connection failed: ${err.message}`);
  }
}

async function handleChat(message: string) {
  if (!message) {
    console.error("❌ Error: Missing message. Usage: npm run local-inference -- \"chat <MESSAGE>\"");
    process.exit(1);
  }

  if (message.length > MAX_PROMPT_LENGTH) {
    console.error(`❌ Error: Message length (${message.length}) exceeds maximum (${MAX_PROMPT_LENGTH}).`);
    process.exit(1);
  }

  if (containsUnsafeText(message)) {
    console.error("❌ Error: Unsafe content detected in message.");
    process.exit(1);
  }

  await announceIntent(`Staging local inference chat request`);
  console.log(`🧠 Staging chat request...`);

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  const templatePath = path.join(REPO_ROOT, 'templates', 'local_inference', 'chat-request-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{REQUEST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{MODEL\}\}/g, SERVER_CONFIG.model)
    .replace(/\{\{SERVER_URL\}\}/g, `${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.completionsEndpoint}`)
    .replace(/\{\{USER_MESSAGE\}\}/g, message)
    .replace(/\{\{SYSTEM_PROMPT\}\}/g, '(none)')
    .replace(/\{\{USE_CASE\}\}/g, '(classify during review)')
    .replace(/\{\{TEMPERATURE\}\}/g, '(default)')
    .replace(/\{\{MAX_TOKENS\}\}/g, '(default)')
    .replace(/\{\{RESPONSE_STATUS\}\}/g, 'pending');

  const safePath = getSafeWritePath(
    outputFolders.chatRequests,
    `chat_request_${sanitizeFilename(requestId)}_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Created chat request ${requestId}: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('CHAT_REQUEST', msg);
  await announceCompletion(`Local inference chat request staged: ${requestId}`, '10');
}

async function handleStagePrompt(systemPrompt: string, userMessage: string) {
  if (!systemPrompt) {
    console.error("❌ Error: Missing system prompt. Usage: npm run local-inference -- \"stage-prompt <SYSTEM_PROMPT> | <USER_MESSAGE>\"");
    process.exit(1);
  }

  if (!userMessage) {
    console.error("❌ Error: Missing user message.");
    process.exit(1);
  }

  if (containsUnsafeText(systemPrompt) || containsUnsafeText(userMessage)) {
    console.error("❌ Error: Unsafe content detected.");
    process.exit(1);
  }

  const totalLength = systemPrompt.length + userMessage.length;
  if (totalLength > MAX_PROMPT_LENGTH) {
    console.error(`❌ Error: Combined prompt length (${totalLength}) exceeds maximum (${MAX_PROMPT_LENGTH}).`);
    process.exit(1);
  }

  await announceIntent(`Staging structured prompt for local inference`);
  console.log(`📝 Staging structured prompt...`);

  const requestId = generateRequestId();
  const dateStr = getFormattedDate();

  const templatePath = path.join(REPO_ROOT, 'templates', 'local_inference', 'chat-request-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{REQUEST_ID\}\}/g, requestId)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{MODEL\}\}/g, SERVER_CONFIG.model)
    .replace(/\{\{SERVER_URL\}\}/g, `${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.completionsEndpoint}`)
    .replace(/\{\{USER_MESSAGE\}\}/g, userMessage)
    .replace(/\{\{SYSTEM_PROMPT\}\}/g, systemPrompt)
    .replace(/\{\{USE_CASE\}\}/g, '(classify during review)')
    .replace(/\{\{TEMPERATURE\}\}/g, '(default)')
    .replace(/\{\{MAX_TOKENS\}\}/g, '(default)')
    .replace(/\{\{RESPONSE_STATUS\}\}/g, 'pending');

  const safePath = getSafeWritePath(
    outputFolders.promptStaging,
    `staged_prompt_${sanitizeFilename(requestId)}_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Staged prompt ${requestId}: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('STAGE_PROMPT', msg);
  await announceCompletion(`Local inference prompt staged: ${requestId}`, '10');
}

async function handleMcpConfig() {
  await announceIntent('Generating MCP configuration for local inference server');
  console.log('🔧 Generating MCP configuration...');

  const templatePath = path.join(REPO_ROOT, 'templates', 'local_inference', 'mcp-config-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SERVER_URL\}\}/g, SERVER_CONFIG.baseUrl)
    .replace(/\{\{ENDPOINT\}\}/g, SERVER_CONFIG.completionsEndpoint)
    .replace(/\{\{MODEL\}\}/g, SERVER_CONFIG.model);

  const safePath = getSafeWritePath(
    outputFolders.root,
    `mcp_config_guide_${getFormattedDate()}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `MCP config guide generated: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('MCP_CONFIG', msg);
  await announceCompletion('Local inference MCP config guide generated', '10');
}

async function handleObsidianExport() {
  await announceIntent('Staging local inference summary for Obsidian export');
  console.log('📝 Staging Obsidian export summary...');

  const dateStr = getFormattedDate();
  let chatCount = 0;
  let responseCount = 0;
  let promptCount = 0;

  if (fs.existsSync(outputFolders.chatRequests)) {
    chatCount = fs.readdirSync(outputFolders.chatRequests).filter(f => f.endsWith('.md')).length;
  }
  if (fs.existsSync(outputFolders.responses)) {
    responseCount = fs.readdirSync(outputFolders.responses).filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
  }
  if (fs.existsSync(outputFolders.promptStaging)) {
    promptCount = fs.readdirSync(outputFolders.promptStaging).filter(f => f.endsWith('.md')).length;
  }

  const exportContent = `# Local Inference Server - Obsidian Export Summary

- **Export Date:** ${dateStr}
- **Bridge Mode:** ${BRIDGE_MODE}
- **Integration Target:** ${INTEGRATION_TARGET}
- **Server:** ${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.completionsEndpoint}
- **Model:** ${SERVER_CONFIG.model}
- **Protocol:** ${SERVER_CONFIG.protocol}

## Asset Inventory

| Asset Type | Count | Status |
|---|---|---|
| Chat Requests | ${chatCount} | staged |
| Responses | ${responseCount} | staged |
| Staged Prompts | ${promptCount} | staged |

## Approved Use Cases

${approvedUseCases.map(uc => `- ${uc}`).join('\n')}

## Claude Code Integration Points

${claudeCodeIntegrationPoints.map(p => `- ${p}`).join('\n')}

## Next Actions

- [ ] Review all staged chat requests for content safety
- [ ] Validate prompt staging entries for approved use cases
- [ ] Audit response logs for quality assurance
- [ ] Verify MCP configuration on local machine

---

*Staged for Obsidian export via Approved Write Gateway. Direct vault write is disabled.*
`;

  const safePath = getSafeWritePath(
    outputFolders.obsidianExports,
    `local_inference_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, exportContent);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Local inference Obsidian export staged', '10');
}

async function main() {
  if (ALLOW_AUTONOMOUS_INFERENCE) {
    console.error("❌ Safety gate: ALLOW_AUTONOMOUS_INFERENCE is enabled. This is not permitted in manual-first mode.");
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_MODEL_DOWNLOAD) {
    console.error("❌ Safety gate: ALLOW_EXTERNAL_MODEL_DOWNLOAD is enabled. This is not permitted in manual-first mode.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error("❌ Error: No command provided. Run `npm run local-inference-help` for usage.");
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];
  const restArgs = parts.slice(1).join(' ');

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'health-check':
      await handleHealthCheck();
      break;
    case 'chat':
      await handleChat(restArgs);
      break;
    case 'stage-prompt': {
      const pipeIndex = restArgs.indexOf('|');
      if (pipeIndex === -1) {
        console.error("❌ Error: Use pipe (|) to separate system prompt and user message.");
        console.error('   Usage: npm run local-inference -- "stage-prompt <SYSTEM> | <USER>"');
        process.exit(1);
      }
      const systemPrompt = restArgs.substring(0, pipeIndex).trim();
      const userMessage = restArgs.substring(pipeIndex + 1).trim();
      await handleStagePrompt(systemPrompt, userMessage);
      break;
    }
    case 'mcp-config':
      await handleMcpConfig();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`❌ Unknown command: "${command}". Run \`npm run local-inference-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`❌ Fatal error: ${err.message}`);
  process.exit(1);
});
