import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope rules
export const MODULE_NAME = 'Grinders Keep Content Drafting Lab Deepener';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_SOCIAL_POSTS = false;
export const ALLOW_DELETION = false;
export const ALLOW_FILE_MOVES = false;
export const ALLOW_AUTO_CLEANUP = false;

// Staging directory paths
export const inputGapHunterDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter');
export const inputAdaptiveDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener');
export const outputDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab');
export const packagesDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab', 'packages');
export const logsDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab', 'logs');
export const templatesDir = path.join(REPO_ROOT, 'templates');

// Primary source telemetry files
export const primarySources = {
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
  frontpagePattern: 'grinders_keep_frontpage_*.md'
};
