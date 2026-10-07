import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const ENGINE_NAME = 'Grinders Keep';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_AUTOMATIC_BUILDS = false;
export const ALLOW_TTS_GENERATION = false;
export const ALLOW_ASR_TRANSCRIPTION = false;
export const ALLOW_MODEL_DOWNLOADS = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_SECRET_PRINTING = false;
export const ALLOW_DESTRUCTIVE_CLEANUP = false;
export const FAIL_CLOSED_ON_AMBIGUOUS_METADATA = true;

// Input Files mapping
export const inputFiles = {
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
  cipAuditReport: path.join(REPO_ROOT, 'cip_audit_report.md'),
  sentinelSafetySummaryPattern: 'sentinel_safety_summary_*.md' // To search YYYY-MM-DD
};

// Input Directories mapping
export const inputDirectories = {
  notebooklmBridge: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge'),
  groundedNarrator: path.join(REPO_ROOT, 'outputs', 'grounded_narrator'),
  asrDryRun: path.join(REPO_ROOT, 'outputs', 'asr_dry_run'),
  asrPreparation: path.join(REPO_ROOT, 'outputs', 'asr_preparation'),
  asrValidation: path.join(REPO_ROOT, 'outputs', 'asr_validation'),
  grindersKeep: path.join(REPO_ROOT, 'outputs', 'grinders_keep'),
  knowledgeHarvest: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest'),
  meshTelemetry: path.join(REPO_ROOT, 'outputs', 'mesh_telemetry'),
  manualRelease: path.join(REPO_ROOT, 'outputs', 'manual_release'),
  distributionMetrics: path.join(REPO_ROOT, 'outputs', 'distribution_metrics'),
  reportsSentinelSafety: path.join(REPO_ROOT, 'reports', 'sentinel_safety'),
  reportsKnowledgeHarvest: path.join(REPO_ROOT, 'reports', 'knowledge_harvest')
};

// Output Directories mapping
export const outputDirectories = {
  root: path.join(REPO_ROOT, 'outputs', 'grinders_keep'),
  dailyBrief: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'daily_brief'),
  adaptiveLearning: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_learning'),
  vaultAwareness: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'vault_awareness'),
  contentDrafts: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_drafts'),
  consensusPackets: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_packets'),
  logs: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'logs')
};

// Candidate Vault Paths for Multi-Vault Awareness
export const obsidianCandidateVaults = [
  path.join(REPO_ROOT, 'AlexanderOSVault'),
  path.join(REPO_ROOT, 'Obsidian'),
  path.join(REPO_ROOT, 'ObsidianVault'),
  path.join(REPO_ROOT, 'Documents', 'Obsidian'),
  path.join(REPO_ROOT, 'Documents', 'IcyflamzeVault')
];
