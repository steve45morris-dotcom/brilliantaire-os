import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Obsidian Sync Layer';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_DIRECT_VAULT_WRITE = false;
export const ALLOW_AUTO_SYNC = false;
export const ALLOW_VAULT_DELETION = false;
export const ALLOW_VAULT_MODIFICATION = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_VAULT_PRESENCE = true;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;

// Project context
export const PROJECT_NAME = 'Obsidian Sync Layer';
export const TOOL_TYPE = 'Unified Vault Sync Orchestration';
export const INTEGRATION_TARGET = 'AlexanderOSVault + Brilliantaire OS Outputs';

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'obsidian_sync_layer');
export const outputFolders = {
  root: OUTPUT_ROOT,
  syncManifests: path.join(OUTPUT_ROOT, 'sync_manifests'),
  routePreviews: path.join(OUTPUT_ROOT, 'route_previews'),
  syncReports: path.join(OUTPUT_ROOT, 'sync_reports'),
  vaultHealth: path.join(OUTPUT_ROOT, 'vault_health'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Vault candidate paths (mirrors config/paths.ts)
const homedir = os.homedir();
export const VAULT_CANDIDATE_PATHS = [
  path.join(homedir, 'AlexanderOSVault'),
  path.join(homedir, 'Obsidian'),
  path.join(homedir, 'ObsidianVault'),
  path.join(homedir, 'Documents', 'Obsidian'),
  path.join(homedir, 'Documents', 'IcyflamzeVault'),
  path.join(homedir, 'Projects', 'obsidian'),
  path.join(homedir, 'Projects', 'Obsidian'),
];

export const SAFE_WRITE_FOLDER = 'brilliantaire-briefs';

// Upstream source paths (read-only)
export const upstreamSources = {
  pathsConfig: path.join(REPO_ROOT, 'config', 'paths.ts'),
  ingestScript: path.join(REPO_ROOT, 'scripts', 'ingest-obsidian.ts'),
  stageWriteScript: path.join(REPO_ROOT, 'scripts', 'stage-obsidian-write.ts'),
  approveWriteScript: path.join(REPO_ROOT, 'scripts', 'approve-obsidian-write.ts'),
  writeLogScript: path.join(REPO_ROOT, 'scripts', 'write-log.ts'),
  syncStatusScript: path.join(REPO_ROOT, 'scripts', 'sync-status.ts'),
  narratorPy: path.join(REPO_ROOT, 'tools', 'ai_narrator.py'),
  ingestOutput: path.join(REPO_ROOT, 'outputs', 'obsidian_ingest'),
  writeStagingDir: path.join(REPO_ROOT, 'outputs', 'write_staging'),
  writeLogDir: path.join(REPO_ROOT, 'outputs', 'write_logs'),
};

// Module staging directories to scan for Obsidian-ready exports
export const moduleExportSources: { module: string; dir: string; pattern: string }[] = [
  { module: 'Write Gateway (core)', dir: path.join(REPO_ROOT, 'outputs', 'write_staging'), pattern: '*.md' },
  { module: 'Narrator Briefs', dir: path.join(REPO_ROOT, 'outputs', 'narrator', 'briefs'), pattern: 'obsidian_*.md' },
  { module: 'Narrator Cards', dir: path.join(REPO_ROOT, 'outputs', 'narrator', 'cards'), pattern: '*.json' },
  { module: 'Icyflamze Core', dir: path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'obsidian_staging'), pattern: '*.md' },
  { module: 'NotebookLM Dashboard', dir: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'obsidian_dashboard', 'markdown'), pattern: '*.md' },
  { module: 'Higgsfield AI', dir: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai', 'narrator_sync'), pattern: '*.md' },
  { module: 'Render Intake', dir: path.join(REPO_ROOT, 'outputs', 'render_intake', 'scans'), pattern: '*.md' },
  { module: 'Stripe Webhook Verification', dir: path.join(REPO_ROOT, 'outputs', 'stripe_webhook_verification'), pattern: '*obsidian_export*.md' },
  { module: 'ZK Webhook Verification', dir: path.join(REPO_ROOT, 'outputs', 'zk_webhook_verification'), pattern: '*obsidian_export*.md' },
  { module: 'Micro-Product Tree Groove', dir: path.join(REPO_ROOT, 'outputs', 'micro_product_tree_groove'), pattern: '*obsidian_export*.md' },
  { module: 'Live Microphone Streamer', dir: path.join(REPO_ROOT, 'outputs', 'live_microphone_audio_streamer'), pattern: '*obsidian_export*.md' },
  { module: 'ASR Human Approval', dir: path.join(REPO_ROOT, 'outputs', 'asr_human_approval_selection'), pattern: '*obsidian_export*.md' },
  { module: 'Grinders Keep Rerun', dir: path.join(REPO_ROOT, 'outputs', 'grinders_keep_verification_rerun'), pattern: '*obsidian_export*.md' },
  { module: 'Manual Implementation', dir: path.join(REPO_ROOT, 'outputs', 'manual_implementation_packet'), pattern: '*obsidian_export*.md' },
  { module: 'Platform Verification', dir: path.join(REPO_ROOT, 'outputs', 'platform_verification', 'reports'), pattern: '*.md' },
  { module: 'Brilliantaire Briefs (repo)', dir: path.join(REPO_ROOT, 'brilliantaire-briefs'), pattern: '*.md' },
];

// Vault subfolder routing rules
export const vaultRoutingRules: { filenamePrefix: string; vaultSubfolder: string }[] = [
  { filenamePrefix: 'daily_brief_', vaultSubfolder: 'daily' },
  { filenamePrefix: 'next_actions_', vaultSubfolder: 'next-actions' },
  { filenamePrefix: 'decisions_snapshot_', vaultSubfolder: 'decisions' },
  { filenamePrefix: 'project_snapshot_', vaultSubfolder: 'projects' },
  { filenamePrefix: 'write_log_', vaultSubfolder: 'logs' },
  { filenamePrefix: 'obsidian_narrator_brief_', vaultSubfolder: 'narrator' },
  { filenamePrefix: 'narrator_card_', vaultSubfolder: 'narrator' },
  { filenamePrefix: 'latest_task_explain', vaultSubfolder: 'narrator' },
  { filenamePrefix: 'ICYFLAMZE_CORE_', vaultSubfolder: 'icyflamze-core' },
  { filenamePrefix: 'notebooklm_', vaultSubfolder: 'notebooklm' },
  { filenamePrefix: 'stripe_webhook_verification_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'zk_webhook_verification_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'micro_product_tree_groove_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'live_microphone_audio_streamer_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'asr_human_approval_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'grinders_keep_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'manual_implementation_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'platform_verification_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'render_intake_', vaultSubfolder: 'tool-exports' },
  { filenamePrefix: 'higgsfield_', vaultSubfolder: 'tool-exports' },
];

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'obsidian_sync_layer');
