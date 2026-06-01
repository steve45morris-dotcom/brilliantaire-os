import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Constants
export const APPROVAL_GATE_ONLY = true;
export const ALLOW_FILE_DELETION = false;
export const ALLOW_FILE_MOVEMENT = false;
export const ALLOW_SOURCE_MODIFICATION = false;
export const REQUIRE_MANUAL_REVIEW = true;
export const REQUIRE_APPROVAL_BEFORE_QUARANTINE = true;

// Input Folders
export const inputFolders = {
  reports: path.join(REPO_ROOT, 'outputs', 'cleanup', 'reports'),
  quarantineIndex: path.join(REPO_ROOT, 'outputs', 'cleanup', 'quarantine_index'),
  reviewLists: path.join(REPO_ROOT, 'outputs', 'cleanup', 'review_lists')
};

// Output Folders
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'cleanup_approval'),
  reports: path.join(REPO_ROOT, 'outputs', 'cleanup_approval', 'reports'),
  approvalLists: path.join(REPO_ROOT, 'outputs', 'cleanup_approval', 'approval_lists'),
  doNotTouch: path.join(REPO_ROOT, 'outputs', 'cleanup_approval', 'do_not_touch'),
  logs: path.join(REPO_ROOT, 'outputs', 'cleanup_approval', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'cleanup_approval')
};

// Approval Categories
export const APPROVAL_CATEGORIES = {
  APPROVE_FOR_QUARANTINE: 'approve_for_quarantine',
  NEEDS_MANUAL_REVIEW: 'needs_manual_review',
  DO_NOT_TOUCH: 'do_not_touch',
  LOW_CONFIDENCE_DUPLICATE: 'low_confidence_duplicate',
  STALE_BUT_RECENT: 'stale_but_recent',
  ORPHAN_CANDIDATE: 'orphan_candidate',
  SAFE_TO_IGNORE: 'safe_to_ignore'
};

// Protected File/Folder list
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
