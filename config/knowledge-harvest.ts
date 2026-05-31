import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

export const approvedCreators = [
  'Julian Goldie'
];

export const approvedTopics = [
  'AI automation',
  'AI agents',
  'YouTube growth',
  'SEO',
  'content systems',
  'prompt engineering',
  'workflow automation',
  'AI tools',
  'monetization',
  'Obsidian workflows',
  'NotebookLM workflows'
];

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest'),
  videoNotes: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'video_notes'),
  sourcePacks: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'source_packs'),
  workflowIdeas: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'workflow_ideas'),
  logs: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'logs')
};

export const maxTranscriptCharacters = 50000;
export const manualIntakeOnly = true;
export const allowChannelScan = false;
export const allowVideoDownload = false;
export const allowExternalApi = false;
