import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Strict Security Options
export const SCORING_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const ALLOW_NEXT_ACTIONS_WRITE = false;
export const ALLOW_TASK_CREATION = false;
export const REQUIRE_MANUAL_REVIEW = true;

// Input Paths
export const INPUT_GROUNDED_NOTES = 'outputs/knowledge_harvest/grounded_notes/';
export const INPUT_GROUNDED_SOURCE_PACKS = 'outputs/knowledge_harvest/grounded_source_packs/';
export const INPUT_NOTEBOOKLM_IDEAS = 'outputs/notebooklm_bridge/workflow_ideas/';
export const INPUT_KNOWLEDGE_HARVEST_IDEAS = 'outputs/knowledge_harvest/workflow_ideas/';

// Output Paths
export const OUTPUT_SCORING_REPORTS = 'outputs/knowledge_harvest/workflow_scoring/reports/';
export const OUTPUT_SCORING_RANKED = 'outputs/knowledge_harvest/workflow_scoring/ranked_ideas/';
export const OUTPUT_SCORING_LOGS = 'outputs/knowledge_harvest/workflow_scoring/logs/';
export const TEMPLATES_SCORING = 'templates/knowledge_harvest/workflow_scoring/';

// Categories mapping
export const SCORING_CATEGORIES = [
  'Brilliantaire OS fit',
  'Icyflamze relevance',
  'Tree Groove Records relevance',
  'revenue potential',
  'speed to implement',
  'difficulty',
  'risk',
  'reusability',
  'automation value',
  'audience value'
];

export const RECOMMENDATION_LABELS = [
  'build_now',
  'test_small',
  'study_more',
  'archive',
  'reject'
];
