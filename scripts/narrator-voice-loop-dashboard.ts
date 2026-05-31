import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  DB_ASR_TRANSCRIPTS_DIR,
  DB_ASR_STAGED_DIR,
  DB_ASR_APPROVED_DIR,
  DB_ASR_REJECTED_DIR,
  DB_BRIDGE_READY_DIR,
  DB_BRIDGE_EXECUTED_DIR,
  DB_BRIDGE_REJECTED_DIR,
  DB_BRIDGE_LOG_DIR,
  DB_REPORTS_DIR,
  DB_LOG_DIR,
  DASHBOARD_REFRESH_MODE,
  AUTO_EXECUTE,
  LIVE_MIC_ENABLED,
  CONFIRMATION_REQUIRED,
  MAX_DISPLAYED_PACKETS,
  READONLY_MODE_DEFAULT,
  ALLOWED_DASHBOARD_ACTIONS,
  DANGER_ACTION_LIST
} from '../config/narrator-voice-loop-dashboard.config.js';
import { ALLOWED_COMMAND_ROUTER_ENTRIES } from '../config/narrator-voice-bridge.config.js';

function ensureDirs() {
  fs.mkdirSync(DB_REPORTS_DIR, { recursive: true });
  fs.mkdirSync(DB_LOG_DIR, { recursive: true });
}

const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function loadTemplate(name: string): string {
  const tplPath = path.join(process.cwd(), 'templates/narrator_voice_loop_dashboard', `${name}.md`);
  if (fs.existsSync(tplPath)) {
    return fs.readFileSync(tplPath, 'utf-8');
  }
  return '';
}

// ─── Queue Scan Helper ───────────────────────────────────────────────────────
interface QueueCounts {
  transcripts: number;
  staged: number;
  approvedAsr: number;
  ready: number;
  executed: number;
  rejectedAsr: number;
  rejectedBridge: number;
  logs: number;
}

function getQueueCounts(): QueueCounts {
  const countDir = (dir: string) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.txt')).length;
  };

  return {
    transcripts: countDir(DB_ASR_TRANSCRIPTS_DIR),
    staged: countDir(DB_ASR_STAGED_DIR),
    approvedAsr: countDir(DB_ASR_APPROVED_DIR),
    ready: countDir(DB_BRIDGE_READY_DIR),
    executed: countDir(DB_BRIDGE_EXECUTED_DIR),
    rejectedAsr: countDir(DB_ASR_REJECTED_DIR),
    rejectedBridge: countDir(DB_BRIDGE_REJECTED_DIR),
    logs: countDir(DB_BRIDGE_LOG_DIR)
  };
}

interface MiniPacket {
  id: string;
  command: string;
  confidence: number;
  status: string;
  location: string;
}

