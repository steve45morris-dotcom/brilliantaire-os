import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Constants & Configurations
export const LIVE_ADAPTER_AVAILABLE = true;
export const LIVE_EXECUTION_DEFAULT = false;
export const READ_ONLY_MODE = true;
export const ALLOW_NOTEBOOK_MODIFICATION = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const ALLOW_SOURCE_UPLOAD = false;
export const ALLOW_BACKGROUND_QUERIES = false;
export const REQUIRE_MANUAL_ENABLE = true;
export const REQUIRE_CONFIRM_FLAG = true;
export const REQUIRE_READINESS_SCORE = 100;
export const MAX_QUERY_LENGTH = 4000;
export const MAX_RESPONSE_LENGTH = 20000;

// Expected Environment Variable Names (Keys only!)
export const expectedEnvNames = [
  "NOTEBOOKLM_MCP_ENABLED",
  "NOTEBOOKLM_MCP_SERVER_COMMAND",
  "NOTEBOOKLM_AUTH_PROFILE",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_PROJECT",
  "NOTEBOOKLM_WORKSPACE_ID"
];

// Allowed Query Types
export const allowedQueryTypes = [
  "source-summary",
  "workflow-extraction",
  "weak-claims-review",
  "os-module-suggestions",
  "prompt-pack-ideas"
];

// Target Output Paths
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_adapter'),
  queries: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_adapter', 'queries'),
  responses: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_adapter', 'responses'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_adapter', 'logs'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_adapter', 'reports')
};
