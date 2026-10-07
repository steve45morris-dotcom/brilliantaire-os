import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Continuous Improvement Loop';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;
export const ALLOW_COMMAND_EXECUTION = false;

// 1. Input Directories Setup (Phase 12L Output Root is input for Phase 12M)
export const INPUT_LEDGER_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'post_launch_ledger');

// 2. Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'continuous_improvement');
export const outputFolders = {
  root: OUTPUT_ROOT,
  signals: path.join(OUTPUT_ROOT, 'signals'),
  proposals: path.join(OUTPUT_ROOT, 'proposals'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing
export const referenceSources = {
  postLaunchLedgerDir: INPUT_LEDGER_ROOT,
  postLaunchLedgerReport: path.join(INPUT_LEDGER_ROOT, 'grinders_keep_post_launch_ledger_report_2026-06-01.md'),
  postLaunchTelemetry: path.join(INPUT_LEDGER_ROOT, 'telemetry', 'grinders_keep_post_launch_telemetry_2026-06-01.md'),
  postLaunchManifest: path.join(INPUT_LEDGER_ROOT, 'grinders_keep_post_launch_manifest_2026-06-01.json'),
  finalLaunchSwitchDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'final_launch_switch'),
  launchSwitchManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'final_launch_switch', 'grinders_keep_final_launch_manifest_2026-06-01.json'),
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
