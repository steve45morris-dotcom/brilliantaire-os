import * as path from 'path';

const rootDir = process.cwd();

// Controlled directories for ASR backend assets
export const ASR_BINARY_DIR = path.join(rootDir, 'bin');
export const ASR_MODEL_DIR = path.join(rootDir, 'local_assets/whisper_models');
export const ASR_MANIFEST_PATH = path.join(rootDir, 'outputs/narrator/asr/asr-checksum-manifest.json');

// Security & Validation Whitelists
export const ALLOWED_ASR_BINARY_NAMES = ['whisper', 'whisper-cli'];
export const ALLOWED_ASR_MODEL_EXTENSIONS = ['.bin'];
export const MAX_ASR_MODEL_SIZE_LIMIT = 500 * 1024 * 1024; // 500 MB max for ggml models
