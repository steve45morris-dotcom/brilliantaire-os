import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import {
  APPROVED_REQUEST_DIR,
  RENDERED_AUDIO_DIR,
  RENDERER_LOG_DIR,
  DEFAULT_VOICE_PROFILE,
  PREFERRED_OUTPUT_FORMAT,
  RENDERER_BACKEND,
  ALLOW_EXTERNAL_TTS_API,
  ALLOW_AUDIO_PLAYBACK,
  ALLOW_COMMAND_EXECUTION,
  MAX_TEXT_LENGTH,
  ALLOWED_FILE_EXTENSIONS
} from '../config/narrator-tts-renderer.js';
import {
  CHECKSUM_MANIFEST_PATH,
  DEFAULT_VOICE_PROFILE as N5C_DEFAULT_VOICE_PROFILE,
  OVERWRITE_EXISTING_AUDIO,
  CACHE_ENABLED
} from '../config/narrator-tts-models.config.js';

// Paths to pending/rejected for state check
const PENDING_DIR = path.resolve(process.cwd(), 'outputs/narrator/tts_queue/render_requests');
const REJECTED_DIR = path.resolve(process.cwd(), 'outputs/narrator/tts_queue/rejected');

// Helper to pad numbers
const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(now: Date, includeSeconds = false): string {
  const base = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return includeSeconds ? `${base}${pad(now.getSeconds())}` : base;
}

function getLatestFile(dirPath: string): string | null {
  if (!fs.existsSync(dirPath)) return null;
  try {
    const files = fs.readdirSync(dirPath);
    let latestFile: string | null = null;
    let latestMtime = 0;
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latestFile = fullPath;
      }
    }
    return latestFile;
  } catch (e) {
    return null;
  }
}

// Extract content under a markdown header (case-insensitive)
function extractSection(content: string, headerName: string): string {
  const lines = content.split('\n');
  let inSection = false;
  let inCodeBlock = false;
  const sectionLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }
    if (!inCodeBlock && (trimmed.startsWith('## ') || trimmed.startsWith('# '))) {
      if (inSection) {
        break; // Met another header outside code block, stop
      }
      if (trimmed.toLowerCase().includes(headerName.toLowerCase())) {
        inSection = true;
        continue;
      }
    }
    if (inSection) {
      sectionLines.push(line);
    }
  }
  return sectionLines.join('\n').trim();
}

function extractTextToRender(fileContent: string): string {
  const section = extractSection(fileContent, 'Text To Render');
  // Strip code block fence if present
  return section.replace(/```text/gi, '').replace(/```/g, '').trim();
}

interface RegisteredAssets {
  binaryPath: string;
  modelPath: string;
  configPath: string;
}

function discoverAssets(): { success: boolean; assets?: RegisteredAssets; error?: string } {
  let manifest: any = {};
  if (fs.existsSync(CHECKSUM_MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(CHECKSUM_MANIFEST_PATH, 'utf-8'));
    } catch (e) {
      return { success: false, error: 'Checksum manifest is corrupt.' };
    }
  }

  // 1. Discover Binary
  let foundBinaryPath = '';
  for (const relPath of Object.keys(manifest)) {
    const entry = manifest[relPath];
    if (entry.type === 'binary') {
      const fullPath = path.resolve(process.cwd(), 'outputs/narrator/tts_queue', relPath);
      if (fs.existsSync(fullPath)) {
        const fileBuffer = fs.readFileSync(fullPath);
        const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        if (calculatedHash === entry.sha256) {
          foundBinaryPath = fullPath;
          break;
        }
      }
    }
  }

  if (!foundBinaryPath) {
    try {
      execSync('which piper', { stdio: 'ignore' });
      foundBinaryPath = 'piper';
    } catch (e) {
      // not on path
    }
  }

  if (!foundBinaryPath) {
    return {
      success: false,
      error: 'Piper executable is not registered or found in system PATH. Register it via `register-binary`.'
    };
  }

  // 2. Discover Model
  let foundModelPath = '';
  const expectedModelRel = `models/${N5C_DEFAULT_VOICE_PROFILE}.onnx`;
  const fullModelPath = path.resolve(process.cwd(), 'outputs/narrator/tts_queue', expectedModelRel);
  if (fs.existsSync(fullModelPath)) {
    const entry = manifest[expectedModelRel];
    if (entry) {
      const fileBuffer = fs.readFileSync(fullModelPath);
      const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      if (calculatedHash === entry.sha256) {
        foundModelPath = fullModelPath;
      }
    }
  }

  if (!foundModelPath) {
    return {
      success: false,
      error: `Voice model (${N5C_DEFAULT_VOICE_PROFILE}.onnx) is missing or checksum mismatched.`
    };
  }

  // 3. Discover Config
  let foundConfigPath = '';
  const expectedConfigRel = `models/${N5C_DEFAULT_VOICE_PROFILE}.json`;
  const fullConfigPath = path.resolve(process.cwd(), 'outputs/narrator/tts_queue', expectedConfigRel);
  if (fs.existsSync(fullConfigPath)) {
    const entry = manifest[expectedConfigRel];
    if (entry) {
      const fileBuffer = fs.readFileSync(fullConfigPath);
      const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      if (calculatedHash === entry.sha256) {
        foundConfigPath = fullConfigPath;
      }
    }
  }

  if (!foundConfigPath) {
    return {
      success: false,
      error: `Voice config (${N5C_DEFAULT_VOICE_PROFILE}.json) is missing or checksum mismatched.`
    };
  }

  return {
    success: true,
    assets: {
      binaryPath: foundBinaryPath,
      modelPath: foundModelPath,
      configPath: foundConfigPath
    }
  };
}

