import * as path from 'path';

const rootDir = process.cwd();

// Directories for controlled assets
export const PIPER_BINARY_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/bin');
export const PIPER_MODEL_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/models');
export const PIPER_CONFIG_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/models'); // Keep config/model files together
export const RENDERED_AUDIO_CACHE_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/rendered_audio');

// Checksum manifest JSON file path
export const CHECKSUM_MANIFEST_PATH = path.join(rootDir, 'outputs/narrator/tts_queue/checksum-manifest.json');

// Allowed configurations & security limits
export const ALLOWED_BINARY_NAMES = ['piper', 'piper-tts'];
export const ALLOWED_MODEL_EXTENSIONS = ['.onnx'];
export const ALLOWED_CONFIG_EXTENSIONS = ['.json'];

// Safety constraints
export const ALLOW_EXTERNAL_DOWNLOADS = false;
export const MANUAL_INSTALL_MODE = true;
export const DEFAULT_VOICE_PROFILE = 'oracle-neutral';
export const CACHE_ENABLED = true;
export const OVERWRITE_EXISTING_AUDIO = false;

// File size limits (protection against resource exhaustion)
export const MAX_MODEL_SIZE_LIMIT = 200 * 1024 * 1024; // 200 MB max for voice models
export const MAX_CONFIG_SIZE_LIMIT = 1 * 1024 * 1024;   // 1 MB max for model configs
