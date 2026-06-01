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

// Input folder mappings (pointing to Phase 11N response intelligence output folders)
export const inputFolders = {
  citationMaps: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'citation_maps'),
  weakClaims: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'weak_claims'),
  workflows: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'workflows'),
  moduleRecommendations: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'module_recommendations'),
  promptPacks: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'prompt_packs'),
  obsidianNotes: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'obsidian_notes'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'response_intelligence', 'reports')
};

// Output folder mappings for Grounded Graph Index
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index'),
  json: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'json'),
  markdown: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'markdown'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'grounded_index', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'grounded_index')
};

// Node Types
export const nodeTypes = [
  'claim',
  'citation',
  'weak_claim',
  'workflow',
  'recommendation',
  'prompt_pack',
  'obsidian_note',
  'agent'
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
  'stages_to_obsidian',
  'inferred_relation',
  'exact_relation'
];
