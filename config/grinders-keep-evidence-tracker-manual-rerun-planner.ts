import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Tracker Manual Rerun Planner';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;
export const ALLOW_COMMAND_EXECUTION = false;

// Tracker executions, revalidations, file moves/copies, and auto feed remain locked to false
export const TRACKER_RERUN_ALLOWED = false;
export const TRACKER_EXECUTION_ALLOWED = false;
export const EVIDENCE_VALIDATION_ALLOWED = false;
export const FILE_MOVE_ALLOWED = false;
export const FILE_COPY_ALLOWED = false;
export const AUTO_FEED_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_manual_rerun_planner');
export const outputFolders = {
  root: OUTPUT_ROOT,
  preflight: path.join(OUTPUT_ROOT, 'preflight'),
  manualCommands: path.join(OUTPUT_ROOT, 'manual_commands'),
  blocked: path.join(OUTPUT_ROOT, 'blocked'),
  risks: path.join(OUTPUT_ROOT, 'risks'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Input Scan Folders Setup
export const inputScanFolders = {
  evidenceCollection: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  syncManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_sync_adapter', 'grinders_keep_tracker_sync_manifest_2026-06-01.json'),
  syncReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_sync_adapter', 'grinders_keep_tracker_sync_report_2026-06-01.md'),
  secondaryInputsFeed: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_sync_adapter', 'tracker_inputs', 'grinders_keep_tracker_secondary_input_2026-06-01.md'),
  syncBlockedItems: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_sync_adapter', 'blocked', 'grinders_keep_sync_blocked_items_2026-06-01.md'),
  syncPathChecks: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_sync_adapter', 'path_checks', 'grinders_keep_sync_path_checks_2026-06-01.md'),
  syncScorecard: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_sync_adapter', 'scorecards', 'grinders_keep_sync_scorecard_2026-06-01.md'),
  importerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_importer', 'grinders_keep_evidence_pack_import_manifest_2026-06-01.json'),
  importerPhase12rReadyDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_importer', 'phase_12r_ready'),
  trackerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_completion_tracker', 'grinders_keep_evidence_completion_manifest_2026-06-01.json'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
