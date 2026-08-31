import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const BRIDGE_MODE = "manual-first";
export const ALLOW_DIRECT_HIGGSFIELD_API = false;
export const ALLOW_AUTONOMOUS_RENDER = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;
export const REQUIRE_OBSIDIAN_STAGING = true;
export const REQUIRE_MANUAL_APPROVAL = true;
export const REQUIRE_RENDER_REVIEW = true;
export const MAX_PROMPT_LENGTH = 8000;
export const MAX_SCENE_DESCRIPTIONS = 24;

export const PROJECT_NAME = "Open Higgsfield AI";
export const TOOL_TYPE = "AI Video Generation";
export const INTEGRATION_TARGET = "ICYFLAMZE CORE";

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai'),
  renderRequests: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai', 'render_requests'),
  sceneDescriptions: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai', 'scene_descriptions'),
  storyboards: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai', 'storyboards'),
  approvedRenders: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai', 'approved_renders'),
  obsidianExports: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai', 'obsidian_exports'),
  narratorSync: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai', 'narrator_sync'),
  logs: path.join(REPO_ROOT, 'outputs', 'higgsfield_ai', 'logs')
};

export const supportedRenderTypes = [
  'character-animation',
  'scene-transition',
  'music-video-sequence',
  'trailer-clip',
  'lyric-visual',
  'cover-art-motion',
  'storyboard-preview'
];

export const approvedVisualStyles = [
  'anime cyber aesthetic',
  'street scholar futurism',
  'cyberpunk neon',
  'black and gold premium',
  'blue-gold flame',
  'chess symbolism',
  'city pressure realism'
];

export const icyflamzeCoreIntegrationPoints = [
  'episode-trailer-render',
  'ip-bible-visual-reference',
  'asset-queue-submission',
  'render-intake-handoff'
];

export { REPO_ROOT };
