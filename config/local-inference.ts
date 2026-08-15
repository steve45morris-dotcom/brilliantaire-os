import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const BRIDGE_MODE = "manual-first";
export const ALLOW_LIVE_INFERENCE_CALLS = false;
export const ALLOW_AUTONOMOUS_INFERENCE = false;
export const ALLOW_EXTERNAL_MODEL_DOWNLOAD = false;
export const REQUIRE_MANUAL_PROMPT_REVIEW = true;
export const REQUIRE_RESPONSE_AUDIT = true;
export const MAX_PROMPT_LENGTH = 16000;
export const MAX_CONVERSATION_TURNS = 50;

export const PROJECT_NAME = "Local Inference Server";
export const TOOL_TYPE = "OpenAI-Compatible LLM Inference";
export const INTEGRATION_TARGET = "Claude Code";

export const SERVER_CONFIG = {
  baseUrl: 'http://localhost:20128',
  completionsEndpoint: '/v1/chat/completions',
  model: 'auto',
  requiresCredentials: false,
  protocol: 'openai-compatible'
};

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'local_inference'),
  chatRequests: path.join(REPO_ROOT, 'outputs', 'local_inference', 'chat_requests'),
  responses: path.join(REPO_ROOT, 'outputs', 'local_inference', 'responses'),
  promptStaging: path.join(REPO_ROOT, 'outputs', 'local_inference', 'prompt_staging'),
  obsidianExports: path.join(REPO_ROOT, 'outputs', 'local_inference', 'obsidian_exports'),
  logs: path.join(REPO_ROOT, 'outputs', 'local_inference', 'logs')
};

export const supportedModels = [
  'auto'
];

export const approvedUseCases = [
  'research-augmentation',
  'draft-composition',
  'code-review-assist',
  'knowledge-query',
  'narrator-draft-assist',
  'creative-brainstorm'
];

export const claudeCodeIntegrationPoints = [
  'mcp-server-tool',
  'prompt-engineer-assist',
  'narrator-draft-feed',
  'knowledge-harvest-augmentation'
];

export { REPO_ROOT };
