import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Execution constraints
export const RESPONSE_INTELLIGENCE_ONLY = true;
export const ALLOW_LIVE_MCP_EXECUTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const ALLOW_NOTEBOOK_MODIFICATION = false;
export const ALLOW_AUTONOMOUS_ACTIONS = false;
export const REQUIRE_LOCAL_RESPONSE_RECORD = true;
export const REQUIRE_STAGED_OBSIDIAN_OUTPUT = true;

// Input folder mappings
export const inputFolders = {
  responses: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp', 'responses'),
  stagedExports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp', 'obsidian_staged_exports'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp', 'reports')
};

// Output folder mappings
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence'),
  citation_maps: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'citation_maps'),
  workflows: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'workflows'),
  weak_claims: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'weak_claims'),
  module_recommendations: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'module_recommendations'),
  prompt_packs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'prompt_packs'),
  obsidian_notes: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'obsidian_notes'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'response_intelligence')
};

// Supported commands
export const supportedCommands = [
  'citation-map',
  'workflows',
  'weak-claims',
  'module-recommendations',
  'prompt-packs',
  'obsidian-note',
  'summary',
  'all',
  'status'
];
