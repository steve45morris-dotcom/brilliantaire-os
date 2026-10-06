import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Collection Intake Lock';
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

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock');
export const outputFolders = {
  root: OUTPUT_ROOT,
  lockedTasks: path.join(OUTPUT_ROOT, 'locked_tasks'),
  lockedTargets: path.join(OUTPUT_ROOT, 'locked_targets'),
  integrityChecks: path.join(OUTPUT_ROOT, 'integrity_checks'),
  driftWarnings: path.join(OUTPUT_ROOT, 'drift_warnings'),
  checklists: path.join(OUTPUT_ROOT, 'checklists'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  workbenchManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_workbench', 'grinders_keep_evidence_workbench_manifest_2026-06-01.json'),
  workbenchReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_workbench', 'grinders_keep_evidence_workbench_report_2026-06-01.md'),
  packManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_builder', 'grinders_keep_evidence_pack_manifest_2026-06-01.json'),
  importerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_importer', 'grinders_keep_evidence_pack_import_manifest_2026-06-01.json'),
  syncManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_sync_adapter', 'grinders_keep_tracker_sync_manifest_2026-06-01.json'),
  rerunManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep/evidence_tracker_manual_rerun_planner', 'grinders_keep_tracker_rerun_manifest_2026-06-01.json'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
