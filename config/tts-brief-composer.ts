import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const COMPOSER_ONLY = true;
export const ALLOW_TTS_GENERATION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_AUDIO_FILE_CREATION = false;
export const REQUIRE_SOURCE_BRIEF = true;
export const REQUIRE_MANUAL_REVIEW = true;

// Words Limit Rules
export const MAX_SHORT_SCRIPT_WORDS = 150;
export const MAX_MEDIUM_SCRIPT_WORDS = 450;
export const MAX_LONG_SCRIPT_WORDS = 900;

// Input folder mappings
export const inputFolders = {
  briefs: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'briefs'),
  reviewQueue: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'review_queue'),
  rejected: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'rejected')
};

// Output folder mappings
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'tts_briefs'),
  scripts: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'scripts'),
  queuePackets: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'queue_packets'),
  voiceDirections: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'voice_directions'),
  logs: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'logs')
};

// Supported Script Types
export const scriptTypes = ['short', 'medium', 'long', 'all'];

// Voice Direction Profiles
export const voiceDirectionProfiles = [
  'calm analyst',
  'strategic narrator',
  'energetic briefing',
  'oracle voice',
  'campaign command voice'
];
