import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Security & Local Constraints
export const LOCAL_GRAPH_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_VECTOR_DB_WRITE = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const REQUIRE_MANUAL_REVIEW = true;
export const MAX_GRAPH_NODES = 500;
export const MAX_GRAPH_EDGES = 1000;

// Input folder mappings
export const inputFolders = {
  insightIndexes: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'insight_indexes'),
  citationMaps: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'citation_maps'),
  weakClaims: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'weak_claims'),
  workflowCards: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'workflow_cards'),
  osModuleSuggestions: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'os_module_suggestions'),
  obsidianStagedNotes: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'obsidian_staged_notes')
};

// Output folder mappings
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index'),
  json: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'json'),
  markdown: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'markdown'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'logs')
};

// Node Types
export const nodeTypes = [
  'source_response',
  'insight',
  'citation',
  'weak_claim',
  'workflow_card',
  'os_module_suggestion',
  'obsidian_staged_note',
  'agent',
  'risk',
  'next_action'
];

// Edge Types
export const edgeTypes = [
  'supports',
  'derived_from',
  'contradicts',
  'needs_verification',
  'suggests_module',
  'owned_by_agent',
  'becomes_next_action',
  'stages_to_obsidian'
];
