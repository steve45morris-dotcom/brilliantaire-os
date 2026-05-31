import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Settings
export const SECRETS_STAGING_ONLY = true;
export const ALLOW_SECRET_PRINTING = false;
export const ALLOW_ENV_WRITE = false;
export const ALLOW_LIVE_MCP_EXECUTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_DOTENV_GITIGNORE = true;
export const REQUIRE_MANUAL_SIGNOFF = true;

// Environment variable names (Keys only, no values!)
export const expectedEnvNames = [
  "NOTEBOOKLM_MCP_ENABLED",
  "NOTEBOOKLM_MCP_SERVER_COMMAND",
  "NOTEBOOKLM_AUTH_PROFILE",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_PROJECT",
  "NOTEBOOKLM_WORKSPACE_ID"
];

// Target candidate files to inspect for secrets/redaction check
export const candidateFilesToCheck = [
  path.join(REPO_ROOT, '.gitignore'),
  path.join(REPO_ROOT, '.env.example'),
  path.join(REPO_ROOT, '.env.local.example'),
  path.join(REPO_ROOT, '.mcp.example.json'),
  path.join(REPO_ROOT, 'package.json'),
  path.join(REPO_ROOT, 'Taskfile.yml'),
  path.join(REPO_ROOT, 'COMMANDS.md')
];

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_secrets'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_secrets', 'reports'),
  checklists: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_secrets', 'checklists'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_secrets', 'logs')
};
