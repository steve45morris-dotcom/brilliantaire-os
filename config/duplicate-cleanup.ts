import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Constants
export const CLEANUP_SCAN_ONLY = true;
export const ALLOW_FILE_DELETION = false;
export const ALLOW_SOURCE_MODIFICATION = false;
export const ALLOW_MODEL_DIRECTORY_SCAN = false;
export const ALLOW_SECRET_FILE_SCAN = false;
export const REQUIRE_MANUAL_REVIEW = true;

// Allowed scan roots (relative or absolute)
export const ALLOWED_SCAN_ROOTS = [
  path.join(REPO_ROOT, 'outputs'),
  path.join(REPO_ROOT, 'voice_sessions'),
  path.join(REPO_ROOT, 'templates')
];

// Excluded roots (both folder basenames/paths and specific files)
export const EXCLUDED_ROOTS = [
  path.join(REPO_ROOT, '.git'),
  path.join(REPO_ROOT, 'node_modules'),
  path.join(REPO_ROOT, 'models'),
  path.join(REPO_ROOT, '.env'),
  path.join(REPO_ROOT, '.env.local'),
  path.join(REPO_ROOT, '.mcp.local.json'),
  path.join(REPO_ROOT, 'package-lock.json')
];

// Folder mappings for Cleanup outputs
export const cleanupFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'cleanup'),
  reports: path.join(REPO_ROOT, 'outputs', 'cleanup', 'reports'),
  quarantineIndex: path.join(REPO_ROOT, 'outputs', 'cleanup', 'quarantine_index'),
  reviewLists: path.join(REPO_ROOT, 'outputs', 'cleanup', 'review_lists'),
  logs: path.join(REPO_ROOT, 'outputs', 'cleanup', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'cleanup')
};
