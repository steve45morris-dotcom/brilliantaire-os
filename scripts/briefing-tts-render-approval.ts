import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  BRIEFING_QUEUE_DIR,
  BRIEFING_APPROVED_DIR,
  BRIEFING_TTS_REQUEST_DIR,
  NARRATOR_TTS_PENDING_DIR,
  NARRATOR_TTS_APPROVED_DIR,
  NARRATOR_TTS_RENDERED_AUDIO_DIR,
  NARRATOR_TTS_LOGS_DIR,
  BRIEFING_FLOW_ROOT,
  BRIEFING_FLOW_SUBMITTED_DIR,
  BRIEFING_FLOW_APPROVED_DIR,
  BRIEFING_FLOW_RENDERED_DIR,
  BRIEFING_FLOW_BLOCKED_DIR,
  BRIEFING_FLOW_LOGS_DIR,
  BRIEFING_FLOW_REPORTS_DIR,
  ALLOWED_BRIEFING_SOURCE_STATUS,
  ALLOWED_TTS_FORMATS,
  DEFAULT_OUTPUT_FORMAT,
  AUTO_APPROVE_TTS,
  AUTO_RENDER_TTS,
  AUTO_PLAYBACK,
  CLOUD_TTS_ENABLED,
  DUPLICATE_RENDER_PROTECTION,
  MANUAL_CONFIRMATION_REQUIRED,
  MAX_BRIEFING_TEXT_LENGTH
} from '../config/briefing-tts-render-approval.config.js';