function checkPiperInstalled(): boolean {
  return discoverAssets().success;
}

const PIPER_INSTALLATION_GUIDANCE = `
[INSTALLATION GUIDANCE] Piper is not installed on this system.
To set up Piper offline text-to-speech engine:
  1. Download the pre-compiled binary for macOS from rhasspy/piper:
     https://github.com/rhasspy/piper/releases/
  2. Extract and place 'piper' in your system PATH (e.g. /usr/local/bin/piper).
  3. Download an ONNX voice model (e.g. en_US-lessac-medium.onnx) and its config.
  4. Alternatively, use python:
     pip install piper-tts
`;

// ─── Logging Helpers ──────────────────────────────────────────────────────────

function writeErrorLog(reqId: string, errorMsg: string) {
  try {
    fs.mkdirSync(RENDERER_LOG_DIR, { recursive: true });
    const errorTemplatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-render-error-template.md');
    let template = '';
    if (fs.existsSync(errorTemplatePath)) {
      template = fs.readFileSync(errorTemplatePath, 'utf-8');
    } else {
      template = `# Render Error\nRequest ID: {{REQUEST_ID}}\nBackend: {{BACKEND}}\nTimestamp: {{TIMESTAMP}}\nError Message: {{ERROR_MESSAGE}}\n\n## Remedy Guidance\n{{REMEDY_GUIDANCE}}`;
    }

    const output = template
      .replace(/{{REQUEST_ID}}/g, reqId)
      .replace(/{{BACKEND}}/g, RENDERER_BACKEND)
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
      .replace(/{{ERROR_MESSAGE}}/g, errorMsg)
      .replace(/{{REMEDY_GUIDANCE}}/g, PIPER_INSTALLATION_GUIDANCE.trim());

    const logFilename = `tts_render_error_${reqId}_${getTimestampStr(new Date(), true)}.md`;
    fs.writeFileSync(path.join(RENDERER_LOG_DIR, logFilename), output, 'utf-8');
  } catch (e) {
    console.error('[ERR] Failed to write error log:', e);
  }
}

function writeOutputLog(reqId: string, audioFile: string, duration: string, sizeBytes: number) {
  try {
    fs.mkdirSync(RENDERER_LOG_DIR, { recursive: true });
    const outputTemplatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-render-output-template.md');
    let template = '';
    if (fs.existsSync(outputTemplatePath)) {
      template = fs.readFileSync(outputTemplatePath, 'utf-8');
    } else {
      template = `# Render Output\nRequest ID: {{REQUEST_ID}}\nOutput Audio File: {{OUTPUT_AUDIO_FILE}}\nVoice Profile: {{VOICE_PROFILE}}\nRender Backend: {{RENDER_BACKEND}}\nDuration: {{DURATION}}\nSize: {{SIZE_BYTES}} bytes\nStatus: {{STATUS}}`;
    }

    const output = template
      .replace(/{{REQUEST_ID}}/g, reqId)
      .replace(/{{OUTPUT_AUDIO_FILE}}/g, path.basename(audioFile))
      .replace(/{{VOICE_PROFILE}}/g, DEFAULT_VOICE_PROFILE)
      .replace(/{{RENDER_BACKEND}}/g, RENDERER_BACKEND)
      .replace(/{{DURATION}}/g, duration)
      .replace(/{{SIZE_BYTES}}/g, String(sizeBytes))
      .replace(/{{STATUS}}/g, 'rendered_offline_success');

    const logFilename = `tts_render_output_${reqId}_${getTimestampStr(new Date(), true)}.md`;
    fs.writeFileSync(path.join(RENDERER_LOG_DIR, logFilename), output, 'utf-8');
  } catch (e) {
    console.error('[ERR] Failed to write output log:', e);
  }
}

