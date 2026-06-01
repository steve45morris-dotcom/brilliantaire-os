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

// Model Directory Configuration
export const modelDirectory = 'models/asr/whisper/';
export const EXPECTED_MANUAL_ENABLE_VAR = 'ASR_EXECUTION_ENABLED';

export const ALLOWED_MODEL_EXTENSIONS = ['.bin', '.pt', '.onnx', '.ggml', '.tflite'];

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'asr_model_gate'),
  guides: path.join(REPO_ROOT, 'outputs', 'asr_model_gate', 'guides'),
  inventory: path.join(REPO_ROOT, 'outputs', 'asr_model_gate', 'inventory'),
  reports: path.join(REPO_ROOT, 'outputs', 'asr_model_gate', 'reports'),
  checksums: path.join(REPO_ROOT, 'outputs', 'asr_model_gate', 'checksums'),
  logs: path.join(REPO_ROOT, 'outputs', 'asr_model_gate', 'logs')
};
