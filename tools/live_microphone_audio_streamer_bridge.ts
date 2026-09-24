import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_MICROPHONE,
  ALLOW_DAEMON_SPAWN,
  ALLOW_AUDIO_STREAMING,
  ALLOW_CLOUD_PROCESSING,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_LOCAL_MODEL_PRESENCE,
  outputFolders,
  upstreamSources,
  supportedAudioModels,
  daemonConfigDefaults,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/live-microphone-audio-streamer.js';

export interface LiveMicrophoneAudioStreamerBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    liveMicrophone: boolean;
    daemonSpawn: boolean;
    audioStreaming: boolean;
    cloudProcessing: boolean;
    humanApproval: boolean;
    localModelPresence: boolean;
  };
  outputCounts: {
    daemonConfigs: number;
    modelReports: number;
    pipelineDiagnostics: number;
    streamSimulations: number;
    logs: number;
  };
  upstreamSourceStatus: Record<string, { exists: boolean; fileCount: number }>;
  supportedModelCount: number;
  daemonConfig: {
    sampleRate: number;
    bufferSizeMs: number;
    vadThreshold: number;
    outputFormat: string;
  };
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getLiveMicrophoneAudioStreamerBridgeStatus(): LiveMicrophoneAudioStreamerBridgeStatus {
  const sourceStatus: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const exists = fs.existsSync(sourcePath);
    let fileCount = 0;
    if (exists) {
      const stat = fs.statSync(sourcePath);
      if (stat.isFile()) {
        fileCount = 1;
      } else {
        fileCount = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.')).length;
      }
    }
    sourceStatus[source] = { exists, fileCount };
  }

  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      liveMicrophone: ALLOW_LIVE_MICROPHONE,
      daemonSpawn: ALLOW_DAEMON_SPAWN,
      audioStreaming: ALLOW_AUDIO_STREAMING,
      cloudProcessing: ALLOW_CLOUD_PROCESSING,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      localModelPresence: REQUIRE_LOCAL_MODEL_PRESENCE
    },
    outputCounts: {
      daemonConfigs: countFiles(outputFolders.daemonConfigs),
      modelReports: countFiles(outputFolders.modelReports),
      pipelineDiagnostics: countFiles(outputFolders.pipelineDiagnostics),
      streamSimulations: countFiles(outputFolders.streamSimulations),
      logs: countFiles(outputFolders.logs)
    },
    upstreamSourceStatus: sourceStatus,
    supportedModelCount: supportedAudioModels.length,
    daemonConfig: {
      sampleRate: daemonConfigDefaults.sampleRate,
      bufferSizeMs: daemonConfigDefaults.bufferSizeMs,
      vadThreshold: daemonConfigDefaults.vadThreshold,
      outputFormat: daemonConfigDefaults.outputFormat
    }
  };
}

export function generateBridgeReport(): string {
  const status = getLiveMicrophoneAudioStreamerBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  let sourceTable = '';
  for (const [source, info] of Object.entries(status.upstreamSourceStatus)) {
    sourceTable += `| ${source} | ${info.exists} | ${info.fileCount} |\n`;
  }

  return `# Live Microphone Audio Streamer Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Live Microphone | ${status.safetyFlags.liveMicrophone} |
| Daemon Spawn | ${status.safetyFlags.daemonSpawn} |
| Audio Streaming | ${status.safetyFlags.audioStreaming} |
| Cloud Processing | ${status.safetyFlags.cloudProcessing} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Local Model Presence | ${status.safetyFlags.localModelPresence} |

## Output Inventory

| Output Type | Count |
|---|---|
| Daemon Configs | ${status.outputCounts.daemonConfigs} |
| Model Reports | ${status.outputCounts.modelReports} |
| Pipeline Diagnostics | ${status.outputCounts.pipelineDiagnostics} |
| Stream Simulations | ${status.outputCounts.streamSimulations} |
| Logs | ${status.outputCounts.logs} |

## Daemon Configuration

| Parameter | Value |
|---|---|
| Sample Rate | ${status.daemonConfig.sampleRate} Hz |
| Buffer Size | ${status.daemonConfig.bufferSizeMs} ms |
| VAD Threshold | ${status.daemonConfig.vadThreshold} |
| Output Format | ${status.daemonConfig.outputFormat} |

## Upstream Source Status

| Source | Exists | File Count |
|---|---|---|
${sourceTable}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'live_microphone_audio_streamer_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
