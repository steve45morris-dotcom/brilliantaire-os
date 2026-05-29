import path from 'path';
import { REPO_ROOT } from './paths.js';

export const VOICE_INPUT_ROOT = path.join(REPO_ROOT, 'voice_input');
export const MANUAL_INPUT_DIR = path.join(VOICE_INPUT_ROOT, 'manual');
export const TRANSCRIPTS_DIR = path.join(VOICE_INPUT_ROOT, 'transcripts');
export const VIBEVOICE_LOG_DIR = path.join(REPO_ROOT, 'outputs', 'vibevoice_logs');
export const VOICE_QUEUE_INBOX = path.join(REPO_ROOT, 'voice_queue', 'inbox');

export const ACCEPTED_EXTENSIONS = ['.txt'];
export const TRANSCRIPT_PREFIX = 'vibevoice';
export const MAX_TRANSCRIPT_LENGTH = 500;
export const ENABLE_MICROPHONE = false;
export const REQUIRE_QUEUE_PROCESSING = true;
