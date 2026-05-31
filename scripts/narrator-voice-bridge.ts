import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  BRIDGE_APPROVED_ASR_DIR,
  BRIDGE_READY_DIR,
  BRIDGE_EXECUTED_DIR,
  BRIDGE_REJECTED_DIR,
  BRIDGE_LOG_DIR,
  BRIDGE_TEMPLATE_DIR,
  ALLOWED_COMMAND_ROUTER_ENTRIES,
  EXACT_NAME_REQUIRED,
  AUTO_EXECUTE_APPROVED_PACKETS,
  MANUAL_EXECUTION_REQUIRED,
  RAW_SHELL_EXECUTION_ALLOWED,
  TRANSCRIPT_TEXT_EXECUTION_ALLOWED,
  MAX_PACKET_AGE_MS,
  MAX_COMMAND_LENGTH,
  MIN_COMMAND_CONFIDENCE,
  DEFAULT_EXECUTION_MODE,
  FORBIDDEN_EXECUTION_PATTERNS
} from '../config/narrator-voice-bridge.config.js';

function ensureDirs() {
  fs.mkdirSync(BRIDGE_READY_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_EXECUTED_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_REJECTED_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_LOG_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_TEMPLATE_DIR, { recursive: true });
}

// Read Markdown file and return its content or empty string
function readFileSafe(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

interface ParsedPacket {
  id: string;
  sourceAudio: string;
  confidence: number;
  stagedAt: string;
  transcript: string;
  command: string;
  status: string;
  rawContent: string;
}

function parsePacket(filePath: string): ParsedPacket | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract ID from filename or content
  const filename = path.basename(filePath);
  const idMatch = filename.match(/asr_command_packet_(.+)\.md/);
  const id = idMatch ? idMatch[1] : 'unknown';

  const audioMatch = content.match(/Source Audio:\s*`([^`]+)`/i);
  const sourceAudio = audioMatch ? audioMatch[1] : 'unknown';

  const confMatch = content.match(/Confidence:\s*`([^`]+)`/i);
  const confidence = confMatch ? parseFloat(confMatch[1]) : 0;

  const stagedAtMatch = content.match(/\*Staged At:\s*([^*\n\r]+)\*/i);
  const stagedAt = stagedAtMatch ? stagedAtMatch[1].trim() : new Date().toISOString();

  const transcriptMatch = content.match(/```text\s*([\s\S]*?)\s*```/i);
  const transcript = transcriptMatch ? transcriptMatch[1].trim() : '';

  const cmdMatch = content.match(/Executable Command:\s*`([^`]+)`/i);
  const command = cmdMatch ? cmdMatch[1] : '';

  const statusMatch = content.match(/Status:\s*`([^`]+)`/i);
  const status = statusMatch ? statusMatch[1] : 'unknown';

  return {
    id,
    sourceAudio,
    confidence,
    stagedAt,
    transcript,
    command,
    status,
    rawContent: content
  };
}

function loadTemplate(name: string): string {
  const tplPath = path.join(BRIDGE_TEMPLATE_DIR, `${name}.md`);
  if (fs.existsSync(tplPath)) {
    return fs.readFileSync(tplPath, 'utf-8');
  }
  return '';
}

