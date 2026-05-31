/**
 * Git Asset Guard - Policy Configuration
 * Defines rules for file tracking, size limitations, and sensitive file checks.
 */

export const FORBIDDEN_FOLDERS = [
  'local_assets/',
  'outputs/narrator/tts_queue/models/',
  'outputs/narrator/tts_queue/rendered_audio/',
  'node_modules/',
  'dashboard/node_modules/',
  'dist/',
  'build/',
  '.next/',
  '.astro/',
  '.venv/',
  '__pycache__/'
];

export const FORBIDDEN_EXTENSIONS = [
  '.wav',
  '.mp3',
  '.mp4',
  '.mov',
  '.tar.gz',
  '.zip',
  '.7z',
  '.onnx',
  '.bin',
  '.pt',
  '.pth',
  '.ckpt',
  '.safetensors'
];

export const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  'service-account.json',
  'credentials.json',
  'token.json'
];

// Maximum allowed tracked file size: 25 MB
export const MAX_TRACKED_FILE_SIZE_MB = 25;
export const MAX_TRACKED_FILE_SIZE_BYTES = MAX_TRACKED_FILE_SIZE_MB * 1024 * 1024;