// Setup directories
const dirs = [
  BRIEFING_FLOW_ROOT,
  BRIEFING_FLOW_SUBMITTED_DIR,
  BRIEFING_FLOW_APPROVED_DIR,
  BRIEFING_FLOW_RENDERED_DIR,
  BRIEFING_FLOW_BLOCKED_DIR,
  BRIEFING_FLOW_LOGS_DIR,
  BRIEFING_FLOW_REPORTS_DIR,
  NARRATOR_TTS_PENDING_DIR,
  NARRATOR_TTS_APPROVED_DIR,
  NARRATOR_TTS_RENDERED_AUDIO_DIR,
  NARRATOR_TTS_LOGS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(BRIEFING_FLOW_LOGS_DIR, 'briefing_tts_render_approval.log');
const SNAPSHOT_JSON_FILE = path.join(BRIEFING_FLOW_REPORTS_DIR, 'dashboard_briefing_tts_snapshot.json');

function logEvent(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/briefing_tts_render_approval', templateName);
  if (!fs.existsSync(templatePath)) {
    return `Error: Template not found at ${templatePath}`;
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

// Counts files matching pattern
function countFiles(dir: string, filter?: (file: string) => boolean): number {
  if (!fs.existsSync(dir)) return 0;
  let list = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  if (filter) {
    list = list.filter(filter);
  }
  return list.length;
}

// Find files matching pattern
function findFiles(dir: string, pattern: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.includes(pattern) && !f.startsWith('.'));
}

// Core Operations

function handleStatus(quiet: boolean = false) {
  const generatedCount = countFiles(BRIEFING_TTS_REQUEST_DIR, f => f.startsWith('tts_request_') && f.endsWith('.md'));
  const submittedCount = countFiles(NARRATOR_TTS_PENDING_DIR, f => f.includes('briefing_'));
  const approvedCount = countFiles(NARRATOR_TTS_APPROVED_DIR, f => f.includes('briefing_'));
  const renderedCount = countFiles(NARRATOR_TTS_RENDERED_AUDIO_DIR, f => f.includes('briefing_'));
  const blockedCount = countFiles(BRIEFING_FLOW_BLOCKED_DIR);

  let latestBriefingId = 'None';
  let latestRenderedPath = 'None';

  const audioFiles = fs.readdirSync(NARRATOR_TTS_RENDERED_AUDIO_DIR)
    .filter(f => f.includes('briefing_') && !f.startsWith('.'))
    .sort();
  if (audioFiles.length > 0) {
    const latestFile = audioFiles[audioFiles.length - 1];
    latestRenderedPath = path.join(NARRATOR_TTS_RENDERED_AUDIO_DIR, latestFile);
    const match = latestFile.match(/narrator_audio_(briefing_.+)\.(mp3|wav)/);
    if (match) {
      latestBriefingId = match[1];
    }
  }

  // Write snapshot for dashboard export
  const snapshotData = {
    latestBriefingId,
    generatedTtsRequestCount: generatedCount,
    submittedRequestCount: submittedCount,
    approvedRequestCount: approvedCount,
    renderedAudioCount: renderedCount,
    blockedRequestCount: blockedCount,
    latestRenderedAudioPath: latestRenderedPath,
    cloudTtsStatus: CLOUD_TTS_ENABLED ? 'enabled' : 'disabled',
    autoPlaybackStatus: AUTO_PLAYBACK ? 'enabled' : 'disabled',
    manualApprovalRequired: MANUAL_CONFIRMATION_REQUIRED
  };
  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshotData, null, 2), 'utf-8');

  const statusMsg = fillTemplate('briefing-tts-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    BRIEFING_TTS_REQUEST_DIR,
    NARRATOR_TTS_PENDING_DIR,
    NARRATOR_TTS_APPROVED_DIR,
    NARRATOR_TTS_RENDERED_AUDIO_DIR,
    AUTO_APPROVE_TTS: String(AUTO_APPROVE_TTS),
    AUTO_RENDER_TTS: String(AUTO_RENDER_TTS),
    AUTO_PLAYBACK: String(AUTO_PLAYBACK),
    CLOUD_TTS_ENABLED: String(CLOUD_TTS_ENABLED),
    DUPLICATE_RENDER_PROTECTION: String(DUPLICATE_RENDER_PROTECTION),
    MANUAL_CONFIRMATION_REQUIRED: String(MANUAL_CONFIRMATION_REQUIRED),
    MAX_TEXT_LENGTH: String(MAX_BRIEFING_TEXT_LENGTH),
    GENERATED_COUNT: String(generatedCount),
    SUBMITTED_COUNT: String(submittedCount),
    APPROVED_COUNT: String(approvedCount),
    RENDERED_COUNT: String(renderedCount),
    BLOCKED_COUNT: String(blockedCount),
    LATEST_BRIEFING_ID: latestBriefingId,
    LATEST_RENDERED_PATH: latestRenderedPath
  });

  if (!quiet) {
    console.log(statusMsg);
  }
  return snapshotData;
}

function handleScanTtsRequests() {
  console.log(`\n======================================================`);
  console.log(`📡 Scanning Briefing TTS Request Packets`);
  console.log(`======================================================`);
  const files = findFiles(BRIEFING_TTS_REQUEST_DIR, 'tts_request_');
  if (files.length === 0) {
    console.log(`*No briefing TTS requests found under: ${BRIEFING_TTS_REQUEST_DIR}*`);
  } else {
    files.forEach(f => {
      const briefingId = f.replace('tts_request_', '').replace('.md', '');
      console.log(`- ID: ${briefingId} | File: ${f}`);
    });
  }
  console.log(`======================================================\n`);
}