// ─── Status ──────────────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const template = loadTemplate('voice-bridge-status-template');

  const pendingApproved = fs.existsSync(BRIDGE_APPROVED_ASR_DIR)
    ? fs.readdirSync(BRIDGE_APPROVED_ASR_DIR).filter(f => f.endsWith('.md')).length
    : 0;
  const readyCount = fs.readdirSync(BRIDGE_READY_DIR).filter(f => f.endsWith('.md')).length;
  const executedCount = fs.readdirSync(BRIDGE_EXECUTED_DIR).filter(f => f.endsWith('.md')).length;
  const rejectedCount = fs.readdirSync(BRIDGE_REJECTED_DIR).filter(f => f.endsWith('.md')).length;

  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{APPROVED_DIR}}/g, BRIDGE_APPROVED_ASR_DIR)
    .replace(/{{READY_DIR}}/g, BRIDGE_READY_DIR)
    .replace(/{{EXECUTED_DIR}}/g, BRIDGE_EXECUTED_DIR)
    .replace(/{{REJECTED_DIR}}/g, BRIDGE_REJECTED_DIR)
    .replace(/{{EXACT_NAME_REQUIRED}}/g, String(EXACT_NAME_REQUIRED))
    .replace(/{{AUTO_EXECUTE_APPROVED}}/g, String(AUTO_EXECUTE_APPROVED_PACKETS))
    .replace(/{{MANUAL_EXECUTION_REQUIRED}}/g, String(MANUAL_EXECUTION_REQUIRED))
    .replace(/{{RAW_SHELL_ALLOWED}}/g, String(RAW_SHELL_EXECUTION_ALLOWED))
    .replace(/{{ALLOWED_COMMANDS_COUNT}}/g, String(ALLOWED_COMMAND_ROUTER_ENTRIES.length))
    .replace(/{{PENDING_APPROVED_COUNT}}/g, String(pendingApproved))
    .replace(/{{READY_COUNT}}/g, String(readyCount))
    .replace(/{{EXECUTED_COUNT}}/g, String(executedCount))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedCount));

  console.log(output);
}

// ─── Scan Approved ───────────────────────────────────────────────────────────
function handleScanApproved() {
  ensureDirs();
  console.log(`\n🔍 Scanning Approved ASR Directory: ${BRIDGE_APPROVED_ASR_DIR}`);

  if (!fs.existsSync(BRIDGE_APPROVED_ASR_DIR)) {
    console.log('No approved ASR directory found.');
    return;
  }

  const files = fs.readdirSync(BRIDGE_APPROVED_ASR_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('No approved ASR packets found. Intake is empty.');
    return;
  }

  console.log(`Found ${files.length} approved packet(s):`);
  for (const file of files) {
    const fullPath = path.join(BRIDGE_APPROVED_ASR_DIR, file);
    const packet = parsePacket(fullPath);
    if (packet) {
      console.log(`  - ID: ${packet.id} | Command: "${packet.command}" | Confidence: ${packet.confidence}`);
    } else {
      console.log(`  - File: ${file} (failed to parse)`);
    }
  }
  console.log('');
}

