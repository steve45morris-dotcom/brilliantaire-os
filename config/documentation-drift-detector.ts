import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

export const MODULE_NAME = 'Documentation Drift Detector';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_AUTO_FIX = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_MANUAL_REVIEW = true;

export const PROJECT_NAME = 'Documentation Drift Detector';
export const TOOL_TYPE = 'System Index Consistency Auditor';
export const INTEGRATION_TARGET = 'SYSTEM_STATUS.md + COMMANDS.md + dashboard-data.json + NARRATOR.md + MESH_TELEMETRY.md + config/narrator-sources.ts + config/voice-commands.ts + config/commands.ts + package.json';

export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'documentation_drift');
export const outputFolders = {
  root: OUTPUT_ROOT,
  reports: path.join(OUTPUT_ROOT, 'reports'),
  audits: path.join(OUTPUT_ROOT, 'audits'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'documentation_drift_detector');

// The 8 system indexes that must stay in sync
export const systemIndexes = [
  { name: 'SYSTEM_STATUS.md', path: 'SYSTEM_STATUS.md', type: 'status' },
  { name: 'COMMANDS.md', path: 'COMMANDS.md', type: 'commands' },
  { name: 'VOICE_COMMANDS.md', path: 'VOICE_COMMANDS.md', type: 'voice' },
  { name: 'config/voice-commands.ts', path: 'config/voice-commands.ts', type: 'voice-config' },
  { name: 'NARRATOR.md', path: 'NARRATOR.md', type: 'narrator' },
  { name: 'config/narrator-sources.ts', path: 'config/narrator-sources.ts', type: 'narrator-config' },
  { name: 'MESH_TELEMETRY.md', path: 'MESH_TELEMETRY.md', type: 'telemetry' },
  { name: 'dashboard/public/dashboard-data.json', path: 'dashboard/public/dashboard-data.json', type: 'dashboard' },
];

// Cross-reference targets
export const crossReferenceTargets = [
  { source: 'config/commands.ts', target: 'COMMANDS.md', field: 'command-names' },
  { source: 'config/commands.ts', target: 'package.json', field: 'npm-scripts' },
  { source: 'config/voice-commands.ts', target: 'VOICE_COMMANDS.md', field: 'voice-phrases' },
  { source: 'config/narrator-sources.ts', target: 'NARRATOR.md', field: 'approved-sources' },
  { source: 'SYSTEM_STATUS.md', target: 'NEXT_ACTIONS.md', field: 'next-upgrade-pointer' },
];

// Drift categories
export const driftCategories = [
  'stale-pointer',
  'missing-command-doc',
  'missing-npm-script',
  'orphaned-template',
  'missing-output-dir',
  'index-desync',
  'missing-voice-command',
] as const;