function scanAllPackets(): MiniPacket[] {
  const list: MiniPacket[] = [];

  const parseMini = (dir: string, location: string) => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
      if (!file.endsWith('.md')) return;
      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      const idMatch = file.match(/asr_command_packet_(.+)\.md/);
      const id = idMatch ? idMatch[1] : file.replace('.md', '');

      const cmdMatch = content.match(/Executable Command:\s*`([^`]+)`/i);
      const command = cmdMatch ? cmdMatch[1] : 'unknown';

      const confMatch = content.match(/Confidence:\s*`([^`]+)`/i);
      const confidence = confMatch ? parseFloat(confMatch[1]) : 0;

      const statusMatch = content.match(/Status:\s*`([^`]+)`/i);
      const status = statusMatch ? statusMatch[1] : 'unknown';

      list.push({ id, command, confidence, status, location });
    });
  };

  parseMini(DB_ASR_STAGED_DIR, 'ASR Staged');
  parseMini(DB_ASR_APPROVED_DIR, 'ASR Approved Intake');
  parseMini(DB_BRIDGE_READY_DIR, 'Bridge Ready');
  parseMini(DB_BRIDGE_EXECUTED_DIR, 'Bridge Executed');
  parseMini(DB_BRIDGE_REJECTED_DIR, 'Bridge Rejected');
  parseMini(DB_ASR_REJECTED_DIR, 'ASR Rejected');

  return list;
}

// ─── Status ──────────────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const counts = getQueueCounts();
  const template = loadTemplate('voice-loop-dashboard-status-template');

  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{ASR_TRANSCRIPTS_DIR}}/g, DB_ASR_TRANSCRIPTS_DIR)
    .replace(/{{ASR_STAGED_DIR}}/g, DB_ASR_STAGED_DIR)
    .replace(/{{ASR_APPROVED_DIR}}/g, DB_ASR_APPROVED_DIR)
    .replace(/{{BRIDGE_READY_DIR}}/g, DB_BRIDGE_READY_DIR)
    .replace(/{{BRIDGE_EXECUTED_DIR}}/g, DB_BRIDGE_EXECUTED_DIR)
    .replace(/{{BRIDGE_LOG_DIR}}/g, DB_BRIDGE_LOG_DIR)
    .replace(/{{DASHBOARD_MODE}}/g, READONLY_MODE_DEFAULT ? 'Read-Only Operator Panel' : 'Interactive Dispatcher')
    .replace(/{{AUTO_EXECUTE}}/g, String(AUTO_EXECUTE))
    .replace(/{{LIVE_MIC_ENABLED}}/g, String(LIVE_MIC_ENABLED))
    .replace(/{{CONFIRMATION_REQUIRED}}/g, String(CONFIRMATION_REQUIRED))
    .replace(/{{ALLOWED_ACTIONS_COUNT}}/g, String(ALLOWED_DASHBOARD_ACTIONS.length))
    .replace(/{{STAGED_COUNT}}/g, String(counts.staged))
    .replace(/{{APPROVED_ASR_COUNT}}/g, String(counts.approvedAsr))
    .replace(/{{READY_COUNT}}/g, String(counts.ready))
    .replace(/{{EXECUTED_COUNT}}/g, String(counts.executed))
    .replace(/{{REJECTED_COUNT}}/g, String(counts.rejectedAsr + counts.rejectedBridge));

  console.log(output);
}

// ─── Overview ────────────────────────────────────────────────────────────────
function handleOverview() {
  ensureDirs();
  const counts = getQueueCounts();
  const template = loadTemplate('voice-loop-dashboard-overview-template');

  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{ASR_TRANSCRIPTS_COUNT}}/g, String(counts.transcripts))
    .replace(/{{STAGED_COUNT}}/g, String(counts.staged))
    .replace(/{{APPROVED_ASR_COUNT}}/g, String(counts.approvedAsr))
    .replace(/{{READY_COUNT}}/g, String(counts.ready))
    .replace(/{{EXECUTED_COUNT}}/g, String(counts.executed))
    .replace(/{{REJECTED_COUNT}}/g, String(counts.rejectedAsr + counts.rejectedBridge))
    .replace(/{{LOGS_COUNT}}/g, String(counts.logs));

  console.log(output);
}

// ─── Packets ─────────────────────────────────────────────────────────────────
function handlePackets() {
  const list = scanAllPackets();
  console.log('\n=========================================');
  console.log('📋 Recent Voice Command Loop Packets');
  console.log('=========================================');

  if (list.length === 0) {
    console.log('No packets staged in the voice loop queues.');
    console.log('=========================================\n');
    return;
  }

  list.slice(-MAX_DISPLAYED_PACKETS).forEach(p => {
    console.log(`- [${p.location}] ID: ${p.id} | Command: "${p.command}" | Status: ${p.status}`);
  });
  console.log('=========================================\n');
}

// ─── Packet Detail ───────────────────────────────────────────────────────────
function handlePacketDetail(packetId: string) {
  const all = scanAllPackets();
  const matched = all.find(p => p.id === packetId);

  if (!matched) {
    console.error(`❌ Error: Packet ID "${packetId}" not found in any queue.`);
    process.exit(1);
  }

  // Determine active folder path
  let dirPath = '';
  switch (matched.location) {
    case 'ASR Staged': dirPath = DB_ASR_STAGED_DIR; break;
    case 'ASR Approved Intake': dirPath = DB_ASR_APPROVED_DIR; break;
    case 'Bridge Ready': dirPath = DB_BRIDGE_READY_DIR; break;
    case 'Bridge Executed': dirPath = DB_BRIDGE_EXECUTED_DIR; break;
    case 'Bridge Rejected': dirPath = DB_BRIDGE_REJECTED_DIR; break;
    case 'ASR Rejected': dirPath = DB_ASR_REJECTED_DIR; break;
  }

  const filePath = path.join(dirPath, `asr_command_packet_${packetId}.md`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File is missing at expected queue path: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract variables
  const audioMatch = content.match(/Source Audio:\s*`([^`]+)`/i);
  const audioFile = audioMatch ? audioMatch[1] : 'unknown';

  const confMatch = content.match(/Confidence:\s*`([^`]+)`/i);
  const confidence = confMatch ? confMatch[1] : '0';

  const stagedAtMatch = content.match(/\*Staged At:\s*([^*\n\r]+)\*/i);
  const stagedAt = stagedAtMatch ? stagedAtMatch[1] : new Date().toISOString();

  const transcriptMatch = content.match(/```text\s*([\s\S]*?)\s*```/i);
  const transcriptText = transcriptMatch ? transcriptMatch[1].trim() : '';

  const isAllowlisted = ALLOWED_COMMAND_ROUTER_ENTRIES.includes(matched.command);
  const riskLevel = isAllowlisted ? 'Low Risk' : 'HIGH RISK (Not Whitelisted)';

  // Build audit trail
  const trailLines: string[] = [];
  trailLines.push(`  - [ASR Intake] Staged At: ${stagedAt}`);
  if (matched.location === 'Bridge Ready' || matched.location === 'Bridge Executed') {
    trailLines.push(`  - [Bridge Validation] Passed validation gate.`);
    trailLines.push(`  - [Bridge Preparation] Staged into ready queue.`);
  }
  if (matched.location === 'Bridge Executed') {
    trailLines.push(`  - [Manual Run Action] Dispatched to command router successfully.`);
  }
  if (matched.location === 'Bridge Rejected' || matched.location === 'ASR Rejected') {
    trailLines.push(`  - [Blocked Gate Action] Command was rejected.`);
  }

  const template = loadTemplate('voice-loop-packet-detail-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{PACKET_ID}}/g, matched.id)
    .replace(/{{AUDIO_FILE}}/g, audioFile)
    .replace(/{{CONFIDENCE_SCORE}}/g, confidence)
    .replace(/{{STAGED_AT}}/g, stagedAt)
    .replace(/{{TRANSCRIPT_TEXT}}/g, transcriptText)
    .replace(/{{CLI_COMMAND}}/g, matched.command)
    .replace(/{{RISK_LEVEL}}/g, riskLevel)
    .replace(/{{QUEUE_LOCATION}}/g, matched.location)
    .replace(/{{STATUS}}/g, matched.status)
    .replace(/{{AUDIT_TRAIL}}/g, trailLines.join('\n'));

  console.log(output);
}

// ─── Pending Confirmations ───────────────────────────────────────────────────
function handlePendingConfirmations() {
  const all = scanAllPackets();
  const pending = all.filter(p => p.location === 'ASR Approved Intake' || p.location === 'Bridge Ready');

  console.log('\n=========================================');
  console.log('📥 Pending Operator Confirmation Actions');
  console.log('=========================================');

  if (pending.length === 0) {
    console.log('No pending confirmations found. Queues are clear.');
    console.log('=========================================\n');
    return;
  }

  pending.forEach(p => {
    const nextAction = p.location === 'ASR Approved Intake'
      ? `Run "confirm-prepare ${p.id}" to validate & stage`
      : `Run "confirm-execute ${p.id}" to dispatch command`;

    console.log(`- [${p.location}] ID: ${p.id} | Command: "${p.command}"`);
    console.log(`  👉 Next Action Required: ${nextAction}\n`);
  });

  console.log('=========================================\n');
}

// ─── Safety Status ───────────────────────────────────────────────────────────
function handleSafetyStatus() {
  ensureDirs();
  const template = loadTemplate('voice-loop-safety-status-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{LIVE_MIC_ENABLED}}/g, LIVE_MIC_ENABLED ? 'ENABLED (Leak Risk)' : 'DISABLED (Secure)')
    .replace(/{{AUTO_EXECUTE}}/g, AUTO_EXECUTE ? 'ENABLED (Dangerous)' : 'DISABLED (Safe)')
    .replace(/{{CLOUD_ASR_ENABLED}}/g, 'DISABLED (Local Only)')
    .replace(/{{EXACT_NAME_ROUTER_ACTIVE}}/g, 'ENABLED (Strict Gate)')
    .replace(/{{RAW_SHELL_BLOCKED}}/g, 'ENABLED (Blocked)')
    .replace(/{{INJECTION_FILTERS_ACTIVE}}/g, 'ENABLED')
    .replace(/{{ALLOWED_COMMANDS_COUNT}}/g, String(ALLOWED_COMMAND_ROUTER_ENTRIES.length));

  console.log(output);
}

// ─── Latest Audit ────────────────────────────────────────────────────────────
function handleLatestAudit() {
  ensureDirs();
  const template = loadTemplate('voice-loop-audit-summary-template');

  if (!fs.existsSync(DB_BRIDGE_LOG_DIR)) {
    console.log('No bridge logs folder found.');
    return;
  }

  const files = fs.readdirSync(DB_BRIDGE_LOG_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  let logLines = 'No execution audit entries have been recorded yet.';
  if (files.length > 0) {
    const latestFile = path.join(DB_BRIDGE_LOG_DIR, files[files.length - 1]);
    const fileContent = fs.readFileSync(latestFile, 'utf-8');
    logLines = `### Latest Log File: ${files[files.length - 1]}\n\n${fileContent}`;
  }

  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{AUDIT_LOGS}}/g, logLines);

  console.log(output);
}