function parseTtsRequest(briefingId: string): { text: string; voice: string; format: string; source: string; status: string } | null {
  const filePath = path.join(BRIEFING_TTS_REQUEST_DIR, `tts_request_${briefingId}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const textMatch = content.match(/## Text To Render\s*```text\s*([\s\S]*?)\s*```/i);
  const text = textMatch ? textMatch[1].trim() : '';

  const voiceMatch = content.match(/-\s+Voice Profile:\s*(.*)/i);
  const voice = voiceMatch ? voiceMatch[1].trim() : 'oracle-neutral';

  const formatMatch = content.match(/-\s+Render Format:\s*(.*)/i);
  const format = formatMatch ? formatMatch[1].trim() : 'mp3';

  const sourceMatch = content.match(/-\s+Source Voice Packet:\s*(.*)/i);
  const source = sourceMatch ? sourceMatch[1].trim() : '';

  const statusMatch = content.match(/## Request Status\s*([a-zA-Z0-9_]+)/i);
  const status = statusMatch ? statusMatch[1].trim() : 'pending_manual_approval';

  return { text, voice, format, source, status };
}

function handleInspect(briefingId: string) {
  if (!briefingId.startsWith('briefing_')) {
    console.error(`❌ Error: Malformed briefing ID "${briefingId}". Must start with "briefing_".`);
    process.exit(1);
  }

  const req = parseTtsRequest(briefingId);
  if (!req) {
    console.error(`❌ Error: Briefing TTS request file not found for "${briefingId}".`);
    process.exit(1);
  }

  // Find approved JSON to check risk level
  let riskLevel = 'Unknown';
  let reportPath = req.source || 'Unknown';
  const approvedJson = path.join(BRIEFING_APPROVED_DIR, `${briefingId}.json`);
  if (fs.existsSync(approvedJson)) {
    try {
      const meta = JSON.parse(fs.readFileSync(approvedJson, 'utf-8'));
      riskLevel = meta.riskLevel || 'Unknown';
      reportPath = meta.reportPath || reportPath;
    } catch (e) {}
  }

  const output = fillTemplate('briefing-tts-inspect-template.md', {
    TIMESTAMP: new Date().toISOString(),
    BRIEFING_ID: briefingId,
    VOICE_PROFILE: req.voice,
    OUTPUT_FORMAT: req.format,
    TEXT_LENGTH: String(req.text.length),
    RISK_LEVEL: riskLevel,
    SUMMARY_TEXT: req.text,
    SOURCE_REPORT_PATH: reportPath,
    CURRENT_STATUS: req.status
  });

  console.log(output);
}

function handleValidate(briefingId: string): boolean {
  if (!briefingId.startsWith('briefing_')) {
    console.error(`❌ Error: Malformed briefing ID "${briefingId}".`);
    process.exit(1);
  }

  const req = parseTtsRequest(briefingId);
  if (!req) {
    console.error(`❌ Error: Briefing request metadata for "${briefingId}" does not exist.`);
    return false;
  }

  const approvedJsonPath = path.join(BRIEFING_APPROVED_DIR, `${briefingId}.json`);
  const isSourceApproved = fs.existsSync(approvedJsonPath);

  const isTextSizeValid = req.text.length > 0 && req.text.length <= MAX_BRIEFING_TEXT_LENGTH;
  const isFormatAllowed = ALLOWED_TTS_FORMATS.includes(req.format);
  const isIdValid = briefingId.match(/^briefing_\d{4}-\d{2}-\d{2}$/) !== null;

  const verdictStatus = (isSourceApproved && isTextSizeValid && isFormatAllowed && isIdValid) ? 'PASSED' : 'FAILED';
  const details = verdictStatus === 'PASSED'
    ? 'All safety constraints, file sizes, and exact-name verification parameters validated successfully.'
    : `Validation failures detected: [Approved source: ${isSourceApproved}], [Text Size: ${req.text.length} (Max: ${MAX_BRIEFING_TEXT_LENGTH})], [Format Allowed: ${isFormatAllowed}], [ID Valid: ${isIdValid}]`;

  const reportContent = fillTemplate('briefing-tts-validation-template.md', {
    TIMESTAMP: new Date().toISOString(),
    BRIEFING_ID: briefingId,
    CHECK_SOURCE_APPROVED: isSourceApproved ? 'x' : ' ',
    CHECK_ID_VALID: isIdValid ? 'x' : ' ',
    CHECK_SIZE_VALID: isTextSizeValid ? 'x' : ' ',
    CHECK_FORMAT_ALLOWED: isFormatAllowed ? 'x' : ' ',
    TEXT_SIZE: String(req.text.length),
    MAX_TEXT_LIMIT: String(MAX_BRIEFING_TEXT_LENGTH),
    VERDICT_STATUS: verdictStatus,
    VERDICT_DETAILS: details
  });

  const reportPath = path.join(BRIEFING_FLOW_REPORTS_DIR, `validation_${briefingId}.md`);
  fs.writeFileSync(reportPath, reportContent, 'utf-8');

  if (verdictStatus === 'FAILED') {
    const errorReport = fillTemplate('briefing-tts-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      BRIEFING_ID: briefingId,
      COMMAND: 'validate',
      FAILURE_CATEGORY: 'Safety Constraints Validation Failure',
      ERROR_TEXT: details
    });
    fs.writeFileSync(path.join(BRIEFING_FLOW_BLOCKED_DIR, `error_validate_${briefingId}.md`), errorReport, 'utf-8');
    logEvent(`CRITICAL: Validation failed for ${briefingId}: ${details}`);
    console.log(reportContent);
    return false;
  }

  logEvent(`Validation PASSED for briefing ${briefingId}`);
  console.log(reportContent);
  return true;
}

function handleSubmitToTtsQueue(briefingId: string) {
  // First run validation
  const isValid = handleValidate(briefingId);
  if (!isValid) {
    console.error(`❌ Blocked: Briefing validation failed. Cannot submit to Narrator TTS queue.`);
    process.exit(1);
  }

  const sourceFile = path.join(BRIEFING_TTS_REQUEST_DIR, `tts_request_${briefingId}.md`);
  const targetFile = path.join(NARRATOR_TTS_PENDING_DIR, `tts_render_request_${briefingId}.md`);
  const localRecord = path.join(BRIEFING_FLOW_SUBMITTED_DIR, `briefing_tts_request_${briefingId}.md`);

  // Copy request markdown to the Narrator pending directory
  fs.copyFileSync(sourceFile, targetFile);
  fs.copyFileSync(sourceFile, localRecord);

  const reportContent = fillTemplate('briefing-tts-submit-template.md', {
    TIMESTAMP: new Date().toISOString(),
    BRIEFING_ID: briefingId,
    TARGET_PATH: localRecord,
    NARRATOR_QUEUE_PATH: targetFile
  });

  fs.writeFileSync(path.join(BRIEFING_FLOW_REPORTS_DIR, `submit_${briefingId}.md`), reportContent, 'utf-8');
  logEvent(`Onboarded: Submitted ${briefingId} to Narrator TTS Pending Queue`);

  console.log(reportContent);
}

function handleApproveTtsRequest(briefingId: string) {
  const pendingFile = path.join(NARRATOR_TTS_PENDING_DIR, `tts_render_request_${briefingId}.md`);
  if (!fs.existsSync(pendingFile)) {
    const errorMsg = `No submitted TTS request found for briefing "${briefingId}". Please submit-to-tts-queue first.`;
    console.error(`❌ Blocked: ${errorMsg}`);
    
    const errorReport = fillTemplate('briefing-tts-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      BRIEFING_ID: briefingId,
      COMMAND: 'approve-tts-request',
      FAILURE_CATEGORY: 'Order of Operations Violation',
      ERROR_TEXT: errorMsg
    });
    fs.writeFileSync(path.join(BRIEFING_FLOW_BLOCKED_DIR, `error_approve_${briefingId}.md`), errorReport, 'utf-8');
    process.exit(1);
  }

  // Read content and rewrite status from pending_manual_approval to approved
  let content = fs.readFileSync(pendingFile, 'utf-8');
  content = content.replace('pending_manual_approval', 'approved');

  const approvedFile = path.join(NARRATOR_TTS_APPROVED_DIR, `tts_render_request_${briefingId}.md`);
  const localApproved = path.join(BRIEFING_FLOW_APPROVED_DIR, `briefing_tts_request_${briefingId}.md`);

  fs.writeFileSync(approvedFile, content, 'utf-8');
  fs.writeFileSync(localApproved, content, 'utf-8');

  // Clean up pending file
  fs.unlinkSync(pendingFile);

  const reportContent = fillTemplate('briefing-tts-approval-template.md', {
    TIMESTAMP: new Date().toISOString(),
    BRIEFING_ID: briefingId,
    APPROVED_FOLDER_PATH: localApproved,
    NARRATOR_APPROVED_PATH: approvedFile
  });

  fs.writeFileSync(path.join(BRIEFING_FLOW_REPORTS_DIR, `approval_${briefingId}.md`), reportContent, 'utf-8');
  logEvent(`Approved: Briefing ${briefingId} manually authorized for TTS rendering`);

  console.log(reportContent);
}

function handleRenderApproved(briefingId: string) {
  const approvedFile = path.join(NARRATOR_TTS_APPROVED_DIR, `tts_render_request_${briefingId}.md`);
  
  if (!fs.existsSync(approvedFile)) {
    let errorMsg = `Request "${briefingId}" is not in the approved queue.`;
    const pendingFile = path.join(NARRATOR_TTS_PENDING_DIR, `tts_render_request_${briefingId}.md`);
    if (fs.existsSync(pendingFile)) {
      errorMsg = `Request "${briefingId}" is pending manual approval. Render is forbidden.`;
    }

    console.error(`❌ Blocked: ${errorMsg}`);
    const errorReport = fillTemplate('briefing-tts-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      BRIEFING_ID: briefingId,
      COMMAND: 'render-approved',
      FAILURE_CATEGORY: 'Unauthorized Render Request Intercepted',
      ERROR_TEXT: errorMsg
    });
    fs.writeFileSync(path.join(BRIEFING_FLOW_BLOCKED_DIR, `error_render_${briefingId}.md`), errorReport, 'utf-8');
    process.exit(1);
  }

  // Check cache before compiling
  const targetAudioFile = path.join(NARRATOR_TTS_RENDERED_AUDIO_DIR, `narrator_audio_${briefingId}.${DEFAULT_OUTPUT_FORMAT}`);
  const localAudioRecord = path.join(BRIEFING_FLOW_RENDERED_DIR, `narrator_audio_${briefingId}.${DEFAULT_OUTPUT_FORMAT}`);
  let cacheHit = 'false';

  if (DUPLICATE_RENDER_PROTECTION && fs.existsSync(targetAudioFile)) {
    console.log(`[INFO] Cache HIT: Audio for briefing "${briefingId}" already rendered at: ${targetAudioFile}`);
    cacheHit = 'true';
    if (!fs.existsSync(localAudioRecord)) {
      fs.copyFileSync(targetAudioFile, localAudioRecord);
    }
  } else {
    // Run the actual narrator-tts-renderer cli to perform local compilation
    console.log(`[INFO] Request approved. Invoking local narrator TTS renderer command...`);
    try {
      execSync(`npm run narrator-tts-renderer -- render ${briefingId}`, { stdio: 'inherit' });
      if (fs.existsSync(targetAudioFile)) {
        fs.copyFileSync(targetAudioFile, localAudioRecord);
      } else {
        throw new Error(`Renderer did not produce output audio at ${targetAudioFile}`);
      }
    } catch (e) {
      const errorMsg = `Piper compilation process failed: ${(e as Error).message}`;
      console.error(`❌ Error: ${errorMsg}`);
      const errorReport = fillTemplate('briefing-tts-error-template.md', {
        TIMESTAMP: new Date().toISOString(),
        BRIEFING_ID: briefingId,
        COMMAND: 'render-approved',
        FAILURE_CATEGORY: 'Local Compilation Failure',
        ERROR_TEXT: errorMsg
      });
      fs.writeFileSync(path.join(BRIEFING_FLOW_BLOCKED_DIR, `error_render_run_${briefingId}.md`), errorReport, 'utf-8');
      process.exit(1);
    }
  }

  const req = parseTtsRequest(briefingId);
  const reportContent = fillTemplate('briefing-tts-render-template.md', {
    TIMESTAMP: new Date().toISOString(),
    BRIEFING_ID: briefingId,
    VOICE_PROFILE: req ? req.voice : 'oracle-neutral',
    OUTPUT_FORMAT: DEFAULT_OUTPUT_FORMAT,
    OUTPUT_AUDIO_PATH: localAudioRecord,
    CACHE_HIT: cacheHit,
    APPROVED_CHECK: 'PASSED',
    RENDER_VERDICT: 'SUCCESS'
  });

  fs.writeFileSync(path.join(BRIEFING_FLOW_REPORTS_DIR, `render_${briefingId}.md`), reportContent, 'utf-8');
  logEvent(`Rendered: Briefing ${briefingId} offline TTS compilation succeeded (cacheHit: ${cacheHit})`);

  console.log(reportContent);
}

function handleRenderStatus(briefingId: string) {
  if (!briefingId.startsWith('briefing_')) {
    console.error(`❌ Error: Malformed briefing ID "${briefingId}".`);
    process.exit(1);
  }

  let status = 'unsubmitted';
  const pendingFile = path.join(NARRATOR_TTS_PENDING_DIR, `tts_render_request_${briefingId}.md`);
  const approvedFile = path.join(NARRATOR_TTS_APPROVED_DIR, `tts_render_request_${briefingId}.md`);
  const renderedFile = path.join(NARRATOR_TTS_RENDERED_AUDIO_DIR, `narrator_audio_${briefingId}.${DEFAULT_OUTPUT_FORMAT}`);
  const hasBlocked = countFiles(BRIEFING_FLOW_BLOCKED_DIR, f => f.includes(briefingId)) > 0;

  if (fs.existsSync(renderedFile)) {
    status = 'rendered';
  } else if (fs.existsSync(approvedFile)) {
    status = 'approved';
  } else if (fs.existsSync(pendingFile)) {
    status = 'pending';
  } else if (hasBlocked) {
    status = 'blocked';
  }

  console.log(`======================================================`);
  console.log(`🔎 Briefing State Tracker [${briefingId}]`);
  console.log(`======================================================`);
  console.log(`- Briefing ID: ${briefingId}`);
  console.log(`- Lifecycle Phase State: ${status.toUpperCase()}`);
  console.log(`======================================================`);
}

function handleLatest() {
  const approvedJsonFiles = fs.readdirSync(BRIEFING_APPROVED_DIR)
    .filter(f => f.startsWith('briefing_') && f.endsWith('.json'))
    .sort();
  if (approvedJsonFiles.length === 0) {
    console.log(`*No approved briefing packets found in the queue.*`);
    return;
  }
  const latestFile = approvedJsonFiles[approvedJsonFiles.length - 1];
  const briefingId = latestFile.replace('.json', '');
  console.log(`\n🆕 Latest Briefing Queue Item:`);
  handleRenderStatus(briefingId);
}

function handleQueueSummary() {
  const generatedCount = countFiles(BRIEFING_TTS_REQUEST_DIR, f => f.startsWith('tts_request_') && f.endsWith('.md'));
  const submittedCount = countFiles(NARRATOR_TTS_PENDING_DIR, f => f.includes('briefing_'));
  const approvedCount = countFiles(NARRATOR_TTS_APPROVED_DIR, f => f.includes('briefing_'));
  const renderedCount = countFiles(NARRATOR_TTS_RENDERED_AUDIO_DIR, f => f.includes('briefing_'));
  const blockedCount = countFiles(BRIEFING_FLOW_BLOCKED_DIR);

  const files = findFiles(BRIEFING_TTS_REQUEST_DIR, 'tts_request_');
  let trackingText = '';
  if (files.length === 0) {
    trackingText = '*No items queued.*';
  } else {
    files.forEach(f => {
      const briefingId = f.replace('tts_request_', '').replace('.md', '');
      let state = 'unsubmitted';
      if (fs.existsSync(path.join(NARRATOR_TTS_RENDERED_AUDIO_DIR, `narrator_audio_${briefingId}.${DEFAULT_OUTPUT_FORMAT}`))) {
        state = 'rendered';
      } else if (fs.existsSync(path.join(NARRATOR_TTS_APPROVED_DIR, `tts_render_request_${briefingId}.md`))) {
        state = 'approved';
      } else if (fs.existsSync(path.join(NARRATOR_TTS_PENDING_DIR, `tts_render_request_${briefingId}.md`))) {
        state = 'pending';
      }
      trackingText += `- ID: \`${briefingId}\` | State: \`${state.toUpperCase()}\` \n`;
    });
  }

  const summary = fillTemplate('briefing-tts-queue-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    SUBMITTED_COUNT: String(submittedCount),
    APPROVED_COUNT: String(approvedCount),
    RENDERED_COUNT: String(renderedCount),
    BLOCKED_COUNT: String(blockedCount),
    QUEUE_TRACKING_DETAILS: trackingText
  });

  const summaryPath = path.join(BRIEFING_FLOW_REPORTS_DIR, 'briefing_tts_queue_summary.md');
  fs.writeFileSync(summaryPath, summary, 'utf-8');
  console.log(`✅ Queue summary report generated at: ${summaryPath}`);
  console.log(summary);
}

