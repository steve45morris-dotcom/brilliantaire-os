import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Execution boundaries
export const EXECUTION_MODE = "dry-run";
export const ALLOW_LIVE_MCP_EXECUTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_BROWSER_AUTOMATION = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const REQUIRE_MANUAL_ENABLE = true;
export const REQUIRE_CONFIRM_FLAG_FOR_LIVE = true;
export const MAX_QUERY_LENGTH = 4000;

// Export folders
export const MCP_PAYLOAD_DIR = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_execution', 'payloads');
export const MCP_DRY_RUN_DIR = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_execution', 'dry_runs');
export const MCP_EXECUTION_LOG_DIR = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_execution', 'logs');

// Export allowed query types
export const allowedQueryTypes = [
  "source-summary",
  "workflow-extraction",
  "weak-claims-review",
  "os-module-suggestions",
  "prompt-pack-ideas"
];
