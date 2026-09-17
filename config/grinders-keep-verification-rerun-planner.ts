import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Local Verification Rerun Planner';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_AUTOMATED_EXECUTION = false;
export const ALLOW_SCHEDULED_RUNS = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_MANUAL_COMMAND_EXECUTION = true;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;

// Project context
export const PROJECT_NAME = 'Grinders Keep Verification Rerun Planner';
export const TOOL_TYPE = 'Evidence Verification Rerun Planning';
export const INTEGRATION_TARGET = 'Grinders Keep Evidence Pipeline';

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep_verification_rerun');
export const outputFolders = {
  root: OUTPUT_ROOT,
  rerunPlans: path.join(OUTPUT_ROOT, 'rerun_plans'),
  commandSheets: path.join(OUTPUT_ROOT, 'command_sheets'),
  scheduleRecommendations: path.join(OUTPUT_ROOT, 'schedule_recommendations'),
  verificationStatus: path.join(OUTPUT_ROOT, 'verification_status'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Evidence source manifests (previous phase outputs)
export const evidenceSources = {
  phase12V: path.join(REPO_ROOT, 'outputs', 'evidence_pack_completion_importer'),
  phase12W: path.join(REPO_ROOT, 'outputs', 'evidence_tracker_sync'),
  phase12X: path.join(REPO_ROOT, 'outputs', 'evidence_tracker_rerun_planner'),
  phase13I: path.join(REPO_ROOT, 'outputs', 'evidence_completion_detector'),
};

// Supported verification task types
export const verificationTaskTypes = [
  'model-response-validation',
  'google-output-cross-check',
  'compliance-report-audit',
  'screenshot-visual-confirm',
  'monetization-proof-verify',
  'audit-report-review',
  'evidence-completeness-check',
];

// Rerun scheduling modes (advisory only)
export const schedulingModes = [
  'immediate-manual',
  'next-session',
  'daily-batch',
  'weekly-review',
  'on-demand',
];

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'grinders_keep_verification_rerun');
