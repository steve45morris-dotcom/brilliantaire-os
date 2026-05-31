import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const BRIDGE_MODE = "manual-first";
export const ALLOW_DIRECT_NOTEBOOKLM_API = false;
export const ALLOW_MCP_EXECUTION = false;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;
export const REQUIRE_OBSIDIAN_STAGING = true;
export const REQUIRE_MANUAL_APPROVAL = true;
export const MAX_ANSWER_LENGTH = 12000;

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge'),
  queries: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'queries'),
  manualAnswers: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'manual_answers'),
  obsidianExports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'obsidian_exports'),
  workflowIdeas: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'workflow_ideas'),
  sourcePacks: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'source_packs'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'logs')
};

export const approvedResearchDomains = [
  'AI automation',
  'AI agents',
  'SEO',
  'YouTube growth',
  'prompt engineering',
  'workflow automation',
  'content systems',
  'monetization',
  'Obsidian workflows',
  'NotebookLM workflows',
  'Brilliantaire OS architecture',
  'Icyflamze campaign systems',
  'Tree Groove Records operations'
];

export const defaultResearchQuestions = [
  'What are the main actionable ideas in these sources?',
  'What tools or workflows are repeated across the sources?',
  'Which ideas can improve Brilliantaire OS?',
  'Which ideas can improve Icyflamze or Tree Groove Records?',
  'What claims are weak, risky, or unsupported?',
  'What should be tested next?',
  'What prompt packs or OS modules could be built from this?'
];
export { REPO_ROOT };
