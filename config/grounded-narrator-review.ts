import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const REVIEW_ONLY = true;
export const ALLOW_TTS_GENERATION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const REQUIRE_CITATION_OR_SOURCE = true;
export const REQUIRE_MANUAL_REVIEW = true;
export const MAX_BRIEF_LENGTH = 1200;

// Input folder mappings
export const inputFolders = {
  json: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'json'),
  markdown: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'markdown'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'reports')
};

// Output folder mappings
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'grounded_narrator'),
  reviewQueue: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'review_queue'),
  briefs: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'briefs'),
  rejected: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'rejected'),
  logs: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'logs')
};

// Candidate Types
export const candidateTypes = [
  'insight',
  'workflow_card',
  'os_module_suggestion',
  'weak_claim',
  'next_action',
  'risk_note'
];

// Review Statuses
export const reviewStatuses = [
  'ready_for_narrator_review',
  'needs_source_check',
  'too_weak',
  'rejected',
  'approved_for_future_tts'
];
