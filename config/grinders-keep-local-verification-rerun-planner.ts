import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

export const MODULE_NAME = 'Grinders Keep Local Verification Rerun Planner';

// Safety Constraints (locked to false)
export const COMMAND_EXECUTION_ALLOWED = false;
export const SCHEDULER_EXECUTION_ALLOWED = false;
export const EVIDENCE_VALIDATION_ALLOWED = false;
export const FILE_MOVE_ALLOWED = false;
export const FILE_COPY_ALLOWED = false;
export const AUTO_IMPORT_ALLOWED = false;

// Output Root setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'local_verification_rerun_planner');
export const outputFolders = {
  root: OUTPUT_ROOT,
  preflight: path.join(OUTPUT_ROOT, 'preflight'),
  commandSheets: path.join(OUTPUT_ROOT, 'command_sheets'),
  sequences: path.join(OUTPUT_ROOT, 'sequences'),
  blockers: path.join(OUTPUT_ROOT, 'blockers'),
  safety: path.join(OUTPUT_ROOT, 'safety'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  detectorSnapshot: path.join(REPO_ROOT, 'telemetry', 'grinders_keep_evidence_snapshot.json'),
  detectorReport: path.join(REPO_ROOT, 'stable_grinders_keep_evidence_completion_report.md'),
  firstAttemptReviewerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'first_evidence_attempt_reviewer', 'grinders_keep_first_attempt_review_manifest_2026-06-01.json'),
  firstImporterGateManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'first_evidence_importer_gate', 'grinders_keep_first_importer_gate_manifest_2026-06-01.json'),
  sessionLoggerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_session_logger', 'grinders_keep_session_logger_manifest_2026-06-01.json'),
  sessionImportBridgeManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_session_import_bridge', 'grinders_keep_session_import_bridge_manifest_2026-06-01.json'),
  evidencePackImporterManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_importer', 'grinders_keep_evidence_pack_importer_manifest_2026-06-01.json'),
  trackerSyncAdapterManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_sync_adapter', 'grinders_keep_evidence_tracker_sync_adapter_manifest_2026-06-01.json'),
  trackerRerunPlannerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_tracker_manual_rerun_planner', 'grinders_keep_evidence_tracker_manual_rerun_planner_manifest_2026-06-01.json'),
  
  sessionLogsDir: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection_sessions'),
  manualModelResponsesDir: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'manual_model_responses'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'config', 'commands.ts'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
