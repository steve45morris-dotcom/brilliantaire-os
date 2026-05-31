import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Hardening Layer Configuration Rules
export const HARDENING_ONLY = true;
export const ALLOW_REAL_SECRET_WRITES = false;
export const ALLOW_OAUTH_FLOW = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_LIVE_MCP_EXECUTION = false;
export const ALLOW_DIRECT_CONFIG_OVERWRITE = false;
export const REQUIRE_STAGED_CONFIG = true;
export const REQUIRE_MANUAL_COPY = true;

// Required env var names (for validation & reference scanning)
export const requiredEnvNames = [
  "NOTEBOOKLM_MCP_ENABLED",
  "NOTEBOOKLM_MCP_SERVER_COMMAND",
  "NOTEBOOKLM_AUTH_PROFILE",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_PROJECT",
  "NOTEBOOKLM_WORKSPACE_ID"
];

// Staged configuration output locations
export const STAGED_ENV_EXAMPLE_PATH = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_hardening', 'staged_config', 'notebooklm_mcp_env_example');
export const STAGED_MCP_CONFIG_PATH = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_hardening', 'staged_config', 'notebooklm_mcp_config_template');
export const HARDENING_REPORT_DIR = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_hardening', 'reports');
export const HARDENING_LOG_DIR = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_hardening', 'logs');
export const STAGED_CONFIG_DIR = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_hardening', 'staged_config');
export const HARDENING_ROOT_DIR = path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_hardening');
