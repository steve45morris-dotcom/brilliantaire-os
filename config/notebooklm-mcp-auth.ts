import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Authorization Validation Settings
export const AUTH_VALIDATION_ONLY = true;
export const ALLOW_OAUTH_FLOW = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_SECRET_PRINTING = false;
export const ALLOW_LIVE_MCP_EXECUTION = false;
export const REQUIRE_MANUAL_ENABLE = true;
export const REQUIRE_ENV_ONLY_SECRETS = true;

// Expected environment variables names (No values!)
export const expectedEnvNames = [
  "NOTEBOOKLM_MCP_ENABLED",
  "NOTEBOOKLM_MCP_SERVER_COMMAND",
  "NOTEBOOKLM_AUTH_PROFILE",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_PROJECT",
  "NOTEBOOKLM_WORKSPACE_ID"
];

// Candidate configuration paths to inspect
const homedir = os.homedir();

export const candidateConfigFiles = [
  { type: 'file', path: path.join(REPO_ROOT, '.env') },
  { type: 'file', path: path.join(REPO_ROOT, '.env.local') },
  { type: 'file', path: path.join(REPO_ROOT, '.mcp.json') },
  { type: 'file', path: path.join(REPO_ROOT, 'mcp.json') },
  { type: 'directory', path: path.join(homedir, '.config', 'mcp') },
  { type: 'file', path: path.join(homedir, '.cursor', 'mcp.json') },
  { type: 'file', path: path.join(homedir, '.claude', 'mcp.json') },
  { type: 'file', path: path.join(homedir, '.codex', 'mcp.json') },
  { type: 'file', path: path.join(homedir, '.agents', 'mcp.json') },
  { type: 'file', path: path.join(REPO_ROOT, 'package.json') },
  { type: 'file', path: path.join(REPO_ROOT, 'Taskfile.yml') }
];

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_auth'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_auth', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_auth', 'logs')
};
