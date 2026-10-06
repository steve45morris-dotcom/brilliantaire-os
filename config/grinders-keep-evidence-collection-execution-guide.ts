import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Collection Execution Guide';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;

// Safety overrides strictly locked to false
export const EVIDENCE_CREATION_ALLOWED = false;
export const FILE_MOVE_ALLOWED = false;
export const FILE_COPY_ALLOWED = false;
export const COMMAND_EXECUTION_ALLOWED = false;
export const EXTERNAL_TOOL_EXECUTION_ALLOWED = false;
export const EXTERNAL_MODEL_CALL_ALLOWED = false;
export const UPLOAD_OR_PUBLISH_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_execution_guide');
export const outputFolders = {
  root: OUTPUT_ROOT,
  steps: path.join(OUTPUT_ROOT, 'steps'),
  manualPrompts: path.join(OUTPUT_ROOT, 'manual_prompts'),
  googleUltraSteps: path.join(OUTPUT_ROOT, 'google_ultra_steps'),
  fileNaming: path.join(OUTPUT_ROOT, 'file_naming'),
  checklists: path.join(OUTPUT_ROOT, 'checklists'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  intakeLockManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'grinders_keep_intake_lock_manifest_2026-06-01.json'),
  intakeLockReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'grinders_keep_intake_lock_report_2026-06-01.md'),
  lockedTasks: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'locked_tasks', 'grinders_keep_locked_evidence_tasks_2026-06-01.md'),
  lockedTargets: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'locked_targets', 'grinders_keep_locked_target_paths_2026-06-01.md'),
  intakeChecklist: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'checklists', 'grinders_keep_intake_lock_commander_checklist_2026-06-01.md'),
  lockScorecard: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'scorecards', 'grinders_keep_lock_scorecard_2026-06-01.md'),
  driftWarnings: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'drift_warnings', 'grinders_keep_lock_drift_warnings_2026-06-01.md'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
