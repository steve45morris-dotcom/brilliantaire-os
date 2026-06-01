import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Narration Constraints
export const ALLOW_TTS_AUDIO = false; // TTS audio compilation is prohibited in this phase
export const ALLOW_EXTERNAL_API = false;
export const DEFAULT_APPROVED_FOR_VOICE = false; // All voice items default to false review status

// Input mappings (primary = Phase 11P-A dashboard, secondary = Phase 11O index graph JSON)
export const inputFolders = {
  dashboards: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'obsidian_dashboard', 'markdown'),
  graphs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'json')
};

// Output mappings for Narrator Review Queue
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'grounded_narrator'),
  reviewQueue: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'review_queue'),
  briefs: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'briefs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'narrator_review_queue')
};
