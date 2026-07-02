import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Pack Completion Importer';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;
export const ALLOW_COMMAND_EXECUTION = false;
export const FILE_MOVE_ALLOWED = false;
export const FILE_COPY_ALLOWED = false;
export const EVIDENCE_CREATION_ALLOWED = false;
export const AUTO_FEED_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_importer');
export const outputFolders = {
  root: OUTPUT_ROOT,
  imported: path.join(OUTPUT_ROOT, 'imported'),
  detectedFiles: path.join(OUTPUT_ROOT, 'detected_files'),
  completionStatus: path.join(OUTPUT_ROOT, 'completion_status'),
  phase12rReady: path.join(OUTPUT_ROOT, 'phase_12r_ready'),
  blocked: path.join(OUTPUT_ROOT, 'blocked'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Input Scan Folders Setup
export const inputScanFolders = {
  evidenceCollection: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection'),
  manualModelResponses: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'manual_model_responses'),
  googleUltraOutputs: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'google_ultra_outputs'),
  reports: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'reports'),
  screenshots: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'screenshots'),
  notes: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'notes'),
  monetizationProof: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'monetization_proof'),
  auditReports: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'audit_reports'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  packBuilderManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_builder', 'grinders_keep_evidence_pack_manifest_2026-06-01.json'),
  packBuilderPacket: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_builder', 'packet', 'grinders_keep_commander_evidence_collection_packet_2026-06-01.md'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
  completionManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_completion_tracker', 'grinders_keep_evidence_completion_manifest_2026-06-01.json'),
  loopAuditorManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_loop_closure_auditor', 'grinders_keep_evidence_loop_closure_manifest_2026-06-01.json'),
  actionBoardManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_evidence_action_board', 'grinders_keep_manual_evidence_action_manifest_2026-06-01.json'),
};