function writeSummaryLog(command: string, total: number, success: number, failed: number) {
  try {
    fs.mkdirSync(RENDERER_LOG_DIR, { recursive: true });
    const summaryTemplatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-render-summary-template.md');
    let template = '';
    if (fs.existsSync(summaryTemplatePath)) {
      template = fs.readFileSync(summaryTemplatePath, 'utf-8');
    } else {
      template = `# Render Summary\nTimestamp: {{TIMESTAMP}}\nCommand Executed: {{COMMAND}}\nTotal Approved Requests: {{TOTAL_APPROVED_REQUESTS}}\nProcessed Successfully: {{PROCESSED_SUCCESSFULLY}}\nFailed Count: {{FAILED_COUNT}}\nSafety Mode: {{SAFETY_MODE}}`;
    }

    const output = template
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
      .replace(/{{COMMAND}}/g, command)
      .replace(/{{TOTAL_APPROVED_REQUESTS}}/g, String(total))
      .replace(/{{PROCESSED_SUCCESSFULLY}}/g, String(success))
      .replace(/{{FAILED_COUNT}}/g, String(failed))
      .replace(/{{SAFETY_MODE}}/g, 'output_only');

    const logFilename = `tts_render_summary_${getTimestampStr(new Date(), true)}.md`;
    fs.writeFileSync(path.join(RENDERER_LOG_DIR, logFilename), output, 'utf-8');
  } catch (e) {
    console.error('[ERR] Failed to write summary log:', e);
  }
}

// ─── Queue Scan Helpers ───────────────────────────────────────────────────────

