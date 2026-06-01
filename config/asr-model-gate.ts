import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const MODEL_GATE_ONLY = true;
export const ALLOW_MODEL_DOWNLOAD = false;
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_AUDIO_TRANSCRIPTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_SHELL_EXECUTION = false;
export const REQUIRE_MANUAL_MODEL_PLACEMENT = true;
export const REQUIRE_CHECKSUM_REVIEW = true;
export const REQUIRE_MANUAL_ENABLE = true;

// Model Settings
export const MODEL_DIRECTORY = path.join(REPO_ROOT, 'models', 'asr', 'whisper');
export const ALLOWED_MODEL_EXTENSIONS = ['.bin', '.pt', '.onnx', '.ggml', '.tflite'];
export const MANUAL_ENABLE_FLAG_NAME = 'ASR_EXECUTION_ENABLED';

// Directory Mappings
export const inputFolders = {
  recordings: path.join(REPO_ROOT, 'outputs/narrator/voice_sessions/recordings'),
  inputAudio: path.join(REPO_ROOT, 'outputs/narrator/asr/input_audio'),
  metadata: path.join(REPO_ROOT, 'outputs/narrator/voice_sessions/metadata'),
  asrOrchestratorReports: path.join(REPO_ROOT, 'outputs/narrator/voice_asr_orchestrator/reports')
};

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs/asr_model_gate'),
  guides: path.join(REPO_ROOT, 'outputs/asr_model_gate/guides'),
  inventory: path.join(REPO_ROOT, 'outputs/asr_model_gate/inventory'),
  reports: path.join(REPO_ROOT, 'outputs/asr_model_gate/reports'),
  checksums: path.join(REPO_ROOT, 'outputs/asr_model_gate/checksums'),
  logs: path.join(REPO_ROOT, 'outputs/asr_model_gate/logs')
};