// ─── Inspect ─────────────────────────────────────────────────────────────────
function handleInspect(packetId: string) {
  ensureDirs();
  const filePath = path.join(BRIDGE_APPROVED_ASR_DIR, `asr_command_packet_${packetId}.md`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: Approved ASR packet ID "${packetId}" not found in intake.`);
    process.exit(1);
  }

  const packet = parsePacket(filePath);
  if (!packet) {
    console.error(`❌ Error: Failed to parse packet ID "${packetId}".`);
    process.exit(1);
  }

  const isAllowlisted = ALLOWED_COMMAND_ROUTER_ENTRIES.includes(packet.command);
  const containsForbidden = FORBIDDEN_EXECUTION_PATTERNS.some(p => packet.command.includes(p));
  const isTooLong = packet.command.length > MAX_COMMAND_LENGTH;

  let riskStatus = 'Low Risk';
  if (containsForbidden) {
    riskStatus = 'HIGH RISK: Forbidden Patterns Detected';
  } else if (isTooLong) {
    riskStatus = 'Medium Risk: Command Exceeds Length Limit';
  } else if (!isAllowlisted) {
    riskStatus = 'Medium Risk: Command Not in Allowlist';
  }

  const packetAge = Date.now() - new Date(packet.stagedAt).getTime();

  const template = loadTemplate('voice-bridge-inspect-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{PACKET_ID}}/g, packet.id)
    .replace(/{{AUDIO_FILE}}/g, packet.sourceAudio)
    .replace(/{{CONFIDENCE_SCORE}}/g, String(packet.confidence))
    .replace(/{{PACKET_AGE_MS}}/g, String(packetAge))
    .replace(/{{TRANSCRIPT_TEXT}}/g, packet.transcript)
    .replace(/{{CLI_COMMAND}}/g, packet.command)
    .replace(/{{IS_ALLOWLISTED}}/g, String(isAllowlisted))
    .replace(/{{RISK_STATUS}}/g, riskStatus)
    .replace(/{{VALIDITY_STATUS}}/g, isAllowlisted && !containsForbidden && !isTooLong ? 'Passed checks' : 'Fails validation check');

  console.log(output);
}

// ─── Validate ────────────────────────────────────────────────────────────────
function getValidationStatus(packet: ParsedPacket): { valid: boolean; errorMsg: string; violations: string } {
  if (!packet.command) {
    return { valid: false, errorMsg: 'Mapped command payload is missing or empty.', violations: 'MISSING_COMMAND' };
  }

  // Allowlist match
  const isAllowlisted = ALLOWED_COMMAND_ROUTER_ENTRIES.includes(packet.command);
  if (!isAllowlisted) {
    return { 
      valid: false, 
      errorMsg: `Command "${packet.command}" is not in the allowed whitelisted commands router list.`, 
      violations: 'UNAUTHORIZED_COMMAND' 
    };
  }

  // Length check
  if (packet.command.length > MAX_COMMAND_LENGTH) {
    return { 
      valid: false, 
      errorMsg: `Command length (${packet.command.length} characters) exceeds the security limit of ${MAX_COMMAND_LENGTH}.`, 
      violations: 'COMMAND_TOO_LONG' 
    };
  }

  // Forbidden patterns (injection check)
  for (const pat of FORBIDDEN_EXECUTION_PATTERNS) {
    if (packet.command.includes(pat)) {
      return { 
        valid: false, 
        errorMsg: `Command contains forbidden execution shell pattern/operator: "${pat}".`, 
        violations: 'FORBIDDEN_OPERATORS_DETECTED' 
      };
    }
  }

  // Confidence check
  if (packet.confidence < MIN_COMMAND_CONFIDENCE) {
    return { 
      valid: false, 
      errorMsg: `ASR transcript confidence (${packet.confidence}) is below the required gate threshold of ${MIN_COMMAND_CONFIDENCE}.`, 
      violations: 'CONFIDENCE_BELOW_THRESHOLD' 
    };
  }

  // Packet age check
  const packetAge = Date.now() - new Date(packet.stagedAt).getTime();
  if (packetAge > MAX_PACKET_AGE_MS) {
    return { 
      valid: false, 
      errorMsg: `Packet age (${(packetAge / 1020 / 60).toFixed(1)} mins) exceeds the security freshness lifetime limit of ${MAX_PACKET_AGE_MS / 1020 / 60} mins.`, 
      violations: 'EXPIRED_PACKET' 
    };
  }

  return { valid: true, errorMsg: '', violations: 'NONE' };
}

function handleValidate(packetId: string): boolean {
  ensureDirs();
  const filePath = path.join(BRIDGE_APPROVED_ASR_DIR, `asr_command_packet_${packetId}.md`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: Approved ASR packet ID "${packetId}" not found in intake.`);
    process.exit(1);
  }

  const packet = parsePacket(filePath);
  if (!packet) {
    console.error(`❌ Error: Failed to parse packet ID "${packetId}".`);
    process.exit(1);
  }

  const validation = getValidationStatus(packet);
  const template = loadTemplate('voice-bridge-validation-template');

  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{PACKET_ID}}/g, packet.id)
    .replace(/{{HAS_MAPPED_COMMAND}}/g, packet.command ? 'Passed' : 'Failed')
    .replace(/{{IS_WHITELISTED}}/g, ALLOWED_COMMAND_ROUTER_ENTRIES.includes(packet.command) ? 'Passed' : 'Failed')
    .replace(/{{MAX_LEN}}/g, String(MAX_COMMAND_LENGTH))
    .replace(/{{IS_SAFE_LENGTH}}/g, packet.command.length <= MAX_COMMAND_LENGTH ? 'Passed' : 'Failed')
    .replace(/{{NO_SHELL_INJECTION}}/g, validation.violations !== 'FORBIDDEN_OPERATORS_DETECTED' ? 'Passed' : 'Failed')
    .replace(/{{IS_FRESH_PACKET}}/g, validation.violations !== 'EXPIRED_PACKET' ? 'Passed' : 'Failed')
    .replace(/{{IS_CONFIDENT}}/g, packet.confidence >= MIN_COMMAND_CONFIDENCE ? 'Passed' : 'Failed')
    .replace(/{{VALIDATION_STATUS}}/g, validation.valid ? 'PASSED / SECURE' : 'FAILED / BLOCKED')
    .replace(/{{EXECUTION_MODE}}/g, DEFAULT_EXECUTION_MODE)
    .replace(/{{ERROR_MESSAGE}}/g, validation.valid ? 'None. Mapped command matches allowlist schema.' : validation.errorMsg);

  console.log(output);

  // If failed, log error
  if (!validation.valid) {
    const errorTemplate = loadTemplate('voice-bridge-error-template');
    const errOutput = errorTemplate
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
      .replace(/{{PACKET_ID}}/g, packet.id)
      .replace(/{{ACTION_BLOCKED}}/g, 'Validation Gate')
      .replace(/{{CLI_COMMAND}}/g, packet.command)
      .replace(/{{ERROR_MESSAGE}}/g, validation.errorMsg)
      .replace(/{{VIOLATIONS}}/g, validation.violations);

    fs.writeFileSync(path.join(BRIDGE_LOG_DIR, `voice_bridge_error_validation_${packet.id}_${getTimestampStr()}.md`), errOutput, 'utf-8');
  }

  return validation.valid;
}

