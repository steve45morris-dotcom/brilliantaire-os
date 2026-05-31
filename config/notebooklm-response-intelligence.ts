import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Execution constraints
export const RESPONSE_PROCESSING_ONLY = true;
export const ALLOW_LIVE_MCP_EXECUTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const REQUIRE_OBSIDIAN_STAGING = true;
export const REQUIRE_MANUAL_REVIEW = true;
export const MAX_RESPONSE_LENGTH = 20000;

// Input folder mappings
export const inputFolders = {
  liveResponses: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_adapter', 'responses'),
  manualAnswers: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'manual_answers')
};

// Output folder mappings
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence'),
  insightIndexes: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'insight_indexes'),
  citationMaps: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'citation_maps'),
  weakClaims: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'weak_claims'),
  workflowCards: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'workflow_cards'),
  osModuleSuggestions: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'os_module_suggestions'),
  obsidianStagedNotes: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'obsidian_staged_notes'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'logs')
};

// Approved intelligence categories for tagging and routing
export const approvedCategories = [
  'AI automation',
  'AI agents',
  'SEO',
  'YouTube growth',
  'content systems',
  'workflow automation',
  'prompt engineering',
  'monetization',
  'Brilliantaire OS architecture',
  'Icyflamze campaign systems',
  'Tree Groove Records operations'
];
