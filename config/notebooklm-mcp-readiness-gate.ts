import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Readiness Gate Settings
export const READINESS_GATE_ONLY = true;
export const ALLOW_LIVE_MCP_EXECUTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_OAUTH_FLOW = false;
export const ALLOW_SECRET_PRINTING = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const REQUIRE_ENV_LOCAL_ONLY = true;
export const REQUIRE_MANUAL_REVIEW = true;
export const MINIMUM_LIVE_INTEGRATION_SCORE = 90;

// Expected environment variables names (No values!)
export const expectedEnvNames = [
  "NOTEBOOKLM_MCP_ENABLED",
  "NOTEBOOKLM_MCP_SERVER_COMMAND",
  "NOTEBOOKLM_AUTH_PROFILE",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_PROJECT",
  "NOTEBOOKLM_WORKSPACE_ID"
];

// Candidate local setup paths to inspect
const homedir = os.homedir();

export const candidateLocalFiles = [
  { type: 'file', name: '.env.local', path: path.join(REPO_ROOT, '.env.local') },
  { type: 'file', name: '.mcp.local.json', path: path.join(REPO_ROOT, '.mcp.local.json') },
  { type: 'directory', name: '~/.config/mcp/', path: path.join(homedir, '.config', 'mcp') },
  { type: 'file', name: '~/.claude/mcp.json', path: path.join(homedir, '.claude', 'mcp.json') },
  { type: 'file', name: '~/.codex/mcp.json', path: path.join(homedir, '.codex', 'mcp.json') },
  { type: 'file', name: '~/.agents/mcp.json', path: path.join(homedir, '.agents', 'mcp.json') }
];

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_readiness_gate'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_readiness_gate', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_readiness_gate', 'logs')
};
