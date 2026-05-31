import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Boundaries
export const ALLOW_MCP_QUERY_EXECUTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const DETECTION_ONLY = true;
export const REQUIRE_MANUAL_ENABLE = true;

// Candidate MCP config locations to inspect
const homedir = os.homedir();

export const candidatePaths = [
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

// Candidate connector names to search for
export const candidateConnectorNames = [
  'notebooklm',
  'notebooklm-mcp',
  'notebooklm-server',
  'notebook-lm',
  'google-notebooklm'
];

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_detection'),
  reports: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_detection', 'reports'),
  logs: path.join(REPO_ROOT, 'outputs', 'notebooklm_bridge', 'mcp_detection', 'logs')
};