// ─── Prepare ─────────────────────────────────────────────────────────────────
function handlePrepare(packetId: string) {
  ensureDirs();
  const filePath = path.join(BRIDGE_APPROVED_ASR_DIR, `asr_command_packet_${packetId}.md`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: Approved ASR packet ID "${packetId}" not found in intake.`);
    process.exit(1);
  }

  const packet = parsePacket(filePath);
  if (!packet) {
    console.error(`❌ Error: Failed to parse packet ID "${packetId}".`);
    process.exit(1);
  }

  // Execute validation first
  const isValid = handleValidate(packetId);
  if (!isValid) {
    console.error(`❌ Error: Command packet validation failed. Ready-state preparation blocked.`);
    process.exit(1);
  }

  // Update status in markdown file content
  let content = packet.rawContent;
  content = content.replace(/Status:\s*`[^`]+`/g, 'Status: `bridge_ready_for_execution`');

  const destPath = path.join(BRIDGE_READY_DIR, `asr_command_packet_${packetId}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');

  console.log(`\n✅ Ready: Staged command packet "${packetId}" successfully validated and prepared at:\n  ${destPath}`);
}

// ─── Execute Approved ────────────────────────────────────────────────────────
function handleExecuteApproved(packetId: string) {
  ensureDirs();
  const approvedPath = path.join(BRIDGE_APPROVED_ASR_DIR, `asr_command_packet_${packetId}.md`);
  const readyPath = path.join(BRIDGE_READY_DIR, `asr_command_packet_${packetId}.md`);

  if (!fs.existsSync(approvedPath)) {
    console.error(`❌ Error: Packet ID "${packetId}" is missing from ASR approved list.`);
    process.exit(1);
  }

  if (!fs.existsSync(readyPath)) {
    console.error(`❌ Error: Command packet ID "${packetId}" has not been prepared. Please run "prepare ${packetId}" first.`);
    process.exit(1);
  }

  const packet = parsePacket(readyPath);
  if (!packet) {
    console.error(`❌ Error: Failed to parse packet ID "${packetId}" from ready queue.`);
    process.exit(1);
  }

  // Re-run validation for active freshness/security check
  const validation = getValidationStatus(packet);
  if (!validation.valid) {
    console.error(`❌ Error: Stale or modified command validation failed at run-time: ${validation.errorMsg}`);
    process.exit(1);
  }

  console.log(`\n🚀 Dispatching Command to Router:\n  ${packet.command}\n`);

  let stdoutSummary = '';
  let stderrSummary = '';
  let exitCode = 0;
  let runOutcome = 'SUCCESS';

  try {
    const stdout = execSync(packet.command, { encoding: 'utf-8' });
    stdoutSummary = stdout.trim();
    console.log(stdoutSummary);
  } catch (err) {
    exitCode = (err as any).status || 1;
    runOutcome = 'FAILURE';
    stdoutSummary = (err as any).stdout ? (err as any).stdout.trim() : '';
    stderrSummary = (err as any).stderr ? (err as any).stderr.trim() : (err as Error).message;
    console.error(`❌ Dispatch Failed (exit code: ${exitCode}):\n${stderrSummary}`);
  }

  // Log audit execution log
  const logTemplate = loadTemplate('voice-bridge-execution-log-template');
  const executionLog = logTemplate
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{PACKET_ID}}/g, packet.id)
    .replace(/{{CLI_COMMAND}}/g, packet.command)
    .replace(/{{EXACT_ROUTER_COMMAND}}/g, packet.command.replace('npm run command -- ', '').replace(/"/g, ''))
    .replace(/{{EXIT_CODE}}/g, String(exitCode))
    .replace(/{{RUN_OUTCOME}}/g, runOutcome)
    .replace(/{{STDOUT_SUMMARY}}/g, stdoutSummary || 'No stdout returned.')
    .replace(/{{STDERR_SUMMARY}}/g, stderrSummary || 'No stderr returned.');

  const logFile = path.join(BRIDGE_LOG_DIR, `voice_bridge_run_${packet.id}_${getTimestampStr()}.md`);
  fs.writeFileSync(logFile, executionLog, 'utf-8');

  // Move packet to executed folder and remove from ready folder
  let updatedContent = packet.rawContent;
  updatedContent = updatedContent
    .replace(/Status:\s*`[^`]+`/g, `Status: \`bridge_executed_status_${runOutcome.toLowerCase()}\``)
    .replace(/Executed:\s*`[^`]+`/g, 'Executed: `true`');

  fs.writeFileSync(path.join(BRIDGE_EXECUTED_DIR, `asr_command_packet_${packetId}.md`), updatedContent, 'utf-8');
  fs.unlinkSync(readyPath);

  console.log(`\n✅ Audit execution completed. Log written to:\n  ${logFile}\n`);
}

// ─── Reject ──────────────────────────────────────────────────────────────────
function handleReject(packetId: string) {
  ensureDirs();
  const approvedPath = path.join(BRIDGE_APPROVED_ASR_DIR, `asr_command_packet_${packetId}.md`);
  const readyPath = path.join(BRIDGE_READY_DIR, `asr_command_packet_${packetId}.md`);

  let targetPath = '';
  if (fs.existsSync(readyPath)) {
    targetPath = readyPath;
  } else if (fs.existsSync(approvedPath)) {
    targetPath = approvedPath;
  } else {
    console.error(`❌ Error: Command packet ID "${packetId}" not found in approved intake or ready queue.`);
    process.exit(1);
  }

  const packet = parsePacket(targetPath);
  if (!packet) {
    console.error(`❌ Error: Failed to parse packet ID "${packetId}".`);
    process.exit(1);
  }

  let content = packet.rawContent;
  content = content.replace(/Status:\s*`[^`]+`/g, 'Status: `bridge_rejected`');

  const destPath = path.join(BRIDGE_REJECTED_DIR, `asr_command_packet_${packetId}.md`);
  fs.writeFileSync(destPath, content, 'utf-8');

  // Remove original files
  if (fs.existsSync(readyPath)) fs.unlinkSync(readyPath);
  if (fs.existsSync(approvedPath)) fs.unlinkSync(approvedPath);

  // Write log status
  const errorTemplate = loadTemplate('voice-bridge-error-template');
  const logOutput = errorTemplate
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{PACKET_ID}}/g, packet.id)
    .replace(/{{ACTION_BLOCKED}}/g, 'Manual operator reject')
    .replace(/{{CLI_COMMAND}}/g, packet.command)
    .replace(/{{ERROR_MESSAGE}}/g, 'Manually rejected by administrator through voice-bridge commands.')
    .replace(/{{VIOLATIONS}}/g, 'ADMINISTRATOR_REJECTION');

  fs.writeFileSync(path.join(BRIDGE_LOG_DIR, `voice_bridge_reject_${packet.id}_${getTimestampStr()}.md`), logOutput, 'utf-8');

  console.log(`\n❌ Rejected: Command packet "${packetId}" moved to bridge rejected directory.`);
}