function handleRenderLog() {
  if (fs.existsSync(LOG_FILE)) {
    console.log(`\n======================================================`);
    console.log(`📝 Briefing Render & Approval Event Logs`);
    console.log(`======================================================`);
    console.log(fs.readFileSync(LOG_FILE, 'utf-8'));
    console.log(`======================================================\n`);
  } else {
    console.log(`*No logs recorded yet.*`);
  }
}

// CLI Command Router
function main() {
  const args = process.argv.slice(2);
  let command = 'help';
  let arg = '';

  if (args.length > 0) {
    if (args.length === 1 && args[0].includes(' ')) {
      const tokens = args[0].trim().split(/\s+/);
      command = tokens[0].toLowerCase();
      arg = tokens[1] || '';
    } else {
      command = args[0].toLowerCase();
      arg = args[1] || '';
    }
  }

  const validCommands = [
    'help',
    'status',
    'scan-tts-requests',
    'inspect',
    'validate',
    'submit-to-tts-queue',
    'approve-tts-request',
    'render-approved',
    'render-status',
    'latest',
    'queue-summary',
    'render-log'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run briefing-tts-render-approval-help" for options.`);
    process.exit(1);
  }

  switch (command) {
    case 'help':
      console.log('Run "npm run briefing-tts-render-approval-help" to see available options.');
      break;
    case 'status':
      handleStatus();
      break;
    case 'scan-tts-requests':
      handleScanTtsRequests();
      break;
    case 'inspect':
      if (!arg) {
        console.error('[ERR] Please specify a BRIEFING_ID (e.g. inspect briefing_2026-05-31).');
        process.exit(1);
      }
      handleInspect(arg);
      break;
    case 'validate':
      if (!arg) {
        console.error('[ERR] Please specify a BRIEFING_ID.');
        process.exit(1);
      }
      const val = handleValidate(arg);
      if (!val) process.exit(1);
      break;
    case 'submit-to-tts-queue':
      if (!arg) {
        console.error('[ERR] Please specify a BRIEFING_ID.');
        process.exit(1);
      }
      handleSubmitToTtsQueue(arg);
      break;
    case 'approve-tts-request':
      if (!arg) {
        console.error('[ERR] Please specify a BRIEFING_ID.');
        process.exit(1);
      }
      handleApproveTtsRequest(arg);
      break;
    case 'render-approved':
      if (!arg) {
        console.error('[ERR] Please specify a BRIEFING_ID.');
        process.exit(1);
      }
      handleRenderApproved(arg);
      break;
    case 'render-status':
      if (!arg) {
        console.error('[ERR] Please specify a BRIEFING_ID.');
        process.exit(1);
      }
      handleRenderStatus(arg);
      break;
    case 'latest':
      handleLatest();
      break;
    case 'queue-summary':
      handleQueueSummary();
      break;
    case 'render-log':
      handleRenderLog();
      break;
  }
}

main();
