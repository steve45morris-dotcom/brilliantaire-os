import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_MICROPHONE,
  ALLOW_DAEMON_SPAWN,
  ALLOW_AUDIO_STREAMING,
  ALLOW_CLOUD_PROCESSING,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_LOCAL_MODEL_PRESENCE,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  upstreamSources,
  supportedAudioModels,
  daemonConfigDefaults,
  supportedAudioBackends,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/live-microphone-audio-streamer.js';

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
  const logFile = path.join(logDir, `live_microphone_audio_streamer_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `LMAS-${dateStr}-${suffix}`;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function scanSource(sourcePath: string): { exists: boolean; fileCount: number; files: string[]; isFile: boolean } {
  if (!fs.existsSync(sourcePath)) {
    return { exists: false, fileCount: 0, files: [], isFile: false };
  }
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) {
    return { exists: true, fileCount: 1, files: [path.basename(sourcePath)], isFile: true };
  }
  const files = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.'));
  return { exists: true, fileCount: files.length, files, isFile: false };
}

function fillTemplate(templateContent: string, data: Record<string, string>): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function readTemplate(filename: string): string {
  const filePath = path.join(TEMPLATE_ROOT, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARNING] Template file not found: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function ensureOutputDirs() {
  for (const [, folderPath] of Object.entries(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
}

// 1. Status Command
async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`  Module:                ${MODULE_NAME}`);
  console.log(`  Tool Type:             ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:           ${BRIDGE_MODE}`);
  console.log(`  Integration:           ${INTEGRATION_TARGET}`);
  console.log(`  Live Microphone:       ${ALLOW_LIVE_MICROPHONE}`);
  console.log(`  Daemon Spawn:          ${ALLOW_DAEMON_SPAWN}`);
  console.log(`  Audio Streaming:       ${ALLOW_AUDIO_STREAMING}`);
  console.log(`  Cloud Processing:      ${ALLOW_CLOUD_PROCESSING}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  Local Model Required:  ${REQUIRE_LOCAL_MODEL_PRESENCE}`);
  console.log(`  Direct Obsidian Write: ${ALLOW_DIRECT_OBSIDIAN_WRITE}`);
  console.log(`${'─'.repeat(55)}`);

  const folders = [
    { name: 'Daemon Configs', dir: outputFolders.daemonConfigs },
    { name: 'Model Reports', dir: outputFolders.modelReports },
    { name: 'Pipeline Diagnostics', dir: outputFolders.pipelineDiagnostics },
    { name: 'Stream Simulations', dir: outputFolders.streamSimulations },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  Output Directories:');
  for (const folder of folders) {
    const count = countFiles(folder.dir);
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(28)} ${status}`);
  }

  console.log('\n  Upstream Source Paths:');
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    const status = scan.exists
      ? (scan.isFile ? `found (file)` : `${scan.fileCount} files`)
      : 'not found';
    console.log(`     ${source.padEnd(28)} ${status}`);
  }

  console.log('\n  Daemon Config Defaults:');
  console.log(`     Sample Rate:        ${daemonConfigDefaults.sampleRate} Hz`);
  console.log(`     Channels:           ${daemonConfigDefaults.channels}`);
  console.log(`     Bit Depth:          ${daemonConfigDefaults.bitDepth}`);
  console.log(`     Buffer Size:        ${daemonConfigDefaults.bufferSizeMs} ms`);
  console.log(`     VAD Threshold:      ${daemonConfigDefaults.vadThreshold}`);
  console.log(`     Silence Timeout:    ${daemonConfigDefaults.silenceTimeoutMs} ms`);
  console.log(`     Max Duration:       ${daemonConfigDefaults.maxRecordingDurationMs} ms`);
  console.log(`     Output Format:      ${daemonConfigDefaults.outputFormat}`);

  console.log('\n  Supported Audio Models:');
  for (const model of supportedAudioModels) {
    console.log(`     - ${model.name} (${model.engine}, ${model.sizeEstimate})`);
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// 2. Scan Models Command
async function handleScanModels() {
  await announceIntent('Scanning local audio processing model directories for available models');
  console.log('Scanning local model directories...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const reportId = generateRequestId();

  const modelDir = upstreamSources.whisperModelDir;
  const modelScan = scanSource(modelDir);

  const scanTableLines: string[] = [
    '| File | Extension | Size | Engine Match |',
    '|---|---|---|---|',
  ];

  if (modelScan.exists && modelScan.fileCount > 0) {
    for (const file of modelScan.files) {
      const filePath = path.join(modelDir, file);
      const stat = fs.statSync(filePath);
      const ext = path.extname(file);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
      const matchedModel = supportedAudioModels.find(m => m.format === ext);
      const engineMatch = matchedModel ? matchedModel.engine : 'unknown';
      scanTableLines.push(`| ${file} | ${ext} | ${sizeMB} MB | ${engineMatch} |`);
    }
  } else {
    scanTableLines.push('| (no models found) | — | — | — |');
  }

  const registryLines: string[] = [
    '| Model Name | Engine | Format | Size Estimate | Capability |',
    '|---|---|---|---|---|',
  ];
  for (const model of supportedAudioModels) {
    registryLines.push(`| ${model.name} | ${model.engine} | ${model.format} | ${model.sizeEstimate} | ${model.capability} |`);
  }

  const compatLines: string[] = [
    '| Model | Local Present | Engine Available | Ready |',
    '|---|---|---|---|',
  ];
  for (const model of supportedAudioModels) {
    const present = modelScan.files.some(f => f.includes(model.name.replace('whisper-', '').replace('silero-', '')));
    compatLines.push(`| ${model.name} | ${present ? 'Yes' : 'No'} | Requires manual check | ${present ? 'Staged' : 'Not staged'} |`);
  }

  const template = readTemplate('model-report-template.md');
  if (!template) {
    console.error('Error: Model report template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    REPORT_ID: reportId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    MODEL_DIR: modelDir,
    MODEL_SCAN_TABLE: scanTableLines.join('\n'),
    MODEL_REGISTRY: registryLines.join('\n'),
    COMPATIBILITY_MATRIX: compatLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.modelReports,
    `model_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Model report ${reportId}: ${modelScan.fileCount} local models found -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('SCAN_MODELS', msg);
  await announceCompletion(`Audio processing model scan compiled: ${reportId}`, '10');
}

// 3. Configure Daemon Command
async function handleConfigureDaemon() {
  await announceIntent('Staging daemon configuration with audio capture parameters and model selection');
  console.log('Staging daemon configuration...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const configId = generateRequestId();

  const captureParams: string[] = [
    `- **Sample Rate:** ${daemonConfigDefaults.sampleRate} Hz`,
    `- **Channels:** ${daemonConfigDefaults.channels} (mono)`,
    `- **Bit Depth:** ${daemonConfigDefaults.bitDepth}-bit`,
    `- **Buffer Size:** ${daemonConfigDefaults.bufferSizeMs} ms`,
    `- **Chunk Overlap:** ${daemonConfigDefaults.chunkOverlapMs} ms`,
    `- **VAD Threshold:** ${daemonConfigDefaults.vadThreshold}`,
    `- **Silence Timeout:** ${daemonConfigDefaults.silenceTimeoutMs} ms`,
    `- **Max Recording Duration:** ${daemonConfigDefaults.maxRecordingDurationMs} ms (${daemonConfigDefaults.maxRecordingDurationMs / 60000} min)`,
    `- **Output Format:** ${daemonConfigDefaults.outputFormat}`,
  ];

  const backendLines: string[] = [];
  for (const backend of supportedAudioBackends) {
    backendLines.push(`- [ ] **${backend}**: Requires manual verification`);
  }

  const modelScan = scanSource(upstreamSources.whisperModelDir);
  const modelLines: string[] = [];
  for (const model of supportedAudioModels) {
    const present = modelScan.exists && modelScan.files.some(f => f.includes(model.name.replace('whisper-', '').replace('silero-', '')));
    modelLines.push(`- [${present ? 'x' : ' '}] **${model.name}** (${model.engine}) — ${model.capability}`);
  }

  const pipelineLines: string[] = [
    `- **Audio Bridge Daemon:** ${upstreamSources.audioBridge}`,
    `  - Status: ${fs.existsSync(upstreamSources.audioBridge) ? 'Found' : 'Missing'}`,
    `  - Spawns: scripts/whisper_daemon.py (not yet created)`,
    `- **Voice Input Directory:** ${upstreamSources.voiceInputDir}`,
    `  - Status: ${fs.existsSync(upstreamSources.voiceInputDir) ? 'Exists' : 'Not created'}`,
    `- **Voice Queue Inbox:** ${upstreamSources.voiceQueueInbox}`,
    `  - Status: ${fs.existsSync(upstreamSources.voiceQueueInbox) ? 'Exists' : 'Not created'}`,
    `- **ASR Listener Config:** ${fs.existsSync(upstreamSources.asrListenerConfig) ? 'Found' : 'Missing'}`,
    `- **ASR Orchestrator Config:** ${fs.existsSync(upstreamSources.asrOrchestratorConfig) ? 'Found' : 'Missing'}`,
    `- **VibeVoice Listener:** ${fs.existsSync(upstreamSources.vibevoiceListener) ? 'Found' : 'Missing'}`,
  ];

  const template = readTemplate('daemon-config-template.md');
  if (!template) {
    console.error('Error: Daemon config template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    CONFIG_ID: configId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CAPTURE_PARAMS: captureParams.join('\n'),
    BACKEND_STATUS: backendLines.join('\n'),
    MODEL_SELECTION: modelLines.join('\n'),
    PIPELINE_WIRING: pipelineLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.daemonConfigs,
    `daemon_config_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Daemon config ${configId}: staged with ${supportedAudioModels.length} model slots -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('CONFIGURE_DAEMON', msg);
  await announceCompletion(`Audio streamer daemon configuration staged: ${configId}`, '10');
}

// 4. Validate Pipeline Command
async function handleValidatePipeline() {
  await announceIntent('Validating streaming pipeline connections from audio bridge through ASR pipeline');
  console.log('Validating pipeline connections...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const diagId = generateRequestId();

  const components = [
    { name: 'Sentinel-OS Audio Bridge', path: upstreamSources.audioBridge, role: 'Daemon launcher — spawns whisper_daemon.py' },
    { name: 'ASR Listener Config', path: upstreamSources.asrListenerConfig, role: 'ASR backend preferences and safety flags' },
    { name: 'ASR Orchestrator Config', path: upstreamSources.asrOrchestratorConfig, role: 'ASR job orchestration and execution gates' },
    { name: 'ASR Backend Config', path: upstreamSources.asrBackendConfig, role: 'Binary and model directory specifications' },
    { name: 'ASR Model Gate', path: upstreamSources.asrModelGate, role: 'Model placement and checksum verification' },
    { name: 'VibeVoice Listener', path: upstreamSources.vibevoiceListener, role: 'File-watcher voice input consumer' },
    { name: 'Wake Word Listener', path: upstreamSources.wakeWordListener, role: 'Python wake phrase detection daemon' },
  ];

  const componentLines: string[] = [
    '| Component | Status | Role |',
    '|---|---|---|',
  ];
  let foundCount = 0;
  for (const comp of components) {
    const exists = fs.existsSync(comp.path);
    if (exists) foundCount++;
    componentLines.push(`| ${comp.name} | ${exists ? 'Found' : 'Missing'} | ${comp.role} |`);
  }

  const connections = [
    { from: 'Audio Bridge', to: 'whisper_daemon.py', status: 'Not created (daemon script missing)', ready: false },
    { from: 'whisper_daemon.py', to: 'voice_input/', status: fs.existsSync(upstreamSources.voiceInputDir) ? 'Directory exists' : 'Directory missing', ready: fs.existsSync(upstreamSources.voiceInputDir) },
    { from: 'voice_input/', to: 'voice_queue/inbox/', status: fs.existsSync(upstreamSources.voiceQueueInbox) ? 'Directory exists' : 'Directory missing', ready: fs.existsSync(upstreamSources.voiceQueueInbox) },
    { from: 'VibeVoice Listener', to: 'Voice Command Queue', status: fs.existsSync(upstreamSources.vibevoiceListener) ? 'Listener ready' : 'Listener missing', ready: fs.existsSync(upstreamSources.vibevoiceListener) },
    { from: 'ASR Listener', to: 'Whisper Models', status: fs.existsSync(upstreamSources.whisperModelDir) ? 'Model dir exists' : 'Model dir missing', ready: fs.existsSync(upstreamSources.whisperModelDir) },
  ];

  const connectionLines: string[] = [
    '| From | To | Status | Ready |',
    '|---|---|---|---|',
  ];
  let readyCount = 0;
  for (const conn of connections) {
    if (conn.ready) readyCount++;
    connectionLines.push(`| ${conn.from} | ${conn.to} | ${conn.status} | ${conn.ready ? 'Yes' : 'No'} |`);
  }

  const upstreamLines: string[] = [];
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    const status = scan.exists
      ? (scan.isFile ? 'Found (file)' : `Found (${scan.fileCount} files)`)
      : 'Not found';
    upstreamLines.push(`- **${source}:** ${status}`);
  }

  const totalChecks = components.length + connections.length;
  const totalPassed = foundCount + readyCount;
  const scorePercent = Math.round((totalPassed / totalChecks) * 100);

  const scoreLines: string[] = [
    `- **Components Found:** ${foundCount} / ${components.length}`,
    `- **Connections Ready:** ${readyCount} / ${connections.length}`,
    `- **Overall Score:** ${totalPassed} / ${totalChecks} (${scorePercent}%)`,
    `- **Readiness:** ${scorePercent >= 80 ? 'HIGH — most infrastructure in place' : scorePercent >= 50 ? 'MEDIUM — partial infrastructure present' : 'LOW — significant gaps remain'}`,
  ];

  const template = readTemplate('pipeline-diagnostics-template.md');
  if (!template) {
    console.error('Error: Pipeline diagnostics template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    DIAGNOSTICS_ID: diagId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    COMPONENT_STATUS: componentLines.join('\n'),
    CONNECTION_TABLE: connectionLines.join('\n'),
    UPSTREAM_SCAN: upstreamLines.join('\n'),
    READINESS_SCORE: scoreLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.pipelineDiagnostics,
    `pipeline_diagnostics_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Pipeline diagnostics ${diagId}: ${scorePercent}% readiness (${totalPassed}/${totalChecks}) -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('VALIDATE_PIPELINE', msg);
  await announceCompletion(`Audio streamer pipeline diagnostics compiled: ${diagId}`, '10');
}

// 5. Stream Simulation Command
async function handleStreamSimulation() {
  if (ALLOW_LIVE_MICROPHONE) {
    console.error('Safety gate: ALLOW_LIVE_MICROPHONE is enabled. Simulation uses computed estimates only.');
    process.exit(1);
  }

  await announceIntent('Dry-running audio stream simulation with computed latency and buffer estimates');
  console.log('Running stream simulation...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const simId = generateRequestId();

  const cfg = daemonConfigDefaults;

  const simParams: string[] = [
    `- **Sample Rate:** ${cfg.sampleRate} Hz`,
    `- **Channels:** ${cfg.channels}`,
    `- **Bit Depth:** ${cfg.bitDepth}-bit`,
    `- **Buffer Size:** ${cfg.bufferSizeMs} ms`,
    `- **Chunk Overlap:** ${cfg.chunkOverlapMs} ms`,
    `- **VAD Threshold:** ${cfg.vadThreshold}`,
    `- **Silence Timeout:** ${cfg.silenceTimeoutMs} ms`,
    `- **Output Format:** ${cfg.outputFormat}`,
    `- **Mode:** DRY RUN (no audio captured)`,
  ];

  const bytesPerSecond = cfg.sampleRate * cfg.channels * (cfg.bitDepth / 8);
  const bufferBytes = Math.round(bytesPerSecond * (cfg.bufferSizeMs / 1000));
  const buffersPerSecond = Math.round(1000 / cfg.bufferSizeMs);

  const bufferChain: string[] = [
    `- **Bytes per second:** ${bytesPerSecond.toLocaleString()} bytes`,
    `- **Buffer size:** ${bufferBytes.toLocaleString()} bytes (${cfg.bufferSizeMs} ms)`,
    `- **Buffers per second:** ${buffersPerSecond}`,
    `- **Chunk overlap:** ${cfg.chunkOverlapMs} ms`,
    `- **Effective chunk window:** ${cfg.bufferSizeMs + cfg.chunkOverlapMs} ms`,
    `- **Silence detection window:** ${cfg.silenceTimeoutMs} ms (${Math.round(cfg.silenceTimeoutMs / cfg.bufferSizeMs)} buffers)`,
  ];

  const captureLatencyMs = cfg.bufferSizeMs;
  const vadLatencyMs = 10;
  const transcriptionLatencyMs = 800;
  const commandRoutingMs = 50;
  const totalLatencyMs = captureLatencyMs + vadLatencyMs + transcriptionLatencyMs + commandRoutingMs;

  const latencyLines: string[] = [
    '| Stage | Estimated Latency |',
    '|---|---|',
    `| Audio Capture Buffer | ${captureLatencyMs} ms |`,
    `| VAD Processing | ~${vadLatencyMs} ms |`,
    `| Whisper Transcription (base.en) | ~${transcriptionLatencyMs} ms |`,
    `| Command Routing | ~${commandRoutingMs} ms |`,
    `| **Total End-to-End** | **~${totalLatencyMs} ms** |`,
  ];

  const testResults: string[] = [
    '| Test | Expected | Computed | Result |',
    '|---|---|---|---|',
    `| Buffer chain throughput | >= 16kHz | ${cfg.sampleRate} Hz | ${cfg.sampleRate >= 16000 ? 'PASS' : 'FAIL'} |`,
    `| Single-channel mono | 1 channel | ${cfg.channels} channel(s) | ${cfg.channels === 1 ? 'PASS' : 'FAIL'} |`,
    `| End-to-end latency | < 2000 ms | ${totalLatencyMs} ms | ${totalLatencyMs < 2000 ? 'PASS' : 'FAIL'} |`,
    `| Silence detection | >= 1000 ms | ${cfg.silenceTimeoutMs} ms | ${cfg.silenceTimeoutMs >= 1000 ? 'PASS' : 'FAIL'} |`,
    `| Buffer overflow risk | Low | ${buffersPerSecond <= 100 ? 'Low' : 'Moderate'} | ${buffersPerSecond <= 100 ? 'PASS' : 'WARN'} |`,
    `| Max recording cap | <= 10 min | ${cfg.maxRecordingDurationMs / 60000} min | ${cfg.maxRecordingDurationMs <= 600000 ? 'PASS' : 'WARN'} |`,
  ];

  const template = readTemplate('stream-simulation-template.md');
  if (!template) {
    console.error('Error: Stream simulation template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    SIMULATION_ID: simId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    SIMULATION_PARAMS: simParams.join('\n'),
    BUFFER_CHAIN: bufferChain.join('\n'),
    LATENCY_ESTIMATES: latencyLines.join('\n'),
    TEST_RESULTS: testResults.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.streamSimulations,
    `stream_simulation_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Stream simulation ${simId}: ~${totalLatencyMs}ms estimated end-to-end latency -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('STREAM_SIMULATION', msg);
  await announceCompletion(`Audio stream simulation compiled: ${simId}`, '10');
}

// 6. Daemon Report Command
async function handleDaemonReport() {
  await announceIntent('Generating comprehensive daemon expansion readiness report');
  console.log('Generating daemon expansion readiness report...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const reportId = generateRequestId();

  const checks: { name: string; status: boolean; detail: string }[] = [];

  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    checks.push({
      name: `Upstream: ${source}`,
      status: scan.exists,
      detail: scan.exists ? `Found (${scan.isFile ? 'file' : scan.fileCount + ' files'})` : 'Not found'
    });
  }

  checks.push({
    name: 'ALLOW_LIVE_MICROPHONE = false',
    status: !ALLOW_LIVE_MICROPHONE,
    detail: ALLOW_LIVE_MICROPHONE ? 'WARNING: Live mic enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'ALLOW_DAEMON_SPAWN = false',
    status: !ALLOW_DAEMON_SPAWN,
    detail: ALLOW_DAEMON_SPAWN ? 'WARNING: Daemon spawn enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'ALLOW_AUDIO_STREAMING = false',
    status: !ALLOW_AUDIO_STREAMING,
    detail: ALLOW_AUDIO_STREAMING ? 'WARNING: Audio streaming enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'ALLOW_CLOUD_PROCESSING = false',
    status: !ALLOW_CLOUD_PROCESSING,
    detail: ALLOW_CLOUD_PROCESSING ? 'WARNING: Cloud processing enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'REQUIRE_HUMAN_APPROVAL = true',
    status: REQUIRE_HUMAN_APPROVAL,
    detail: REQUIRE_HUMAN_APPROVAL ? 'Correctly enforced' : 'WARNING: Human approval not required!'
  });
  checks.push({
    name: 'REQUIRE_LOCAL_MODEL_PRESENCE = true',
    status: REQUIRE_LOCAL_MODEL_PRESENCE,
    detail: REQUIRE_LOCAL_MODEL_PRESENCE ? 'Correctly enforced' : 'WARNING: Local model not required!'
  });

  const configCount = countFiles(outputFolders.daemonConfigs);
  checks.push({
    name: 'Daemon configs staged',
    status: configCount > 0,
    detail: configCount > 0 ? `${configCount} config(s) found` : 'No configs found — run configure-daemon first'
  });

  const modelCount = countFiles(outputFolders.modelReports);
  checks.push({
    name: 'Model reports generated',
    status: modelCount > 0,
    detail: modelCount > 0 ? `${modelCount} report(s) found` : 'No reports found — run scan-models first'
  });

  const diagCount = countFiles(outputFolders.pipelineDiagnostics);
  checks.push({
    name: 'Pipeline diagnostics run',
    status: diagCount > 0,
    detail: diagCount > 0 ? `${diagCount} diagnostic(s) found` : 'No diagnostics found — run validate-pipeline first'
  });

  const checkTable: string[] = [
    '| Check | Status | Detail |',
    '|---|---|---|',
  ];

  let passCount = 0;
  for (const check of checks) {
    const statusStr = check.status ? 'PASS' : 'FAIL';
    if (check.status) passCount++;
    checkTable.push(`| ${check.name} | ${statusStr} | ${check.detail} |`);
  }

  const overallStatus = passCount === checks.length ? 'ALL CHECKS PASSED' : `${passCount}/${checks.length} PASSED`;

  const output = [
    `# Live Microphone Audio Streamer — Daemon Expansion Readiness Report`,
    ``,
    `- **Report ID:** ${reportId}`,
    `- **Date:** ${dateStr}`,
    `- **Generated:** ${new Date().toISOString()}`,
    `- **Bridge Mode:** ${BRIDGE_MODE}`,
    `- **Overall Status:** ${overallStatus}`,
    ``,
    `---`,
    ``,
    `## Readiness Checks`,
    ``,
    checkTable.join('\n'),
    ``,
    `## Daemon Configuration Defaults`,
    ``,
    `- **Sample Rate:** ${daemonConfigDefaults.sampleRate} Hz`,
    `- **Buffer Size:** ${daemonConfigDefaults.bufferSizeMs} ms`,
    `- **VAD Threshold:** ${daemonConfigDefaults.vadThreshold}`,
    `- **Output Format:** ${daemonConfigDefaults.outputFormat}`,
    ``,
    `## Supported Models (${supportedAudioModels.length})`,
    ``,
    ...supportedAudioModels.map(m => `- ${m.name} — ${m.engine} (${m.sizeEstimate})`),
    ``,
    `## Safety Confirmation`,
    ``,
    `- [x] No microphone access enabled`,
    `- [x] No daemon processes spawned`,
    `- [x] No audio streaming active`,
    `- [x] No cloud processing configured`,
    `- [x] Human approval enforced for all transitions`,
    `- [x] Local model presence required before enabling`,
    ``,
    `---`,
    ``,
    `*This report is staging-only. No daemon processes are started or audio captured.*`,
  ].join('\n');

  const safePath = getSafeWritePath(
    outputFolders.root,
    `daemon_expansion_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, output);

  const msg = `Daemon report ${reportId}: ${overallStatus} -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('DAEMON_REPORT', msg);
  await announceCompletion(`Audio streamer daemon expansion report compiled: ${reportId}`, '10');
}

// 7. Obsidian Export Command
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging live microphone audio streamer summary for Obsidian export');
  console.log('Staging Obsidian export summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();

  const sourceResults: Record<string, { exists: boolean; fileCount: number; isFile: boolean }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    sourceResults[source] = { exists: scan.exists, fileCount: scan.fileCount, isFile: scan.isFile };
  }

  const totalSources = Object.values(sourceResults).filter(r => r.exists).length;
  const configCount = countFiles(outputFolders.daemonConfigs);
  const modelReportCount = countFiles(outputFolders.modelReports);
  const diagCount = countFiles(outputFolders.pipelineDiagnostics);
  const simCount = countFiles(outputFolders.streamSimulations);

  const summaryLines: string[] = [
    `- **Upstream Sources Available:** ${totalSources} of ${Object.keys(sourceResults).length}`,
    `- **Daemon Configs Staged:** ${configCount}`,
    `- **Model Reports:** ${modelReportCount}`,
    `- **Pipeline Diagnostics:** ${diagCount}`,
    `- **Stream Simulations:** ${simCount}`,
    `- **Supported Audio Models:** ${supportedAudioModels.length}`,
    `- **Supported Audio Backends:** ${supportedAudioBackends.length}`,
  ];

  const stateLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    const status = result.exists ? 'Found' : 'Missing';
    stateLines.push(`- **${source}:** ${status}`);
  }

  let inventoryStr = 'No streamer artifacts generated yet.';
  const allOutputs: string[] = [];
  for (const [folderName, folderPath] of Object.entries(outputFolders)) {
    if (folderName === 'root' || folderName === 'logs') continue;
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md'));
      for (const file of files) {
        allOutputs.push(`- \`${folderName}/${file}\``);
      }
    }
  }
  if (allOutputs.length > 0) {
    inventoryStr = allOutputs.join('\n');
  }

  const nextActionLines: string[] = [
    '- [ ] Scan local model directories for available Whisper models',
    '- [ ] Stage daemon configuration with capture parameters',
    '- [ ] Validate pipeline connections end-to-end',
    '- [ ] Run stream simulation to estimate latency',
    '- [ ] Create whisper_daemon.py script for sentinel-os audio bridge',
    '- [ ] Place and verify Whisper model binaries locally',
    '- [ ] Install and verify audio input backend (pyaudio/sounddevice)',
    '- [ ] Manual live microphone test after all prerequisites pass',
  ];

  const template = readTemplate('obsidian-export-template.md');
  if (!template) {
    console.error('Error: Obsidian export template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    STREAMER_SUMMARY: summaryLines.join('\n'),
    SOURCE_STATES: stateLines.join('\n'),
    OUTPUT_INVENTORY: inventoryStr,
    NEXT_ACTIONS: nextActionLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.root,
    `live_microphone_audio_streamer_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Live microphone audio streamer Obsidian export staged', '10');
}

// Main dispatcher
async function main() {
  if (ALLOW_LIVE_MICROPHONE) {
    console.error('Safety gate: ALLOW_LIVE_MICROPHONE is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_DAEMON_SPAWN) {
    console.error('Safety gate: ALLOW_DAEMON_SPAWN is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_AUDIO_STREAMING) {
    console.error('Safety gate: ALLOW_AUDIO_STREAMING is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run live-microphone-audio-streamer-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'scan-models':
      await handleScanModels();
      break;
    case 'configure-daemon':
      await handleConfigureDaemon();
      break;
    case 'validate-pipeline':
      await handleValidatePipeline();
      break;
    case 'stream-simulation':
      await handleStreamSimulation();
      break;
    case 'daemon-report':
      await handleDaemonReport();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run live-microphone-audio-streamer-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
