import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const LOCAL_SYNC_ONLY = true;
export const ALLOW_OBSIDIAN_WRITE = false; // local-first offline staging
export const REQUIRE_MANUAL_REVIEW = true;

// Input folder mappings (pointing to Phase 11O outputs)
export const inputFolders = {
  json: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'json'),
  markdown: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'markdown'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'reports')
};

// Output folder mappings for Obsidian Dashboard
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'obsidian_dashboard'),
  markdown: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'obsidian_dashboard', 'markdown'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'obsidian_dashboard', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'obsidian_dashboard', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'obsidian_dashboard')
};