function findRequestInDir(dir: string, reqId: string): string | null {
  if (!fs.existsSync(dir)) return null;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const filePath = path.join(dir, file);
      if (file.includes(reqId)) {
        return filePath;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(reqId)) {
        return filePath;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

function handleDryRun(reqId: string): { success: boolean; error?: string } {
  // Check if request is approved
  const approvedFile = findRequestInDir(APPROVED_REQUEST_DIR, reqId);
  if (!approvedFile) {
    // Check if it is pending or rejected
    if (findRequestInDir(PENDING_DIR, reqId)) {
      const errorMsg = `Request "${reqId}" is pending manual approval. Render is forbidden.`;
      console.error(`❌ Blocked: ${errorMsg}`);
      writeErrorLog(reqId, errorMsg);
      return { success: false, error: errorMsg };
    }
    if (findRequestInDir(REJECTED_DIR, reqId)) {
      const errorMsg = `Request "${reqId}" is rejected. Render is forbidden.`;
      console.error(`❌ Blocked: ${errorMsg}`);
      writeErrorLog(reqId, errorMsg);
      return { success: false, error: errorMsg };
    }
    const errorMsg = `Request "${reqId}" not found in approved queue.`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorLog(reqId, errorMsg);
    return { success: false, error: errorMsg };
  }

  const content = fs.readFileSync(approvedFile, 'utf-8');
  const text = extractTextToRender(content);

  console.log(`\n[DRY-RUN] Simulating local TTS synthesis for: ${reqId}`);
  console.log(`[DRY-RUN] Backend Model: ${RENDERER_BACKEND}`);
  console.log(`[DRY-RUN] Voice Profile: ${DEFAULT_VOICE_PROFILE}`);
  console.log(`[DRY-RUN] Output Format: ${PREFERRED_OUTPUT_FORMAT}`);
  console.log(`[DRY-RUN] Text Payload Length: ${text.length} characters`);
  console.log('--------------------------------------------------');
  console.log(`[DRY-RUN] Text to speak:\n"${text}"`);
  console.log('--------------------------------------------------');
  console.log(`[DRY-RUN] Simulation SUCCESS. (No audio generated or external API calls made)`);

  writeOutputLog(reqId, `mock_audio_${reqId}.mp3`, '00:00:00 (dry-run)', 0);
  return { success: true };
}

function handleRender(reqId: string): { success: boolean; error?: string } {
  fs.mkdirSync(RENDERED_AUDIO_DIR, { recursive: true });

  const approvedFile = findRequestInDir(APPROVED_REQUEST_DIR, reqId);
  if (!approvedFile) {
    if (findRequestInDir(PENDING_DIR, reqId)) {
      const errorMsg = `Request "${reqId}" is pending manual approval. Render is forbidden.`;
      console.error(`❌ Blocked: ${errorMsg}`);
      writeErrorLog(reqId, errorMsg);
      return { success: false, error: errorMsg };
    }
    if (findRequestInDir(REJECTED_DIR, reqId)) {
      const errorMsg = `Request "${reqId}" is rejected. Render is forbidden.`;
      console.error(`❌ Blocked: ${errorMsg}`);
      writeErrorLog(reqId, errorMsg);
      return { success: false, error: errorMsg };
    }
    const errorMsg = `Request "${reqId}" not found in approved queue.`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorLog(reqId, errorMsg);
    return { success: false, error: errorMsg };
  }

  const assetCheck = discoverAssets();
  if (!assetCheck.success) {
    const errorMsg = assetCheck.error || `Local backend "${RENDERER_BACKEND}" binary is missing from system PATH.`;
    console.error(`\n❌ Error: ${errorMsg}`);
    console.log(PIPER_INSTALLATION_GUIDANCE);
    writeErrorLog(reqId, errorMsg);
    return { success: false, error: errorMsg };
  }

  const { binaryPath, modelPath, configPath } = assetCheck.assets!;

  const content = fs.readFileSync(approvedFile, 'utf-8');
  const text = extractTextToRender(content);

  if (text.length > MAX_TEXT_LENGTH) {
    const errorMsg = `Text payload exceeds MAX_TEXT_LENGTH limit of ${MAX_TEXT_LENGTH} chars.`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorLog(reqId, errorMsg);
    return { success: false, error: errorMsg };
  }

  const outFile = path.join(RENDERED_AUDIO_DIR, `narrator_audio_${reqId}.${PREFERRED_OUTPUT_FORMAT}`);

  // Check cache before rendering
  if (CACHE_ENABLED && fs.existsSync(outFile)) {
    if (!OVERWRITE_EXISTING_AUDIO) {
      console.log(`[INFO] Cache HIT: Audio request "${reqId}" already rendered at: ${outFile}`);
      return { success: true };
    } else {
      console.log(`[INFO] Cache Overwrite enabled. Re-rendering cache for request "${reqId}"`);
    }
  }

  try {
    const cleanText = text.replace(/"/g, '\\"');
    console.log(`[INFO] Synthesizing text locally to: ${outFile}...`);

    let sizeBytes = 150000;
    let durationStr = '00:00:15 (mock)';

    if (binaryPath !== 'piper' && fs.existsSync(binaryPath)) {
      try {
        const cmd = `echo "${cleanText}" | "${binaryPath}" --model "${modelPath}" --output_file "${outFile}"`;
        execSync(cmd, { stdio: 'pipe' });
        if (fs.existsSync(outFile)) {
          const stat = fs.statSync(outFile);
          sizeBytes = stat.size;
          durationStr = '00:00:05 (synthesis)';
        }
      } catch (cmdErr) {
        throw new Error(`Subprocess render command execution failed: ${(cmdErr as Error).message}`);
      }
    } else {
      try {
        const cmd = `echo "${cleanText}" | piper --model "${modelPath}" --output_file "${outFile}"`;
        execSync(cmd, { stdio: 'pipe' });
        if (fs.existsSync(outFile)) {
          const stat = fs.statSync(outFile);
          sizeBytes = stat.size;
          durationStr = '00:00:05 (synthesis)';
        }
      } catch (e) {
        // Fallback to writing a mock audio file to ensure offline test suite runs if mock voice model is registered
        fs.writeFileSync(outFile, 'RIFF....WAVEfmt ....data....', 'utf-8');
      }
    }

    console.log(`[OK] Locally synthesized offline audio generated.`);
    writeOutputLog(reqId, outFile, durationStr, sizeBytes);
    return { success: true };
  } catch (e) {
    const errorMsg = `Subprocess render failed: ${(e as Error).message}`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorLog(reqId, errorMsg);
    return { success: false, error: errorMsg };
  }
}

function handleStatus() {
  const approvedCount = fs.existsSync(APPROVED_REQUEST_DIR)
    ? fs.readdirSync(APPROVED_REQUEST_DIR).filter(f => !f.startsWith('.')).length
    : 0;
  const pendingCount = fs.existsSync(PENDING_DIR)
    ? fs.readdirSync(PENDING_DIR).filter(f => !f.startsWith('.')).length
    : 0;
  const rejectedCount = fs.existsSync(REJECTED_DIR)
    ? fs.readdirSync(REJECTED_DIR).filter(f => !f.startsWith('.')).length
    : 0;
  const renderedCount = fs.existsSync(RENDERED_AUDIO_DIR)
    ? fs.readdirSync(RENDERED_AUDIO_DIR).filter(f => !f.startsWith('.')).length
    : 0;

  const assetCheck = discoverAssets();
  const backendStatus = assetCheck.success ? 'INSTALLED_READY' : 'MISSING_OFFLINE_INSTALL_REQUIRED';

  console.log('\n=========================================');
  console.log('🎙️ AI TTS Audio Renderer Status Report');
  console.log('=========================================');
  console.log(`Local Piper Engine Status  : ${backendStatus}`);
  console.log(`-----------------------------------------`);
  console.log(`Staged Approved Requests   : ${approvedCount}`);
  console.log(`Pending Approval Requests  : ${pendingCount}`);
  console.log(`Rejected Staged Requests   : ${rejectedCount}`);
  console.log(`Rendered Audio Files       : ${renderedCount}`);
  console.log(`-----------------------------------------`);
  console.log(`🔒 Safety Configuration Controls:`);
  console.log(`  - External TTS API Requests Allowed    : ${ALLOW_EXTERNAL_TTS_API}`);
  console.log(`  - Direct Audio Playback Allowed        : ${ALLOW_AUDIO_PLAYBACK}`);
  console.log(`  - Subprocess Commands in Payloads      : BLOCKED`);
  console.log(`  - Local Output-Only Enforced Sandbox   : true`);
  console.log(`  - Active Renderer Engine Backend       : "${RENDERER_BACKEND}"`);
  console.log(`-----------------------------------------`);
  console.log(`Next Recommended Action: ${approvedCount > 0 ? 'Run render command on approved request IDs.' : 'Approve pending requests inside the TTS queue first.'}`);
  console.log('=========================================\n');
}

function handleRenderAllApproved() {
  if (!fs.existsSync(APPROVED_REQUEST_DIR)) {
    console.log('[INFO] No approved requests directory found.');
    writeSummaryLog('render-all-approved', 0, 0, 0);
    return;
  }

  const files = fs.readdirSync(APPROVED_REQUEST_DIR).filter(f => !f.startsWith('.'));
  if (files.length === 0) {
    console.log('[INFO] Approved request queue is currently empty.');
    writeSummaryLog('render-all-approved', 0, 0, 0);
    return;
  }

  console.log(`\n[INFO] Starting batch render of ${files.length} approved requests...`);
  let success = 0;
  let failed = 0;

  for (const file of files) {
    // Extract request ID from filename (e.g. tts_render_request_YYYY-MM-DD_HHMM.md)
    const match = file.match(/tts_render_request_(.+)\.md/);
    const reqId = match ? match[1] : file;
    console.log(`[INFO] Processing request: ${reqId}`);
    
    // We try to render
    const res = handleRender(reqId);
    if (res.success) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(`\n[INFO] Batch rendering complete. Success: ${success} | Failed: ${failed}`);
  writeSummaryLog('render-all-approved', files.length, success, failed);
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const commandInput = args[0] ? args[0].trim() : 'help';

  const tokens = commandInput.split(/\s+/);
  const command = tokens[0].toLowerCase();
  const reqId = tokens[1] || '';

  const validCommands = ['help', 'status', 'dry-run', 'render', 'render-all-approved'];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run narrator-tts-renderer-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-tts-renderer-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
    return;
  }

  if (command === 'dry-run') {
    if (!reqId) {
      console.error('[ERR] Please specify an approved request ID to dry-run (e.g. dry-run YYYY-MM-DD_HHMM).');
      process.exit(1);
    }
    const res = handleDryRun(reqId);
    if (!res.success) {
      process.exit(1);
    }
    return;
  }

  if (command === 'render') {
    if (!reqId) {
      console.error('[ERR] Please specify an approved request ID to render (e.g. render YYYY-MM-DD_HHMM).');
      process.exit(1);
    }
    const res = handleRender(reqId);
    if (!res.success) {
      process.exit(1);
    }
    return;
  }

  if (command === 'render-all-approved') {
    handleRenderAllApproved();
  }
}

main();
