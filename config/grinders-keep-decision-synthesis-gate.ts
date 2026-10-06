import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Decision Synthesis Gate';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_SOCIAL_POSTS = false;
export const ALLOW_DELETION = false;
export const ALLOW_FILE_MOVES = false;
export const ALLOW_AUTO_CLEANUP = false;

// 1. Input Directories Setup
export const INPUT_INTAKE_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_review_intake');
export const inputIntakeFolders = {
  root: INPUT_INTAKE_ROOT,
  validated: path.join(INPUT_INTAKE_ROOT, 'validated'),
  rejected: path.join(INPUT_INTAKE_ROOT, 'rejected'),
  scorecards: path.join(INPUT_INTAKE_ROOT, 'scorecards'),
  telemetry: path.join(INPUT_INTAKE_ROOT, 'telemetry'),
};

// 2. Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'decision_synthesis');
export const outputFolders = {
  root: OUTPUT_ROOT,
  checklists: path.join(OUTPUT_ROOT, 'checklists'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  telemetry: path.join(OUTPUT_ROOT, 'telemetry'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing/reference
export const referenceSources = {
  manualReviewIntakeDir: INPUT_INTAKE_ROOT,
  manualReviewManifest: path.join(INPUT_INTAKE_ROOT, 'grinders_keep_manual_review_intake_manifest_2026-06-01.json'),
  consensusReviewDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_review'),
  googleUltraDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'google_ultra'),
  contentLabDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab'),
  adaptiveDeepenerDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener'),
  gapHunterDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter'),
  dailyBriefDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'daily_brief'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  implementationReport12H: path.join(REPO_ROOT, 'phase_12h_implementation_report.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};

// Optional telemetry source files
export const optionalSources = {
  notebooklmBridge: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge'),
  groundedNarrator: path.join(REPO_ROOT, 'outputs', 'grounded_narrator'),
  asrDryRun: path.join(REPO_ROOT, 'outputs', 'asr_dry_run'),
  asrPreparation: path.join(REPO_ROOT, 'outputs', 'asr_preparation'),
  asrValidation: path.join(REPO_ROOT, 'outputs', 'asr_validation'),
  knowledgeHarvest: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest'),
  meshTelemetry: path.join(REPO_ROOT, 'outputs', 'mesh_telemetry'),
  distributionMetrics: path.join(REPO_ROOT, 'outputs', 'distribution_metrics'),
  sentinelSafetyReport: path.join(REPO_ROOT, 'reports', 'sentinel_safety'),
  knowledgeHarvestReport: path.join(REPO_ROOT, 'reports', 'knowledge_harvest'),
};
