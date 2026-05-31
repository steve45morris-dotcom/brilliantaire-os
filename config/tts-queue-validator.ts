import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const VALIDATION_ONLY = true;
export const ALLOW_TTS_GENERATION = false;
export const ALLOW_AUDIO_FILE_CREATION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_MANUAL_REVIEW = true;
export const REQUIRE_QUEUE_PACKET = true;
export const REQUIRE_VOICE_DIRECTION = true;
export const REQUIRE_SCRIPT_FILES = true;

// Spoken Word Limits
export const MAX_SHORT_SCRIPT_WORDS = 150;
export const MAX_MEDIUM_SCRIPT_WORDS = 450;
export const MAX_LONG_SCRIPT_WORDS = 900;

// Input folder mappings
export const inputFolders = {
  scripts: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'scripts'),
  queuePackets: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'queue_packets'),
  voiceDirections: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'voice_directions')
};

// Output folder mappings
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'tts_validation'),
  reports: path.join(REPO_ROOT, 'outputs', 'tts_validation', 'reports'),
  checklists: path.join(REPO_ROOT, 'outputs', 'tts_validation', 'checklists'),
  logs: path.join(REPO_ROOT, 'outputs', 'tts_validation', 'logs')
};