// ─── Bridge Queue Status ─────────────────────────────────────────────────────
function handleQueueStatus() {
  ensureDirs();
  const approvedCount = fs.existsSync(BRIDGE_APPROVED_ASR_DIR)
    ? fs.readdirSync(BRIDGE_APPROVED_ASR_DIR).filter(f => f.endsWith('.md')).length
    : 0;
  const readyFiles = fs.readdirSync(BRIDGE_READY_DIR).filter(f => f.endsWith('.md'));
  const executedFiles = fs.readdirSync(BRIDGE_EXECUTED_DIR).filter(f => f.endsWith('.md'));
  const rejectedFiles = fs.readdirSync(BRIDGE_REJECTED_DIR).filter(f => f.endsWith('.md'));

  const queueLines: string[] = [];

  queueLines.push('### 📥 Approved ASR Command Packets (Pending Bridge Check):');
  if (approvedCount === 0) {
    queueLines.push('  - None');
  } else {
    fs.readdirSync(BRIDGE_APPROVED_ASR_DIR).filter(f => f.endsWith('.md')).forEach(f => {
      queueLines.push(`  - [Approved Intake] ${f}`);
    });
  }

  queueLines.push('\n### 🚀 Validated & Ready Bridge Command Packets:');
  if (readyFiles.length === 0) {
    queueLines.push('  - None');
  } else {
    for (const f of readyFiles) {
      queueLines.push(`  - [Bridge Ready] ${f}`);
    }
  }

  queueLines.push('\n### 🧾 Executed Command Logs:');
  if (executedFiles.length === 0) {
    queueLines.push('  - None');
  } else {
    for (const f of executedFiles) {
      queueLines.push(`  - [Executed] ${f}`);
    }
  }

  queueLines.push('\n### ❌ Rejected Command Logs:');
  if (rejectedFiles.length === 0) {
    queueLines.push('  - None');
  } else {
    for (const f of rejectedFiles) {
      queueLines.push(`  - [Rejected] ${f}`);
    }
  }

  const template = loadTemplate('voice-bridge-queue-summary-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{APPROVED_ASR_COUNT}}/g, String(approvedCount))
    .replace(/{{READY_COUNT}}/g, String(readyFiles.length))
    .replace(/{{EXECUTED_COUNT}}/g, String(executedFiles.length))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedFiles.length))
    .replace(/{{QUEUE_LOG}}/g, queueLines.join('\n'));

  console.log(output);

  // Log queue summary status
  fs.writeFileSync(path.join(BRIDGE_LOG_DIR, `voice_bridge_queue_summary_${getTimestampStr()}.md`), output, 'utf-8');
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
function handleAuditLog() {
  ensureDirs();
  console.log('\n=========================================');
  console.log('📋 Sentinel OS: Voice Bridge Audit Logs');
  console.log('=========================================');

  const files = fs.readdirSync(BRIDGE_LOG_DIR).filter(f => f.endsWith('.md')).sort();

  if (files.length === 0) {
    console.log('No bridge audit records found.');
    console.log('=========================================\n');
    return;
  }

  console.log(`Listing latest ${Math.min(files.length, 10)} records:`);
  for (const f of files.slice(-10)) {
    const stat = fs.statSync(path.join(BRIDGE_LOG_DIR, f));
    console.log(`  - ${f} (${stat.mtime.toISOString()})`);
  }
  console.log('=========================================\n');
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
    'scan-approved',
    'inspect',
    'validate',
    'prepare',
    'execute-approved',
    'reject',
    'bridge-queue-status',
    'audit-log'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown Voice Bridge command: "${command}". Run "npm run narrator-voice-bridge-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-voice-bridge-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
  } else if (command === 'scan-approved') {
    handleScanApproved();
  } else if (command === 'inspect') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handleInspect(target);
  } else if (command === 'validate') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handleValidate(target);
  } else if (command === 'prepare') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handlePrepare(target);
  } else if (command === 'execute-approved') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handleExecuteApproved(target);
  } else if (command === 'reject') {
    if (!target) {
      console.error('[ERR] Please specify a packet ID.');
      process.exit(1);
    }
    handleReject(target);
  } else if (command === 'bridge-queue-status') {
    handleQueueStatus();
  } else if (command === 'audit-log') {
    handleAuditLog();
  }
}

main();
