import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Operation Parameters
export const MODULE_NAME = 'Grinders Keep Gap Hunter';
export const LOCAL_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_DELETION = false;
export const ALLOW_FILE_MOVES = false;
export const ALLOW_AUTO_CLEANUP = false;

// Missing Source Detection targets
export const expectedFiles = [
  { path: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'), type: 'file', role: 'System Status Dashboard' },
  { path: path.join(REPO_ROOT, 'PROJECTS.md'), type: 'file', role: 'Projects Matrix' },
  { path: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'), type: 'file', role: 'Next Actions Checklist' },
  { path: path.join(REPO_ROOT, 'COMMANDS.md'), type: 'file', role: 'Command Router Documentation' },
  { path: path.join(REPO_ROOT, 'README.md'), type: 'file', role: 'System README Manual' },
  { path: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'), type: 'file', role: 'Background Scheduler Diagnostics' },
  { path: path.join(REPO_ROOT, 'cip_audit_report.md'), type: 'file', role: 'Collision Isolation Protocol Audit Report' }
];

export const expectedFolders = [
  { path: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'daily_brief'), role: 'Daily briefs output folder' },
  { path: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_learning'), role: 'Adaptive learning outputs' },
  { path: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'vault_awareness'), role: 'Vault awareness outputs' },
  { path: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_drafts'), role: 'Content drafts outputs' },
  { path: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_packets'), role: 'Consensus packets outputs' },
  { path: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'logs'), role: 'Execution logs folder' },
  { path: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge'), role: 'NotebookLM Bridge output folder' },
  { path: path.join(REPO_ROOT, 'outputs', 'grounded_narrator'), role: 'Grounded Narrator output folder' },
  { path: path.join(REPO_ROOT, 'outputs', 'asr_dry_run'), role: 'ASR Dry-Run outputs' },
  { path: path.join(REPO_ROOT, 'outputs', 'asr_preparation'), role: 'ASR Preparation outputs' },
  { path: path.join(REPO_ROOT, 'outputs', 'asr_validation'), role: 'ASR Validation outputs' },
  { path: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest'), role: 'Knowledge Harvest output folder' },
  { path: path.join(REPO_ROOT, 'outputs', 'mesh_telemetry'), role: 'Mesh Telemetry output folder' },
  { path: path.join(REPO_ROOT, 'outputs', 'manual_release'), role: 'Manual Release output folder' },
  { path: path.join(REPO_ROOT, 'outputs', 'distribution_metrics'), role: 'Distribution Metrics output folder' },
  { path: path.join(REPO_ROOT, 'reports', 'sentinel_safety'), role: 'Sentinel safety summaries reports folder' },
  { path: path.join(REPO_ROOT, 'reports', 'knowledge_harvest'), role: 'Knowledge Harvest reports folder' }
];

// Target directories for stale checks
export const staleCheckDirs = [
  path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge'),
  path.join(REPO_ROOT, 'outputs', 'grounded_narrator'),
  path.join(REPO_ROOT, 'outputs', 'asr_dry_run'),
  path.join(REPO_ROOT, 'outputs', 'asr_preparation'),
  path.join(REPO_ROOT, 'outputs', 'asr_validation'),
  path.join(REPO_ROOT, 'outputs', 'knowledge_harvest'),
  path.join(REPO_ROOT, 'outputs', 'mesh_telemetry'),
  path.join(REPO_ROOT, 'outputs', 'manual_release'),
  path.join(REPO_ROOT, 'outputs', 'distribution_metrics')
];

// Staging directory for Gap Hunter outputs
export const outputDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter');
export const logsDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter', 'logs');
export const templatesDir = path.join(REPO_ROOT, 'templates');
