import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const ACQUISITION_GUIDE_ONLY = true;
export const ALLOW_MODEL_DOWNLOAD = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_AUDIO_GENERATION = false;
export const ALLOW_PIPER_EXECUTION = false;
export const ALLOW_ENV_WRITE = false;
export const REQUIRE_MANUAL_MODEL_PLACEMENT = true;

// Directories & Files Setup
export const MODEL_DIRECTORY = path.join(REPO_ROOT, 'models', 'tts', 'piper');
export const ALLOWED_MODEL_EXTENSIONS = ['.onnx', '.json'];
export const MANUAL_ENABLE_FLAG_NAME = 'TTS_AUDIO_GENERATION_ENABLED';

export const inputFolders = {
  validationReports: path.join(REPO_ROOT, 'outputs', 'tts_validation', 'reports'),
  gateReports: path.join(REPO_ROOT, 'outputs', 'tts_model_gate', 'reports'),
  activationReports: path.join(REPO_ROOT, 'outputs', 'tts_model_activation', 'reports')
};

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'tts_model_acquisition'),
  guides: path.join(REPO_ROOT, 'outputs', 'tts_model_acquisition', 'guides'),
  inventory: path.join(REPO_ROOT, 'outputs', 'tts_model_acquisition', 'inventory'),
  reports: path.join(REPO_ROOT, 'outputs', 'tts_model_acquisition', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'tts_model_acquisition', 'logs')
};
