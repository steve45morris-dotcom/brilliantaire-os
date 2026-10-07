import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

export const MODULE_NAME = 'System Diagnostics Runner';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_LIVE_REMEDIATION = false;
export const ALLOW_AUTO_FIX = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_ALL_CHECKS_PASS = false;

export const PROJECT_NAME = 'System Diagnostics Runner';
export const TOOL_TYPE = 'Unified System Health & Diagnostics';
export const INTEGRATION_TARGET = 'Vitest + Module Configs + Integration Registry + Dashboard Telemetry';

export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'system_diagnostics');
export const outputFolders = {
  root: OUTPUT_ROOT,
  testReports: path.join(OUTPUT_ROOT, 'test_reports'),
  moduleHealth: path.join(OUTPUT_ROOT, 'module_health'),
  configAudits: path.join(OUTPUT_ROOT, 'config_audits'),
  integrationStatus: path.join(OUTPUT_ROOT, 'integration_status'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'system_diagnostics_runner');

export const diagnosticModules = [
  'config/commands.ts',
  'config/tree-groove-release-pipeline.ts',
  'config/obsidian-sync-layer.ts',
  'config/stripe-webhook-verification.ts',
  'config/zk-webhook-verification.ts',
  'config/micro-product-tree-groove-connector.ts',
  'config/live-microphone-audio-streamer.ts',
];

export const diagnosticCategories: { id: string; name: string; description: string }[] = [
  { id: 'test-suite', name: 'Test Suite', description: 'Vitest pass/fail/skip counts and duration' },
  { id: 'module-health', name: 'Module Health', description: 'Config file presence and safety flag validation' },
  { id: 'config-audit', name: 'Config Audit', description: 'Command registry integrity and duplicate detection' },
  { id: 'integration-status', name: 'Integration Status', description: 'UIF registry and GitHub integration health' },
  { id: 'output-inventory', name: 'Output Inventory', description: 'Generated output directory file counts' },
  { id: 'dependency-check', name: 'Dependency Check', description: 'Node modules and optional dependency availability' },
];

export const healthCheckTargets: { name: string; path: string; type: 'file' | 'directory' }[] = [
  { name: 'Command Registry', path: 'config/commands.ts', type: 'file' },
  { name: 'Package JSON', path: 'package.json', type: 'file' },
  { name: 'Vitest Config', path: 'vitest.config.ts', type: 'file' },
  { name: 'Taskfile', path: 'Taskfile.yml', type: 'file' },
  { name: 'Dashboard App', path: 'dashboard/src/App.tsx', type: 'file' },
  { name: 'Source Directory', path: 'src', type: 'directory' },
  { name: 'Scripts Directory', path: 'scripts', type: 'directory' },
  { name: 'Config Directory', path: 'config', type: 'directory' },
  { name: 'Templates Directory', path: 'templates', type: 'directory' },
  { name: 'Dashboard Directory', path: 'dashboard', type: 'directory' },
  { name: 'Tools Directory', path: 'tools', type: 'directory' },
  { name: 'Outputs Directory', path: 'outputs', type: 'directory' },
];

export const outputDirectoriesToScan = [
  'outputs/command_logs',
  'outputs/campaigns',
  'outputs/platform_verification',
  'outputs/write_staging',
  'outputs/narrator_audio_queue',
  'outputs/tree_groove_release_pipeline',
  'outputs/micro_product_tree_groove',
  'outputs/obsidian_sync',
  'outputs/system_diagnostics',
];
