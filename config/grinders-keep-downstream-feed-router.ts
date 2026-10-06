import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Downstream Feed Router';
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

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'downstream_feed_router');
export const outputFolders = {
  root: OUTPUT_ROOT,
  routes: path.join(OUTPUT_ROOT, 'routes'),
  blocked: path.join(OUTPUT_ROOT, 'blocked'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  manifests: path.join(OUTPUT_ROOT, 'manifests'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing
export const referenceSources = {
  validatorManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_intake_validator', 'grinders_keep_evidence_intake_validator_manifest_2026-06-01.json'),
  validatorDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_intake_validator'),
  collectionQueueDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_queue'),
  continuousImprovementDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'continuous_improvement'),
  postLaunchLedgerDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'post_launch_ledger'),
  manualReviewIntake: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_review_intake'),
  decisionSynthesisDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'decision_synthesis'),
  finalLaunchSwitchDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'final_launch_switch'),
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
  googleUltraDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'google_ultra'),
  consensusReviewDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_review'),
  contentLabDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab'),
  adaptiveDeepenerDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener'),
  gapHunterDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter'),
  dailyBriefDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'daily_brief'),
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
