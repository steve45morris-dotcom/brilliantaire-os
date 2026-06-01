import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const MODEL_GATE_ONLY = true;
export const ALLOW_AUDIO_GENERATION = false;
export const ALLOW_PIPER_EXECUTION = false;
export const ALLOW_MODEL_DOWNLOAD = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_MANUAL_MODEL_PLACEMENT = true;
export const REQUIRE_MANUAL_ENABLE = true;
export const REQUIRE_VALIDATED_TTS_QUEUE = true;

// Model Settings
export const MODEL_DIRECTORY = path.join(REPO_ROOT, 'models', 'tts', 'piper');
export const ALLOWED_MODEL_EXTENSIONS = ['.onnx', '.json'];
export const REQUIRED_FILE_TYPES = ['model .onnx file', 'matching config .json file'];
export const MANUAL_ENABLE_FLAG_NAME = 'TTS_AUDIO_GENERATION_ENABLED';

// Input and Output Directory Mappings
export const inputFolders = {
  validationReports: path.join(REPO_ROOT, 'outputs', 'tts_validation', 'reports'),
  queuePackets: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'queue_packets'),
  voiceDirections: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'voice_directions'),
  scripts: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'scripts')
};

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'tts_model_gate'),
  reports: path.join(REPO_ROOT, 'outputs', 'tts_model_gate', 'reports'),
  checklists: path.join(REPO_ROOT, 'outputs', 'tts_model_gate', 'checklists'),
  logs: path.join(REPO_ROOT, 'outputs', 'tts_model_gate', 'logs')
};
