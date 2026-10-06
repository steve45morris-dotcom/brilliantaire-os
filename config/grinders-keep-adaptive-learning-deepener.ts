import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope boundaries
export const MODULE_NAME = 'Grinders Keep Adaptive Learning Deepener';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_DELETION = false;
export const ALLOW_FILE_MOVES = false;
export const ALLOW_AUTO_CLEANUP = false;
export const ALLOW_AUTOMATIC_FIXES = false;

// Staging directories
export const inputGapHunterDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter');
export const outputDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener');
export const logsDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener', 'logs');
export const templatesDir = path.join(REPO_ROOT, 'templates');

// Whitelisted files to read
export const primarySources = {
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md')
};
