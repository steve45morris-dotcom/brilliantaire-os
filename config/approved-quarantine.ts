import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Constants
export const QUARANTINE_ONLY = true;
export const ALLOW_FILE_DELETION = false;
export const ALLOW_PROTECTED_FILE_TOUCH = false;
export const REQUIRE_APPROVAL_LIST = true;
export const REQUIRE_CONFIRM_FLAG = true;
export const REQUIRE_ROLLBACK_MANIFEST = true;
export const REQUIRE_DRY_RUN_FIRST = true;

// Input Folders
export const inputFolders = {
  approvalLists: path.join(REPO_ROOT, 'outputs', 'cleanup_approval', 'approval_lists'),
  doNotTouch: path.join(REPO_ROOT, 'outputs', 'cleanup_approval', 'do_not_touch'),
  reports: path.join(REPO_ROOT, 'outputs', 'cleanup_approval', 'reports')
};

// Output Folders
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'cleanup_execution'),
  quarantine: path.join(REPO_ROOT, 'outputs', 'cleanup_execution', 'quarantine'),
  manifests: path.join(REPO_ROOT, 'outputs', 'cleanup_execution', 'manifests'),
  rollback: path.join(REPO_ROOT, 'outputs', 'cleanup_execution', 'rollback'),
  reports: path.join(REPO_ROOT, 'outputs', 'cleanup_execution', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'cleanup_execution', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'cleanup_execution')
};

// Protected File/Folder List
export const DO_NOT_TOUCH_PATTERNS = [
  '.git/',
  'node_modules/',
  'models/',
  '.env',
  '.env.local',
  '.mcp.local.json',
  'package-lock.json',
  'package.json',
  'Taskfile.yml',
  'config/commands.ts',
  'SYSTEM_STATUS.md',
  'PROJECTS.md',
  'NEXT_ACTIONS.md',
  'README.md'
];
