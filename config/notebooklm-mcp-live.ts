import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Constants & Configurations
export const LIVE_ADAPTER_MODE = "manual-enable";
export const ALLOW_LIVE_MCP_EXECUTION = true;
export const ALLOW_AUTONOMOUS_QUERY_EXECUTION = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const ALLOW_NOTEBOOK_MODIFICATION = false;
export const ALLOW_SOURCE_DELETION = false;
export const ALLOW_SECRET_PRINTING = false;
export const REQUIRE_ENV_LOCAL = true;
export const REQUIRE_READINESS_SCORE = 90;
export const REQUIRE_CONFIRM_FLAG = true;
export const REQUIRE_QUERY_TYPE_ALLOWLIST = true;
export const REQUIRE_RESPONSE_LOGGING = true;
export const REQUIRE_STAGED_OBSIDIAN_EXPORT = true;

// Allowed query types:
export const allowedQueryTypes = [
  "source-summary",
  "workflow-extraction",
  "weak-claims-review",
  "os-module-suggestions",
  "prompt-pack-ideas"
];

// Blocked modes:
export const blockedModes = [
  "create-notebook",
  "delete-notebook",
  "update-source",
  "delete-source",
  "write-obsidian",
  "execute-command",
  "browser-automation"
];

// Expected env names:
export const expectedEnvNames = [
  "NOTEBOOKLM_MCP_ENABLED",
  "NOTEBOOKLM_MCP_SERVER_COMMAND",
  "NOTEBOOKLM_AUTH_PROFILE",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_PROJECT",
  "NOTEBOOKLM_WORKSPACE_ID"
];

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp'),
  payloads: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp', 'payloads'),
  responses: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp', 'responses'),
  obsidian_staged_exports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp', 'obsidian_staged_exports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp', 'logs'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'live_mcp', 'reports'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'live_mcp')
};
