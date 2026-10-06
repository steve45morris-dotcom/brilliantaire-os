import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Collection Queue';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;
export const ALLOW_COMMAND_EXECUTION = false;

// 1. Input Directories Setup
export const INPUT_EV_ROOT = path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection');
export const inputFolders = {
  root: INPUT_EV_ROOT,
  manualModelResponses: path.join(INPUT_EV_ROOT, 'manual_model_responses'),
  googleUltraOutputs: path.join(INPUT_EV_ROOT, 'google_ultra_outputs'),
  reports: path.join(INPUT_EV_ROOT, 'reports'),
  screenshots: path.join(INPUT_EV_ROOT, 'screenshots'),
  notes: path.join(INPUT_EV_ROOT, 'notes'),
  monetizationProof: path.join(INPUT_EV_ROOT, 'monetization_proof'),
  auditReports: path.join(INPUT_EV_ROOT, 'audit_reports'),
};

// 2. Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_queue');
export const outputFolders = {
  root: OUTPUT_ROOT,
  tasks: path.join(OUTPUT_ROOT, 'tasks'),
  intakeMaps: path.join(OUTPUT_ROOT, 'intake_maps'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing
export const referenceSources = {
  continuousImprovementDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'continuous_improvement'),
  continuousImprovementReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'continuous_improvement', 'grinders_keep_continuous_improvement_report_2026-06-01.md'),
  continuousImprovementManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'continuous_improvement', 'grinders_keep_continuous_improvement_manifest_2026-06-01.json'),
  postLaunchLedgerDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'post_launch_ledger'),
  finalLaunchSwitchDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'final_launch_switch'),
  executionQueueDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'execution_approval_queue'),
  decisionSynthesisDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'decision_synthesis'),
  manualReviewIntake: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_review_intake'),
  googleUltra: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'google_ultra'),
  consensusReview: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_review'),
  contentLab: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab'),
  adaptiveDeepener: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener'),
  gapHunter: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter'),
  dailyBrief: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'daily_brief'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};

// Optional telemetry source files
export const optionalSources = {
  notebooklmBridgeDir: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge'),
  groundedNarratorDir: path.join(REPO_ROOT, 'outputs', 'grounded_narrator'),
  asrDryRunDir: path.join(REPO_ROOT, 'outputs', 'asr_dry_run'),
  asrPreparationDir: path.join(REPO_ROOT, 'outputs', 'asr_preparation'),
  asrValidationDir: path.join(REPO_ROOT, 'outputs', 'asr_validation'),
  knowledgeHarvestDir: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest'),
  meshTelemetryDir: path.join(REPO_ROOT, 'outputs', 'mesh_telemetry'),
  distributionMetricsDir: path.join(REPO_ROOT, 'outputs', 'distribution_metrics'),
  sentinelSafetyReport: path.join(REPO_ROOT, 'reports', 'sentinel_safety'),
  knowledgeHarvestReport: path.join(REPO_ROOT, 'reports', 'knowledge_harvest'),
};
