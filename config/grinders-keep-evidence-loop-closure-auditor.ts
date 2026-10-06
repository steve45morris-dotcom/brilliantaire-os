import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Loop Closure Auditor';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;
export const ALLOW_COMMAND_EXECUTION = false;
export const ALLOW_FILE_MOVING = false;
export const ALLOW_FILE_COPYING = false;
export const AUTO_EXECUTION_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_loop_closure_auditor');
export const outputFolders = {
  root: OUTPUT_ROOT,
  traces: path.join(OUTPUT_ROOT, 'traces'),
  linkChecks: path.join(OUTPUT_ROOT, 'link_checks'),
  blockers: path.join(OUTPUT_ROOT, 'blockers'),
  telemetry: path.join(OUTPUT_ROOT, 'telemetry'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Input Folders Setup
export const inputFolders = {
  evidenceCollection: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing
export const referenceSources = {
  collectionQueueManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_queue', 'grinders_keep_evidence_collection_manifest_2026-06-01.json'),
  collectionQueueReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_queue', 'grinders_keep_evidence_collection_report_2026-06-01.md'),

  intakeValidatorManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_intake_validator', 'grinders_keep_evidence_intake_validator_manifest_2026-06-01.json'),
  intakeValidatorReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_intake_validator', 'grinders_keep_evidence_intake_validator_report_2026-06-01.md'),

  downstreamFeedManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'downstream_feed_router', 'grinders_keep_downstream_router_manifest_2026-06-01.json'),
  downstreamFeedReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'downstream_feed_router', 'grinders_keep_downstream_router_report_2026-06-01.md'),

  actionBoardManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_evidence_action_board', 'grinders_keep_manual_evidence_action_manifest_2026-06-01.json'),
  actionBoardReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_evidence_action_board', 'grinders_keep_manual_evidence_action_board_2026-06-01.md'),

  completionManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_completion_tracker', 'grinders_keep_evidence_completion_manifest_2026-06-01.json'),
  completionReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_completion_tracker', 'grinders_keep_evidence_completion_report_2026-06-01.md'),

  revalidationManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_revalidation_trigger', 'grinders_keep_revalidation_manifest_2026-06-01.json'),
  revalidationReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_revalidation_trigger', 'grinders_keep_revalidation_trigger_report_2026-06-01.md'),

  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
