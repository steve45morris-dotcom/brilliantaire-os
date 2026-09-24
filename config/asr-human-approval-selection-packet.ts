import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Offline ASR Human Approval Selection Packet';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_AUTOMATED_ASR = false;
export const ALLOW_MODEL_DOWNLOADS = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_MANUAL_SELECTION = true;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;

// Project context
export const PROJECT_NAME = 'ASR Human Approval Selection Packet';
export const TOOL_TYPE = 'ASR Candidate & Model Selection Staging';
export const INTEGRATION_TARGET = 'Offline ASR Execution Pipeline';

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'asr_human_approval_selection');
export const outputFolders = {
  root: OUTPUT_ROOT,
  selectionPackets: path.join(OUTPUT_ROOT, 'selection_packets'),
  candidateReviews: path.join(OUTPUT_ROOT, 'candidate_reviews'),
  modelReviews: path.join(OUTPUT_ROOT, 'model_reviews'),
  approvalRecords: path.join(OUTPUT_ROOT, 'approval_records'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Upstream ASR pipeline sources (read-only)
export const asrSources = {
  asrOrchestrator: path.join(REPO_ROOT, 'outputs', 'asr_orchestrator'),
  asrModelGate: path.join(REPO_ROOT, 'outputs', 'asr_model_gate'),
  liveAsrLogs: path.join(REPO_ROOT, 'outputs', 'live_asr_logs'),
  voiceCommandLogs: path.join(REPO_ROOT, 'outputs', 'voice_command_logs'),
};

// Supported ASR model families (for selection staging only)
export const supportedModelFamilies = [
  'whisper-tiny',
  'whisper-base',
  'whisper-small',
  'whisper-medium',
  'whisper-large-v3',
];

// Candidate evaluation criteria
export const evaluationCriteria = [
  'accuracy-benchmark',
  'latency-profile',
  'memory-footprint',
  'language-coverage',
  'offline-compatibility',
];

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'asr_human_approval_selection');