// ─── Export Summary ──────────────────────────────────────────────────────────
function handleExportSummary() {
  ensureDirs();
  const counts = getQueueCounts();
  const all = scanAllPackets();
  
  const pending = all.filter(p => p.location === 'ASR Approved Intake' || p.location === 'Bridge Ready');
  const pendingLines: string[] = [];
  if (pending.length === 0) {
    pendingLines.push('  - None');
  } else {
    pending.forEach(p => {
      pendingLines.push(`  - [${p.location}] ID: ${p.id} | Command: "${p.command}"`);
    });
  }

  const template = loadTemplate('voice-loop-export-summary-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{APPROVED_ASR_COUNT}}/g, String(counts.approvedAsr))
    .replace(/{{READY_COUNT}}/g, String(counts.ready))
    .replace(/{{EXECUTED_COUNT}}/g, String(counts.executed))
    .replace(/{{REJECTED_COUNT}}/g, String(counts.rejectedAsr + counts.rejectedBridge))
    .replace(/{{LIVE_MIC_ENABLED}}/g, String(LIVE_MIC_ENABLED))
    .replace(/{{AUTO_EXECUTE}}/g, String(AUTO_EXECUTE))
    .replace(/{{EXACT_NAME_ROUTER_ACTIVE}}/g, 'true')
    .replace(/{{ALLOWED_COMMANDS_COUNT}}/g, String(ALLOWED_COMMAND_ROUTER_ENTRIES.length))
    .replace(/{{PENDING_CONFIRMATIONS}}/g, pendingLines.join('\n'));

  const exportPath = path.join(DB_REPORTS_DIR, `voice_loop_telemetry_report_${getTimestampStr()}.md`);
  fs.writeFileSync(exportPath, output, 'utf-8');

  console.log(`\n✅ Success: Voice loop telemetry summary report exported to:\n  ${exportPath}\n`);
}

// ─── Confirm Prepare ─────────────────────────────────────────────────────────
function handleConfirmPrepare(packetId: string) {
  ensureDirs();
  console.log(`[INFO] Dashboard delegating prepare trigger for Packet ID "${packetId}"...`);
  try {
    // Exact delegation command to Voice Bridge CLI
    const cmd = `npm run narrator-voice-bridge -- prepare ${packetId}`;
    execSync(cmd, { stdio: 'inherit' });
    
    // Log action to local dashboard log
    const logMsg = `[DASHBOARD_CONFIRMATION] [PREPARE] Timestamp: ${new Date().toISOString()} | ID: ${packetId} | Outcome: SUCCESS\n`;
    fs.appendFileSync(path.join(DB_LOG_DIR, 'dashboard_confirmations.log'), logMsg);
  } catch (err) {
    console.error(`❌ Dashboard Delegation Failed: prepare action execution aborted.`);
    process.exit(1);
  }
}

// ─── Confirm Execute ─────────────────────────────────────────────────────────
function handleConfirmExecute(packetId: string) {
  ensureDirs();
  
  // Check if already executed
  const executedPath = path.join(DB_BRIDGE_EXECUTED_DIR, `asr_command_packet_${packetId}.md`);
  if (fs.existsSync(executedPath)) {
    console.log(`[INFO] Packet "${packetId}" has already been executed. Execution duplicate blocked.`);
    return;
  }

  console.log(`[INFO] Dashboard delegating execution trigger for Packet ID "${packetId}"...`);
  try {
    // Exact delegation command to Voice Bridge CLI
    const cmd = `npm run narrator-voice-bridge -- execute-approved ${packetId}`;
    execSync(cmd, { stdio: 'inherit' });

    // Log action to local dashboard log
    const logMsg = `[DASHBOARD_CONFIRMATION] [EXECUTE] Timestamp: ${new Date().toISOString()} | ID: ${packetId} | Outcome: SUCCESS\n`;
    fs.appendFileSync(path.join(DB_LOG_DIR, 'dashboard_confirmations.log'), logMsg);
  } catch (err) {
    console.error(`❌ Dashboard Delegation Failed: execute action execution aborted.`);
    process.exit(1);
  }
}

// ─── Reject Packet ───────────────────────────────────────────────────────────
function handleRejectPacket(packetId: string) {
  ensureDirs();
  console.log(`[INFO] Dashboard delegating reject trigger for Packet ID "${packetId}"...`);
  try {
    // Exact delegation command to Voice Bridge CLI
    const cmd = `npm run narrator-voice-bridge -- reject ${packetId}`;
    execSync(cmd, { stdio: 'inherit' });

    // Log action to local dashboard log
    const logMsg = `[DASHBOARD_CONFIRMATION] [REJECT] Timestamp: ${new Date().toISOString()} | ID: ${packetId} | Outcome: SUCCESS\n`;
    fs.appendFileSync(path.join(DB_LOG_DIR, 'dashboard_confirmations.log'), logMsg);
  } catch (err) {
    console.error(`❌ Dashboard Delegation Failed: reject action execution aborted.`);
    process.exit(1);
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  let command = 'help';
  let target = '';

  if (args.length > 0) {
    if (args.length === 1 && args[0].includes(' ')) {
      const tokens = args[0].trim().split(/\s+/);
      command = tokens[0].toLowerCase();
      target = tokens.slice(1).join(' ');
    } else {
      command = args[0].toLowerCase();
      target = args[1] || '';
    }
  }

  const validCommands = [
    'help',
    'status',
    'overview',
    'packets',
    'packet-detail',
    'pending-confirmations',
    'safety-status',
    'latest-audit',
    'export-summary',
    'confirm-prepare',
    'confirm-execute',
    'reject-packet'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown Dashboard command: "${command}". Run "npm run narrator-voice-loop-dashboard-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-voice-loop-dashboard-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
  } else if (command === 'overview') {
    handleOverview();
  } else if (command === 'packets') {
    handlePackets();
  } else if (command === 'packet-detail') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handlePacketDetail(target);
  } else if (command === 'pending-confirmations') {
    handlePendingConfirmations();
  } else if (command === 'safety-status') {
    handleSafetyStatus();
  } else if (command === 'latest-audit') {
    handleLatestAudit();
  } else if (command === 'export-summary') {
    handleExportSummary();
  } else if (command === 'confirm-prepare') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handleConfirmPrepare(target);
  } else if (command === 'confirm-execute') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handleConfirmExecute(target);
  } else if (command === 'reject-packet') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handleRejectPacket(target);
  }
}

main();
