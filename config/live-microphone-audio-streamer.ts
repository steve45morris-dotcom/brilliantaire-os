import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Live Microphone Audio Streamer Daemon Expansion';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_LIVE_MICROPHONE = false;
export const ALLOW_DAEMON_SPAWN = false;
export const ALLOW_AUDIO_STREAMING = false;
export const ALLOW_CLOUD_PROCESSING = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_LOCAL_MODEL_PRESENCE = true;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;

// Project context
export const PROJECT_NAME = 'Live Microphone Audio Streamer Daemon Expansion';
export const TOOL_TYPE = 'Audio Streaming Daemon Configuration Staging';
export const INTEGRATION_TARGET = 'Sentinel-OS Audio Bridge + Local ASR Pipeline';

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'live_microphone_audio_streamer');
export const outputFolders = {
  root: OUTPUT_ROOT,
  daemonConfigs: path.join(OUTPUT_ROOT, 'daemon_configs'),
  modelReports: path.join(OUTPUT_ROOT, 'model_reports'),
  pipelineDiagnostics: path.join(OUTPUT_ROOT, 'pipeline_diagnostics'),
  streamSimulations: path.join(OUTPUT_ROOT, 'stream_simulations'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Upstream source paths (read-only)
export const upstreamSources = {
  audioBridge: path.join(REPO_ROOT, 'sentinel-os', 'lib', 'audio-bridge.ts'),
  asrListenerConfig: path.join(REPO_ROOT, 'config', 'narrator-asr-listener.config.ts'),
  asrOrchestratorConfig: path.join(REPO_ROOT, 'config', 'asr-orchestrator.ts'),
  asrBackendConfig: path.join(REPO_ROOT, 'config', 'narrator-asr-backend.config.ts'),
  asrModelGate: path.join(REPO_ROOT, 'config', 'asr-model-gate.ts'),
  vibevoiceListener: path.join(REPO_ROOT, 'scripts', 'vibevoice-listener.ts'),
  wakeWordListener: path.join(REPO_ROOT, 'scripts', 'wake_word_listener.py'),
  whisperModelDir: path.join(REPO_ROOT, 'local_assets', 'whisper_models'),
  voiceInputDir: path.join(REPO_ROOT, 'voice_input'),
  voiceQueueInbox: path.join(REPO_ROOT, 'voice_queue', 'inbox'),
};

// Supported local audio processing models
export const supportedAudioModels = [
  { name: 'whisper-ggml-base.en', engine: 'whisper.cpp', format: '.bin', sizeEstimate: '142MB', capability: 'English ASR' },
  { name: 'whisper-ggml-small.en', engine: 'whisper.cpp', format: '.bin', sizeEstimate: '466MB', capability: 'English ASR (higher accuracy)' },
  { name: 'whisper-ggml-medium.en', engine: 'whisper.cpp', format: '.bin', sizeEstimate: '1.5GB', capability: 'English ASR (production quality)' },
  { name: 'whisper-ggml-large-v3', engine: 'whisper.cpp', format: '.bin', sizeEstimate: '3.1GB', capability: 'Multilingual ASR (highest quality)' },
  { name: 'silero-vad', engine: 'onnxruntime', format: '.onnx', sizeEstimate: '2MB', capability: 'Voice Activity Detection' },
  { name: 'whisper-base.en', engine: 'openai-whisper', format: '.pt', sizeEstimate: '142MB', capability: 'Python Whisper ASR' },
];

// Daemon configuration parameters
export const daemonConfigDefaults = {
  sampleRate: 16000,
  channels: 1,
  bitDepth: 16,
  bufferSizeMs: 30,
  vadThreshold: 0.5,
  silenceTimeoutMs: 2000,
  maxRecordingDurationMs: 300000,
  outputFormat: 'wav',
  chunkOverlapMs: 200,
};

// Supported audio input backends
export const supportedAudioBackends = [
  'pyaudio',
  'sounddevice',
  'ffmpeg',
  'sox',
  'arecord',
];

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'live_microphone_audio_streamer');
